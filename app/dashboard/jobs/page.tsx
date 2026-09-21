import { requireRole } from "@/lib/auth/roles";
import { getArtisanJobs, getCustomerJobs } from "@/lib/actions/service-jobs";
import { JobsPanel } from "@/components/dashboard/jobs-panel";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

export default async function JobsPage() {
  const session = await requireRole(["RENTER", "BUYER", "ARTISAN"]);
  const isArtisan = session.user.role === "ARTISAN";
  const jobs = isArtisan ? await getArtisanJobs() : await getCustomerJobs();

  return (
    <DashboardSection
      title={isArtisan ? "Service jobs" : "My artisan jobs"}
      description={
        isArtisan
          ? "Accept, progress, and complete client jobs. Escrow releases on completion."
          : "Track bookings, escrow holds, and leave reviews after completion."
      }
    >
      <JobsPanel jobs={jobs} mode={isArtisan ? "artisan" : "customer"} />
    </DashboardSection>
  );
}
