import { Suspense } from "react";
import { requireAdminSession } from "@/lib/auth/admin";
import {
  listAdminApplications,
  listAdminEmployers,
  listAdminJobFlags,
  listAdminJobSeekers,
  listAdminVacancies,
} from "@/lib/actions/admin-jobs";
import { prisma } from "@/lib/prisma";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminTabs } from "@/components/admin/admin-tabs";
import {
  AdminApplicationsList,
  AdminEmployersList,
  AdminFlagsList,
  AdminSeekersList,
  AdminVacanciesList,
} from "@/components/admin/admin-jobs-directory";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

const VERIFY_CHIPS = [
  { id: "PENDING", label: "Pending" },
  { id: "VERIFIED", label: "Verified" },
  { id: "REJECTED", label: "Rejected" },
  { id: "UNVERIFIED", label: "Unverified" },
];

const TABS = ["seekers", "employers", "vacancies", "applications", "flags"] as const;
type JobsTab = (typeof TABS)[number];

export default async function AdminJobsPage({ searchParams }: PageProps) {
  await requireAdminSession();
  const sp = (await searchParams) ?? {};
  const rawTab = one(sp.tab);
  const tab: JobsTab = (TABS as readonly string[]).includes(rawTab ?? "") ? (rawTab as JobsTab) : "seekers";
  const q = one(sp.q)?.trim();
  const status = one(sp.status)?.trim();

  const [seekerCount, employerCount, vacancyCount, applicationCount, openFlags, pendingVacancies, privacy] =
    await Promise.all([
      prisma.jobSeekerProfile.count(),
      prisma.employerProfile.count(),
      prisma.employmentVacancy.count(),
      prisma.jobApplication.count(),
      prisma.flaggedAccount.count({ where: { resolved: false } }),
      prisma.employmentVacancy.count({ where: { pendingReview: true } }),
      prisma.privacyRequest.count({ where: { status: "OPEN" } }),
    ]);

  const chips =
    tab === "vacancies"
      ? [
          { id: "pending", label: "Pending review" },
          { id: "published", label: "Published" },
          { id: "unpublished", label: "Unpublished" },
        ]
      : tab === "flags"
        ? [
            { id: "open", label: "Open" },
            { id: "resolved", label: "Resolved" },
          ]
        : tab === "seekers" || tab === "employers"
          ? VERIFY_CHIPS
          : undefined;

  return (
    <DashboardSection
      title="Jobs"
      description="Job seekers, employers, vacancies, applications, and account flags."
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Seekers" value={seekerCount} />
        <Stat label="Employers" value={employerCount} />
        <Stat label="Vacancies" value={vacancyCount} hint={pendingVacancies ? `${pendingVacancies} pending review` : undefined} />
        <Stat label="Applications" value={applicationCount} />
      </div>
      {(openFlags > 0 || privacy > 0) && (
        <p className="mb-4 text-xs text-muted-foreground">
          {openFlags} open flag(s) · {privacy} open privacy request(s)
        </p>
      )}

      <Suspense fallback={null}>
        <AdminTabs
          defaultTab="seekers"
          tabs={[
            { id: "seekers", label: "Seekers", count: seekerCount },
            { id: "employers", label: "Employers", count: employerCount },
            { id: "vacancies", label: "Vacancies", count: pendingVacancies },
            { id: "applications", label: "Applications" },
            { id: "flags", label: "Flags", count: openFlags },
          ]}
        />
        <div className="my-4">
          <AdminFilterBar
            key={tab}
            searchPlaceholder={`Search ${tab}…`}
            chips={chips}
            chipParam="status"
          />
        </div>
      </Suspense>

      {tab === "seekers" && <AdminSeekersList rows={await listAdminJobSeekers({ q, status })} />}
      {tab === "employers" && <AdminEmployersList rows={await listAdminEmployers({ q, status })} />}
      {tab === "vacancies" && <AdminVacanciesList rows={await listAdminVacancies({ q, status })} />}
      {tab === "applications" && <AdminApplicationsList rows={await listAdminApplications({ q })} />}
      {tab === "flags" && (
        <AdminFlagsList
          rows={await listAdminJobFlags({
            q,
            resolved: status === "resolved" ? true : status === "open" ? false : undefined,
          })}
        />
      )}
    </DashboardSection>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {hint && <p className="mt-1 text-[11px] text-amber-700">{hint}</p>}
    </div>
  );
}
