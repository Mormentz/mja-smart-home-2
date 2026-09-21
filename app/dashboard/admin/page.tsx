import { requireRole } from "@/lib/auth/roles";
import { getPendingVerifications } from "@/lib/actions/verification";
import { AdminVerificationQueue } from "@/components/dashboard/admin-verification-queue";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

export default async function AdminPage() {
  await requireRole(["ADMIN"]);
  const { properties, artisans } = await getPendingVerifications();

  return (
    <DashboardSection
      title="Verification queue"
      description="Approve or reject property and artisan verification requests."
    >
      <AdminVerificationQueue properties={properties} artisans={artisans} />
    </DashboardSection>
  );
}
