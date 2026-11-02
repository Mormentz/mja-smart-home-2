"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { decideEmployerVerification } from "@/lib/actions/employer";
import { AdminDetailShell } from "@/components/admin/admin-detail-shell";
import { AdminRejectDialog } from "@/components/admin/admin-reject-dialog";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Detail = NonNullable<
  Awaited<ReturnType<typeof import("@/lib/actions/admin-jobs").getAdminEmployerDetail>>
>;

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value || "—"}</p>
    </div>
  );
}

export function AdminEmployerDetail({ employer, tab }: { employer: Detail; tab: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);

  function refresh() {
    router.refresh();
  }

  const openFlags = employer.user.flaggedAccounts.filter((f) => !f.resolved).length;

  return (
    <AdminDetailShell
      backHref="/admin/jobs?tab=employers"
      backLabel="All employers"
      title={employer.companyName || employer.fullName || employer.user.name || employer.user.email}
      subtitle={`${employer.hcId} · ${employer.kind.toLowerCase()} · ${employer.user.email}`}
      status={employer.verificationStatus}
      actions={
        <Button size="sm" variant="outline" asChild>
          <Link href={`/admin/users/${employer.user.id}`}>User account</Link>
        </Button>
      }
    >
      <AdminTabs
        defaultTab="profile"
        tabs={[
          { id: "profile", label: "Profile" },
          { id: "verification", label: "Verification" },
          { id: "vacancies", label: "Vacancies", count: employer.vacancies.length },
          { id: "flags", label: "Flags", count: openFlags },
        ]}
      />

      <div className="mt-4 rounded-xl border border-border/60 bg-card p-4">
        {tab === "profile" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Company name" value={employer.companyName} />
            <Field label="Contact / full name" value={employer.fullName} />
            <Field label="Official email" value={employer.officialEmail} />
            <Field label="Phone" value={employer.phone} />
            <Field label="CAC number" value={employer.cacNumber} />
            <Field label="Authorised rep" value={employer.authorizedRepName} />
            <Field label="General location" value={employer.generalLocation} />
            <Field label="Nature of employment" value={employer.natureOfEmployment} />
            <Field label="Registration step" value={employer.registrationStep} />
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Business address" value={employer.businessAddress} />
            </div>
          </div>
        )}

        {tab === "verification" && (
          <div className="max-w-xl space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-muted-foreground">Verification</span>
              <AdminStatusBadge status={employer.verificationStatus} />
              <span className="text-muted-foreground">Identity</span>
              <AdminStatusBadge status={employer.identityStatus} />
            </div>
            <Field
              label="Authorised rep ID"
              value={
                employer.authorizedRepIdUrl ? (
                  <a
                    href={employer.authorizedRepIdUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    Open file
                  </a>
                ) : null
              }
            />
            {employer.verificationNote && (
              <p className="text-xs text-muted-foreground">Note: {employer.verificationNote}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={pending || employer.verificationStatus === "VERIFIED"}
                onClick={() =>
                  start(async () => {
                    await decideEmployerVerification(employer.id, true);
                    toast.success("Employer verified");
                    refresh();
                  })
                }
              >
                Approve employer
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={pending || employer.verificationStatus === "REJECTED"}
                onClick={() => setRejectOpen(true)}
              >
                Reject employer
              </Button>
            </div>
          </div>
        )}

        {tab === "vacancies" && (
          <ul className="divide-y divide-border/50">
            {employer.vacancies.length === 0 && (
              <p className="text-sm text-muted-foreground">No vacancies posted.</p>
            )}
            {employer.vacancies.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div>
                  <Link href={`/admin/jobs/vacancies/${v.id}`} className="text-sm font-medium hover:underline">
                    {v.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {v._count.applications} applicant(s) · {new Date(v.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <AdminStatusBadge status={v.pendingReview ? "PENDING" : v.published ? "ACTIVE" : "CLOSED"} />
              </li>
            ))}
          </ul>
        )}

        {tab === "flags" && (
          <ul className="divide-y divide-border/50">
            {employer.user.flaggedAccounts.length === 0 && (
              <p className="text-sm text-muted-foreground">No flags on this account.</p>
            )}
            {employer.user.flaggedAccounts.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <div>
                  <p>{f.reason}</p>
                  <p className="text-xs text-muted-foreground">{new Date(f.createdAt).toLocaleString()}</p>
                </div>
                <AdminStatusBadge status={f.resolved ? "RESOLVED" : "OPEN"} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <AdminRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject employer"
        onConfirm={async (note) => {
          await decideEmployerVerification(employer.id, false, note);
          toast.success("Employer rejected");
          refresh();
        }}
      />
    </AdminDetailShell>
  );
}
