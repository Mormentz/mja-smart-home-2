"use server";

import { revalidatePath } from "next/cache";
import { MoveInStatus } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const moveInSchema = z.object({
  propertyId: z.string().min(1),
  leaseId: z.string().optional(),
  moving: z.boolean().default(false),
  furnishing: z.boolean().default(false),
  utilities: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
});

export async function createOrUpdateMoveIn(data: z.infer<typeof moveInSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (session.user.role !== "RENTER") return { error: "Only renters can request move-in support" };

  const parsed = moveInSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid request" };

  const existing = await prisma.moveInRequest.findFirst({
    where: {
      userId: session.user.id,
      propertyId: parsed.data.propertyId,
      status: { in: [MoveInStatus.OPEN, MoveInStatus.IN_PROGRESS] },
    },
  });

  if (existing) {
    await prisma.moveInRequest.update({
      where: { id: existing.id },
      data: {
        moving: parsed.data.moving,
        furnishing: parsed.data.furnishing,
        utilities: parsed.data.utilities,
        notes: parsed.data.notes,
        leaseId: parsed.data.leaseId,
        status: MoveInStatus.IN_PROGRESS,
      },
    });
  } else {
    await prisma.moveInRequest.create({
      data: {
        userId: session.user.id,
        propertyId: parsed.data.propertyId,
        leaseId: parsed.data.leaseId,
        moving: parsed.data.moving,
        furnishing: parsed.data.furnishing,
        utilities: parsed.data.utilities,
        notes: parsed.data.notes,
        status: MoveInStatus.IN_PROGRESS,
      },
    });
  }

  revalidatePath("/dashboard/move-in");
  revalidatePath("/dashboard/leases");
  return { success: true };
}

export async function completeMoveIn(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const row = await prisma.moveInRequest.findUnique({ where: { id } });
  if (!row || row.userId !== session.user.id) return { error: "Not found" };

  await prisma.moveInRequest.update({
    where: { id },
    data: { status: MoveInStatus.DONE },
  });

  revalidatePath("/dashboard/move-in");
  return { success: true };
}

export async function getMoveInRequests() {
  const session = await auth();
  if (!session?.user?.id) return [];
  return prisma.moveInRequest.findMany({
    where: { userId: session.user.id },
    include: { property: true, lease: true },
    orderBy: { createdAt: "desc" },
  });
}
