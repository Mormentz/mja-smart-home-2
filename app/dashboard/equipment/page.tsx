import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { requireAuth } from "@/lib/auth/roles";
import { listMyEquipmentDashboard } from "@/lib/actions/equipment-rentals";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { EquipmentBookingActions } from "@/components/rentals/equipment-booking-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function EquipmentDashboardPage() {
  const session = await requireAuth();
  const { owner, bookings } = await listMyEquipmentDashboard();

  return (
    <DashboardSection
      title="My rentals"
      description="Equipment you list and bookings you manage as owner or customer."
    >
      <div className="mb-6 flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/rentals/list">
            <Plus size={16} className="mr-1" /> List equipment
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/rentals/browse">Browse marketplace</Link>
        </Button>
      </div>

      {owner && (
        <section className="mb-8 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="flex items-center gap-3 border-b border-border/60 bg-muted/40 px-5 py-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Package size={18} />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold">Your listings</h2>
              <p className="font-mono text-xs text-muted-foreground">{owner.hcId}</p>
            </div>
            <Badge className="ml-auto">{owner.identityStatus}</Badge>
          </div>
          <ul className="divide-y divide-border/60">
            {owner.listings.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <div>
                  <p className="font-medium">{l.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{l.hcId}</p>
                </div>
                <Badge variant="outline">{l.status}</Badge>
              </li>
            ))}
            {!owner.listings.length && (
              <li className="px-5 py-6 text-sm text-muted-foreground">No listings yet.</li>
            )}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">Bookings</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {bookings.map((b) => {
            const role = b.customerUserId === session.user.id ? "customer" : "owner";
            return (
            <article
              key={b.id}
              className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display font-semibold">{b.listing.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{b.listing.hcId}</p>
                </div>
                <Badge>{b.status}</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {b.startDate.toLocaleDateString()} → {b.endDate.toLocaleDateString()}
              </p>
              <p className="mt-1 text-sm font-medium">₦{b.estimatedTotal.toLocaleString()}</p>
              <EquipmentBookingActions
                bookingId={b.id}
                status={b.status}
                role={role}
                handoverAcked={role === "owner" ? b.ownerHandoverAck : b.customerHandoverAck}
              />
            </article>
            );
          })}
        </div>
        {!bookings.length && (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No bookings yet.{" "}
            <Link href="/rentals/browse" className="text-primary underline">
              Find equipment
            </Link>
          </div>
        )}
      </section>
    </DashboardSection>
  );
}
