import { notFound } from "next/navigation";
import { getPublicListing } from "@/lib/actions/equipment-rentals";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Badge } from "@/components/ui/badge";
import { RentalRequestForm } from "@/components/rentals/rental-request-form";
import { estimateRentalTotal } from "@/lib/rentals/pricing";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const { id } = await params;
  const listing = await getPublicListing(id);
  if (!listing) notFound();

  const sample = estimateRentalTotal({
    start: new Date(),
    end: new Date(Date.now() + 24 * 60 * 60 * 1000),
    dailyPrice: listing.dailyPrice,
    hourlyPrice: listing.hourlyPrice,
    weeklyPrice: listing.weeklyPrice,
    monthlyPrice: listing.monthlyPrice,
    securityDeposit: listing.securityDeposit,
    deliveryCharge: listing.deliveryCharge,
    pickupCharge: listing.pickupCharge,
    pickupOrDelivery: "PICKUP",
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-ink text-ink-foreground">
        <Header variant="dark" />
        <div className="container-page pb-10 pt-32">
          <p className="font-mono text-sm text-success">{listing.hcId}</p>
          <h1 className="mt-2 font-display text-4xl font-semibold">{listing.name}</h1>
          <p className="mt-2 text-ink-foreground/75">
            {listing.generalPickupLocation || listing.area || listing.city} · precise address private
          </p>
        </div>
      </div>
      <div className="container-page grid gap-8 py-10 md:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <p className="whitespace-pre-wrap text-sm">{listing.description}</p>
          <div className="flex flex-wrap gap-2">
            {listing.ownershipReviewed && <Badge>Ownership Reviewed</Badge>}
            {listing.equipmentInspected && <Badge variant="secondary">Equipment Inspected</Badge>}
            {listing.functionalityTested && <Badge variant="outline">Functionality Tested</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">Sample 1-day estimate: ₦{sample.estimatedTotal.toLocaleString()} (incl. deposit)</p>
        </div>
        <RentalRequestForm listingId={listing.id} />
      </div>
      <Footer />
    </div>
  );
}
