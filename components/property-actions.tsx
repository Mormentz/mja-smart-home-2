"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Calendar, Heart } from "lucide-react";
import { createBooking } from "@/lib/actions/bookings";
import { sendMessage } from "@/lib/actions/messages";
import { createLeaseDraft, activateLeaseWithEscrow } from "@/lib/actions/leases";
import { toggleSavedProperty } from "@/lib/actions/saved-properties";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type PropertyActionsProps = {
  propertyId: string;
  ownerId?: string;
  propertyTitle: string;
  propertyType: "For Sale" | "For Rent";
  monthlyPrice: number;
  initiallySaved?: boolean;
};

export function PropertyActions({
  propertyId,
  ownerId,
  propertyTitle,
  propertyType,
  monthlyPrice,
  initiallySaved = false,
}: PropertyActionsProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [preferredDate, setPreferredDate] = useState("");
  const [message, setMessage] = useState(`Hi, I'm interested in ${propertyTitle}.`);
  const [showMessage, setShowMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(initiallySaved);

  const role = session?.user?.role;
  const isBuyer = role === "BUYER";
  const isRenter = role === "RENTER";

  function requireLogin(callbackUrl: string) {
    router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  async function handleBook() {
    if (status !== "authenticated") {
      requireLogin(`/properties/${propertyId}`);
      return;
    }
    if (!preferredDate) {
      toast.error("Please select a preferred date");
      return;
    }
    setLoading(true);
    const kind = isBuyer && propertyType === "For Sale" ? "PURCHASE_INTEREST" : "TOUR";
    const result = await createBooking({ propertyId, preferredDate, kind });
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(kind === "PURCHASE_INTEREST" ? "Purchase interest submitted!" : "Tour request submitted!");
  }

  async function handleStartLease() {
    if (status !== "authenticated") {
      requireLogin(`/properties/${propertyId}`);
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
    if (draft.error || !draft.leaseId) {
      setLoading(false);
      toast.error(draft.error ?? "Could not create lease");
      return;
    }
    const funded = await activateLeaseWithEscrow(draft.leaseId);
    setLoading(false);
    if (funded.error) {
      toast.error(funded.error);
      return;
    }
    toast.success("Lease activated — first month held in escrow");
    router.push("/dashboard/leases");
  }

  async function handleSave() {
    if (status !== "authenticated") {
      requireLogin(`/properties/${propertyId}`);
      return;
    }
    const result = await toggleSavedProperty(propertyId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
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
    });
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Message sent!");
    setShowMessage(false);
  }

  const primaryLabel = isBuyer && propertyType === "For Sale"
    ? "Express purchase interest"
    : "Book a tour";

  return (
    <>
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
      <button
        type="button"
        onClick={handleBook}
        disabled={loading}
        className="mt-6 w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold hover:brightness-110 transition disabled:opacity-50"
      >
        {loading ? "Submitting..." : session ? primaryLabel : "Sign in to continue"}
      </button>
      {isRenter && propertyType === "For Rent" && (
        <button
          type="button"
          onClick={handleStartLease}
          disabled={loading}
          className="mt-2 w-full py-4 rounded-2xl bg-secondary text-secondary-foreground font-semibold hover:brightness-105 transition disabled:opacity-50"
        >
          Secure rent with escrow
        </button>
      )}
      {(isRenter || isBuyer || !session) && (
        <button
          type="button"
          onClick={handleSave}
          className="mt-2 w-full py-4 rounded-2xl border border-border font-semibold hover:bg-muted transition inline-flex items-center justify-center gap-2"
        >
          <Heart size={16} className={saved ? "fill-primary text-primary" : ""} />
          {saved ? "Saved" : "Save home"}
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
        className="mt-2 w-full py-4 rounded-2xl border border-border font-semibold hover:bg-muted transition"
      >
        {session ? "Message agent" : "Sign in to message agent"}
      </button>
      {showMessage && (
        <div className="mt-4 space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-border px-4 py-3 bg-transparent outline-none resize-none"
          />
          <Button onClick={handleMessage} disabled={loading} className="w-full">
            Send message
          </Button>
        </div>
      )}
    </>
  );
}
