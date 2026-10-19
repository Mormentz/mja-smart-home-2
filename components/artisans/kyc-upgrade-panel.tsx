"use client";

import { useState } from "react";
import { uploadKycDocument, submitTier2Kyc, submitTier3Kyc } from "@/lib/actions/kyc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function KycUpgradePanel({
  kycLevel,
  kycStatus,
}: {
  kycLevel: string;
  kycStatus: string;
}) {
  const [bvn, setBvn] = useState("");
  const [loading, setLoading] = useState(false);

  if (kycStatus !== "VERIFIED") {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Complete Tier 1 KYC (and get admin approval) before Tier 2 / 3 upgrades.
      </div>
    );
  }

  async function upload(tier: number, type: string, file: File | null) {
    if (!file) return;
    const fd = new FormData();
    fd.set("tier", String(tier));
    fd.set("type", type);
    fd.set("file", file);
    const result = await uploadKycDocument(fd);
    if (result.error) toast.error(result.error);
    else toast.success("Document uploaded");
  }

  async function submitTier2() {
    setLoading(true);
    const result = await submitTier2Kyc({ bvn: bvn || undefined });
    setLoading(false);
    if (result.error) toast.error(result.error);
    else toast.success("Tier 2 submitted for review");
  }

  async function submitTier3() {
    setLoading(true);
    const result = await submitTier3Kyc();
    setLoading(false);
    if (result.error) toast.error(result.error);
    else toast.success("Tier 3 submitted for review");
  }

  return (
    <div className="space-y-6 rounded-xl border border-border/60 bg-card p-4">
      <div>
        <p className="text-sm font-semibold">KYC upgrades</p>
        <p className="text-xs text-muted-foreground">
          Current: {kycLevel} · {kycStatus}. Tier 2 adds trust badge priority; Tier 3 is fully
          verified.
        </p>
      </div>

      {kycLevel === "BASIC" && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Tier 2 — Government ID</p>
          <div className="space-y-2">
            <Label htmlFor="idfront">ID upload (NIN slip / voter / passport)</Label>
            <Input
              id="idfront"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => void upload(2, "ID_FRONT", e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bvn">BVN (optional)</Label>
            <Input
              id="bvn"
              value={bvn}
              onChange={(e) => setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="11 digits"
            />
          </div>
          <Button type="button" size="sm" disabled={loading} onClick={submitTier2}>
            Submit Tier 2
          </Button>
        </div>
      )}

      {(kycLevel === "STANDARD" || kycLevel === "ENHANCED") && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Tier 3 — Address / business</p>
          <div className="space-y-2">
            <Label htmlFor="poa">Proof of address</Label>
            <Input
              id="poa"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => void upload(3, "PROOF_OF_ADDRESS", e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cac">CAC (optional)</Label>
            <Input
              id="cac"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => void upload(3, "CAC", e.target.files?.[0] ?? null)}
            />
          </div>
          {kycLevel !== "ENHANCED" && (
            <Button type="button" size="sm" disabled={loading} onClick={submitTier3}>
              Submit Tier 3
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
