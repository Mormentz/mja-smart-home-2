"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Home, Lock, Mail, User, Wrench } from "lucide-react";
import { registerUser } from "@/lib/actions/auth";
import { AuthDivider, AuthField, AuthPrimaryButton } from "@/components/auth/auth-field";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasGoogle, setHasGoogle] = useState(false);

  useEffect(() => {
    const role = searchParams.get("role");
    if (role === "ARTISAN") {
      router.replace("/signup/artisan");
      return;
    }
    if (role === "AGENT") {
      router.replace("/signup/agent");
    }
  }, [searchParams, router]);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((providers) => setHasGoogle(Boolean(providers?.google)))
      .catch(() => setHasGoogle(false));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptedTerms) {
      setError("Please accept the terms to continue");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await registerUser({ name, email, password, role: "USER" });
    if (result.error) {
      setLoading(false);
      setError(result.error);
      return;
    }

    // Hard navigate so we don't stall on soft-nav after the server action
    window.location.assign(`/login?verify=1&email=${encodeURIComponent(email.toLowerCase())}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-1">
      {hasGoogle && (
        <>
          <GoogleAuthButton label="Login with Google" />
          <AuthDivider />
        </>
      )}

      <AuthField
        id="name"
        label="Name"
        icon={User}
        value={name}
        onChange={setName}
        placeholder="Your full name"
        required
      />

      <div className="pt-4">
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
      </div>

      <div className="pt-4">
        <AuthField
          id="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          icon={Lock}
          value={password}
          onChange={setPassword}
          placeholder="At least 8 characters"
          minLength={8}
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
      </div>

      <div className="pt-5">
        <p className="mb-2.5 text-center text-[11px] uppercase tracking-wide text-muted-foreground">
          Or join as
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/signup/agent"
            className={cn(
              "group flex flex-col items-center gap-2 rounded-2xl border border-border/70 bg-muted/30 px-3 py-3.5 text-center transition",
              "hover:border-ink/25 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/15",
            )}
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-ink-foreground transition group-hover:scale-[1.03]">
              <Home size={18} strokeWidth={1.75} />
            </span>
            <span className="text-sm font-semibold text-ink">Agent</span>
            <span className="text-[11px] leading-snug text-muted-foreground">List & manage homes</span>
          </Link>
          <Link
            href="/signup/artisan"
            className={cn(
              "group flex flex-col items-center gap-2 rounded-2xl border border-border/70 bg-muted/30 px-3 py-3.5 text-center transition",
              "hover:border-ink/25 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/15",
            )}
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-ink-foreground transition group-hover:scale-[1.03]">
              <Wrench size={18} strokeWidth={1.75} />
            </span>
            <span className="text-sm font-semibold text-ink">Services</span>
            <span className="text-[11px] leading-snug text-muted-foreground">Join as a pro</span>
          </Link>
        </div>
      </div>

      <label className="flex items-start gap-3 pt-5 cursor-pointer">
        <Checkbox
          checked={acceptedTerms}
          onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
          className="mt-0.5 rounded border-border data-[state=checked]:bg-ink data-[state=checked]:border-ink"
        />
        <span className="text-xs leading-relaxed text-muted-foreground">
          I agree to all{" "}
          <Link href="/contact" className="text-ink underline-offset-2 hover:underline">
            Terms
          </Link>
          ,{" "}
          <Link href="/contact" className="text-ink underline-offset-2 hover:underline">
            Privacy Policy
          </Link>{" "}
          and Fees
        </span>
      </label>

      {error && <p className="pt-3 text-sm text-destructive">{error}</p>}

      <div className="pt-5">
        <AuthPrimaryButton loading={loading} disabled={!acceptedTerms}>
          Sign Up
        </AuthPrimaryButton>
      </div>

      <p className="pt-5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-ink hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
