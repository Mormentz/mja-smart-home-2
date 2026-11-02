"use server";

import { revalidatePath } from "next/cache";
import { VerificationStatus } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { getAdminSessionOrNull } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma";

export async function requestPropertyVerification(propertyId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (session.user.role !== "AGENT") {
    return { error: "Only agents can request verification" };
  }

  const { kycGateError, requireProTier3 } = await import("@/lib/auth/kyc-gate");
  const kyc = await requireProTier3(session.user.id);
  if (!kyc.ok) return kycGateError(kyc);

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property || property.ownerId !== session.user.id) {
    return { error: "Listing not found" };
  }

  await prisma.property.update({
    where: { id: propertyId },
    data: { verificationStatus: VerificationStatus.PENDING },
  });

  const { emitAdminNotification } = await import("@/lib/actions/admin-notifications");
  await emitAdminNotification({
    type: "PROPERTY_PENDING",
    title: "Property verification requested",
    body: property.title,
    href: `/admin/properties/${propertyId}`,
    entityType: "property",
    entityId: propertyId,
    severity: "ACTION",
  });

  revalidatePath("/dashboard/listings");
  revalidatePath("/admin");
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

  const { emitAdminNotification } = await import("@/lib/actions/admin-notifications");
  await emitAdminNotification({
    type: "ARTISAN_PENDING",
    title: "Artisan verification requested",
    body: session.user.email ?? session.user.id,
    href: `/admin/artisans/${session.user.id}`,
    entityType: "artisan",
    entityId: session.user.id,
    severity: "ACTION",
  });

  revalidatePath("/dashboard/services");
  revalidatePath("/admin");
  return { success: true };
}

export async function decidePropertyVerification(
  propertyId: string,
  decision: "VERIFIED" | "REJECTED",
) {
  const session = await getAdminSessionOrNull();
  if (!session) {
    return { error: "Admin only" };
  }

  await prisma.property.update({
    where: { id: propertyId },
    data: {
      verificationStatus: decision as VerificationStatus,
      verifiedAt: decision === "VERIFIED" ? new Date() : null,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/properties");
  revalidatePath(`/properties/${propertyId}`);
  return { success: true };
}

export async function decideArtisanVerification(
  userId: string,
  decision: "VERIFIED" | "REJECTED",
) {
  const session = await getAdminSessionOrNull();
  if (!session) {
    return { error: "Admin only" };
  }

  await prisma.serviceProfile.update({
    where: { userId },
    data: {
      verificationStatus: decision as VerificationStatus,
      verified: decision === "VERIFIED",
    },
  });

  revalidatePath("/admin");
  revalidatePath("/artisans");
  return { success: true };
}

export async function getPendingVerifications() {
  const session = await getAdminSessionOrNull();
  if (!session) {
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
