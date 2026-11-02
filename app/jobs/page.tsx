import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Building2, UserRound } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const metadata: Metadata = {
  title: "Jobs — HomeConnect",
  description:
    "Verified job seekers and employers. Protected CVs, identity checks, and secure contact requests.",
};

export default function JobsHubPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink to-ink/90" />
        <Header variant="dark" />
        <div className="relative container-page pb-16 pt-36 md:pb-20 md:pt-40">
          <p className="text-sm uppercase tracking-[0.2em] text-ink-foreground/65">Jobs Hub</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold text-balance md:text-6xl">
            Hire and get hired with{" "}
            <span className="text-success">verified confidence</span>.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink-foreground/75">
            Job seekers keep private details protected. Employers connect only after verification.
            Contact details stay off public profiles.
          </p>
        </div>
      </section>

      <section className="container-page py-14 md:py-20">
        <h2 className="font-display text-2xl font-semibold md:text-3xl">What would you like to do?</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <HubCard
            href="/jobs/register/seeker"
            icon={<UserRound size={22} />}
            title="Register as a Job Seeker"
            description="Build a protected professional profile, verify your identity, and apply for roles."
          />
          <HubCard
            href="/jobs/register/employer"
            icon={<Building2 size={22} />}
            title="Register as an Employer"
            description="Verify your business or household, post vacancies, and request contact with candidates."
          />
          <HubCard
            href="/jobs/seekers"
            icon={<Briefcase size={22} />}
            title="Browse Job Seekers"
            description="View public professional profiles — names and contacts stay private until authorized."
          />
        </div>
        <div className="mt-8">
          <Link href="/jobs/vacancies" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            Browse open vacancies →
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}

function HubCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-border/70 bg-card p-6 transition hover:border-primary/40 hover:shadow-sm"
    >
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</span>
      <h3 className="mt-4 font-display text-xl font-semibold group-hover:text-primary">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
