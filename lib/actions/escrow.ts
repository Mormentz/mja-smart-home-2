"use server";

import { revalidatePath } from "next/cache";
import { EscrowStatus } from "@prisma/client";
import { auth } from "@/auth";
import { getAdminSessionOrNull } from "@/lib/auth/admin";
import { writeAdminAudit } from "@/lib/admin/audit";
import { prisma } from "@/lib/prisma";
import { refundPaymentHold, releasePaymentHold } from "@/lib/payments/provider";

/** Admin (hc-admin cookie) takes precedence, then the regular user session. */
async function getEscrowActor() {
  const adminSession = await getAdminSessionOrNull();
  if (adminSession) return { session: adminSession, viaAdmin: true as const };
  const session = await auth();
  return { session, viaAdmin: false as const };
}

/** Admin/artisan may still force-release non-rent escrow. Rent uses dual confirmation. */
export async function releaseEscrow(paymentId: string) {
  const { session, viaAdmin } = await getEscrowActor();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const payment = await prisma.escrowPayment.findUnique({
    where: { id: paymentId },
    include: { lease: true, serviceJob: true },
  });
  if (!payment || payment.status !== EscrowStatus.HELD) {
    return { error: "Payment not found or not held" };
  }

  if (payment.purpose === "RENT" && payment.leaseId && !viaAdmin) {
    return {
      error: "Rent escrow releases after agent handover and customer receipt confirmation.",
    };
  }

  const isLandlord =
    payment.lease && payment.lease.landlordId === session.user.id;
  const isArtisan =
    payment.serviceJob && payment.serviceJob.artisanId === session.user.id;
  const isAdmin = viaAdmin || session.user.role === "ADMIN";

  if (!isLandlord && !isArtisan && !isAdmin) {
    return { error: "Not allowed to release this escrow" };
  }

  if (payment.providerRef) {
    await releasePaymentHold(payment.providerRef);
  }

  await prisma.escrowPayment.update({
    where: { id: paymentId },
    data: { status: EscrowStatus.RELEASED, releasedAt: new Date() },
  });
  if (viaAdmin) {
    await writeAdminAudit({
      actorId: session.user.id,
      action: "ESCROW_RELEASED",
      entity: "EscrowPayment",
      entityId: paymentId,
      meta: { amount: payment.amount },
    });
    revalidatePath("/admin/escrow");
    revalidatePath("/admin/leases");
  }

  revalidatePath("/dashboard/leases");
  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard");
  return { success: true };
}

async function finalizeRentEscrowIfReady(paymentId: string) {
  const payment = await prisma.escrowPayment.findUnique({
    where: { id: paymentId },
    include: { lease: true },
  });
  if (
    !payment ||
    payment.status !== EscrowStatus.HELD ||
    payment.purpose !== "RENT" ||
    !payment.agentHandedOverAt ||
    !payment.customerReceivedAt ||
    !payment.lease
  ) {
    return { pending: true as const };
  }

  if (payment.providerRef) {
    await releasePaymentHold(payment.providerRef);
  }

  await prisma.escrowPayment.update({
    where: { id: paymentId },
    data: { status: EscrowStatus.RELEASED, releasedAt: new Date() },
  });

  const { creditWalletFromEscrow } = await import("@/lib/actions/wallet");
  await creditWalletFromEscrow({
    agentUserId: payment.lease.landlordId,
    amount: payment.amount,
    escrowPaymentId: payment.id,
  });

  revalidatePath("/dashboard/leases");
  revalidatePath("/dashboard/wallet");
  revalidatePath("/admin/escrow");
  return { success: true as const, released: true as const };
}

