"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { decideEquipmentListing, decideOwnerIdentity } from "@/lib/actions/equipment-rentals";
import {
  markRentalDisputeUnderReview,
  resolveRentalDispute,
  setAdminListingSuspended,
  updateAdminBookingStatus,
} from "@/lib/actions/admin-rentals";
import { AdminRejectDialog } from "@/components/admin/admin-reject-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const BOOKING_STATUSES = [
  "REQUESTED",
  "ACCEPTED",
  "PAYMENT_PENDING",
  "CONFIRMED",
  "HANDOVER",
  "ACTIVE",
  "RETURN_PENDING",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
] as const;

type BookingStatus = (typeof BOOKING_STATUSES)[number];

export function ListingDecisionActions({
  listingId,
  status,
  compact,
}: {
  listingId: string;
  status: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const size = compact ? "sm" : "default";

  const canDecide = status === "PENDING_REVIEW" || status === "DRAFT" || status === "REJECTED";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canDecide && status !== "REJECTED" && (
        <Button
          size={size}
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await decideEquipmentListing(listingId, {
                approve: true,
                ownershipReviewed: true,
                equipmentInspected: true,
                functionalityTested: false,
              });
              if (r.error) toast.error(r.error);
              else {
                toast.success("Listing approved");
                router.refresh();
              }
            })
          }
        >
          Approve
        </Button>
      )}
      {status === "REJECTED" && (
        <Button
          size={size}
          variant="outline"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await decideEquipmentListing(listingId, {
                approve: true,
                ownershipReviewed: true,
                equipmentInspected: true,
              });
              if (r.error) toast.error(r.error);
              else {
                toast.success("Listing approved");
                router.refresh();
              }
            })
          }
        >
          Re-approve
        </Button>
      )}
      {canDecide && status !== "REJECTED" && (
        <Button size={size} variant="outline" disabled={pending} onClick={() => setRejectOpen(true)}>
          Reject
        </Button>
      )}
      {status === "APPROVED" && (
        <Button size={size} variant="outline" disabled={pending} onClick={() => setSuspendOpen(true)}>
          Suspend
        </Button>
      )}
      {status === "SUSPENDED" && (
        <Button
          size={size}
          variant="outline"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await setAdminListingSuspended(listingId, false);
              if (r.error) toast.error(r.error);
              else {
                toast.success("Listing reinstated");
                router.refresh();
              }
            })
          }
        >
          Reinstate
        </Button>
      )}

      <AdminRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject equipment listing"
        description="Explain why this listing was rejected (e.g. stock photos, unsafe equipment)."
        onConfirm={async (note) => {
          const r = await decideEquipmentListing(listingId, { approve: false, note });
          if (r.error) toast.error(r.error);
          else {
            toast.message("Listing rejected");
            router.refresh();
          }
        }}
      />
      <AdminRejectDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title="Suspend listing"
        description="The listing will be hidden from browse until reinstated."
        confirmLabel="Suspend"
        onConfirm={async (note) => {
          const r = await setAdminListingSuspended(listingId, true, note);
          if (r.error) toast.error(r.error);
          else {
            toast.message("Listing suspended");
            router.refresh();
          }
        }}
      />
    </div>
  );
}

export function OwnerDecisionActions({ ownerId, compact }: { ownerId: string; compact?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const size = compact ? "sm" : "default";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size={size}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await decideOwnerIdentity(ownerId, true);
            if (r.error) toast.error(r.error);
            else {
              toast.success("Owner verified");
              router.refresh();
            }
          })
        }
      >
        Verify
      </Button>
      <Button size={size} variant="outline" disabled={pending} onClick={() => setRejectOpen(true)}>
        Reject
      </Button>
      <AdminRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject owner identity"
        onConfirm={async (note) => {
          const r = await decideOwnerIdentity(ownerId, false, note);
          if (r.error) toast.error(r.error);
          else {
            toast.message("Owner rejected");
            router.refresh();
          }
        }}
      />
    </div>
  );
}

export function BookingStatusControl({
  bookingId,
  status,
}: {
  bookingId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [value, setValue] = useState<BookingStatus>(
    (BOOKING_STATUSES as readonly string[]).includes(status) ? (status as BookingStatus) : "REQUESTED",
  );
  const [note, setNote] = useState("");

  return (
    <div className="space-y-2">
      <Label>Set booking status</Label>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          value={value}
          onChange={(e) => setValue(e.target.value as BookingStatus)}
        >
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ").toLowerCase()}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          disabled={pending || value === status}
          onClick={() =>
            start(async () => {
              const r = await updateAdminBookingStatus(bookingId, value, note.trim() || undefined);
              if (r.error) toast.error(r.error);
              else {
                toast.success("Booking updated");
                setNote("");
                router.refresh();
              }
            })
          }
        >
          Apply
        </Button>
      </div>
      <Textarea
        rows={2}
        placeholder="Optional note (stored in audit log)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
    </div>
  );
}

export function DisputeResolveForm({
  disputeId,
  status,
  existingResolution,
  bookingStatus,
}: {
  disputeId: string;
  status: string;
  existingResolution?: string | null;
  bookingStatus: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [resolution, setResolution] = useState(existingResolution ?? "");
  const [outcome, setOutcome] = useState<"RESOLVED" | "CLOSED">("RESOLVED");
  const [bookingNext, setBookingNext] = useState<"" | "COMPLETED" | "CANCELLED" | "ACTIVE" | "RETURN_PENDING">("");

  const isOpen = status === "OPEN" || status === "UNDER_REVIEW";

  if (!isOpen) {
    return (
      <div className="space-y-1 text-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Resolution</p>
        <p className="whitespace-pre-wrap">{existingResolution || "No notes recorded."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {status === "OPEN" && (
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await markRentalDisputeUnderReview(disputeId);
              if (r.error) toast.error(r.error);
              else {
                toast.success("Marked under review");
                router.refresh();
              }
            })
          }
        >
          Mark under review
        </Button>
      )}
      <div className="space-y-1">
        <Label htmlFor="dispute-resolution">Resolution notes</Label>
        <Textarea
          id="dispute-resolution"
          rows={4}
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          placeholder="Describe the outcome (refund, deposit retained, warning issued…)"
        />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label>Outcome</Label>
          <select
            className="h-9 rounded-md border border-border bg-background px-3 text-sm"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as "RESOLVED" | "CLOSED")}
          >
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed (no action)</option>
          </select>
        </div>
        {bookingStatus === "DISPUTED" && (
          <div className="space-y-1">
            <Label>Then set booking to</Label>
            <select
              className="h-9 rounded-md border border-border bg-background px-3 text-sm"
              value={bookingNext}
              onChange={(e) => setBookingNext(e.target.value as typeof bookingNext)}
            >
              <option value="">Auto (return pending)</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="ACTIVE">Active</option>
              <option value="RETURN_PENDING">Return pending</option>
            </select>
          </div>
        )}
        <Button
          disabled={pending || resolution.trim().length < 3}
          onClick={() =>
            start(async () => {
              const r = await resolveRentalDispute(disputeId, {
                status: outcome,
                resolution,
                bookingStatus: bookingNext || undefined,
              });
              if (r.error) toast.error(r.error);
              else {
                toast.success("Dispute updated");
                router.refresh();
              }
            })
          }
        >
          {pending ? "Saving…" : "Save resolution"}
        </Button>
      </div>
    </div>
  );
}
