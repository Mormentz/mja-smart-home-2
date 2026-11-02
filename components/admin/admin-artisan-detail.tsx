"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SkillBadge } from "@/generated/prisma/browser";
import { updateAdminArtisanProfile } from "@/lib/actions/admin-artisans";
import { setArtisanBadge } from "@/lib/actions/admin";
import { decideArtisanVerification } from "@/lib/actions/verification";
import { AdminDetailShell } from "@/components/admin/admin-detail-shell";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney, formatMoneyPerHour } from "@/lib/currency";
import { toast } from "sonner";

type Detail = NonNullable<
  Awaited<ReturnType<typeof import("@/lib/actions/admin-artisans").getAdminArtisanDetail>>
>;

const BADGES: SkillBadge[] = ["NONE", "BRONZE", "SILVER", "GOLD"];

export function AdminArtisanDetail({ artisan, tab }: { artisan: Detail; tab: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const sp = artisan.serviceProfile;

  const [profile, setProfile] = useState({
    trade: sp?.trade ?? "",
    bio: sp?.bio ?? "",
    hourlyRate: String(sp?.hourlyRate ?? 0),
    serviceArea: sp?.serviceArea ?? "",
    available: sp?.available ?? false,
  });

  const ratings = artisan.reviewsReceived.map((r) => r.rating);
  const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "—";

  function refresh() {
    router.refresh();
  }

  function decide(decision: "VERIFIED" | "REJECTED") {
    start(async () => {
      const r = await decideArtisanVerification(artisan.id, decision);
      if (r.error) toast.error(r.error);
      else {
        toast.success(decision === "VERIFIED" ? "Artisan verified" : "Artisan rejected");
        refresh();
      }
    });
  }

  function badge(value: SkillBadge) {
    start(async () => {
      const r = await setArtisanBadge(artisan.id, value);
      if (r.error) toast.error(r.error);
      else {
        toast.success(`Badge set to ${value}`);
        refresh();
      }
    });
  }

  return (
    <AdminDetailShell
      backHref="/admin/artisans"
      backLabel="All artisans"
      title={artisan.name ?? artisan.email}
      subtitle={`${artisan.email}${sp ? ` · ${sp.trade}` : ""}`}
      status={sp?.verificationStatus ?? "UNVERIFIED"}
      actions={
        <>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/users/${artisan.id}`}>User account</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/verifications/kyc/${artisan.id}`}>KYC workspace</Link>
          </Button>
        </>
      }
    >
      <AdminTabs
        defaultTab="profile"
        tabs={[
          { id: "profile", label: "Profile" },
          { id: "verification", label: "Verification" },
          { id: "skills", label: "Skills", count: artisan.artisanServices.length },
          { id: "jobs", label: "Jobs", count: artisan.jobsAsArtisan.length },
          { id: "reviews", label: "Reviews", count: artisan.reviewsReceived.length },
          { id: "badge", label: "Badge" },
        ]}
      />

      <div className="mt-4 rounded-xl border border-border/60 bg-card p-4">
        {!sp && tab !== "jobs" && tab !== "reviews" && (
          <p className="text-sm text-muted-foreground">This user has no service profile yet.</p>
        )}

        {sp && tab === "profile" && (
          <form
            className="grid max-w-xl gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                const r = await updateAdminArtisanProfile(artisan.id, {
                  trade: profile.trade,
                  bio: profile.bio,
                  hourlyRate: Number(profile.hourlyRate),
                  serviceArea: profile.serviceArea || null,
                  available: profile.available,
                });
                if (r.error) toast.error(r.error);
                else {
                  toast.success("Profile saved");
                  refresh();
                }
              });
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="trade">Trade</Label>
              <Input
                id="trade"
                value={profile.trade}
                onChange={(e) => setProfile((p) => ({ ...p, trade: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={5}
                value={profile.bio}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="rate">Hourly rate (₦)</Label>
                <Input
                  id="rate"
                  type="number"
                  min={0}
                  value={profile.hourlyRate}
                  onChange={(e) => setProfile((p) => ({ ...p, hourlyRate: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="area">Service area</Label>
                <Input
                  id="area"
                  value={profile.serviceArea}
                  onChange={(e) => setProfile((p) => ({ ...p, serviceArea: e.target.value }))}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={profile.available}
                onChange={(e) => setProfile((p) => ({ ...p, available: e.target.checked }))}
              />
              Available for new jobs
            </label>
            <Button type="submit" disabled={pending} className="w-fit">
              Save profile
            </Button>
          </form>
        )}

        {sp && tab === "verification" && (
          <div className="max-w-xl space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">Service verification</span>
              <AdminStatusBadge status={sp.verificationStatus} />
              {sp.verified && <span className="text-xs text-emerald-700">Public badge shown</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">KYC</span>
              <AdminStatusBadge status={artisan.kycStatus} />
              <span className="text-xs text-muted-foreground">Level {artisan.kycLevel}</span>
              {artisan.kycNote && (
                <span className="text-xs text-muted-foreground">Note: {artisan.kycNote}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={pending || sp.verificationStatus === "VERIFIED"}
                onClick={() => decide("VERIFIED")}
              >
                Approve verification
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={pending || sp.verificationStatus === "REJECTED"}
                onClick={() => decide("REJECTED")}
              >
                Reject verification
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Review identity documents in the{" "}
              <Link className="text-primary underline" href={`/admin/verifications/kyc/${artisan.id}`}>
                KYC workspace
              </Link>
              .
            </p>
          </div>
        )}

        {sp && tab === "skills" && (
          <div className="space-y-2">
            {artisan.artisanServices.length === 0 && (
              <p className="text-sm text-muted-foreground">No skills listed.</p>
            )}
            <ul className="divide-y divide-border/50">
              {artisan.artisanServices.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{s.subcategory.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.subcategory.category.name}
                      {s.note ? ` · ${s.note}` : ""}
                    </p>
                  </div>
                  <AdminStatusBadge status={s.proficiency} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "jobs" && (
          <div>
            {artisan.jobsAsArtisan.length === 0 && (
              <p className="text-sm text-muted-foreground">No service jobs.</p>
            )}
            <ul className="divide-y divide-border/50">
              {artisan.jobsAsArtisan.map((j) => (
                <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{j.description.slice(0, 90)}</p>
                    <p className="text-xs text-muted-foreground">
                      {j.customer.name ?? j.customer.email} · {j.urgency}
                      {j.priceEstimate != null ? ` · ${formatMoney(j.priceEstimate)}` : ""} ·{" "}
                      {new Date(j.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <AdminStatusBadge status={j.status} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "reviews" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Average rating <strong className="text-foreground">{avg}★</strong> from{" "}
              {artisan.reviewsReceived.length} review(s)
            </p>
            {artisan.reviewsReceived.length === 0 && (
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            )}
            <ul className="divide-y divide-border/50">
              {artisan.reviewsReceived.map((r) => (
                <li key={r.id} className="py-2.5 text-sm">
                  <p className="font-medium">
                    {"★".repeat(r.rating)}
                    <span className="text-muted-foreground">{"★".repeat(Math.max(0, 5 - r.rating))}</span>{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      {r.author.name ?? r.author.email} · {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </p>
                  <p className="text-muted-foreground">{r.comment}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {sp && tab === "badge" && (
          <div className="max-w-xl space-y-3 text-sm">
            <p>
              Current badge: <strong>{sp.skillBadge}</strong> · Rate {formatMoneyPerHour(sp.hourlyRate)}
            </p>
            <div className="flex flex-wrap gap-2">
              {BADGES.map((b) => (
                <Button
                  key={b}
                  size="sm"
                  variant={sp.skillBadge === b ? "default" : "outline"}
                  disabled={pending || sp.skillBadge === b}
                  onClick={() => badge(b)}
                >
                  {b === "NONE" ? "No badge" : b.charAt(0) + b.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminDetailShell>
  );
}
