"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { signIn } from "next-auth/react";
import { registerUser } from "@/lib/actions/auth";
import { AuthField, AuthPrimaryButton } from "@/components/auth/auth-field";
import { Checkbox } from "@/components/ui/checkbox";

export function ArtisanSignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptedTerms) {
      setError("Please accept the terms to continue");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await registerUser({ name, email, password, role: "ARTISAN" });
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

    router.push("/dashboard/onboarding/artisan");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-1">
      <p className="mb-4 text-sm text-muted-foreground">
        Step 1 of 4 — Create your artisan account. We&apos;ll email a verification link
        before location and KYC.
      </p>

      <AuthField
        id="name"
        label="Full legal name"
        icon={User}
        value={name}
        onChange={setName}
        placeholder="As on your ID"
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

      <label className="flex items-start gap-3 pt-5 cursor-pointer">
        <Checkbox
          checked={acceptedTerms}
          onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
          className="mt-0.5 rounded border-border data-[state=checked]:bg-ink data-[state=checked]:border-ink"
        />
        <span className="text-xs leading-relaxed text-muted-foreground">
          I agree to HomeConnect artisan terms, privacy policy, and escrow payout rules.
        </span>
      </label>

      {error && <p className="pt-3 text-sm text-destructive">{error}</p>}

      <div className="pt-5">
        <AuthPrimaryButton loading={loading} disabled={!acceptedTerms}>
          Create artisan account
        </AuthPrimaryButton>
      </div>

      <p className="pt-5 text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-ink hover:underline">
          Log in
        </Link>
        {" · "}
        <Link href="/signup" className="font-semibold text-ink hover:underline">
          Customer / agent signup
        </Link>
      </p>
    </form>
  );
}
