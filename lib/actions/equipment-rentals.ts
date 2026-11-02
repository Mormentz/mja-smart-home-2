"use server";

import { revalidatePath } from "next/cache";
import type { EquipmentCondition, Prisma, RentalDisputeType } from "@/generated/prisma/client";
import { requireAuth } from "@/lib/auth/roles";
import { getAdminSessionOrNull, requireAdminSession } from "@/lib/auth/admin";
import { writeAdminAudit } from "@/lib/admin/audit";
import { resolveAdminNotificationsForEntity } from "@/lib/actions/admin-notifications";
import { allocateHcId } from "@/lib/ids/allocate-hc-id";
import { prisma } from "@/lib/prisma";
import { estimateRentalTotal } from "@/lib/rentals/pricing";
import { createPaymentHold } from "@/lib/payments/provider";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { saveUpload } from "@/lib/uploads/save-upload";
import { EQUIPMENT_CONDITIONS, RENTAL_DISPUTE_TYPES } from "@/lib/rentals/constants";

async function getOrCreateOwner(userId: string) {
  const existing = await prisma.equipmentOwnerProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const hcId = await allocateHcId("OWN", user.stateCode);
  return prisma.equipmentOwnerProfile.create({
    data: {
      userId,
      hcId,
      email: user.email,
      phone: user.phone,
      fullName: user.name,
      registrationStep: 1,
    },
  });
}

async function getOrCreateCustomer(userId: string) {
  const existing = await prisma.rentalCustomerProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const hcId = await allocateHcId("EQC", user.stateCode);
  return prisma.rentalCustomerProfile.create({
    data: {
      userId,
      hcId,
      email: user.email,
      phone: user.phone,
      fullName: user.name,
    },
  });
}

export async function getMyEquipmentOwner() {
  const session = await requireAuth();
  return prisma.equipmentOwnerProfile.findUnique({ where: { userId: session.user.id } });
}

export async function saveEquipmentOwner(data: {
  kind: "INDIVIDUAL" | "BUSINESS";
  fullName?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  dateOfBirth?: string;
  stateOfResidence?: string;
  city?: string;
  residentialAddress?: string;
  businessName?: string;
  cacNumber?: string;
  businessAddress?: string;
  businessCategory?: string;
  authorizedRepName?: string;
  website?: string;
}) {
  const session = await requireAuth();
  if (data.kind === "BUSINESS") {
    if (!data.businessName?.trim() || !data.cacNumber?.trim() || !data.authorizedRepName?.trim()) {
      return {
        ok: false as const,
        error: "Business owners must provide business name, CAC number and authorized representative.",
      };
    }
  }
  const owner = await getOrCreateOwner(session.user.id);
  const keepVerified = owner.identityStatus === "VERIFIED" && owner.kind === data.kind;
  await prisma.equipmentOwnerProfile.update({
    where: { id: owner.id },
    data: {
      ...data,
      // Individuals never carry business fields
      ...(data.kind === "INDIVIDUAL"
        ? {
            businessName: null,
            cacNumber: null,
            businessAddress: null,
            businessCategory: null,
            authorizedRepName: null,
            website: null,
          }
        : {}),
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      identityStatus: keepVerified ? "VERIFIED" : "PENDING",
      registrationStep: Math.max(owner.registrationStep, 2),
    },
  });
  revalidatePath("/rentals/list");
  return { ok: true as const };
}

/** Owner ID (individual) or authorized representative ID (business) — private, admin-reviewed. */
export async function uploadOwnerIdDocument(formData: FormData) {
  const session = await requireAuth();
  const owner = await getOrCreateOwner(session.user.id);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false as const, error: "No file" };
  const saved = await saveUpload({
    file,
    segments: ["rentals", "owners", owner.id],
    prefix: "id",
    accept: "image-or-pdf",
  });
  if (!saved.ok) return { ok: false as const, error: saved.error };
  await prisma.equipmentOwnerProfile.update({
    where: { id: owner.id },
    data: { idDocumentUrl: saved.url, identityStatus: "PENDING" },
  });
  revalidatePath("/rentals/list");
  return { ok: true as const, url: saved.url };
}

