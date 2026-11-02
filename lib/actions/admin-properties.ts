"use server";

import { revalidatePath } from "next/cache";
import { PropertyCategory, PropertyType, VerificationStatus } from "@prisma/client";
import { z } from "zod";
import { getAdminSessionOrNull } from "@/lib/auth/admin";
import { writeAdminAudit } from "@/lib/admin/audit";
import { prisma } from "@/lib/prisma";
import { setPropertyAmenities } from "@/lib/actions/amenities";
import { resolveAdminNotificationsForEntity } from "@/lib/actions/admin-notifications";

async function requireAdmin() {
  return getAdminSessionOrNull();
}

function revalidateProperty(id: string) {
  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${id}`);
  revalidatePath("/properties");
  revalidatePath(`/properties/${id}`);
}

export async function listAdminPropertiesFiltered(opts?: { q?: string; status?: string }) {
  const session = await requireAdmin();
  if (!session) return [];

  const status = opts?.status?.toUpperCase();
  const validStatus = status && status in VerificationStatus ? (status as VerificationStatus) : undefined;
  const q = opts?.q?.trim();

  return prisma.property.findMany({
    where: {
      ...(validStatus ? { verificationStatus: validStatus } : {}),
      ...(opts?.status === "featured" ? { featured: true } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { location: { contains: q, mode: "insensitive" as const } },
              { id: { contains: q, mode: "insensitive" as const } },
              { owner: { email: { contains: q, mode: "insensitive" as const } } },
              { owner: { name: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      neighborhood: true,
      _count: { select: { bookings: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getAdminPropertyDetail(id: string) {
  const session = await requireAdmin();
  if (!session) return null;

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          active: true,
          kycStatus: true,
          kycLevel: true,
          createdAt: true,
          _count: { select: { properties: true } },
        },
      },
      neighborhood: true,
      propertyAmenities: { include: { amenity: true } },
      bookings: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      },
      leases: {
        include: {
          renter: { select: { id: true, name: true, email: true } },
          landlord: { select: { id: true, name: true, email: true } },
          escrowPayments: { orderBy: { createdAt: "desc" } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      _count: { select: { savedBy: true, reviews: true, messages: true } },
    },
  });
  if (!property) return null;

  const [allAmenities, neighborhoods, activity] = await Promise.all([
    prisma.amenity.findMany({ orderBy: { name: "asc" } }),
    prisma.neighborhood.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.auditLog.findMany({
      where: { entity: "Property", entityId: id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return { property, allAmenities, neighborhoods, activity };
}

export type AdminPropertyDetail = NonNullable<Awaited<ReturnType<typeof getAdminPropertyDetail>>>;

const propertySchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  location: z.string().trim().min(2).max(200).optional(),
  price: z.coerce.number().int().min(0).max(10_000_000_000).optional(),
  currency: z.string().trim().min(1).max(8).optional(),
  type: z.nativeEnum(PropertyType).optional(),
  category: z.nativeEnum(PropertyCategory).optional(),
  beds: z.coerce.number().int().min(0).max(100).optional(),
  baths: z.coerce.number().int().min(0).max(100).optional(),
  area: z.coerce.number().int().min(0).max(1_000_000).optional(),
  description: z.string().trim().min(1).max(10_000).optional(),
  tourUrl: z.string().trim().url().max(500).optional().nullable().or(z.literal("")),
  neighborhoodId: z.string().optional().nullable(),
  featured: z.boolean().optional(),
});

export type AdminPropertyFields = z.input<typeof propertySchema>;

export async function updateAdminProperty(id: string, data: AdminPropertyFields) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };
  const parsed = propertySchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const existing = await prisma.property.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { error: "Property not found" };

  const d = parsed.data;
  await prisma.property.update({
    where: { id },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.location !== undefined ? { location: d.location } : {}),
      ...(d.price !== undefined ? { price: d.price } : {}),
      ...(d.currency !== undefined ? { currency: d.currency } : {}),
      ...(d.type !== undefined ? { type: d.type } : {}),
      ...(d.category !== undefined ? { category: d.category } : {}),
      ...(d.beds !== undefined ? { beds: d.beds } : {}),
      ...(d.baths !== undefined ? { baths: d.baths } : {}),
      ...(d.area !== undefined ? { area: d.area } : {}),
      ...(d.description !== undefined ? { description: d.description } : {}),
      ...(d.tourUrl !== undefined ? { tourUrl: d.tourUrl || null } : {}),
      ...(d.neighborhoodId !== undefined ? { neighborhoodId: d.neighborhoodId || null } : {}),
      ...(d.featured !== undefined ? { featured: d.featured } : {}),
    },
  });

  await writeAdminAudit({
    actorId: session.user.id,
    action: "PROPERTY_UPDATE",
    entity: "Property",
    entityId: id,
    meta: d as Record<string, unknown>,
  });
  revalidateProperty(id);
  return { success: true as const };
}

const mediaSchema = z.object({
  image: z.string().trim().min(1, "Cover image is required").max(1000),
  images: z.array(z.string().trim().min(1).max(1000)).max(40),
});

export async function updateAdminPropertyMedia(id: string, data: { image: string; images: string[] }) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };
  const parsed = mediaSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const existing = await prisma.property.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { error: "Property not found" };

  await prisma.property.update({
    where: { id },
    data: { image: parsed.data.image, images: parsed.data.images },
  });
  await writeAdminAudit({
    actorId: session.user.id,
    action: "PROPERTY_MEDIA_UPDATE",
    entity: "Property",
    entityId: id,
    meta: { image: parsed.data.image, imageCount: parsed.data.images.length },
  });
  revalidateProperty(id);
  return { success: true as const };
}

export async function updateAdminPropertyAmenities(id: string, amenityIds: string[]) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };
  const existing = await prisma.property.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { error: "Property not found" };

  await setPropertyAmenities(id, amenityIds);
  await writeAdminAudit({
    actorId: session.user.id,
    action: "PROPERTY_AMENITIES_UPDATE",
    entity: "Property",
    entityId: id,
    meta: { amenityIds },
  });
  revalidateProperty(id);
  return { success: true as const };
}

export async function adminSetPropertyVerification(
  id: string,
  decision: "VERIFIED" | "REJECTED" | "PENDING" | "UNVERIFIED",
  note?: string,
) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };
  const existing = await prisma.property.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { error: "Property not found" };

  await prisma.property.update({
    where: { id },
    data: {
      verificationStatus: decision as VerificationStatus,
      verifiedAt: decision === "VERIFIED" ? new Date() : null,
    },
  });
  await writeAdminAudit({
    actorId: session.user.id,
    action: `PROPERTY_${decision}`,
    entity: "Property",
    entityId: id,
    meta: { note: note ?? null },
  });
  if (decision === "VERIFIED" || decision === "REJECTED") {
    await resolveAdminNotificationsForEntity("property", id);
  }
  revalidateProperty(id);
  revalidatePath("/admin/verifications");
  revalidatePath("/admin");
  return { success: true as const };
}

export async function adminDeleteProperty(id: string) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };
  const existing = await prisma.property.findUnique({ where: { id }, select: { id: true, title: true } });
  if (!existing) return { error: "Property not found" };
  await prisma.property.delete({ where: { id } });
  await writeAdminAudit({
    actorId: session.user.id,
    action: "PROPERTY_DELETE",
    entity: "Property",
    entityId: id,
    meta: { title: existing.title },
  });
  revalidatePath("/admin/properties");
  revalidatePath("/properties");
  return { success: true as const };
}
