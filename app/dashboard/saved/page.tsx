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
  await requireRole(["USER"]);
  const saved = await getSavedProperties();

  return (
    <DashboardSection title="Saved homes" description="Homes you’ve bookmarked for later.">
      {saved.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
          No saved homes.{" "}
          <Link href="/properties" className="text-primary underline">
            Browse properties
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {saved.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <Link href={`/properties/${s.property.id}`} className="font-display font-semibold hover:underline truncate block">
                  {s.property.title}
                </Link>
                <p className="text-sm text-muted-foreground truncate">{s.property.location}</p>
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
