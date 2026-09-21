import { requireAuth } from "@/lib/auth/roles";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

export default async function SettingsPage() {
  const session = await requireAuth();

  return (
    <DashboardSection title="Settings" description="Manage your account details.">
      <SettingsForm name={session.user.name} email={session.user.email} role={session.user.role} />
    </DashboardSection>
  );
}
