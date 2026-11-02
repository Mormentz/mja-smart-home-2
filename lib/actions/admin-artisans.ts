"use server";

import { revalidatePath } from "next/cache";
import { VerificationStatus } from "@/generated/prisma/client";
import { z } from "zod";
import { getAdminSessionOrNull } from "@/lib/auth/admin";
import { writeAdminAudit } from "@/lib/admin/audit";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  return getAdminSessionOrNull();
}

const VERIFICATION_STATUSES = ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"] as const;

export async function listAdminArtisansFiltered(opts?: {
  q?: string;
  verificationStatus?: string;
}) {
  const session = await requireAdmin();
  if (!session) return [];

  const status = opts?.verificationStatus?.toUpperCase();
  const validStatus =
    status && (VERIFICATION_STATUSES as readonly string[]).includes(status)
      ? (status as VerificationStatus)
      : undefined;
  const q = opts?.q?.trim();

  return prisma.user.findMany({
    where: {
      role: "ARTISAN",
      ...(validStatus ? { serviceProfile: { is: { verificationStatus: validStatus } } } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" as const } },
              { name: { contains: q, mode: "insensitive" as const } },
              { phone: { contains: q, mode: "insensitive" as const } },
              { serviceProfile: { is: { trade: { contains: q, mode: "insensitive" as const } } } },
            ],
          }
        : {}),
    },
    include: {
      serviceProfile: true,
      reviewsReceived: { select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getAdminArtisanDetail(userId: string) {
  const session = await requireAdmin();
  if (!session) return null;

  return prisma.user.findFirst({
    where: { id: userId, OR: [{ role: "ARTISAN" }, { serviceProfile: { isNot: null } }] },
    include: {
      serviceProfile: true,
      artisanServices: {
        include: { subcategory: { include: { category: { select: { id: true, name: true } } } } },
        orderBy: { createdAt: "desc" },
      },
      jobsAsArtisan: {
        include: { customer: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      reviewsReceived: {
        include: { author: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });
}

const artisanProfileSchema = z.object({
  trade: z.string().trim().min(1, "Trade is required").max(120),
  bio: z.string().trim().min(1, "Bio is required").max(4000),
  hourlyRate: z.coerce.number().int().min(0, "Rate must be 0 or more").max(10_000_000),
  serviceArea: z.string().trim().max(200).optional().nullable(),
  available: z.boolean(),
});

export async function updateAdminArtisanProfile(
  userId: string,
  data: {
    trade: string;
    bio: string;
    hourlyRate: number;
    serviceArea?: string | null;
    available: boolean;
  },
) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };

  const parsed = artisanProfileSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };

  const existing = await prisma.serviceProfile.findUnique({ where: { userId } });
  if (!existing) return { error: "Service profile not found" };

  await prisma.serviceProfile.update({
    where: { userId },
    data: {
      trade: parsed.data.trade,
      bio: parsed.data.bio,
      hourlyRate: parsed.data.hourlyRate,
      serviceArea: parsed.data.serviceArea || null,
      available: parsed.data.available,
    },
  });

  await writeAdminAudit({
    actorId: session.user.id,
    action: "ARTISAN_PROFILE_UPDATE",
    entity: "ServiceProfile",
    entityId: userId,
    meta: parsed.data,
  });

  revalidatePath(`/admin/artisans/${userId}`);
  revalidatePath("/admin/artisans");
  revalidatePath("/artisans");
  return { success: true };
}
