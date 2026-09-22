export type ChatAttachment =
  | {
      kind: "IMAGE" | "DOCUMENT" | "AUDIO";
      url: string;
      name: string;
      mime: string;
      size: number;
    }
  | {
      kind: "PROPERTY";
      propertyId: string;
    };

export type ChatPropertySnippet = {
  id: string;
  title: string;
  location: string;
  price: number;
  currency: string;
  type: string;
  image: string;
};

export function parseAttachments(raw: unknown): ChatAttachment[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is ChatAttachment => {
    if (!item || typeof item !== "object") return false;
    const kind = (item as { kind?: string }).kind;
    if (kind === "PROPERTY") return typeof (item as { propertyId?: string }).propertyId === "string";
    if (kind === "IMAGE" || kind === "DOCUMENT" || kind === "AUDIO") {
      return typeof (item as { url?: string }).url === "string";
    }
    return false;
  });
}

export function attachmentPreviewLabel(a: ChatAttachment): string {
  if (a.kind === "PROPERTY") return "Property reference";
  if (a.kind === "IMAGE") return a.name || "Photo";
  if (a.kind === "AUDIO") return a.name || "Audio";
  return a.name || "Document";
}
