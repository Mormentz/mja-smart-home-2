"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function toggleSavedProperty(propertyId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!["RENTER", "BUYER"].includes(session.user.role)) {
    return { error: "Only renters and buyers can save homes" };
  }

  const existing = await prisma.savedProperty.findUnique({
    where: {
      userId_propertyId: { userId: session.user.id, propertyId },
    },
  });

  if (existing) {
    await prisma.savedProperty.delete({ where: { id: existing.id } });
    revalidatePath("/dashboard/saved");
    revalidatePath(`/properties/${propertyId}`);
    return { success: true, saved: false };
  }

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return { error: "Property not found" };

  await prisma.savedProperty.create({
    data: { userId: session.user.id, propertyId },
  });

  revalidatePath("/dashboard/saved");
  revalidatePath(`/properties/${propertyId}`);
  return { success: true, saved: true };
}

export async function getSavedProperties() {
  const session = await auth();
  if (!session?.user?.id) return [];
  return prisma.savedProperty.findMany({
    where: { userId: session.user.id },
    include: { property: { include: { neighborhood: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function isPropertySaved(propertyId: string) {
  const session = await auth();
  if (!session?.user?.id) return false;
  const row = await prisma.savedProperty.findUnique({
    where: {
      userId_propertyId: { userId: session.user.id, propertyId },
    },
  });
  return Boolean(row);
}
