"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function AdminRejectDialog({
  open,
  onOpenChange,
  title = "Reject",
  description = "Provide a reason for rejection. This may be shown to the user.",
  requireNote = true,
  confirmLabel = "Reject",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  requireNote?: boolean;
  confirmLabel?: string;
  onConfirm: (note: string) => Promise<void> | void;
}) {
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (requireNote && !note.trim()) return;
    setPending(true);
    try {
      await onConfirm(note.trim());
      setNote("");
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reject-note">Note{requireNote ? " (required)" : " (optional)"}</Label>
          <Textarea
            id="reject-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Reason for rejection…"
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={submit}
            disabled={pending || (requireNote && !note.trim())}
          >
            {pending ? "Saving…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
