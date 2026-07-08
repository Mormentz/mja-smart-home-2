import type { StaticImageData } from "next/image";
import p1 from "@/assets/property-1.jpg";
import p2 from "@/assets/property-2.jpg";
import p3 from "@/assets/property-3.jpg";
import p4 from "@/assets/property-4.jpg";
import p5 from "@/assets/property-5.jpg";
import p6 from "@/assets/property-6.jpg";

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
};

export const properties: Property[] = [
  {
    id: "riverstone-house",
    title: "Riverstone Modern House",
    location: "Ikoyi, Lagos",
    price: 480000,
    currency: "$",
    type: "For Sale",
    category: "House",
    beds: 4,
    baths: 3,
    area: 3200,
    image: p1,
    featured: true,
    description:
      "A striking contemporary home clad in dark stone and warm wood, framed by ambient landscape lighting. Open-plan living, floor-to-ceiling glazing, and a private garden bring the outside in.",
    amenities: ["Smart lock", "EV charger", "Solar backup", "Garden", "Underfloor heating", "Home office"],
  },
  {
    id: "verdant-heights",
    title: "Verdant Heights Apartments",
    location: "Lekki Phase 1, Lagos",
    price: 2100,
    currency: "$",
    type: "For Rent",
    category: "Apartment",
    beds: 2,
    baths: 2,
    area: 1150,
    image: p2,
    description:
      "Balcony-forward apartments spilling with greenery in the heart of the city. Cross-ventilated, sun-lit, and steps from cafés and coworking.",
    amenities: ["Balcony garden", "Gym", "24/7 security", "Fibre internet", "Parking"],
  },
  {
    id: "brownstone-classic",
    title: "Heritage Brownstone",
    location: "Old Ikoyi",
    price: 720000,
    currency: "$",
    type: "For Sale",
    category: "Townhouse",
    beds: 5,
    baths: 4,
    area: 4100,
    image: p3,
    description:
      "A restored brownstone on a tree-lined avenue. Wrought-iron balconies, original mouldings, and a chef's kitchen designed for entertaining.",
    amenities: ["Original hardwood", "Wine cellar", "Roof terrace", "Chef's kitchen"],
  },
  {
    id: "skyline-penthouse",
    title: "Skyline Penthouse",
    location: "Victoria Island",
    price: 4800,
    currency: "$",
    type: "For Rent",
    category: "Penthouse",
    beds: 3,
    baths: 3,
    area: 2400,
    image: p4,
    featured: true,
    description:
      "Panoramic city views through 12ft glass. Marble floors, a private lift, and concierge included. The address that says everything without saying anything.",
    amenities: ["Private lift", "Concierge", "Panoramic view", "Marble finishes", "Home cinema"],
  },
  {
    id: "coastline-villa",
    title: "Coastline Infinity Villa",
    location: "Elegushi Beach",
    price: 1250000,
    currency: "$",
    type: "For Sale",
    category: "Villa",
    beds: 6,
    baths: 6,
    area: 6800,
    image: p5,
    description:
      "A sun-soaked retreat with an infinity pool that meets the horizon. Palm-lined grounds, indoor–outdoor living, and a private boardwalk to the beach.",
    amenities: ["Infinity pool", "Beach access", "Staff quarters", "Outdoor kitchen"],
  },
  {
    id: "atelier-loft",
    title: "Atelier Loft",
    location: "Yaba Creative District",
    price: 1650,
    currency: "$",
    type: "For Rent",
    category: "Loft",
    beds: 1,
    baths: 1,
    area: 980,
    image: p6,
    description:
      "Exposed brick, timber trusses, and a cathedral skylight. A working artist's loft with modern comforts and a strong point of view.",
    amenities: ["Cathedral ceiling", "Skylight", "Loft office", "Freight lift"],
  },
];

export const getProperty = (id: string) => properties.find((p) => p.id === id);
