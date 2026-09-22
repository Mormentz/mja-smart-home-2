"use client";

import { updateBookingStatus } from "@/lib/actions/bookings";
import { Button } from "@/components/ui/button";
import {
  DashboardDataTable,
  DashboardEmptyState,
  DashboardTableCell,
  DashboardTableHead,
  Table,
  TableBody,
  TableHeader,
  TableRow,
} from "@/components/dashboard/dashboard-data-table";
import { toast } from "sonner";

type Booking = {
  id: string;
  preferredDate: Date;
  status: string;
  kind?: string;
  property: { title: string; location: string };
  user?: { name: string | null; email: string };
};

export function BookingList({ bookings, isOwner }: { bookings: Booking[]; isOwner: boolean }) {
  if (bookings.length === 0) {
    return <DashboardEmptyState>No bookings yet.</DashboardEmptyState>;
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
    <DashboardDataTable>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DashboardTableHead>Property</DashboardTableHead>
            <DashboardTableHead>Type</DashboardTableHead>
            <DashboardTableHead>Date</DashboardTableHead>
            <DashboardTableHead>{isOwner ? "Requester" : "Status"}</DashboardTableHead>
            {isOwner && <DashboardTableHead>Status</DashboardTableHead>}
            <DashboardTableHead className="text-right">Actions</DashboardTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id} className="border-border/40">
              <DashboardTableCell>
                <p className="font-medium leading-tight">{booking.property.title}</p>
                <p className="text-[11px] text-muted-foreground">{booking.property.location}</p>
              </DashboardTableCell>
              <DashboardTableCell className="text-[11px] uppercase text-muted-foreground">
                {booking.kind?.replace("_", " ") ?? "Tour"}
              </DashboardTableCell>
              <DashboardTableCell className="text-xs whitespace-nowrap tabular-nums">
                {new Date(booking.preferredDate).toLocaleDateString()}
              </DashboardTableCell>
              {isOwner ? (
                <DashboardTableCell className="text-xs">
                  {booking.user ? (booking.user.name ?? booking.user.email) : "—"}
                </DashboardTableCell>
              ) : (
                <DashboardTableCell>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
                    {booking.status}
                  </span>
                </DashboardTableCell>
              )}
              {isOwner && (
                <DashboardTableCell>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
                    {booking.status}
                  </span>
                </DashboardTableCell>
              )}
              <DashboardTableCell className="text-right">
                {isOwner && booking.status === "PENDING" ? (
                  <div className="inline-flex gap-1">
                    <Button size="sm" className="h-7 text-xs" onClick={() => handleStatus(booking.id, "APPROVED")}>
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => handleStatus(booking.id, "CANCELLED")}
                    >
                      Decline
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </DashboardTableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DashboardDataTable>
  );
}
