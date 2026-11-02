"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { loginAdmin } from "@/lib/actions/admin-auth";
import { AuthField, AuthPrimaryButton } from "@/components/auth/auth-field";
import { HomeConnectLogo } from "@/components/brand/homeconnect-logo";
import { Button } from "@/components/ui/button";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error") ?? searchParams.get("code");

  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    if (errorCode === "NOT_ADMIN") return "This portal is for administrators only.";
    return null;
  });
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await loginAdmin(email, password);
      if (!res.ok) {
        if (res.code === "NOT_ADMIN") {
          setError("This portal is for administrators only. Use the consumer login.");
        } else {
          setError("Invalid admin credentials.");
        }
        return;
      }
      router.push("/admin");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
      <div className="mb-6 space-y-4">
        <HomeConnectLogo href="/" onDark height={32} priority />
        <div>
          <h1 className="font-display text-xl font-semibold text-white">Admin sign in</h1>
          <p className="text-sm text-white/60">Separate session from the consumer app</p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <AuthField
          id="admin-email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          required
          icon={Mail}
          onDark
        />
        <AuthField
          id="admin-password"
          label="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={setPassword}
          required
          icon={Lock}
          onDark
          trailing={
            <button
              type="button"
              className="text-muted-foreground hover:text-ink"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        {error && (
          <p className="rounded-lg bg-destructive/20 px-3 py-2 text-sm text-red-200" role="alert">
            {error}
          </p>
        )}

        <AuthPrimaryButton disabled={pending} loading={pending}>
          Sign in to admin
        </AuthPrimaryButton>
      </form>

      <p className="mt-6 text-center text-sm text-white/55">
        Not an admin?{" "}
        <Link href="/login" className="font-medium text-white underline-offset-2 hover:underline">
          Consumer login
        </Link>
      </p>
      <div className="mt-3 text-center">
        <Button variant="ghost" size="sm" asChild className="text-white/50 hover:text-white">
          <Link href="/">Back to site</Link>
        </Button>
      </div>
    </div>
  );
}
