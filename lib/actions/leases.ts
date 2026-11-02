"use server";

import { revalidatePath } from "next/cache";
import { EscrowPurpose, EscrowStatus, LeaseStatus } from "@/generated/prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { appBaseUrl } from "@/lib/email/smtp";
import { createPaymentHold, verifyPayment } from "@/lib/payments/provider";

const leaseSchema = z.object({
  propertyId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  monthlyRent: z.coerce.number().int().positive(),
});

export async function createLeaseDraft(data: z.infer<typeof leaseSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (session.user.role !== "USER") return { error: "Only users can start a lease" };

  const { kycGateError, requireUserTier1 } = await import("@/lib/auth/kyc-gate");
  const kyc = await requireUserTier1(session.user.id);
  if (!kyc.ok) return kycGateError(kyc);

  const parsed = leaseSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid lease" };

  const property = await prisma.property.findUnique({ where: { id: parsed.data.propertyId } });
  if (!property) return { error: "Property not found" };
  if (property.type !== "FOR_RENT") return { error: "Only rental properties can be leased" };

  const existingActive = await prisma.lease.findFirst({
    where: {
      propertyId: property.id,
      renterId: session.user.id,
      status: { in: [LeaseStatus.ACTIVE, LeaseStatus.DRAFT] },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existingActive?.status === LeaseStatus.ACTIVE) {
    return { error: "You already have an active lease on this property", leaseId: existingActive.id };
  }
  if (existingActive?.status === LeaseStatus.DRAFT) {
    return { success: true, leaseId: existingActive.id };
  }

  const startDate = new Date(parsed.data.startDate);
  const endDate = new Date(parsed.data.endDate);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
    return { error: "Invalid lease dates" };
  }

  const lease = await prisma.lease.create({
    data: {
      propertyId: property.id,
      renterId: session.user.id,
      landlordId: property.ownerId,
      startDate,
      endDate,
      monthlyRent: parsed.data.monthlyRent,
      status: LeaseStatus.DRAFT,
    },
  });

  revalidatePath("/dashboard/leases");
  return { success: true, leaseId: lease.id };
}

/** Start or resume Paystack checkout to fund first-month rent escrow. */
export async function activateLeaseWithEscrow(leaseId: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return { error: "Unauthorized" };

  const { kycGateError, requireUserTier1 } = await import("@/lib/auth/kyc-gate");
  const kyc = await requireUserTier1(session.user.id);
  if (!kyc.ok) return kycGateError(kyc);

  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
    include: {
      property: { select: { id: true, title: true } },
      escrowPayments: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  if (!lease || lease.renterId !== session.user.id) return { error: "Lease not found" };

  const held = lease.escrowPayments.find((e) => e.status === EscrowStatus.HELD && e.purpose === EscrowPurpose.RENT);
  if (lease.status === LeaseStatus.ACTIVE && held) {
    return { error: "Rent escrow already secured for this lease", alreadyFunded: true as const };
  }
  if (lease.status !== LeaseStatus.DRAFT && lease.status !== LeaseStatus.ACTIVE) {
    return { error: "Lease cannot be funded in its current state" };
  }

  let escrow = lease.escrowPayments.find(
    (e) => e.status === EscrowStatus.PENDING && e.purpose === EscrowPurpose.RENT,
  );

  if (!escrow) {
    escrow = await prisma.escrowPayment.create({
      data: {
        amount: lease.monthlyRent,
        status: EscrowStatus.PENDING,
        purpose: EscrowPurpose.RENT,
        payerId: session.user.id,
        leaseId,
        note: "First month rent escrow via Paystack",
        provider: "paystack",
      },
    });
  }

  // New reference on every initialize — Paystack rejects duplicate refs after an abandoned attempt.
  const reference = `hc_rent_${escrow.id}_${Date.now()}`;
  const callbackUrl = `${appBaseUrl()}/api/payments/paystack/callback?leaseId=${encodeURIComponent(leaseId)}`;

  const payment = await createPaymentHold({
    amount: lease.monthlyRent,
    reference,
    email: session.user.email,
    callbackUrl,
    metadata: {
      leaseId,
      escrowId: escrow.id,
      propertyId: lease.propertyId,
      purpose: "RENT",
    },
  });

  if (payment.status === "FAILED" || !payment.authorizationUrl) {
    return { error: payment.message || "Could not start Paystack checkout" };
  }

  await prisma.escrowPayment.update({
    where: { id: escrow.id },
    data: {
      provider: "paystack",
      providerRef: payment.reference,
      accessCode: payment.accessCode ?? null,
      status: EscrowStatus.PENDING,
    },
  });

  revalidatePath("/dashboard/leases");
  return {
    success: true as const,
    authorizationUrl: payment.authorizationUrl,
    reference: payment.reference,
    escrowId: escrow.id,
  };
}

/** Confirm Paystack payment and activate lease + hold escrow. */
export async function confirmEscrowPayment(reference: string) {
  const verified = await verifyPayment(reference);
  if (verified.status !== "HELD") {
    return { error: verified.message || "Payment not completed", status: verified.status };
  }

  const escrow = await prisma.escrowPayment.findFirst({
    where: { providerRef: reference },
    include: { lease: true },
  });
  if (!escrow) return { error: "Escrow record not found for this payment" };

  if (escrow.status === EscrowStatus.HELD) {
    return { success: true as const, alreadyProcessed: true as const, leaseId: escrow.leaseId };
  }

  if (verified.amount != null && Math.round(verified.amount) !== escrow.amount) {
    return { error: "Paid amount does not match escrow amount" };
  }

  await prisma.$transaction([
    prisma.escrowPayment.update({
      where: { id: escrow.id },
      data: {
        status: EscrowStatus.HELD,
        paidAt: verified.paidAt ? new Date(verified.paidAt) : new Date(),
        note: escrow.note ?? "Monthly rent held in escrow",
      },
    }),
    ...(escrow.leaseId
      ? [
          prisma.lease.update({
            where: { id: escrow.leaseId },
            data: { status: LeaseStatus.ACTIVE },
          }),
        ]
      : []),
  ]);

  revalidatePath("/dashboard/leases");
  revalidatePath("/dashboard");
  if (escrow.lease?.propertyId) {
    revalidatePath(`/properties/${escrow.lease.propertyId}`);
  }

  return { success: true as const, leaseId: escrow.leaseId };
}

export async function getRenterLeases() {
  const session = await auth();
  if (!session?.user?.id) return [];
  return prisma.lease.findMany({
    where: { renterId: session.user.id },
    include: {
      property: true,
      landlord: { select: { id: true, name: true, email: true } },
      escrowPayments: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getLandlordLeases() {
  const session = await auth();
  if (!session?.user?.id) return [];
  return prisma.lease.findMany({
    where: { landlordId: session.user.id },
    include: {
      property: true,
      renter: { select: { id: true, name: true, email: true } },
      escrowPayments: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}
