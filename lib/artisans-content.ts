/** Shared copy + trade list for Artisans Hub / join funnel. */

export const ARTISAN_TRADES = [
  "Electrician",
  "Plumber",
  "Carpenter",
  "Painter",
  "Tiler",
  "AC Technician",
  "Aluminium Fabricator",
  "Welder",
  "CCTV Installer",
  "POP Expert",
  "Cleaner",
  "Fumigation Expert",
] as const;

export const JOIN_BENEFITS = [
  {
    title: "More jobs",
    body: "Get matched with real customers in Abuja looking for your skills — not endless bidding wars.",
  },
  {
    title: "Verified & trusted",
    body: "Build trust with a HomeConnect verification badge after KYC and skill checks.",
  },
  {
    title: "Fair pay",
    body: "Agree your rate up front. Escrow holds payment so you get paid securely and on time.",
  },
  {
    title: "Build your reputation",
    body: "Collect reviews, earn skill badges, and grow a professional profile customers can trust.",
  },
  {
    title: "Easy to use",
    body: "Job alerts, in-app chat, and simple job management — all in one place.",
  },
  {
    title: "Grow your business",
    body: "More visibility across HomeConnect means more clients and repeat work.",
  },
] as const;

export const HIRE_BENEFITS = [
  {
    title: "Verified professionals",
    body: "Every listed artisan is KYC-checked with a clear trade profile and skill badge.",
  },
  {
    title: "Escrow-backed booking",
    body: "Pay with confidence — funds release when the job is done right.",
  },
  {
    title: "Chat & emergency help",
    body: "Message pros directly and request urgent fixes when something breaks at home.",
  },
] as const;
