"use server";

import { revalidatePath } from "next/cache";
import { BookingKind } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bookingSchema = z.object({
  propertyId: z.string().min(1),
  preferredDate: z.string().min(1),
  kind: z.enum(["TOUR", "PURCHASE_INTEREST"]).default("TOUR"),
});

export async function createBooking(data: {
  propertyId: string;
  preferredDate: string;
  kind?: "TOUR" | "PURCHASE_INTEREST";
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in to book" };
  }

  if (!["USER", "AGENT"].includes(session.user.role)) {
    return { error: "Only users and agents can book" };
  }

  const parsed = bookingSchema.safeParse({
    ...data,
    kind: data.kind ?? "TOUR",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid booking details" };
  }

  // USER can tour and express purchase interest; AGENT can tour for clients
  if (session.user.role === "AGENT" && parsed.data.kind === "PURCHASE_INTEREST") {
    return { error: "Purchase interest is for home seekers" };
  }

  const preferredDate = new Date(parsed.data.preferredDate);
  if (Number.isNaN(preferredDate.getTime())) {
    return { error: "Invalid date" };
  }

  const property = await prisma.property.findUnique({ where: { id: parsed.data.propertyId } });
  if (!property) {
    return { error: "Property not found" };
  }

  if (parsed.data.kind === "PURCHASE_INTEREST" && property.type !== "FOR_SALE") {
    return { error: "Purchase interest is only for sale listings" };
  }

  await prisma.booking.create({
    data: {
      propertyId: parsed.data.propertyId,
      userId: session.user.id,
      preferredDate,
      kind: parsed.data.kind as BookingKind,
    },
  });

  revalidatePath("/dashboard/bookings");
  return { success: true };
}

export async function getUserBookings() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  return prisma.booking.findMany({
    where: { userId: session.user.id },
    include: { property: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOwnerBookings() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  return prisma.booking.findMany({
    where: { property: { ownerId: session.user.id } },
    include: { property: true, user: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateBookingStatus(bookingId: string, status: "APPROVED" | "CANCELLED") {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true },
  });

  if (!booking || booking.property.ownerId !== session.user.id) {
    return { error: "Booking not found" };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bookings");
  return { success: true };
}
