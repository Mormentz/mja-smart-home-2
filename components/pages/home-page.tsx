"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Compass, Heart, KeyRound, MapPin, Quote, Search, Sparkles, ShieldCheck, Users, Wrench } from "lucide-react";
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
import { HIRE_BENEFITS } from "@/lib/artisans-content";
import artisansHero from "@/assets/artisans/artisans-hero-group.jpg";
import artisansAtWork from "@/assets/artisans/artisans-at-work.jpg";
import artisansTeamOutdoors from "@/assets/artisans/artisans-team-outdoors.jpg";
import verifiedArtisan from "@/assets/artisans/artisans-verified-badge-scene.jpg";
import electrician from "@/assets/artisans/artisan-electrician.jpg";
import plumber from "@/assets/artisans/artisan-plumber.jpg";
import painter from "@/assets/artisans/artisan-painter.jpg";
import acTech from "@/assets/artisans/artisan-ac-tech.jpg";
import carpenter from "@/assets/artisans/artisan-carpenter.jpg";
import tiler from "@/assets/artisans/artisan-tiler.jpg";
import cleaner from "@/assets/artisans/artisan-cleaner.jpg";
import welder from "@/assets/artisans/artisan-welder.jpg";
import cctv from "@/assets/artisans/artisan-cctv.jpg";
import detailHands from "@/assets/artisans/artisan-detail-hands.jpg";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Hero />
      <Stats />
      <ArtisansPillar />
      <TradeMosaic />
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
                <Wrench size={14} className="text-success" />
                Artisans Hub live in Abuja
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="mt-6 font-display font-semibold text-[42px] leading-[1.05] md:text-6xl lg:text-7xl text-balance"
              >
                Find a home. <br className="hidden md:block" />
                Hire the <span className="text-success">pros</span> who <br className="hidden md:block" />
                keep it running.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.25 }}
                className="mt-6 max-w-lg text-ink-foreground/70 text-lg"
              >
                HomeConnect is homes plus verified artisans — electricians, plumbers, painters, AC techs
                and more — with escrow booking, chat, and neighborhood intel in one place.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-10 flex flex-wrap gap-3"
              >
                <Link
                  href="/artisans"
                  className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-success text-ink font-semibold hover:brightness-105 transition shadow-soft"
                >
                  Hire artisans
                  <ArrowUpRight size={18} className="group-hover:rotate-45 transition-transform" />
                </Link>
                <Link
                  href="/artisans/join"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-ink-foreground/20 hover:bg-ink-foreground/5 transition"
                >
                  Become an artisan
                </Link>
                <Link
                  href="/properties"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-ink-foreground/20 hover:bg-ink-foreground/5 transition"
                >
                  Browse homes
                </Link>
              </motion.div>

              {/* dot grid */}
              <div className="mt-16 w-40 h-16 bg-grid-dots opacity-70 hidden md:block" />
            </div>

            {/* Floating images — artisan-led */}
            <div className="lg:col-span-5 relative min-h-[240px] sm:min-h-[320px] lg:min-h-0 lg:h-full">
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-0 right-0 w-[78%] aspect-[4/5] rounded-3xl overflow-hidden shadow-float"
              >
                <img src={imageSrc(artisansHero)} alt="Verified HomeConnect artisans" className="w-full h-full object-cover" width={1200} height={1400} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="absolute bottom-0 left-0 w-[62%] aspect-[5/4] rounded-3xl overflow-hidden shadow-float border-4 border-ink"
              >
                <img src={imageSrc(electrician)} alt="Electrician at work" className="w-full h-full object-cover" width={1000} height={800} loading="lazy" />
              </motion.div>

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
                  <p className="text-xs text-muted-foreground">Verified professionals</p>
                  <p className="font-semibold">Artisans Hub · Abuja</p>
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
    { n: "2,800+", l: "Trusted artisans" },
    { n: "12+", l: "Trades covered" },
    { n: "Abuja", l: "Launch market" },
    { n: "Escrow", l: "Secure job pay" },
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
        <img
          src={imageSrc(verifiedArtisan)}
          alt="Verified HomeConnect artisan"
          className="w-full h-full object-cover"
          loading="lazy"
          width={1400}
          height={1000}
        />
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

