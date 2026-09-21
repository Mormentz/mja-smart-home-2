import { requireRole } from "@/lib/auth/roles";
import { getServiceProfile } from "@/lib/actions/messages";
import { ServiceProfileForm } from "@/components/dashboard/service-profile-form";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

export default async function ServicesPage() {
  await requireRole(["ARTISAN"]);
  const profile = await getServiceProfile();

  return (
    <DashboardSection title="Service profile" description="Tell clients about your trade and experience.">
      <ServiceProfileForm profile={profile} />
    </DashboardSection>
  );
}
