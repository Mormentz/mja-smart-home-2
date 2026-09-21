"use client";

import { useState } from "react";
import { completeMoveIn, createOrUpdateMoveIn } from "@/lib/actions/move-in";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type MoveIn = {
  id: string;
  moving: boolean;
  furnishing: boolean;
  utilities: boolean;
  status: string;
  notes: string | null;
  property: { id: string; title: string };
  leaseId: string | null;
};

type LeaseOption = { id: string; propertyId: string; property: { title: string } };

export function MoveInPanel({
  requests,
  leases,
}: {
  requests: MoveIn[];
  leases: LeaseOption[];
}) {
  const [propertyId, setPropertyId] = useState(leases[0]?.propertyId ?? "");
  const [leaseId, setLeaseId] = useState(leases[0]?.id ?? "");
  const [moving, setMoving] = useState(true);
  const [furnishing, setFurnishing] = useState(false);
  const [utilities, setUtilities] = useState(true);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!propertyId) {
      toast.error("Select a leased property");
      return;
    }
    setLoading(true);
    const result = await createOrUpdateMoveIn({
      propertyId,
      leaseId: leaseId || undefined,
      moving,
      furnishing,
      utilities,
      notes,
    });
    setLoading(false);
    if (result.error) toast.error(result.error);
    else toast.success("Move-in support updated");
  }

  async function done(id: string) {
    const result = await completeMoveIn(id);
    if (result.error) toast.error(result.error);
    else toast.success("Move-in marked done");
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-border bg-card p-6 space-y-4 max-w-xl">
        <h3 className="font-display text-lg font-semibold">Request move-in support</h3>
        <div className="space-y-2">
          <Label>Lease / property</Label>
          <select
            className="w-full h-10 rounded-md border border-input px-3"
            value={leaseId}
            onChange={(e) => {
              const lease = leases.find((l) => l.id === e.target.value);
              setLeaseId(e.target.value);
              if (lease) setPropertyId(lease.propertyId);
            }}
          >
            {leases.length === 0 && <option value="">No active leases</option>}
            {leases.map((l) => (
              <option key={l.id} value={l.id}>
                {l.property.title}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={moving} onChange={(e) => setMoving(e.target.checked)} />
          Moving help
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={furnishing} onChange={(e) => setFurnishing(e.target.checked)} />
          Furnishing
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={utilities} onChange={(e) => setUtilities(e.target.checked)} />
          Utilities setup
        </label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" rows={3} />
        <Button onClick={submit} disabled={loading || leases.length === 0}>
          {loading ? "Saving..." : "Save checklist"}
        </Button>
      </div>

      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border p-4 flex flex-wrap justify-between gap-3">
            <div>
              <p className="font-semibold">{r.property.title}</p>
              <p className="text-sm text-muted-foreground">{r.status}</p>
              <p className="text-xs mt-1">
                {[r.moving && "Moving", r.furnishing && "Furnishing", r.utilities && "Utilities"]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {r.notes && <p className="text-sm mt-1">{r.notes}</p>}
            </div>
            {r.status !== "DONE" && (
              <Button size="sm" variant="outline" onClick={() => done(r.id)}>
                Mark done
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
