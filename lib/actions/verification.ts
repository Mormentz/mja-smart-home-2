"use server";

import { revalidatePath } from "next/cache";
import { VerificationStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requestPropertyVerification(propertyId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (session.user.role !== "AGENT") {
    return { error: "Only agents can request verification" };
  }

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property || property.ownerId !== session.user.id) {
    return { error: "Listing not found" };
  }

  await prisma.property.update({
    where: { id: propertyId },
    data: { verificationStatus: VerificationStatus.PENDING },
  });

  revalidatePath("/dashboard/listings");
  revalidatePath("/dashboard/admin");
  revalidatePath(`/properties/${propertyId}`);
  return { success: true };
}

export async function requestArtisanVerification() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (session.user.role !== "ARTISAN") return { error: "Only artisans can request verification" };

  await prisma.serviceProfile.upsert({
    where: { userId: session.user.id },
    update: { verificationStatus: VerificationStatus.PENDING },
    create: {
      userId: session.user.id,
      trade: "General",
      bio: "Service professional on HomeConnect",
      verificationStatus: VerificationStatus.PENDING,
    },
  });

  revalidatePath("/dashboard/services");
  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function decidePropertyVerification(
  propertyId: string,
  decision: "VERIFIED" | "REJECTED",
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Admin only" };
  }

  await prisma.property.update({
    where: { id: propertyId },
    data: {
      verificationStatus: decision as VerificationStatus,
      verifiedAt: decision === "VERIFIED" ? new Date() : null,
    },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/properties");
  revalidatePath(`/properties/${propertyId}`);
  return { success: true };
}

export async function decideArtisanVerification(
  userId: string,
  decision: "VERIFIED" | "REJECTED",
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Admin only" };
  }

  await prisma.serviceProfile.update({
    where: { userId },
    data: {
      verificationStatus: decision as VerificationStatus,
      verified: decision === "VERIFIED",
    },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/artisans");
  return { success: true };
}

export async function getPendingVerifications() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { properties: [], artisans: [] };
  }

  const [properties, artisans] = await Promise.all([
    prisma.property.findMany({
      where: { verificationStatus: VerificationStatus.PENDING },
      include: { owner: { select: { id: true, name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.serviceProfile.findMany({
      where: { verificationStatus: VerificationStatus.PENDING },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return { properties, artisans };
}
