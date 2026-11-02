"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Mail } from "lucide-react";
import { requestPasswordReset } from "@/lib/actions/auth";
import { AuthField, AuthPrimaryButton } from "@/components/auth/auth-field";

function formatCooldown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m <= 0) return `${s}s`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await requestPasswordReset(email);
      if ("retryAfterSeconds" in res && typeof res.retryAfterSeconds === "number") {
        setCooldown(res.retryAfterSeconds);
      }
      if (res.error) {
        setError(res.error);
        return;
      }
      setSent(true);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-1">
      {sent && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <p className="font-medium">Check your inbox</p>
          <p className="mt-1 text-emerald-900/80">
            If an account exists for that email, we sent a password reset link. It expires in one hour.
          </p>
        </div>
      )}

      <AuthField
        id="reset-email"
        label="Email"
        type="email"
        icon={Mail}
        value={email}
        onChange={setEmail}
        placeholder="you@email.com"
        required
      />

      {error && <p className="pt-3 text-sm text-destructive">{error}</p>}

      <div className="pt-6">
        <AuthPrimaryButton loading={pending} disabled={cooldown > 0}>
          {cooldown > 0 ? `Try again in ${formatCooldown(cooldown)}` : sent ? "Send another link" : "Send reset link"}
        </AuthPrimaryButton>
      </div>

      <p className="pt-5 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-ink hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
