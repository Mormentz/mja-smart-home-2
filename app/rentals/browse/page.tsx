import type { Metadata } from "next";
import Link from "next/link";
import { listApprovedEquipment } from "@/lib/actions/equipment-rentals";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Browse Equipment — HomeConnect Rentals",
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function RentalsBrowsePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
}) {
  const sp = (await searchParams) ?? {};
  const q = one(sp.q);
  const category = one(sp.category);
  const state = one(sp.state);
  const area = one(sp.area);
  const maxDailyRaw = one(sp.maxDaily);
  const maxDaily = maxDailyRaw ? Number(maxDailyRaw) : undefined;
  const items = await listApprovedEquipment({
    q,
    category,
    state,
    area,
    maxDaily: Number.isFinite(maxDaily) ? maxDaily : undefined,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-ink text-ink-foreground">
        <Header variant="dark" />
        <div className="container-page pb-10 pt-32">
          <h1 className="font-display text-3xl font-semibold">Browse equipment</h1>
          <p className="mt-2 max-w-xl text-ink-foreground/75">
            General pickup areas only — precise addresses stay private until booking.
          </p>
          <Link href="/rentals/register/customer" className="mt-4 inline-block text-sm text-success hover:underline">
            Register as rental customer →
          </Link>
        </div>
      </div>

      <div className="container-page py-10">
        <form className="mb-8 grid gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
          <Input name="q" placeholder="Search name or ID" defaultValue={q ?? ""} className="lg:col-span-2" />
          <Input name="category" placeholder="Category" defaultValue={category ?? ""} />
          <Input name="state" placeholder="State" defaultValue={state ?? ""} />
          <Input name="area" placeholder="Area / city" defaultValue={area ?? ""} />
          <Input
            name="maxDaily"
            type="number"
            placeholder="Max ₦/day"
            defaultValue={maxDailyRaw ?? ""}
          />
          <Button type="submit" className="sm:col-span-2 lg:col-span-6 lg:w-fit">
            Apply filters
          </Button>
        </form>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/rentals/browse/${item.id}`}
              className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition hover:border-primary/40"
            >
              {item.photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.photos[0]}
                  alt=""
                  className="aspect-[16/10] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="aspect-[16/10] bg-muted" />
              )}
              <div className="space-y-2 p-4">
                <p className="font-mono text-xs text-muted-foreground">{item.hcId}</p>
                <h2 className="font-display text-lg font-semibold leading-tight">{item.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {item.area || item.city || item.generalPickupLocation || item.state || "Nigeria"}
                  {item.category ? ` · ${item.category}` : ""}
                </p>
                <p className="text-sm font-medium">
                  {item.dailyPrice != null ? `₦${item.dailyPrice.toLocaleString()}/day` : "See pricing"}
                  {item.weeklyPrice != null ? ` · ₦${item.weeklyPrice.toLocaleString()}/wk` : ""}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {item.ownerIdentityVerified && <Badge>Identity Verified</Badge>}
                  {item.ownershipReviewed && <Badge variant="secondary">Ownership Reviewed</Badge>}
                  {item.equipmentInspected && <Badge variant="outline">Inspected</Badge>}
                </div>
              </div>
            </Link>
          ))}
        </div>
        {!items.length && (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
            No approved equipment matches these filters.
          </p>
        )}
      </div>
      <Footer />
    </div>
  );
}
