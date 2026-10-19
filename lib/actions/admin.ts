"use server";

import { revalidatePath } from "next/cache";
import {
  KycLevel,
  Role,
  SkillBadge,
  VerificationStatus,
} from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function getAdminStats() {
  const session = await requireAdmin();
  if (!session) return null;

  const [
    users,
    agents,
    artisans,
    properties,
    pendingKyc,
    pendingProps,
    pendingArtisans,
    escrowHeld,
    openJobs,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({ where: { role: "AGENT" } }),
    prisma.user.count({ where: { role: "ARTISAN" } }),
    prisma.property.count(),
    prisma.user.count({ where: { kycStatus: "PENDING" } }),
    prisma.property.count({ where: { verificationStatus: "PENDING" } }),
    prisma.serviceProfile.count({ where: { verificationStatus: "PENDING" } }),
    prisma.escrowPayment.aggregate({
      where: { status: "HELD" },
      _sum: { amount: true },
    }),
    prisma.serviceJob.count({
      where: { status: { in: ["REQUESTED", "QUOTED", "ACCEPTED", "IN_PROGRESS"] } },
    }),
  ]);

  return {
    users,
    agents,
    artisans,
    properties,
    pendingKyc,
    pendingProps,
    pendingArtisans,
    escrowHeld: escrowHeld._sum.amount ?? 0,
    openJobs,
  };
}

export async function listAdminUsers(opts?: { role?: Role; q?: string }) {
  const session = await requireAdmin();
  if (!session) return [];

  return prisma.user.findMany({
    where: {
      role: opts?.role
        ? opts.role
        : { in: ["USER", "AGENT"] },
      OR: opts?.q
        ? [
            { email: { contains: opts.q, mode: "insensitive" } },
            { name: { contains: opts.q, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      phone: true,
      kycLevel: true,
      kycStatus: true,
      createdAt: true,
    },
  });
}

export async function listAdminArtisans() {
  const session = await requireAdmin();
  if (!session) return [];

  return prisma.user.findMany({
    where: { role: "ARTISAN" },
    include: {
      serviceProfile: true,
      reviewsReceived: { select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listAdminProperties() {
  const session = await requireAdmin();
  if (!session) return [];

  return prisma.property.findMany({
    include: {
      owner: { select: { id: true, name: true, email: true } },
      neighborhood: true,
      _count: { select: { bookings: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function setUserActive(userId: string, active: boolean) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };
  if (userId === session.user.id) return { error: "Cannot deactivate yourself" };

  await prisma.user.update({ where: { id: userId }, data: { active } });
  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/admin/artisans");
  return { success: true };
}

export async function setUserRole(userId: string, role: Role) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };
  if (role === "ADMIN") return { error: "Cannot promote to admin here" };

  await prisma.user.update({
    where: { id: userId },
    data: {
      role,
      kycLevel:
        role === "ARTISAN"
          ? KycLevel.ENHANCED
          : role === "AGENT"
            ? KycLevel.STANDARD
            : KycLevel.BASIC,
    },
  });

  if (role === "ARTISAN") {
    await prisma.serviceProfile.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        trade: "General Services",
        bio: "Tell clients about your trade and experience.",
      },
    });
  }

  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/admin/artisans");
  return { success: true };
}

export async function decideKyc(userId: string, decision: "VERIFIED" | "REJECTED", note?: string) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };

  await prisma.user.update({
    where: { id: userId },
    data: {
      kycStatus: decision as VerificationStatus,
      kycNote: note ?? null,
      ...(decision === "VERIFIED" && user.role === "ARTISAN"
        ? { onboardingStep: Math.max(user.onboardingStep, 5) }
        : {}),
    },
  });

  if (user.role === "ARTISAN") {
    await prisma.serviceProfile.updateMany({
      where: { userId },
      data:
        decision === "VERIFIED"
          ? { verified: true, verificationStatus: VerificationStatus.VERIFIED }
          : {
              available: false,
              verified: false,
              verificationStatus: VerificationStatus.REJECTED,
            },
    });
  }

  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/admin/verifications");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function setPropertyFeatured(propertyId: string, featured: boolean) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };
  await prisma.property.update({ where: { id: propertyId }, data: { featured } });
  revalidatePath("/dashboard/admin/properties");
  revalidatePath("/properties");
  return { success: true };
}

export async function deletePropertyAsAdmin(propertyId: string) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };
  await prisma.property.delete({ where: { id: propertyId } });
  revalidatePath("/dashboard/admin/properties");
  revalidatePath("/properties");
  return { success: true };
}

export async function setArtisanBadge(userId: string, badge: SkillBadge) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };
  await prisma.serviceProfile.update({
    where: { userId },
    data: { skillBadge: badge },
  });
  revalidatePath("/dashboard/admin/artisans");
  return { success: true };
}

export async function getSiteContent(key: string) {
  return prisma.siteContent.findUnique({ where: { key } });
}

export async function upsertSiteContent(key: string, value: string) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };
  await prisma.siteContent.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  revalidatePath("/dashboard/admin/content");
  return { success: true };
}

export async function getPendingKycUsers() {
  const session = await requireAdmin();
  if (!session) return [];
  return prisma.user.findMany({
    where: { kycStatus: "PENDING", role: { in: ["USER", "AGENT", "ARTISAN"] } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      kycLevel: true,
      phone: true,
    },
  });
}
