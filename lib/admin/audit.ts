import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function writeAdminAudit(input: {
  actorId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entity: input.entity ?? null,
      entityId: input.entityId ?? null,
      meta: (input.meta as Prisma.InputJsonObject | undefined) ?? undefined,
    },
  });
}
