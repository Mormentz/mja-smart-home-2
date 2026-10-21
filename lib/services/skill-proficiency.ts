import type { SkillProficiency } from "@prisma/client";

export const SKILL_PROFICIENCY_LEVELS = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT",
] as const satisfies readonly SkillProficiency[];

export type SkillProficiencyLevel = (typeof SKILL_PROFICIENCY_LEVELS)[number];

export const SKILL_PROFICIENCY_LABELS: Record<SkillProficiencyLevel, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  EXPERT: "Expert",
};

export function isSkillProficiency(value: string): value is SkillProficiencyLevel {
  return (SKILL_PROFICIENCY_LEVELS as readonly string[]).includes(value);
}

export function skillProficiencyLabel(level: string) {
  if (isSkillProficiency(level)) return SKILL_PROFICIENCY_LABELS[level];
  return level;
}
