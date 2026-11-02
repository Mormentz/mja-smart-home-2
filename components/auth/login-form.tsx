"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import {
  preflightCredentialsLogin,
  resendVerificationEmailByAddress,
} from "@/lib/actions/auth";
import { AuthDivider, AuthField, AuthPrimaryButton } from "@/components/auth/auth-field";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Button } from "@/components/ui/button";

const COOLDOWN_STORAGE_PREFIX = "hc-verify-resend:";

function storageKey(email: string) {
  return `${COOLDOWN_STORAGE_PREFIX}${email.trim().toLowerCase()}`;
}

function readStoredCooldown(email: string): number {
  if (typeof window === "undefined" || !email.includes("@")) return 0;
  try {
    const raw = localStorage.getItem(storageKey(email));
    if (!raw) return 0;
    const nextAllowedAt = Number(raw);
    if (!Number.isFinite(nextAllowedAt)) return 0;
    return Math.max(0, Math.ceil((nextAllowedAt - Date.now()) / 1000));
  } catch {
    return 0;
  }
}

function persistCooldown(email: string, retryAfterSeconds: number) {
  if (typeof window === "undefined" || !email.includes("@") || retryAfterSeconds <= 0) return;
  try {
    localStorage.setItem(storageKey(email), String(Date.now() + retryAfterSeconds * 1000));
  } catch {
    /* ignore quota */
  }
}

function formatCooldown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m <= 0) return `${s}s`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const needsVerify = searchParams.get("verify") === "1";
  const resetDone = searchParams.get("reset") === "1";
  const verifiedParam = searchParams.get("verified");
  const emailVerifiedOk = verifiedParam === "1";
  const verifiedInvalid = verifiedParam === "invalid" || verifiedParam === "missing";
  const errorCode = searchParams.get("error") ?? searchParams.get("code");

  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(
    needsVerify && !emailVerifiedOk
      ? "Check your inbox for a verification link before signing in."
      : null,
  );
  const showVerifyPanel = Boolean((needsVerify || info) && !emailVerifiedOk);
  const [loading, setLoading] = useState(false);
  const [hasGoogle, setHasGoogle] = useState(false);
  const [resending, startResend] = useTransition();
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((providers) => setHasGoogle(Boolean(providers?.google)))
      .catch(() => setHasGoogle(false));
  }, []);

  useEffect(() => {
    if (errorCode === "EMAIL_UNVERIFIED") {
      setInfo("Verify your email before accessing the dashboard.");
    }
    if (errorCode === "ADMIN_USE_ADMIN_LOGIN") {
      setError("Admin accounts must sign in at /admin/login.");
    }
  }, [errorCode]);

  useEffect(() => {
    setCooldown(readStoredCooldown(email));
  }, [email]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => {
      setCooldown((c) => {
        const next = Math.max(0, c - 1);
        if (next <= 0 && email.includes("@")) {
          try {
            localStorage.removeItem(storageKey(email));
          } catch {
            /* ignore */
          }
        }
        return next;
      });
    }, 1000);
    return () => window.clearTimeout(id);
  }, [cooldown, email]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const preflight = await preflightCredentialsLogin(email, password);
    if (!preflight.ok) {
      setLoading(false);
      if (preflight.code === "EMAIL_UNVERIFIED") {
        setInfo("Verify your email before accessing the dashboard.");
        setError(null);
        return;
      }
      if (preflight.code === "ADMIN_USE_ADMIN_LOGIN") {
        setError("Admin accounts must sign in at /admin/login.");
        return;
      }
      setError("Invalid email or password");
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push(callbackUrl.startsWith("/admin") ? "/dashboard" : callbackUrl);
    router.refresh();
  }

  function applyRetryAfter(seconds: number) {
    if (seconds <= 0) return;
    persistCooldown(email, seconds);
    setCooldown(seconds);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-1">
      {emailVerifiedOk && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <p className="font-medium">Email verified</p>
          <p className="mt-1 text-emerald-900/80">
            Your email is confirmed. Log in to continue to your dashboard.
          </p>
        </div>
      )}

      {verifiedInvalid && !emailVerifiedOk && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">Verification link invalid</p>
          <p className="mt-1 text-amber-900/80">
            That link is missing or expired. Log in and resend a new verification email if needed.
          </p>
        </div>
      )}

      {resetDone && !showVerifyPanel && !emailVerifiedOk && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <p className="font-medium">Password updated</p>
          <p className="mt-1 text-emerald-900/80">You can log in with your new password.</p>
        </div>
      )}

      {showVerifyPanel && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">Email verification required</p>
          <p className="mt-1 text-amber-900/80">
            {info ?? "Verify your email before signing in to the dashboard."}
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="mt-3"
            disabled={resending || !email || cooldown > 0}
            onClick={() =>
              startResend(async () => {
                const res = await resendVerificationEmailByAddress(email);
                if ("retryAfterSeconds" in res && typeof res.retryAfterSeconds === "number") {
                  applyRetryAfter(res.retryAfterSeconds);
                }
                if (res.error) {
                  setError(res.error);
                  return;
                }
                setError(null);
                setInfo("If an account exists for that email, a new link was sent.");
              })
            }
          >
            {resending
              ? "Sending…"
              : cooldown > 0
                ? `Resend in ${formatCooldown(cooldown)}`
                : "Resend verification email"}
          </Button>
          {cooldown > 0 && (
            <p className="mt-2 text-xs text-amber-900/70">
              Cooldown doubles after each resend to prevent abuse.
            </p>
          )}
        </div>
      )}

      {hasGoogle && (
        <>
          <GoogleAuthButton label="Login with Google" />
          <AuthDivider />
        </>
      )}

      <AuthField
        id="email"
        label="Email"
        type="email"
        icon={Mail}
        value={email}
        onChange={setEmail}
        placeholder="you@email.com"
        required
      />

      <div className="pt-4">
        <AuthField
          id="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          icon={Lock}
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          required
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-ink transition"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
        <div className="mt-2 flex justify-end">
          <Link href="/forgot-password" className="text-xs font-medium text-muted-foreground hover:text-ink hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>

      {error && <p className="pt-3 text-sm text-destructive">{error}</p>}

      <div className="pt-6">
        <AuthPrimaryButton loading={loading}>Log In</AuthPrimaryButton>
      </div>

      <p className="pt-5 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-ink hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
