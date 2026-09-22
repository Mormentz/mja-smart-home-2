"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Role } from "@prisma/client";
import {
  ChevronLeft,
  Download,
  FileText,
  ImageIcon,
  Mic,
  Paperclip,
  Plus,
  Home,
} from "lucide-react";
import {
  getAgentListingsForChat,
  getPropertiesByIds,
  markThreadRead,
  sendMessage,
  type Conversation,
  type ConversationProperty,
} from "@/lib/actions/messages";
import { uploadChatAttachment } from "@/lib/actions/chat-uploads";
import { ChatPropertyCard } from "@/components/dashboard/chat-property-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { compressAudioFile, compressImageFile } from "@/lib/compress-media";
import { parseAttachments, type ChatAttachment } from "@/lib/chat-attachments";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ThreadMessage = Conversation["messages"][number];
type PropertySnippet = ConversationProperty;

function upsertProperty(
  properties: PropertySnippet[],
  property: PropertySnippet | null | undefined,
): PropertySnippet[] {
  if (!property) return properties;
  if (properties.some((p) => p.id === property.id)) return properties;
  return [property, ...properties];
}

function mergeMessageIntoThreads(
  threads: Conversation[],
  message: ThreadMessage,
  currentUserId: string,
): Conversation[] {
  const counterpart =
    message.senderId === currentUserId ? message.recipient : message.sender;
  const idx = threads.findIndex((c) => c.counterpartId === counterpart.id);

  if (idx === -1) {
    const unread =
      message.recipientId === currentUserId && !message.readAt ? 1 : 0;
    return [
      {
        counterpartId: counterpart.id,
        counterpartName: counterpart.name ?? counterpart.email,
        counterpartEmail: counterpart.email,
        properties: message.property ? [message.property] : [],
        lastMessage: message.content,
        lastAt: new Date(message.createdAt),
        unread,
        messages: [message],
      },
      ...threads,
    ];
  }

  const next = [...threads];
  const existing = next[idx];
  if (existing.messages.some((m) => m.id === message.id)) {
    return threads;
  }

  const unreadInc =
    message.recipientId === currentUserId && !message.readAt ? 1 : 0;
  next[idx] = {
    ...existing,
    lastMessage: message.content,
    lastAt: new Date(message.createdAt),
    unread: existing.unread + unreadInc,
    messages: [...existing.messages, message],
    properties: upsertProperty(existing.properties, message.property),
  };

  next.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
  return next;
}

function propertyPreviewLabel(properties: PropertySnippet[]) {
  if (properties.length === 0) return null;
  if (properties.length === 1) return properties[0].title;
  return `${properties.length} listings`;
}

