"use server";

import { revalidatePath } from "next/cache";
import type { EmployerKind, EmploymentType } from "@prisma/client";
import { requireAuth } from "@/lib/auth/roles";
import { requireAdminSession } from "@/lib/auth/admin";
import { allocateHcId } from "@/lib/ids/allocate-hc-id";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/smtp";
import { saveUpload } from "@/lib/uploads/save-upload";

async function getOrCreateEmployer(userId: string, kind: EmployerKind = "INDIVIDUAL") {
  const existing = await prisma.employerProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const hcId = await allocateHcId("EMP", user.stateCode);
  return prisma.employerProfile.create({
    data: {
      userId,
      hcId,
      kind,
      phone: user.phone,
      officialEmail: user.email,
      fullName: user.name,
      registrationStep: 1,
    },
  });
}

export async function ensureEmployerProfile(kind?: EmployerKind) {
  const session = await requireAuth();
  return getOrCreateEmployer(session.user.id, kind ?? "INDIVIDUAL");
}

export async function getMyEmployerProfile() {
  const session = await requireAuth();
  return prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
    include: { vacancies: { orderBy: { updatedAt: "desc" } } },
  });
}

export async function saveEmployerRegistration(data: {
  kind: EmployerKind;
  companyName?: string;
  cacNumber?: string;
  businessAddress?: string;
  officialEmail?: string;
  phone?: string;
  authorizedRepName?: string;
  fullName?: string;
  generalLocation?: string;
  natureOfEmployment?: string;
}) {
  const session = await requireAuth();
  const profile = await getOrCreateEmployer(session.user.id, data.kind);
  await prisma.employerProfile.update({
    where: { id: profile.id },
    data: {
      ...data,
      verificationStatus: "PENDING",
      identityStatus: "PENDING",
      registrationStep: Math.max(profile.registrationStep, 2),
    },
  });
  revalidatePath("/jobs/register/employer");
  return { ok: true as const };
}

/** Authorized representative (business) or personal (individual) ID document — private, admin-reviewed. */
export async function uploadEmployerIdDocument(formData: FormData) {
  const session = await requireAuth();
  const profile = await getOrCreateEmployer(session.user.id);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false as const, error: "No file" };
  const saved = await saveUpload({
    file,
    segments: ["employers", session.user.id],
    prefix: "id",
    accept: "image-or-pdf",
  });
  if (!saved.ok) return { ok: false as const, error: saved.error };
  await prisma.employerProfile.update({
    where: { id: profile.id },
    data: { authorizedRepIdUrl: saved.url, identityStatus: "PENDING" },
  });
  revalidatePath("/jobs/register/employer");
  return { ok: true as const, url: saved.url };
}

export async function decideEmployerVerification(id: string, approve: boolean, note?: string) {
  await requireAdminSession();
  await prisma.employerProfile.update({
    where: { id },
    data: {
      verificationStatus: approve ? "VERIFIED" : "REJECTED",
      identityStatus: approve ? "VERIFIED" : "REJECTED",
      verificationNote: note,
    },
  });
  revalidatePath("/admin/jobs");
  return { ok: true as const, error: undefined };
}

export async function createVacancy(data: {
  title: string;
  category?: string;
  description: string;
  employmentTypes: EmploymentType[];
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  publish?: boolean;
}) {
  const session = await requireAuth();
  const employer = await prisma.employerProfile.findUnique({ where: { userId: session.user.id } });
  if (!employer) return { ok: false as const, error: "Register as an employer first." };
  if (employer.verificationStatus !== "VERIFIED" && data.publish) {
    return { ok: false as const, error: "Employer must be verified before publishing." };
  }
  const vacancy = await prisma.employmentVacancy.create({
    data: {
      employerId: employer.id,
      employerUserId: session.user.id,
      title: data.title,
      category: data.category,
      description: data.description,
      employmentTypes: data.employmentTypes,
      location: data.location,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      published: Boolean(data.publish) && employer.verificationStatus === "VERIFIED",
      pendingReview: true,
    },
  });
  revalidatePath("/jobs/vacancies");
  return { ok: true as const, id: vacancy.id };
}