export async function createEquipmentListing(data: {
  name: string;
  category: string;
  subcategory?: string;
  brand?: string;
  model?: string;
  yearOfManufacture?: number;
  serialNumberPrivate?: string;
  description: string;
  quantity?: number;
  condition: EquipmentCondition;
  accessories?: string;
  replacementValue?: number;
  hourlyPrice?: number;
  dailyPrice?: number;
  weeklyPrice?: number;
  monthlyPrice?: number;
  minDurationHours?: number;
  maxDurationHours?: number;
  securityDeposit?: number;
  deliveryCharge?: number;
  pickupCharge?: number;
  operatorCharge?: number;
  lateReturnCharge?: number;
  damagePolicy?: string;
  cancellationPolicy?: string;
  state?: string;
  city?: string;
  area?: string;
  generalPickupLocation?: string;
  deliveryAvailable?: boolean;
  maxDeliveryKm?: number;
  pickupAvailable?: boolean;
  preciseAddressPrivate?: string;
  ownershipDeclaration: boolean;
  rentalTerms?: string;
  submitForReview?: boolean;
}) {
  const session = await requireAuth();
  const owner = await getOrCreateOwner(session.user.id);
  if (!data.ownershipDeclaration) {
    return { ok: false as const, error: "Ownership declaration required." };
  }
  const hcId = await allocateHcId("RENT", data.state ?? owner.stateOfResidence);
  const listing = await prisma.equipmentListing.create({
    data: {
      ownerProfileId: owner.id,
      hcId,
      name: data.name,
      category: data.category,
      subcategory: data.subcategory,
      brand: data.brand,
      model: data.model,
      yearOfManufacture: data.yearOfManufacture,
      serialNumberPrivate: data.serialNumberPrivate,
      description: data.description,
      quantity: data.quantity ?? 1,
      condition: data.condition,
      accessories: data.accessories,
      replacementValue: data.replacementValue,
      hourlyPrice: data.hourlyPrice,
      dailyPrice: data.dailyPrice,
      weeklyPrice: data.weeklyPrice,
      monthlyPrice: data.monthlyPrice,
      minDurationHours: data.minDurationHours,
      maxDurationHours: data.maxDurationHours,
      securityDeposit: data.securityDeposit ?? 0,
      deliveryCharge: data.deliveryCharge ?? 0,
      pickupCharge: data.pickupCharge ?? 0,
      operatorCharge: data.operatorCharge ?? 0,
      lateReturnCharge: data.lateReturnCharge ?? 0,
      damagePolicy: data.damagePolicy,
      cancellationPolicy: data.cancellationPolicy,
      state: data.state,
      city: data.city,
      area: data.area,
      generalPickupLocation: data.generalPickupLocation,
      deliveryAvailable: data.deliveryAvailable ?? false,
      maxDeliveryKm: data.maxDeliveryKm,
      pickupAvailable: data.pickupAvailable ?? true,
      preciseAddressPrivate: data.preciseAddressPrivate,
      ownershipDeclaration: true,
      rentalTerms: data.rentalTerms,
      status: data.submitForReview ? "PENDING_REVIEW" : "DRAFT",
    },
  });
  revalidatePath("/rentals/browse");
  return { ok: true as const, id: listing.id, hcId };
}

export async function uploadListingPhoto(listingId: string, formData: FormData) {
  const session = await requireAuth();
  const listing = await prisma.equipmentListing.findUniqueOrThrow({
    where: { id: listingId },
    include: { owner: true },
  });
  if (listing.owner.userId !== session.user.id) return { ok: false as const, error: "Forbidden" };
  const file = formData.get("file") as File | null;
  if (!file) return { ok: false as const, error: "No file" };
  const dir = path.join(process.cwd(), "public", "uploads", "rentals", listingId);
  await mkdir(dir, { recursive: true });
  const safe = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  await writeFile(path.join(dir, safe), Buffer.from(await file.arrayBuffer()));
  const url = `/uploads/rentals/${listingId}/${safe}`;
  await prisma.equipmentListing.update({
    where: { id: listingId },
    data: { photos: { push: url } },
  });
  return { ok: true as const, url };
}

