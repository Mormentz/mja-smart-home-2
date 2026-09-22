"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import type { ChatAttachment } from "@/lib/chat-attachments";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DOC_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);
const AUDIO_TYPES = new Set(["audio/mpeg", "audio/mp4", "audio/webm", "audio/ogg", "audio/wav", "audio/x-m4a"]);

const MAX_IMAGE = 1.5 * 1024 * 1024;
const MAX_AUDIO = 1.5 * 1024 * 1024;
const MAX_DOC = 5 * 1024 * 1024;

function extFor(mime: string, fallback: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "application/pdf") return "pdf";
  if (mime.includes("wordprocessingml")) return "docx";
  if (mime === "application/msword") return "doc";
  if (mime === "text/plain") return "txt";
  if (mime === "audio/mpeg") return "mp3";
  if (mime === "audio/webm") return "webm";
  if (mime === "audio/ogg") return "ogg";
  if (mime === "audio/wav") return "wav";
  if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
  return fallback;
}

export async function uploadChatAttachment(formData: FormData): Promise<
  { error: string } | { attachment: ChatAttachment }
> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file selected" };
  }

  const mime = file.type || "application/octet-stream";
  let kind: "IMAGE" | "DOCUMENT" | "AUDIO";
  let max = MAX_DOC;

  if (IMAGE_TYPES.has(mime)) {
    kind = "IMAGE";
    max = MAX_IMAGE;
  } else if (AUDIO_TYPES.has(mime)) {
    kind = "AUDIO";
    max = MAX_AUDIO;
  } else if (DOC_TYPES.has(mime) || mime.startsWith("text/")) {
    kind = "DOCUMENT";
    max = MAX_DOC;
  } else {
    return { error: "Unsupported file type" };
  }

  if (file.size > max) {
    return {
      error:
        kind === "IMAGE" || kind === "AUDIO"
          ? "File too large after compression (max ~1.5MB). Try a shorter clip or smaller photo."
          : "Document exceeds 5MB",
    };
  }

  const dir = path.join(process.cwd(), "public", "uploads", "chat", session.user.id);
  await mkdir(dir, { recursive: true });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extFor(mime, "bin")}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buf);
  const url = `/uploads/chat/${session.user.id}/${filename}`;

  return {
    attachment: {
      kind,
      url,
      name: safeName || filename,
      mime,
      size: file.size,
    },
  };
}
