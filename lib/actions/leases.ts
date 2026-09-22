"use server";

import { revalidatePath } from "next/cache";
import { EscrowPurpose, EscrowStatus, LeaseStatus } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

  const parsed = leaseSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid lease" };

  const property = await prisma.property.findUnique({ where: { id: parsed.data.propertyId } });
  if (!property) return { error: "Property not found" };
  if (property.type !== "FOR_RENT") return { error: "Only rental properties can be leased" };

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

export async function activateLeaseWithEscrow(leaseId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const lease = await prisma.lease.findUnique({ where: { id: leaseId } });
  if (!lease || lease.renterId !== session.user.id) return { error: "Lease not found" };
  if (lease.status !== LeaseStatus.DRAFT) return { error: "Lease is not a draft" };

  await prisma.$transaction([
    prisma.lease.update({
      where: { id: leaseId },
      data: { status: LeaseStatus.ACTIVE },
    }),
    prisma.escrowPayment.create({
      data: {
        amount: lease.monthlyRent,
        status: EscrowStatus.HELD,
        purpose: EscrowPurpose.RENT,
        payerId: session.user.id,
        leaseId,
        note: "Monthly rent held in escrow",
      },
    }),
  ]);

  revalidatePath("/dashboard/leases");
  revalidatePath("/dashboard");
  return { success: true };
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
