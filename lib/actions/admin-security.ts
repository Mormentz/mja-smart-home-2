"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { getAdminSessionOrNull } from "@/lib/auth/admin";
import { writeAdminAudit } from "@/lib/admin/audit";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  return getAdminSessionOrNull();
}

export async function getAdminSecurityData(opts?: { flagStatus?: string; privacyStatus?: string }) {
  const session = await requireAdmin();
  if (!session) return null;

  const flagWhere: Prisma.FlaggedAccountWhereInput =
    opts?.flagStatus === "resolved" ? { resolved: true } : opts?.flagStatus === "all" ? {} : { resolved: false };
  const privacyWhere: Prisma.PrivacyRequestWhereInput =
    opts?.privacyStatus === "closed"
      ? { status: "CLOSED" }
      : opts?.privacyStatus === "all"
        ? {}
        : { status: "OPEN" };

  const [flags, privacy, openFlags, openPrivacy] = await Promise.all([
    prisma.flaggedAccount.findMany({
      where: flagWhere,
      include: { user: { select: { id: true, name: true, email: true, role: true, active: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.privacyRequest.findMany({
      where: privacyWhere,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.flaggedAccount.count({ where: { resolved: false } }),
    prisma.privacyRequest.count({ where: { status: "OPEN" } }),
  ]);

  return { flags, privacy, counts: { openFlags, openPrivacy } };
}

export async function listAdminAuditLog(opts?: {
  q?: string;
  entity?: string;
  action?: string;
  actorId?: string;
  take?: number;
}) {
  const session = await requireAdmin();
  if (!session) return { entries: [], entities: [] as string[] };

  const q = opts?.q?.trim();
  const where: Prisma.AuditLogWhereInput = {
    ...(opts?.entity ? { entity: opts.entity } : {}),
    ...(opts?.action ? { action: { startsWith: opts.action.toUpperCase() } } : {}),
    ...(opts?.actorId ? { actorId: opts.actorId } : {}),
    ...(q
      ? {
          OR: [
            { action: { contains: q, mode: "insensitive" } },
            { entity: { contains: q, mode: "insensitive" } },
            { entityId: { contains: q, mode: "insensitive" } },
            { actorId: { contains: q, mode: "insensitive" } },
            { actor: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [entries, entityRows] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { actor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: Math.min(opts?.take ?? 100, 300),
    }),
    prisma.auditLog.findMany({
      where: { entity: { not: null } },
      distinct: ["entity"],
      select: { entity: true },
      take: 40,
    }),
  ]);

  return {
    entries,
    entities: entityRows.map((r) => r.entity).filter((e): e is string => Boolean(e)).sort(),
  };
}

export async function resolveFlaggedAccount(id: string, note?: string) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };

  const flag = await prisma.flaggedAccount.findUnique({ where: { id } });
  if (!flag) return { error: "Flag not found" };
  if (flag.resolved) return { success: true as const };

  const prevMeta =
    flag.meta && typeof flag.meta === "object" && !Array.isArray(flag.meta)
      ? (flag.meta as Record<string, unknown>)
      : {};
  await prisma.flaggedAccount.update({
    where: { id },
    data: {
      resolved: true,
      meta: {
        ...prevMeta,
        resolvedBy: session.user.id,
        resolvedAt: new Date().toISOString(),
        resolutionNote: note ?? null,
      } as Prisma.InputJsonObject,
    },
  });

  await writeAdminAudit({
    actorId: session.user.id,
    action: "FLAG_RESOLVED",
    entity: "FlaggedAccount",
    entityId: id,
    meta: { userId: flag.userId, note: note ?? null },
  });
  revalidatePath("/admin/security");
  revalidatePath("/admin");
  return { success: true as const };
}

/** Close CORRECTION / EXPORT requests (DELETION is handled by processPrivacyDeletion). */
export async function closePrivacyRequest(id: string, note?: string) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };

  const request = await prisma.privacyRequest.findUnique({ where: { id } });
  if (!request) return { error: "Request not found" };
  if (request.status !== "OPEN") return { success: true as const };
  if (request.kind === "DELETION") {
    return { error: "Use “Process deletion” for deletion requests" };
  }

  await prisma.privacyRequest.update({
    where: { id },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
      note: note ? `${request.note ? `${request.note}\n\n` : ""}Admin: ${note}` : request.note,
    },
  });

  await writeAdminAudit({
    actorId: session.user.id,
    action: `PRIVACY_${request.kind}_CLOSED`,
    entity: "PrivacyRequest",
    entityId: id,
    meta: { userId: request.userId, note: note ?? null },
  });
  revalidatePath("/admin/security");
  revalidatePath("/admin");
  return { success: true as const };
}
