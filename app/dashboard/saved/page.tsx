import Link from "next/link";
import { requireRole } from "@/lib/auth/roles";
import { getSavedProperties, toggleSavedProperty } from "@/lib/actions/saved-properties";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/currency";
import { imageSrc, resolveImage } from "@/lib/properties";
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {saved.map((s) => {
            const p = s.property;
            return (
              <article
                key={s.id}
                className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
              >
                <Link href={`/properties/${p.id}`} className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageSrc(resolveImage(p.image))}
                    alt={p.title}
                    className="aspect-[16/11] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                </Link>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/properties/${p.id}`}
                      className="font-display font-semibold leading-tight hover:underline line-clamp-2"
                    >
                      {p.title}
                    </Link>
                    {p.verificationStatus === "VERIFIED" && (
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{p.location}</p>
                  <p className="text-sm font-medium">
                    {formatMoney(p.price)}
                    {p.type === "FOR_RENT" ? " / mo" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.beds} bed · {p.baths} bath · {p.area} m²
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="h-8 text-xs" asChild>
                      <Link href={`/properties/${p.id}`}>View details</Link>
                    </Button>
                    <form action={unsave.bind(null, s.propertyId)}>
                      <Button type="submit" variant="outline" size="sm" className="h-8 text-xs">
                        Remove
                      </Button>
                    </form>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </DashboardSection>
  );
}
