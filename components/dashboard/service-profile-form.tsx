"use client";

import { useState } from "react";
import Link from "next/link";
import { updateServiceProfile } from "@/lib/actions/messages";
import { saveArtisanTrades } from "@/lib/actions/artisan-onboarding";
import { requestArtisanVerification } from "@/lib/actions/verification";
import {
  TradePicker,
  type TaxonomyOption,
  type TradeSelection,
} from "@/components/artisans/onboarding/trade-picker";
import { KycUpgradePanel } from "@/components/artisans/kyc-upgrade-panel";
import {
  skillProficiencyLabel,
  type SkillProficiencyLevel,
} from "@/lib/services/skill-proficiency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ServiceProfileFormProps = {
  profile: {
    trade: string;
    bio: string;
    verified: boolean;
    verificationStatus: string;
    skillBadge: string;
    available: boolean;
    hourlyRate: number;
    serviceArea: string | null;
  } | null;
  categories: TaxonomyOption[];
  selectedTrades: TradeSelection[];
  skillSummary: { name: string; proficiency: string }[];
  kycLevel: string;
  kycStatus: string;
  onboardingComplete: boolean;
};

export function ServiceProfileForm({
  profile,
  categories,
  selectedTrades,
  skillSummary,
  kycLevel,
  kycStatus,
  onboardingComplete,
}: ServiceProfileFormProps) {
  const [trade, setTrade] = useState(profile?.trade ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [available, setAvailable] = useState(profile?.available ?? false);
  const [hourlyRate, setHourlyRate] = useState(profile?.hourlyRate ?? 5000);
  const [serviceArea, setServiceArea] = useState(profile?.serviceArea ?? "");
  const [selected, setSelected] = useState<TradeSelection[]>(selectedTrades);
  const [loading, setLoading] = useState(false);
  const tier1Ok = kycStatus === "VERIFIED";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const trades = await saveArtisanTrades(selected);
    if (trades.error) {
      setLoading(false);
      toast.error(trades.error);
      return;
    }
    const result = await updateServiceProfile({
      trade,
      bio,
      available: tier1Ok ? available : false,
      hourlyRate,
      serviceArea,
    });
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Profile updated");
  }

  async function requestVerify() {
    const result = await requestArtisanVerification();
    if (result.error) toast.error(result.error);
    else toast.success("Verification requested");
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {!onboardingComplete && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          Finish onboarding (location, trades, Tier 1 KYC) before listing.
          <Link href="/dashboard/onboarding/artisan" className="ml-2 font-semibold underline">
            Continue wizard
          </Link>
        </div>
      )}

      {!tier1Ok && (
        <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          Tier 1 KYC must be verified before you can go available in the hub. Status:{" "}
          <strong>{kycStatus}</strong>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-border/60 bg-card p-4 space-y-3 shadow-sm"
      >
        <div className="flex flex-wrap gap-2 text-sm">
          {profile?.verified && <span className="text-success font-medium">Verified artisan</span>}
          <span className="rounded-full bg-muted px-3 py-1 text-xs">
            {profile?.skillBadge ?? "NONE"} badge
          </span>
          <span className="rounded-full bg-muted px-3 py-1 text-xs">
            KYC: {kycLevel} / {kycStatus}
          </span>
        </div>
        {profile &&
          profile.verificationStatus !== "VERIFIED" &&
          profile.verificationStatus !== "PENDING" && (
            <Button type="button" variant="secondary" size="sm" onClick={requestVerify}>
              Request profile verification
            </Button>
          )}

        {skillSummary.length > 0 && (
          <div className="rounded-xl bg-muted/50 px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground">Your skills</p>
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {skillSummary.map((s) => (
                <li
                  key={`${s.name}-${s.proficiency}`}
                  className="rounded-full bg-background px-2.5 py-1 text-xs"
                >
                  {s.name} · {skillProficiencyLabel(s.proficiency)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <Label>Services & proficiency</Label>
          <TradePicker categories={categories} selected={selected} onChange={setSelected} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="trade">Primary trade label</Label>
          <Input id="trade" value={trade} onChange={(e) => setTrade(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={5} required />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rate">Hourly rate (₦)</Label>
            <Input
              id="rate"
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="area">Service area</Label>
            <Input
              id="area"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={available && tier1Ok}
            disabled={!tier1Ok}
            onChange={(e) => setAvailable(e.target.checked)}
          />
          Available for new jobs {!tier1Ok && "(locked until Tier 1 verified)"}
        </label>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save profile"}
        </Button>
      </form>

      <KycUpgradePanel kycLevel={kycLevel} kycStatus={kycStatus} />
    </div>
  );
}
