import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/roles";
import { ensureJobSeekerProfile, getMyJobSeekerProfile } from "@/lib/actions/job-seeker";
import { appBaseUrl } from "@/lib/email/smtp";
import { SeekerRegistrationWizard, type ProfileSeed } from "@/components/jobs/seeker-registration-wizard";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const metadata: Metadata = {
  title: "Register as Job Seeker — HomeConnect",
};

export default async function JobSeekerRegisterPage() {
  await requireAuth();
  await ensureJobSeekerProfile();
  const profile = await getMyJobSeekerProfile();
  if (!profile) return null;

  const dateOnly = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");
  const seed: ProfileSeed = {
    id: profile.id,
    registrationStep: profile.registrationStep,
    fullName: profile.fullName,
    displayName: profile.displayName,
    dateOfBirth: dateOnly(profile.dateOfBirth),
    gender: profile.gender,
    nationality: profile.nationality,
    stateOfResidence: profile.stateOfResidence,
    lgaName: profile.lgaName,
    residentialAddress: profile.residentialAddress,
    cityTown: profile.cityTown,
    phone: profile.phone,
    whatsapp: profile.whatsapp,
    email: profile.email,
    preferredLanguage: profile.preferredLanguage,
    altContactNumber: profile.altContactNumber,
    idDocumentType: profile.idDocumentType,
    idDocumentUrl: profile.idDocumentUrl,
    passportPhotoUrl: profile.passportPhotoUrl,
    preferredJobTitle: profile.preferredJobTitle,
    primaryJobCategory: profile.primaryJobCategory,
    secondaryJobCategory: profile.secondaryJobCategory,
    employmentTypes: profile.employmentTypes,
    preferredLocations: profile.preferredLocations,
    expectedSalaryMin: profile.expectedSalaryMin,
    expectedSalaryMax: profile.expectedSalaryMax,
    minimumAcceptableSalary: profile.minimumAcceptableSalary,
    availableStartDate: dateOnly(profile.availableStartDate),
    willingToRelocate: profile.willingToRelocate,
    preferredWorkingHours: profile.preferredWorkingHours,
    preferredWorkArrangement: profile.preferredWorkArrangement,
    careerObjective: profile.careerObjective,
    additionalPreferences: profile.additionalPreferences,
    highestQualification: profile.highestQualification,
    institutionName: profile.institutionName,
    courseOfStudy: profile.courseOfStudy,
    yearOfGraduation: profile.yearOfGraduation,
    professionalQualifications: profile.professionalQualifications,
    additionalTraining: profile.additionalTraining,
    certificationsText: profile.certificationsText,
    skillsAcquired: profile.skillsAcquired,
    primarySkill: profile.primarySkill,
    additionalSkills: profile.additionalSkills,
    yearsOfExperience: profile.yearsOfExperience,
    skillProficiency: profile.skillProficiency,
    toolsSoftware: profile.toolsSoftware,
    professionalLicences: profile.professionalLicences,
    languagesSpoken: profile.languagesSpoken,
    relevantTraining: profile.relevantTraining,
    portfolioUrl: profile.portfolioUrl,
    professionalSummary: profile.professionalSummary,
    cvUrl: profile.cvUrl,
    emergencyFullName: profile.emergencyFullName,
    emergencyRelationship: profile.emergencyRelationship,
    emergencyPhone: profile.emergencyPhone,
    emergencyAltPhone: profile.emergencyAltPhone,
    backgroundConsent: profile.backgroundConsent,
    experiences: profile.experiences
      .slice()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((e) => ({
        id: e.id,
        jobTitle: e.jobTitle,
        employerName: e.employerName,
        companyLocation: e.companyLocation ?? "",
        startDate: dateOnly(e.startDate),
        endDate: dateOnly(e.endDate),
        responsibilities: e.responsibilities ?? "",
        achievements: e.achievements ?? "",
        reasonForLeaving: e.reasonForLeaving ?? "",
        supervisorName: e.supervisorName ?? "",
        supervisorContact: e.supervisorContact ?? "",
        permissionToContact: e.permissionToContact,
      })),
    educationDocs: profile.educationDocs.map((d) => ({
      id: d.id,
      label: d.label,
      url: d.url,
      status: d.status,
    })),
    guarantor: profile.guarantor
      ? {
          fullName: profile.guarantor.fullName,
          phone: profile.guarantor.phone,
          whatsapp: profile.guarantor.whatsapp,
          email: profile.guarantor.email,
          residentialAddress: profile.guarantor.residentialAddress,
          occupation: profile.guarantor.occupation,
          employerName: profile.guarantor.employerName,
          relationship: profile.guarantor.relationship,
          yearsKnown: profile.guarantor.yearsKnown,
          consentToContact: profile.guarantor.consentToContact,
          declarationAccepted: profile.guarantor.declarationAccepted,
          status: profile.guarantor.status,
          inviteLink: profile.guarantor.inviteToken
            ? `${appBaseUrl()}/jobs/guarantor/${profile.guarantor.inviteToken}`
            : null,
        }
      : null,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-ink text-ink-foreground">
        <Header variant="dark" />
        <div className="container-page pb-10 pt-32">
          <p className="text-sm uppercase tracking-[0.2em] text-ink-foreground/65">Jobs</p>
          <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">Job seeker registration</h1>
          <p className="mt-2 max-w-2xl text-ink-foreground/75">
            Save and continue anytime. Your ID documents and contacts stay private — employers see a
            professional profile only. ID: <span className="font-mono text-success">{profile.hcId}</span>
          </p>
          <Link href="/jobs" className="mt-4 inline-block text-sm text-success underline-offset-4 hover:underline">
            ← Back to Jobs hub
          </Link>
        </div>
      </div>
      <div className="container-page py-10">
        <SeekerRegistrationWizard profile={seed} />
      </div>
      <Footer />
    </div>
  );
}
