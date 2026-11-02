import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicJobSeeker } from "@/lib/actions/job-seeker";
import { recordProfileView } from "@/lib/actions/job-privacy";
import { auth } from "@/auth";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Badge } from "@/components/ui/badge";
import { ContactRequestForm } from "@/components/jobs/contact-request-form";

export const metadata: Metadata = {
  title: "Job Seeker Profile — HomeConnect",
};

export default async function PublicSeekerPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const { id } = await params;
  const seeker = await getPublicJobSeeker(id);
  if (!seeker) notFound();
  const session = await auth();
  if (session?.user) {
    // Log signed-in views so seekers can see them in their privacy dashboard
    try {
      await recordProfileView(seeker.id);
    } catch (error) {
      console.error("[jobs] recordProfileView failed", error);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-ink text-ink-foreground">
        <Header variant="dark" />
        <div className="container-page pb-10 pt-32">
          <p className="font-mono text-sm text-success">{seeker.hcId}</p>
          <h1 className="mt-2 font-display text-4xl font-semibold">{seeker.displayName}</h1>
          <p className="mt-2 text-ink-foreground/75">
            {seeker.preferredJobTitle ?? "Professional"} · {seeker.generalLocation ?? "Nigeria"}
          </p>
        </div>
      </div>
      <div className="container-page grid gap-8 py-10 md:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section>
            <h2 className="font-display text-xl font-semibold">Professional summary</h2>
            <p className="mt-2 text-muted-foreground">{seeker.professionalSummary || "—"}</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold">Skills & experience</h2>
            <p className="mt-2 text-sm">
              {seeker.yearsOfExperience != null ? `${seeker.yearsOfExperience} years` : "Experience not listed"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{seeker.additionalSkills.join(", ") || "—"}</p>
            <p className="mt-2 text-sm">Education: {seeker.highestQualification ?? "—"}</p>
            {(seeker.expectedSalaryMin || seeker.expectedSalaryMax) && (
              <p className="mt-2 text-sm">
                Expected salary: ₦{seeker.expectedSalaryMin?.toLocaleString() ?? "?"}–₦
                {seeker.expectedSalaryMax?.toLocaleString() ?? "?"}
              </p>
            )}
          </section>
          <p className="text-xs text-muted-foreground">
            Identity Verified means HomeConnect completed stated identity checks. It does not guarantee character or
            future conduct.
          </p>
        </div>
        <aside className="space-y-4 rounded-2xl border bg-card p-5">
          <div className="flex flex-wrap gap-2">
            {seeker.identityVerified && <Badge>✓ Identity Verified</Badge>}
            {seeker.employmentHistoryVerified && <Badge variant="secondary">✓ Employment History Verified</Badge>}
            {seeker.guarantorConfirmed && <Badge variant="outline">✓ Reference Confirmed</Badge>}
          </div>
          <p className="text-sm font-medium">Contact Information: Private</p>
          <p className="text-sm text-muted-foreground">
            Guarantor/Reference status: {seeker.guarantorConfirmed ? "Confirmed" : "Not confirmed"}
          </p>
          {session?.user ? (
            <ContactRequestForm seekerProfileId={seeker.id} />
          ) : (
            <p className="text-sm text-muted-foreground">Sign in as a verified employer to request contact.</p>
          )}
        </aside>
      </div>
      <Footer />
    </div>
  );
}
