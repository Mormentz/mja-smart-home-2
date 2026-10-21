import { requireRole } from "@/lib/auth/roles";
import { getServiceProfile } from "@/lib/actions/messages";
import { getArtisanOnboardingState } from "@/lib/actions/artisan-onboarding";
import { listServiceCategories } from "@/lib/services/taxonomy";
import type { SkillProficiencyLevel } from "@/lib/services/skill-proficiency";
import { ServiceProfileForm } from "@/components/dashboard/service-profile-form";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

export default async function ServicesPage() {
  await requireRole(["ARTISAN"]);
  const [profile, user, categories] = await Promise.all([
    getServiceProfile(),
    getArtisanOnboardingState(),
    listServiceCategories(),
  ]);

  return (
    <DashboardSection
      title="Service profile"
      description="Manage taxonomy offerings, skill levels, bio, rates, and availability."
    >
      <ServiceProfileForm
        profile={profile}
        categories={categories.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          isPrimary: c.isPrimary,
          subcategories: c.subcategories.map((s) => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
          })),
        }))}
        selectedTrades={
          user?.artisanServices.map((s) => ({
            subcategoryId: s.subcategoryId,
            proficiency: (s.proficiency as SkillProficiencyLevel) || "INTERMEDIATE",
          })) ?? []
        }
        skillSummary={
          user?.artisanServices.map((s) => ({
            name: s.subcategory.name,
            proficiency: s.proficiency,
          })) ?? []
        }
        kycLevel={user?.kycLevel ?? "BASIC"}
        kycStatus={user?.kycStatus ?? "UNVERIFIED"}
        onboardingComplete={(user?.onboardingStep ?? 0) >= 4 || user?.kycStatus === "VERIFIED"}
      />
    </DashboardSection>
  );
}
