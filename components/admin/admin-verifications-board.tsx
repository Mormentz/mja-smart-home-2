"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { decideArtisanVerification, decidePropertyVerification } from "@/lib/actions/verification";
import { adminDecideUserKyc } from "@/lib/actions/admin-users";
import { decideKycDocument } from "@/lib/actions/kyc";
import { decideJobSeekerIdentity } from "@/lib/actions/job-seeker";
import { decideEmployerVerification } from "@/lib/actions/employer";
import { decideEquipmentListing, decideOwnerIdentity } from "@/lib/actions/equipment-rentals";
import { AdminRejectDialog } from "@/components/admin/admin-reject-dialog";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Queues = Awaited<ReturnType<typeof import("@/lib/actions/admin-verifications").getVerificationQueues>>;

export function AdminVerificationsBoard({
  data,
  status,
}: {
  data: Queues;
  status: "pending" | "approved" | "rejected";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [reject, setReject] = useState<null | { kind: string; id: string }>(null);

  function refresh() {
    router.refresh();
  }

  const canAct = status === "pending";

  return (
    <div className="mt-4 space-y-6">
      <Queue
        title="KYC profiles"
        empty="None in this status."
        items={data.kycUsers.map((u) => ({
          id: u.id,
          title: u.name ?? u.email,
          meta: `${u.role} · ${u.kycLevel} · ${u.phone ?? "no phone"}`,
          href: `/admin/verifications/kyc/${u.id}`,
          status: u.kycStatus,
          onApprove: canAct
            ? () =>
                start(async () => {
                  const r = await adminDecideUserKyc(u.id, "VERIFIED");
                  if (r.error) toast.error(r.error);
                  else {
                    toast.success("KYC approved");
                    refresh();
                  }
                })
            : undefined,
          onReject: canAct ? () => setReject({ kind: "kyc-user", id: u.id }) : undefined,
        }))}
      />

      <Queue
        title="KYC documents"
        empty="None in this status."
        items={data.kycDocuments.map((d) => ({
          id: d.id,
          title: `${d.user.name ?? d.user.email} · T${d.tier} ${d.type}`,
          meta: d.user.phone ?? d.user.email,
          href: `/admin/verifications/kyc/${d.user.id}`,
          status: d.status,
          extra: (
            <a href={d.url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
              Open file
            </a>
          ),
          onApprove: canAct
            ? () =>
                start(async () => {
                  const r = await decideKycDocument(d.id, "VERIFIED");
                  if (r.error) toast.error(r.error);
                  else {
                    toast.success("Document approved");
                    refresh();
                  }
                })
            : undefined,
          onReject: canAct ? () => setReject({ kind: "kyc-doc", id: d.id }) : undefined,
        }))}
      />

      <Queue
        title="Properties"
        empty="None in this status."
        items={data.properties.map((p) => ({
          id: p.id,
          title: p.title,
          meta: `${p.owner.name ?? p.owner.email} · ${p.location}`,
          href: `/admin/properties/${p.id}`,
          status: p.verificationStatus,
          onApprove: canAct
            ? () =>
                start(async () => {
                  const r = await decidePropertyVerification(p.id, "VERIFIED");
                  if (r.error) toast.error(r.error);
                  else {
                    toast.success("Property verified");
                    refresh();
                  }
                })
            : undefined,
          onReject: canAct
            ? () =>
                start(async () => {
                  const r = await decidePropertyVerification(p.id, "REJECTED");
                  if (r.error) toast.error(r.error);
                  else {
                    toast.success("Property rejected");
                    refresh();
                  }
                })
            : undefined,
        }))}
      />

      <Queue
        title="Artisans"
        empty="None in this status."
        items={data.artisans.map((a) => ({
          id: a.userId,
          title: a.user.name ?? a.user.email,
          meta: a.trade,
          href: `/admin/artisans/${a.userId}`,
          status: a.verificationStatus,
          onApprove: canAct
            ? () =>
                start(async () => {
                  const r = await decideArtisanVerification(a.userId, "VERIFIED");
                  if (r.error) toast.error(r.error);
                  else {
                    toast.success("Artisan verified");
                    refresh();
                  }
                })
            : undefined,
          onReject: canAct
            ? () =>
                start(async () => {
                  const r = await decideArtisanVerification(a.userId, "REJECTED");
                  if (r.error) toast.error(r.error);
                  else {
                    toast.success("Artisan rejected");
                    refresh();
                  }
                })
            : undefined,
        }))}
      />

      <Queue
        title="Job seekers"
        empty="None in this status."
        items={data.seekers.map((s) => ({
          id: s.id,
          title: s.user.name ?? s.user.email,
          meta: s.hcId,
          href: `/admin/jobs/seekers/${s.id}`,
          status: s.identityStatus,
          onApprove: canAct
            ? () =>
                start(async () => {
                  const r = await decideJobSeekerIdentity(s.id, true);
                  if (r.error) toast.error(r.error);
                  else {
                    toast.success("Seeker approved");
                    refresh();
                  }
                })
            : undefined,
          onReject: canAct ? () => setReject({ kind: "seeker", id: s.id }) : undefined,
        }))}
      />

      <Queue
        title="Employers"
        empty="None in this status."
        items={data.employers.map((e) => ({
          id: e.id,
          title: e.user.name ?? e.user.email,
          meta: e.kind,
          href: `/admin/jobs/employers/${e.id}`,
          status: e.verificationStatus,
          onApprove: canAct
            ? () =>
                start(async () => {
                  const r = await decideEmployerVerification(e.id, true);
                  if (r.error) toast.error(r.error);
                  else {
                    toast.success("Employer approved");
                    refresh();
                  }
                })
            : undefined,
          onReject: canAct ? () => setReject({ kind: "employer", id: e.id }) : undefined,
        }))}
      />

      <Queue
        title="Rental owners"
        empty="None in this status."
        items={data.rentalOwners.map((o) => ({
          id: o.id,
          title: o.user.name ?? o.user.email,
          meta: o.hcId,
          href: `/admin/rentals?tab=owners`,
          status: o.identityStatus,
          onApprove: canAct
            ? () =>
                start(async () => {
                  const r = await decideOwnerIdentity(o.id, true);
                  if (r.error) toast.error(r.error);
                  else {
                    toast.success("Owner verified");
                    refresh();
                  }
                })
            : undefined,
          onReject: canAct
            ? () =>
                start(async () => {
                  const r = await decideOwnerIdentity(o.id, false);
                  if (r.error) toast.error(r.error);
                  else {
                    toast.success("Owner rejected");
                    refresh();
                  }
                })
            : undefined,
        }))}
      />

      <Queue
        title="Rental listings"
        empty="None in this status."
        items={data.rentalListings.map((l) => ({
          id: l.id,
          title: l.name,
          meta: l.owner.user.name ?? l.owner.user.email,
          href: `/admin/rentals/listings/${l.id}`,
          status: l.status,
          onApprove: canAct
            ? () =>
                start(async () => {
                  const r = await decideEquipmentListing(l.id, {
                    approve: true,
                    ownershipReviewed: true,
                    equipmentInspected: true,
                    functionalityTested: true,
                  });
                  if ("error" in r && r.error) toast.error(String(r.error));
                  else {
                    toast.success("Listing approved");
                    refresh();
                  }
                })
            : undefined,
          onReject: canAct
            ? () =>
                start(async () => {
                  const r = await decideEquipmentListing(l.id, { approve: false });
                  if ("error" in r && r.error) toast.error(String(r.error));
                  else {
                    toast.success("Listing rejected");
                    refresh();
                  }
                })
            : undefined,
        }))}
      />

      <AdminRejectDialog
        open={!!reject}
        onOpenChange={(o) => !o && setReject(null)}
        onConfirm={async (note) => {
          if (!reject) return;
          if (reject.kind === "kyc-user") {
            const r = await adminDecideUserKyc(reject.id, "REJECTED", note);
            if (r.error) toast.error(r.error);
            else toast.success("KYC rejected");
          } else if (reject.kind === "kyc-doc") {
            const r = await decideKycDocument(reject.id, "REJECTED", note);
            if (r.error) toast.error(r.error);
            else toast.success("Document rejected");
          } else if (reject.kind === "seeker") {
            const r = await decideJobSeekerIdentity(reject.id, false, note);
            if (r.error) toast.error(r.error);
            else toast.success("Seeker rejected");
          } else if (reject.kind === "employer") {
            const r = await decideEmployerVerification(reject.id, false, note);
            if (r.error) toast.error(r.error);
            else toast.success("Employer rejected");
          }
          refresh();
        }}
      />
      {pending && <p className="sr-only">Working…</p>}
    </div>
  );
}

function Queue({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: {
    id: string;
    title: string;
    meta: string;
    href?: string;
    status: string;
    extra?: React.ReactNode;
    onApprove?: () => void;
    onReject?: () => void;
  }[];
}) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        {items.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">{empty}</p>
        )}
        <ul className="divide-y divide-border/50">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div className="min-w-0">
                {item.href ? (
                  <Link href={item.href} className="text-sm font-medium hover:underline">
                    {item.title}
                  </Link>
                ) : (
                  <p className="text-sm font-medium">{item.title}</p>
                )}
                <p className="text-xs text-muted-foreground">{item.meta}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <AdminStatusBadge status={item.status} />
                  {item.extra}
                </div>
              </div>
              {(item.onApprove || item.onReject) && (
                <div className="flex gap-1.5">
                  {item.onApprove && (
                    <Button size="sm" className="h-8" onClick={item.onApprove}>
                      Approve
                    </Button>
                  )}
                  {item.onReject && (
                    <Button size="sm" variant="outline" className="h-8" onClick={item.onReject}>
                      Reject
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
