"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminDecideUserKyc } from "@/lib/actions/admin-users";
import { decideKycDocument } from "@/lib/actions/kyc";
import { AdminDetailShell } from "@/components/admin/admin-detail-shell";
import { AdminRejectDialog } from "@/components/admin/admin-reject-dialog";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Workspace = NonNullable<
  Awaited<ReturnType<typeof import("@/lib/actions/admin-verifications").getAdminKycWorkspace>>
>;

export function AdminKycWorkspace({ data }: { data: Workspace }) {
  const { user, activity } = data;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [reject, setReject] = useState<null | { type: "user" | "doc"; id: string }>(null);
  const [reveal, setReveal] = useState(false);

  const tiers = [1, 2, 3] as const;

  function refresh() {
    router.refresh();
  }

  return (
    <AdminDetailShell
      backHref="/admin/verifications"
      backLabel="Verifications"
      title={`KYC · ${user.name ?? user.email}`}
      subtitle={`${user.role} · ${user.email}`}
      status={user.kycStatus}
      actions={
        <Button size="sm" variant="outline" asChild>
          <Link href={`/admin/users/${user.id}`}>User record</Link>
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <AdminStatusBadge status={user.kycStatus} />
              <span className="text-sm text-muted-foreground">Level {user.kycLevel}</span>
            </div>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Phone</dt>
                <dd>{user.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Location</dt>
                <dd>
                  {[user.areaName, user.lgaName, user.stateCode].filter(Boolean).join(", ") || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">NIN</dt>
                <dd className="font-mono">
                  <button type="button" className="underline" onClick={() => setReveal((v) => !v)}>
                    {reveal ? user.nin ?? "—" : user.nin ? `••••${user.nin.slice(-4)}` : "—"}
                  </button>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">BVN</dt>
                <dd className="font-mono">
                  {reveal ? user.bvn ?? "—" : user.bvn ? `••••${user.bvn.slice(-4)}` : "—"}
                </dd>
              </div>
            </dl>
            {user.kycNote && (
              <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs">Note: {user.kycNote}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const r = await adminDecideUserKyc(user.id, "VERIFIED");
                    if (r.error) toast.error(r.error);
                    else {
                      toast.success("Profile KYC approved");
                      refresh();
                    }
                  })
                }
              >
                Approve profile KYC
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setReject({ type: "user", id: user.id })}>
                Reject profile KYC
              </Button>
            </div>
          </div>

          {tiers.map((tier) => {
            const docs = user.kycDocuments.filter((d) => d.tier === tier);
            return (
              <div key={tier} className="rounded-xl border border-border/60 bg-card p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold">Tier {tier}</h2>
                  <span className="text-[11px] text-muted-foreground">
                    {tier === 1 ? "Identity + selfie" : tier === 2 ? "Government ID / BVN" : "Proof of address"}
                  </span>
                </div>
                {docs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No documents for this tier.</p>
                ) : (
                  <ul className="space-y-3">
                    {docs.map((d) => (
                      <li key={d.id} className="rounded-lg border border-border/50 p-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{d.type}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <AdminStatusBadge status={d.status} />
                              <a
                                href={d.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-primary underline"
                              >
                                Open / preview
                              </a>
                            </div>
                            {d.note && <p className="mt-1 text-xs text-muted-foreground">{d.note}</p>}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pending || d.status === "VERIFIED"}
                              onClick={() =>
                                start(async () => {
                                  const r = await decideKycDocument(d.id, "VERIFIED");
                                  if (r.error) toast.error(r.error);
                                  else {
                                    toast.success("Document approved");
                                    refresh();
                                  }
                                })
                              }
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={pending || d.status === "REJECTED"}
                              onClick={() => setReject({ type: "doc", id: d.id })}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                        {/\.(png|jpe?g|webp|gif)$/i.test(d.url) && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={d.url}
                            alt={d.type}
                            className="mt-3 max-h-64 w-full rounded-lg object-contain bg-muted"
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <aside className="space-y-3">
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <h3 className="text-sm font-semibold">Pipeline</h3>
            <ol className="mt-3 space-y-2 text-xs">
              {[1, 2, 3].map((tier) => {
                const docs = user.kycDocuments.filter((d) => d.tier === tier);
                const allVerified = docs.length > 0 && docs.every((d) => d.status === "VERIFIED");
                const anyPending = docs.some((d) => d.status === "PENDING");
                const label = allVerified ? "Done" : anyPending ? "In review" : docs.length ? "Action needed" : "Waiting";
                return (
                  <li key={tier} className="flex items-center justify-between gap-2">
                    <span>Tier {tier}</span>
                    <AdminStatusBadge status={allVerified ? "VERIFIED" : anyPending ? "PENDING" : "UNVERIFIED"} />
                    <span className="text-muted-foreground">{label}</span>
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <h3 className="text-sm font-semibold">Decision timeline</h3>
            <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto">
              {activity.length === 0 && (
                <li className="text-xs text-muted-foreground">No audit entries yet.</li>
              )}
              {activity.map((a) => (
                <li key={a.id} className="border-b border-border/40 pb-2 text-xs">
                  <p className="font-medium">{a.action}</p>
                  <p className="text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <AdminRejectDialog
        open={!!reject}
        onOpenChange={(o) => !o && setReject(null)}
        title={reject?.type === "doc" ? "Reject document" : "Reject KYC profile"}
        onConfirm={async (note) => {
          if (!reject) return;
          if (reject.type === "doc") {
            const r = await decideKycDocument(reject.id, "REJECTED", note);
            if (r.error) toast.error(r.error);
            else toast.success("Document rejected");
          } else {
            const r = await adminDecideUserKyc(reject.id, "REJECTED", note);
            if (r.error) toast.error(r.error);
            else toast.success("KYC rejected");
          }
          refresh();
        }}
      />
    </AdminDetailShell>
  );
}
