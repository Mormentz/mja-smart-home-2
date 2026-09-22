import { requireAuth } from "@/lib/auth/roles";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true, kycLevel: true, kycStatus: true, kycNote: true },
  });

  return (
    <DashboardSection title="Settings" description="Manage your account and KYC details.">
      <SettingsForm
        name={session.user.name}
        email={session.user.email}
        role={session.user.role}
        phone={user?.phone}
        kycLevel={user?.kycLevel}
        kycStatus={user?.kycStatus}
        kycNote={user?.kycNote}
      />
    </DashboardSection>
  );
}
