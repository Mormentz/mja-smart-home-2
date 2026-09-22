"use client";

import { useState } from "react";
import { submitKyc, updateProfile } from "@/lib/actions/auth";
import { roleLabel } from "@/lib/auth/role-labels";
import type { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function SettingsForm({
  name,
  email,
  role,
  phone,
  kycLevel,
  kycStatus,
  kycNote,
}: {
  name: string | null | undefined;
  email: string | null | undefined;
  role: Role;
  phone?: string | null;
  kycLevel?: string;
  kycStatus?: string;
  kycNote?: string | null;
}) {
  const [displayName, setDisplayName] = useState(name ?? "");
  const [phoneValue, setPhoneValue] = useState(phone ?? "");
  const [loading, setLoading] = useState(false);
  const [kycLoading, setKycLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await updateProfile({ name: displayName, phone: phoneValue });
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Profile updated");
  }

  async function onSubmitKyc() {
    setKycLoading(true);
    const result = await submitKyc({ phone: phoneValue });
    setKycLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(
      role === "USER" ? "Basic KYC completed" : "KYC submitted for review",
    );
  }

  return (
    <div className="grid max-w-4xl gap-3 lg:grid-cols-2">
      <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Profile</h3>
        <div className="space-y-1.5">
          <Label htmlFor="name">Display name</Label>
          <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email ?? ""} disabled />
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Input value={roleLabel(role)} disabled />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={phoneValue}
            onChange={(e) => setPhoneValue(e.target.value)}
            placeholder="+234…"
          />
        </div>
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Saving..." : "Save changes"}
        </Button>
      </form>

      <div className="h-max space-y-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">KYC</h3>
        <p className="text-sm text-muted-foreground">
          Level: <span className="font-medium text-foreground">{kycLevel ?? "BASIC"}</span>
          <br />
          Status: <span className="font-medium text-foreground">{kycStatus ?? "UNVERIFIED"}</span>
        </p>
        {kycStatus === "REJECTED" && kycNote && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Rejection note: {kycNote}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {role === "USER" && "Basic KYC: confirm your phone to unlock smoother escrow."}
          {role === "AGENT" && "Standard KYC required before publishing listings. Submit your phone for admin review."}
          {role === "ARTISAN" && "Enhanced KYC required before appearing as available publicly. Submit your phone for admin review."}
          {role === "ADMIN" && "Admin accounts are fully verified."}
        </p>
        {role !== "ADMIN" && kycStatus !== "VERIFIED" && (
          <Button
            type="button"
            size="sm"
            onClick={onSubmitKyc}
            disabled={kycLoading || phoneValue.trim().length < 7}
          >
            {kycLoading
              ? "Submitting…"
              : role === "USER"
                ? "Complete basic KYC"
                : kycStatus === "REJECTED"
                  ? "Resubmit KYC for review"
                  : "Submit KYC for review"}
          </Button>
        )}
      </div>
    </div>
  );
}
