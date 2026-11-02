import type { Metadata } from "next";
import Link from "next/link";
import { listPublicJobSeekers } from "@/lib/actions/job-seeker";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Job Seekers — HomeConnect",
};

export default async function JobSeekersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
}) {
  const sp = (await searchParams) ?? {};
  const q = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const seekers = await listPublicJobSeekers({ q });

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-ink text-ink-foreground">
        <Header variant="dark" />
        <div className="container-page pb-10 pt-32">
          <h1 className="font-display text-3xl font-semibold md:text-4xl">Public professional profiles</h1>
          <p className="mt-2 max-w-2xl text-ink-foreground/75">
            Contact information is private. Verified employers can request to contact a candidate.
          </p>
        </div>
      </div>
      <div className="container-page py-10">
        <div className="grid gap-4 md:grid-cols-2">
          {seekers.map((s) => (
            <Link
              key={s.id}
              href={`/jobs/seekers/${s.id}`}
              className="rounded-2xl border border-border/70 bg-card p-5 transition hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{s.hcId}</p>
                  <h2 className="mt-1 font-display text-xl font-semibold">{s.displayName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {s.preferredJobTitle ?? s.primaryJobCategory ?? "Professional"} · {s.generalLocation ?? "Nigeria"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {s.identityVerified && <Badge>Identity Verified</Badge>}
                  {s.employmentHistoryVerified && <Badge variant="secondary">Employment Verified</Badge>}
                  {s.guarantorConfirmed && <Badge variant="outline">Reference Confirmed</Badge>}
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{s.professionalSummary}</p>
              <p className="mt-3 text-xs font-medium">Contact information: Private</p>
            </Link>
          ))}
          {!seekers.length && (
            <p className="text-muted-foreground">No submitted job seeker profiles yet.</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
