"use client";

import { useState } from "react";
import { uploadKycDocument, submitTier1Kyc } from "@/lib/actions/kyc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Props = {
  defaults: {
    legalName: string;
    phone: string;
    nin: string;
    stateCode: string;
    lgaName: string;
    areaName: string;
  };
  kycStatus?: string;
  onDone: () => void;
};

export function KycTier1Form({ defaults, kycStatus, onDone }: Props) {
  const pending = kycStatus === "PENDING";
  const verified = kycStatus === "VERIFIED";
  const [legalName, setLegalName] = useState(defaults.legalName);
  const [phone, setPhone] = useState(defaults.phone);
  const [nin, setNin] = useState(defaults.nin);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (pending || verified) {
    return (
      <div className="space-y-3 text-sm">
        <p className="rounded-xl bg-muted px-3 py-2">
          {pending && (
            <>
              Tier 1 KYC is <strong>pending admin review</strong>. You can&apos;t resubmit until
              it&apos;s approved or rejected. Optional Tier 2 / 3 upgrades are available after
              verification from your Services page.
            </>
          )}
          {verified && (
            <>
              Tier 1 KYC is <strong>verified</strong>. You can list services and go available.
              Submit Tier 2 / 3 upgrades from your Services page if you want a higher trust badge.
            </>
          )}
        </p>
      </div>
    );
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    const fd = new FormData();
    fd.set("tier", "1");
    fd.set("type", "SELFIE");
    fd.set("file", file);
    const result = await uploadKycDocument(fd);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setFileName(file.name);
    toast.success("Selfie / ID photo uploaded");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await submitTier1Kyc({
      legalName,
      phone,
      nin,
      stateCode: defaults.stateCode,
      lgaName: defaults.lgaName,
      areaName: defaults.areaName,
    });
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Tier 1 KYC submitted for review");
    onDone();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Tier 1 is required before you can list services or go available. Admin reviews your
        documents (no live NIN API in this pass).
      </p>

      <div className="space-y-2">
        <Label htmlFor="legalName">Legal name</Label>
        <Input
          id="legalName"
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone (NG)</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0803xxxxxxx"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nin">NIN (11 digits)</Label>
        <Input
          id="nin"
          value={nin}
          onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
          inputMode="numeric"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="selfie">Selfie or ID photo</Label>
        <Input
          id="selfie"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
        />
        {fileName && <p className="text-xs text-muted-foreground">Uploaded: {fileName}</p>}
      </div>

      <p className="text-xs text-muted-foreground">
        Location on file: {defaults.areaName}, {defaults.lgaName} ({defaults.stateCode})
      </p>

      <Button type="submit" disabled={loading}>
        {loading ? "Submitting…" : "Submit Tier 1 KYC"}
      </Button>
    </form>
  );
}
