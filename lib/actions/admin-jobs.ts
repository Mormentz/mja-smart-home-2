"use server";

import { revalidatePath } from "next/cache";
import { Prisma, VerificationStatus } from "@/generated/prisma/client";
import { getAdminSessionOrNull } from "@/lib/auth/admin";
import { writeAdminAudit } from "@/lib/admin/audit";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  return getAdminSessionOrNull();
}

const VERIFICATION_STATUSES = ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"] as const;

function parseStatus(status?: string): VerificationStatus | undefined {
  const s = status?.toUpperCase();
  return s && (VERIFICATION_STATUSES as readonly string[]).includes(s)
    ? (s as VerificationStatus)
    : undefined;
}

function ci(q: string) {
  return { contains: q, mode: "insensitive" as const };
}

export async function listAdminJobSeekers(opts?: { q?: string; status?: string }) {
  const session = await requireAdmin();
  if (!session) return [];
  const q = opts?.q?.trim();
  const status = parseStatus(opts?.status);

  return prisma.jobSeekerProfile.findMany({
    where: {
      ...(status ? { identityStatus: status } : {}),
      ...(q
        ? {
            OR: [
              { hcId: ci(q) },
              { fullName: ci(q) },
              { email: ci(q) },
              { phone: ci(q) },
              { primaryJobCategory: ci(q) },
              { user: { is: { email: ci(q) } } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      hcId: true,
      fullName: true,
      email: true,
      phone: true,
      primaryJobCategory: true,
      identityStatus: true,
      guarantorStatus: true,
      employmentHistoryVerified: true,
      profileHidden: true,
      registrationStep: true,
      submittedAt: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function listAdminEmployers(opts?: { q?: string; status?: string }) {
  const session = await requireAdmin();
  if (!session) return [];
  const q = opts?.q?.trim();
  const status = parseStatus(opts?.status);

  return prisma.employerProfile.findMany({
    where: {
      ...(status ? { verificationStatus: status } : {}),
      ...(q
        ? {
            OR: [
              { hcId: ci(q) },
              { companyName: ci(q) },
              { fullName: ci(q) },
              { officialEmail: ci(q) },
              { cacNumber: ci(q) },
              { user: { is: { email: ci(q) } } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      hcId: true,
      kind: true,
      companyName: true,
      fullName: true,
      officialEmail: true,
      verificationStatus: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { vacancies: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function listAdminVacancies(opts?: {
  q?: string;
  /** pending | published | unpublished */
  status?: string;
}) {
  const session = await requireAdmin();
  if (!session) return [];
  const q = opts?.q?.trim();
  const status = opts?.status?.toLowerCase();

  const statusWhere: Prisma.EmploymentVacancyWhereInput =
    status === "pending"
      ? { pendingReview: true }
      : status === "published"
        ? { published: true }
        : status === "unpublished"
          ? { published: false, pendingReview: false }
          : {};

  return prisma.employmentVacancy.findMany({
    where: {
      ...statusWhere,
      ...(q
        ? {
            OR: [
              { title: ci(q) },
              { category: ci(q) },
              { location: ci(q) },
              { employer: { is: { companyName: ci(q) } } },
              { employer: { is: { fullName: ci(q) } } },
            ],
          }
        : {}),
    },
    include: {
      employer: { select: { id: true, hcId: true, companyName: true, fullName: true } },
      _count: { select: { applications: true } },
    },
    orderBy: [{ pendingReview: "desc" }, { createdAt: "desc" }],
    take: 200,
  });
}

export async function listAdminApplications(opts?: { q?: string }) {
  const session = await requireAdmin();
  if (!session) return [];
  const q = opts?.q?.trim();

  return prisma.jobApplication.findMany({
    where: q
      ? {
          OR: [
            { vacancy: { is: { title: ci(q) } } },
            { seekerProfile: { is: { fullName: ci(q) } } },
            { seekerProfile: { is: { hcId: ci(q) } } },
            { seekerUser: { is: { email: ci(q) } } },
          ],
        }
      : undefined,
    include: {
      vacancy: {
        select: {
          id: true,
          title: true,
          employer: { select: { id: true, companyName: true, fullName: true } },
        },
      },
      seekerProfile: { select: { id: true, hcId: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function listAdminJobFlags(opts?: { q?: string; resolved?: boolean }) {
  const session = await requireAdmin();
  if (!session) return [];
  const q = opts?.q?.trim();

  return prisma.flaggedAccount.findMany({
    where: {
      ...(typeof opts?.resolved === "boolean" ? { resolved: opts.resolved } : {}),
      ...(q
        ? {
            OR: [
              { reason: ci(q) },
              { user: { is: { email: ci(q) } } },
              { user: { is: { name: ci(q) } } },
            ],
          }
        : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          jobSeekerProfile: { select: { id: true } },
          employerProfile: { select: { id: true } },
        },
      },
    },
    orderBy: [{ resolved: "asc" }, { createdAt: "desc" }],
    take: 200,
  });
}

export async function resolveAdminJobFlag(flagId: string, resolved = true) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };

  const flag = await prisma.flaggedAccount.findUnique({ where: { id: flagId } });
  if (!flag) return { error: "Flag not found" };

  await prisma.flaggedAccount.update({ where: { id: flagId }, data: { resolved } });
  await writeAdminAudit({
    actorId: session.user.id,
    action: resolved ? "JOB_FLAG_RESOLVED" : "JOB_FLAG_REOPENED",
    entity: "FlaggedAccount",
    entityId: flagId,
    meta: { userId: flag.userId },
  });

  revalidatePath("/admin/jobs");
  return { success: true };
}

export async function getAdminSeekerDetail(id: string) {
  const session = await requireAdmin();
  if (!session) return null;

  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, active: true } },
      experiences: { orderBy: { startDate: "desc" } },
      educationDocs: { orderBy: { createdAt: "desc" } },
      guarantor: true,
      applications: {
        include: { vacancy: { select: { id: true, title: true, published: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      _count: { select: { profileViews: true, contactRequests: true } },
    },
  });
  if (!profile) return null;

  // Never ship raw ID numbers / guarantor invite tokens to the client.
  const { idNumberEncrypted, generatedCvHtml: _cv, guarantor, ...safe } = profile;
  void _cv;
  return {
    ...safe,
    hasIdNumber: Boolean(idNumberEncrypted),
    guarantor: guarantor ? { ...guarantor, inviteToken: undefined } : null,
  };
}

export async function getAdminEmployerDetail(id: string) {
  const session = await requireAdmin();
  if (!session) return null;

  return prisma.employerProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          active: true,
          flaggedAccounts: { orderBy: { createdAt: "desc" }, take: 20 },
        },
      },
      vacancies: {
        include: { _count: { select: { applications: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });
}

export async function getAdminVacancyDetail(id: string) {
  const session = await requireAdmin();
  if (!session) return null;

  return prisma.employmentVacancy.findUnique({
    where: { id },
    include: {
      employer: {
        select: {
          id: true,
          hcId: true,
          kind: true,
          companyName: true,
          fullName: true,
          verificationStatus: true,
        },
      },
      applications: {
        include: { seekerProfile: { select: { id: true, hcId: true, fullName: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      },
    },
  });
}

/** Approve (publish) or reject/unpublish a vacancy. Always clears pendingReview. */
export async function decideVacancyReview(id: string, approve: boolean) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };

  const vacancy = await prisma.employmentVacancy.findUnique({ where: { id } });
  if (!vacancy) return { error: "Vacancy not found" };

  await prisma.employmentVacancy.update({
    where: { id },
    data: { pendingReview: false, published: approve },
  });

  await writeAdminAudit({
    actorId: session.user.id,
    action: approve ? "VACANCY_APPROVED" : "VACANCY_UNPUBLISHED",
    entity: "EmploymentVacancy",
    entityId: id,
    meta: { title: vacancy.title, wasPublished: vacancy.published, wasPending: vacancy.pendingReview },
  });

  revalidatePath(`/admin/jobs/vacancies/${id}`);
  revalidatePath("/admin/jobs");
  revalidatePath("/jobs/vacancies");
  return { success: true };
}
