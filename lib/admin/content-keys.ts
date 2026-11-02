export type SiteContentField = {
  key: string;
  label: string;
  description: string;
  multiline?: boolean;
  placeholder?: string;
  maxLength: number;
  defaultValue: string;
};

export const SITE_CONTENT_FIELDS: SiteContentField[] = [
  {
    key: "about_blurb",
    label: "About blurb",
    description: "Short company description used on the About section.",
    multiline: true,
    maxLength: 1000,
    defaultValue:
      "HomeConnect is the housing platform for verified homes, secure escrow rent, and trusted artisans.",
  },
  {
    key: "hero_headline",
    label: "Homepage headline",
    description: "Main headline on the public homepage hero.",
    maxLength: 140,
    defaultValue: "Find a home you can trust",
  },
  {
    key: "hero_subheadline",
    label: "Homepage sub-headline",
    description: "Supporting line under the hero headline.",
    multiline: true,
    maxLength: 300,
    defaultValue: "Verified listings, escrow-protected rent, and vetted artisans in one place.",
  },
  {
    key: "announcement_banner",
    label: "Announcement banner",
    description: "Optional site-wide notice. Leave empty to hide.",
    maxLength: 240,
    placeholder: "e.g. Scheduled maintenance on Sunday 02:00–04:00 WAT",
    defaultValue: "",
  },
  {
    key: "footer_tagline",
    label: "Footer tagline",
    description: "Short line shown in the site footer.",
    maxLength: 160,
    defaultValue: "Verified homes. Trusted people.",
  },
  {
    key: "support_email",
    label: "Support email",
    description: "Public support contact address.",
    maxLength: 120,
    placeholder: "support@homeconnect.ng",
    defaultValue: "",
  },
  {
    key: "support_phone",
    label: "Support phone",
    description: "Public support phone / WhatsApp number.",
    maxLength: 40,
    placeholder: "+234…",
    defaultValue: "",
  },
  {
    key: "escrow_notice",
    label: "Escrow notice",
    description: "Explainer text shown near escrow payments and lease funding.",
    multiline: true,
    maxLength: 600,
    defaultValue:
      "Rent is held in escrow until you confirm move-in. Never pay outside HomeConnect.",
  },
];
