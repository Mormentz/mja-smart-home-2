"use client";

import { updateBookingStatus } from "@/lib/actions/bookings";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Booking = {
  id: string;
  preferredDate: Date;
  status: string;
  property: { title: string; location: string };
  user?: { name: string | null; email: string };
};

export function BookingList({ bookings, isOwner }: { bookings: Booking[]; isOwner: boolean }) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
        No bookings yet.
      </div>
    );
  }

  async function handleStatus(id: string, status: "APPROVED" | "CANCELLED") {
    const result = await updateBookingStatus(id, status);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Booking ${status.toLowerCase()}`);
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <div key={booking.id} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-semibold">{booking.property.title}</h3>
              <p className="text-sm text-muted-foreground">{booking.property.location}</p>
              <p className="mt-2 text-sm">
                Preferred date:{" "}
                <span className="font-medium">{new Date(booking.preferredDate).toLocaleDateString()}</span>
              </p>
              {isOwner && booking.user && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Requested by {booking.user.name ?? booking.user.email}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase">{booking.status}</span>
              {isOwner && booking.status === "PENDING" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleStatus(booking.id, "APPROVED")}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleStatus(booking.id, "CANCELLED")}>
                    Decline
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
