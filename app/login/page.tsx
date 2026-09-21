import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Log In — HomeConnect",
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to manage your bookings, listings, and messages."
    >
      <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-muted/40" />}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
