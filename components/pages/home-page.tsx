"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Compass, Heart, KeyRound, MapPin, Quote, Search, Sparkles, ShieldCheck, Users } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { imageSrc } from "@/lib/utils";
import heroLiving from "@/assets/hero-living.jpg";
import heroBedroom from "@/assets/hero-bedroom.jpg";
import aboutTeam from "@/assets/about-team.jpg";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Hero />
      <Stats />
      <Mission />
      <HowItWorks />
      <Ecosystem />
      <Values />
      <Testimonial />
      <ExploreCTA />
      <Footer />
    </div>
  );
}

/* ------------------------------- HERO ---------------------------------- */
function Hero() {
  return (
    <section className="relative h-screen w-screen overflow-hidden bg-ink text-ink-foreground">
      <Header variant="dark" />

      {/* decorative arc */}
      <svg className="absolute right-0 bottom-0 w-[85%] h-full pointer-events-none opacity-40" viewBox="0 0 800 800" fill="none" aria-hidden>
        <circle cx="820" cy="200" r="620" stroke="currentColor" className="text-ink-foreground/10" strokeWidth="1" />
        <circle cx="820" cy="200" r="480" stroke="currentColor" className="text-ink-foreground/5" strokeWidth="1" />
      </svg>

      <div className="relative flex h-full flex-col">
        <div className="relative grid min-h-0 flex-1 lg:grid-cols-12 gap-6 pt-32 md:pt-40 pb-6 md:pb-10 px-6 md:px-14 lg:items-center lg:gap-4">
            <div className="lg:col-span-5 lg:col-start-2 flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-full border border-ink-foreground/15 text-sm text-ink-foreground/80"
              >
                <Sparkles size={14} className="text-success" />
                Smart AI search now live
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="mt-6 font-display font-semibold text-[42px] leading-[1.05] md:text-6xl lg:text-7xl text-balance"
              >
                Imagine a home <br className="hidden md:block" />
                that <span className="text-success">finds you</span> — <br className="hidden md:block" />
                before you find it.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.25 }}
                className="mt-6 max-w-lg text-ink-foreground/70 text-lg"
              >
                HomeConnect is the housing platform for the way you actually live. Discover verified listings,
                trusted artisans and smart neighborhoods — all in one place.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-10 flex flex-wrap gap-3"
              >
                <Link
                  href="/about"
                  className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-success text-ink font-semibold hover:brightness-105 transition shadow-soft"
                >
                  How it works
                  <ArrowUpRight size={18} className="group-hover:rotate-45 transition-transform" />
                </Link>
                <Link
                  href="/properties"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-ink-foreground/20 hover:bg-ink-foreground/5 transition"
                >
                  Browse Properties
                </Link>
              </motion.div>

              {/* dot grid */}
              <div className="mt-16 w-40 h-16 bg-grid-dots opacity-70 hidden md:block" />
            </div>

            {/* Floating images */}
            <div className="lg:col-span-5 relative min-h-[240px] sm:min-h-[320px] lg:min-h-0 lg:h-full">
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-0 right-0 w-[78%] aspect-[4/5] rounded-3xl overflow-hidden shadow-float"
              >
                <img src={imageSrc(heroLiving)} alt="Modern living room" className="w-full h-full object-cover" width={1200} height={1400} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="absolute bottom-0 left-0 w-[62%] aspect-[5/4] rounded-3xl overflow-hidden shadow-float border-4 border-ink"
              >
                <img src={imageSrc(heroBedroom)} alt="Bedroom" className="w-full h-full object-cover" width={1000} height={800} loading="lazy" />
              </motion.div>

              {/* floating info card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.6 }}
                className="absolute -bottom-2 right-4 md:right-10 bg-cream text-ink rounded-2xl p-4 shadow-elegant flex items-center gap-3 max-w-[240px]"
              >
                <div className="grid place-items-center w-11 h-11 rounded-xl bg-success/20 text-success">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Verified listings</p>
                  <p className="font-semibold">12,400+ homes</p>
                </div>
              </motion.div>
            </div>
          </div>

        {/* Search bar floating below */}
        <div className="relative shrink-0 px-6 md:px-14 pb-6 md:pb-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mx-auto w-full max-w-3xl bg-background text-foreground rounded-2xl p-2 shadow-elegant grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_auto] gap-1.5"
          >
            <SearchField label="Location" placeholder="City, neighborhood" />
            <SearchField label="Type" placeholder="For Sale / Rent" />
            <SearchField label="Budget" placeholder="Any" />
            <button className="grid place-items-center rounded-xl bg-primary text-primary-foreground px-4 py-2.5 hover:brightness-110 transition">
              <Search size={16} />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function SearchField({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="px-3 py-2 rounded-xl hover:bg-muted transition cursor-text block">
      <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <input className="mt-0.5 w-full bg-transparent outline-none text-sm font-medium placeholder:text-muted-foreground/60" placeholder={placeholder} />
    </label>
  );
}

