import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password — HomeConnect",
};

function ResetPasswordInner({
  searchParams,
}: {
  searchParams: { token?: string | string[] };
}) {
  const raw = searchParams.token;
  const token = Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";
  return <ResetPasswordForm token={token} />;
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
}) {
  const sp = (await searchParams) ?? {};
  return (
    <AuthLayout title="Choose a new password" subtitle="Pick a strong password you haven’t used here before.">
      <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-muted/40" />}>
        <ResetPasswordInner searchParams={sp} />
      </Suspense>
    </AuthLayout>
  );
}
