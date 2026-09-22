"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireRole } from "@/lib/auth/roles";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 8;

function extFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export async function uploadPropertyImages(formData: FormData) {
  await requireRole(["AGENT", "ADMIN"]);

  const propertyId = String(formData.get("propertyId") ?? "").trim();
  if (!propertyId || !/^[a-z0-9-]+$/.test(propertyId)) {
    return { error: "Valid property ID required before uploading images" };
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    return { error: "No files selected" };
  }
  if (files.length > MAX_FILES) {
    return { error: `Maximum ${MAX_FILES} images per upload` };
  }

  const dir = path.join(process.cwd(), "public", "uploads", "properties", propertyId);
  await mkdir(dir, { recursive: true });

  const paths: string[] = [];
  for (const file of files) {
    if (!ALLOWED.has(file.type)) {
      return { error: `Unsupported type: ${file.type || file.name}` };
    }
    if (file.size > MAX_BYTES) {
      return { error: `${file.name} exceeds 5MB` };
    }
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extFor(file.type)}`;
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, safe), buf);
    paths.push(`/uploads/properties/${propertyId}/${safe}`);
  }

  return { paths };
}
