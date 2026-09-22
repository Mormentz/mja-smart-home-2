"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { signIn } from "next-auth/react";
import { registerUser } from "@/lib/actions/auth";
import { roleLabel } from "@/lib/auth/role-labels";
import { AuthDivider, AuthField, AuthPrimaryButton } from "@/components/auth/auth-field";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Checkbox } from "@/components/ui/checkbox";

const ROLES = ["USER", "AGENT", "ARTISAN"] as const;
type SignupRole = (typeof ROLES)[number];

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<SignupRole>("USER");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasGoogle, setHasGoogle] = useState(false);

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

    const result = await registerUser({ name, email, password, role });
    if (result.error) {
      setLoading(false);
      setError(result.error);
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (signInResult?.error) {
      setError("Account created but sign-in failed. Please log in.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
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

      <div className="pt-4 space-y-2">
        <label htmlFor="role" className="text-sm font-medium text-ink/80">
          I am a
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as SignupRole)}
          className="w-full h-12 rounded-full border border-border/80 bg-white px-4 text-sm outline-none focus:border-ink/30 focus:ring-2 focus:ring-ink/5"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          {role === "USER" && "Rent or buy homes, use escrow, and hire artisans."}
          {role === "AGENT" && "List properties for sale or rent (covers landlords)."}
          {role === "ARTISAN" && "Offer verified home services."}
        </p>
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
