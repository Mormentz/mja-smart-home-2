import Link from "next/link";
import { Suspense } from "react";
import { requireAdminSession } from "@/lib/auth/admin";
import { listAdminArtisansFiltered } from "@/lib/actions/admin-artisans";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
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
import { Button } from "@/components/ui/button";
import { formatMoneyPerHour } from "@/lib/currency";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminArtisansPage({ searchParams }: PageProps) {
  await requireAdminSession();
  const sp = (await searchParams) ?? {};
  const q = one(sp.q)?.trim();
  const verificationStatus = one(sp.verification)?.trim();
  const artisans = await listAdminArtisansFiltered({ q, verificationStatus });

  return (
    <DashboardSection
      title="Services"
      description="Manage artisans — profile, verification, skills, jobs, reviews, and badges."
    >
      <div className="mb-4">
        <Suspense fallback={null}>
          <AdminFilterBar
            searchPlaceholder="Search name, email, phone, trade…"
            chipParam="verification"
            chips={[
              { id: "PENDING", label: "Pending" },
              { id: "VERIFIED", label: "Verified" },
              { id: "REJECTED", label: "Rejected" },
              { id: "UNVERIFIED", label: "Unverified" },
            ]}
          />
        </Suspense>
      </div>
      <DashboardDataTable>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <DashboardTableHead>Artisan</DashboardTableHead>
              <DashboardTableHead>Trade</DashboardTableHead>
              <DashboardTableHead>Verification</DashboardTableHead>
              <DashboardTableHead>Badge</DashboardTableHead>
              <DashboardTableHead className="text-right">Rate</DashboardTableHead>
              <DashboardTableHead className="text-right">Actions</DashboardTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {artisans.map((a) => {
              const avg =
                a.reviewsReceived.length > 0
                  ? (a.reviewsReceived.reduce((s, r) => s + r.rating, 0) / a.reviewsReceived.length).toFixed(1)
                  : "—";
              const p = a.serviceProfile;
              return (
                <TableRow key={a.id} className="border-border/40">
                  <DashboardTableCell>
                    <Link href={`/admin/artisans/${a.id}`} className="font-medium leading-tight hover:underline">
                      {a.name ?? a.email}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {a.email} · {avg}★
                    </p>
                  </DashboardTableCell>
                  <DashboardTableCell>{p?.trade ?? "—"}</DashboardTableCell>
                  <DashboardTableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      <AdminStatusBadge status={p?.verificationStatus ?? "UNVERIFIED"} />
                      {!a.active && <AdminStatusBadge status="SUSPENDED" />}
                    </div>
                  </DashboardTableCell>
                  <DashboardTableCell className="text-xs">
                    {p?.skillBadge ?? "—"}
                    <span className="text-muted-foreground">
                      {" · "}
                      {p?.available ? "Available" : "Busy"}
                    </span>
                  </DashboardTableCell>
                  <DashboardTableCell className="text-right text-xs tabular-nums">
                    {formatMoneyPerHour(p?.hourlyRate ?? 0)}
                  </DashboardTableCell>
                  <DashboardTableCell className="text-right">
                    <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                      <Link href={`/admin/artisans/${a.id}`}>Manage</Link>
                    </Button>
                  </DashboardTableCell>
                </TableRow>
              );
            })}
            {artisans.length === 0 && (
              <TableRow>
                <DashboardTableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No artisans found.
                </DashboardTableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DashboardDataTable>
    </DashboardSection>
  );
}
