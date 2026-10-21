"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EmailVerifyBanner } from "@/components/auth/email-verify-banner";
import {
  NigeriaLocationFields,
  type LocationValues,
} from "@/components/artisans/onboarding/nigeria-location-fields";
import {
  TradePicker,
  type TaxonomyOption,
  type TradeSelection,
} from "@/components/artisans/onboarding/trade-picker";
import { KycTier1Form } from "@/components/artisans/onboarding/kyc-tier1-form";
import { saveArtisanLocation, saveArtisanTrades } from "@/lib/actions/artisan-onboarding";
import type { SkillProficiencyLevel } from "@/lib/services/skill-proficiency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type UserState = {
  email: string;
  emailVerified: Date | string | null;
  name: string | null;
  phone: string | null;
  nin: string | null;
  stateCode: string | null;
  lgaName: string | null;
  areaName: string | null;
  lat: number | null;
  lng: number | null;
  onboardingStep: number;
  kycStatus: string;
  artisanServices: { subcategoryId: string; proficiency: string }[];
};

const STEPS = [
  { id: 2, label: "Profile & location" },
  { id: 3, label: "Trades" },
  { id: 4, label: "Tier 1 KYC" },
] as const;

export function ArtisanOnboardingWizard({
  user,
  categories,
}: {
  user: UserState;
  categories: TaxonomyOption[];
}) {
  const router = useRouter();
  const emailVerified = Boolean(user.emailVerified);
  const initialStep = useMemo(() => {
    if (!emailVerified) return 2;
    if (user.onboardingStep >= 4 || user.kycStatus === "PENDING" || user.kycStatus === "VERIFIED")
      return 4;
    if (user.onboardingStep >= 3) return 3;
    return 2;
  }, [emailVerified, user.onboardingStep, user.kycStatus]);

  const [step, setStep] = useState<number>(initialStep);
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [location, setLocation] = useState<LocationValues>({
    stateCode: user.stateCode ?? "FC",
    lgaName: user.lgaName ?? "",
    areaName: user.areaName ?? "",
    lat: user.lat,
    lng: user.lng,
  });
  const [selected, setSelected] = useState<TradeSelection[]>(
    user.artisanServices.map((s) => ({
      subcategoryId: s.subcategoryId,
      proficiency: (s.proficiency as SkillProficiencyLevel) || "INTERMEDIATE",
    })),
  );
  const [saving, setSaving] = useState(false);

  async function saveLocation() {
    if (!emailVerified) {
      toast.error("Verify your email first");
      return;
    }
    setSaving(true);
    const result = await saveArtisanLocation({
      name,
      phone,
      ...location,
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Location saved");
    setStep(3);
  }

  async function saveTrades() {
    setSaving(true);
    const result = await saveArtisanTrades(selected);
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Trades saved");
    setStep(4);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {!emailVerified && <EmailVerifyBanner email={user.email} />}

      <div className="flex flex-wrap gap-2">
        {STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            disabled={!emailVerified && s.id > 2}
            onClick={() => emailVerified && setStep(s.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              step === s.id ? "bg-ink text-ink-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {step === 2 && (
        <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-5">
          <div className="space-y-2">
            <Label htmlFor="name">Display / legal name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0803xxxxxxx or +234…"
              required
            />
          </div>
          <NigeriaLocationFields value={location} onChange={setLocation} />
          <Button type="button" disabled={saving || !emailVerified} onClick={saveLocation}>
            {saving ? "Saving…" : "Continue to trades"}
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-5">
          <TradePicker categories={categories} selected={selected} onChange={setSelected} />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button type="button" disabled={saving} onClick={saveTrades}>
              {saving ? "Saving…" : "Continue to KYC"}
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-5">
          <KycTier1Form
            kycStatus={user.kycStatus}
            defaults={{
              legalName: name || user.name || "",
              phone: phone || user.phone || "",
              nin: user.nin || "",
              stateCode: location.stateCode || user.stateCode || "",
              lgaName: location.lgaName || user.lgaName || "",
              areaName: location.areaName || user.areaName || "",
            }}
            onDone={() => {
              router.push("/dashboard/services");
              router.refresh();
            }}
          />
          {user.kycStatus !== "PENDING" && user.kycStatus !== "VERIFIED" && (
            <Button type="button" variant="secondary" onClick={() => setStep(3)}>
              Back
            </Button>
          )}
          {(user.kycStatus === "PENDING" || user.kycStatus === "VERIFIED") && (
            <Button
              type="button"
              onClick={() => {
                router.push("/dashboard/services");
                router.refresh();
              }}
            >
              Go to services
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
