"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { reportEmployer } from "@/lib/actions/job-privacy";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ReportEmployerButton({ employerUserId }: { employerUserId: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  if (done) {
    return <p className="mt-2 text-xs text-muted-foreground">Report submitted — our team will review it.</p>;
  }

  if (!open) {
    return (
      <Button type="button" size="sm" variant="ghost" className="mt-2 text-destructive" onClick={() => setOpen(true)}>
        Report employer
      </Button>
    );
  }

  return (
    <form
      className="mt-3 space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        const reason = String(new FormData(e.currentTarget).get("reason") || "").trim();
        if (reason.length < 10) {
          toast.error("Please describe the problem (at least 10 characters).");
          return;
        }
        start(async () => {
          const res = await reportEmployer(employerUserId, reason);
          if (!res.ok) {
            toast.error(res.error);
            return;
          }
          toast.success("Report submitted");
          setDone(true);
        });
      }}
    >
      <Label htmlFor={`report-${employerUserId}`}>What went wrong?</Label>
      <Textarea
        id={`report-${employerUserId}`}
        name="reason"
        rows={3}
        maxLength={1000}
        required
        placeholder="Scam attempt, harassment, fake job, asking for money…"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="destructive" disabled={pending}>
          {pending ? "Sending…" : "Submit report"}
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
