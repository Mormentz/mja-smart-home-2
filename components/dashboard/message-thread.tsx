"use client";

import { useState } from "react";
import { markMessageRead, sendMessage } from "@/lib/actions/messages";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Message = {
  id: string;
  content: string;
  createdAt: Date;
  readAt: Date | null;
  sender: { id: string; name: string | null; email: string };
  recipient: { id: string; name: string | null; email: string };
  property: { id: string; title: string } | null;
};

export function MessageList({
  messages,
  currentUserId,
}: {
  messages: Message[];
  currentUserId: string;
}) {
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyTo) return;
    setLoading(true);
    const result = await sendMessage({ recipientId: replyTo.id, content });
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Message sent");
    setContent("");
    setReplyTo(null);
  }

  async function handleMarkRead(id: string) {
    await markMessageRead(id);
  }

  if (messages.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
        No messages yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {messages.map((message) => {
          const isIncoming = message.recipient.id === currentUserId;
          const other = isIncoming ? message.sender : message.recipient;
          return (
            <div key={message.id} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{isIncoming ? `From ${other.name ?? other.email}` : `To ${other.name ?? other.email}`}</p>
                  {message.property && (
                    <p className="text-sm text-muted-foreground">Re: {message.property.title}</p>
                  )}
                  <p className="mt-3 text-sm leading-relaxed">{message.content}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{new Date(message.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  {isIncoming && !message.readAt && (
                    <Button size="sm" variant="outline" onClick={() => handleMarkRead(message.id)}>
                      Mark read
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => setReplyTo({ id: other.id, name: other.name ?? other.email })}
                  >
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {replyTo && (
        <form onSubmit={handleReply} className="rounded-3xl border border-border bg-card p-5 space-y-3">
          <p className="text-sm font-medium">Reply to {replyTo.name}</p>
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} required />
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send reply"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setReplyTo(null)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
