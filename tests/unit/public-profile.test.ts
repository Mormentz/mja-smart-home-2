import { describe, expect, it } from "vitest";
import { assertNoPrivateLeak, toPublicJobSeeker } from "@/lib/jobs/public-profile";
import type { JobSeekerProfile } from "@/generated/prisma/client";

function base(over: Partial<JobSeekerProfile> = {}): JobSeekerProfile {
  return {
    id: "p1",
    userId: "u1",
    hcId: "HC-JOB-ABJ-000001",
    registrationStep: 11,
    submittedAt: new Date(),
    profileHidden: false,
    fullName: "Samuel Adeyemi",
    dateOfBirth: null,
    gender: null,
    nationality: "Nigerian",
    stateOfResidence: "FCT",
    lgaName: "AMAC",
    residentialAddress: "12 Secret Street",
    cityTown: "Gwarinpa",
    phone: "08011111111",
    whatsapp: "08011111111",
    email: "sam@example.com",
    passportPhotoUrl: null,
    preferredLanguage: "English",
    altContactNumber: null,
    idDocumentType: "NIN",
    idDocumentUrl: "/secret/id.jpg",
    idNumberEncrypted: "12345678901",
    identityStatus: "VERIFIED",
    identityNote: null,
    identityVerifiedAt: new Date(),
    identityProviderRef: null,
    preferredJobTitle: "Professional Driver",
    primaryJobCategory: "driver",
    secondaryJobCategory: null,
    employmentTypes: [],
    preferredLocations: ["Gwarinpa"],
    preferredStates: ["FCT"],
    expectedSalaryMin: 150000,
    expectedSalaryMax: 200000,
    minimumAcceptableSalary: null,
    availableStartDate: null,
    willingToRelocate: false,
    preferredWorkingHours: null,
    preferredWorkArrangement: null,
    careerObjective: null,
    additionalPreferences: null,
    highestQualification: "SSCE",
    institutionName: null,
    courseOfStudy: null,
    yearOfGraduation: null,
    professionalQualifications: null,
    additionalTraining: null,
    certificationsText: null,
    skillsAcquired: null,
    primarySkill: "Driving",
    additionalSkills: ["Navigation"],
    yearsOfExperience: 7,
    skillProficiency: "ADVANCED",
    toolsSoftware: null,
    professionalLicences: null,
    languagesSpoken: ["English"],
    relevantTraining: null,
    portfolioUrl: null,
    professionalSummary: "Reliable driver",
    cvUrl: "/secret/cv.pdf",
    cvAccessDefault: "PRIVATE",
    generatedCvHtml: null,
    backgroundConsent: false,
    employmentHistoryVerified: true,
    guarantorStatus: "VERIFIED",
    emergencyFullName: "Jane",
    emergencyRelationship: "Sister",
    emergencyPhone: "08022222222",
    emergencyAltPhone: null,
    declarationAccepted: true,
    privacyAccepted: true,
    termsAccepted: true,
    displayName: null,
    generalLocation: "Gwarinpa, Abuja",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  };
}

describe("public job seeker DTO", () => {
  it("redacts private fields and formats display name", () => {
    const dto = toPublicJobSeeker(base());
    expect(dto.displayName).toBe("Samuel A.");
    expect(dto.hcId).toBe("HC-JOB-ABJ-000001");
    expect(dto.identityVerified).toBe(true);
    expect(dto.contactPrivate).toBe(true);
    expect((dto as unknown as Record<string, unknown>).phone).toBeUndefined();
    expect((dto as unknown as Record<string, unknown>).residentialAddress).toBeUndefined();
    assertNoPrivateLeak(dto);
  });
});
