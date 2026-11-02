"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { getAdminSessionOrNull } from "@/lib/auth/admin";
import { writeAdminAudit } from "@/lib/admin/audit";
import { prisma } from "@/lib/prisma";
import { resolveAdminNotificationsForEntity } from "@/lib/actions/admin-notifications";

async function requireAdmin() {
  return getAdminSessionOrNull();
}

export type AdminRentalsTab = "pending" | "listings" | "bookings" | "owners" | "disputes";

const LISTING_STATUSES = ["DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"] as const;
const BOOKING_STATUSES = [
  "REQUESTED",
  "ACCEPTED",
  "PAYMENT_PENDING",
  "CONFIRMED",
  "HANDOVER",
  "ACTIVE",
  "RETURN_PENDING",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
] as const;
const DISPUTE_STATUSES = ["OPEN", "UNDER_REVIEW", "RESOLVED", "CLOSED"] as const;
const OWNER_STATUSES = ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"] as const;

type ListingStatus = (typeof LISTING_STATUSES)[number];
type BookingStatus = (typeof BOOKING_STATUSES)[number];
type DisputeStatus = (typeof DISPUTE_STATUSES)[number];
type OwnerStatus = (typeof OWNER_STATUSES)[number];

function pick<T extends string>(values: readonly T[], v?: string): T | undefined {
  const up = v?.toUpperCase();
  return up && (values as readonly string[]).includes(up) ? (up as T) : undefined;
}

const OVERDUE_STATUSES: BookingStatus[] = ["ACTIVE", "RETURN_PENDING"];
const ACTIVE_STATUSES: BookingStatus[] = ["CONFIRMED", "HANDOVER", "ACTIVE", "RETURN_PENDING"];

const bookingInclude = {
  listing: {
    select: {
      id: true,
      hcId: true,
      name: true,
      owner: { select: { id: true, hcId: true, fullName: true, businessName: true } },
    },
  },
  customerUser: { select: { id: true, name: true, email: true } },
  customerProfile: { select: { id: true, hcId: true, fullName: true } },
  _count: { select: { disputes: true } },
} satisfies Prisma.EquipmentRentalBookingInclude;

/**
 * Data for the admin rentals board. Tab-specific lists are always loaded
 * (cheap, capped) so counts and summary cards stay accurate.
 */
export async function getAdminRentalsBoard(opts?: { q?: string; status?: string }) {
  const session = await requireAdmin();
  if (!session) return null;
  return loadBoard(opts);
}

