"use server";

import { revalidatePath } from "next/cache";
import type {
  EmploymentType,
  IdDocumentType,
  SkillProficiency,
  WorkArrangement,
} from "@prisma/client";
import { requireAuth } from "@/lib/auth/roles";
import { requireAdminSession } from "@/lib/auth/admin";
import { allocateHcId } from "@/lib/ids/allocate-hc-id";
import { prisma } from "@/lib/prisma";
import { toPublicJobSeeker } from "@/lib/jobs/public-profile";
import { saveUpload, type UploadAccept } from "@/lib/uploads/save-upload";
import { appBaseUrl, sendEmail } from "@/lib/email/smtp";
import { randomBytes } from "node:crypto";

async function getOrCreateSeekerProfile(userId: string) {
  const existing = await prisma.jobSeekerProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const hcId = await allocateHcId("JOB", user.stateCode);
  return prisma.jobSeekerProfile.create({
    data: {
      userId,
      hcId,
      email: user.email,
      phone: user.phone,
      fullName: user.name,
      registrationStep: 1,
    },
  });
}

export async function ensureJobSeekerProfile() {
  const session = await requireAuth();
  return getOrCreateSeekerProfile(session.user.id);
}

export async function getMyJobSeekerProfile() {
  const session = await requireAuth();
  return prisma.jobSeekerProfile.findUnique({
    where: { userId: session.user.id },
    include: { experiences: true, educationDocs: true, guarantor: true },
  });
}

export async function saveSeekerSectionA(data: {
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  nationality: string;
  stateOfResidence: string;
  lgaName: string;
  residentialAddress: string;
  cityTown: string;
  phone: string;
  whatsapp: string;
  email: string;
  preferredLanguage: string;
  altContactNumber?: string;
  idDocumentType: IdDocumentType;
  displayName?: string;
}) {
  const session = await requireAuth();
  const profile = await getOrCreateSeekerProfile(session.user.id);
  await prisma.jobSeekerProfile.update({
    where: { id: profile.id },
    data: {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      generalLocation: [data.cityTown, data.stateOfResidence].filter(Boolean).join(", "),
      registrationStep: Math.max(profile.registrationStep, 2),
    },
  });
  revalidatePath("/jobs/register/seeker");
  return { ok: true as const };
}

export async function saveSeekerSectionB(data: {
  preferredJobTitle: string;
  primaryJobCategory: string;
  secondaryJobCategory?: string;
  employmentTypes: EmploymentType[];
  preferredLocations: string[];
  preferredStates: string[];
  expectedSalaryMin?: number;
  expectedSalaryMax?: number;
  minimumAcceptableSalary?: number;
  availableStartDate?: string;
  willingToRelocate: boolean;
  preferredWorkingHours?: string;
  preferredWorkArrangement?: WorkArrangement;
  careerObjective?: string;
  additionalPreferences?: string;
}) {
  const session = await requireAuth();
  const profile = await getOrCreateSeekerProfile(session.user.id);
  await prisma.jobSeekerProfile.update({
    where: { id: profile.id },
    data: {
      ...data,
      availableStartDate: data.availableStartDate ? new Date(data.availableStartDate) : null,
      registrationStep: Math.max(profile.registrationStep, 3),
    },
  });
  revalidatePath("/jobs/register/seeker");
  return { ok: true as const };
}

export async function saveSeekerSectionC(data: {
  highestQualification: string;
  institutionName?: string;
  courseOfStudy?: string;
  yearOfGraduation?: number;
  professionalQualifications?: string;
  additionalTraining?: string;
  certificationsText?: string;
  skillsAcquired?: string;
}) {
  const session = await requireAuth();
  const profile = await getOrCreateSeekerProfile(session.user.id);
  await prisma.jobSeekerProfile.update({
    where: { id: profile.id },
    data: { ...data, registrationStep: Math.max(profile.registrationStep, 4) },
  });
  revalidatePath("/jobs/register/seeker");
  return { ok: true as const };
}

