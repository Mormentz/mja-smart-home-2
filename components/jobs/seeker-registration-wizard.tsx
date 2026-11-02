"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  saveSeekerSectionA,
  saveSeekerSectionB,
  saveSeekerSectionC,
  saveSeekerExperiences,
  saveSeekerSectionE,
  saveSeekerSectionF,
  saveSeekerGuarantor,
  saveSeekerEmergency,
  submitSeekerRegistration,
  uploadSeekerDocument,
  deleteSeekerEducationDoc,
  buildCvHtmlFromProfile,
} from "@/lib/actions/job-seeker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ABUJA_AREAS, EMPLOYMENT_TYPES, JOB_CATEGORIES } from "@/lib/jobs/constants";

const STEPS = [
  "Personal",
  "Preferences",
  "Education",
  "Experience",
  "Skills",
  "CV",
  "Guarantor",
  "Emergency",
  "Declaration",
] as const;

type Nullable<T> = T | null | undefined;

export type SeekerExperienceSeed = {
  id?: string;
  jobTitle: string;
  employerName: string;
  companyLocation: string;
  startDate: string;
  endDate: string;
  responsibilities: string;
  achievements: string;
  reasonForLeaving: string;
  supervisorName: string;
  supervisorContact: string;
  permissionToContact: boolean;
};

export type ProfileSeed = {
  id: string;
  registrationStep: number;
  // Section A
  fullName?: Nullable<string>;
  displayName?: Nullable<string>;
  dateOfBirth?: Nullable<string>;
  gender?: Nullable<string>;
  nationality?: Nullable<string>;
  stateOfResidence?: Nullable<string>;
  lgaName?: Nullable<string>;
  residentialAddress?: Nullable<string>;
  cityTown?: Nullable<string>;
  phone?: Nullable<string>;
  whatsapp?: Nullable<string>;
  email?: Nullable<string>;
  preferredLanguage?: Nullable<string>;
  altContactNumber?: Nullable<string>;
  idDocumentType?: Nullable<string>;
  idDocumentUrl?: Nullable<string>;
  passportPhotoUrl?: Nullable<string>;
  // Section B
  preferredJobTitle?: Nullable<string>;
  primaryJobCategory?: Nullable<string>;
  secondaryJobCategory?: Nullable<string>;
  employmentTypes?: string[];
  preferredLocations?: string[];
  expectedSalaryMin?: Nullable<number>;
  expectedSalaryMax?: Nullable<number>;
  minimumAcceptableSalary?: Nullable<number>;
  availableStartDate?: Nullable<string>;
  willingToRelocate?: boolean;
  preferredWorkingHours?: Nullable<string>;
  preferredWorkArrangement?: Nullable<string>;
  careerObjective?: Nullable<string>;
  additionalPreferences?: Nullable<string>;
  // Section C
  highestQualification?: Nullable<string>;
  institutionName?: Nullable<string>;
  courseOfStudy?: Nullable<string>;
  yearOfGraduation?: Nullable<number>;
  professionalQualifications?: Nullable<string>;
  additionalTraining?: Nullable<string>;
  certificationsText?: Nullable<string>;
  skillsAcquired?: Nullable<string>;
  educationDocs?: { id: string; label: string; url: string; status: string }[];
  // Section D
  experiences?: SeekerExperienceSeed[];
  // Section E
  primarySkill?: Nullable<string>;
  additionalSkills?: string[];
  yearsOfExperience?: Nullable<number>;
  skillProficiency?: Nullable<string>;
  toolsSoftware?: Nullable<string>;
  professionalLicences?: Nullable<string>;
  languagesSpoken?: string[];
  relevantTraining?: Nullable<string>;
  portfolioUrl?: Nullable<string>;
  // Section F
  professionalSummary?: Nullable<string>;
  cvUrl?: Nullable<string>;
  // Section G
  guarantor?: Nullable<{
    fullName: string;
    phone: string;
    whatsapp?: Nullable<string>;
    email?: Nullable<string>;
    residentialAddress?: Nullable<string>;
    occupation?: Nullable<string>;
    employerName?: Nullable<string>;
    relationship?: Nullable<string>;
    yearsKnown?: Nullable<number>;
    consentToContact: boolean;
    declarationAccepted: boolean;
    status: string;
    inviteLink?: Nullable<string>;
  }>;
  // Section H–J
  emergencyFullName?: Nullable<string>;
  emergencyRelationship?: Nullable<string>;
  emergencyPhone?: Nullable<string>;
  emergencyAltPhone?: Nullable<string>;
  backgroundConsent?: boolean;
};

