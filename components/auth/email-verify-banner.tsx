"use client";

import { useState } from "react";
import { resendVerificationEmail } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function EmailVerifyBanner({ email }: { email: string }) {
  const [loading, setLoading] = useState(false);

  async function resend() {
    setLoading(true);
    const result = await resendVerificationEmail();
    setLoading(false);
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
        disabled={loading}
        onClick={resend}
      >
        {loading ? "Sending…" : "Resend verification"}
      </Button>
    </div>
  );
}
