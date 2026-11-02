"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { registerUser } from "@/lib/actions/auth";
import { AuthField, AuthPrimaryButton } from "@/components/auth/auth-field";
import { Checkbox } from "@/components/ui/checkbox";

export function AgentSignupForm() {
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

    const result = await registerUser({ name, email, password, role: "AGENT" });
    if (result.error) {
      setLoading(false);
      setError(result.error);
      return;
    }

    window.location.assign(`/login?verify=1&email=${encodeURIComponent(email.toLowerCase())}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-1">
      <p className="mb-4 text-sm text-muted-foreground">
        Create an agent / landlord account to list properties for sale or rent. Verify your email
        before accessing the dashboard.
      </p>

      <AuthField
        id="name"
        label="Full name"
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

      <label className="flex items-start gap-3 pt-5 cursor-pointer">
        <Checkbox
          checked={acceptedTerms}
          onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
          className="mt-0.5 rounded border-border data-[state=checked]:bg-ink data-[state=checked]:border-ink"
        />
        <span className="text-xs leading-relaxed text-muted-foreground">
          I agree to HomeConnect listing terms, privacy policy, and verification requirements.
        </span>
      </label>

      {error && <p className="pt-3 text-sm text-destructive">{error}</p>}

      <div className="pt-5">
        <AuthPrimaryButton loading={loading} disabled={!acceptedTerms}>
          Create agent account
        </AuthPrimaryButton>
      </div>

      <p className="pt-5 text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-ink hover:underline">
          Log in
        </Link>
        {" · "}
        <Link href="/signup" className="font-semibold text-ink hover:underline">
          Customer signup
        </Link>
      </p>
    </form>
  );
}
