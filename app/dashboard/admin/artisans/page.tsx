import { requireRole } from "@/lib/auth/roles";
import { listAdminArtisans } from "@/lib/actions/admin";
import { AdminArtisansTable } from "@/components/dashboard/admin-artisans-table";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

export default async function AdminArtisansPage() {
  await requireRole(["ADMIN"]);
  const artisans = await listAdminArtisans();

  return (
    <DashboardSection title="Artisans" description="Verify tradespeople, set skill badges, and manage availability status.">
      <AdminArtisansTable artisans={artisans} />
    </DashboardSection>
  );
}
