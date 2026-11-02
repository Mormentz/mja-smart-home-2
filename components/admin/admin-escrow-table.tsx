"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { refundEscrow, releaseEscrow } from "@/lib/actions/escrow";
import type { AdminEscrowRow } from "@/lib/actions/admin-ops";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { fmtDateTime, humanize, personLabel } from "@/components/admin/admin-format";
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
import { formatMoney } from "@/lib/currency";

export function AdminEscrowTable({ payments }: { payments: AdminEscrowRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function act(id: string, kind: "release" | "refund") {
    const msg =
      kind === "release"
        ? "Release this escrow to the payee? This cannot be undone."
        : "Refund this escrow to the payer? This cannot be undone.";
    if (!confirm(msg)) return;
    setBusyId(id);
    start(async () => {
      const r = kind === "release" ? await releaseEscrow(id) : await refundEscrow(id);
      setBusyId(null);
      if (r.error) toast.error(r.error);
      else {
        toast.success(kind === "release" ? "Escrow released" : "Escrow refunded");
        router.refresh();
      }
    });
  }

  return (
    <DashboardDataTable>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DashboardTableHead>Payment</DashboardTableHead>
            <DashboardTableHead>Payer</DashboardTableHead>
            <DashboardTableHead>For</DashboardTableHead>
            <DashboardTableHead className="text-right">Amount</DashboardTableHead>
            <DashboardTableHead>Status</DashboardTableHead>
            <DashboardTableHead>Created</DashboardTableHead>
            <DashboardTableHead className="text-right">Actions</DashboardTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((p) => (
            <TableRow key={p.id} className="border-border/40">
              <DashboardTableCell>
                <p className="font-mono text-[11px]">{p.id.slice(0, 12)}…</p>
                <p className="text-[11px] capitalize text-muted-foreground">
                  {humanize(p.purpose)}
                  {p.providerRef ? ` · ${p.providerRef.slice(0, 18)}…` : ""}
                </p>
              </DashboardTableCell>
              <DashboardTableCell className="text-xs">
                <Link href={`/admin/users/${p.payer.id}`} className="hover:underline">
                  {personLabel(p.payer)}
                </Link>
              </DashboardTableCell>
              <DashboardTableCell className="text-xs">
                {p.lease ? (
                  <>
                    <Link href={`/admin/properties/${p.lease.property.id}?tab=leases`} className="hover:underline">
                      {p.lease.property.title}
                    </Link>
                    <p className="text-muted-foreground">Landlord: {personLabel(p.lease.landlord)}</p>
                  </>
                ) : p.serviceJob ? (
                  <>
                    <span>Artisan job ({humanize(p.serviceJob.status)})</span>
                    <p className="text-muted-foreground">{personLabel(p.serviceJob.artisan)}</p>
                  </>
                ) : (
                  <span className="text-muted-foreground">{p.note ?? "—"}</span>
                )}
              </DashboardTableCell>
              <DashboardTableCell className="text-right font-medium tabular-nums">
                {formatMoney(p.amount)}
              </DashboardTableCell>
              <DashboardTableCell>
                <AdminStatusBadge status={p.status} />
              </DashboardTableCell>
              <DashboardTableCell className="text-xs text-muted-foreground">
                {fmtDateTime(p.createdAt)}
              </DashboardTableCell>
              <DashboardTableCell className="text-right">
                {p.status === "HELD" ? (
                  <div className="inline-flex gap-1">
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      disabled={pending && busyId === p.id}
                      onClick={() => act(p.id, "release")}
                    >
                      Release
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={pending && busyId === p.id}
                      onClick={() => act(p.id, "refund")}
                    >
                      Refund
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </DashboardTableCell>
            </TableRow>
          ))}
          {payments.length === 0 && (
            <TableRow>
              <DashboardTableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                No escrow payments match.
              </DashboardTableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </DashboardDataTable>
  );
}
