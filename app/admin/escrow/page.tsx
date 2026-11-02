import { Suspense } from "react";
import { requireAdminSession } from "@/lib/auth/admin";
import { listAdminEscrow } from "@/lib/actions/admin-ops";
import { AdminEscrowTable } from "@/components/admin/admin-escrow-table";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { formatMoney } from "@/lib/currency";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminEscrowPage({ searchParams }: PageProps) {
  await requireAdminSession();
  const sp = (await searchParams) ?? {};
  const { payments, totals } = await listAdminEscrow({
    status: one(sp.status),
    purpose: one(sp.purpose),
    q: one(sp.q),
  });

  return (
    <DashboardSection
      title="Escrow"
      description="Every escrow payment across leases and artisan jobs. Release or refund held funds."
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="Held" value={formatMoney(totals.held)} href="/admin/escrow?status=HELD" tone={totals.held ? "warn" : undefined} />
        <AdminStatCard label="Released" value={formatMoney(totals.released)} href="/admin/escrow?status=RELEASED" />
        <AdminStatCard label="Refunded" value={formatMoney(totals.refunded)} href="/admin/escrow?status=REFUNDED" />
        <AdminStatCard label="Awaiting payment" value={formatMoney(totals.pending)} href="/admin/escrow?status=PENDING" />
      </div>
      <div className="mb-4 space-y-2">
        <Suspense fallback={null}>
          <AdminFilterBar
            searchPlaceholder="Search payer, reference, property…"
            chipParam="status"
            chips={[
              { id: "HELD", label: "Held" },
              { id: "PENDING", label: "Pending" },
              { id: "RELEASED", label: "Released" },
              { id: "REFUNDED", label: "Refunded" },
            ]}
          />
        </Suspense>
        <Suspense fallback={null}>
          <AdminFilterBar
            hideSearch
            chipParam="purpose"
            chips={[
              { id: "RENT", label: "Rent" },
              { id: "ARTISAN", label: "Artisan" },
              { id: "MOVE_IN", label: "Move-in" },
            ]}
          />
        </Suspense>
      </div>
      <AdminEscrowTable payments={payments} />
    </DashboardSection>
  );
}