export async function listPublishedVacancies() {
  return prisma.employmentVacancy.findMany({
    where: { published: true },
    include: {
      employer: { select: { hcId: true, companyName: true, fullName: true, kind: true, verificationStatus: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
}

export async function applyToVacancy(vacancyId: string, coverNote?: string) {
  const session = await requireAuth();
  const { kycGateError, requireUserTier1 } = await import("@/lib/auth/kyc-gate");
  const kyc = await requireUserTier1(session.user.id);
  if (!kyc.ok) return { ok: false as const, ...kycGateError(kyc) };
  const seeker = await prisma.jobSeekerProfile.findUnique({ where: { userId: session.user.id } });
  if (!seeker?.submittedAt) return { ok: false as const, error: "Complete job seeker registration first." };
  await prisma.jobApplication.create({
    data: {
      vacancyId,
      seekerProfileId: seeker.id,
      seekerUserId: session.user.id,
      coverNote,
    },
  });
  // Level 2 — application-based CV access for this vacancy's employer
  const vacancy = await prisma.employmentVacancy.findUniqueOrThrow({ where: { id: vacancyId } });
  await prisma.cvAccessGrant.create({
    data: {
      seekerProfileId: seeker.id,
      employerUserId: vacancy.employerUserId,
      level: "APPLICATION",
      vacancyId,
    },
  });
  revalidatePath("/dashboard/employment");
  return { ok: true as const };
}

export async function requestContactCandidate(data: {
  seekerProfileId: string;
  message: string;
  jobOpportunity?: string;
}) {
  const session = await requireAuth();
  const employer = await prisma.employerProfile.findUnique({ where: { userId: session.user.id } });
  if (!employer || employer.verificationStatus !== "VERIFIED") {
    return { ok: false as const, error: "Only verified employers can request contact." };
  }
  const seeker = await prisma.jobSeekerProfile.findUniqueOrThrow({
    where: { id: data.seekerProfileId },
  });
  const req = await prisma.contactRequest.create({
    data: {
      employerUserId: session.user.id,
      seekerUserId: seeker.userId,
      seekerProfileId: seeker.id,
      message: data.message,
      jobOpportunity: data.jobOpportunity,
    },
  });
  try {
    if (seeker.email) {
      await sendEmail({
        to: seeker.email,
        subject: "HomeConnect — employer contact request",
        html: `<p>An employer requested to contact you about a role. Review it in your employment dashboard.</p>`,
      });
    }
  } catch {
    // SMTP optional in dev
  }
  revalidatePath("/dashboard/employment");
  return { ok: true as const, id: req.id };
}

export async function respondContactRequest(requestId: string, accept: boolean) {
  const session = await requireAuth();
  const req = await prisma.contactRequest.findUniqueOrThrow({ where: { id: requestId } });
  if (req.seekerUserId !== session.user.id) return { ok: false as const, error: "Not your request." };
  await prisma.contactRequest.update({
    where: { id: requestId },
    data: { status: accept ? "ACCEPTED" : "DECLINED", respondedAt: new Date() },
  });
  if (accept) {
    await prisma.message.create({
      data: {
        senderId: req.employerUserId,
        recipientId: req.seekerUserId,
        content: `Contact request accepted. Opportunity: ${req.jobOpportunity ?? "General recruitment"}\n\n${req.message}`,
      },
    });
    await prisma.cvAccessGrant.create({
      data: {
        seekerProfileId: req.seekerProfileId,
        employerUserId: req.employerUserId,
        level: "AUTHORIZED",
      },
    });
  }
  revalidatePath("/dashboard/employment");
  revalidatePath("/dashboard/messages");
  return { ok: true as const };
}

export async function listMyContactRequests() {
  const session = await requireAuth();
  return prisma.contactRequest.findMany({
    where: {
      OR: [{ seekerUserId: session.user.id }, { employerUserId: session.user.id }],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function listPendingEmployers() {
  await requireAdminSession();
  return prisma.employerProfile.findMany({
    where: { verificationStatus: "PENDING" },
    orderBy: { updatedAt: "asc" },
  });
}