/* --------------------------- ARTISANS PILLAR ---------------------------- */
function ArtisansPillar() {
  return (
    <section className="mt-16 md:mt-24">
      <div className="relative overflow-hidden bg-ink text-ink-foreground">
        <img
          src={imageSrc(artisansTeamOutdoors)}
          alt="HomeConnect artisans on a job site"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
          width={1600}
          height={900}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/88 to-ink/50" />
        <div className="relative container-page grid gap-10 py-16 md:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-ink-foreground/65">
              <Wrench size={14} /> Artisans Hub
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold text-balance md:text-5xl">
              Abuja&apos;s trusted network of{" "}
              <span className="text-success">verified professionals</span>.
            </h2>
            <p className="mt-5 max-w-lg text-lg text-ink-foreground/75">
              Book electricians, plumbers, painters, carpenters, AC techs and more with escrow and
              in-app chat — or join as a pro and get matched with real customers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/artisans"
                className="group inline-flex items-center gap-2 rounded-full bg-success px-6 py-3.5 font-semibold text-ink transition hover:brightness-105"
              >
                Browse Artisans Hub
                <ArrowUpRight size={18} className="transition-transform group-hover:rotate-45" />
              </Link>
              <Link
                href="/artisans/join"
                className="inline-flex items-center gap-2 rounded-full border border-ink-foreground/25 px-6 py-3.5 transition hover:bg-ink-foreground/5"
              >
                Register as an artisan
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {HIRE_BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-ink-foreground/15 bg-ink-foreground/5 p-5 backdrop-blur-sm"
              >
                <h3 className="font-display text-base font-semibold">{b.title}</h3>
                <p className="mt-2 text-sm text-ink-foreground/70">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- TRADE MOSAIC ------------------------------ */
function TradeMosaic() {
  const primaryLinks = [
    { label: "Electrical", slug: "electrical" },
    { label: "Plumbing", slug: "plumbing" },
    { label: "AC", slug: "ac-refrigeration" },
    { label: "Solar", slug: "solar" },
    { label: "Generator", slug: "generator" },
    { label: "Carpentry", slug: "carpentry" },
    { label: "Painting", slug: "painting" },
    { label: "Tiling", slug: "tiling" },
    { label: "POP", slug: "pop-ceiling" },
    { label: "Welding", slug: "welding" },
    { label: "Aluminium", slug: "aluminium-glass" },
    { label: "Cleaning", slug: "cleaning" },
  ];

  const tiles = [
    { label: "Electrical", slug: "electrical", img: electrician },
    { label: "Plumbing", slug: "plumbing", img: plumber },
    { label: "AC & Cooling", slug: "ac-refrigeration", img: acTech },
    { label: "Painting", slug: "painting", img: painter },
    { label: "Carpentry", slug: "carpentry", img: carpenter },
    { label: "Tiling", slug: "tiling", img: tiler },
    { label: "Welding", slug: "welding", img: welder },
    { label: "Cleaning", slug: "cleaning", img: cleaner },
    { label: "CCTV", slug: "cctv-security", img: cctv },
  ];

  return (
    <section className="container-page mt-16 md:mt-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <p className="text-sm uppercase tracking-[0.2em] text-primary/70">Who you can hire</p>
          <h2 className="mt-2 font-display text-3xl font-semibold md:text-4xl">
            Every trade your home needs.
          </h2>
          <p className="mt-3 text-muted-foreground">
            12 primary service groups on the homepage — filter the full taxonomy in Artisans Hub.
          </p>
        </div>
        <Link
          href="/signup/artisan"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Are you a pro? Join the hub →
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {primaryLinks.map((c) => (
          <Link
            key={c.slug}
            href={`/artisans?category=${c.slug}`}
            className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-ink hover:text-ink-foreground"
          >
            {c.label}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {tiles.map((t, i) => (
          <Link
            key={t.slug}
            href={`/artisans?category=${t.slug}`}
            className={`relative overflow-hidden rounded-2xl ${
              i === 0 ? "col-span-2 aspect-[2/1] md:aspect-[21/9]" : "aspect-[4/3]"
            }`}
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="absolute inset-0"
            >
              <img
                src={imageSrc(t.img)}
                alt={t.label}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
              <p className="absolute bottom-3 left-3 font-display text-sm font-semibold text-white md:text-base">
                {t.label}
              </p>
            </motion.div>
          </Link>
        ))}
        <Link
          href="/artisans"
          className="relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground transition hover:brightness-110"
        >
          <img
            src={imageSrc(detailHands)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-25"
            aria-hidden
          />
          <p className="relative font-display text-lg font-semibold">See all trades</p>
          <p className="relative mt-1 text-sm text-primary-foreground/80">
            25 categories · escrow booking
          </p>
        </Link>
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
        className="grid items-center gap-8 overflow-hidden rounded-4xl bg-secondary/40 lg:grid-cols-2"
      >
        <div className="p-10 md:p-16">
          <p className="text-sm uppercase tracking-[0.2em] text-primary/70">Ready when you are</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-balance md:text-4xl">
            Homes to find. Pros to hire. One platform.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Browse verified listings, hire artisans with escrow, or join Artisans Hub if you&apos;re a
            professional in Abuja.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/artisans"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 font-semibold text-primary-foreground transition hover:brightness-110"
            >
              Hire artisans
              <ArrowUpRight size={18} className="transition-transform group-hover:rotate-45" />
            </Link>
            <Link
              href="/artisans/join"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3.5 font-semibold transition hover:bg-muted"
            >
              Become an artisan
            </Link>
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3.5 font-semibold transition hover:bg-muted"
            >
              Browse homes
            </Link>
          </div>
        </div>
        <div className="min-h-[240px] lg:min-h-full">
          <img
            src={imageSrc(carpenter)}
            alt="Carpenter at work"
            className="h-full min-h-[240px] w-full object-cover"
            loading="lazy"
            width={1400}
            height={1050}
          />
        </div>
      </motion.div>
    </section>
  );
}

/* ----------------------------- ECOSYSTEM -------------------------------- */
function Ecosystem() {
  const items = [
    { icon: Search, title: "Smart AI Search", body: "Describe your dream home in plain words. Our AI matches it in seconds.", href: "/properties" },
    { icon: Users, title: "Trusted Artisans", body: "Vetted plumbers, electricians and cleaners — booked in one tap.", href: "/artisans" },
    { icon: MapPin, title: "Neighborhood Index", body: "Safety, schools, commute and vibe — scored for every block.", href: "/properties" },
    { icon: ShieldCheck, title: "Verified Landlords", body: "Every listing is verified. No ghost apartments, no surprises.", href: "/properties" },
  ];
  return (
    <section className="container-page mt-24 md:mt-32">
      <div className="max-w-2xl">
        <p className="text-sm uppercase tracking-[0.2em] text-primary/70">The Ecosystem</p>
        <h2 className="mt-3 font-display text-4xl font-semibold text-balance md:text-5xl">
          One platform. Every part of moving in.
        </h2>
        <p className="mt-5 text-lg text-muted-foreground">
          HomeConnect isn&apos;t just listings. It&apos;s the whole journey — search, tour, sign, move, live
          — with artisans on call when something needs fixing.
        </p>
        <Link
          href="/artisans"
          className="group mt-6 inline-flex items-center gap-2 font-semibold text-primary transition-all hover:gap-3"
        >
          Explore Artisans Hub{" "}
          <ArrowUpRight size={18} className="transition-transform group-hover:rotate-45" />
        </Link>
      </div>

      <div className="mt-10 grid min-w-0 gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="min-w-0 lg:col-span-5">
          <div className="relative aspect-[4/3] w-full max-h-[420px] overflow-hidden rounded-3xl shadow-soft lg:h-full lg:max-h-none lg:min-h-[320px] lg:aspect-auto">
            <img
              src={imageSrc(artisansAtWork)}
              alt="Artisans at work"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              width={1400}
              height={900}
            />
          </div>
        </div>

        <div className="min-w-0 grid gap-4 sm:grid-cols-2 lg:col-span-7">
          {items.map((it, i) => (
            <Link key={it.title} href={it.href} className="block min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group h-full rounded-3xl bg-muted p-8 transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-background text-primary transition group-hover:bg-success group-hover:text-ink">
                  <it.icon size={20} />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold">{it.title}</h3>
                <p className="mt-2 text-muted-foreground transition-colors group-hover:text-primary-foreground/80">
                  {it.body}
                </p>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------- TESTIMONIALS ------------------------------- */
const testimonials = [
  {
    quote: "Booked a verified electrician the day we got the keys. Escrow made paying feel safe.",
    name: "Chioma A.",
    detail: "Homeowner · Abuja",
    initials: "CA",
  },
  {
    quote: "As a plumber on Artisans Hub I get real jobs — not endless bidding. Clients already trust the badge.",
    name: "Ibrahim S.",
    detail: "Artisan · Abuja",
    initials: "IS",
  },
  {
    quote: "We found our apartment, then hired a painter and AC tech without leaving HomeConnect.",
    name: "Amaka O.",
    detail: "Renter · Abuja",
    initials: "AO",
  },
  {
    quote: "The neighborhood scores alone saved us weeks of research. We knew exactly what we were getting into.",
    name: "Daniel K.",
    detail: "Renter · Abuja",
    initials: "DK",
  },
  {
    quote: "Skill badges and reviews helped me grow from weekend jobs to a full book of clients.",
    name: "Blessing E.",
    detail: "Artisan · Painter",
    initials: "BE",
  },
  {
    quote: "Finally a platform that treats moving — and the pros who finish the home — as one journey.",
    name: "Tunde M.",
    detail: "Buyer · Abuja",
    initials: "TM",
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
