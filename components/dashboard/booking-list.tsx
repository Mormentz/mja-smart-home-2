"use client";

import { useState } from "react";
import Link from "next/link";
import { updateBookingStatus, cancelOwnBooking } from "@/lib/actions/bookings";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { imageSrc, resolveImage } from "@/lib/properties";
import { toast } from "sonner";

type Booking = {
  id: string;
  preferredDate: Date;
  status: string;
  kind?: string;
  property: {
    id: string;
    title: string;
    location: string;
    image: string;
    price?: number;
    type?: string;
  };
  user?: { name: string | null; email: string };
};

export function BookingList({ bookings, isOwner }: { bookings: Booking[]; isOwner: boolean }) {
  const [selected, setSelected] = useState<Booking | null>(null);

  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
        No bookings yet.
      </div>
    );
  }

  async function handleOwnerStatus(id: string, status: "APPROVED" | "CANCELLED") {
    const result = await updateBookingStatus(id, status);
    if (result.error) toast.error(result.error);
    else toast.success(`Booking ${status.toLowerCase()}`);
  }

  async function handleCancelOwn(id: string) {
    const result = await cancelOwnBooking(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Booking cancelled");
      setSelected(null);
    }
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {bookings.map((booking) => {
          const img = imageSrc(resolveImage(booking.property.image));
          return (
            <article
              key={booking.id}
              className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="aspect-[16/10] w-full object-cover" />
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display font-semibold leading-tight line-clamp-2">
                      {booking.property.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {booking.property.location}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
                    {booking.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {(booking.kind ?? "TOUR").replace("_", " ")} ·{" "}
                  {new Date(booking.preferredDate).toLocaleDateString()}
                </p>
                {isOwner && booking.user && (
                  <p className="text-xs">Requester: {booking.user.name ?? booking.user.email}</p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setSelected(booking)}>
                    Details
                  </Button>
                  <Button size="sm" variant="secondary" className="h-8 text-xs" asChild>
                    <Link href={`/properties/${booking.property.id}`}>View property</Link>
                  </Button>
                  {isOwner && booking.status === "PENDING" && (
                    <>
                      <Button
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => handleOwnerStatus(booking.id, "APPROVED")}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => handleOwnerStatus(booking.id, "CANCELLED")}
                      >
                        Decline
                      </Button>
                    </>
                  )}
                  {!isOwner && booking.status === "PENDING" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => handleCancelOwn(booking.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.property.title}</SheetTitle>
                <SheetDescription>{selected.property.location}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc(resolveImage(selected.property.image))}
                  alt=""
                  className="aspect-video w-full rounded-xl object-cover"
                />
                <p>
                  <span className="text-muted-foreground">Type:</span>{" "}
                  {(selected.kind ?? "TOUR").replace("_", " ")}
                </p>
                <p>
                  <span className="text-muted-foreground">Date:</span>{" "}
                  {new Date(selected.preferredDate).toLocaleString()}
                </p>
                <p>
                  <span className="text-muted-foreground">Status:</span> {selected.status}
                </p>
                {selected.property.price != null && (
                  <p>
                    <span className="text-muted-foreground">Listed at:</span> ₦
                    {selected.property.price.toLocaleString()}
                  </p>
                )}
                {isOwner && selected.user && (
                  <p>
                    <span className="text-muted-foreground">Requester:</span>{" "}
                    {selected.user.name ?? selected.user.email}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button asChild>
                    <Link href={`/properties/${selected.property.id}`}>Open listing</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/messages">Messages</Link>
                  </Button>
                  {!isOwner && selected.status === "PENDING" && (
                    <Button variant="destructive" onClick={() => handleCancelOwn(selected.id)}>
                      Cancel request
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
