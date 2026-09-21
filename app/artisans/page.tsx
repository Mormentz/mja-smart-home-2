import Link from "next/link";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { listArtisans } from "@/lib/actions/service-jobs";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Artisans — HomeConnect",
  description: "Hire verified artisans for home maintenance.",
};

export default async function ArtisansPage() {
  const artisans = await listArtisans();

  return (
    <div className="min-h-screen bg-background">
      <section className="container-page pt-4">
        <div className="relative overflow-hidden rounded-4xl bg-ink text-ink-foreground pt-40 pb-16 px-6 md:px-14">
          <Header variant="dark" />
          <p className="text-sm uppercase tracking-[0.2em] text-ink-foreground/60">Artisan Hub</p>
          <h1 className="mt-4 font-display text-5xl md:text-6xl font-semibold max-w-3xl">
            Verified pros for every home fix.
          </h1>
          <p className="mt-4 text-ink-foreground/70 max-w-xl">
            Real-time availability, escrow payments, skill badges, and emergency help.
          </p>
        </div>
      </section>

      <section className="container-page mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {artisans.map((a) => {
          const ratings = a.reviewsReceived.map((r) => r.rating);
          const avg =
            ratings.length > 0
              ? (ratings.reduce((s, n) => s + n, 0) / ratings.length).toFixed(1)
              : null;
          const profile = a.serviceProfile!;
          return (
            <Link
              key={a.id}
              href={`/artisans/${a.id}`}
              className="rounded-3xl border border-border bg-card p-6 shadow-soft hover:shadow-elegant transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-xl font-semibold">{a.name ?? a.email}</h2>
                  <p className="text-sm text-muted-foreground">{profile.trade}</p>
                </div>
                {profile.verified && <Badge>Verified</Badge>}
              </div>
              <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{profile.bio}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-muted px-3 py-1">{profile.skillBadge} badge</span>
                <span className="rounded-full bg-muted px-3 py-1">${profile.hourlyRate}/hr</span>
                <span className="rounded-full bg-muted px-3 py-1">
                  {profile.available ? "Available" : "Busy"}
                </span>
                {avg && <span className="rounded-full bg-muted px-3 py-1">{avg}★</span>}
              </div>
            </Link>
          );
        })}
        {artisans.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-16">No artisans listed yet.</p>
        )}
      </section>
      <Footer />
    </div>
  );
}
