export const ABUJA_AREAS = [
  "Wuse",
  "Maitama",
  "Asokoro",
  "Garki",
  "Jabi",
  "Utako",
  "Wuye",
  "Gwarinpa",
  "Life Camp",
  "Jahi",
  "Kubwa",
  "Lugbe",
  "Lokogoma",
  "Apo",
  "Kuje",
  "Gwagwalada",
  "Bwari",
  "Other FCT Locations",
] as const;

export const JOB_CATEGORIES = [
  { slug: "driver", name: "Driver" },
  { slug: "cleaner", name: "Professional Cleaner" },
  { slug: "security", name: "Security" },
  { slug: "electrician", name: "Electrician" },
  { slug: "admin", name: "Administrative Assistant" },
  { slug: "chef", name: "Chef / Cook" },
  { slug: "it", name: "IT Technician" },
  { slug: "domestic", name: "Domestic Staff" },
  { slug: "other", name: "Other" },
] as const;

export const EMPLOYMENT_TYPES = [
  { value: "FULL_TIME", label: "Full-Time" },
  { value: "PART_TIME", label: "Part-Time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "TEMPORARY", label: "Temporary" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "APPRENTICESHIP", label: "Apprenticeship" },
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "LIVE_IN", label: "Live-In" },
  { value: "WEEKEND", label: "Weekend" },
  { value: "DAILY_PAID", label: "Daily-Paid" },
] as const;

/** Categories that typically do not require university certificates. */
export const LOW_EDU_DOC_CATEGORIES = new Set(["cleaner", "domestic", "driver"]);
