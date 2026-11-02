import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedVacancies } from "@/lib/actions/employer";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ApplyButton } from "@/components/jobs/apply-button";

export const metadata: Metadata = {
  title: "Vacancies — HomeConnect",
};

export default async function VacanciesPage() {
  const vacancies = await listPublishedVacancies();

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-ink text-ink-foreground">
        <Header variant="dark" />
        <div className="container-page pb-10 pt-32">
          <h1 className="font-display text-3xl font-semibold">Open vacancies</h1>
          <p className="mt-2 text-ink-foreground/75">Posted by verified employers on HomeConnect Jobs.</p>
          <Link href="/dashboard/employment" className="mt-4 inline-block text-sm text-success hover:underline">
            Post a vacancy →
          </Link>
        </div>
      </div>
      <div className="container-page space-y-4 py-10">
        {vacancies.map((v) => (
          <article key={v.id} className="rounded-2xl border bg-card p-5">
            <h2 className="font-display text-xl font-semibold">{v.title}</h2>
            <p className="text-sm text-muted-foreground">
              {v.location ?? "Location flexible"} · {v.employer.companyName || v.employer.fullName || v.employer.hcId}
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm">{v.description}</p>
            <div className="mt-4">
              <ApplyButton vacancyId={v.id} />
            </div>
          </article>
        ))}
        {!vacancies.length && <p className="text-muted-foreground">No published vacancies yet.</p>}
      </div>
      <Footer />
    </div>
  );
}
