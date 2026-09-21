import { requireRole } from "@/lib/auth/roles";
import { getOwnerListings } from "@/lib/actions/listings";
import { getNeighborhoods } from "@/lib/actions/neighborhoods";
import { ListingsManager } from "@/components/dashboard/listing-form";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

export default async function ListingsPage() {
  await requireRole(["LANDLORD", "AGENT"]);
  const [listings, neighborhoods] = await Promise.all([getOwnerListings(), getNeighborhoods()]);

  return (
    <DashboardSection title="My listings" description="Create, edit, and request verification for your properties.">
      <ListingsManager listings={listings} neighborhoods={neighborhoods} />
    </DashboardSection>
  );
}
