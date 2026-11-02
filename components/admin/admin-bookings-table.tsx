"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { adminUpdateBookingStatus, type AdminBookingRow } from "@/lib/actions/admin-ops";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { fmtDate, humanize, personLabel } from "@/components/admin/admin-format";
import { Button } from "@/components/ui/button";
import {
  DashboardDataTable,
  DashboardTableCell,
  DashboardTableHead,
  Table,
  TableBody,
  TableHeader,
  TableRow,
} from "@/components/dashboard/dashboard-data-table";

export function AdminBookingsTable({ bookings }: { bookings: AdminBookingRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function setStatus(id: string, status: "APPROVED" | "CANCELLED") {
    if (status === "CANCELLED" && !confirm("Cancel this booking?")) return;
    start(async () => {
      const r = await adminUpdateBookingStatus(id, status);
      if (r.error) toast.error(r.error);
      else {
        toast.success(status === "APPROVED" ? "Booking approved" : "Booking cancelled");
        router.refresh();
      }
    });
  }

  return (
    <DashboardDataTable>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DashboardTableHead>Property</DashboardTableHead>
            <DashboardTableHead>Requested by</DashboardTableHead>
            <DashboardTableHead>Kind</DashboardTableHead>
            <DashboardTableHead>Preferred date</DashboardTableHead>
            <DashboardTableHead>Status</DashboardTableHead>
            <DashboardTableHead className="text-right">Actions</DashboardTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((b) => (
            <TableRow key={b.id} className="border-border/40">
              <DashboardTableCell>
                <Link href={`/admin/properties/${b.property.id}?tab=bookings`} className="font-medium hover:underline">
                  {b.property.title}
                </Link>
                <p className="text-[11px] text-muted-foreground">
                  {b.property.location} · Owner: {personLabel(b.property.owner)}
                </p>
              </DashboardTableCell>
              <DashboardTableCell className="text-xs">
                <Link href={`/admin/users/${b.user.id}`} className="hover:underline">
                  {personLabel(b.user)}
                </Link>
                <p className="text-muted-foreground">{b.user.email}</p>
              </DashboardTableCell>
              <DashboardTableCell className="text-xs capitalize">{humanize(b.kind)}</DashboardTableCell>
              <DashboardTableCell className="text-xs">{fmtDate(b.preferredDate)}</DashboardTableCell>
              <DashboardTableCell>
                <AdminStatusBadge status={b.status} />
              </DashboardTableCell>
              <DashboardTableCell className="text-right">
                <div className="inline-flex gap-1">
                  {b.status === "PENDING" && (
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      disabled={pending}
                      onClick={() => setStatus(b.id, "APPROVED")}
                    >
                      Approve
                    </Button>
                  )}
                  {b.status !== "CANCELLED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={pending}
                      onClick={() => setStatus(b.id, "CANCELLED")}
                    >
                      Cancel
                    </Button>
                  )}
                  {b.status === "CANCELLED" && <span className="text-xs text-muted-foreground">—</span>}
                </div>
              </DashboardTableCell>
            </TableRow>
          ))}
          {bookings.length === 0 && (
            <TableRow>
              <DashboardTableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                No bookings match.
              </DashboardTableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </DashboardDataTable>
  );
}
