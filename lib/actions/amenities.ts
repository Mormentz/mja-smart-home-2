"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminSession } from "@/lib/auth/admin";
import { writeAdminAudit } from "@/lib/admin/audit";
import { prisma } from "@/lib/prisma";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function listActiveAmenities() {
  return prisma.amenity.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
}

export async function listAllAmenities() {
  await requireAdminSession();
  return prisma.amenity.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { properties: true } } },
  });
}

export async function createAmenity(name: string) {
  await requireAdminSession();
  const trimmed = name.trim();
  if (trimmed.length < 2) return { error: "Name too short" };
  const slug = slugify(trimmed);
  if (!slug) return { error: "Invalid name" };

  try {
    await prisma.amenity.create({ data: { name: trimmed, slug, active: true } });
  } catch {
    return { error: "Amenity already exists" };
  }
  revalidatePath("/admin/amenities");
  revalidatePath("/dashboard/listings");
  return { success: true };
}

export async function updateAmenity(
  id: string,
  data: { name?: string; active?: boolean },
) {
  await requireAdminSession();
  const patch: { name?: string; slug?: string; active?: boolean } = {};
  if (typeof data.active === "boolean") patch.active = data.active;
  if (data.name) {
    const trimmed = data.name.trim();
    if (trimmed.length < 2) return { error: "Name too short" };
    patch.name = trimmed;
    patch.slug = slugify(trimmed);
  }
  try {
    await prisma.amenity.update({ where: { id }, data: patch });
  } catch {
    return { error: "Could not update amenity" };
  }
  revalidatePath("/admin/amenities");
  revalidatePath("/dashboard/listings");
  revalidatePath("/properties");
  return { success: true };
}

export async function deleteAmenity(id: string) {
  const session = await requireAdminSession();
  const amenity = await prisma.amenity.findUnique({
    where: { id },
    include: { _count: { select: { properties: true } } },
  });
  if (!amenity) return { error: "Amenity not found" };

  // Keep the denormalised Property.amenities name list in sync.
  const links = await prisma.propertyAmenity.findMany({
    where: { amenityId: id },
    select: { property: { select: { id: true, amenities: true } } },
  });
  await prisma.$transaction([
    ...links.map(({ property }) =>
      prisma.property.update({
        where: { id: property.id },
        data: { amenities: property.amenities.filter((n) => n !== amenity.name) },
      }),
    ),
    prisma.amenity.delete({ where: { id } }),
  ]);

  await writeAdminAudit({
    actorId: session.user.id,
    action: "AMENITY_DELETE",
    entity: "Amenity",
    entityId: id,
    meta: { name: amenity.name, propertiesAffected: amenity._count.properties },
  });
  revalidatePath("/admin/amenities");
  revalidatePath("/dashboard/listings");
  revalidatePath("/properties");
  return { success: true as const, propertiesAffected: amenity._count.properties };
}

export async function setPropertyAmenities(propertyId: string, amenityIds: string[]) {
  const amenities = await prisma.amenity.findMany({
    where: { id: { in: amenityIds }, active: true },
  });
  await prisma.propertyAmenity.deleteMany({ where: { propertyId } });
  if (amenities.length > 0) {
    await prisma.propertyAmenity.createMany({
      data: amenities.map((a) => ({ propertyId, amenityId: a.id })),
    });
  }
  await prisma.property.update({
    where: { id: propertyId },
    data: { amenities: amenities.map((a) => a.name) },
  });
}

const amenityIdSchema = z.array(z.string()).default([]);
export type AmenityIds = z.infer<typeof amenityIdSchema>;
