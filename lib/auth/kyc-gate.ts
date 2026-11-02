import { KycLevel, Role, VerificationStatus, type User } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const KYC_REQUIRED = "KYC_REQUIRED" as const;

const LEVEL_RANK: Record<KycLevel, number> = {
  BASIC: 1,
  STANDARD: 2,
  ENHANCED: 3,
};

export type KycGateOk = { ok: true; user: Pick<User, "id" | "role" | "kycLevel" | "kycStatus"> };
export type KycGateFail = {
  ok: false;
  error: string;
  code: typeof KYC_REQUIRED;
  upgradeHref: string;
  requiredTier: number;
};

export type KycGateResult = KycGateOk | KycGateFail;

export function kycLevelRank(level: KycLevel | string) {
  return LEVEL_RANK[level as KycLevel] ?? 0;
}

export function hasVerifiedAtLeast(user: { kycLevel: KycLevel; kycStatus: VerificationStatus }, minTier: 1 | 2 | 3) {
  if (user.kycStatus !== VerificationStatus.VERIFIED) return false;
  return kycLevelRank(user.kycLevel) >= minTier;
}

function upgradeHrefFor(role: Role) {
  if (role === "ARTISAN") return "/dashboard/onboarding/artisan";
  if (role === "AGENT") return "/dashboard/kyc";
  return "/dashboard/kyc";
}

async function loadUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, kycLevel: true, kycStatus: true },
  });
}

/** USER (and any consumer action): Tier 1 verified required. */
export async function requireUserTier1(userId: string | undefined | null): Promise<KycGateResult> {
  if (!userId) {
    return {
      ok: false,
      error: "Unauthorized",
      code: KYC_REQUIRED,
      upgradeHref: "/login",
      requiredTier: 1,
    };
  }
  const user = await loadUser(userId);
  if (!user) {
    return {
      ok: false,
      error: "Unauthorized",
      code: KYC_REQUIRED,
      upgradeHref: "/login",
      requiredTier: 1,
    };
  }
  if (!hasVerifiedAtLeast(user, 1)) {
    return {
      ok: false,
      error: "Complete Tier 1 KYC verification before continuing.",
      code: KYC_REQUIRED,
      upgradeHref: upgradeHrefFor(user.role),
      requiredTier: 1,
    };
  }
  return { ok: true, user };
}

/** AGENT / ARTISAN privileged features: Tier 3 (ENHANCED) verified. */
export async function requireProTier3(userId: string | undefined | null): Promise<KycGateResult> {
  if (!userId) {
    return {
      ok: false,
      error: "Unauthorized",
      code: KYC_REQUIRED,
      upgradeHref: "/login",
      requiredTier: 3,
    };
  }
  const user = await loadUser(userId);
  if (!user) {
    return {
      ok: false,
      error: "Unauthorized",
      code: KYC_REQUIRED,
      upgradeHref: "/login",
      requiredTier: 3,
    };
  }
  if (user.role !== "AGENT" && user.role !== "ARTISAN" && user.role !== "ADMIN") {
    return {
      ok: false,
      error: "This action requires an agent or artisan account.",
      code: KYC_REQUIRED,
      upgradeHref: upgradeHrefFor(user.role),
      requiredTier: 3,
    };
  }
  if (user.role === "ADMIN") return { ok: true, user };
  if (!hasVerifiedAtLeast(user, 3)) {
    return {
      ok: false,
      error: "Complete Tier 3 (Enhanced) KYC before using this feature.",
      code: KYC_REQUIRED,
      upgradeHref: user.role === "ARTISAN" ? "/dashboard/onboarding/artisan" : "/dashboard/kyc",
      requiredTier: 3,
    };
  }
  return { ok: true, user };
}

export function kycGateError(result: KycGateFail) {
  return {
    error: result.error,
    code: result.code,
    upgradeHref: result.upgradeHref,
    requiredTier: result.requiredTier,
  };
}
