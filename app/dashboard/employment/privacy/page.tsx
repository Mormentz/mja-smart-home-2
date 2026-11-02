import { requireAuth } from "@/lib/auth/roles";
import { getSeekerPrivacyDashboard } from "@/lib/actions/job-privacy";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { PrivacyControls } from "@/components/jobs/privacy-controls";

export default async function EmploymentPrivacyPage() {
  await requireAuth();
  const data = await getSeekerPrivacyDashboard();

  return (
    <DashboardSection
      title="My Privacy & Security"
      description="Control who sees your profile, documents, and contact pathway."
    >
      {!data ? (
        <p className="text-sm text-muted-foreground">Register as a job seeker to manage privacy settings.</p>
      ) : (
        <PrivacyControls
          profileHidden={data.profile.profileHidden}
          views={data.views.map((v) => ({
            id: v.id,
            viewer: v.viewerUser.name || v.viewerUser.email,
            at: v.createdAt.toISOString(),
          }))}
          grants={data.grants.map((g) => ({
            id: g.id,
            level: g.level,
            employerUserId: g.employerUserId,
            vacancyId: g.vacancyId,
          }))}
          applications={data.applications.map((a) => ({
            id: a.id,
            title: a.vacancy.title,
          }))}
          documentsShared={data.grants.filter((g) => !g.revokedAt).length}
        />
      )}
    </DashboardSection>
  );
}
