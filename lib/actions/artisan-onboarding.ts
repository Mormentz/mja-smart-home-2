"use server";

import { revalidatePath } from "next/cache";
import { SkillProficiency } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getState } from "@/lib/geo/nigeria-states";
import { isSkillProficiency } from "@/lib/services/skill-proficiency";

async function requireArtisan() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ARTISAN") {
    return null;
  }
  return session;
}

const locationSchema = z.object({
  name: z.string().min(2),
  phone: z
    .string()
    .regex(/^(\+234|0)[789][01]\d{8}$/, "Use a valid Nigerian phone (e.g. 0803… or +234…)"),
  stateCode: z.string().min(2),
  lgaName: z.string().min(2),
  areaName: z.string().min(1),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
});

export async function saveArtisanLocation(data: z.infer<typeof locationSchema>) {
  const session = await requireArtisan();
  if (!session) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.emailVerified) {
    return { error: "Verify your email before continuing onboarding" };
  }

  const parsed = locationSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid location" };
  }

  const state = getState(parsed.data.stateCode);
  if (!state) return { error: "Select a valid state" };

  const serviceArea = [parsed.data.areaName, parsed.data.lgaName, state.name]
    .filter(Boolean)
    .join(", ");

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name.trim(),
      phone: parsed.data.phone.trim(),
      stateCode: parsed.data.stateCode,
      lgaName: parsed.data.lgaName,
      areaName: parsed.data.areaName,
      lat: parsed.data.lat ?? null,
      lng: parsed.data.lng ?? null,
      onboardingStep: Math.max(user.onboardingStep, 2),
    },
  });

  await prisma.serviceProfile.upsert({
    where: { userId: session.user.id },
    update: { serviceArea },
    create: {
      userId: session.user.id,
      trade: "General Services",
      bio: "Tell clients about your trade and experience.",
      serviceArea,
      available: false,
    },
  });

  revalidatePath("/dashboard/onboarding/artisan");
  return { success: true };
}

const tradeSelectionSchema = z.object({
  subcategoryId: z.string().min(1),
  proficiency: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]),
});

export async function saveArtisanTrades(
  selections: { subcategoryId: string; proficiency: string }[],
) {
  const session = await requireArtisan();
  if (!session) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.emailVerified) {
    return { error: "Verify your email before continuing onboarding" };
  }

  const parsed = z.array(tradeSelectionSchema).safeParse(
    selections.map((s) => ({
      subcategoryId: s.subcategoryId,
      proficiency: isSkillProficiency(s.proficiency) ? s.proficiency : "INTERMEDIATE",
    })),
  );
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid trade selection" };
  }

  const byId = new Map<string, SkillProficiency>();
  for (const row of parsed.data) {
    byId.set(row.subcategoryId, row.proficiency as SkillProficiency);
  }
  const uniqueIds = Array.from(byId.keys());
  if (uniqueIds.length < 1) {
    return { error: "Pick at least one service subcategory" };
  }

  const valid = await prisma.serviceSubcategory.findMany({
    where: { id: { in: uniqueIds } },
    include: { category: true },
  });
  if (valid.length === 0) return { error: "Invalid service selection" };

  await prisma.artisanService.deleteMany({ where: { userId: session.user.id } });
  await prisma.artisanService.createMany({
    data: valid.map((s) => ({
      userId: session.user.id,
      subcategoryId: s.id,
      proficiency: byId.get(s.id) ?? SkillProficiency.INTERMEDIATE,
    })),
  });

  // Prefer the highest-proficiency skill as the public trade label
  const rank: Record<SkillProficiency, number> = {
    BEGINNER: 1,
    INTERMEDIATE: 2,
    ADVANCED: 3,
    EXPERT: 4,
  };
  const best = [...valid].sort(
    (a, b) =>
      (rank[byId.get(b.id) ?? SkillProficiency.INTERMEDIATE] ?? 0) -
      (rank[byId.get(a.id) ?? SkillProficiency.INTERMEDIATE] ?? 0),
  )[0]!;
  const primaryTrade = best.category.name;

  await prisma.serviceProfile.upsert({
    where: { userId: session.user.id },
    update: { trade: primaryTrade },
    create: {
      userId: session.user.id,
      trade: primaryTrade,
      bio: "Tell clients about your trade and experience.",
      available: false,
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingStep: Math.max(user.onboardingStep, 3) },
  });

  revalidatePath("/dashboard/onboarding/artisan");
  revalidatePath("/dashboard/services");
  revalidatePath("/artisans");
  return { success: true };
}

export async function getArtisanOnboardingState() {
  const session = await requireArtisan();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      serviceProfile: true,
      artisanServices: {
        select: {
          subcategoryId: true,
          proficiency: true,
          subcategory: { select: { name: true, category: { select: { name: true } } } },
        },
      },
      kycDocuments: { orderBy: { createdAt: "desc" } },
    },
  });
  return user;
}
