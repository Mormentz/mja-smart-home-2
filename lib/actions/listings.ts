"use server";

import type { PropertyCategory, PropertyType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { setPropertyAmenities } from "@/lib/actions/amenities";
import { prisma } from "@/lib/prisma";

const listingSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9-]+$/, "ID must be lowercase letters, numbers, and hyphens"),
  title: z.string().min(3),
  location: z.string().min(2),
  price: z.coerce.number().int().positive(),
  currency: z.string().default("$"),
  type: z.enum(["FOR_SALE", "FOR_RENT"]),
  category: z.enum(["HOUSE", "APARTMENT", "VILLA", "LOFT", "TOWNHOUSE", "PENTHOUSE"]),
  beds: z.coerce.number().int().min(0),
  baths: z.coerce.number().int().min(0),
  area: z.coerce.number().int().positive(),
  image: z.string().min(1),
  images: z.array(z.string()).default([]),
  featured: z.boolean().optional(),
  description: z.string().min(10),
  amenityIds: z.array(z.string()).default([]),
  tourUrl: z.string().url().optional().or(z.literal("")),
  neighborhoodId: z.string().optional().or(z.literal("")),
});

export async function getOwnerListings() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  return prisma.property.findMany({
    where: { ownerId: session.user.id },
    include: {
      neighborhood: true,
      propertyAmenities: { include: { amenity: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createListing(data: z.infer<typeof listingSchema>) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (session.user.role !== "AGENT") {
    return { error: "Only agents can manage listings" };
  }

  const agentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (agentUser?.kycStatus !== "VERIFIED") {
    return { error: "Complete KYC verification before publishing listings" };
  }

  const parsed = listingSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid listing data" };
  }

  const existing = await prisma.property.findUnique({ where: { id: parsed.data.id } });
  if (existing) {
    return { error: "A listing with this ID already exists" };
  }

  const { tourUrl, neighborhoodId, amenityIds, images, ...rest } = parsed.data;
  const gallery = images.length > 0 ? images : [parsed.data.image];

  await prisma.property.create({
    data: {
      ...rest,
      images: gallery,
      amenities: [],
      type: parsed.data.type as PropertyType,
      category: parsed.data.category as PropertyCategory,
      ownerId: session.user.id,
      tourUrl: tourUrl || null,
      neighborhoodId: neighborhoodId || null,
    },
  });

  await setPropertyAmenities(parsed.data.id, amenityIds);

  revalidatePath("/dashboard/listings");
  revalidatePath("/properties");
  return { success: true };
}

export async function updateListing(
  id: string,
  data: Partial<z.infer<typeof listingSchema>>,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const listing = await prisma.property.findUnique({ where: { id } });
  if (!listing || listing.ownerId !== session.user.id) {
    return { error: "Listing not found" };
  }

  const gallery =
    data.images && data.images.length > 0
      ? data.images
      : data.image
        ? [data.image]
        : undefined;

  await prisma.property.update({
    where: { id },
    data: {
      title: data.title,
      location: data.location,
      price: data.price,
      currency: data.currency,
      type: data.type as PropertyType | undefined,
      category: data.category as PropertyCategory | undefined,
      beds: data.beds,
      baths: data.baths,
      area: data.area,
      image: data.image,
      images: gallery,
      featured: data.featured,
      description: data.description,
      tourUrl: data.tourUrl === "" ? null : data.tourUrl,
      neighborhoodId: data.neighborhoodId === "" ? null : data.neighborhoodId,
    },
  });

  if (data.amenityIds) {
    await setPropertyAmenities(id, data.amenityIds);
  }

  revalidatePath("/dashboard/listings");
  revalidatePath("/properties");
  revalidatePath(`/properties/${id}`);
  return { success: true };
}

export async function deleteListing(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const listing = await prisma.property.findUnique({ where: { id } });
  if (!listing || listing.ownerId !== session.user.id) {
    return { error: "Listing not found" };
  }

  await prisma.property.delete({ where: { id } });

  revalidatePath("/dashboard/listings");
  revalidatePath("/properties");
  return { success: true };
}