async function loadBoard(opts?: { q?: string; status?: string }) {
  const q = opts?.q?.trim();
  const now = new Date();

  const listingStatus = pick<ListingStatus>(LISTING_STATUSES, opts?.status);
  const bookingStatus = pick<BookingStatus>(BOOKING_STATUSES, opts?.status);
  const ownerStatus = pick<OwnerStatus>(OWNER_STATUSES, opts?.status);
  const disputeStatus = pick<DisputeStatus>(DISPUTE_STATUSES, opts?.status);
  const wantsOverdue = opts?.status?.toLowerCase() === "overdue";

  const listingWhere: Prisma.EquipmentListingWhereInput = {
    ...(listingStatus ? { status: listingStatus } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { hcId: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const bookingWhere: Prisma.EquipmentRentalBookingWhereInput = {
    ...(bookingStatus ? { status: bookingStatus } : {}),
    ...(wantsOverdue ? { status: { in: OVERDUE_STATUSES }, endDate: { lt: now } } : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q, mode: "insensitive" } },
            { listing: { name: { contains: q, mode: "insensitive" } } },
            { listing: { hcId: { contains: q, mode: "insensitive" } } },
            { customerUser: { email: { contains: q, mode: "insensitive" } } },
            { customerUser: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const ownerWhere: Prisma.EquipmentOwnerProfileWhereInput = {
    ...(ownerStatus ? { identityStatus: ownerStatus } : {}),
    ...(q
      ? {
          OR: [
            { hcId: { contains: q, mode: "insensitive" } },
            { fullName: { contains: q, mode: "insensitive" } },
            { businessName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { user: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const disputeWhere: Prisma.RentalDisputeWhereInput = {
    ...(disputeStatus ? { status: disputeStatus } : {}),
    ...(q
      ? {
          OR: [
            { description: { contains: q, mode: "insensitive" } },
            { booking: { listing: { name: { contains: q, mode: "insensitive" } } } },
            { openedBy: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [
    pendingListings,
    pendingOwners,
    listings,
    bookings,
    activeBookings,
    overdueBookings,
    owners,
    disputes,
    totalListings,
    totalBookings,
    totalOwners,
    openDisputes,
  ] = await Promise.all([
    prisma.equipmentListing.findMany({
      where: { status: "PENDING_REVIEW" },
      include: { owner: { select: { id: true, hcId: true, fullName: true, businessName: true, identityStatus: true } } },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.equipmentOwnerProfile.findMany({
      where: { identityStatus: "PENDING" },
      include: { user: { select: { id: true, name: true, email: true } }, _count: { select: { listings: true } } },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.equipmentListing.findMany({
      where: listingWhere,
      include: { owner: { select: { id: true, hcId: true, fullName: true, businessName: true, identityStatus: true } }, _count: { select: { bookings: true } } },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.equipmentRentalBooking.findMany({
      where: bookingWhere,
      include: bookingInclude,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.equipmentRentalBooking.findMany({
      where: { status: { in: ACTIVE_STATUSES } },
      include: bookingInclude,
      orderBy: { endDate: "asc" },
      take: 50,
    }),
    prisma.equipmentRentalBooking.findMany({
      where: { status: { in: OVERDUE_STATUSES }, endDate: { lt: now } },
      include: bookingInclude,
      orderBy: { endDate: "asc" },
      take: 50,
    }),
    prisma.equipmentOwnerProfile.findMany({
      where: ownerWhere,
      include: { user: { select: { id: true, name: true, email: true } }, _count: { select: { listings: true } } },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.rentalDispute.findMany({
      where: disputeWhere,
      include: {
        openedBy: { select: { id: true, name: true, email: true } },
        booking: { select: { id: true, status: true, listing: { select: { id: true, name: true, hcId: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.equipmentListing.count(),
    prisma.equipmentRentalBooking.count(),
    prisma.equipmentOwnerProfile.count(),
    prisma.rentalDispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
  ]);

  return {
    generatedAt: now.getTime(),
    counts: {
      pendingListings: pendingListings.length,
      pendingOwners: pendingOwners.length,
      activeBookings: activeBookings.length,
      overdueBookings: overdueBookings.length,
      openDisputes,
      totalListings,
      totalBookings,
      totalOwners,
    },
    pendingListings,
    pendingOwners,
    listings,
    bookings,
    activeBookings,
    overdueBookings,
    owners,
    disputes,
  };
}

export type AdminRentalsBoard = Awaited<ReturnType<typeof loadBoard>>;

export async function getAdminListingDetail(id: string) {
  const session = await requireAdmin();
  if (!session) return null;

  const listing = await prisma.equipmentListing.findUnique({
    where: { id },
    include: {
      owner: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
      bookings: {
        include: {
          customerUser: { select: { id: true, name: true, email: true } },
          _count: { select: { disputes: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      availability: { orderBy: { date: "asc" }, take: 60 },
    },
  });
  if (!listing) return null;

  const activity = await prisma.auditLog.findMany({
    where: { entity: "EquipmentListing", entityId: id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return { listing, activity };
}

export async function getAdminBookingDetail(id: string) {
  const session = await requireAdmin();
  if (!session) return null;

  const booking = await prisma.equipmentRentalBooking.findUnique({
    where: { id },
    include: {
      listing: {
        include: {
          owner: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
        },
      },
      customerUser: { select: { id: true, name: true, email: true, phone: true } },
      customerProfile: true,
      reminders: { orderBy: { sentAt: "desc" }, take: 20 },
      disputes: {
        include: { openedBy: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!booking) return null;

  const activity = await prisma.auditLog.findMany({
    where: { entity: "EquipmentRentalBooking", entityId: id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const overdue =
    OVERDUE_STATUSES.includes(booking.status) && booking.endDate.getTime() < Date.now();
  return { booking, activity, overdue };
}

export async function getAdminDisputeDetail(id: string) {
  const session = await requireAdmin();
  if (!session) return null;

  const dispute = await prisma.rentalDispute.findUnique({
    where: { id },
    include: {
      openedBy: { select: { id: true, name: true, email: true, phone: true } },
      booking: {
        include: {
          listing: { include: { owner: { include: { user: { select: { id: true, name: true, email: true } } } } } },
          customerUser: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
    },
  });
  if (!dispute) return null;

  const activity = await prisma.auditLog.findMany({
    where: { entity: "RentalDispute", entityId: id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return { dispute, activity };
}

const resolveSchema = z.object({
  status: z.enum(["RESOLVED", "CLOSED"]),
  resolution: z.string().trim().min(3, "Resolution notes are required").max(4000),
  bookingStatus: z.enum(["COMPLETED", "CANCELLED", "ACTIVE", "RETURN_PENDING"]).optional(),
});

export async function resolveRentalDispute(
  id: string,
  data: {
    status: "RESOLVED" | "CLOSED";
    resolution: string;
    /** Optionally move the underlying booking out of DISPUTED. */
    bookingStatus?: "COMPLETED" | "CANCELLED" | "ACTIVE" | "RETURN_PENDING";
  },
) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };
  const parsed = resolveSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const dispute = await prisma.rentalDispute.findUnique({ where: { id } });
  if (!dispute) return { error: "Dispute not found" };

  await prisma.rentalDispute.update({
    where: { id },
    data: { status: parsed.data.status, resolution: parsed.data.resolution },
  });

  if (parsed.data.bookingStatus) {
    await prisma.equipmentRentalBooking.update({
      where: { id: dispute.bookingId },
      data: { status: parsed.data.bookingStatus },
    });
  } else {
    // If nothing else is open, release the booking from DISPUTED so ops can continue.
    const stillOpen = await prisma.rentalDispute.count({
      where: { bookingId: dispute.bookingId, id: { not: id }, status: { in: ["OPEN", "UNDER_REVIEW"] } },
    });
    if (stillOpen === 0) {
      await prisma.equipmentRentalBooking.updateMany({
        where: { id: dispute.bookingId, status: "DISPUTED" },
        data: { status: "RETURN_PENDING" },
      });
    }
  }

  await writeAdminAudit({
    actorId: session.user.id,
    action: `RENTAL_DISPUTE_${parsed.data.status}`,
    entity: "RentalDispute",
    entityId: id,
    meta: { resolution: parsed.data.resolution, bookingStatus: parsed.data.bookingStatus ?? null },
  });
  await resolveAdminNotificationsForEntity("rental_dispute", id);

  revalidatePath("/admin/rentals");
  revalidatePath(`/admin/rentals/disputes/${id}`);
  revalidatePath(`/admin/rentals/bookings/${dispute.bookingId}`);
  revalidatePath("/admin");
  return { success: true as const };
}

export async function markRentalDisputeUnderReview(id: string) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };
  const dispute = await prisma.rentalDispute.findUnique({ where: { id } });
  if (!dispute) return { error: "Dispute not found" };
  if (dispute.status !== "OPEN") return { error: "Only open disputes can be moved to review" };
  await prisma.rentalDispute.update({ where: { id }, data: { status: "UNDER_REVIEW" } });
  await writeAdminAudit({
    actorId: session.user.id,
    action: "RENTAL_DISPUTE_UNDER_REVIEW",
    entity: "RentalDispute",
    entityId: id,
  });
  revalidatePath("/admin/rentals");
  revalidatePath(`/admin/rentals/disputes/${id}`);
  return { success: true as const };
}

export async function updateAdminBookingStatus(
  bookingId: string,
  status: BookingStatus,
  note?: string,
) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };
  if (!(BOOKING_STATUSES as readonly string[]).includes(status)) return { error: "Invalid status" };

  const booking = await prisma.equipmentRentalBooking.findUnique({ where: { id: bookingId } });
  if (!booking) return { error: "Booking not found" };
  if (booking.status === status) return { success: true as const };

  await prisma.equipmentRentalBooking.update({ where: { id: bookingId }, data: { status } });

  // Free the calendar when a booking is cancelled.
  if (status === "CANCELLED") {
    await prisma.equipmentAvailability.deleteMany({
      where: {
        listingId: booking.listingId,
        kind: "BOOKED",
        date: { gte: new Date(booking.startDate.toISOString().slice(0, 10)), lte: booking.endDate },
      },
    });
  }

  await writeAdminAudit({
    actorId: session.user.id,
    action: "RENTAL_BOOKING_STATUS",
    entity: "EquipmentRentalBooking",
    entityId: bookingId,
    meta: { from: booking.status, to: status, note: note ?? null },
  });

  revalidatePath("/admin/rentals");
  revalidatePath(`/admin/rentals/bookings/${bookingId}`);
  revalidatePath("/dashboard/equipment");
  return { success: true as const };
}

export async function setAdminListingSuspended(id: string, suspended: boolean, note?: string) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };
  const listing = await prisma.equipmentListing.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!listing) return { error: "Listing not found" };
  if (suspended && listing.status !== "APPROVED") return { error: "Only approved listings can be suspended" };
  if (!suspended && listing.status !== "SUSPENDED") return { error: "Listing is not suspended" };

  await prisma.equipmentListing.update({
    where: { id },
    data: { status: suspended ? "SUSPENDED" : "APPROVED" },
  });
  await writeAdminAudit({
    actorId: session.user.id,
    action: suspended ? "RENTAL_LISTING_SUSPENDED" : "RENTAL_LISTING_REINSTATED",
    entity: "EquipmentListing",
    entityId: id,
    meta: { note: note ?? null },
  });
  revalidatePath("/admin/rentals");
  revalidatePath(`/admin/rentals/listings/${id}`);
  revalidatePath("/rentals/browse");
  return { success: true as const };
}
