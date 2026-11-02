"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { requestContactCandidate } from "@/lib/actions/employer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ContactRequestForm({ seekerProfileId }: { seekerProfileId: string }) {
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await requestContactCandidate({
            seekerProfileId,
            message: String(fd.get("message")),
            jobOpportunity: String(fd.get("jobOpportunity") || "") || undefined,
          });
          if (!res.ok) toast.error(res.error);
          else toast.success("Contact request sent");
        });
      }}
    >
      <p className="text-sm font-semibold">Request to contact candidate</p>
      <div className="space-y-2">
        <Label htmlFor="jobOpportunity">Job opportunity</Label>
        <Input id="jobOpportunity" name="jobOpportunity" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" required rows={3} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Request to contact"}
      </Button>
    </form>
  );
}
