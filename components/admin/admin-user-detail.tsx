"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Role } from "@/generated/prisma/browser";
import {
  adminDecideUserKyc,
  adminSendPasswordReset,
  updateAdminUserAccount,
  updateAdminUserProfile,
} from "@/lib/actions/admin-users";
import { decideKycDocument } from "@/lib/actions/kyc";
import { AdminDetailShell } from "@/components/admin/admin-detail-shell";
import { AdminRejectDialog } from "@/components/admin/admin-reject-dialog";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/currency";
import { toast } from "sonner";

type Detail = NonNullable<Awaited<ReturnType<typeof import("@/lib/actions/admin-users").getAdminUserDetail>>>;
type Activity = Awaited<ReturnType<typeof import("@/lib/actions/admin-users").getAdminUserActivity>>;

function mask(value: string | null | undefined) {
  if (!value) return "—";
  if (value.length <= 4) return "••••";
  return `${"•".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}

export function AdminUserDetail({
  user,
  activity,
  tab,
}: {
  user: Detail;
  activity: Activity;
  tab: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [revealSensitive, setRevealSensitive] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectDocId, setRejectDocId] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    name: user.name ?? "",
    phone: user.phone ?? "",
    stateCode: user.stateCode ?? "",
    lgaName: user.lgaName ?? "",
    areaName: user.areaName ?? "",
    image: user.image ?? "",
  });

  function refresh() {
    router.refresh();
  }

  return (
    <AdminDetailShell
      backHref="/admin/users"
      backLabel="All users"
      title={user.name ?? user.email}
      subtitle={user.email}
      status={user.active ? user.kycStatus : "INACTIVE"}
      actions={
        <>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/verifications/kyc/${user.id}`}>Open KYC workspace</Link>
          </Button>
        </>
      }
    >
      <AdminTabs
        defaultTab="profile"
        tabs={[
          { id: "profile", label: "Profile" },
          { id: "account", label: "Account" },
          { id: "kyc", label: "KYC" },
          { id: "properties", label: "Properties", count: user.properties.length },
          { id: "bookings", label: "Bookings", count: user.bookings.length },
          { id: "leases", label: "Leases", count: user.leasesAsRenter.length + user.leasesAsLandlord.length },
          { id: "escrow", label: "Escrow", count: user.escrowPayments.length },
          { id: "services", label: "Services" },
          { id: "jobs", label: "Jobs / Rentals" },
          { id: "activity", label: "Activity" },
          { id: "danger", label: "Danger" },
        ]}
      />

      <div className="mt-4 rounded-xl border border-border/60 bg-card p-4">
        {tab === "profile" && (
          <form
            className="grid max-w-xl gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                const r = await updateAdminUserProfile(user.id, profile);
                if (r.error) toast.error(r.error);
                else {
                  toast.success("Profile saved");
                  refresh();
                }
              });
            }}
          >
            {(["name", "phone", "stateCode", "lgaName", "areaName", "image"] as const).map((key) => (
              <div key={key} className="space-y-1">
                <Label className="capitalize">{key.replace(/([A-Z])/g, " $1")}</Label>
                <Input
                  value={profile[key]}
                  onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
            <Button type="submit" disabled={pending} className="w-fit">
              Save profile
            </Button>
          </form>
        )}

        {tab === "account" && (
          <div className="space-y-4 max-w-xl">
            <div className="space-y-1">
              <Label>Role</Label>
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                defaultValue={user.role}
                onChange={(e) => {
                  start(async () => {
                    const r = await updateAdminUserAccount(user.id, {
                      role: e.target.value as Role,
                    });
                    if (r.error) toast.error(r.error);
                    else {
                      toast.success("Role updated");
                      refresh();
                    }
                  });
                }}
              >
                {(["USER", "AGENT", "ARTISAN", "ADMIN"] as Role[]).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const r = await updateAdminUserAccount(user.id, {
                      emailVerified: !user.emailVerified,
                    });
                    if (r.error) toast.error(r.error);
                    else {
                      toast.success(user.emailVerified ? "Email marked unverified" : "Email force-verified");
                      refresh();
                    }
                  })
                }
              >
                {user.emailVerified ? "Clear email verified" : "Force verify email"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const r = await adminSendPasswordReset(user.id);
                    if (r.error) toast.error(r.error);
                    else toast.success("Password reset email sent");
                  })
                }
              >
                Send password reset
              </Button>
              <Button
                type="button"
                variant={user.active ? "destructive" : "default"}
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const r = await updateAdminUserAccount(user.id, { active: !user.active });
                    if (r.error) toast.error(r.error);
                    else {
                      toast.success(user.active ? "Deactivated" : "Activated");
                      refresh();
                    }
                  })
                }
              >
                {user.active ? "Deactivate account" : "Activate account"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Email verified: {user.emailVerified ? new Date(user.emailVerified).toLocaleString() : "No"} ·
              Created {new Date(user.createdAt).toLocaleString()}
            </p>
          </div>
        )}

        {tab === "kyc" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <AdminStatusBadge status={user.kycStatus} />
              <span className="text-sm text-muted-foreground">Level {user.kycLevel}</span>
              {user.kycNote && <span className="text-xs text-muted-foreground">Note: {user.kycNote}</span>}
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p>
                NIN:{" "}
                <button type="button" className="font-mono underline" onClick={() => setRevealSensitive((v) => !v)}>
                  {revealSensitive ? user.nin ?? "—" : mask(user.nin)}
                </button>
              </p>
              <p>
                BVN:{" "}
                <span className="font-mono">{revealSensitive ? user.bvn ?? "—" : mask(user.bvn)}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const r = await adminDecideUserKyc(user.id, "VERIFIED");
                    if (r.error) toast.error(r.error);
                    else {
                      toast.success("KYC approved");
                      refresh();
                    }
                  })
                }
              >
                Approve KYC
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setRejectOpen(true)}>
                Reject KYC
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Documents</p>
              {user.kycDocuments.length === 0 && (
                <p className="text-xs text-muted-foreground">No documents uploaded.</p>
              )}
              {user.kycDocuments.map((d) => (
                <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 p-3">
                  <div>
                    <p className="text-sm font-medium">
                      Tier {d.tier} · {d.type}
                    </p>
                    <AdminStatusBadge status={d.status} />
                    <a href={d.url} target="_blank" rel="noreferrer" className="ml-2 text-xs text-primary underline">
                      Open file
                    </a>
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
                      onClick={() => {
                        setRejectDocId(d.id);
                        setRejectOpen(true);
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "properties" && (
          <RelTable
            empty="No properties."
            rows={user.properties.map((p) => ({
              id: p.id,
              title: p.title,
              meta: `${p.type} · ${formatMoney(p.price)} · ${p.location}`,
              status: p.verificationStatus,
              href: `/admin/properties/${p.id}`,
            }))}
          />
        )}

        {tab === "bookings" && (
          <RelTable
            empty="No bookings."
            rows={user.bookings.map((b) => ({
              id: b.id,
              title: b.property.title,
              meta: `${b.kind} · ${new Date(b.preferredDate).toLocaleDateString()}`,
              status: b.status,
              href: `/admin/bookings`,
            }))}
          />
        )}

        {tab === "leases" && (
          <RelTable
            empty="No leases."
            rows={[
              ...user.leasesAsRenter.map((l) => ({
                id: l.id,
                title: l.property.title,
                meta: `Renter · ${formatMoney(l.monthlyRent)}/mo`,
                status: l.status,
                href: `/admin/leases`,
              })),
              ...user.leasesAsLandlord.map((l) => ({
                id: l.id,
                title: l.property.title,
                meta: `Landlord · ${l.renter.name ?? l.renter.email}`,
                status: l.status,
                href: `/admin/leases`,
              })),
            ]}
          />
        )}

        {tab === "escrow" && (
          <RelTable
            empty="No escrow payments."
            rows={user.escrowPayments.map((e) => ({
              id: e.id,
              title: formatMoney(e.amount),
              meta: e.purpose,
              status: e.status,
              href: `/admin/escrow`,
            }))}
          />
        )}

        {tab === "services" && (
          <div className="space-y-3 text-sm">
            {user.serviceProfile ? (
              <>
                <p>
                  Trade: <strong>{user.serviceProfile.trade}</strong>
                </p>
                <p className="text-muted-foreground">{user.serviceProfile.bio}</p>
                <AdminStatusBadge status={user.serviceProfile.verificationStatus} />
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/admin/artisans/${user.id}`}>Open artisan admin</Link>
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">No service profile.</p>
            )}
            <div className="pt-2">
              <p className="font-medium">Service jobs as customer</p>
              <RelTable
                empty="None"
                rows={user.jobsAsCustomer.map((j) => ({
                  id: j.id,
                  title: j.description.slice(0, 60),
                  meta: j.artisan.name ?? j.artisan.email,
                  status: j.status,
                }))}
              />
            </div>
            <div>
              <p className="font-medium">Service jobs as artisan</p>
              <RelTable
                empty="None"
                rows={user.jobsAsArtisan.map((j) => ({
                  id: j.id,
                  title: j.description.slice(0, 60),
                  meta: j.customer.name ?? j.customer.email,
                  status: j.status,
                }))}
              />
            </div>
          </div>
        )}

        {tab === "jobs" && (
          <div className="space-y-3 text-sm">
            {user.jobSeekerProfile ? (
              <p>
                Job seeker profile{" "}
                <Link className="text-primary underline" href={`/admin/jobs/seekers/${user.jobSeekerProfile.id}`}>
                  {user.jobSeekerProfile.hcId}
                </Link>{" "}
                · <AdminStatusBadge status={user.jobSeekerProfile.identityStatus} />
              </p>
            ) : (
              <p className="text-muted-foreground">No job seeker profile.</p>
            )}
            {user.employerProfile ? (
              <p>
                Employer profile{" "}
                <Link className="text-primary underline" href={`/admin/jobs/employers/${user.employerProfile.id}`}>
                  open
                </Link>{" "}
                · <AdminStatusBadge status={user.employerProfile.verificationStatus} />
              </p>
            ) : (
              <p className="text-muted-foreground">No employer profile.</p>
            )}
            {user.equipmentOwnerProfile ? (
              <p>
                Equipment owner {user.equipmentOwnerProfile.hcId} ·{" "}
                <AdminStatusBadge status={user.equipmentOwnerProfile.identityStatus} />
              </p>
            ) : (
              <p className="text-muted-foreground">No equipment owner profile.</p>
            )}
            {user.rentalCustomerProfile ? (
              <p>
                Rental customer · <AdminStatusBadge status={user.rentalCustomerProfile.identityStatus} />
              </p>
            ) : (
              <p className="text-muted-foreground">No rental customer profile.</p>
            )}
          </div>
        )}

        {tab === "activity" && (
          <div className="space-y-3">
            <div>
              <p className="mb-2 text-sm font-medium">Flags</p>
              {user.flaggedAccounts.length === 0 && (
                <p className="text-xs text-muted-foreground">No flags.</p>
              )}
              {user.flaggedAccounts.map((f) => (
                <div key={f.id} className="rounded-lg border border-border/60 p-2 text-sm">
                  {f.reason} · {f.resolved ? "resolved" : "open"} · {new Date(f.createdAt).toLocaleString()}
                </div>
              ))}
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Audit log</p>
              {activity.length === 0 && <p className="text-xs text-muted-foreground">No audit entries.</p>}
              {activity.map((a) => (
                <div key={a.id} className="border-b border-border/40 py-2 text-xs">
                  <span className="font-medium">{a.action}</span> · {a.entity ?? "—"} ·{" "}
                  {new Date(a.createdAt).toLocaleString()}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "danger" && (
          <div className="max-w-lg space-y-3">
            <p className="text-sm text-muted-foreground">
              Deactivating blocks sign-in. Prefer deactivation over hard delete to preserve audit trails.
            </p>
            <Label>Internal note (KYC note field)</Label>
            <Textarea
              defaultValue={user.kycNote ?? ""}
              id="danger-note"
              rows={3}
            />
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                const el = document.getElementById("danger-note") as HTMLTextAreaElement | null;
                start(async () => {
                  const r = await updateAdminUserAccount(user.id, { kycNote: el?.value || null });
                  if (r.error) toast.error(r.error);
                  else {
                    toast.success("Note saved");
                    refresh();
                  }
                });
              }}
            >
              Save note
            </Button>
          </div>
        )}
      </div>

      <AdminRejectDialog
        open={rejectOpen}
        onOpenChange={(o) => {
          setRejectOpen(o);
          if (!o) setRejectDocId(null);
        }}
        title={rejectDocId ? "Reject document" : "Reject KYC"}
        onConfirm={async (note) => {
          if (rejectDocId) {
            const r = await decideKycDocument(rejectDocId, "REJECTED", note);
            if (r.error) toast.error(r.error);
            else toast.success("Document rejected");
          } else {
            const r = await adminDecideUserKyc(user.id, "REJECTED", note);
            if (r.error) toast.error(r.error);
            else toast.success("KYC rejected");
          }
          refresh();
        }}
      />
    </AdminDetailShell>
  );
}

function RelTable({
  rows,
  empty,
}: {
  empty: string;
  rows: { id: string; title: string; meta: string; status: string; href?: string }[];
}) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="divide-y divide-border/50">
      {rows.map((r) => (
        <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
          <div>
            {r.href ? (
              <Link href={r.href} className="text-sm font-medium hover:underline">
                {r.title}
              </Link>
            ) : (
              <p className="text-sm font-medium">{r.title}</p>
            )}
            <p className="text-xs text-muted-foreground">{r.meta}</p>
          </div>
          <AdminStatusBadge status={r.status} />
        </li>
      ))}
    </ul>
  );
}
