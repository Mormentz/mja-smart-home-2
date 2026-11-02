import Link from "next/link";
import { Briefcase, Building2, Shield } from "lucide-react";
import { requireAuth } from "@/lib/auth/roles";
import { getMyJobSeekerProfile } from "@/lib/actions/job-seeker";
import { getMyEmployerProfile, listMyContactRequests } from "@/lib/actions/employer";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContactRespondButtons } from "@/components/jobs/contact-respond-buttons";
import { ReportEmployerButton } from "@/components/jobs/report-employer-button";
import { PostVacancyForm } from "@/components/jobs/post-vacancy-form";

export default async function EmploymentDashboardPage() {
  const session = await requireAuth();
  const [seeker, employer, contacts] = await Promise.all([
    getMyJobSeekerProfile(),
    getMyEmployerProfile(),
    listMyContactRequests(),
  ]);

  return (
    <DashboardSection
      title="Employment"
      description="Protected job seeker profiles, verified employers, and contact requests."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="border-b border-border/60 bg-muted/40 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Briefcase size={18} />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold">Job seeker</h2>
                <p className="text-xs text-muted-foreground">Public profile stays privacy-safe</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 p-5">
            {seeker ? (
              <>
                <p className="font-mono text-xs text-muted-foreground">{seeker.hcId}</p>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (seeker.registrationStep / 11) * 100)}%` }}
                  />
                </div>
                <p className="text-sm">
                  Registration step {seeker.registrationStep}/11 ·{" "}
                  {seeker.submittedAt ? "Submitted" : "In progress"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={seeker.identityStatus === "VERIFIED" ? "default" : "secondary"}>
                    Identity: {seeker.identityStatus}
                  </Badge>
                  <Badge variant="outline">Guarantor: {seeker.guarantorStatus}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" asChild>
                    <Link href="/jobs/register/seeker">Continue registration</Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/dashboard/employment/privacy">
                      <Shield size={14} className="mr-1" /> Privacy
                    </Link>
                  </Button>
                  {seeker.submittedAt && (
                    <Button size="sm" variant="secondary" asChild>
                      <Link href={`/jobs/seekers/${seeker.id}`}>Public profile</Link>
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Build a verified employment profile with controlled CV access.
                </p>
                <Button asChild>
                  <Link href="/jobs/register/seeker">Register as job seeker</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="border-b border-border/60 bg-muted/40 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Building2 size={18} />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold">Employer</h2>
                <p className="text-xs text-muted-foreground">Verify before posting or contacting</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 p-5">
            {employer ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs text-muted-foreground">{employer.hcId}</p>
                  <Badge>{employer.verificationStatus}</Badge>
                </div>
                <PostVacancyForm canPublish={employer.verificationStatus === "VERIFIED"} />
                {employer.vacancies.length > 0 && (
                  <ul className="space-y-2 border-t pt-3 text-sm">
                    {employer.vacancies.map((v) => (
                      <li
                        key={v.id}
                        className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2"
                      >
                        <span className="truncate font-medium">{v.title}</span>
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {v.published ? "Live" : "Draft"}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Register your business or household to post vacancies.
                </p>
                <Button asChild>
                  <Link href="/jobs/register/employer">Register as employer</Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="border-b border-border/60 px-5 py-4">
          <h2 className="font-display text-lg font-semibold">Contact requests</h2>
          <p className="text-xs text-muted-foreground">Phone numbers stay private until you accept</p>
        </div>
        <ul className="divide-y divide-border/60">
          {contacts.map((c) => (
            <li key={c.id} className="px-5 py-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{c.status}</Badge>
                {c.jobOpportunity && <span className="font-medium">{c.jobOpportunity}</span>}
              </div>
              <p className="mt-2 text-muted-foreground">{c.message}</p>
              {c.status === "PENDING" && c.seekerUserId === session.user.id && (
                <ContactRespondButtons requestId={c.id} />
              )}
              {c.seekerUserId === session.user.id && <ReportEmployerButton employerUserId={c.employerUserId} />}
            </li>
          ))}
          {!contacts.length && (
            <li className="px-5 py-8 text-sm text-muted-foreground">No contact requests yet.</li>
          )}
        </ul>
      </section>
    </DashboardSection>
  );
}
