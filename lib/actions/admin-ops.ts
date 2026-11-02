"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { getAdminSessionOrNull } from "@/lib/auth/admin";
import { writeAdminAudit } from "@/lib/admin/audit";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  return getAdminSessionOrNull();
}

const ESCROW_STATUSES = ["PENDING", "HELD", "RELEASED", "REFUNDED"] as const;
const ESCROW_PURPOSES = ["RENT", "ARTISAN", "MOVE_IN"] as const;
const BOOKING_STATUSES = ["PENDING", "APPROVED", "CANCELLED"] as const;
const BOOKING_KINDS = ["TOUR", "PURCHASE_INTEREST"] as const;
const LEASE_STATUSES = ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"] as const;

function pick<T extends string>(values: readonly T[], v?: string): T | undefined {
  const up = v?.toUpperCase();
  return up && (values as readonly string[]).includes(up) ? (up as T) : undefined;
}

/* ───────────────────────── Escrow ───────────────────────── */

export async function listAdminEscrow(opts?: { status?: string; purpose?: string; q?: string }) {
  const session = await requireAdmin();
  if (!session) return { payments: [], totals: { held: 0, released: 0, refunded: 0, pending: 0 } };

  const status = pick(ESCROW_STATUSES, opts?.status);
  const purpose = pick(ESCROW_PURPOSES, opts?.purpose);
  const q = opts?.q?.trim();

  const where: Prisma.EscrowPaymentWhereInput = {
    ...(status ? { status } : {}),
    ...(purpose ? { purpose } : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q, mode: "insensitive" } },
            { providerRef: { contains: q, mode: "insensitive" } },
            { note: { contains: q, mode: "insensitive" } },
            { payer: { email: { contains: q, mode: "insensitive" } } },
            { payer: { name: { contains: q, mode: "insensitive" } } },
            { lease: { property: { title: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  const [payments, grouped] = await Promise.all([
    prisma.escrowPayment.findMany({
      where,
      include: {
        payer: { select: { id: true, name: true, email: true } },
        lease: {
          select: {
            id: true,
            property: { select: { id: true, title: true } },
            landlord: { select: { id: true, name: true, email: true } },
          },
        },
        serviceJob: {
          select: {
            id: true,
            status: true,
            artisan: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.escrowPayment.groupBy({ by: ["status"], _sum: { amount: true } }),
  ]);

  const sum = (s: string) => grouped.find((g) => g.status === s)?._sum.amount ?? 0;
  return {
    payments,
    totals: {
      held: sum("HELD"),
      released: sum("RELEASED"),
      refunded: sum("REFUNDED"),
      pending: sum("PENDING"),
    },
  };
}

export type AdminEscrowRow = Awaited<ReturnType<typeof listAdminEscrow>>["payments"][number];

/* ───────────────────────── Tour / purchase-interest bookings ───────────────────────── */

export async function listAdminBookings(opts?: { status?: string; kind?: string; q?: string }) {
  const session = await requireAdmin();
  if (!session) return { bookings: [], counts: { PENDING: 0, APPROVED: 0, CANCELLED: 0 } };

  const status = pick(BOOKING_STATUSES, opts?.status);
  const kind = pick(BOOKING_KINDS, opts?.kind);
  const q = opts?.q?.trim();

  const [bookings, grouped] = await Promise.all([
    prisma.booking.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(kind ? { kind } : {}),
        ...(q
          ? {
              OR: [
                { id: { contains: q, mode: "insensitive" as const } },
                { property: { title: { contains: q, mode: "insensitive" as const } } },
                { user: { email: { contains: q, mode: "insensitive" as const } } },
                { user: { name: { contains: q, mode: "insensitive" as const } } },
              ],
            }
          : {}),
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            location: true,
            owner: { select: { id: true, name: true, email: true } },
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const count = (s: string) => grouped.find((g) => g.status === s)?._count._all ?? 0;
  return {
    bookings,
    counts: { PENDING: count("PENDING"), APPROVED: count("APPROVED"), CANCELLED: count("CANCELLED") },
  };
}

export type AdminBookingRow = Awaited<ReturnType<typeof listAdminBookings>>["bookings"][number];

/** Admin approve/cancel of a property tour or purchase-interest booking. */
export async function adminUpdateBookingStatus(bookingId: string, status: "APPROVED" | "CANCELLED") {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };
  if (status !== "APPROVED" && status !== "CANCELLED") return { error: "Invalid status" };

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { error: "Booking not found" };
  if (booking.status === status) return { success: true as const };

  await prisma.booking.update({ where: { id: bookingId }, data: { status } });
  await writeAdminAudit({
    actorId: session.user.id,
    action: `BOOKING_${status}`,
    entity: "Booking",
    entityId: bookingId,
    meta: { from: booking.status, propertyId: booking.propertyId, userId: booking.userId },
  });

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/properties/${booking.propertyId}`);
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");
  return { success: true as const };
}

/* ───────────────────────── Leases ───────────────────────── */

export async function listAdminLeases(opts?: { status?: string; q?: string }) {
  const session = await requireAdmin();
  if (!session) return { leases: [], counts: { DRAFT: 0, ACTIVE: 0, COMPLETED: 0, CANCELLED: 0 } };

  const status = pick(LEASE_STATUSES, opts?.status);
  const q = opts?.q?.trim();

  const [leases, grouped] = await Promise.all([
    prisma.lease.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { id: { contains: q, mode: "insensitive" as const } },
                { property: { title: { contains: q, mode: "insensitive" as const } } },
                { renter: { email: { contains: q, mode: "insensitive" as const } } },
                { renter: { name: { contains: q, mode: "insensitive" as const } } },
                { landlord: { email: { contains: q, mode: "insensitive" as const } } },
                { landlord: { name: { contains: q, mode: "insensitive" as const } } },
              ],
            }
          : {}),
      },
      include: {
        property: { select: { id: true, title: true, location: true } },
        renter: { select: { id: true, name: true, email: true } },
        landlord: { select: { id: true, name: true, email: true } },
        escrowPayments: { select: { id: true, status: true, amount: true, purpose: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.lease.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const count = (s: string) => grouped.find((g) => g.status === s)?._count._all ?? 0;
  return {
    leases: leases.map((l) => {
      const sumBy = (s: string) =>
        l.escrowPayments.filter((e) => e.status === s).reduce((acc, e) => acc + e.amount, 0);
      return {
        ...l,
        escrow: {
          held: sumBy("HELD"),
          released: sumBy("RELEASED"),
          refunded: sumBy("REFUNDED"),
          pending: sumBy("PENDING"),
          count: l.escrowPayments.length,
        },
      };
    }),
    counts: {
      DRAFT: count("DRAFT"),
      ACTIVE: count("ACTIVE"),
      COMPLETED: count("COMPLETED"),
      CANCELLED: count("CANCELLED"),
    },
  };
}

export type AdminLeaseRow = Awaited<ReturnType<typeof listAdminLeases>>["leases"][number];
