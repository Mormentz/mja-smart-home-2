import { Suspense } from "react";
import { requireAdminSession } from "@/lib/auth/admin";
import { listAdminPropertiesFiltered } from "@/lib/actions/admin-properties";
import { AdminPropertiesTable } from "@/components/dashboard/admin-properties-table";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminPropertiesPage({ searchParams }: PageProps) {
  await requireAdminSession();
  const sp = (await searchParams) ?? {};
  const properties = await listAdminPropertiesFiltered({
    q: one(sp.q),
    status: one(sp.status)?.trim(),
  });

  return (
    <DashboardSection
      title="Properties"
      description="Open a listing to edit details, media, amenities, verification, bookings, leases, and owner."
    >
      <div className="mb-4">
        <Suspense fallback={null}>
          <AdminFilterBar
            searchPlaceholder="Search title, location, owner…"
            chipParam="status"
            chips={[
              { id: "PENDING", label: "Pending" },
              { id: "VERIFIED", label: "Verified" },
              { id: "REJECTED", label: "Rejected" },
              { id: "UNVERIFIED", label: "Unverified" },
            ]}
          />
        </Suspense>
      </div>
      <AdminPropertiesTable properties={properties} />
    </DashboardSection>
  );
}
