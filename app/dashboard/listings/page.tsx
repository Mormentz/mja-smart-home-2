import { requireRole } from "@/lib/auth/roles";
import { getOwnerListings } from "@/lib/actions/listings";
import { ListingsManager } from "@/components/dashboard/listing-form";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

export default async function ListingsPage() {
  await requireRole(["LANDLORD", "AGENT"]);
  const listings = await getOwnerListings();

  return (
    <DashboardSection title="My listings" description="Create and manage your property listings.">
      <ListingsManager listings={listings} />
    </DashboardSection>
  );
}
