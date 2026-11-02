import Link from "next/link";
import { Wrench } from "lucide-react";
import { requireRole } from "@/lib/auth/roles";
import { getServiceProfile } from "@/lib/actions/messages";
import { getArtisanOnboardingState } from "@/lib/actions/artisan-onboarding";
import { listServiceCategories } from "@/lib/services/taxonomy";
import type { SkillProficiencyLevel } from "@/lib/services/skill-proficiency";
import { ServiceProfileForm } from "@/components/dashboard/service-profile-form";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function ServicesPage() {
  await requireRole(["ARTISAN"]);
  const [profile, user, categories] = await Promise.all([
    getServiceProfile(),
    getArtisanOnboardingState(),
    listServiceCategories(),
  ]);

  const enhanced =
    user?.kycStatus === "VERIFIED" && user?.kycLevel === "ENHANCED";
  const onboardingComplete = enhanced;
  const stepLabel = !user?.emailVerified
    ? "Verify email"
    : (user?.onboardingStep ?? 0) < 3
      ? "Location & trades"
      : user?.kycStatus !== "VERIFIED"
        ? "Tier 1 KYC"
        : user?.kycLevel !== "ENHANCED"
          ? "Tier 2–3 KYC"
          : "Live";

  return (
    <DashboardSection
      title="Service profile"
      description="Manage taxonomy offerings, skill levels, bio, rates, and availability."
    >
      <div className="mb-6 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-4 border-b border-border/60 bg-muted/40 px-5 py-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <Wrench size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-semibold">Artisan workspace</p>
            <p className="text-xs text-muted-foreground">
              Progress: {stepLabel} · KYC {user?.kycLevel ?? "BASIC"} / {user?.kycStatus ?? "UNVERIFIED"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={onboardingComplete ? "default" : "secondary"}>
              {onboardingComplete ? "Ready" : "Setup needed"}
            </Badge>
            <Badge variant="outline">{user?.kycLevel ?? "BASIC"}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 px-5 py-4">
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/jobs">Service jobs</Link>
          </Button>
          {!onboardingComplete && (
            <Button size="sm" asChild>
              <Link href="/dashboard/onboarding/artisan">Continue onboarding</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-6">
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
          onboardingComplete={onboardingComplete}
        />
      </div>
    </DashboardSection>
  );
}