export function ConversationInbox({
  conversations,
  currentUserId,
  role,
}: {
  conversations: Conversation[];
  currentUserId: string;
  role: Role;
}) {
  const [threads, setThreads] = useState<Conversation[]>(conversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [propertyCache, setPropertyCache] = useState<Record<string, PropertySnippet>>({});
  const [listingPickerOpen, setListingPickerOpen] = useState(false);
  const [ownedListings, setOwnedListings] = useState<PropertySnippet[]>([]);
  const markedRef = useRef<Set<string>>(new Set());
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setThreads((prev) => {
      if (prev.length === 0) return conversations;
      const known = new Set(prev.flatMap((t) => t.messages.map((m) => m.id)));
      let next = prev;
      for (const c of conversations) {
        for (const m of c.messages) {
          if (!known.has(m.id)) {
            next = mergeMessageIntoThreads(next, m, currentUserId);
            known.add(m.id);
          }
        }
      }
      return next;
    });
  }, [conversations, currentUserId]);

  useEffect(() => {
    const es = new EventSource("/api/messages/stream");
    es.addEventListener("message", (ev) => {
      try {
        const message = JSON.parse(ev.data) as ThreadMessage;
        setThreads((prev) => mergeMessageIntoThreads(prev, message, currentUserId));
      } catch {
        // ignore
      }
    });
    return () => es.close();
  }, [currentUserId]);

  const active = useMemo(
    () => threads.find((c) => c.counterpartId === activeId) ?? null,
    [threads, activeId],
  );

  useEffect(() => {
    setPropertyCache((prev) => {
      let next = prev;
      let changed = false;
      for (const t of threads) {
        for (const p of t.properties) {
          if (!next[p.id]) {
            if (!changed) {
              next = { ...next };
              changed = true;
            }
            next[p.id] = p;
          }
        }
      }
      return changed ? next : prev;
    });

    const ids = new Set<string>();
    for (const t of threads) {
      for (const m of t.messages) {
        for (const a of parseAttachments(m.attachments)) {
          if (a.kind === "PROPERTY") ids.add(a.propertyId);
        }
      }
    }

    const knownIds = new Set(Object.keys(propertyCache));
    for (const t of threads) {
      for (const p of t.properties) knownIds.add(p.id);
    }
    const missing = [...ids].filter((id) => !knownIds.has(id));
    if (missing.length === 0) return;

    let cancelled = false;
    void getPropertiesByIds(missing).then((rows) => {
      if (cancelled || rows.length === 0) return;
      setPropertyCache((prev) => {
        const next = { ...prev };
        for (const p of rows) next[p.id] = p;
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [threads, propertyCache]);

  useEffect(() => {
    if (!activeId || !active) return;
    if (markedRef.current.has(activeId)) return;
    markedRef.current.add(activeId);
    setThreads((prev) =>
      prev.map((t) => (t.counterpartId === activeId ? { ...t, unread: 0 } : t)),
    );
    void markThreadRead(activeId);
  }, [activeId, active]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !active) return;
    el.scrollTop = el.scrollHeight;
  }, [active?.messages.length, activeId]);

  // Prevent background page scroll while the mobile inbox overlay is up
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const lock = () => {
      if (mq.matches) document.body.style.overflow = "hidden";
      else document.body.style.overflow = "";
    };
    lock();
    mq.addEventListener("change", lock);
    return () => {
      mq.removeEventListener("change", lock);
      document.body.style.overflow = "";
    };
  }, []);

  function openConversation(id: string) {
    markedRef.current.delete(id);
    setActiveId(id);
    setMobileChatOpen(true);
    setContent("");
    setPendingAttachments([]);
  }

  function closeMobileChat() {
    setMobileChatOpen(false);
  }

  async function uploadFile(file: File, kindHint: "IMAGE" | "DOCUMENT" | "AUDIO") {
    let prepared = file;
    if (kindHint === "IMAGE") prepared = await compressImageFile(file);
    if (kindHint === "AUDIO") prepared = await compressAudioFile(file);

    const fd = new FormData();
    fd.set("file", prepared);
    const result = await uploadChatAttachment(fd);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setPendingAttachments((prev) => [...prev, result.attachment]);
    toast.success("Attachment ready");
  }

  async function openListingPicker() {
    const rows = await getAgentListingsForChat();
    setOwnedListings(rows);
    setListingPickerOpen(true);
  }

  async function reply(e: React.FormEvent) {
    e.preventDefault();
    if (!active) return;
    const text = content.trim();
    if (!text && pendingAttachments.length === 0) return;
    setLoading(true);
    const result = await sendMessage({
      recipientId: active.counterpartId,
      content: text,
      attachments: pendingAttachments,
    });
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (result.message) {
      setThreads((prev) =>
        mergeMessageIntoThreads(prev, result.message as ThreadMessage, currentUserId),
      );
    }
    setContent("");
    setPendingAttachments([]);
  }

  async function sendPropertyRef(property: PropertySnippet) {
    if (!active) return;
    setListingPickerOpen(false);
    setLoading(true);
    const result = await sendMessage({
      recipientId: active.counterpartId,
      propertyId: property.id,
      content: `Shared listing: ${property.title}`,
      attachments: [{ kind: "PROPERTY", propertyId: property.id }],
    });
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (result.message) {
      setPropertyCache((prev) => ({ ...prev, [property.id]: property }));
      setThreads((prev) =>
        mergeMessageIntoThreads(prev, result.message as ThreadMessage, currentUserId),
      );
    }
  }

  if (threads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-card p-6 text-center text-sm text-muted-foreground">
        No messages yet.
      </div>
    );
  }

  const listPane = (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden bg-card max-lg:flex-1 lg:h-full lg:rounded-xl lg:border lg:border-border/60",
        mobileChatOpen ? "hidden lg:flex" : "flex",
      )}
    >
      <div className="shrink-0 border-b border-border px-3 py-2.5 lg:hidden">
        <p className="text-sm font-semibold">Messages</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {threads.map((c) => {
          const preview = propertyPreviewLabel(c.properties);
          return (
            <button
              key={c.counterpartId}
              type="button"
              onClick={() => openConversation(c.counterpartId)}
              className={cn(
                "w-full min-w-0 border-b border-border px-3 py-2.5 text-left transition",
                activeId === c.counterpartId ? "bg-primary/10" : "hover:bg-muted",
              )}
            >
              <p className="truncate text-sm font-medium">{c.counterpartName}</p>
              {preview && (
                <p className="truncate text-[11px] text-muted-foreground">Re: {preview}</p>
              )}
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{c.lastMessage}</p>
              {c.unread > 0 && (
                <span className="mt-1 inline-block rounded-full bg-success px-2 py-0.5 text-[10px] text-success-foreground">
                  {c.unread} new
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const chatPane = (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden bg-card max-lg:flex-1 lg:h-full lg:rounded-xl lg:border lg:border-border/60",
        mobileChatOpen ? "flex" : "hidden lg:flex",
      )}
    >
      {active ? (
        <>
          <div className="shrink-0 border-b border-border px-3 py-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 lg:hidden"
                onClick={closeMobileChat}
                aria-label="Back to conversations"
              >
                <ChevronLeft size={18} />
              </Button>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="truncate text-sm font-semibold">{active.counterpartName}</p>
                {propertyPreviewLabel(active.properties) && (
                  <p className="truncate text-[11px] text-muted-foreground">
                    Re: {propertyPreviewLabel(active.properties)}
                  </p>
                )}
              </div>
            </div>
            {active.properties.length > 0 && (
              <div className="mt-2 min-w-0">
                <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {active.properties.map((p) => (
                    <ChatPropertyCard
                      key={p.id}
                      property={p}
                      compact
                      className="w-[152px] shrink-0"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            ref={scrollerRef}
            className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-2"
          >
            {active.messages.map((m) => {
              const mine = m.senderId === currentUserId;
              const attachments = parseAttachments(m.attachments);
              const isPropertyOnly =
                attachments.length === 1 &&
                attachments[0].kind === "PROPERTY" &&
                (!m.content || m.content.startsWith("Shared listing"));

              return (
                <div
                  key={m.id}
                  className={cn(
                    "min-w-0 max-w-[min(82%,20.5rem)] space-y-1 sm:max-w-[82%]",
                    mine ? "ml-auto" : "mr-auto",
                  )}
                >
                  {m.content && !isPropertyOnly && (
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-1.5 text-sm leading-snug break-words [overflow-wrap:anywhere]",
                        mine ? "bg-primary text-primary-foreground" : "bg-muted",
                      )}
                    >
                      <p>{m.content}</p>
                      <p
                        className={cn(
                          "mt-0.5 text-[10px] leading-none",
                          mine ? "opacity-80" : "text-muted-foreground",
                        )}
                      >
                        {new Date(m.createdAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {attachments.map((a, i) => (
                    <AttachmentBubble
                      key={`${m.id}-${i}`}
                      attachment={a}
                      property={
                        a.kind === "PROPERTY" ? propertyCache[a.propertyId] : undefined
                      }
                      mine={mine}
                    />
                  ))}
                  {isPropertyOnly && (
                    <p
                      className={cn(
                        "px-1 text-[10px]",
                        mine ? "text-right text-muted-foreground" : "text-muted-foreground",
                      )}
                    >
                      {new Date(m.createdAt).toLocaleString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {pendingAttachments.length > 0 && (
            <div className="flex shrink-0 flex-wrap gap-2 border-t border-border/50 px-3 py-1.5">
              {pendingAttachments.map((a, i) => (
                <span
                  key={i}
                  className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px]"
                >
                  <span className="truncate">
                    {a.kind === "PROPERTY" ? "Listing" : a.kind.toLowerCase()}
                  </span>
                  <button
                    type="button"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setPendingAttachments((prev) => prev.filter((_, idx) => idx !== i))
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <form
            onSubmit={reply}
            className="shrink-0 border-t border-border bg-card px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
          >
            <div className="flex min-w-0 items-end gap-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0 rounded-full"
                  >
                    <Plus size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuItem onClick={() => photoInputRef.current?.click()}>
                    <ImageIcon size={14} className="mr-2" /> Photo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => docInputRef.current?.click()}>
                    <FileText size={14} className="mr-2" /> Document
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => audioInputRef.current?.click()}>
                    <Mic size={14} className="mr-2" /> Audio
                  </DropdownMenuItem>
                  {role === "AGENT" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => void openListingPicker()}>
                        <Home size={14} className="mr-2" /> Reference my listing
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={1}
                placeholder="Write a message…"
                className="max-h-24 min-h-9 min-w-0 flex-1 resize-none py-2"
              />
              <Button type="submit" size="sm" disabled={loading} className="h-9 shrink-0">
                {loading ? "…" : "Send"}
              </Button>
            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void uploadFile(f, "IMAGE");
              }}
            />
            <input
              ref={docInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,application/pdf,text/plain"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void uploadFile(f, "DOCUMENT");
              }}
            />
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void uploadFile(f, "AUDIO");
              }}
            />
          </form>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
          Select a conversation
        </div>
      )}
    </div>
  );

  return (
    <>
      <div
        className={cn(
          "min-w-0",
          // Mobile: explicit viewport height + flex so the compose bar stays visible
          "max-lg:fixed max-lg:left-0 max-lg:right-0 max-lg:top-14 max-lg:z-40 max-lg:flex max-lg:h-[calc(100dvh-3.5rem)] max-lg:flex-col max-lg:overflow-hidden max-lg:bg-background",
          "lg:relative lg:grid lg:h-[calc(100dvh-10.5rem)] lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-3 lg:overflow-hidden",
        )}
      >
        {listPane}
        {chatPane}
      </div>

      <Dialog open={listingPickerOpen} onOpenChange={setListingPickerOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reference a listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {ownedListings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No listings yet.</p>
            ) : (
              ownedListings.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full min-w-0 text-left"
                  onClick={() => void sendPropertyRef(p)}
                >
                  <ChatPropertyCard property={p} compact interactive={false} />
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AttachmentBubble({
  attachment,
  property,
  mine,
}: {
  attachment: ChatAttachment;
  property?: PropertySnippet;
  mine: boolean;
}) {
  if (attachment.kind === "PROPERTY") {
    if (!property) {
      return (
        <div className={cn("min-w-0 rounded-xl bg-muted px-3 py-2 text-xs", mine && "ml-auto")}>
          Loading property…
        </div>
      );
    }
    return (
      <ChatPropertyCard
        property={property}
        compact
        className={cn("min-w-0 max-w-full", mine && "ml-auto")}
      />
    );
  }

  if (attachment.kind === "IMAGE") {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "block min-w-0 max-w-full overflow-hidden rounded-xl border border-border/60 bg-card",
          mine && "ml-auto",
        )}
      >
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-h-48 w-full max-w-full object-cover"
        />
        <div className="flex min-w-0 items-center justify-between gap-2 px-2 py-1 text-[10px] text-muted-foreground">
          <span className="truncate">{attachment.name}</span>
          <Download size={12} className="shrink-0" />
        </div>
      </a>
    );
  }

  if (attachment.kind === "AUDIO") {
    return (
      <div
        className={cn(
          "min-w-0 max-w-full space-y-1 rounded-xl border border-border/60 bg-card px-3 py-2",
          mine && "ml-auto",
        )}
      >
        <audio controls preload="metadata" src={attachment.url} className="w-full max-w-full" />
        <a
          href={attachment.url}
          download={attachment.name}
          className="inline-flex max-w-full items-center gap-1 truncate text-[10px] text-primary hover:underline"
        >
          <Download size={12} className="shrink-0" />{" "}
          <span className="truncate">{attachment.name}</span>
        </a>
      </div>
    );
  }

  return (
    <a
      href={attachment.url}
      download={attachment.name}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 text-xs hover:bg-muted",
        mine && "ml-auto",
      )}
    >
      <Paperclip size={14} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate font-medium">{attachment.name}</span>
      <Download size={12} className="shrink-0 text-muted-foreground" />
    </a>
  );
}
