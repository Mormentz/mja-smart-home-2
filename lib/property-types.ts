import type { StaticImageData } from "next/image";
import type { VerificationStatus } from "@/generated/prisma/browser";

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
  images: (string | StaticImageData)[];
  featured?: boolean;
  description: string;
  amenities: string[];
  ownerId?: string;
  verificationStatus?: VerificationStatus;
  tourUrl?: string | null;
  neighborhood?: NeighborhoodScore | null;
};
