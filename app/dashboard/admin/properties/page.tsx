import { requireRole } from "@/lib/auth/roles";
import { listAdminProperties } from "@/lib/actions/admin";
import { AdminPropertiesTable } from "@/components/dashboard/admin-properties-table";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

export default async function AdminPropertiesPage() {
  await requireRole(["ADMIN"]);
  const properties = await listAdminProperties();

  return (
    <DashboardSection title="Properties" description="Verify listings, feature homes, or remove content from the platform.">
      <AdminPropertiesTable properties={properties} />
    </DashboardSection>
  );
}
