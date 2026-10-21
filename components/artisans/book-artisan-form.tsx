"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createServiceJob } from "@/lib/actions/service-jobs";
import { formatMoney } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function BookArtisanForm({
  artisanId,
  available,
}: {
  artisanId: string;
  available: boolean;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState(2);
  const [urgency, setUrgency] = useState<"NORMAL" | "EMERGENCY">("NORMAL");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (status !== "authenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/artisans/${artisanId}`)}`);
      return;
    }
    setLoading(true);
    const result = await createServiceJob({
      artisanId,
      description,
      estimatedHours: hours,
      urgency,
    });
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(
      `Job booked — estimate ${formatMoney(result.priceEstimate)}, ETA ~${result.etaMinutes} min (held in escrow)`,
    );
    router.push("/dashboard/jobs");
  }

  return (
    <div className="rounded-3xl border border-border p-6 space-y-4">
      <h3 className="font-display text-xl font-semibold">Book this artisan</h3>
      {!available && (
        <p className="text-sm text-destructive">Currently unavailable — you can still request, but they may decline.</p>
      )}
      <div className="space-y-2">
        <Label>What do you need?</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Estimated hours</Label>
          <Input type="number" min={0.5} step={0.5} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Urgency</Label>
          <select
            className="w-full h-10 rounded-md border border-input px-3"
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as "NORMAL" | "EMERGENCY")}
          >
            <option value="NORMAL">Normal</option>
            <option value="EMERGENCY">Emergency fix</option>
          </select>
        </div>
      </div>
      <Button onClick={submit} disabled={loading || description.length < 10} className="w-full">
        {loading ? "Booking..." : urgency === "EMERGENCY" ? "Request emergency fix" : "Book with escrow"}
      </Button>
    </div>
  );
}
