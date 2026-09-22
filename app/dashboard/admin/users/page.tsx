import { requireRole } from "@/lib/auth/roles";
import { listAdminUsers } from "@/lib/actions/admin";
import { AdminUsersTable } from "@/components/dashboard/admin-users-table";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

export default async function AdminUsersPage() {
  await requireRole(["ADMIN"]);
  const users = await listAdminUsers();

  return (
    <DashboardSection title="Users & agents" description="Manage regular users and agents, KYC, and account status.">
      <AdminUsersTable users={users} />
    </DashboardSection>
  );
}
