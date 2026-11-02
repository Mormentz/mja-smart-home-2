"use server";

import { getAdminSessionOrNull } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma";

export type AdminPendingBadges = {
  kyc: number;
  verifications: number;
  jobs: number;
  rentals: number;
  security: number;
  notifications: number;
};

export async function getAdminPendingBadges(): Promise<AdminPendingBadges> {
  const empty: AdminPendingBadges = {
    kyc: 0,
    verifications: 0,
    jobs: 0,
    rentals: 0,
    security: 0,
    notifications: 0,
  };
  const session = await getAdminSessionOrNull();
  if (!session) return empty;

  const [
    pendingKycUsers,
    pendingKycDocs,
    pendingProps,
    pendingArtisans,
    pendingSeekers,
    pendingEmployers,
    pendingListings,
    pendingOwners,
    openDisputes,
    openFlags,
    openPrivacy,
    unreadNotifications,
  ] = await Promise.all([
    prisma.user.count({ where: { kycStatus: "PENDING" } }),
    prisma.kycDocument.count({ where: { status: "PENDING" } }),
    prisma.property.count({ where: { verificationStatus: "PENDING" } }),
    prisma.serviceProfile.count({ where: { verificationStatus: "PENDING" } }),
    prisma.jobSeekerProfile.count({ where: { identityStatus: "PENDING" } }),
    prisma.employerProfile.count({
      where: { OR: [{ verificationStatus: "PENDING" }, { identityStatus: "PENDING" }] },
    }),
    prisma.equipmentListing.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.equipmentOwnerProfile.count({ where: { identityStatus: "PENDING" } }),
    prisma.rentalDispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
    prisma.flaggedAccount.count({ where: { resolved: false } }),
    prisma.privacyRequest.count({ where: { status: "OPEN" } }),
    prisma.adminNotification.count({ where: { readAt: null } }),
  ]);

  const kyc = pendingKycUsers + pendingKycDocs;
  return {
    kyc,
    verifications: kyc + pendingProps + pendingArtisans,
    jobs: pendingSeekers + pendingEmployers,
    rentals: pendingListings + pendingOwners + openDisputes,
    security: openFlags + openPrivacy,
    notifications: unreadNotifications,
  };
}