/** Receipts, invoices, or photos showing the serial number — reviewed by admins, never public. */
export async function uploadOwnershipEvidence(listingId: string, formData: FormData) {
  const session = await requireAuth();
  const listing = await prisma.equipmentListing.findUnique({
    where: { id: listingId },
    include: { owner: { select: { userId: true } } },
  });
  if (!listing || listing.owner.userId !== session.user.id) {
    return { ok: false as const, error: "Forbidden" };
  }
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { ok: false as const, error: "No files selected" };
  if (files.length > 5) return { ok: false as const, error: "Maximum 5 evidence files per upload" };
  const urls: string[] = [];
  for (const file of files) {
    const saved = await saveUpload({
      file,
      segments: ["rentals", "evidence", listingId],
      prefix: "evidence",
      accept: "image-or-pdf",
    });
    if (!saved.ok) return { ok: false as const, error: saved.error, urls };
    urls.push(saved.url);
  }
  await prisma.equipmentListing.update({
    where: { id: listingId },
    data: { ownershipEvidenceUrls: { push: urls }, ownershipReviewed: false },
  });
  revalidatePath("/dashboard/equipment");
  return { ok: true as const, urls };
}

/** Handover / return condition photos, restricted to the two parties on the booking. */
export async function uploadBookingConditionPhoto(bookingId: string, formData: FormData) {
  const session = await requireAuth();
  const booking = await prisma.equipmentRentalBooking.findUnique({
    where: { id: bookingId },
    include: { listing: { include: { owner: { select: { userId: true } } } } },
  });
  if (
    !booking ||
    (booking.customerUserId !== session.user.id && booking.listing.owner.userId !== session.user.id)
  ) {
    return { ok: false as const, error: "Forbidden" };
  }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false as const, error: "No file" };
  const saved = await saveUpload({
    file,
    segments: ["rentals", "bookings", bookingId],
    prefix: "condition",
    accept: "image",
  });
  if (!saved.ok) return { ok: false as const, error: saved.error };
  return { ok: true as const, url: saved.url };
}

