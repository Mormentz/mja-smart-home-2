import { Suspense } from "react";
import { requireAdminSession } from "@/lib/auth/admin";
import { listAdminBookings } from "@/lib/actions/admin-ops";
import { AdminBookingsTable } from "@/components/admin/admin-bookings-table";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminBookingsPage({ searchParams }: PageProps) {
  await requireAdminSession();
  const sp = (await searchParams) ?? {};
  const { bookings, counts } = await listAdminBookings({
    status: one(sp.status),
    kind: one(sp.kind),
    q: one(sp.q),
  });

  return (
    <DashboardSection
      title="Bookings"
      description="Property tour and purchase-interest requests across the platform."
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <AdminStatCard label="Pending" value={counts.PENDING} href="/admin/bookings?status=PENDING" tone={counts.PENDING ? "warn" : undefined} />
        <AdminStatCard label="Approved" value={counts.APPROVED} href="/admin/bookings?status=APPROVED" />
        <AdminStatCard label="Cancelled" value={counts.CANCELLED} href="/admin/bookings?status=CANCELLED" />
      </div>
      <div className="mb-4 space-y-2">
        <Suspense fallback={null}>
          <AdminFilterBar
            searchPlaceholder="Search property, user, booking ID…"
            chipParam="status"
            chips={[
              { id: "PENDING", label: "Pending" },
              { id: "APPROVED", label: "Approved" },
              { id: "CANCELLED", label: "Cancelled" },
            ]}
          />
        </Suspense>
        <Suspense fallback={null}>
          <AdminFilterBar
            hideSearch
            chipParam="kind"
            chips={[
              { id: "TOUR", label: "Tours" },
              { id: "PURCHASE_INTEREST", label: "Purchase interest" },
            ]}
          />
        </Suspense>
      </div>
      <AdminBookingsTable bookings={bookings} />
    </DashboardSection>
  );
}
