import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { BookArtisanForm } from "@/components/artisans/book-artisan-form";
import { getArtisanById } from "@/lib/actions/service-jobs";
import { skillProficiencyLabel } from "@/lib/services/skill-proficiency";
import { formatMoneyPerHour } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";

type PageProps = { params: Promise<{ id: string }> };

const PROF_RANK = { EXPERT: 0, ADVANCED: 1, INTERMEDIATE: 2, BEGINNER: 3 } as const;

export default async function ArtisanDetailPage({ params }: PageProps) {
  const { id } = await params;
  const artisan = await getArtisanById(id);
  if (!artisan || !artisan.serviceProfile) notFound();

  const profile = artisan.serviceProfile;
  const skills = [...artisan.artisanServices].sort(
    (a, b) =>
      (PROF_RANK[a.proficiency] ?? 9) - (PROF_RANK[b.proficiency] ?? 9) ||
      a.subcategory.name.localeCompare(b.subcategory.name),
  );

  return (
    <div className="min-h-screen bg-background">
      <section className="container-page pt-4">
        <div className="relative overflow-hidden rounded-4xl bg-ink text-ink-foreground pt-36 pb-12 px-6 md:px-14">
          <Header variant="dark" />
          <Link href="/artisans" className="text-sm text-ink-foreground/70 hover:text-ink-foreground">
            ← All artisans
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {profile.verified && <Badge className="bg-secondary text-secondary-foreground">Verified</Badge>}
            <Badge variant="outline" className="border-ink-foreground/30 text-ink-foreground">
              {profile.skillBadge}
            </Badge>
            <Badge variant="outline" className="border-ink-foreground/30 text-ink-foreground">
              {profile.available ? "Available" : "Busy"}
            </Badge>
          </div>
          <h1 className="mt-4 font-display text-4xl md:text-5xl font-semibold">
            {artisan.name ?? artisan.email}
          </h1>
          <p className="mt-2 text-ink-foreground/70">{profile.trade}</p>
          {profile.serviceArea && (
            <p className="mt-1 text-sm text-ink-foreground/60">Serves {profile.serviceArea}</p>
          )}
        </div>
      </section>

      <section className="container-page mt-10 grid lg:grid-cols-3 gap-8 pb-20">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="font-display text-2xl font-semibold">About</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">{profile.bio}</p>
            <p className="mt-4 font-semibold text-primary">{formatMoneyPerHour(profile.hourlyRate)}</p>
          </div>

          {skills.length > 0 && (
            <div>
              <h2 className="font-display text-2xl font-semibold">Skills & proficiency</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {skills.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{s.subcategory.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {s.subcategory.category.name}
                      </p>
                    </div>
                    <Badge variant="secondary">{skillProficiencyLabel(s.proficiency)}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h2 className="font-display text-2xl font-semibold">Reviews</h2>
            {artisan.reviewsReceived.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No reviews yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {artisan.reviewsReceived.map((r) => (
                  <li key={r.id} className="rounded-2xl border border-border p-4">
                    <p className="text-sm font-semibold">{r.rating}★ · {r.author.name ?? "Client"}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <BookArtisanForm artisanId={artisan.id} available={profile.available} />
      </section>
      <Footer />
    </div>
  );
}
