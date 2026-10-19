import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Sign Up — HomeConnect",
};

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Let's get started with your HomeConnect journey."
    >
      <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-muted" />}>
        <SignupForm />
      </Suspense>
    </AuthLayout>
  );
}
