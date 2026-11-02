import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { UserKycPanel } from "@/components/auth/user-kyc-panel";
import { KycRequiredBanner } from "@/components/auth/kyc-required-banner";

export default async function DashboardKycPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard/kyc");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      phone: true,
      nin: true,
      stateCode: true,
      lgaName: true,
      areaName: true,
      kycLevel: true,
      kycStatus: true,
      role: true,
    },
  });
  if (!user) redirect("/login");

  const needsTier1 = user.kycStatus !== "VERIFIED";
  const needsTier3 =
    (user.role === "AGENT" || user.role === "ARTISAN") &&
    !(user.kycStatus === "VERIFIED" && user.kycLevel === "ENHANCED");

  return (
    <DashboardSection
      title="Identity verification (KYC)"
      description={
        user.role === "USER"
          ? "Tier 1 is required before booking, messaging, escrow, jobs, and rentals. Tier 2/3 are optional."
          : "Complete Tier 3 (Enhanced) KYC to list properties or go available as a professional."
      }
    >
      {needsTier1 && <KycRequiredBanner href="/dashboard/kyc" requiredTier={1} />}
      {!needsTier1 && needsTier3 && <KycRequiredBanner href="/dashboard/kyc" requiredTier={3} />}
      <UserKycPanel user={user} />
    </DashboardSection>
  );
}
