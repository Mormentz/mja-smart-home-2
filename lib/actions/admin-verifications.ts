"use server";

import { VerificationStatus } from "@/generated/prisma/client";
import { getAdminSessionOrNull } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  return getAdminSessionOrNull();
}

export async function getVerificationQueues(status: "pending" | "approved" | "rejected") {
  const session = await requireAdmin();
  if (!session) {
    return {
      kycUsers: [],
      kycDocuments: [],
      properties: [],
      artisans: [],
      seekers: [],
      employers: [],
      rentalOwners: [],
      rentalListings: [],
      counts: { pending: 0, approved: 0, rejected: 0 },
    };
  }

  const statusMap = {
    pending: VerificationStatus.PENDING,
    approved: VerificationStatus.VERIFIED,
    rejected: VerificationStatus.REJECTED,
  } as const;
  const vs = statusMap[status];

  const listingStatus =
    status === "pending" ? "PENDING_REVIEW" : status === "approved" ? "APPROVED" : "REJECTED";

  const [
    kycUsers,
    kycDocuments,
    properties,
    artisans,
    seekers,
    employers,
    rentalOwners,
    rentalListings,
    pendingKycUsers,
    pendingKycDocs,
    approvedKyc,
    rejectedKyc,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { kycStatus: vs, role: { in: ["USER", "AGENT", "ARTISAN"] } },
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        kycLevel: true,
        phone: true,
        kycStatus: true,
        updatedAt: true,
      },
    }),
    prisma.kycDocument.findMany({
      where: { status: vs },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.property.findMany({
      where: { verificationStatus: vs },
      include: { owner: { select: { id: true, name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.serviceProfile.findMany({
      where: { verificationStatus: vs },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.jobSeekerProfile.findMany({
      where: { identityStatus: vs },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.employerProfile.findMany({
      where: { OR: [{ verificationStatus: vs }, { identityStatus: vs }] },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.equipmentOwnerProfile.findMany({
      where: { identityStatus: vs },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.equipmentListing.findMany({
      where: { status: listingStatus },
      include: {
        owner: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.user.count({ where: { kycStatus: "PENDING" } }),
    prisma.kycDocument.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { kycStatus: "VERIFIED" } }),
    prisma.user.count({ where: { kycStatus: "REJECTED" } }),
  ]);

  return {
    kycUsers,
    kycDocuments,
    properties,
    artisans,
    seekers,
    employers,
    rentalOwners,
    rentalListings,
    counts: {
      pending: pendingKycUsers + pendingKycDocs,
      approved: approvedKyc,
      rejected: rejectedKyc,
    },
  };
}

export async function getAdminKycWorkspace(userId: string) {
  const session = await requireAdmin();
  if (!session) return null;

  const [user, activity] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        kycDocuments: { orderBy: [{ tier: "asc" }, { createdAt: "desc" }] },
        serviceProfile: true,
      },
    }),
    prisma.auditLog.findMany({
      where: {
        OR: [
          { entity: "User", entityId: userId },
          { action: { startsWith: "KYC_" }, entityId: userId },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  return user ? { user, activity } : null;
}