/** Agent marks that the customer has received the house / keys handed over. */
export async function markEscrowHandedOver(paymentId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const { kycGateError, requireProTier3 } = await import("@/lib/auth/kyc-gate");
  const kyc = await requireProTier3(session.user.id);
  if (!kyc.ok) return kycGateError(kyc);

  const payment = await prisma.escrowPayment.findUnique({
    where: { id: paymentId },
    include: { lease: true },
  });
  if (!payment || payment.status !== EscrowStatus.HELD || payment.purpose !== "RENT") {
    return { error: "Held rent escrow not found" };
  }
  if (!payment.lease || payment.lease.landlordId !== session.user.id) {
    return { error: "Only the listing agent can mark handover" };
  }
  if (payment.agentHandedOverAt) {
    return { success: true, alreadyMarked: true as const };
  }

  await prisma.escrowPayment.update({
    where: { id: paymentId },
    data: {
      agentHandedOverAt: new Date(),
      agentHandedOverById: session.user.id,
    },
  });

  const final = await finalizeRentEscrowIfReady(paymentId);
  revalidatePath("/dashboard/leases");
  return { success: true, ...final };
}

/** Renter confirms they received the house. */
export async function confirmEscrowReceived(paymentId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const payment = await prisma.escrowPayment.findUnique({
    where: { id: paymentId },
    include: { lease: true },
  });
  if (!payment || payment.status !== EscrowStatus.HELD || payment.purpose !== "RENT") {
    return { error: "Held rent escrow not found" };
  }
  if (!payment.lease || payment.lease.renterId !== session.user.id) {
    return { error: "Only the renter can confirm receipt" };
  }
  if (payment.customerReceivedAt) {
    return { success: true, alreadyMarked: true as const };
  }

  await prisma.escrowPayment.update({
    where: { id: paymentId },
    data: {
      customerReceivedAt: new Date(),
      customerReceivedById: session.user.id,
    },
  });

  const final = await finalizeRentEscrowIfReady(paymentId);
  revalidatePath("/dashboard/leases");
  return { success: true, ...final };
}

export async function refundEscrow(paymentId: string) {
  const { session, viaAdmin } = await getEscrowActor();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const payment = await prisma.escrowPayment.findUnique({
    where: { id: paymentId },
    include: { lease: true, serviceJob: true },
  });
  if (!payment || payment.status !== EscrowStatus.HELD) {
    return { error: "Payment not found or not held" };
  }

  const canRefund =
    payment.payerId === session.user.id ||
    viaAdmin ||
    session.user.role === "ADMIN" ||
    (payment.lease && payment.lease.landlordId === session.user.id);

  if (!canRefund) return { error: "Not allowed to refund this escrow" };

  if (payment.providerRef) {
    const refund = await refundPaymentHold(payment.providerRef, payment.amount);
    if (refund.status === "FAILED") {
      return { error: refund.message || "Paystack refund failed" };
    }
  }

  await prisma.escrowPayment.update({
    where: { id: paymentId },
    data: { status: EscrowStatus.REFUNDED, refundedAt: new Date() },
  });
  if (viaAdmin) {
    await writeAdminAudit({
      actorId: session.user.id,
      action: "ESCROW_REFUNDED",
      entity: "EscrowPayment",
      entityId: paymentId,
      meta: { amount: payment.amount },
    });
    revalidatePath("/admin/escrow");
    revalidatePath("/admin/leases");
  }

  revalidatePath("/dashboard/leases");
  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getEscrowForUser() {
  const session = await auth();
  if (!session?.user?.id) return [];

  if (["AGENT"].includes(session.user.role)) {
    return prisma.escrowPayment.findMany({
      where: {
        OR: [
          { lease: { landlordId: session.user.id } },
          { serviceJob: { property: { ownerId: session.user.id } } },
        ],
      },
      include: {
        lease: { include: { property: true } },
        serviceJob: true,
        payer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  if (session.user.role === "ARTISAN") {
    return prisma.escrowPayment.findMany({
      where: { serviceJob: { artisanId: session.user.id } },
      include: {
        serviceJob: true,
        payer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return prisma.escrowPayment.findMany({
    where: { payerId: session.user.id },
    include: {
      lease: { include: { property: true } },
      serviceJob: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