/* ------------------------------- STATS ---------------------------------- */
function Stats() {
  const stats = [
    { n: "12k+", l: "Verified listings" },
    { n: "48", l: "Cities covered" },
    { n: "2,800", l: "Trusted artisans" },
    { n: "98%", l: "Happy movers" },
  ];
  return (
    <section className="container-page mt-20 md:mt-28">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.l}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="rounded-3xl bg-muted p-6 md:p-8"
          >
            <p className="font-display text-4xl md:text-5xl font-semibold text-primary">{s.n}</p>
            <p className="mt-2 text-muted-foreground">{s.l}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------- MISSION -------------------------------- */
function Mission() {
  return (
    <section className="container-page mt-20 md:mt-28 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="aspect-[5/4] rounded-3xl overflow-hidden shadow-elegant order-2 lg:order-1"
      >
        <img src={imageSrc(aboutTeam)} alt="The HomeConnect team" className="w-full h-full object-cover" loading="lazy" width={1400} height={1000} />
      </motion.div>
      <div className="order-1 lg:order-2">
        <p className="text-sm uppercase tracking-[0.2em] text-primary/70">Who we are</p>
        <h2 className="mt-3 font-display text-4xl md:text-5xl font-semibold text-balance">
          Housing, rebuilt around <span className="text-primary">people.</span>
        </h2>
        <p className="mt-5 text-muted-foreground text-lg">
          HomeConnect started with a simple frustration: moving into a new home shouldn't feel like a second job.
          We built one platform for the whole journey — finding, verifying, moving, maintaining, and living.
        </p>
        <p className="mt-4 text-muted-foreground text-lg">
          We're not another listings site. We're the connective tissue between renters, buyers, landlords,
          agents, and the artisans who keep homes running.
        </p>
        <Link
          href="/about"
          className="group mt-8 inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
        >
          Read our story <ArrowUpRight size={18} className="group-hover:rotate-45 transition-transform" />
        </Link>
      </div>
    </section>
  );
}

/* ----------------------------- HOW IT WORKS ----------------------------- */
function HowItWorks() {
  const steps = [
    {
      icon: Search,
      step: "01",
      title: "Tell us what you're looking for",
      body: "Describe your ideal home in plain language — neighborhood vibe, commute, budget, must-haves. Our AI does the heavy lifting.",
    },
    {
      icon: ShieldCheck,
      step: "02",
      title: "Explore verified options",
      body: "Every listing is checked. Every landlord is vetted. Neighborhood scores, school ratings, and commute times — all in one view.",
    },
    {
      icon: KeyRound,
      step: "03",
      title: "Move in with confidence",
      body: "Book tours, sign leases, hire movers, and find trusted artisans — without leaving the platform.",
    },
  ];

  return (
    <section className="container-page mt-24 md:mt-32">
      <div className="max-w-2xl">
        <p className="text-sm uppercase tracking-[0.2em] text-primary/70">How it works</p>
        <h2 className="mt-3 font-display text-4xl md:text-5xl font-semibold text-balance">
          From search to keys in three steps.
        </h2>
        <p className="mt-5 text-muted-foreground text-lg">
          No more juggling five apps, three spreadsheets, and a group chat with your roommates.
        </p>
      </div>

      <div className="mt-12 grid md:grid-cols-3 gap-6">
        {steps.map((s, i) => (
          <motion.div
            key={s.step}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="relative rounded-3xl border border-border bg-card p-8 shadow-soft"
          >
            <span className="font-display text-5xl font-semibold text-primary/15">{s.step}</span>
            <div className="mt-6 grid place-items-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground">
              <s.icon size={20} />
            </div>
            <h3 className="mt-5 font-display text-xl font-semibold">{s.title}</h3>
            <p className="mt-2 text-muted-foreground">{s.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------- VALUES --------------------------------- */
function Values() {
  const values = [
    { icon: Heart, title: "Human first", body: "Real people, real homes, real relationships. Technology serves them, not the other way around." },
    { icon: Sparkles, title: "Radical clarity", body: "No hidden fees, no ghost listings, no fine print. Every price is the real price." },
    { icon: Users, title: "Community", body: "Renters, landlords and artisans all win — or we haven't built it right." },
    { icon: Compass, title: "Local depth", body: "We go beyond addresses. We know the block, the schools, the coffee spot on the corner." },
  ];

  return (
    <section className="container-page mt-24 md:mt-32">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-sm uppercase tracking-[0.2em] text-primary/70">What we believe</p>
        <h2 className="mt-3 font-display text-4xl md:text-5xl font-semibold text-balance">
          Principles that guide everything we build.
        </h2>
      </div>

      <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {values.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="rounded-3xl p-8 bg-muted"
          >
            <div className="grid place-items-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground">
              <v.icon size={20} />
            </div>
            <h3 className="mt-5 font-display text-xl font-semibold">{v.title}</h3>
            <p className="mt-2 text-muted-foreground">{v.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------- EXPLORE CTA ------------------------------ */
function ExploreCTA() {
  return (
    <section className="container-page mt-24 md:mt-32">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="rounded-4xl bg-secondary/40 p-10 md:p-16 grid lg:grid-cols-2 gap-8 items-center"
      >
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-primary/70">Ready when you are</p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-semibold text-balance">
            Thousands of verified homes are waiting — but first, get to know us.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            When you're ready to browse, every listing comes with neighborhood intel, verified landlords,
            and the full HomeConnect ecosystem behind it.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          <Link
            href="/about"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-border hover:bg-muted transition font-semibold"
          >
            Learn more about us
          </Link>
          <Link
            href="/properties"
            className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold hover:brightness-110 transition"
          >
            Browse properties
            <ArrowUpRight size={18} className="group-hover:rotate-45 transition-transform" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

/* ----------------------------- ECOSYSTEM -------------------------------- */
function Ecosystem() {
  const items = [
    { icon: Search, title: "Smart AI Search", body: "Describe your dream home in plain words. Our AI matches it in seconds." },
    { icon: Users, title: "Trusted Artisans", body: "Vetted plumbers, electricians and cleaners — booked in one tap." },
    { icon: MapPin, title: "Neighborhood Index", body: "Safety, schools, commute and vibe — scored for every block." },
    { icon: ShieldCheck, title: "Verified Landlords", body: "Every listing is verified. No ghost apartments, no surprises." },
  ];
  return (
    <section className="container-page mt-24 md:mt-32">
      <div className="grid lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <p className="text-sm uppercase tracking-[0.2em] text-primary/70">The Ecosystem</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-semibold text-balance">
            One platform. Every part of moving in.
          </h2>
          <p className="mt-5 text-muted-foreground text-lg max-w-md">
            HomeConnect isn't just listings. It's the whole journey — search, tour, sign, move, live.
          </p>
          <Link
            href="/contact"
            className="group mt-6 inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
          >
            Talk to our team <ArrowUpRight size={18} className="group-hover:rotate-45 transition-transform" />
          </Link>
          <div className="mt-8 aspect-[5/4] rounded-3xl overflow-hidden shadow-soft">
            <img src={imageSrc(aboutTeam)} alt="Team" className="w-full h-full object-cover" loading="lazy" width={1400} height={1000} />
          </div>
        </div>

        <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-3xl p-8 bg-muted hover:bg-primary hover:text-primary-foreground transition-colors group"
            >
              <div className="grid place-items-center w-12 h-12 rounded-2xl bg-background text-primary group-hover:bg-success group-hover:text-ink transition">
                <it.icon size={20} />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold">{it.title}</h3>
              <p className="mt-2 text-muted-foreground group-hover:text-primary-foreground/80 transition-colors">{it.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------- TESTIMONIALS ------------------------------- */
const testimonials = [
  {
    quote: "We found our apartment, booked a mover and signed the lease — all inside HomeConnect.",
    name: "Amaka O.",
    detail: "Moved in April 2026 · Lagos",
    initials: "AO",
  },
  {
    quote: "The neighborhood scores alone saved us weeks of research. We knew exactly what we were getting into.",
    name: "Daniel K.",
    detail: "Renter · Nairobi",
    initials: "DK",
  },
  {
    quote: "As a landlord, verified profiles mean fewer no-shows and better tenants. It's changed how I list.",
    name: "Priya M.",
    detail: "Landlord · Mumbai",
    initials: "PM",
  },
  {
    quote: "Booked an electrician through the app the day we moved in. That alone was worth it.",
    name: "James T.",
    detail: "Buyer · Austin",
    initials: "JT",
  },
  {
    quote: "I described my dream flat in one sentence and had three great matches before lunch.",
    name: "Sofia R.",
    detail: "Renter · Barcelona",
    initials: "SR",
  },
  {
    quote: "Finally, a housing platform that treats moving like a real life event — not just a transaction.",
    name: "Marcus L.",
    detail: "Moved in March 2026 · London",
    initials: "ML",
  },
] as const;

function Testimonial() {
  return (
    <section className="mt-24 md:mt-32">
      <Carousel
        opts={{ align: "start", dragFree: true }}
        className="w-full"
      >
        <div className="container-page flex items-end justify-between gap-6 mb-8">
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.2em] text-primary/70">Stories</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl font-semibold text-balance">
              Real people, real moves.
            </h2>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <CarouselPrevious className="static translate-y-0 left-auto top-auto h-9 w-9 rounded-full" />
            <CarouselNext className="static translate-y-0 right-auto top-auto h-9 w-9 rounded-full" />
          </div>
        </div>

        <div className="container-page">
          <CarouselContent className="-ml-3 md:-ml-4">
            {testimonials.map((t, i) => (
              <CarouselItem
                key={t.name}
                className="pl-3 md:pl-4 basis-[88%] sm:basis-[62%] md:basis-[48%] lg:basis-[34%] xl:basis-[30%]"
              >
                <motion.figure
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="h-full rounded-2xl border border-border bg-card p-5 md:p-6 shadow-soft flex flex-col"
                >
                  <Quote size={18} className="text-primary/50 shrink-0" aria-hidden />
                  <blockquote className="mt-3 text-sm md:text-base text-foreground/90 leading-relaxed flex-1">
                    "{t.quote}"
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 pt-4 border-t border-border/60">
                    <span className="grid place-items-center w-9 h-9 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                      {t.initials}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.detail}</p>
                    </div>
                  </figcaption>
                </motion.figure>
              </CarouselItem>
            ))}
          </CarouselContent>
        </div>

        <p className="container-page mt-4 text-xs text-muted-foreground sm:hidden">
          Swipe to read more stories
        </p>
      </Carousel>
    </section>
  );
}
