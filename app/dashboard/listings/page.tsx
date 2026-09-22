import { requireRole } from "@/lib/auth/roles";
import { getOwnerListings } from "@/lib/actions/listings";
import { listActiveAmenities } from "@/lib/actions/amenities";
import { getNeighborhoods } from "@/lib/actions/neighborhoods";
import { ListingsManager } from "@/components/dashboard/listing-form";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { prisma } from "@/lib/prisma";

export default async function ListingsPage() {
  const session = await requireRole(["AGENT"]);
  const [listings, neighborhoods, amenities, agent] = await Promise.all([
    getOwnerListings(),
    getNeighborhoods(),
    listActiveAmenities(),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { kycStatus: true } }),
  ]);

  return (
    <DashboardSection title="My listings" description="Create, edit, and request verification for your properties.">
      {agent?.kycStatus !== "VERIFIED" && (
        <div className="mb-4 rounded-xl border border-secondary/40 bg-secondary/15 px-4 py-3 text-sm">
          Complete KYC in Settings before publishing new listings. You can still edit existing ones.
        </div>
      )}
      <ListingsManager listings={listings} neighborhoods={neighborhoods} amenities={amenities} />
    </DashboardSection>
  );
}
