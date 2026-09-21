import type { StaticImageData } from "next/image";
import type { PropertyCategory, PropertyType, VerificationStatus } from "@prisma/client";
import p1 from "@/assets/property-1.jpg";
import p2 from "@/assets/property-2.jpg";
import p3 from "@/assets/property-3.jpg";
import p4 from "@/assets/property-4.jpg";
import p5 from "@/assets/property-5.jpg";
import p6 from "@/assets/property-6.jpg";
import { prisma } from "@/lib/prisma";
import { SEED_PROPERTIES } from "@/lib/seed-data";

export type NeighborhoodScore = {
  id: string;
  name: string;
  slug: string;
  safety: number;
  power: number;
  water: number;
  affordability: number;
  summary: string | null;
};

export type Property = {
  id: string;
  title: string;
  location: string;
  price: number;
  currency: string;
  type: "For Sale" | "For Rent";
  category: "House" | "Apartment" | "Villa" | "Loft" | "Townhouse" | "Penthouse";
  beds: number;
  baths: number;
  area: number;
  image: string | StaticImageData;
  featured?: boolean;
  description: string;
  amenities: string[];
  ownerId?: string;
  verificationStatus?: VerificationStatus;
  tourUrl?: string | null;
  neighborhood?: NeighborhoodScore | null;
};

const IMAGE_MAP: Record<string, StaticImageData> = {
  "property-1.jpg": p1,
  "property-2.jpg": p2,
  "property-3.jpg": p3,
  "property-4.jpg": p4,
  "property-5.jpg": p5,
  "property-6.jpg": p6,
};

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

function resolveImage(imageKey: string): string | StaticImageData {
  return IMAGE_MAP[imageKey] ?? imageKey;
}

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
  featured: boolean;
  description: string;
  amenities: string[];
  ownerId: string;
  verificationStatus?: VerificationStatus;
  tourUrl?: string | null;
  neighborhood?: NeighborhoodScore | null;
}): Property {
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
    featured: record.featured,
    description: record.description,
    amenities: record.amenities,
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
  featured: "featured" in p ? p.featured : undefined,
  description: p.description,
  amenities: [...p.amenities],
  verificationStatus: p.verificationStatus,
  tourUrl: p.tourUrl,
}));

/** @deprecated Use getProperties() instead */
export const properties: Property[] = staticProperties;

export async function getProperties(opts?: { verifiedOnly?: boolean }): Promise<Property[]> {
  try {
    const records = await prisma.property.findMany({
      where: opts?.verifiedOnly ? { verificationStatus: "VERIFIED" } : undefined,
      include: { neighborhood: true },
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
      include: { neighborhood: true },
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
