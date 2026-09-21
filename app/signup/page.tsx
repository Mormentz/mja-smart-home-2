import type { Metadata } from "next";
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
      <SignupForm />
    </AuthLayout>
  );
}
