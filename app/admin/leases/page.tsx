import Link from "next/link";
import { Suspense } from "react";
import { requireAdminSession } from "@/lib/auth/admin";
import { listAdminLeases } from "@/lib/actions/admin-ops";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { fmtDate, personLabel } from "@/components/admin/admin-format";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
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

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminLeasesPage({ searchParams }: PageProps) {
  await requireAdminSession();
  const sp = (await searchParams) ?? {};
  const { leases, counts } = await listAdminLeases({ status: one(sp.status), q: one(sp.q) });

  return (
    <DashboardSection
      title="Leases"
      description="All leases with their escrow position. Open the property to release or refund funds."
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="Draft" value={counts.DRAFT} href="/admin/leases?status=DRAFT" />
        <AdminStatCard label="Active" value={counts.ACTIVE} href="/admin/leases?status=ACTIVE" />
        <AdminStatCard label="Completed" value={counts.COMPLETED} href="/admin/leases?status=COMPLETED" />
        <AdminStatCard label="Cancelled" value={counts.CANCELLED} href="/admin/leases?status=CANCELLED" />
      </div>
      <div className="mb-4">
        <Suspense fallback={null}>
          <AdminFilterBar
            searchPlaceholder="Search property, renter, landlord…"
            chipParam="status"
            chips={[
              { id: "DRAFT", label: "Draft" },
              { id: "ACTIVE", label: "Active" },
              { id: "COMPLETED", label: "Completed" },
              { id: "CANCELLED", label: "Cancelled" },
            ]}
          />
        </Suspense>
      </div>

      <DashboardDataTable>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <DashboardTableHead>Property</DashboardTableHead>
              <DashboardTableHead>Renter</DashboardTableHead>
              <DashboardTableHead>Landlord</DashboardTableHead>
              <DashboardTableHead>Term</DashboardTableHead>
              <DashboardTableHead className="text-right">Rent / mo</DashboardTableHead>
              <DashboardTableHead>Escrow</DashboardTableHead>
              <DashboardTableHead>Status</DashboardTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leases.map((l) => (
              <TableRow key={l.id} className="border-border/40">
                <DashboardTableCell>
                  <Link href={`/admin/properties/${l.property.id}?tab=leases`} className="font-medium hover:underline">
                    {l.property.title}
                  </Link>
                  <p className="text-[11px] text-muted-foreground">{l.property.location}</p>
                </DashboardTableCell>
                <DashboardTableCell className="text-xs">
                  <Link href={`/admin/users/${l.renter.id}`} className="hover:underline">
                    {personLabel(l.renter)}
                  </Link>
                </DashboardTableCell>
                <DashboardTableCell className="text-xs">
                  <Link href={`/admin/users/${l.landlord.id}`} className="hover:underline">
                    {personLabel(l.landlord)}
                  </Link>
                </DashboardTableCell>
                <DashboardTableCell className="text-xs">
                  {fmtDate(l.startDate)} → {fmtDate(l.endDate)}
                </DashboardTableCell>
                <DashboardTableCell className="text-right tabular-nums">{formatMoney(l.monthlyRent)}</DashboardTableCell>
                <DashboardTableCell className="text-xs">
                  {l.escrow.count === 0 ? (
                    <span className="text-muted-foreground">No payments</span>
                  ) : (
                    <Link href="/admin/escrow" className="space-y-0.5 hover:underline">
                      {l.escrow.held > 0 && <p>Held {formatMoney(l.escrow.held)}</p>}
                      {l.escrow.released > 0 && <p className="text-sky-800">Released {formatMoney(l.escrow.released)}</p>}
                      {l.escrow.refunded > 0 && <p className="text-violet-800">Refunded {formatMoney(l.escrow.refunded)}</p>}
                      {l.escrow.pending > 0 && <p className="text-muted-foreground">Pending {formatMoney(l.escrow.pending)}</p>}
                    </Link>
                  )}
                </DashboardTableCell>
                <DashboardTableCell>
                  <AdminStatusBadge status={l.status} />
                </DashboardTableCell>
              </TableRow>
            ))}
            {leases.length === 0 && (
              <TableRow>
                <DashboardTableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No leases match.
                </DashboardTableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DashboardDataTable>
    </DashboardSection>
  );
}
