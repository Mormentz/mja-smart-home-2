import type { StaticImageData } from "next/image";
import p1 from "@/assets/property-1.jpg";
import p2 from "@/assets/property-2.jpg";
import p3 from "@/assets/property-3.jpg";
import p4 from "@/assets/property-4.jpg";
import p5 from "@/assets/property-5.jpg";
import p6 from "@/assets/property-6.jpg";

const IMAGE_MAP: Record<string, StaticImageData> = {
  "property-1.jpg": p1,
  "property-2.jpg": p2,
  "property-3.jpg": p3,
  "property-4.jpg": p4,
  "property-5.jpg": p5,
  "property-6.jpg": p6,
};

/** Resolve seed keys, uploaded paths, or remote URLs to a usable src. */
export function resolveImage(imageKey: string): string | StaticImageData {
  if (!imageKey) return IMAGE_MAP["property-1.jpg"];
  if (IMAGE_MAP[imageKey]) return IMAGE_MAP[imageKey];
  if (imageKey.startsWith("/") || imageKey.startsWith("http://") || imageKey.startsWith("https://")) {
    return imageKey;
  }
  return IMAGE_MAP["property-1.jpg"];
}

export function imageSrc(image: string | StaticImageData): string {
  return typeof image === "string" ? image : image.src;
}
