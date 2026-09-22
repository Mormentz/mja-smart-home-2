"use client";

import { MoreHorizontal } from "lucide-react";
import { activateLeaseWithEscrow } from "@/lib/actions/leases";
import { releaseEscrow, refundEscrow } from "@/lib/actions/escrow";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

type LeaseRow = {
  id: string;
  status: string;
  monthlyRent: number;
  startDate: Date;
  endDate: Date;
  property: { title: string; location: string };
  renter?: { name: string | null; email: string };
  landlord?: { name: string | null; email: string };
  escrowPayments: {
    id: string;
    amount: number;
    status: string;
    purpose: string;
  }[];
};

export function LeasesPanel({
  leases,
  mode,
}: {
  leases: LeaseRow[];
  mode: "renter" | "landlord";
}) {
  async function fund(leaseId: string) {
    const result = await activateLeaseWithEscrow(leaseId);
    if (result.error) toast.error(result.error);
    else toast.success("Escrow funded and lease activated");
  }

  async function release(id: string) {
    const result = await releaseEscrow(id);
    if (result.error) toast.error(result.error);
    else toast.success("Escrow released");
  }

  async function refund(id: string) {
    const result = await refundEscrow(id);
    if (result.error) toast.error(result.error);
    else toast.success("Escrow refunded");
  }

  if (leases.length === 0) {
    return <DashboardEmptyState>No leases yet.</DashboardEmptyState>;
  }

  return (
    <DashboardDataTable>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DashboardTableHead>Property</DashboardTableHead>
            <DashboardTableHead>Party</DashboardTableHead>
            <DashboardTableHead>Status</DashboardTableHead>
            <DashboardTableHead className="text-right">Rent</DashboardTableHead>
            <DashboardTableHead>Period</DashboardTableHead>
            <DashboardTableHead>Escrow</DashboardTableHead>
            <DashboardTableHead className="text-right">Actions</DashboardTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leases.map((lease) => {
            const party =
              mode === "landlord"
                ? lease.renter
                  ? (lease.renter.name ?? lease.renter.email)
                  : "—"
                : lease.landlord
                  ? (lease.landlord.name ?? lease.landlord.email)
                  : "—";
            const held = lease.escrowPayments.filter((p) => p.status === "HELD");
            return (
              <TableRow key={lease.id} className="border-border/40">
                <DashboardTableCell>
                  <p className="font-medium leading-tight">{lease.property.title}</p>
                  <p className="text-[11px] text-muted-foreground">{lease.property.location}</p>
                </DashboardTableCell>
                <DashboardTableCell className="text-xs">{party}</DashboardTableCell>
                <DashboardTableCell>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
                    {lease.status}
                  </span>
                </DashboardTableCell>
                <DashboardTableCell className="text-right tabular-nums font-medium">
                  ${lease.monthlyRent.toLocaleString()}
                </DashboardTableCell>
                <DashboardTableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {new Date(lease.startDate).toLocaleDateString()} →{" "}
                  {new Date(lease.endDate).toLocaleDateString()}
                </DashboardTableCell>
                <DashboardTableCell className="text-xs">
                  {lease.escrowPayments.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <div className="space-y-0.5">
                      {lease.escrowPayments.map((p) => (
                        <div key={p.id} className="flex items-center gap-1.5">
                          <span>
                            ${p.amount} {p.status}
                          </span>
                          {mode === "landlord" && p.status === "HELD" && (
                            <>
                              <button
                                type="button"
                                className="text-[10px] font-medium text-primary hover:underline"
                                onClick={() => release(p.id)}
                              >
                                Release
                              </button>
                              <button
                                type="button"
                                className="text-[10px] font-medium text-muted-foreground hover:underline"
                                onClick={() => refund(p.id)}
                              >
                                Refund
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </DashboardTableCell>
                <DashboardTableCell className="text-right">
                  {mode === "renter" && lease.status === "DRAFT" ? (
                    <Button size="sm" className="h-7 text-xs" onClick={() => fund(lease.id)}>
                      Fund escrow
                    </Button>
                  ) : held.length > 0 && mode === "landlord" ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {held.map((p) => (
                          <DropdownMenuItem key={p.id} onClick={() => release(p.id)}>
                            Release ${p.amount}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </DashboardTableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </DashboardDataTable>
  );
}
