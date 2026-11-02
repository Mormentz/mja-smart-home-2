import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AgentSignupForm } from "@/components/auth/agent-signup-form";

export const metadata: Metadata = {
  title: "Agent signup — HomeConnect",
};

export default function AgentSignupPage() {
  return (
    <AuthLayout
      title="List with HomeConnect"
      subtitle="Agents and landlords create an account here — separate from customer signup."
    >
      <AgentSignupForm />
    </AuthLayout>
  );
}
