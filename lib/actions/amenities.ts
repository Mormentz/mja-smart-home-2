"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/roles";
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
  await requireRole(["ADMIN"]);
  return prisma.amenity.findMany({ orderBy: { name: "asc" } });
}

export async function createAmenity(name: string) {
  await requireRole(["ADMIN"]);
  const trimmed = name.trim();
  if (trimmed.length < 2) return { error: "Name too short" };
  const slug = slugify(trimmed);
  if (!slug) return { error: "Invalid name" };

  try {
    await prisma.amenity.create({ data: { name: trimmed, slug, active: true } });
  } catch {
    return { error: "Amenity already exists" };
  }
  revalidatePath("/dashboard/admin/amenities");
  revalidatePath("/dashboard/listings");
  return { success: true };
}

export async function updateAmenity(
  id: string,
  data: { name?: string; active?: boolean },
) {
  await requireRole(["ADMIN"]);
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
  revalidatePath("/dashboard/admin/amenities");
  revalidatePath("/dashboard/listings");
  revalidatePath("/properties");
  return { success: true };
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
