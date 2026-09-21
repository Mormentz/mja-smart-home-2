import Link from "next/link";
import { requireRole } from "@/lib/auth/roles";
import { getSavedProperties, toggleSavedProperty } from "@/lib/actions/saved-properties";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";

async function unsave(propertyId: string) {
  "use server";
  await toggleSavedProperty(propertyId);
  revalidatePath("/dashboard/saved");
}

export default async function SavedPage() {
  await requireRole(["RENTER", "BUYER"]);
  const saved = await getSavedProperties();

  return (
    <DashboardSection title="Saved homes" description="Homes you’ve bookmarked for later.">
      {saved.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No saved homes.{" "}
          <Link href="/properties" className="text-primary underline">
            Browse properties
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {saved.map((s) => (
            <div
              key={s.id}
              className="rounded-3xl border border-border bg-card p-5 flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <Link href={`/properties/${s.property.id}`} className="font-display text-lg font-semibold hover:underline">
                  {s.property.title}
                </Link>
                <p className="text-sm text-muted-foreground">{s.property.location}</p>
                {s.property.neighborhood && (
                  <p className="text-xs mt-1">
                    Neighborhood safety {s.property.neighborhood.safety} · power{" "}
                    {s.property.neighborhood.power}
                  </p>
                )}
              </div>
              <form action={unsave.bind(null, s.propertyId)}>
                <Button type="submit" variant="outline" size="sm">
                  Remove
                </Button>
              </form>
            </div>
          ))}
        </div>
      )}
    </DashboardSection>
  );
}
