import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_BYTES = 8 * 1024 * 1024;

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export type UploadAccept = "image" | "image-or-pdf" | "document";

const ACCEPT_TYPES: Record<UploadAccept, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp"],
  "image-or-pdf": ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  document: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};

/**
 * Validates and stores an uploaded file under public/uploads/<segments...>.
 * Returns the public URL, or an error message.
 */
export async function saveUpload(opts: {
  file: File;
  segments: string[];
  prefix: string;
  accept: UploadAccept;
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const { file, segments, prefix, accept } = opts;
  if (!file || file.size === 0) return { ok: false, error: "No file selected" };
  if (!ACCEPT_TYPES[accept].includes(file.type)) {
    return { ok: false, error: `Unsupported file type: ${file.type || file.name}` };
  }
  if (file.size > MAX_BYTES) return { ok: false, error: `${file.name} exceeds 8MB` };

  const safeSegments = segments.map((s) => s.replace(/[^a-zA-Z0-9_-]/g, "_"));
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, "_");
  const dir = path.join(process.cwd(), "public", "uploads", ...safeSegments);
  await mkdir(dir, { recursive: true });
  const name = `${safePrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${MIME_EXT[file.type] ?? "bin"}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return { ok: true, url: `/uploads/${safeSegments.join("/")}/${name}` };
}
