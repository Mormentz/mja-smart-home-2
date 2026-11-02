"use server";

import { revalidatePath } from "next/cache";
import { getAdminSessionOrNull } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma";

export type AdminNotificationInput = {
  type: string;
  title: string;
  body?: string;
  href?: string;
  entityType?: string;
  entityId?: string;
  severity?: "INFO" | "ACTION" | "URGENT";
};

/** Fire-and-forget style helper — safe to call from other server actions. */
export async function emitAdminNotification(input: AdminNotificationInput) {
  try {
    // Dedupe recent identical unread notifications for same entity
    if (input.entityType && input.entityId) {
      const existing = await prisma.adminNotification.findFirst({
        where: {
          type: input.type,
          entityType: input.entityType,
          entityId: input.entityId,
          readAt: null,
        },
      });
      if (existing) return existing;
    }

    return await prisma.adminNotification.create({
      data: {
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        href: input.href ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        severity: input.severity ?? "ACTION",
      },
    });
  } catch (err) {
    console.error("[admin-notification]", err);
    return null;
  }
}

export async function listAdminNotifications(opts?: { unreadOnly?: boolean; take?: number }) {
  const session = await getAdminSessionOrNull();
  if (!session) return [];

  return prisma.adminNotification.findMany({
    where: opts?.unreadOnly ? { readAt: null } : undefined,
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? 50,
  });
}

export async function getAdminUnreadNotificationCount() {
  const session = await getAdminSessionOrNull();
  if (!session) return 0;
  return prisma.adminNotification.count({ where: { readAt: null } });
}

export async function markAdminNotificationRead(id: string) {
  const session = await getAdminSessionOrNull();
  if (!session) return { error: "Unauthorized" };
  await prisma.adminNotification.update({
    where: { id },
    data: { readAt: new Date() },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/notifications");
  return { success: true };
}

export async function markAllAdminNotificationsRead() {
  const session = await getAdminSessionOrNull();
  if (!session) return { error: "Unauthorized" };
  await prisma.adminNotification.updateMany({
    where: { readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/notifications");
  return { success: true };
}

export async function resolveAdminNotificationsForEntity(entityType: string, entityId: string) {
  await prisma.adminNotification.updateMany({
    where: { entityType, entityId, readAt: null },
    data: { readAt: new Date() },
  });
}
