"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KycTier1Form } from "@/components/artisans/onboarding/kyc-tier1-form";
import { KycUpgradePanel } from "@/components/artisans/kyc-upgrade-panel";
import { NigeriaLocationFields, type LocationValues } from "@/components/artisans/onboarding/nigeria-location-fields";
import { saveKycLocation } from "@/lib/actions/kyc";
import { Button } from "@/components/ui/button";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { toast } from "sonner";

type Props = {
  user: {
    name: string | null;
    phone: string | null;
    nin: string | null;
    stateCode: string | null;
    lgaName: string | null;
    areaName: string | null;
    kycLevel: string;
    kycStatus: string;
    role: string;
  };
};

export function UserKycPanel({ user }: Props) {
  const router = useRouter();
  const [location, setLocation] = useState<LocationValues>({
    stateCode: user.stateCode ?? "",
    lgaName: user.lgaName ?? "",
    areaName: user.areaName ?? "",
    lat: null,
    lng: null,
  });
  const [savingLoc, setSavingLoc] = useState(false);

  const needsLocation = !user.stateCode || !user.lgaName || !user.areaName;
  const tier1Done = user.kycStatus === "VERIFIED" || user.kycStatus === "PENDING";

  async function saveLocation() {
    setSavingLoc(true);
    const result = await saveKycLocation({
      stateCode: location.stateCode,
      lgaName: location.lgaName,
      areaName: location.areaName,
      lat: location.lat,
      lng: location.lng,
    });
    setSavingLoc(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Location saved");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <AdminStatusBadge status={user.kycStatus} />
        <span className="text-sm text-muted-foreground">Level {user.kycLevel}</span>
        {(user.role === "AGENT" || user.role === "ARTISAN") && (
          <span className="text-xs text-amber-800">
            Tier 3 (Enhanced) required for listings / going available.
          </span>
        )}
      </div>

      {needsLocation && (
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
          <p className="text-sm font-semibold">1. Location</p>
          <NigeriaLocationFields value={location} onChange={setLocation} />
          <Button type="button" size="sm" disabled={savingLoc} onClick={saveLocation}>
            {savingLoc ? "Saving…" : "Save location"}
          </Button>
        </div>
      )}

      <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
        <p className="text-sm font-semibold">2. Tier 1 identity</p>
        <KycTier1Form
          defaults={{
            legalName: user.name ?? "",
            phone: user.phone ?? "",
            nin: user.nin ?? "",
            stateCode: user.stateCode ?? location.stateCode,
            lgaName: user.lgaName ?? location.lgaName,
            areaName: user.areaName ?? location.areaName,
          }}
          kycStatus={user.kycStatus}
          onDone={() => router.refresh()}
        />
      </div>

      {tier1Done && user.kycStatus === "VERIFIED" && (
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
          <p className="text-sm font-semibold">
            {user.role === "USER" ? "3. Optional Tier 2 / 3" : "3. Required Tier 2 / 3 for professionals"}
          </p>
          <KycUpgradePanel kycLevel={user.kycLevel} kycStatus={user.kycStatus} />
        </div>
      )}
    </div>
  );
}
