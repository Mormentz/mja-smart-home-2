"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { KycDocType, KycLevel, VerificationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function tierToLevel(tier: number): KycLevel {
  if (tier >= 3) return KycLevel.ENHANCED;
  if (tier === 2) return KycLevel.STANDARD;
  return KycLevel.BASIC;
}

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session;
}

export async function uploadKycDocument(formData: FormData) {
  const session = await requireUser();
  if (!session) return { error: "Unauthorized" };

  const tier = Number(formData.get("tier") || 0);
  const typeRaw = String(formData.get("type") || "");
  const file = formData.get("file");

  if (![1, 2, 3].includes(tier)) return { error: "Invalid KYC tier" };
  if (!Object.values(KycDocType).includes(typeRaw as KycDocType)) {
    return { error: "Invalid document type" };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload" };
  }
  if (file.size > MAX_BYTES) return { error: "File must be under 5MB" };
  if (!ALLOWED.has(file.type)) {
    return { error: "Upload JPG, PNG, WebP, or PDF" };
  }

  const ext =
    file.type === "application/pdf"
      ? "pdf"
      : file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";

  const dir = path.join(process.cwd(), "public", "uploads", "kyc", session.user.id);
  await mkdir(dir, { recursive: true });
  const filename = `${typeRaw.toLowerCase()}-${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buf);
  const url = `/uploads/kyc/${session.user.id}/${filename}`;

  const doc = await prisma.kycDocument.create({
    data: {
      userId: session.user.id,
      tier,
      type: typeRaw as KycDocType,
      url,
      status: VerificationStatus.PENDING,
    },
  });

  revalidatePath("/dashboard/onboarding/artisan");
  revalidatePath("/dashboard/services");
  revalidatePath("/dashboard/admin/verifications");
  return { success: true, document: doc };
}

const tier1Schema = {
  nin: (v: string) => /^\d{11}$/.test(v),
  phone: (v: string) => /^(\+234|0)[789][01]\d{8}$/.test(v),
};

export async function submitTier1Kyc(data: {
  legalName: string;
  phone: string;
  nin: string;
  stateCode: string;
  lgaName: string;
  areaName: string;
}) {
  const session = await requireUser();
  if (!session) return { error: "Unauthorized" };

  const legalName = data.legalName.trim();
  const phone = data.phone.trim();
  const nin = data.nin.trim();

  if (legalName.length < 2) return { error: "Enter your legal name" };
  if (!tier1Schema.phone(phone)) return { error: "Use a valid Nigerian phone number" };
  if (!tier1Schema.nin(nin)) return { error: "NIN must be 11 digits" };
  if (!data.stateCode || !data.lgaName || !data.areaName) {
    return { error: "Complete State / LGA / Area first" };
  }

  const selfie = await prisma.kycDocument.findFirst({
    where: {
      userId: session.user.id,
      tier: 1,
      type: "SELFIE",
      status: { in: ["PENDING", "VERIFIED"] },
    },
  });
  if (!selfie) {
    return { error: "Upload a selfie or ID photo for Tier 1" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: legalName,
      phone,
      nin,
      stateCode: data.stateCode,
      lgaName: data.lgaName,
      areaName: data.areaName,
      kycLevel: KycLevel.BASIC,
      kycStatus: VerificationStatus.PENDING,
      kycNote: null,
      onboardingStep: 4,
    },
  });

  revalidatePath("/dashboard/onboarding/artisan");
  revalidatePath("/dashboard/services");
  revalidatePath("/dashboard/admin/verifications");
  return { success: true };
}

export async function submitTier2Kyc(data: { bvn?: string }) {
  const session = await requireUser();
  if (!session) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.kycStatus !== "VERIFIED") {
    return { error: "Complete Tier 1 verification first" };
  }

  const idDoc = await prisma.kycDocument.findFirst({
    where: {
      userId: session.user.id,
      tier: 2,
      type: "ID_FRONT",
      status: { in: ["PENDING", "VERIFIED"] },
    },
  });
  if (!idDoc) return { error: "Upload a government ID (NIN slip / voter / passport)" };

  const bvn = data.bvn?.trim();
  if (bvn && !/^\d{11}$/.test(bvn)) return { error: "BVN must be 11 digits" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      bvn: bvn || undefined,
      kycNote: null,
    },
  });

  revalidatePath("/dashboard/services");
  revalidatePath("/dashboard/admin/verifications");
  return { success: true };
}

export async function submitTier3Kyc() {
  const session = await requireUser();
  if (!session) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.kycStatus !== "VERIFIED") {
    return { error: "Complete Tier 1 verification first" };
  }

  const addressDoc = await prisma.kycDocument.findFirst({
    where: {
      userId: session.user.id,
      tier: 3,
      type: "PROOF_OF_ADDRESS",
      status: { in: ["PENDING", "VERIFIED"] },
    },
  });
  if (!addressDoc) return { error: "Upload proof of address" };

  // Tier 3 docs stay pending until admin approves; listing remains unlocked at Tier 1
  await prisma.user.update({
    where: { id: session.user.id },
    data: { kycNote: null },
  });

  revalidatePath("/dashboard/services");
  revalidatePath("/dashboard/admin/verifications");
  return { success: true };
}

export async function decideKycDocument(
  documentId: string,
  decision: "VERIFIED" | "REJECTED",
  note?: string,
) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };

  const doc = await prisma.kycDocument.findUnique({
    where: { id: documentId },
    include: { user: true },
  });
  if (!doc) return { error: "Document not found" };

  await prisma.kycDocument.update({
    where: { id: documentId },
    data: { status: decision, note: note ?? null },
  });

  if (decision === "VERIFIED") {
    const pendingSameTier = await prisma.kycDocument.count({
      where: {
        userId: doc.userId,
        tier: doc.tier,
        status: "PENDING",
      },
    });

    if (pendingSameTier === 0) {
      const nextLevel = tierToLevel(doc.tier);
      const levelRank = { BASIC: 1, STANDARD: 2, ENHANCED: 3 } as const;
      const currentRank = levelRank[doc.user.kycLevel] ?? 1;
      const nextRank = levelRank[nextLevel];

      await prisma.user.update({
        where: { id: doc.userId },
        data: {
          ...(doc.tier === 1 || doc.user.kycStatus === "PENDING"
            ? { kycStatus: VerificationStatus.VERIFIED }
            : {}),
          kycLevel: nextRank >= currentRank ? nextLevel : doc.user.kycLevel,
          kycNote: null,
          onboardingStep: Math.max(doc.user.onboardingStep, doc.tier === 1 ? 5 : doc.user.onboardingStep),
        },
      });

      if (doc.tier === 1) {
        await prisma.serviceProfile.updateMany({
          where: { userId: doc.userId },
          data: { verified: true, verificationStatus: VerificationStatus.VERIFIED },
        });
      }
    }
  } else if (doc.tier === 1) {
    await prisma.user.update({
      where: { id: doc.userId },
      data: {
        kycStatus: VerificationStatus.REJECTED,
        kycNote: note ?? "Document rejected",
      },
    });
    await prisma.serviceProfile.updateMany({
      where: { userId: doc.userId },
      data: {
        available: false,
        verified: false,
        verificationStatus: VerificationStatus.REJECTED,
      },
    });
  }

  revalidatePath("/dashboard/admin/verifications");
  revalidatePath("/dashboard/onboarding/artisan");
  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function getPendingKycDocuments() {
  const session = await requireAdmin();
  if (!session) return [];
  return prisma.kycDocument.findMany({
    where: { status: "PENDING" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          nin: true,
          bvn: true,
          kycLevel: true,
          stateCode: true,
          lgaName: true,
          areaName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Soft gate helper used by service listing. */
export async function artisanCanGoAvailable(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { serviceProfile: true },
  });
  if (!user || user.role !== "ARTISAN") return false;
  return (
    user.kycStatus === "VERIFIED" &&
    (user.kycLevel === "BASIC" ||
      user.kycLevel === "STANDARD" ||
      user.kycLevel === "ENHANCED") &&
    Boolean(user.serviceProfile?.verified)
  );
}
