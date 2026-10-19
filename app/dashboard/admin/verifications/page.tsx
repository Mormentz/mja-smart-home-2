import { requireRole } from "@/lib/auth/roles";
import { getPendingVerifications } from "@/lib/actions/verification";
import { getPendingKycUsers } from "@/lib/actions/admin";
import { getPendingKycDocuments } from "@/lib/actions/kyc";
import { AdminVerificationQueues } from "@/components/dashboard/admin-verification-queues";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

export default async function AdminVerificationsPage() {
  await requireRole(["ADMIN"]);
  const [{ properties, artisans }, kycUsers, kycDocuments] = await Promise.all([
    getPendingVerifications(),
    getPendingKycUsers(),
    getPendingKycDocuments(),
  ]);

  return (
    <DashboardSection
      title="Verification queues"
      description="Approve Tier 1–3 KYC documents, property inspections, and artisan credentials."
    >
      <AdminVerificationQueues
        properties={properties}
        artisans={artisans}
        kycUsers={kycUsers}
        kycDocuments={kycDocuments}
      />
    </DashboardSection>
  );
}
