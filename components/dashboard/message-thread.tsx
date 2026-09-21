"use client";

import { useEffect, useMemo, useState } from "react";
import { markThreadRead, sendMessage, type Conversation } from "@/lib/actions/messages";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ConversationInbox({
  conversations,
  currentUserId,
}: {
  conversations: Conversation[];
  currentUserId: string;
}) {
  const [activeKey, setActiveKey] = useState<string | null>(
    conversations[0]
      ? `${conversations[0].counterpartId}:${conversations[0].propertyId ?? "none"}`
      : null,
  );
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const active = useMemo(
    () =>
      conversations.find(
        (c) => `${c.counterpartId}:${c.propertyId ?? "none"}` === activeKey,
      ) ?? null,
    [conversations, activeKey],
  );

  useEffect(() => {
    if (!active) return;
    void markThreadRead(active.counterpartId, active.propertyId);
  }, [active]);

  async function reply(e: React.FormEvent) {
    e.preventDefault();
    if (!active) return;
    setLoading(true);
    const result = await sendMessage({
      recipientId: active.counterpartId,
      propertyId: active.propertyId ?? undefined,
      content,
    });
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Message sent");
    setContent("");
  }

  if (conversations.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
        No messages yet.
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-4 min-h-[420px]">
      <div className="rounded-2xl border border-border overflow-hidden">
        {conversations.map((c) => {
          const key = `${c.counterpartId}:${c.propertyId ?? "none"}`;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveKey(key)}
              className={cn(
                "w-full text-left px-4 py-3 border-b border-border transition",
                activeKey === key ? "bg-primary/10" : "hover:bg-muted",
              )}
            >
              <p className="font-medium text-sm truncate">{c.counterpartName}</p>
              {c.propertyTitle && (
                <p className="text-xs text-muted-foreground truncate">Re: {c.propertyTitle}</p>
              )}
              <p className="text-xs text-muted-foreground truncate mt-1">{c.lastMessage}</p>
              {c.unread > 0 && (
                <span className="mt-1 inline-block text-[10px] rounded-full bg-success text-success-foreground px-2 py-0.5">
                  {c.unread} new
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border flex flex-col">
        {active ? (
          <>
            <div className="border-b border-border px-4 py-3">
              <p className="font-semibold">{active.counterpartName}</p>
              {active.propertyTitle && (
                <p className="text-xs text-muted-foreground">Re: {active.propertyTitle}</p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[360px]">
              {active.messages.map((m) => {
                const mine = m.senderId === currentUserId;
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                      mine ? "ml-auto bg-primary text-primary-foreground" : "bg-muted",
                    )}
                  >
                    <p>{m.content}</p>
                    <p className={cn("text-[10px] mt-1", mine ? "opacity-80" : "text-muted-foreground")}>
                      {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
            <form onSubmit={reply} className="border-t border-border p-4 space-y-2">
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} required />
              <Button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send"}
              </Button>
            </form>
          </>
        ) : (
          <div className="p-10 text-center text-muted-foreground">Select a conversation</div>
        )}
      </div>
    </div>
  );
}
