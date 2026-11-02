import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password — HomeConnect",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your email and we’ll send a link to choose a new password."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
