import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ArtisanSignupForm } from "@/components/auth/artisan-signup-form";

export const metadata: Metadata = {
  title: "Join as Artisan — HomeConnect",
};

export default function ArtisanSignupPage() {
  return (
    <AuthLayout
      title="Join Artisans Hub"
      subtitle="Account first — then location, trades, and Tier 1 KYC."
    >
      <ArtisanSignupForm />
    </AuthLayout>
  );
}
