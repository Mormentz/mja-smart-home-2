"use server";

import { revalidatePath } from "next/cache";
import { EscrowStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function releaseEscrow(paymentId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const payment = await prisma.escrowPayment.findUnique({
    where: { id: paymentId },
    include: { lease: true, serviceJob: true },
  });
  if (!payment || payment.status !== EscrowStatus.HELD) {
    return { error: "Payment not found or not held" };
  }

  const isLandlord =
    payment.lease && payment.lease.landlordId === session.user.id;
  const isArtisan =
    payment.serviceJob && payment.serviceJob.artisanId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isLandlord && !isArtisan && !isAdmin) {
    return { error: "Not allowed to release this escrow" };
  }

  await prisma.escrowPayment.update({
    where: { id: paymentId },
    data: { status: EscrowStatus.RELEASED, releasedAt: new Date() },
  });

  revalidatePath("/dashboard/leases");
  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function refundEscrow(paymentId: string) {
  const session = await auth();
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
    session.user.role === "ADMIN" ||
    (payment.lease && payment.lease.landlordId === session.user.id);

  if (!canRefund) return { error: "Not allowed to refund this escrow" };

  await prisma.escrowPayment.update({
    where: { id: paymentId },
    data: { status: EscrowStatus.REFUNDED, refundedAt: new Date() },
  });

  revalidatePath("/dashboard/leases");
  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getEscrowForUser() {
  const session = await auth();
  if (!session?.user?.id) return [];

  if (["LANDLORD", "AGENT"].includes(session.user.role)) {
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
