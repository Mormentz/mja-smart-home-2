"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { decideVacancyReview } from "@/lib/actions/admin-jobs";
import { AdminDetailShell } from "@/components/admin/admin-detail-shell";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/currency";
import { toast } from "sonner";

type Detail = NonNullable<
  Awaited<ReturnType<typeof import("@/lib/actions/admin-jobs").getAdminVacancyDetail>>
>;

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value || "—"}</p>
    </div>
  );
}

export function AdminVacancyDetail({ vacancy, tab }: { vacancy: Detail; tab: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const status = vacancy.pendingReview ? "PENDING" : vacancy.published ? "ACTIVE" : "CLOSED";
  const employerName =
    vacancy.employer.companyName || vacancy.employer.fullName || vacancy.employer.hcId;

  const salary =
    vacancy.salaryMin != null || vacancy.salaryMax != null
      ? `${vacancy.salaryMin != null ? formatMoney(vacancy.salaryMin) : "—"} – ${
          vacancy.salaryMax != null ? formatMoney(vacancy.salaryMax) : "—"
        }`
      : null;

  function decide(approve: boolean) {
    start(async () => {
      const r = await decideVacancyReview(vacancy.id, approve);
      if (r.error) toast.error(r.error);
      else {
        toast.success(approve ? "Vacancy published" : "Vacancy unpublished");
        router.refresh();
      }
    });
  }

  return (
    <AdminDetailShell
      backHref="/admin/jobs?tab=vacancies"
      backLabel="All vacancies"
      title={vacancy.title}
      subtitle={`${employerName} · posted ${new Date(vacancy.createdAt).toLocaleDateString()}`}
      status={status}
      actions={
        <>
          <Button size="sm" disabled={pending || vacancy.published} onClick={() => decide(true)}>
            {vacancy.pendingReview ? "Approve & publish" : "Publish"}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={pending || (!vacancy.published && !vacancy.pendingReview)}
            onClick={() => decide(false)}
          >
            {vacancy.pendingReview ? "Reject" : "Unpublish"}
          </Button>
        </>
      }
    >
      <AdminTabs
        defaultTab="details"
        tabs={[
          { id: "details", label: "Details" },
          { id: "applications", label: "Applications", count: vacancy.applications.length },
        ]}
      />

      <div className="mt-4 rounded-xl border border-border/60 bg-card p-4">
        {tab === "details" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="Employer"
                value={
                  <Link href={`/admin/jobs/employers/${vacancy.employer.id}`} className="text-primary hover:underline">
                    {employerName}
                  </Link>
                }
              />
              <Field label="Employer verification" value={<AdminStatusBadge status={vacancy.employer.verificationStatus} />} />
              <Field label="Category" value={vacancy.category} />
              <Field label="Location" value={vacancy.location} />
              <Field label="Employment types" value={vacancy.employmentTypes.join(", ").replace(/_/g, " ")} />
              <Field label="Salary" value={salary} />
              <Field label="Published" value={vacancy.published ? "Yes" : "No"} />
              <Field label="Pending review" value={vacancy.pendingReview ? "Yes" : "No"} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{vacancy.description}</p>
            </div>
          </div>
        )}

        {tab === "applications" && (
          <ul className="divide-y divide-border/50">
            {vacancy.applications.length === 0 && (
              <p className="text-sm text-muted-foreground">No applications yet.</p>
            )}
            {vacancy.applications.map((a) => (
              <li key={a.id} className="py-2.5 text-sm">
                <Link href={`/admin/jobs/seekers/${a.seekerProfile.id}`} className="font-medium hover:underline">
                  {a.seekerProfile.fullName ?? a.seekerProfile.hcId}
                </Link>
                <span className="ml-2 font-mono text-xs text-muted-foreground">{a.seekerProfile.hcId}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {new Date(a.createdAt).toLocaleDateString()}
                </span>
                {a.coverNote && <p className="mt-1 text-xs text-muted-foreground">{a.coverNote}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminDetailShell>
  );
}