export async function saveSeekerExperiences(
  experiences: {
    id?: string;
    jobTitle: string;
    employerName: string;
    companyLocation?: string;
    startDate?: string;
    endDate?: string;
    responsibilities?: string;
    achievements?: string;
    reasonForLeaving?: string;
    supervisorName?: string;
    supervisorContact?: string;
    permissionToContact?: boolean;
  }[],
) {
  const session = await requireAuth();
  const profile = await getOrCreateSeekerProfile(session.user.id);
  const existing = await prisma.jobSeekerExperience.findMany({
    where: { profileId: profile.id },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((e) => e.id));
  const keepIds = new Set(experiences.map((e) => e.id).filter((id): id is string => !!id && existingIds.has(id)));

  const toFields = (e: (typeof experiences)[number]) => ({
    jobTitle: e.jobTitle,
    employerName: e.employerName,
    companyLocation: e.companyLocation ?? null,
    startDate: e.startDate ? new Date(e.startDate) : null,
    endDate: e.endDate ? new Date(e.endDate) : null,
    responsibilities: e.responsibilities ?? null,
    achievements: e.achievements ?? null,
    reasonForLeaving: e.reasonForLeaving ?? null,
    supervisorName: e.supervisorName ?? null,
    supervisorContact: e.supervisorContact ?? null,
    permissionToContact: e.permissionToContact ?? false,
  });

  await prisma.$transaction([
    // Remove rows the seeker deleted in the UI
    prisma.jobSeekerExperience.deleteMany({
      where: { profileId: profile.id, id: { notIn: [...keepIds] } },
    }),
    // Update rows that already exist (preserves admin `verified` flags)
    ...experiences
      .filter((e) => e.id && keepIds.has(e.id))
      .map((e) =>
        prisma.jobSeekerExperience.update({
          where: { id: e.id! },
          data: toFields(e),
        }),
      ),
    // Create new rows
    ...experiences
      .filter((e) => !e.id || !keepIds.has(e.id))
      .map((e) =>
        prisma.jobSeekerExperience.create({
          data: { profileId: profile.id, ...toFields(e) },
        }),
      ),
    prisma.jobSeekerProfile.update({
      where: { id: profile.id },
      data: { registrationStep: Math.max(profile.registrationStep, 5) },
    }),
  ]);
  revalidatePath("/jobs/register/seeker");
  return { ok: true as const };
}

export async function saveSeekerSectionE(data: {
  primarySkill: string;
  additionalSkills: string[];
  yearsOfExperience?: number;
  skillProficiency?: SkillProficiency;
  toolsSoftware?: string;
  professionalLicences?: string;
  languagesSpoken: string[];
  relevantTraining?: string;
  portfolioUrl?: string;
}) {
  const session = await requireAuth();
  const profile = await getOrCreateSeekerProfile(session.user.id);
  await prisma.jobSeekerProfile.update({
    where: { id: profile.id },
    data: { ...data, registrationStep: Math.max(profile.registrationStep, 6) },
  });
  revalidatePath("/jobs/register/seeker");
  return { ok: true as const };
}

export async function saveSeekerSectionF(data: {
  professionalSummary?: string;
  careerObjective?: string;
  generatedCvHtml?: string;
}) {
  const session = await requireAuth();
  const profile = await getOrCreateSeekerProfile(session.user.id);
  await prisma.jobSeekerProfile.update({
    where: { id: profile.id },
    data: {
      professionalSummary: data.professionalSummary,
      careerObjective: data.careerObjective ?? profile.careerObjective,
      generatedCvHtml: data.generatedCvHtml,
      registrationStep: Math.max(profile.registrationStep, 7),
    },
  });
  revalidatePath("/jobs/register/seeker");
  return { ok: true as const };
}

export async function saveSeekerGuarantor(data: {
  fullName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  residentialAddress?: string;
  occupation?: string;
  employerName?: string;
  relationship?: string;
  yearsKnown?: number;
  consentToContact: boolean;
  declarationAccepted: boolean;
}) {
  const session = await requireAuth();
  const profile = await getOrCreateSeekerProfile(session.user.id);
  const previous = await prisma.jobSeekerGuarantor.findUnique({ where: { profileId: profile.id } });
  const identityUnchanged =
    previous?.status === "VERIFIED" &&
    previous.fullName === data.fullName &&
    previous.phone === data.phone &&
    (previous.email ?? "") === (data.email ?? "");
  const token = previous?.inviteToken ?? randomBytes(24).toString("hex");
  const emailChanged = (previous?.email ?? "") !== (data.email ?? "");

  await prisma.jobSeekerGuarantor.upsert({
    where: { profileId: profile.id },
    create: {
      profileId: profile.id,
      ...data,
      inviteToken: token,
      inviteSentAt: new Date(),
      status: "PENDING",
    },
    update: {
      ...data,
      inviteToken: token,
      ...(identityUnchanged
        ? {}
        : { inviteSentAt: new Date(), status: "PENDING" as const, confirmedAt: null }),
    },
  });
  await prisma.jobSeekerProfile.update({
    where: { id: profile.id },
    data: {
      guarantorStatus: identityUnchanged ? "VERIFIED" : "PENDING",
      registrationStep: Math.max(profile.registrationStep, 8),
    },
  });

  const inviteLink = `${appBaseUrl()}/jobs/guarantor/${token}`;
  let emailSent = false;
  // Auto-send the invite when it is new, the email changed, or the guarantor is not yet confirmed
  if (data.email && !identityUnchanged && (!previous || emailChanged || previous.status !== "VERIFIED")) {
    try {
      const seekerName = profile.displayName || profile.fullName || "A HomeConnect job seeker";
      const res = await sendEmail({
        to: data.email,
        subject: "HomeConnect guarantor verification",
        text: `${seekerName} named you as a guarantor/reference. Confirm here (this does not create financial liability): ${inviteLink}`,
        html: `<p>${seekerName} named you as a guarantor/reference on HomeConnect.</p><p>Confirm here (this does not create financial liability): <a href="${inviteLink}">${inviteLink}</a></p>`,
      });
      emailSent = "sent" in res;
    } catch {
      // SMTP optional in dev — seeker can still share the link manually
    }
  }
  revalidatePath("/jobs/register/seeker");
  return { ok: true as const, inviteToken: token, inviteLink, emailSent };
}

export async function saveSeekerEmergency(data: {
  emergencyFullName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  emergencyAltPhone?: string;
}) {
  const session = await requireAuth();
  const profile = await getOrCreateSeekerProfile(session.user.id);
  await prisma.jobSeekerProfile.update({
    where: { id: profile.id },
    data: { ...data, registrationStep: Math.max(profile.registrationStep, 9) },
  });
  revalidatePath("/jobs/register/seeker");
  return { ok: true as const };
}

export async function submitSeekerRegistration(data: {
  declarationAccepted: boolean;
  privacyAccepted: boolean;
  termsAccepted: boolean;
  backgroundConsent?: boolean;
}) {
  if (!data.declarationAccepted || !data.privacyAccepted || !data.termsAccepted) {
    return { ok: false as const, error: "You must accept the declarations to submit." };
  }
  const session = await requireAuth();
  const profile = await getOrCreateSeekerProfile(session.user.id);
  await prisma.jobSeekerProfile.update({
    where: { id: profile.id },
    data: {
      declarationAccepted: true,
      privacyAccepted: true,
      termsAccepted: true,
      backgroundConsent: data.backgroundConsent ?? false,
      identityStatus: profile.identityStatus === "VERIFIED" ? "VERIFIED" : "PENDING",
      submittedAt: new Date(),
      registrationStep: 11,
    },
  });
  revalidatePath("/jobs");
  revalidatePath("/jobs/seekers");
  return { ok: true as const };
}

export async function uploadSeekerDocument(formData: FormData) {
  const session = await requireAuth();
  const profile = await getOrCreateSeekerProfile(session.user.id);
  const file = formData.get("file") as File | null;
  const kind = String(formData.get("kind") ?? "id");
  if (!file || !(file instanceof File)) return { ok: false as const, error: "No file" };

  const accept: UploadAccept =
    kind === "photo" ? "image" : kind === "cv" ? "document" : "image-or-pdf";
  const saved = await saveUpload({
    file,
    segments: ["jobs", session.user.id],
    prefix: kind === "education" ? "edu" : kind,
    accept,
  });
  if (!saved.ok) return { ok: false as const, error: saved.error };
  const url = saved.url;

  if (kind === "id") {
    await prisma.jobSeekerProfile.update({
      where: { id: profile.id },
      data: { idDocumentUrl: url, identityStatus: "PENDING" },
    });
  } else if (kind === "photo") {
    await prisma.jobSeekerProfile.update({
      where: { id: profile.id },
      data: { passportPhotoUrl: url },
    });
  } else if (kind === "cv") {
    await prisma.jobSeekerProfile.update({
      where: { id: profile.id },
      data: { cvUrl: url, cvAccessDefault: "PRIVATE" },
    });
  } else if (kind === "education") {
    const label = String(formData.get("label") ?? "").trim() || "Education document";
    await prisma.jobSeekerEducationDoc.create({
      data: { profileId: profile.id, label, url, status: "PENDING" },
    });
  } else {
    return { ok: false as const, error: "Unknown upload kind" };
  }
  revalidatePath("/jobs/register/seeker");
  return { ok: true as const, url };
}

export async function deleteSeekerEducationDoc(docId: string) {
  const session = await requireAuth();
  const doc = await prisma.jobSeekerEducationDoc.findUnique({
    where: { id: docId },
    include: { profile: { select: { userId: true } } },
  });
  if (!doc || doc.profile.userId !== session.user.id) {
    return { ok: false as const, error: "Document not found" };
  }
  await prisma.jobSeekerEducationDoc.delete({ where: { id: docId } });
  revalidatePath("/jobs/register/seeker");
  return { ok: true as const };
}

export async function listPublicJobSeekers(filters?: { category?: string; q?: string }) {
  const rows = await prisma.jobSeekerProfile.findMany({
    where: {
      profileHidden: false,
      submittedAt: { not: null },
      ...(filters?.category ? { primaryJobCategory: filters.category } : {}),
      ...(filters?.q
        ? {
            OR: [
              { preferredJobTitle: { contains: filters.q, mode: "insensitive" } },
              { primarySkill: { contains: filters.q, mode: "insensitive" } },
              { hcId: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  return rows.map(toPublicJobSeeker);
}

export async function getPublicJobSeeker(id: string) {
  const profile = await prisma.jobSeekerProfile.findFirst({
    where: { OR: [{ id }, { hcId: id }], profileHidden: false, submittedAt: { not: null } },
  });
  if (!profile) return null;
  return toPublicJobSeeker(profile);
}

export async function decideJobSeekerIdentity(profileId: string, approve: boolean, note?: string) {
  await requireAdminSession();
  await prisma.jobSeekerProfile.update({
    where: { id: profileId },
    data: {
      identityStatus: approve ? "VERIFIED" : "REJECTED",
      identityNote: note,
      identityVerifiedAt: approve ? new Date() : null,
      // Do not expose raw ID numbers publicly; clear plaintext retention when verified result is enough
      idNumberEncrypted: approve ? null : undefined,
    },
  });
  await prisma.auditLog.create({
    data: {
      action: approve ? "JOB_SEEKER_IDENTITY_VERIFIED" : "JOB_SEEKER_IDENTITY_REJECTED",
      entity: "JobSeekerProfile",
      entityId: profileId,
      meta: { note },
    },
  });
  revalidatePath("/admin/jobs");
  revalidatePath("/jobs/seekers");
  return { ok: true as const, error: undefined };
}

export async function listPendingJobSeekerVerifications() {
  await requireAdminSession();
  return prisma.jobSeekerProfile.findMany({
    where: { identityStatus: "PENDING", submittedAt: { not: null } },
    orderBy: { submittedAt: "asc" },
    take: 100,
  });
}

export async function buildCvHtmlFromProfile(profileId: string) {
  const profile = await prisma.jobSeekerProfile.findUniqueOrThrow({
    where: { id: profileId },
    include: { experiences: true },
  });
  const html = `<article>
  <h1>${profile.displayName || profile.fullName || "Professional CV"}</h1>
  <p>${profile.hcId} · ${profile.generalLocation ?? ""}</p>
  <h2>Summary</h2>
  <p>${profile.professionalSummary ?? profile.careerObjective ?? ""}</p>
  <h2>Skills</h2>
  <p>${[profile.primarySkill, ...profile.additionalSkills].filter(Boolean).join(", ")}</p>
  <h2>Experience</h2>
  ${profile.experiences
    .map(
      (e) =>
        `<section><h3>${e.jobTitle} — ${e.employerName}</h3><p>${e.responsibilities ?? ""}</p></section>`,
    )
    .join("\n")}
  <h2>Education</h2>
  <p>${profile.highestQualification ?? ""} ${profile.institutionName ?? ""}</p>
</article>`;
  await prisma.jobSeekerProfile.update({
    where: { id: profileId },
    data: { generatedCvHtml: html },
  });
  return html;
}
