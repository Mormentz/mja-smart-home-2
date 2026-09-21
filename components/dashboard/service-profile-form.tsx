"use client";

import { useState } from "react";
import { updateServiceProfile } from "@/lib/actions/messages";
import { requestArtisanVerification } from "@/lib/actions/verification";
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
};

export function ServiceProfileForm({ profile }: ServiceProfileFormProps) {
  const [trade, setTrade] = useState(profile?.trade ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [available, setAvailable] = useState(profile?.available ?? true);
  const [hourlyRate, setHourlyRate] = useState(profile?.hourlyRate ?? 50);
  const [serviceArea, setServiceArea] = useState(profile?.serviceArea ?? "");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await updateServiceProfile({
      trade,
      bio,
      available,
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
    <form onSubmit={onSubmit} className="rounded-3xl border border-border bg-card p-6 space-y-4 max-w-2xl">
      <div className="flex flex-wrap gap-2 text-sm">
        {profile?.verified && <span className="text-success font-medium">Verified artisan</span>}
        <span className="rounded-full bg-muted px-3 py-1 text-xs">{profile?.skillBadge ?? "NONE"} badge</span>
        <span className="rounded-full bg-muted px-3 py-1 text-xs">
          Verification: {profile?.verificationStatus ?? "UNVERIFIED"}
        </span>
      </div>
      {profile && profile.verificationStatus !== "VERIFIED" && profile.verificationStatus !== "PENDING" && (
        <Button type="button" variant="secondary" size="sm" onClick={requestVerify}>
          Request verification
        </Button>
      )}
      <div className="space-y-2">
        <Label htmlFor="trade">Trade / specialty</Label>
        <Input id="trade" value={trade} onChange={(e) => setTrade(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={5} required />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rate">Hourly rate ($)</Label>
          <Input
            id="rate"
            type="number"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="area">Service area</Label>
          <Input id="area" value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
        Available for new jobs
      </label>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
