"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/roles";
import { requireAdminSession } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma";
import { canViewCv, checkCvViewRateLimit, watermarkText } from "@/lib/jobs/cv-access";
import { sendEmail } from "@/lib/email/smtp";

export async function recordProfileView(seekerProfileId: string) {
  const session = await requireAuth();
  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { id: seekerProfileId },
    select: { userId: true },
  });
  // Ignore unknown profiles and seekers viewing their own page
  if (!profile || profile.userId === session.user.id) return;
  await prisma.profileView.create({
    data: { seekerProfileId, viewerUserId: session.user.id },
  });
}

export async function getSeekerPrivacyDashboard() {
  const session = await requireAuth();
  const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return null;
  const [views, grants, applications, contactReqs] = await Promise.all([
    prisma.profileView.findMany({
      where: { seekerProfileId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { viewerUser: { select: { id: true, name: true, email: true } } },
    }),
    prisma.cvAccessGrant.findMany({
      where: { seekerProfileId: profile.id, revokedAt: null },
      orderBy: { createdAt: "desc" },
    }),
    prisma.jobApplication.findMany({
      where: { seekerProfileId: profile.id },
      include: { vacancy: { select: { title: true, id: true } } },
    }),
    prisma.contactRequest.findMany({
      where: { seekerProfileId: profile.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { profile, views, grants, applications, contactReqs };
}

export async function setProfileHidden(hidden: boolean) {
  const session = await requireAuth();
  await prisma.jobSeekerProfile.updateMany({
    where: { userId: session.user.id },
    data: { profileHidden: hidden },
  });
  revalidatePath("/jobs/seekers");
  revalidatePath("/dashboard/employment/privacy");
  return { ok: true as const };
}

export async function revokeCvAccess(grantId: string) {
  const session = await requireAuth();
  const grant = await prisma.cvAccessGrant.findUniqueOrThrow({ where: { id: grantId } });
  const profile = await prisma.jobSeekerProfile.findUniqueOrThrow({
    where: { id: grant.seekerProfileId },
  });
  if (profile.userId !== session.user.id) return { ok: false as const, error: "Forbidden" };
  await prisma.cvAccessGrant.update({
    where: { id: grantId },
    data: { revokedAt: new Date() },
  });
  revalidatePath("/dashboard/employment/privacy");
  return { ok: true as const };
}

export async function viewSeekerCv(seekerProfileId: string) {
  const session = await requireAuth();
  if (!checkCvViewRateLimit(session.user.id)) {
    await prisma.flaggedAccount.create({
      data: {
        userId: session.user.id,
        reason: "CV_VIEW_RATE_LIMIT",
        meta: { seekerProfileId },
      },
    });
    return { ok: false as const, error: "Rate limit exceeded. Account flagged for review." };
  }
  const grant = await prisma.cvAccessGrant.findFirst({
    where: {
      seekerProfileId,
      employerUserId: session.user.id,
      revokedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });
  if (!canViewCv(grant?.level, "APPLICATION")) {
    return { ok: false as const, error: "No CV access. Candidate must apply or authorize you." };
  }
  const profile = await prisma.jobSeekerProfile.findUniqueOrThrow({
    where: { id: seekerProfileId },
  });
  const employer = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
  });
  await prisma.cvAccessLog.create({
    data: {
      seekerProfileId,
      viewerUserId: session.user.id,
      viewerHcId: employer?.hcId,
      action: "VIEW",
    },
  });
  return {
    ok: true as const,
    html: profile.generatedCvHtml,
    cvUrl: null as string | null, // downloads disabled by default
    downloadAllowed: false,
    watermark: watermarkText(employer?.hcId, session.user.email),
  };
}

export async function confirmGuarantorInvite(token: string, confirm: boolean) {
  const guarantor = await prisma.jobSeekerGuarantor.findUnique({ where: { inviteToken: token } });
  if (!guarantor) return { ok: false as const, error: "Invalid invite" };
  if (!confirm) return { ok: false as const, error: "Confirmation required" };
  await prisma.jobSeekerGuarantor.update({
    where: { id: guarantor.id },
    data: { status: "VERIFIED", confirmedAt: new Date() },
  });
  await prisma.jobSeekerProfile.update({
    where: { id: guarantor.profileId },
    data: { guarantorStatus: "VERIFIED" },
  });
  return { ok: true as const };
}

export async function sendGuarantorInviteEmail(profileId: string) {
  const session = await requireAuth();
  const profile = await prisma.jobSeekerProfile.findFirst({
    where: { id: profileId, userId: session.user.id },
    include: { guarantor: true },
  });
  if (!profile?.guarantor?.email || !profile.guarantor.inviteToken) {
    return { ok: false as const, error: "Guarantor email/token missing" };
  }
  const link = `${process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/jobs/guarantor/${profile.guarantor.inviteToken}`;
  try {
    await sendEmail({
      to: profile.guarantor.email,
      subject: "HomeConnect guarantor verification",
      html: `<p>You were named as a reference. Confirm here (this does not create financial liability): <a href="${link}">${link}</a></p>`,
    });
  } catch {
    // ignore in dev
  }
  return { ok: true as const, link };
}

export async function verifyEmploymentHistory(profileId: string, approve: boolean) {
  await requireAdminSession();
  await prisma.jobSeekerProfile.update({
    where: { id: profileId },
    data: { employmentHistoryVerified: approve },
  });
  if (approve) {
    await prisma.jobSeekerExperience.updateMany({
      where: { profileId, permissionToContact: true },
      data: { verified: true },
    });
  }
  revalidatePath("/admin/jobs");
  return { ok: true as const };
}

export async function reportEmployer(employerUserId: string, reason: string) {
  const session = await requireAuth();
  const trimmed = reason.trim().slice(0, 1000);
  if (trimmed.length < 10) {
    return { ok: false as const, error: "Please describe the problem (at least 10 characters)." };
  }
  if (employerUserId === session.user.id) {
    return { ok: false as const, error: "You cannot report yourself." };
  }
  await prisma.flaggedAccount.create({
    data: {
      userId: employerUserId,
      reason: `SEEKER_REPORT:${trimmed}`,
      meta: { reportedBy: session.user.id },
    },
  });
  return { ok: true as const };
}

export async function createPrivacyRequest(kind: "CORRECTION" | "DELETION" | "EXPORT", note?: string) {
  const session = await requireAuth();
  await prisma.privacyRequest.create({
    data: { userId: session.user.id, kind, note },
  });
  return { ok: true as const };
}

export async function processPrivacyDeletion(userId: string) {
  await requireAdminSession();
  await prisma.jobSeekerProfile.updateMany({
    where: { userId },
    data: {
      residentialAddress: null,
      phone: null,
      whatsapp: null,
      altContactNumber: null,
      idDocumentUrl: null,
      idNumberEncrypted: null,
      passportPhotoUrl: null,
      cvUrl: null,
      emergencyPhone: null,
      emergencyAltPhone: null,
      emergencyFullName: null,
      profileHidden: true,
    },
  });
  await prisma.jobSeekerGuarantor.deleteMany({
    where: { profile: { userId } },
  });
  await prisma.privacyRequest.updateMany({
    where: { userId, kind: "DELETION", status: "OPEN" },
    data: { status: "CLOSED", closedAt: new Date() },
  });
  await prisma.auditLog.create({
    data: { action: "PRIVACY_DELETION", entity: "User", entityId: userId },
  });
  return { ok: true as const };
}
