"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { resetPassword } from "@/lib/actions/auth";
import { AuthField, AuthPrimaryButton } from "@/components/auth/auth-field";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!token) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">This reset link is missing or invalid.</p>
        <Link href="/forgot-password" className="text-sm font-semibold text-ink hover:underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    start(async () => {
      const res = await resetPassword({ token, password });
      if (res.error) {
        setError(res.error);
        return;
      }
      const loginPath = res.role === "ADMIN" ? "/admin/login" : "/login";
      router.push(`${loginPath}?reset=1`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-1">
      <AuthField
        id="new-password"
        label="New password"
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

      <div className="pt-4">
        <AuthField
          id="confirm-password"
          label="Confirm password"
          type={showPassword ? "text" : "password"}
          icon={Lock}
          value={confirm}
          onChange={setConfirm}
          placeholder="Repeat password"
          minLength={8}
          required
        />
      </div>

      {error && <p className="pt-3 text-sm text-destructive">{error}</p>}

      <div className="pt-6">
        <AuthPrimaryButton loading={pending}>Update password</AuthPrimaryButton>
      </div>

      <p className="pt-5 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-semibold text-ink hover:underline">
          Back to log in
        </Link>
      </p>
    </form>
  );
}
