"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Calendar } from "lucide-react";
import { createBooking } from "@/lib/actions/bookings";
import { sendMessage } from "@/lib/actions/messages";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type PropertyActionsProps = {
  propertyId: string;
  ownerId?: string;
  propertyTitle: string;
};

export function PropertyActions({ propertyId, ownerId, propertyTitle }: PropertyActionsProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [preferredDate, setPreferredDate] = useState("");
  const [message, setMessage] = useState(`Hi, I'm interested in ${propertyTitle}.`);
  const [showMessage, setShowMessage] = useState(false);
  const [loading, setLoading] = useState(false);

  function requireLogin(callbackUrl: string) {
    router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  async function handleBookTour() {
    if (status !== "authenticated") {
      requireLogin(`/properties/${propertyId}`);
      return;
    }
    if (!preferredDate) {
      toast.error("Please select a preferred date");
      return;
    }
    setLoading(true);
    const result = await createBooking({ propertyId, preferredDate });
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Tour request submitted!");
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
        onClick={handleBookTour}
        disabled={loading}
        className="mt-6 w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold hover:brightness-110 transition disabled:opacity-50"
      >
        {loading ? "Submitting..." : session ? "Book a tour" : "Sign in to book a tour"}
      </button>
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
