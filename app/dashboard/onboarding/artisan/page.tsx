import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { getArtisanOnboardingState } from "@/lib/actions/artisan-onboarding";
import { listServiceCategories } from "@/lib/services/taxonomy";
import { ArtisanOnboardingWizard } from "@/components/artisans/onboarding/artisan-onboarding-wizard";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

export default async function ArtisanOnboardingPage() {
  await requireRole(["ARTISAN"]);
  const [user, categories] = await Promise.all([
    getArtisanOnboardingState(),
    listServiceCategories(),
  ]);

  if (!user) redirect("/login");

  return (
    <DashboardSection
      title="Artisan onboarding"
      description="Finish location, trades, and Tier 1 KYC to appear in Artisans Hub."
    >
      <ArtisanOnboardingWizard
        user={{
          email: user.email,
          emailVerified: user.emailVerified,
          name: user.name,
          phone: user.phone,
          nin: user.nin,
          stateCode: user.stateCode,
          lgaName: user.lgaName,
          areaName: user.areaName,
          lat: user.lat,
          lng: user.lng,
          onboardingStep: user.onboardingStep,
          kycStatus: user.kycStatus,
          artisanServices: user.artisanServices.map((s) => ({
            subcategoryId: s.subcategoryId,
            proficiency: s.proficiency,
          })),
        }}
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
      />
    </DashboardSection>
  );
}
