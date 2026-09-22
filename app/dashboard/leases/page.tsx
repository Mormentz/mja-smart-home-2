import { requireRole } from "@/lib/auth/roles";
import { getLandlordLeases, getRenterLeases } from "@/lib/actions/leases";
import { LeasesPanel } from "@/components/dashboard/leases-panel";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

export default async function LeasesPage() {
  const session = await requireRole(["USER", "AGENT"]);
  const isOwner = session.user.role === "AGENT";
  const leases = isOwner ? await getLandlordLeases() : await getRenterLeases();

  return (
    <DashboardSection
      title="Leases & escrow"
      description={
        isOwner
          ? "Manage renter leases and release escrowed rent."
          : "Secure rent with simulated escrow protection."
      }
    >
      <LeasesPanel leases={leases} mode={isOwner ? "landlord" : "renter"} />
    </DashboardSection>
  );
}
