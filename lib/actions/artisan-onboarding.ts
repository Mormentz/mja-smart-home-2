"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getState } from "@/lib/geo/nigeria-states";

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

export async function saveArtisanTrades(subcategoryIds: string[]) {
  const session = await requireArtisan();
  if (!session) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.emailVerified) {
    return { error: "Verify your email before continuing onboarding" };
  }

  const unique = Array.from(new Set(subcategoryIds.filter(Boolean)));
  if (unique.length < 1) {
    return { error: "Pick at least one service subcategory" };
  }

  const valid = await prisma.serviceSubcategory.findMany({
    where: { id: { in: unique } },
    include: { category: true },
  });
  if (valid.length === 0) return { error: "Invalid service selection" };

  await prisma.artisanService.deleteMany({ where: { userId: session.user.id } });
  await prisma.artisanService.createMany({
    data: valid.map((s) => ({
      userId: session.user.id,
      subcategoryId: s.id,
    })),
  });

  const primaryTrade = valid[0]!.category.name;
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
  return { success: true };
}

export async function getArtisanOnboardingState() {
  const session = await requireArtisan();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      serviceProfile: true,
      artisanServices: { select: { subcategoryId: true } },
      kycDocuments: { orderBy: { createdAt: "desc" } },
    },
  });
  return user;
}
