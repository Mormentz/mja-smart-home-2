"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  acceptRentalBooking,
  acknowledgeHandover,
  completeReturn,
  openRentalDispute,
  uploadBookingConditionPhoto,
} from "@/lib/actions/equipment-rentals";
import {
  EQUIPMENT_CONDITIONS,
  RENTAL_DISPUTE_TYPES,
  type EquipmentConditionValue,
  type RentalDisputeTypeValue,
} from "@/lib/rentals/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Panel = "handover" | "return" | "dispute" | null;

export function EquipmentBookingActions({
  bookingId,
  status,
  role,
  handoverAcked = false,
}: {
  bookingId: string;
  status: string;
  /** Viewer's role on this booking. */
  role: "owner" | "customer";
  /** Whether the viewer has already acknowledged handover. */
  handoverAcked?: boolean;
}) {
  const [pending, start] = useTransition();
  const [panel, setPanel] = useState<Panel>(null);
  const toggle = (next: Exclude<Panel, null>) => setPanel((p) => (p === next ? null : next));

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap gap-2">
        {status === "REQUESTED" && role === "owner" && (
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await acceptRentalBooking(bookingId);
                if (!res.ok) toast.error(res.error);
                else toast.success("Accepted — payment hold created");
              })
            }
          >
            Accept & hold payment
          </Button>
        )}
        {["CONFIRMED", "HANDOVER"].includes(status) && !handoverAcked && (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => toggle("handover")}>
            Handover checklist
          </Button>
        )}
        {["CONFIRMED", "HANDOVER"].includes(status) && handoverAcked && (
          <span className="self-center text-xs text-muted-foreground">
            Your handover checklist is recorded — waiting for the other party.
          </span>
        )}
        {["ACTIVE", "RETURN_PENDING"].includes(status) && (
          <Button size="sm" disabled={pending} onClick={() => toggle("return")}>
            Return checklist
          </Button>
        )}
        {!["DISPUTED", "CANCELLED"].includes(status) && (
          <Button size="sm" variant="destructive" disabled={pending} onClick={() => toggle("dispute")}>
            Open dispute
          </Button>
        )}
      </div>

      {panel === "handover" && (
        <ConditionChecklist
          bookingId={bookingId}
          title={role === "owner" ? "Owner handover checklist" : "Customer handover checklist"}
          description="Record the equipment's condition and take photos before it changes hands."
          submitLabel="Confirm handover"
          photosRequired
          onSubmit={async (v) => {
            const res = await acknowledgeHandover(bookingId, role, {
              condition: v.condition,
              accessories: v.accessories,
              notes: v.notes || undefined,
              photos: v.photos,
            });
            if (!res.ok) {
              toast.error(res.error);
              return false;
            }
            toast.success(role === "owner" ? "Owner handover recorded" : "Customer handover recorded");
            return true;
          }}
          onDone={() => setPanel(null)}
        />
      )}

      {panel === "return" && (
        <ConditionChecklist
          bookingId={bookingId}
          title="Return checklist"
          description="Record the condition on return. Describing damage moves the booking to dispute and holds the deposit."
          submitLabel="Complete return"
          notesLabel="Damage or issues (leave blank if none)"
          notesIsDamage
          onSubmit={async (v) => {
            const res = await completeReturn(bookingId, {
              condition: v.condition,
              accessoriesOk: v.accessories,
              damageNote: v.notes || undefined,
              photos: v.photos,
            });
            if (!res.ok) {
              toast.error(res.error);
              return false;
            }
            toast.success(v.notes ? "Return recorded — deposit held pending review" : "Return completed — deposit released");
            return true;
          }}
          onDone={() => setPanel(null)}
        />
      )}

      {panel === "dispute" && <DisputeForm bookingId={bookingId} onDone={() => setPanel(null)} />}
    </div>
  );
}

type ChecklistValues = {
  condition: EquipmentConditionValue;
  accessories: boolean;
  notes: string;
  photos: string[];
};

function ConditionChecklist({
  bookingId,
  title,
  description,
  submitLabel,
  notesLabel = "Notes (scratches, missing items, meter readings…)",
  notesIsDamage = false,
  photosRequired = false,
  onSubmit,
  onDone,
}: {
  bookingId: string;
  title: string;
  description: string;
  submitLabel: string;
  notesLabel?: string;
  /** When true, any note is treated as a damage report, so photos become required. */
  notesIsDamage?: boolean;
  photosRequired?: boolean;
  onSubmit: (values: ChecklistValues) => Promise<boolean>;
  onDone: () => void;
}) {
  const [pending, start] = useTransition();
  const idPrefix = `chk-${bookingId}-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <form
      className="space-y-3 rounded-xl border border-border/70 bg-muted/30 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const condition = String(fd.get("condition") || "") as EquipmentConditionValue | "";
        if (!condition) {
          toast.error("Select the equipment condition.");
          return;
        }
        const notes = String(fd.get("notes") || "").trim();
        const files = fd.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
        if ((photosRequired || (notesIsDamage && notes)) && files.length === 0) {
          toast.error("Add at least one photo of the equipment.");
          return;
        }
        start(async () => {
          const urls: string[] = [];
          for (const file of files.slice(0, 6)) {
            const up = new FormData();
            up.set("file", file);
            const res = await uploadBookingConditionPhoto(bookingId, up);
            if (!res.ok) {
              toast.error(`Photo upload failed: ${res.error}`);
              return;
            }
            urls.push(res.url);
          }
          const ok = await onSubmit({
            condition,
            accessories: fd.get("accessories") === "on",
            notes,
            photos: urls,
          });
          if (ok) onDone();
        });
      }}
    >
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-condition`}>Equipment condition</Label>
        <select
          id={`${idPrefix}-condition`}
          name="condition"
          required
          defaultValue=""
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select condition…
          </option>
          {EQUIPMENT_CONDITIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="accessories" /> All listed accessories are present and working
      </label>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-notes`}>{notesLabel}</Label>
        <Textarea id={`${idPrefix}-notes`} name="notes" rows={2} maxLength={1000} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-photos`}>
          Photos{photosRequired ? "" : notesIsDamage ? " (required if you report damage)" : " (optional)"}
        </Label>
        <Input
          id={`${idPrefix}-photos`}
          name="photos"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
        />
        <p className="text-xs text-muted-foreground">Up to 6 images, 8MB each.</p>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function DisputeForm({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const [pending, start] = useTransition();
  const idPrefix = `dispute-${bookingId}`;

  return (
    <form
      className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const type = String(fd.get("type") || "") as RentalDisputeTypeValue | "";
        const description = String(fd.get("description") || "").trim();
        if (!type) {
          toast.error("Select a dispute type.");
          return;
        }
        if (description.length < 10) {
          toast.error("Please describe the problem (at least 10 characters).");
          return;
        }
        start(async () => {
          const res = await openRentalDispute(bookingId, type, description);
          if (!res.ok) {
            toast.error(res.error);
            return;
          }
          toast.message("Dispute opened — HomeConnect will review it");
          onDone();
        });
      }}
    >
      <p className="text-sm font-semibold">Open a dispute</p>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-type`}>What is the dispute about?</Label>
        <select
          id={`${idPrefix}-type`}
          name="type"
          required
          defaultValue=""
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select dispute type…
          </option>
          {RENTAL_DISPUTE_TYPES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-description`}>Details</Label>
        <Textarea id={`${idPrefix}-description`} name="description" rows={3} maxLength={2000} required />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="destructive" disabled={pending}>
          {pending ? "Submitting…" : "Submit dispute"}
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