const str = (v: Nullable<string | number>) => (v == null ? "" : String(v));

function emptyExperience(): SeekerExperienceSeed {
  return {
    jobTitle: "",
    employerName: "",
    companyLocation: "",
    startDate: "",
    endDate: "",
    responsibilities: "",
    achievements: "",
    reasonForLeaving: "",
    supervisorName: "",
    supervisorContact: "",
    permissionToContact: false,
  };
}

export function SeekerRegistrationWizard({ profile }: { profile: ProfileSeed }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const initial = Math.min(Math.max(profile.registrationStep - 1, 0), STEPS.length - 1);
  const [step, setStep] = useState(initial);
  const [invite, setInvite] = useState<{ link: string; emailSent: boolean | null } | null>(
    profile.guarantor?.inviteLink ? { link: profile.guarantor.inviteLink, emailSent: null } : null,
  );

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {STEPS.map((s, i) => (
            <span key={s} className={i === step ? "font-semibold text-foreground" : undefined}>
              {s}
              {i < STEPS.length - 1 ? " →" : ""}
            </span>
          ))}
        </div>
      </div>

      {step === 0 && (
        <SectionForm
          pending={pending}
          onSubmit={(fd) => {
            start(async () => {
              const res = await saveSeekerSectionA({
                fullName: String(fd.get("fullName")),
                dateOfBirth: String(fd.get("dateOfBirth") || "") || undefined,
                gender: String(fd.get("gender") || "") || undefined,
                nationality: String(fd.get("nationality")),
                stateOfResidence: String(fd.get("stateOfResidence")),
                lgaName: String(fd.get("lgaName")),
                residentialAddress: String(fd.get("residentialAddress")),
                cityTown: String(fd.get("cityTown")),
                phone: String(fd.get("phone")),
                whatsapp: String(fd.get("whatsapp")),
                email: String(fd.get("email")),
                preferredLanguage: String(fd.get("preferredLanguage")),
                altContactNumber: String(fd.get("altContactNumber") || "") || undefined,
                idDocumentType: String(fd.get("idDocumentType")) as "NIN" | "PASSPORT" | "DRIVERS_LICENCE" | "VOTERS_CARD",
                displayName: String(fd.get("displayName") || "") || undefined,
              });
              if (!res.ok) return;
              for (const [field, kind, label] of [
                ["photoFile", "photo", "Passport photograph"],
                ["idFile", "id", "ID document"],
              ] as const) {
                const file = fd.get(field);
                if (file instanceof File && file.size > 0) {
                  const up = new FormData();
                  up.set("file", file);
                  up.set("kind", kind);
                  const uploaded = await uploadSeekerDocument(up);
                  if (!uploaded.ok) {
                    toast.error(`${label}: ${uploaded.error}`);
                    return;
                  }
                }
              }
              toast.success("Personal information saved");
              next();
            });
          }}
        >
          <Field name="fullName" label="Full name" required defaultValue={str(profile.fullName)} />
          <Field name="displayName" label="Professional display name (optional)" defaultValue={str(profile.displayName)} />
          <Field name="dateOfBirth" label="Date of birth" type="date" defaultValue={str(profile.dateOfBirth)} />
          <Field name="gender" label="Gender (optional)" defaultValue={str(profile.gender)} />
          <Field name="nationality" label="Nationality" required defaultValue={str(profile.nationality) || "Nigerian"} />
          <Field name="stateOfResidence" label="State of residence" required defaultValue={str(profile.stateOfResidence) || "FCT"} />
          <Field name="lgaName" label="LGA" required defaultValue={str(profile.lgaName)} />
          <Field name="residentialAddress" label="Residential address" required defaultValue={str(profile.residentialAddress)} />
          <Field name="cityTown" label="City / town" required defaultValue={str(profile.cityTown)} />
          <Field name="phone" label="Phone" required defaultValue={str(profile.phone)} />
          <Field name="whatsapp" label="WhatsApp" required defaultValue={str(profile.whatsapp)} />
          <Field name="email" label="Email" type="email" required defaultValue={str(profile.email)} />
          <Field name="preferredLanguage" label="Preferred language" required defaultValue={str(profile.preferredLanguage) || "English"} />
          <Field name="altContactNumber" label="Alternative contact (optional)" defaultValue={str(profile.altContactNumber)} />
          <div className="space-y-2">
            <Label htmlFor="photoFile">Passport photograph</Label>
            <Input id="photoFile" name="photoFile" type="file" accept="image/jpeg,image/png,image/webp" />
            <p className="text-xs text-muted-foreground">
              {profile.passportPhotoUrl
                ? "A photograph is on file. Upload a new one to replace it."
                : "Recent, clear face photo (JPG, PNG or WebP). Kept private — used for identity verification."}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="idDocumentType">ID type</Label>
            <select
              id="idDocumentType"
              name="idDocumentType"
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
              defaultValue={profile.idDocumentType ?? "NIN"}
            >
              <option value="NIN">NIN</option>
              <option value="PASSPORT">International Passport</option>
              <option value="DRIVERS_LICENCE">Driver&apos;s Licence</option>
              <option value="VOTERS_CARD">Voter&apos;s Card</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="idFile">ID document upload</Label>
            <Input id="idFile" name="idFile" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" />
            <p className="text-xs text-muted-foreground">
              {profile.idDocumentUrl ? "An ID document is on file. Upload a new one to replace it. " : ""}
              ID numbers and images are never shown on your public profile.
            </p>
          </div>
        </SectionForm>
      )}

      {step === 1 && (
        <SectionForm
          pending={pending}
          onSubmit={(fd) => {
            start(async () => {
              const locations = String(fd.get("preferredLocations") || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              const types = fd.getAll("employmentTypes").map(String) as (
                | "FULL_TIME"
                | "PART_TIME"
                | "CONTRACT"
                | "TEMPORARY"
                | "FREELANCE"
                | "INTERNSHIP"
                | "APPRENTICESHIP"
                | "REMOTE"
                | "HYBRID"
                | "LIVE_IN"
                | "WEEKEND"
                | "DAILY_PAID"
              )[];
              await saveSeekerSectionB({
                preferredJobTitle: String(fd.get("preferredJobTitle")),
                primaryJobCategory: String(fd.get("primaryJobCategory")),
                secondaryJobCategory: String(fd.get("secondaryJobCategory") || "") || undefined,
                employmentTypes: types,
                preferredLocations: locations.length ? locations : ["Gwarinpa"],
                preferredStates: ["FCT"],
                expectedSalaryMin: Number(fd.get("expectedSalaryMin") || 0) || undefined,
                expectedSalaryMax: Number(fd.get("expectedSalaryMax") || 0) || undefined,
                minimumAcceptableSalary: Number(fd.get("minimumAcceptableSalary") || 0) || undefined,
                availableStartDate: String(fd.get("availableStartDate") || "") || undefined,
                willingToRelocate: fd.get("willingToRelocate") === "on",
                preferredWorkingHours: String(fd.get("preferredWorkingHours") || "") || undefined,
                preferredWorkArrangement: (String(fd.get("preferredWorkArrangement") || "ONSITE") ||
                  "ONSITE") as "ONSITE" | "REMOTE" | "HYBRID" | "LIVE_IN" | "FLEXIBLE",
                careerObjective: String(fd.get("careerObjective") || "") || undefined,
                additionalPreferences: String(fd.get("additionalPreferences") || "") || undefined,
              });
              toast.success("Preferences saved");
              next();
            });
          }}
        >
          <Field name="preferredJobTitle" label="Preferred job title" required defaultValue={str(profile.preferredJobTitle)} />
          <div className="space-y-2">
            <Label htmlFor="primaryJobCategory">Primary job category</Label>
            <select
              id="primaryJobCategory"
              name="primaryJobCategory"
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
              defaultValue={profile.primaryJobCategory ?? "driver"}
            >
              {JOB_CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Field name="secondaryJobCategory" label="Secondary category (optional)" defaultValue={str(profile.secondaryJobCategory)} />
          <div className="space-y-2">
            <Label>Employment types</Label>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {EMPLOYMENT_TYPES.map((t) => (
                <label key={t.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="employmentTypes"
                    value={t.value}
                    defaultChecked={profile.employmentTypes?.includes(t.value)}
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredLocations">Preferred Abuja areas (comma-separated)</Label>
            <Input
              id="preferredLocations"
              name="preferredLocations"
              placeholder={ABUJA_AREAS.slice(0, 5).join(", ")}
              defaultValue={profile.preferredLocations?.join(", ") ?? ""}
            />
            <p className="text-xs text-muted-foreground">Examples: {ABUJA_AREAS.join(", ")}</p>
          </div>
          <Field name="expectedSalaryMin" label="Expected salary min (₦)" type="number" defaultValue={str(profile.expectedSalaryMin)} />
          <Field name="expectedSalaryMax" label="Expected salary max (₦)" type="number" defaultValue={str(profile.expectedSalaryMax)} />
          <Field name="minimumAcceptableSalary" label="Minimum acceptable (optional)" type="number" defaultValue={str(profile.minimumAcceptableSalary)} />
          <Field name="availableStartDate" label="Available start date" type="date" defaultValue={str(profile.availableStartDate)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="willingToRelocate" defaultChecked={profile.willingToRelocate} /> Willing to relocate
          </label>
          <Field name="preferredWorkingHours" label="Preferred working hours" defaultValue={str(profile.preferredWorkingHours)} />
          <SelectField
            name="preferredWorkArrangement"
            label="Work arrangement"
            defaultValue={profile.preferredWorkArrangement ?? "ONSITE"}
            options={[
              ["ONSITE", "On-site"],
              ["REMOTE", "Remote"],
              ["HYBRID", "Hybrid"],
              ["LIVE_IN", "Live-in"],
              ["FLEXIBLE", "Flexible"],
            ]}
          />
          <div className="space-y-2">
            <Label htmlFor="careerObjective">Career objective</Label>
            <Textarea id="careerObjective" name="careerObjective" rows={3} defaultValue={str(profile.careerObjective)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="additionalPreferences">Additional preferences</Label>
            <Textarea id="additionalPreferences" name="additionalPreferences" rows={2} defaultValue={str(profile.additionalPreferences)} />
          </div>
        </SectionForm>
      )}

      {step === 2 && (
        <SectionForm
          pending={pending}
          onSubmit={(fd) => {
            start(async () => {
              await saveSeekerSectionC({
                highestQualification: String(fd.get("highestQualification")),
                institutionName: String(fd.get("institutionName") || "") || undefined,
                courseOfStudy: String(fd.get("courseOfStudy") || "") || undefined,
                yearOfGraduation: Number(fd.get("yearOfGraduation") || 0) || undefined,
                professionalQualifications: String(fd.get("professionalQualifications") || "") || undefined,
                additionalTraining: String(fd.get("additionalTraining") || "") || undefined,
                certificationsText: String(fd.get("certificationsText") || "") || undefined,
                skillsAcquired: String(fd.get("skillsAcquired") || "") || undefined,
              });
              toast.success("Education saved");
              next();
            });
          }}
        >
          <Field name="highestQualification" label="Highest qualification" required defaultValue={str(profile.highestQualification)} />
          <Field name="institutionName" label="Institution" defaultValue={str(profile.institutionName)} />
          <Field name="courseOfStudy" label="Course of study" defaultValue={str(profile.courseOfStudy)} />
          <Field name="yearOfGraduation" label="Year of graduation" type="number" defaultValue={str(profile.yearOfGraduation)} />
          <Field name="professionalQualifications" label="Professional qualifications" defaultValue={str(profile.professionalQualifications)} />
          <Field name="additionalTraining" label="Additional training" defaultValue={str(profile.additionalTraining)} />
          <Field name="certificationsText" label="Certifications" defaultValue={str(profile.certificationsText)} />
          <Field name="skillsAcquired" label="Skills acquired" defaultValue={str(profile.skillsAcquired)} />
          <EducationDocsManager docs={profile.educationDocs ?? []} />
          <p className="text-xs text-muted-foreground">
            University certificates are not required for every category (e.g. professional cleaners).
          </p>
        </SectionForm>
      )}

      {step === 3 && (
        <ExperienceStep
          key={(profile.experiences ?? []).map((e) => e.id).join(",")}
          initial={profile.experiences ?? []}
          pending={pending}
          onSave={(rows) => {
            start(async () => {
              const res = await saveSeekerExperiences(
                rows.map((e) => ({
                  id: e.id,
                  jobTitle: e.jobTitle,
                  employerName: e.employerName,
                  companyLocation: e.companyLocation || undefined,
                  startDate: e.startDate || undefined,
                  endDate: e.endDate || undefined,
                  responsibilities: e.responsibilities || undefined,
                  achievements: e.achievements || undefined,
                  reasonForLeaving: e.reasonForLeaving || undefined,
                  supervisorName: e.supervisorName || undefined,
                  supervisorContact: e.supervisorContact || undefined,
                  permissionToContact: e.permissionToContact,
                })),
              );
              if (!res.ok) return;
              toast.success(rows.length ? "Experience saved" : "Saved — no prior experience listed");
              next();
            });
          }}
        />
      )}

      {step === 4 && (
        <SectionForm
          pending={pending}
          onSubmit={(fd) => {
            start(async () => {
              await saveSeekerSectionE({
                primarySkill: String(fd.get("primarySkill")),
                additionalSkills: String(fd.get("additionalSkills") || "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
                yearsOfExperience: Number(fd.get("yearsOfExperience") || 0) || undefined,
                skillProficiency: (String(fd.get("skillProficiency") || "INTERMEDIATE") ||
                  "INTERMEDIATE") as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT",
                toolsSoftware: String(fd.get("toolsSoftware") || "") || undefined,
                professionalLicences: String(fd.get("professionalLicences") || "") || undefined,
                languagesSpoken: String(fd.get("languagesSpoken") || "English")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
                relevantTraining: String(fd.get("relevantTraining") || "") || undefined,
                portfolioUrl: String(fd.get("portfolioUrl") || "") || undefined,
              });
              toast.success("Skills saved");
              next();
            });
          }}
        >
          <Field name="primarySkill" label="Primary professional skill" required defaultValue={str(profile.primarySkill)} />
          <Field name="additionalSkills" label="Additional skills (comma-separated)" defaultValue={profile.additionalSkills?.join(", ") ?? ""} />
          <Field name="yearsOfExperience" label="Years of experience" type="number" defaultValue={str(profile.yearsOfExperience)} />
          <SelectField
            name="skillProficiency"
            label="Proficiency"
            defaultValue={profile.skillProficiency ?? "INTERMEDIATE"}
            options={[
              ["BEGINNER", "Beginner"],
              ["INTERMEDIATE", "Intermediate"],
              ["ADVANCED", "Advanced"],
              ["EXPERT", "Expert"],
            ]}
          />
          <Field name="toolsSoftware" label="Tools / software" defaultValue={str(profile.toolsSoftware)} />
          <Field name="professionalLicences" label="Professional licences" defaultValue={str(profile.professionalLicences)} />
          <Field
            name="languagesSpoken"
            label="Languages spoken"
            defaultValue={profile.languagesSpoken?.length ? profile.languagesSpoken.join(", ") : "English"}
          />
          <Field name="relevantTraining" label="Relevant training" defaultValue={str(profile.relevantTraining)} />
          <Field name="portfolioUrl" label="Portfolio URL" defaultValue={str(profile.portfolioUrl)} />
        </SectionForm>
      )}

      {step === 5 && (
        <SectionForm
          pending={pending}
          onSubmit={(fd) => {
            start(async () => {
              const file = fd.get("cvFile");
              if (file instanceof File && file.size > 0) {
                const up = new FormData();
                up.set("file", file);
                up.set("kind", "cv");
                const uploaded = await uploadSeekerDocument(up);
                if (!uploaded.ok) {
                  toast.error(`CV: ${uploaded.error}`);
                  return;
                }
              }
              await saveSeekerSectionF({
                professionalSummary: String(fd.get("professionalSummary") || "") || undefined,
                careerObjective: String(fd.get("careerObjective") || "") || undefined,
              });
              await buildCvHtmlFromProfile(profile.id);
              toast.success("CV section saved (private by default)");
              next();
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="professionalSummary">Professional summary</Label>
            <Textarea id="professionalSummary" name="professionalSummary" rows={4} defaultValue={str(profile.professionalSummary)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="careerObjective">Career objective</Label>
            <Textarea id="careerObjective" name="careerObjective" rows={2} defaultValue={str(profile.careerObjective)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cvFile">Upload CV (optional — stays private)</Label>
            <Input id="cvFile" name="cvFile" type="file" accept=".pdf,.doc,.docx" />
            {profile.cvUrl && (
              <p className="text-xs text-muted-foreground">A CV is on file. Upload a new one to replace it.</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            HomeConnect also builds a CV from your profile answers. Employers do not get automatic access.
          </p>
        </SectionForm>
      )}

      {step === 6 && (
        <div className="space-y-4">
          <SectionForm
            pending={pending}
            submitLabel={profile.guarantor ? "Save & resend invite" : "Save & send invite"}
            onSubmit={(fd) => {
              start(async () => {
                const res = await saveSeekerGuarantor({
                  fullName: String(fd.get("fullName")),
                  phone: String(fd.get("phone")),
                  whatsapp: String(fd.get("whatsapp") || "") || undefined,
                  email: String(fd.get("email") || "") || undefined,
                  residentialAddress: String(fd.get("residentialAddress") || "") || undefined,
                  occupation: String(fd.get("occupation") || "") || undefined,
                  employerName: String(fd.get("employerName") || "") || undefined,
                  relationship: String(fd.get("relationship") || "") || undefined,
                  yearsKnown: Number(fd.get("yearsKnown") || 0) || undefined,
                  consentToContact: fd.get("consentToContact") === "on",
                  declarationAccepted: fd.get("declarationAccepted") === "on",
                });
                if (!res.ok) return;
                setInvite({ link: res.inviteLink, emailSent: res.emailSent });
                toast.success(
                  res.emailSent
                    ? "Guarantor saved — invite emailed"
                    : "Guarantor saved — share the invite link below",
                );
              });
            }}
          >
            <p className="text-sm text-muted-foreground">Optional for many roles; recommended for trust-sensitive positions.</p>
            <Field name="fullName" label="Guarantor full name" required defaultValue={str(profile.guarantor?.fullName)} />
            <Field name="phone" label="Phone" required defaultValue={str(profile.guarantor?.phone)} />
            <Field name="whatsapp" label="WhatsApp" defaultValue={str(profile.guarantor?.whatsapp)} />
            <Field name="email" label="Email (we send the invite here)" type="email" defaultValue={str(profile.guarantor?.email)} />
            <Field name="residentialAddress" label="Residential address" defaultValue={str(profile.guarantor?.residentialAddress)} />
            <Field name="occupation" label="Occupation" defaultValue={str(profile.guarantor?.occupation)} />
            <Field name="employerName" label="Employer / business" defaultValue={str(profile.guarantor?.employerName)} />
            <Field name="relationship" label="Relationship" defaultValue={str(profile.guarantor?.relationship)} />
            <Field name="yearsKnown" label="Years known" type="number" defaultValue={str(profile.guarantor?.yearsKnown)} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="consentToContact" required defaultChecked={profile.guarantor?.consentToContact} /> They agreed to be contacted
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="declarationAccepted" required defaultChecked={profile.guarantor?.declarationAccepted} /> Guarantor declaration acknowledged
            </label>
          </SectionForm>
          {invite && (
            <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/40 p-5 text-sm">
              <p className="font-medium">
                Guarantor invite{profile.guarantor ? ` — ${profile.guarantor.status.toLowerCase()}` : ""}
              </p>
              <p className="text-muted-foreground">
                {invite.emailSent === true
                  ? "We emailed this link to your guarantor. You can also share it directly:"
                  : invite.emailSent === false
                    ? "We could not email the invite automatically (no email address or mail is not configured). Share this link with your guarantor:"
                    : "Share this link with your guarantor if they have not received it:"}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Input readOnly value={invite.link} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 font-mono text-xs" />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard.writeText(invite.link).then(
                      () => toast.success("Invite link copied"),
                      () => toast.error("Could not copy — select the link manually"),
                    );
                  }}
                >
                  Copy link
                </Button>
              </div>
              <Button type="button" onClick={next}>
                Continue to emergency contact
              </Button>
            </div>
          )}
          {!invite && (
            <Button type="button" variant="ghost" onClick={next}>
              Skip guarantor for now
            </Button>
          )}
        </div>
      )}

      {step === 7 && (
        <SectionForm
          pending={pending}
          onSubmit={(fd) => {
            start(async () => {
              await saveSeekerEmergency({
                emergencyFullName: String(fd.get("emergencyFullName")),
                emergencyRelationship: String(fd.get("emergencyRelationship")),
                emergencyPhone: String(fd.get("emergencyPhone")),
                emergencyAltPhone: String(fd.get("emergencyAltPhone") || "") || undefined,
              });
              toast.success("Emergency contact saved (not public)");
              next();
            });
          }}
        >
          <Field name="emergencyFullName" label="Full name" required defaultValue={str(profile.emergencyFullName)} />
          <Field name="emergencyRelationship" label="Relationship" required defaultValue={str(profile.emergencyRelationship)} />
          <Field name="emergencyPhone" label="Phone" required defaultValue={str(profile.emergencyPhone)} />
          <Field name="emergencyAltPhone" label="Alternative phone (optional)" defaultValue={str(profile.emergencyAltPhone)} />
        </SectionForm>
      )}

      {step === 8 && (
        <SectionForm
          pending={pending}
          submitLabel="Submit registration"
          onSubmit={(fd) => {
            start(async () => {
              const res = await submitSeekerRegistration({
                declarationAccepted: fd.get("declarationAccepted") === "on",
                privacyAccepted: fd.get("privacyAccepted") === "on",
                termsAccepted: fd.get("termsAccepted") === "on",
                backgroundConsent: fd.get("backgroundConsent") === "on",
              });
              if (!res.ok) {
                toast.error(res.error);
                return;
              }
              toast.success("Registration submitted for verification");
              router.push("/jobs/seekers");
              router.refresh();
            });
          }}
        >
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="declarationAccepted" required className="mt-1" />
            My information is accurate and documents are genuine.
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="privacyAccepted" required className="mt-1" />
            I understand the privacy notice and verification process.
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="termsAccepted" required className="mt-1" />
            I accept the terms of service and have permission to share third-party contacts.
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="backgroundConsent" className="mt-1" defaultChecked={profile.backgroundConsent} />
            Optional: I consent to additional background checks where relevant to the role.
          </label>
        </SectionForm>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" disabled={step === 0 || pending} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/jobs")}>
          Save & exit
        </Button>
      </div>
    </div>
  );
}

function SectionForm({
  children,
  onSubmit,
  pending,
  submitLabel = "Save & continue",
}: {
  children: React.ReactNode;
  onSubmit: (fd: FormData) => void;
  pending: boolean;
  submitLabel?: string;
}) {
  return (
    <form
      className="space-y-4 rounded-2xl border border-border/70 bg-card p-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
    >
      {children}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} defaultValue={defaultValue} />
    </div>
  );
}

function SelectField({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-md border px-3 py-2 text-sm"
      >
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}

const EDUCATION_DOC_LABELS = [
  "Degree / diploma certificate",
  "WAEC / NECO / SSCE result",
  "Professional certificate",
  "Trade / vocational certificate",
  "Transcript",
  "Other",
] as const;

function EducationDocsManager({
  docs,
}: {
  docs: { id: string; label: string; url: string; status: string }[];
}) {
  const [pending, start] = useTransition();
  const [label, setLabel] = useState<string>(EDUCATION_DOC_LABELS[0]);
  const fileRef = useRef<HTMLInputElement>(null);

  function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose a file to upload");
      return;
    }
    start(async () => {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("kind", "education");
      fd.set("label", label);
      const res = await uploadSeekerDocument(fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Document uploaded for review");
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-muted/30 p-4">
      <div>
        <p className="text-sm font-medium">Education documents (optional)</p>
        <p className="text-xs text-muted-foreground">
          Upload certificates as images or PDF. They are reviewed by HomeConnect and never shown publicly.
        </p>
      </div>
      {docs.length > 0 && (
        <ul className="space-y-2 text-sm">
          {docs.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background px-3 py-2">
              <a href={d.url} target="_blank" rel="noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">
                {d.label}
              </a>
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{d.status.toLowerCase()}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const res = await deleteSeekerEducationDoc(d.id);
                      if (!res.ok) toast.error(res.error);
                      else toast.message("Document removed");
                    })
                  }
                >
                  Remove
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="eduDocLabel">Document type</Label>
          <select
            id="eduDocLabel"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            {EDUCATION_DOC_LABELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="eduDocFile">File</Label>
          <Input ref={fileRef} id="eduDocFile" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" />
        </div>
      </div>
      <Button type="button" size="sm" variant="outline" disabled={pending} onClick={upload}>
        {pending ? "Working…" : "Upload document"}
      </Button>
    </div>
  );
}

function ExperienceStep({
  initial,
  pending,
  onSave,
}: {
  initial: SeekerExperienceSeed[];
  pending: boolean;
  onSave: (rows: SeekerExperienceSeed[]) => void;
}) {
  const [rows, setRows] = useState<SeekerExperienceSeed[]>(initial.length ? initial : [emptyExperience()]);

  function update(index: number, patch: Partial<SeekerExperienceSeed>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function submit() {
    const filled = rows.filter((r) => r.jobTitle.trim() || r.employerName.trim());
    if (filled.some((r) => !r.jobTitle.trim() || !r.employerName.trim())) {
      toast.error("Each experience needs a job title and employer.");
      return;
    }
    onSave(filled);
  }

  return (
    <SectionForm pending={pending} onSubmit={submit}>
      {rows.map((row, i) => {
        const id = `exp-${i}`;
        return (
          <fieldset key={row.id ?? id} className="space-y-3 rounded-xl border border-border/70 p-4">
            <div className="flex items-center justify-between gap-2">
              <legend className="text-sm font-semibold">Experience {i + 1}</legend>
              {rows.length > 1 && (
                <Button type="button" size="sm" variant="ghost" onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}>
                  Remove
                </Button>
              )}
            </div>
            <ControlledField id={`${id}-jobTitle`} label="Previous job title" value={row.jobTitle} onChange={(v) => update(i, { jobTitle: v })} />
            <ControlledField id={`${id}-employerName`} label="Employer / company" value={row.employerName} onChange={(v) => update(i, { employerName: v })} />
            <ControlledField id={`${id}-companyLocation`} label="Company location" value={row.companyLocation} onChange={(v) => update(i, { companyLocation: v })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <ControlledField id={`${id}-startDate`} label="Start date" type="date" value={row.startDate} onChange={(v) => update(i, { startDate: v })} />
              <ControlledField id={`${id}-endDate`} label="End date" type="date" value={row.endDate} onChange={(v) => update(i, { endDate: v })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-responsibilities`}>Responsibilities</Label>
              <Textarea id={`${id}-responsibilities`} rows={3} value={row.responsibilities} onChange={(e) => update(i, { responsibilities: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-achievements`}>Achievements</Label>
              <Textarea id={`${id}-achievements`} rows={2} value={row.achievements} onChange={(e) => update(i, { achievements: e.target.value })} />
            </div>
            <ControlledField id={`${id}-reasonForLeaving`} label="Reason for leaving (optional)" value={row.reasonForLeaving} onChange={(v) => update(i, { reasonForLeaving: v })} />
            <ControlledField id={`${id}-supervisorName`} label="Supervisor name" value={row.supervisorName} onChange={(v) => update(i, { supervisorName: v })} />
            <ControlledField id={`${id}-supervisorContact`} label="Supervisor contact" value={row.supervisorContact} onChange={(v) => update(i, { supervisorContact: v })} />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={row.permissionToContact}
                onChange={(e) => update(i, { permissionToContact: e.target.checked })}
              />{" "}
              Permission to contact previous employer
            </label>
          </fieldset>
        );
      })}
      <Button type="button" variant="outline" onClick={() => setRows((prev) => [...prev, emptyExperience()])}>
        + Add another experience
      </Button>
      <p className="text-xs text-muted-foreground">
        First job? Leave the fields blank and continue — you can add experience later.
      </p>
    </SectionForm>
  );
}

function ControlledField({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
