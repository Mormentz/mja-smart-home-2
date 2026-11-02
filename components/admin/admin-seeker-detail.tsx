"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { decideJobSeekerIdentity } from "@/lib/actions/job-seeker";
import { verifyEmploymentHistory } from "@/lib/actions/job-privacy";
import { AdminDetailShell } from "@/components/admin/admin-detail-shell";
import { AdminRejectDialog } from "@/components/admin/admin-reject-dialog";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/currency";
import { toast } from "sonner";

type Detail = NonNullable<
  Awaited<ReturnType<typeof import("@/lib/actions/admin-jobs").getAdminSeekerDetail>>
>;

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value || "—"}</p>
    </div>
  );
}

function fmtDate(d: Date | string | null | undefined) {
  return d ? new Date(d).toLocaleDateString() : "—";
}

export function AdminSeekerDetail({ seeker, tab }: { seeker: Detail; tab: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);

  function refresh() {
    router.refresh();
  }

  const salary =
    seeker.expectedSalaryMin != null || seeker.expectedSalaryMax != null
      ? `${seeker.expectedSalaryMin != null ? formatMoney(seeker.expectedSalaryMin) : "—"} – ${
          seeker.expectedSalaryMax != null ? formatMoney(seeker.expectedSalaryMax) : "—"
        }`
      : null;

  return (
    <AdminDetailShell
      backHref="/admin/jobs?tab=seekers"
      backLabel="All job seekers"
      title={seeker.fullName ?? seeker.user.name ?? seeker.user.email}
      subtitle={`${seeker.hcId} · ${seeker.user.email}`}
      status={seeker.identityStatus}
      actions={
        <>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/users/${seeker.user.id}`}>User account</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/jobs/seekers/${seeker.id}`}>Public profile</Link>
          </Button>
        </>
      }
    >
      <AdminTabs
        defaultTab="profile"
        tabs={[
          { id: "profile", label: "Profile" },
          { id: "identity", label: "Identity" },
          { id: "experience", label: "Experience", count: seeker.experiences.length },
          { id: "education", label: "Education", count: seeker.educationDocs.length },
          { id: "guarantor", label: "Guarantor" },
          { id: "applications", label: "Applications", count: seeker.applications.length },
        ]}
      />

      <div className="mt-4 rounded-xl border border-border/60 bg-card p-4">
        {tab === "profile" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Full name" value={seeker.fullName} />
            <Field label="Phone" value={seeker.phone} />
            <Field label="Email" value={seeker.email} />
            <Field label="Location" value={[seeker.cityTown, seeker.lgaName, seeker.stateOfResidence].filter(Boolean).join(", ")} />
            <Field label="Preferred title" value={seeker.preferredJobTitle} />
            <Field label="Primary category" value={seeker.primaryJobCategory} />
            <Field label="Primary skill" value={seeker.primarySkill} />
            <Field label="Years of experience" value={seeker.yearsOfExperience} />
            <Field label="Expected salary" value={salary} />
            <Field label="Employment types" value={seeker.employmentTypes.join(", ").replace(/_/g, " ")} />
            <Field label="Highest qualification" value={seeker.highestQualification} />
            <Field label="Registration step" value={seeker.registrationStep} />
            <Field label="Submitted" value={fmtDate(seeker.submittedAt)} />
            <Field label="Profile visibility" value={seeker.profileHidden ? "Hidden by user" : "Visible"} />
            <Field label="CV access default" value={seeker.cvAccessDefault} />
            <Field label="Profile views" value={seeker._count.profileViews} />
            <Field label="Contact requests" value={seeker._count.contactRequests} />
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Professional summary" value={seeker.professionalSummary} />
            </div>
          </div>
        )}

        {tab === "identity" && (
          <div className="max-w-xl space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <AdminStatusBadge status={seeker.identityStatus} />
              {seeker.identityVerifiedAt && (
                <span className="text-xs text-muted-foreground">
                  Verified {fmtDate(seeker.identityVerifiedAt)}
                </span>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="ID type" value={seeker.idDocumentType?.replace(/_/g, " ")} />
              <Field
                label="ID document"
                value={
                  seeker.idDocumentUrl ? (
                    <a
                      href={seeker.idDocumentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline"
                    >
                      Open file
                    </a>
                  ) : (
                    "Not uploaded"
                  )
                }
              />
              <Field label="ID number on file" value={seeker.hasIdNumber ? "Yes (encrypted)" : "No"} />
              <Field label="Provider ref" value={seeker.identityProviderRef} />
            </div>
            {seeker.identityNote && (
              <p className="text-xs text-muted-foreground">Note: {seeker.identityNote}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={pending || seeker.identityStatus === "VERIFIED"}
                onClick={() =>
                  start(async () => {
                    await decideJobSeekerIdentity(seeker.id, true);
                    toast.success("Identity approved");
                    refresh();
                  })
                }
              >
                Approve identity
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={pending || seeker.identityStatus === "REJECTED"}
                onClick={() => setRejectOpen(true)}
              >
                Reject identity
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    await verifyEmploymentHistory(seeker.id, !seeker.employmentHistoryVerified);
                    toast.success(
                      seeker.employmentHistoryVerified
                        ? "Employment history unverified"
                        : "Employment history verified",
                    );
                    refresh();
                  })
                }
              >
                {seeker.employmentHistoryVerified ? "Unverify employment history" : "Verify employment history"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Employment history: {seeker.employmentHistoryVerified ? "verified" : "not verified"}
            </p>
          </div>
        )}

        {tab === "experience" && (
          <ul className="divide-y divide-border/50">
            {seeker.experiences.length === 0 && (
              <p className="text-sm text-muted-foreground">No experience entries.</p>
            )}
            {seeker.experiences.map((x) => (
              <li key={x.id} className="flex flex-wrap items-start justify-between gap-2 py-2.5">
                <div>
                  <p className="text-sm font-medium">
                    {x.jobTitle} · {x.employerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {fmtDate(x.startDate)} – {x.endDate ? fmtDate(x.endDate) : "present"}
                    {x.permissionToContact ? " · may contact" : ""}
                  </p>
                  {x.responsibilities && <p className="mt-1 text-xs">{x.responsibilities}</p>}
                </div>
                <AdminStatusBadge status={x.verified ? "VERIFIED" : "UNVERIFIED"} />
              </li>
            ))}
          </ul>
        )}

        {tab === "education" && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Institution" value={seeker.institutionName} />
              <Field label="Course" value={seeker.courseOfStudy} />
              <Field label="Graduation year" value={seeker.yearOfGraduation} />
            </div>
            <ul className="divide-y divide-border/50">
              {seeker.educationDocs.length === 0 && (
                <p className="text-sm text-muted-foreground">No documents uploaded.</p>
              )}
              {seeker.educationDocs.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{d.label}</p>
                    <a href={d.url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                      Open file
                    </a>
                    {d.note && <p className="text-xs text-muted-foreground">{d.note}</p>}
                  </div>
                  <AdminStatusBadge status={d.status} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "guarantor" && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Guarantor status</span>
              <AdminStatusBadge status={seeker.guarantorStatus} />
            </div>
            {seeker.guarantor ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Name" value={seeker.guarantor.fullName} />
                <Field label="Phone" value={seeker.guarantor.phone} />
                <Field label="Email" value={seeker.guarantor.email} />
                <Field label="Relationship" value={seeker.guarantor.relationship} />
                <Field label="Occupation" value={seeker.guarantor.occupation} />
                <Field label="Years known" value={seeker.guarantor.yearsKnown} />
                <Field label="Invite sent" value={fmtDate(seeker.guarantor.inviteSentAt)} />
                <Field label="Confirmed" value={fmtDate(seeker.guarantor.confirmedAt)} />
                <Field label="Consent to contact" value={seeker.guarantor.consentToContact ? "Yes" : "No"} />
              </div>
            ) : (
              <p className="text-muted-foreground">No guarantor on file.</p>
            )}
          </div>
        )}

        {tab === "applications" && (
          <ul className="divide-y divide-border/50">
            {seeker.applications.length === 0 && (
              <p className="text-sm text-muted-foreground">No applications.</p>
            )}
            {seeker.applications.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div>
                  <Link href={`/admin/jobs/vacancies/${a.vacancy.id}`} className="text-sm font-medium hover:underline">
                    {a.vacancy.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">Applied {fmtDate(a.createdAt)}</p>
                </div>
                <AdminStatusBadge status={a.vacancy.published ? "ACTIVE" : "CLOSED"} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <AdminRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject identity"
        onConfirm={async (note) => {
          await decideJobSeekerIdentity(seeker.id, false, note);
          toast.success("Identity rejected");
          refresh();
        }}
      />
    </AdminDetailShell>
  );
}
