"use server";

import { requireAuth } from "@/lib/auth/roles";
import { requireAdminSession } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma";
import {
  shouldRetainFullIdNumber,
  verifyIdentityWithProvider,
} from "@/lib/identity/provider";
import { revalidatePath } from "next/cache";

/** Phase 6: live provider path — stores reference, not full NIN by default. */
export async function verifyJobSeekerWithProvider(documentType: "NIN" | "PASSPORT" | "DRIVERS_LICENCE" | "VOTERS_CARD", documentNumber: string) {
  const session = await requireAuth();
  const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return { ok: false as const, error: "No job seeker profile" };

  const result = await verifyIdentityWithProvider({
    userId: session.user.id,
    documentType,
    documentNumber,
  });

  await prisma.identityProviderResult.create({
    data: {
      userId: session.user.id,
      provider: result.provider,
      referenceId: result.referenceId,
      status: result.status,
      rawRedacted: { documentType, last4: documentNumber.slice(-4) },
    },
  });

  await prisma.jobSeekerProfile.update({
    where: { id: profile.id },
    data: {
      identityStatus: result.status === "VERIFIED" ? "VERIFIED" : result.status === "PENDING" ? "PENDING" : "REJECTED",
      identityProviderRef: result.referenceId,
      identityVerifiedAt: result.status === "VERIFIED" ? new Date() : null,
      idDocumentType: documentType,
      idNumberEncrypted: shouldRetainFullIdNumber(result) ? documentNumber : null,
    },
  });

  revalidatePath("/jobs/register/seeker");
  return { ok: true as const, referenceId: result.referenceId, status: result.status };
}

export async function listIdentityProviderResults() {
  await requireAdminSession();
  return prisma.identityProviderResult.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
}
