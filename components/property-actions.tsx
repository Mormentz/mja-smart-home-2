"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Heart,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { createBooking } from "@/lib/actions/bookings";
import { sendMessage } from "@/lib/actions/messages";
import { createLeaseDraft, activateLeaseWithEscrow } from "@/lib/actions/leases";
import { toggleSavedProperty } from "@/lib/actions/saved-properties";
import type { PropertyEngagement } from "@/lib/actions/property-engagement";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PropertyActionsProps = {
  propertyId: string;
  ownerId?: string;
  propertyTitle: string;
  propertyType: "For Sale" | "For Rent";
  monthlyPrice: number;
  currency?: string;
  verified?: boolean;
  initiallySaved?: boolean;
  engagement?: PropertyEngagement;
  escrowJustSecured?: boolean;
};

export function PropertyActions({
  propertyId,
  ownerId,
  propertyTitle,
  propertyType,
  monthlyPrice,
  currency,
  verified = false,
  initiallySaved = false,
  engagement,
  escrowJustSecured = false,
}: PropertyActionsProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [preferredDate, setPreferredDate] = useState("");
  const [message, setMessage] = useState(`Hi, I'm interested in ${propertyTitle}.`);
  const [showMessage, setShowMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(initiallySaved);

  const role = session?.user?.role;
  const isUser = role === "USER";
  const canSave = isUser || !session;

  const booking = engagement?.booking ?? null;
  const lease = engagement?.lease ?? null;
  const escrow = engagement?.escrow ?? null;
  const rentSecured =
    escrowJustSecured ||
    (lease?.status === "ACTIVE" && escrow?.status === "HELD") ||
    escrow?.status === "HELD";
  const escrowPending = escrow?.status === "PENDING" && !rentSecured;
  const hasOpenBooking = Boolean(booking);

  function requireLogin(callbackUrl: string) {
    router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  async function handleBook() {
    if (status !== "authenticated") {
      requireLogin(`/properties/${propertyId}`);
      return;
    }
    if (hasOpenBooking) {
      toast.message("You already have a booking for this property");
      return;
    }
    if (!preferredDate) {
      toast.error("Please select a preferred date");
      return;
    }
    setLoading(true);
    const kind =
      isUser && propertyType === "For Sale" ? "PURCHASE_INTEREST" : "TOUR";
    const result = await createBooking({ propertyId, preferredDate, kind });
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(kind === "PURCHASE_INTEREST" ? "Purchase interest submitted!" : "Tour request submitted!");
    router.refresh();
  }

  async function handleStartLease() {
    if (status !== "authenticated") {
      requireLogin(`/properties/${propertyId}`);
      return;
    }
    if (rentSecured) {
      toast.message("Rent escrow is already secured for this property");
      return;
    }
    setLoading(true);
    const start = new Date();
    const end = new Date();
    end.setFullYear(end.getFullYear() + 1);
    const draft = await createLeaseDraft({
      propertyId,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      monthlyRent: monthlyPrice,
    });
    if (("error" in draft && draft.error) || !("leaseId" in draft) || !draft.leaseId) {
      setLoading(false);
      toast.error(("error" in draft && draft.error) || "Could not create lease");
      if ("upgradeHref" in draft && draft.upgradeHref) {
        router.push(String(draft.upgradeHref));
      }
      return;
    }
    const funded = await activateLeaseWithEscrow(draft.leaseId);
    setLoading(false);
    if ("error" in funded && funded.error) {
      toast.error(funded.error);
      if ("upgradeHref" in funded && funded.upgradeHref) {
        router.push(String(funded.upgradeHref));
      }
      return;
    }
    if ("authorizationUrl" in funded && funded.authorizationUrl) {
      toast.message("Redirecting to Paystack…");
      window.location.assign(funded.authorizationUrl);
      return;
    }
    toast.success("Lease escrow started");
    router.refresh();
  }

  async function handleSave() {
    if (status !== "authenticated") {
      requireLogin(`/properties/${propertyId}`);
      return;
    }
    const result = await toggleSavedProperty(propertyId);
    if ("error" in result && result.error) {
      toast.error(result.error);
      if ("upgradeHref" in result && result.upgradeHref) {
        router.push(String(result.upgradeHref));
      }
      return;
    }
    if (!("saved" in result)) return;
    setSaved(Boolean(result.saved));
    toast.success(result.saved ? "Saved to your homes" : "Removed from saved");
  }

  async function handleMessage() {
    if (status !== "authenticated") {
      requireLogin(`/properties/${propertyId}`);
      return;
    }
    if (!ownerId) {
      toast.error("Property owner not available for messaging");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    setLoading(true);
    const result = await sendMessage({
      recipientId: ownerId,
      propertyId,
      content: message,
      attachments: [{ kind: "PROPERTY", propertyId }],
    });
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Message sent!");
    setShowMessage(false);
  }

  const primaryLabel =
    isUser && propertyType === "For Sale" ? "Express purchase interest" : "Book a tour";

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className={cn("flex min-w-0 items-center gap-2", verified ? "text-success" : "text-muted-foreground")}>
          {verified ? <ShieldCheck size={18} className="shrink-0" /> : <ShieldAlert size={18} className="shrink-0" />}
          <span className="text-sm font-semibold leading-snug">
            {verified ? "Verified listing" : "Verification pending / unverified"}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {canSave && (
            <button
              type="button"
              onClick={handleSave}
              aria-label={saved ? "Remove from saved homes" : "Save home"}
              title={saved ? "Saved" : "Save home"}
              className={cn(
                "grid h-9 w-9 place-items-center rounded-full border border-border/80 transition hover:bg-muted",
                saved && "border-primary/30 bg-primary/5 text-primary",
              )}
            >
              <Heart size={16} className={cn(saved && "fill-current")} strokeWidth={1.75} />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (status !== "authenticated") {
                requireLogin(`/properties/${propertyId}`);
                return;
              }
              setShowMessage((v) => !v);
            }}
            aria-label={session ? "Message agent" : "Sign in to message agent"}
            title={session ? "Message agent" : "Sign in to message"}
            className={cn(
              "grid h-9 w-9 place-items-center rounded-full border border-border/80 transition hover:bg-muted",
              showMessage && "border-primary/30 bg-primary/5 text-primary",
            )}
          >
            <MessageCircle size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <p className="mt-4 font-display text-3xl font-semibold text-primary">
        {formatMoney(monthlyPrice, { currency })}
        {propertyType === "For Rent" && (
          <span className="text-base font-normal text-muted-foreground"> /mo</span>
        )}
      </p>

      {(hasOpenBooking || rentSecured || escrowPending) && (
        <div className="mt-4 space-y-2">
          {hasOpenBooking && booking && (
            <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-950">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-700" />
              <div>
                <p className="font-medium">
                  {booking.kind === "PURCHASE_INTEREST" ? "Purchase interest submitted" : "Tour already booked"}
                </p>
                <p className="text-xs text-emerald-900/75">
                  Status: {booking.status.toLowerCase()} ·{" "}
                  {new Date(booking.preferredDate).toLocaleDateString()}
                </p>
                <Link href="/dashboard/bookings" className="mt-1 inline-block text-xs font-semibold underline">
                  View bookings
                </Link>
              </div>
            </div>
          )}
          {rentSecured && (
            <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-950">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-700" />
              <div>
                <p className="font-medium">Rent secured with escrow</p>
                <p className="text-xs text-emerald-900/75">
                  First month ({formatMoney(escrow?.amount ?? monthlyPrice, { currency })}) is held.
                </p>
                <Link href="/dashboard/leases" className="mt-1 inline-block text-xs font-semibold underline">
                  View lease & escrow
                </Link>
              </div>
            </div>
          )}
          {escrowPending && !rentSecured && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
              <p className="font-medium">Escrow payment pending</p>
              <p className="text-xs text-amber-900/75">Complete Paystack checkout to secure this rent.</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 space-y-3">
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Preferred date</span>
          <div className="mt-1 flex items-center gap-2 rounded-2xl border border-border px-4 py-3">
            <Calendar size={16} className="text-muted-foreground" />
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full bg-transparent outline-none"
              disabled={hasOpenBooking}
            />
          </div>
        </label>
        {session?.user && (
          <>
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Name</span>
              <input
                className="mt-1 w-full rounded-2xl border border-border px-4 py-3 bg-transparent outline-none"
                value={session.user.name ?? ""}
                readOnly
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Email</span>
              <input
                type="email"
                className="mt-1 w-full rounded-2xl border border-border px-4 py-3 bg-transparent outline-none"
                value={session.user.email ?? ""}
                readOnly
              />
            </label>
          </>
        )}
      </div>

      {showMessage && (
        <div className="mt-4 space-y-3 rounded-2xl border border-border/70 bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground">Message the agent</p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none"
          />
          <Button onClick={handleMessage} disabled={loading} className="w-full" size="sm">
            Send message
          </Button>
        </div>
      )}

      <button
        type="button"
        onClick={handleBook}
        disabled={loading || hasOpenBooking}
        className="mt-6 w-full rounded-2xl bg-primary py-4 font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
      >
        {hasOpenBooking
          ? booking?.kind === "PURCHASE_INTEREST"
            ? "Interest already submitted"
            : "Tour already booked"
          : loading
            ? "Submitting..."
            : session
              ? primaryLabel
              : "Sign in to continue"}
      </button>
      {isUser && propertyType === "For Rent" && (
        <button
          type="button"
          onClick={handleStartLease}
          disabled={loading || rentSecured}
          className="mt-2 w-full rounded-2xl bg-secondary py-4 font-semibold text-secondary-foreground transition hover:brightness-105 disabled:opacity-50"
        >
          {rentSecured
            ? "Rent already secured"
            : escrowPending
              ? "Continue Paystack payment"
              : loading
                ? "Starting checkout…"
                : "Secure rent with escrow"}
        </button>
      )}
    </>
  );
}
