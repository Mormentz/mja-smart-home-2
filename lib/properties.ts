import "server-only";

import type { PropertyCategory, PropertyType, VerificationStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveImage } from "@/lib/property-images";
import type { NeighborhoodScore, Property } from "@/lib/property-types";
import { SEED_PROPERTIES } from "@/lib/seed-data";

export type { NeighborhoodScore, Property } from "@/lib/property-types";
export { imageSrc, resolveImage } from "@/lib/property-images";

const TYPE_TO_DISPLAY: Record<PropertyType, Property["type"]> = {
  FOR_SALE: "For Sale",
  FOR_RENT: "For Rent",
};

const CATEGORY_TO_DISPLAY: Record<PropertyCategory, Property["category"]> = {
  HOUSE: "House",
  APARTMENT: "Apartment",
  VILLA: "Villa",
  LOFT: "Loft",
  TOWNHOUSE: "Townhouse",
  PENTHOUSE: "Penthouse",
};

function mapDbProperty(record: {
  id: string;
  title: string;
  location: string;
  price: number;
  currency: string;
  type: PropertyType;
  category: PropertyCategory;
  beds: number;
  baths: number;
  area: number;
  image: string;
  images?: string[];
  featured: boolean;
  description: string;
  amenities: string[];
  ownerId: string;
  verificationStatus?: VerificationStatus;
  tourUrl?: string | null;
  neighborhood?: NeighborhoodScore | null;
  propertyAmenities?: { amenity: { name: string; active: boolean } }[];
}): Property {
  const joined =
    record.propertyAmenities
      ?.filter((pa) => pa.amenity.active)
      .map((pa) => pa.amenity.name) ?? [];
  const amenityNames = joined.length > 0 ? joined : record.amenities;
  const galleryKeys =
    record.images && record.images.length > 0
      ? record.images
      : [record.image];

  return {
    id: record.id,
    title: record.title,
    location: record.location,
    price: record.price,
    currency: record.currency,
    type: TYPE_TO_DISPLAY[record.type],
    category: CATEGORY_TO_DISPLAY[record.category],
    beds: record.beds,
    baths: record.baths,
    area: record.area,
    image: resolveImage(record.image),
    images: galleryKeys.map(resolveImage),
    featured: record.featured,
    description: record.description,
    amenities: amenityNames,
    ownerId: record.ownerId,
    verificationStatus: record.verificationStatus ?? "UNVERIFIED",
    tourUrl: record.tourUrl ?? null,
    neighborhood: record.neighborhood ?? null,
  };
}

const staticProperties: Property[] = SEED_PROPERTIES.map((p) => ({
  id: p.id,
  title: p.title,
  location: p.location,
  price: p.price,
  currency: p.currency,
  type: p.type === "FOR_SALE" ? "For Sale" : "For Rent",
  category:
    p.category === "HOUSE"
      ? "House"
      : p.category === "APARTMENT"
        ? "Apartment"
        : p.category === "VILLA"
          ? "Villa"
          : p.category === "LOFT"
            ? "Loft"
            : p.category === "TOWNHOUSE"
              ? "Townhouse"
              : "Penthouse",
  beds: p.beds,
  baths: p.baths,
  area: p.area,
  image: resolveImage(p.image),
  images: [...p.images].map(resolveImage),
  featured: "featured" in p ? Boolean((p as { featured?: boolean }).featured) : undefined,
  description: p.description,
  amenities: [...p.amenities],
  verificationStatus: p.verificationStatus,
  tourUrl: p.tourUrl,
}));

/** @deprecated Use getProperties() instead */
export const properties: Property[] = staticProperties;

const propertyInclude = {
  neighborhood: true,
  propertyAmenities: { include: { amenity: true } },
} as const;

export async function getProperties(opts?: { verifiedOnly?: boolean }): Promise<Property[]> {
  try {
    const records = await prisma.property.findMany({
      where: opts?.verifiedOnly ? { verificationStatus: "VERIFIED" } : undefined,
      include: propertyInclude,
      orderBy: { createdAt: "desc" },
    });
    if (records.length === 0) {
      return staticProperties.filter((p) =>
        opts?.verifiedOnly ? p.verificationStatus === "VERIFIED" : true,
      );
    }
    return records.map(mapDbProperty);
  } catch {
    return staticProperties;
  }
}

export async function getProperty(id: string): Promise<Property | undefined> {
  try {
    const record = await prisma.property.findUnique({
      where: { id },
      include: propertyInclude,
    });
    if (record) {
      return mapDbProperty(record);
    }
  } catch {
    // fall through to static data
  }
  return staticProperties.find((p) => p.id === id);
}

export async function getPropertyIds(): Promise<string[]> {
  const items = await getProperties();
  return items.map((p) => p.id);
}
