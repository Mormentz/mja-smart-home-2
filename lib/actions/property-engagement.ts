"use server";

import { BookingStatus, EscrowStatus, LeaseStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type PropertyEngagement = {
  booking: null | {
    id: string;
    status: BookingStatus;
    kind: string;
    preferredDate: Date;
  };
  lease: null | {
    id: string;
    status: LeaseStatus;
    monthlyRent: number;
  };
  escrow: null | {
    id: string;
    status: EscrowStatus;
    amount: number;
    providerRef: string | null;
  };
};

export async function getPropertyEngagement(propertyId: string): Promise<PropertyEngagement> {
  const empty: PropertyEngagement = { booking: null, lease: null, escrow: null };
  const session = await auth();
  if (!session?.user?.id) return empty;

  const [booking, lease] = await Promise.all([
    prisma.booking.findFirst({
      where: {
        propertyId,
        userId: session.user.id,
        status: { in: [BookingStatus.PENDING, BookingStatus.APPROVED] },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, status: true, kind: true, preferredDate: true },
    }),
    prisma.lease.findFirst({
      where: {
        propertyId,
        renterId: session.user.id,
        status: { in: [LeaseStatus.DRAFT, LeaseStatus.ACTIVE] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        escrowPayments: {
          where: {
            purpose: "RENT",
            status: { in: [EscrowStatus.HELD, EscrowStatus.PENDING] },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
  ]);

  const escrowRow =
    lease?.escrowPayments.find((e) => e.status === EscrowStatus.HELD) ??
    lease?.escrowPayments.find((e) => e.status === EscrowStatus.PENDING) ??
    null;

  return {
    booking: booking
      ? {
          id: booking.id,
          status: booking.status,
          kind: booking.kind,
          preferredDate: booking.preferredDate,
        }
      : null,
    lease: lease
      ? {
          id: lease.id,
          status: lease.status,
          monthlyRent: lease.monthlyRent,
        }
      : null,
    escrow: escrowRow
      ? {
          id: escrowRow.id,
          status: escrowRow.status,
          amount: escrowRow.amount,
          providerRef: escrowRow.providerRef,
        }
      : null,
  };
}
