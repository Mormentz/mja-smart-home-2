import type { JobSeekerProfile } from "@prisma/client";

export type PublicJobSeekerDto = {
  id: string;
  hcId: string;
  displayName: string;
  generalLocation: string | null;
  preferredJobTitle: string | null;
  primaryJobCategory: string | null;
  additionalSkills: string[];
  yearsOfExperience: number | null;
  highestQualification: string | null;
  expectedSalaryMin: number | null;
  expectedSalaryMax: number | null;
  availableStartDate: Date | null;
  identityVerified: boolean;
  employmentHistoryVerified: boolean;
  guarantorConfirmed: boolean;
  professionalSummary: string | null;
  contactPrivate: true;
};

function displayNameFrom(profile: JobSeekerProfile): string {
  if (profile.displayName?.trim()) return profile.displayName.trim();
  const full = (profile.fullName ?? "").trim();
  if (!full) return "HomeConnect Seeker";
  const parts = full.split(/\s+/);
  if (parts.length === 1) return parts[0]!;
  return `${parts[0]} ${parts[parts.length - 1]![0]!.toUpperCase()}.`;
}

/** Strip PII for employer-facing public professional profiles. */
export function toPublicJobSeeker(profile: JobSeekerProfile): PublicJobSeekerDto {
  return {
    id: profile.id,
    hcId: profile.hcId,
    displayName: displayNameFrom(profile),
    generalLocation: profile.generalLocation ?? profile.cityTown ?? null,
    preferredJobTitle: profile.preferredJobTitle,
    primaryJobCategory: profile.primaryJobCategory,
    additionalSkills: profile.additionalSkills,
    yearsOfExperience: profile.yearsOfExperience,
    highestQualification: profile.highestQualification,
    expectedSalaryMin: profile.expectedSalaryMin,
    expectedSalaryMax: profile.expectedSalaryMax,
    availableStartDate: profile.availableStartDate,
    identityVerified: profile.identityStatus === "VERIFIED",
    employmentHistoryVerified: profile.employmentHistoryVerified,
    guarantorConfirmed: profile.guarantorStatus === "VERIFIED",
    professionalSummary: profile.professionalSummary,
    contactPrivate: true,
  };
}

export function assertNoPrivateLeak(dto: PublicJobSeekerDto & Record<string, unknown>) {
  const forbidden = [
    "phone",
    "email",
    "whatsapp",
    "residentialAddress",
    "idDocumentUrl",
    "idNumberEncrypted",
    "nin",
    "emergencyPhone",
    "cvUrl",
  ];
  for (const key of forbidden) {
    if (key in dto && dto[key] != null) {
      throw new Error(`Public DTO leaked private field: ${key}`);
    }
  }
}
