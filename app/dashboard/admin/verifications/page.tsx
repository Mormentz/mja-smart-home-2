import { requireRole } from "@/lib/auth/roles";
import { getPendingVerifications } from "@/lib/actions/verification";
import { getPendingKycUsers } from "@/lib/actions/admin";
import { AdminVerificationQueues } from "@/components/dashboard/admin-verification-queues";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

export default async function AdminVerificationsPage() {
  await requireRole(["ADMIN"]);
  const [{ properties, artisans }, kycUsers] = await Promise.all([
    getPendingVerifications(),
    getPendingKycUsers(),
  ]);

  return (
    <DashboardSection
      title="Verification queues"
      description="Approve KYC, property inspections, and artisan credentials."
    >
      <AdminVerificationQueues properties={properties} artisans={artisans} kycUsers={kycUsers} />
    </DashboardSection>
  );
}
