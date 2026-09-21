import { requireRole } from "@/lib/auth/roles";
import { getMoveInRequests } from "@/lib/actions/move-in";
import { getRenterLeases } from "@/lib/actions/leases";
import { MoveInPanel } from "@/components/dashboard/move-in-panel";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

export default async function MoveInPage() {
  await requireRole(["RENTER"]);
  const [requests, leases] = await Promise.all([getMoveInRequests(), getRenterLeases()]);

  return (
    <DashboardSection
      title="Move-in support"
      description="Optional moving, furnishing, and utility setup for your leased home."
    >
      <MoveInPanel
        requests={requests}
        leases={leases.map((l) => ({
          id: l.id,
          propertyId: l.propertyId,
          property: { title: l.property.title },
        }))}
      />
    </DashboardSection>
  );
}
