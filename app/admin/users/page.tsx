import { Suspense } from "react";
import { requireAdminSession } from "@/lib/auth/admin";
import { listAdminUsersFiltered } from "@/lib/actions/admin-users";
import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  await requireAdminSession();
  const sp = (await searchParams) ?? {};
  const q = one(sp.q)?.trim();
  const role = one(sp.role)?.trim();
  const users = await listAdminUsersFiltered({ q, role });

  return (
    <DashboardSection
      title="Users"
      description="Search and manage every account — profile, KYC, roles, and related activity."
    >
      <div className="mb-4">
        <Suspense fallback={null}>
          <AdminFilterBar
            searchPlaceholder="Search name, email, phone…"
            chips={[
              { id: "USER", label: "Users" },
              { id: "AGENT", label: "Agents" },
              { id: "ARTISAN", label: "Artisans" },
              { id: "ADMIN", label: "Admins" },
            ]}
          />
        </Suspense>
      </div>
      <AdminUsersTable users={users} />
    </DashboardSection>
  );
}
