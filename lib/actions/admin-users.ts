"use server";

import { revalidatePath } from "next/cache";
import { KycLevel, Role, VerificationStatus } from "@prisma/client";
import { z } from "zod";
import { randomBytes } from "crypto";
import { getAdminSessionOrNull } from "@/lib/auth/admin";
import { writeAdminAudit } from "@/lib/admin/audit";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email/smtp";
import { resolveAdminNotificationsForEntity } from "@/lib/actions/admin-notifications";

async function requireAdmin() {
  return getAdminSessionOrNull();
}

export async function listAdminUsersFiltered(opts?: {
  role?: string;
  q?: string;
}) {
  const session = await requireAdmin();
  if (!session) return [];

  const role = opts?.role?.toUpperCase();
  const validRole =
    role && ["USER", "AGENT", "ARTISAN", "ADMIN"].includes(role)
      ? (role as Role)
      : undefined;

  return prisma.user.findMany({
    where: {
      ...(validRole ? { role: validRole } : {}),
      ...(opts?.q
        ? {
            OR: [
              { email: { contains: opts.q, mode: "insensitive" as const } },
              { name: { contains: opts.q, mode: "insensitive" as const } },
              { phone: { contains: opts.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
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
      emailVerified: true,
      createdAt: true,
    },
  });
}

export async function getAdminUserDetail(userId: string) {
  const session = await requireAdmin();
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      kycDocuments: { orderBy: { createdAt: "desc" } },
      serviceProfile: true,
      properties: {
        select: {
          id: true,
          title: true,
          location: true,
          type: true,
          price: true,
          verificationStatus: true,
          featured: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      },
      bookings: {
        include: {
          property: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      leasesAsRenter: {
        include: {
          property: { select: { id: true, title: true } },
          escrowPayments: { orderBy: { createdAt: "desc" }, take: 5 },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      leasesAsLandlord: {
        include: {
          property: { select: { id: true, title: true } },
          renter: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      escrowPayments: { orderBy: { createdAt: "desc" }, take: 30 },
      jobSeekerProfile: true,
      employerProfile: true,
      equipmentOwnerProfile: true,
      rentalCustomerProfile: true,
      flaggedAccounts: { orderBy: { createdAt: "desc" }, take: 20 },
      jobsAsCustomer: {
        include: { artisan: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      jobsAsArtisan: {
        include: { customer: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
}

export async function getAdminUserActivity(userId: string) {
  const session = await requireAdmin();
  if (!session) return [];
  return prisma.auditLog.findMany({
    where: {
      OR: [{ actorId: userId }, { entityId: userId }],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

const profileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().max(30).optional().nullable(),
  stateCode: z.string().max(10).optional().nullable(),
  lgaName: z.string().max(80).optional().nullable(),
  areaName: z.string().max(80).optional().nullable(),
  image: z.string().url().optional().nullable().or(z.literal("")),
});

export async function updateAdminUserProfile(
  userId: string,
  data: z.infer<typeof profileSchema>,
) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };
  const parsed = profileSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      stateCode: parsed.data.stateCode || null,
      lgaName: parsed.data.lgaName || null,
      areaName: parsed.data.areaName || null,
      image: parsed.data.image || null,
    },
  });

  await writeAdminAudit({
    actorId: session.user.id,
    action: "USER_PROFILE_UPDATE",
    entity: "User",
    entityId: userId,
    meta: parsed.data,
  });

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateAdminUserAccount(
  userId: string,
  data: {
    role?: Role;
    active?: boolean;
    emailVerified?: boolean;
    kycNote?: string | null;
  },
) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };
  if (userId === session.user.id && data.active === false) {
    return { error: "Cannot deactivate yourself" };
  }
  if (userId === session.user.id && data.role && data.role !== "ADMIN") {
    return { error: "Cannot demote yourself" };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.role
        ? {
            role: data.role,
            kycLevel:
              data.role === "ARTISAN"
                ? KycLevel.ENHANCED
                : data.role === "AGENT"
                  ? KycLevel.STANDARD
                  : data.role === "ADMIN"
                    ? KycLevel.ENHANCED
                    : KycLevel.BASIC,
          }
        : {}),
      ...(typeof data.active === "boolean" ? { active: data.active } : {}),
      ...(typeof data.emailVerified === "boolean"
        ? { emailVerified: data.emailVerified ? new Date() : null }
        : {}),
      ...(data.kycNote !== undefined ? { kycNote: data.kycNote } : {}),
    },
  });

  if (data.role === "ARTISAN") {
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

  await writeAdminAudit({
    actorId: session.user.id,
    action: "USER_ACCOUNT_UPDATE",
    entity: "User",
    entityId: userId,
    meta: data,
  });

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
  revalidatePath("/admin/artisans");
  return { success: true };
}

export async function adminSendPasswordReset(userId: string) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordResetToken: token, passwordResetExpires: expires },
  });
  await sendPasswordResetEmail(user.email, token);
  await writeAdminAudit({
    actorId: session.user.id,
    action: "USER_PASSWORD_RESET_SENT",
    entity: "User",
    entityId: userId,
  });
  return { success: true };
}

export async function adminDecideUserKyc(
  userId: string,
  decision: "VERIFIED" | "REJECTED",
  note?: string,
) {
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

  await writeAdminAudit({
    actorId: session.user.id,
    action: `KYC_${decision}`,
    entity: "User",
    entityId: userId,
    meta: { note },
  });
  await resolveAdminNotificationsForEntity("user", userId);

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath(`/admin/verifications/kyc/${userId}`);
  revalidatePath("/admin/verifications");
  revalidatePath("/admin/users");
  return { success: true };
}
