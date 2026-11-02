"use client";

import { useEffect, useState } from "react";
import { resendVerificationEmail } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function formatCooldown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m <= 0) return `${s}s`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function EmailVerifyBanner({ email }: { email: string }) {
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown > 0]);

  async function resend() {
    setLoading(true);
    const result = await resendVerificationEmail();
    setLoading(false);
    if ("retryAfterSeconds" in result && typeof result.retryAfterSeconds === "number") {
      setCooldown(result.retryAfterSeconds);
    }
    if (result.error) toast.error(result.error);
    else if (result.alreadyVerified) toast.success("Email already verified");
    else toast.success("Verification email sent");
  }

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p className="font-medium">Verify your email to continue</p>
      <p className="mt-1 text-amber-900/80">
        We sent a link to <span className="font-medium">{email}</span>. Check spam if you
        don&apos;t see it.
      </p>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="mt-3"
        disabled={loading || cooldown > 0}
        onClick={resend}
      >
        {loading
          ? "Sending…"
          : cooldown > 0
            ? `Resend in ${formatCooldown(cooldown)}`
            : "Resend verification"}
      </Button>
    </div>
  );
}
