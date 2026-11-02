"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { completeMoveIn, createOrUpdateMoveIn } from "@/lib/actions/move-in";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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

const STEPS = ["Pick lease", "Choose support", "Confirm"] as const;

export function MoveInPanel({
  requests,
  leases,
}: {
  requests: MoveIn[];
  leases: LeaseOption[];
}) {
  const [step, setStep] = useState(0);
  const [propertyId, setPropertyId] = useState(leases[0]?.propertyId ?? "");
  const [leaseId, setLeaseId] = useState(leases[0]?.id ?? "");
  const [moving, setMoving] = useState(true);
  const [furnishing, setFurnishing] = useState(false);
  const [utilities, setUtilities] = useState(true);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedLease = leases.find((l) => l.id === leaseId);

  async function submit() {
    if (!propertyId || !leaseId) {
      toast.error("Select a leased property first");
      return;
    }
    setLoading(true);
    const result = await createOrUpdateMoveIn({
      propertyId,
      leaseId,
      moving,
      furnishing,
      utilities,
      notes,
    });
    setLoading(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Move-in support saved");
      setStep(0);
    }
  }

  async function done(id: string) {
    const result = await completeMoveIn(id);
    if (result.error) toast.error(result.error);
    else toast.success("Move-in marked done");
  }

  if (leases.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <h3 className="font-display text-lg font-semibold">Sign a lease first</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Move-in support (moving, furnishing, utilities) is available after you have an active or draft lease.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/properties">Browse homes</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/leases">View leases</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
                i === step
                  ? "border-primary bg-primary text-primary-foreground"
                  : i < step
                    ? "border-success bg-success/15 text-success"
                    : "border-border text-muted-foreground",
              )}
            >
              {i < step ? <Check size={14} /> : i + 1}
            </span>
            <span className={cn(i === step ? "font-semibold" : "text-muted-foreground")}>{label}</span>
            {i < STEPS.length - 1 && <ChevronRight size={14} className="text-muted-foreground" />}
          </div>
        ))}
      </div>

      <div className="max-w-xl rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-lg font-semibold">Which home are you moving into?</h3>
              <p className="mt-1 text-sm text-muted-foreground">Choose a lease linked to your account.</p>
            </div>
            <div className="space-y-2">
              <Label>Lease</Label>
              <select
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                value={leaseId}
                onChange={(e) => {
                  const lease = leases.find((l) => l.id === e.target.value);
                  setLeaseId(e.target.value);
                  if (lease) setPropertyId(lease.propertyId);
                }}
              >
                {leases.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.property.title}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={() => setStep(1)} disabled={!leaseId}>
              Continue
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-lg font-semibold">What support do you need?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                For {selectedLease?.property.title ?? "your home"}
              </p>
            </div>
            <label className="flex items-center gap-3 rounded-xl border px-3 py-3 text-sm">
              <input type="checkbox" checked={moving} onChange={(e) => setMoving(e.target.checked)} />
              Moving help
            </label>
            <label className="flex items-center gap-3 rounded-xl border px-3 py-3 text-sm">
              <input type="checkbox" checked={furnishing} onChange={(e) => setFurnishing(e.target.checked)} />
              Furnishing
            </label>
            <label className="flex items-center gap-3 rounded-xl border px-3 py-3 text-sm">
              <input type="checkbox" checked={utilities} onChange={(e) => setUtilities(e.target.checked)} />
              Utilities setup
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else we should know?"
              rows={3}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button onClick={() => setStep(2)}>Review</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-lg font-semibold">Confirm request</h3>
              <p className="mt-1 text-sm text-muted-foreground">We’ll track this against your lease.</p>
            </div>
            <ul className="space-y-1 text-sm">
              <li>
                <span className="text-muted-foreground">Home:</span> {selectedLease?.property.title}
              </li>
              <li>
                <span className="text-muted-foreground">Support:</span>{" "}
                {[moving && "Moving", furnishing && "Furnishing", utilities && "Utilities"]
                  .filter(Boolean)
                  .join(", ") || "None selected"}
              </li>
              {notes && (
                <li>
                  <span className="text-muted-foreground">Notes:</span> {notes}
                </li>
              )}
            </ul>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={submit} disabled={loading}>
                {loading ? "Saving…" : "Submit move-in request"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {requests.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display text-base font-semibold">Your move-in requests</h3>
          {requests.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{r.property.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {r.status}
                  {" · "}
                  {[r.moving && "Moving", r.furnishing && "Furnishing", r.utilities && "Utilities"]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {r.notes && <p className="mt-0.5 text-xs text-muted-foreground">{r.notes}</p>}
              </div>
              {r.status !== "DONE" && (
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => done(r.id)}>
                  Mark done
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