export async function listApprovedEquipment(filters?: {
  category?: string;
  q?: string;
  state?: string;
  area?: string;
  maxDaily?: number;
}) {
  const rows = await prisma.equipmentListing.findMany({
    where: {
      status: "APPROVED",
      ...(filters?.category ? { category: filters.category } : {}),
      ...(filters?.state ? { state: { equals: filters.state, mode: "insensitive" } } : {}),
      ...(filters?.area
        ? {
            OR: [
              { area: { contains: filters.area, mode: "insensitive" } },
              { city: { contains: filters.area, mode: "insensitive" } },
              { generalPickupLocation: { contains: filters.area, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(filters?.maxDaily != null && filters.maxDaily > 0
        ? { dailyPrice: { lte: filters.maxDaily } }
        : {}),
      ...(filters?.q
        ? { OR: [{ name: { contains: filters.q, mode: "insensitive" } }, { hcId: { contains: filters.q, mode: "insensitive" } }] }
        : {}),
    },
    include: {
      owner: { select: { hcId: true, identityStatus: true, kind: true, businessName: true, fullName: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  return rows.map((r) => ({
    id: r.id,
    hcId: r.hcId,
    name: r.name,
    category: r.category,
    subcategory: r.subcategory,
    condition: r.condition,
    dailyPrice: r.dailyPrice,
    weeklyPrice: r.weeklyPrice,
    photos: r.photos,
    area: r.area,
    city: r.city,
    state: r.state,
    generalPickupLocation: r.generalPickupLocation,
    // precise address never public
    ownershipReviewed: r.ownershipReviewed,
    equipmentInspected: r.equipmentInspected,
    functionalityTested: r.functionalityTested,
    ownerIdentityVerified: r.owner.identityStatus === "VERIFIED",
    ownerLabel: r.owner.businessName || r.owner.fullName || r.owner.hcId,
  }));
}

export async function getPublicListing(id: string) {
  const r = await prisma.equipmentListing.findFirst({
    where: { OR: [{ id }, { hcId: id }], status: "APPROVED" },
    include: { owner: { select: { hcId: true, identityStatus: true } } },
  });
  if (!r) return null;
  const { preciseAddressPrivate: _p, serialNumberPrivate: _s, ...safe } = r;
  return {
    ...safe,
    preciseAddressPrivate: undefined,
    serialNumberPrivate: undefined,
    ownerIdentityVerified: r.owner.identityStatus === "VERIFIED",
  };
}

export async function decideEquipmentListing(
  id: string,
  data: {
    approve: boolean;
    ownershipReviewed?: boolean;
    equipmentInspected?: boolean;
    functionalityTested?: boolean;
    note?: string;
  },
): Promise<{ ok: true; error?: undefined } | { ok: false; error: string }> {
  const session = await getAdminSessionOrNull();
  if (!session) return { ok: false, error: "Unauthorized" };
  const existing = await prisma.equipmentListing.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { ok: false, error: "Listing not found" };
  await prisma.equipmentListing.update({
    where: { id },
    data: {
      status: data.approve ? "APPROVED" : "REJECTED",
      ownershipReviewed: data.ownershipReviewed ?? false,
      equipmentInspected: data.equipmentInspected ?? false,
      functionalityTested: data.functionalityTested ?? false,
    },
  });
  await writeAdminAudit({
    actorId: session.user.id,
    action: data.approve ? "RENTAL_LISTING_APPROVED" : "RENTAL_LISTING_REJECTED",
    entity: "EquipmentListing",
    entityId: id,
    meta: { note: data.note ?? null },
  });
  await resolveAdminNotificationsForEntity("equipment_listing", id);
  revalidatePath("/admin/rentals");
  revalidatePath(`/admin/rentals/listings/${id}`);
  revalidatePath("/admin/verifications");
  revalidatePath("/rentals/browse");
  return { ok: true };
}

export async function decideOwnerIdentity(
  ownerId: string,
  approve: boolean,
  note?: string,
): Promise<{ ok: true; error?: undefined } | { ok: false; error: string }> {
  const session = await getAdminSessionOrNull();
  if (!session) return { ok: false, error: "Unauthorized" };
  const existing = await prisma.equipmentOwnerProfile.findUnique({
    where: { id: ownerId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "Owner not found" };
  await prisma.equipmentOwnerProfile.update({
    where: { id: ownerId },
    data: { identityStatus: approve ? "VERIFIED" : "REJECTED" },
  });
  await writeAdminAudit({
    actorId: session.user.id,
    action: approve ? "RENTAL_OWNER_VERIFIED" : "RENTAL_OWNER_REJECTED",
    entity: "EquipmentOwnerProfile",
    entityId: ownerId,
    meta: { note: note ?? null },
  });
  await resolveAdminNotificationsForEntity("equipment_owner", ownerId);
  revalidatePath("/admin/rentals");
  revalidatePath("/admin/verifications");
  return { ok: true };
}

export async function saveRentalCustomer(data: {
  fullName: string;
  phone: string;
  whatsapp?: string;
  email: string;
  dateOfBirth?: string;
  generalLocation?: string;
  businessName?: string;
}) {
  const session = await requireAuth();
  const { kycGateError, requireUserTier1 } = await import("@/lib/auth/kyc-gate");
  const kyc = await requireUserTier1(session.user.id);
  if (!kyc.ok) return { ok: false as const, ...kycGateError(kyc) };
  const customer = await getOrCreateCustomer(session.user.id);
  // Identity follows User Tier 1 KYC — no blanket auto-verify
  const identityStatus = kyc.user.kycStatus === "VERIFIED" ? "VERIFIED" : "PENDING";
  await prisma.rentalCustomerProfile.update({
    where: { id: customer.id },
    data: {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      identityStatus,
    },
  });
  return { ok: true as const };
}

export async function requestRentalBooking(data: {
  listingId: string;
  quantity: number;
  startDate: string;
  endDate: string;
  pickupOrDelivery: "PICKUP" | "DELIVERY";
  preferredLocation?: string;
  budget?: number;
  operatorRequired?: boolean;
  intendedUsage?: string;
  specialRequirements?: string;
}) {
  const session = await requireAuth();
  const { kycGateError, requireUserTier1 } = await import("@/lib/auth/kyc-gate");
  const kyc = await requireUserTier1(session.user.id);
  if (!kyc.ok) return { ok: false as const, ...kycGateError(kyc) };
  const customer = await getOrCreateCustomer(session.user.id);
  const listing = await prisma.equipmentListing.findUniqueOrThrow({ where: { id: data.listingId } });
  if (listing.status !== "APPROVED") return { ok: false as const, error: "Listing not available" };
  // Higher replacement value needs Tier 2+
  if ((listing.replacementValue ?? 0) >= 500_000) {
    const { hasVerifiedAtLeast } = await import("@/lib/auth/kyc-gate");
    if (!hasVerifiedAtLeast(kyc.user, 2)) {
      return {
        ok: false as const,
        error: "Tier 2 KYC required for high-value equipment rentals.",
        code: "KYC_REQUIRED" as const,
        upgradeHref: "/dashboard/kyc",
        requiredTier: 2,
      };
    }
  }

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  const price = estimateRentalTotal({
    start,
    end,
    hourlyPrice: listing.hourlyPrice,
    dailyPrice: listing.dailyPrice,
    weeklyPrice: listing.weeklyPrice,
    monthlyPrice: listing.monthlyPrice,
    securityDeposit: listing.securityDeposit,
    deliveryCharge: listing.deliveryCharge,
    pickupCharge: listing.pickupCharge,
    operatorCharge: listing.operatorCharge,
    pickupOrDelivery: data.pickupOrDelivery,
    operatorRequired: data.operatorRequired,
    quantity: data.quantity,
  });

  // Block overlapping confirmed bookings
  const overlap = await prisma.equipmentRentalBooking.findFirst({
    where: {
      listingId: listing.id,
      status: { in: ["CONFIRMED", "HANDOVER", "ACTIVE", "RETURN_PENDING"] },
      startDate: { lt: end },
      endDate: { gt: start },
    },
  });
  if (overlap) return { ok: false as const, error: "Equipment not available for those dates." };

  const booking = await prisma.equipmentRentalBooking.create({
    data: {
      listingId: listing.id,
      customerProfileId: customer.id,
      customerUserId: session.user.id,
      quantity: data.quantity,
      startDate: start,
      endDate: end,
      pickupOrDelivery: data.pickupOrDelivery,
      preferredLocation: data.preferredLocation,
      budget: data.budget,
      operatorRequired: data.operatorRequired ?? false,
      intendedUsage: data.intendedUsage,
      specialRequirements: data.specialRequirements,
      estimatedTotal: price.estimatedTotal,
      depositAmount: price.deposit,
      status: "REQUESTED",
    },
  });
  revalidatePath("/dashboard/equipment");
  return { ok: true as const, id: booking.id, estimate: price };
}

export async function acceptRentalBooking(bookingId: string) {
  const session = await requireAuth();
  const booking = await prisma.equipmentRentalBooking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { listing: { include: { owner: true } } },
  });
  if (booking.listing.owner.userId !== session.user.id) {
    return { ok: false as const, error: "Forbidden" };
  }
  const customer = await prisma.user.findUnique({ where: { id: booking.customerUserId } });
  const { appBaseUrl } = await import("@/lib/email/smtp");
  const payment = await createPaymentHold({
    amount: booking.estimatedTotal,
    reference: `rent-${booking.id}`,
    email: customer?.email || session.user.email || "payments@homeconnect.local",
    callbackUrl: `${appBaseUrl()}/dashboard/equipment`,
    metadata: { bookingId: booking.id },
  });
  if (payment.status === "FAILED") {
    return { ok: false as const, error: payment.message || "Payment initialization failed" };
  }
  await prisma.equipmentRentalBooking.update({
    where: { id: bookingId },
    data: {
      status: "CONFIRMED",
      paymentRef: payment.reference,
      paymentStatus: "PENDING",
    },
  });
  // Block calendar
  const cursor = new Date(booking.startDate);
  while (cursor <= booking.endDate) {
    await prisma.equipmentAvailability.upsert({
      where: {
        listingId_date: {
          listingId: booking.listingId,
          date: new Date(cursor.toISOString().slice(0, 10)),
        },
      },
      create: {
        listingId: booking.listingId,
        date: new Date(cursor.toISOString().slice(0, 10)),
        kind: "BOOKED",
      },
      update: { kind: "BOOKED" },
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  revalidatePath("/dashboard/equipment");
  return {
    ok: true as const,
    payment,
    authorizationUrl: payment.authorizationUrl,
  };
}

const CONDITION_VALUES: readonly string[] = EQUIPMENT_CONDITIONS.map((c) => c.value);
const DISPUTE_TYPE_VALUES: readonly string[] = RENTAL_DISPUTE_TYPES.map((d) => d.value);

function onlyBookingPhotos(bookingId: string, photos: string[] | undefined) {
  const prefix = `/uploads/rentals/bookings/${bookingId}/`;
  return (photos ?? []).filter((u) => typeof u === "string" && u.startsWith(prefix)).slice(0, 10);
}

export async function acknowledgeHandover(
  bookingId: string,
  role: "owner" | "customer",
  payload: {
    condition: EquipmentCondition;
    accessories: boolean;
    notes?: string;
    photos?: string[];
    at?: string;
  },
) {
  const session = await requireAuth();
  if (!CONDITION_VALUES.includes(payload.condition)) {
    return { ok: false as const, error: "Select the equipment condition." };
  }
  const booking = await prisma.equipmentRentalBooking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { listing: { include: { owner: true } } },
  });
  const isOwner = booking.listing.owner.userId === session.user.id;
  const isCustomer = booking.customerUserId === session.user.id;
  if (role === "owner" && !isOwner) return { ok: false as const, error: "Forbidden" };
  if (role === "customer" && !isCustomer) return { ok: false as const, error: "Forbidden" };
  if (!["CONFIRMED", "HANDOVER"].includes(booking.status)) {
    return { ok: false as const, error: "Handover is not open for this booking." };
  }

  const entry = {
    condition: payload.condition,
    accessories: payload.accessories,
    notes: payload.notes?.trim() || null,
    photos: onlyBookingPhotos(bookingId, payload.photos),
    at: new Date().toISOString(),
    by: session.user.id,
  };
  // Keep each party's checklist side by side instead of overwriting the other's
  const previous =
    booking.handoverJson && typeof booking.handoverJson === "object" && !Array.isArray(booking.handoverJson)
      ? (booking.handoverJson as Prisma.InputJsonObject)
      : {};

  const ownerAck = role === "owner" ? true : booking.ownerHandoverAck;
  const customerAck = role === "customer" ? true : booking.customerHandoverAck;
  await prisma.equipmentRentalBooking.update({
    where: { id: bookingId },
    data: {
      handoverJson: { ...previous, [role]: entry },
      ownerHandoverAck: ownerAck,
      customerHandoverAck: customerAck,
      status: ownerAck && customerAck ? "ACTIVE" : "HANDOVER",
    },
  });
  revalidatePath("/dashboard/equipment");
  return { ok: true as const };
}

export async function completeReturn(
  bookingId: string,
  payload: { condition: EquipmentCondition; accessoriesOk: boolean; damageNote?: string; photos?: string[] },
) {
  const session = await requireAuth();
  if (!CONDITION_VALUES.includes(payload.condition)) {
    return { ok: false as const, error: "Select the equipment condition." };
  }
  const booking = await prisma.equipmentRentalBooking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { listing: { include: { owner: true } } },
  });
  if (booking.listing.owner.userId !== session.user.id && booking.customerUserId !== session.user.id) {
    return { ok: false as const, error: "Forbidden" };
  }
  const damageNote = payload.damageNote?.trim() || undefined;
  await prisma.equipmentRentalBooking.update({
    where: { id: bookingId },
    data: {
      returnJson: {
        condition: payload.condition,
        accessoriesOk: payload.accessoriesOk,
        damageNote: damageNote ?? null,
        photos: onlyBookingPhotos(bookingId, payload.photos),
        at: new Date().toISOString(),
        by: session.user.id,
      },
      status: damageNote ? "DISPUTED" : "COMPLETED",
      paymentStatus: damageNote ? "DEPOSIT_HOLD" : "DEPOSIT_RELEASED",
    },
  });
  revalidatePath("/dashboard/equipment");
  return { ok: true as const };
}

export async function sendRentalReminders(now = new Date()) {
  const upcoming = await prisma.equipmentRentalBooking.findMany({
    where: {
      status: { in: ["CONFIRMED", "ACTIVE"] },
      endDate: { lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
    },
    take: 100,
  });
  for (const b of upcoming) {
    const kind = b.endDate <= now ? "OVERDUE" : "BEFORE_END";
    await prisma.rentalReminder.create({ data: { bookingId: b.id, kind } });
  }
  return { ok: true as const, count: upcoming.length };
}

export async function openRentalDispute(bookingId: string, type: RentalDisputeType, description: string) {
  const session = await requireAuth();
  if (!DISPUTE_TYPE_VALUES.includes(type)) {
    return { ok: false as const, error: "Select a dispute type." };
  }
  const details = description.trim();
  if (details.length < 10) {
    return { ok: false as const, error: "Please describe the problem (at least 10 characters)." };
  }
  const booking = await prisma.equipmentRentalBooking.findUnique({
    where: { id: bookingId },
    include: { listing: { include: { owner: { select: { userId: true } } } } },
  });
  if (
    !booking ||
    (booking.customerUserId !== session.user.id && booking.listing.owner.userId !== session.user.id)
  ) {
    return { ok: false as const, error: "Forbidden" };
  }
  await prisma.rentalDispute.create({
    data: { bookingId, openedById: session.user.id, type, description: details },
  });
  await prisma.equipmentRentalBooking.update({
    where: { id: bookingId },
    data: { status: "DISPUTED" },
  });
  revalidatePath("/dashboard/equipment");
  revalidatePath("/admin/rentals");
  return { ok: true as const };
}

export async function listAdminRentals() {
  await requireAdminSession();
  const [pendingListings, active, overdue, disputes, owners] = await Promise.all([
    prisma.equipmentListing.findMany({ where: { status: "PENDING_REVIEW" }, take: 50 }),
    prisma.equipmentRentalBooking.findMany({ where: { status: { in: ["ACTIVE", "CONFIRMED"] } }, take: 50 }),
    prisma.equipmentRentalBooking.findMany({
      where: { status: "ACTIVE", endDate: { lt: new Date() } },
      take: 50,
    }),
    prisma.rentalDispute.findMany({ where: { status: "OPEN" }, take: 50 }),
    prisma.equipmentOwnerProfile.findMany({ where: { identityStatus: "PENDING" }, take: 50 }),
  ]);
  return { pendingListings, active, overdue, disputes, owners };
}

export async function listMyEquipmentDashboard() {
  const session = await requireAuth();
  const owner = await prisma.equipmentOwnerProfile.findUnique({
    where: { userId: session.user.id },
    include: { listings: true },
  });
  const bookings = await prisma.equipmentRentalBooking.findMany({
    where: {
      OR: [
        { customerUserId: session.user.id },
        { listing: { owner: { userId: session.user.id } } },
      ],
    },
    include: { listing: { select: { name: true, hcId: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return { owner, bookings };
}
