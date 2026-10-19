"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Compass, Heart, Sparkles, Users } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { imageSrc } from "@/lib/utils";
import { JOIN_BENEFITS } from "@/lib/artisans-content";
import team from "@/assets/about-team.jpg";
import living from "@/assets/hero-living.jpg";
import artisansAtWork from "@/assets/artisans/artisans-at-work.jpg";
import verifiedScene from "@/assets/artisans/artisans-verified-badge-scene.jpg";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="container-page pt-4">
        <div className="relative overflow-hidden rounded-4xl bg-ink text-ink-foreground pt-40 md:pt-44 pb-20 md:pb-28 px-6 md:px-14">
          <Header variant="dark" />
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-sm uppercase tracking-[0.2em] text-ink-foreground/60">Our Story</motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-4 font-display text-5xl md:text-7xl font-semibold text-balance max-w-4xl"
          >
            Housing, rebuilt around <span className="text-success">people.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="mt-6 max-w-2xl text-ink-foreground/70 text-lg">
            We started HomeConnect because moving into a new home shouldn't feel like a second job. So we built one platform for
            the whole journey — finding, verifying, moving, maintaining, living.
          </motion.p>
        </div>
      </section>

      {/* Mission */}
      <section className="container-page mt-20 md:mt-28 grid lg:grid-cols-2 gap-10 items-center">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="aspect-[5/4] rounded-3xl overflow-hidden shadow-elegant">
          <img src={imageSrc(living)} alt="Modern living space" className="w-full h-full object-cover" width={1200} height={1400} loading="lazy" />
        </motion.div>
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-primary/70">Mission</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-semibold text-balance">
            Every home, verified. Every artisan, trusted. Every neighborhood, understood.
          </h2>
          <p className="mt-5 text-muted-foreground text-lg">
            HomeConnect connects renters, buyers, landlords, agents and artisans on a single ecosystem —
            with AI-powered search, neighborhood intelligence, and a marketplace of vetted professionals.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="container-page mt-24 md:mt-32">
        <p className="text-sm uppercase tracking-[0.2em] text-primary/70">Values</p>
        <h2 className="mt-3 font-display text-4xl md:text-5xl font-semibold">What we care about.</h2>

        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Heart, t: "Human first", b: "Real people, real homes, real relationships. Technology serves them, not the other way around." },
            { icon: Sparkles, t: "Radical clarity", b: "No hidden fees, no ghost listings, no fine print. Every price is the real price." },
            { icon: Users, t: "Community", b: "Renters, landlords and artisans all win — or we haven't built it right." },
            { icon: Compass, t: "Local depth", b: "We go beyond addresses. We know the block, the schools, the coffee spot on the corner." },
          ].map((v, i) => (
            <motion.div
              key={v.t}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-3xl p-8 bg-muted"
            >
              <div className="grid place-items-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground">
                <v.icon size={20} />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold">{v.t}</h3>
              <p className="mt-2 text-muted-foreground">{v.b}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Artisans Hub story */}
      <section className="container-page mt-24 md:mt-32">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-primary/70">Artisans Hub</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-balance md:text-5xl">
              Homes need people who fix, finish, and care for them.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              Moving in is only the beginning. HomeConnect Artisans Hub connects households with
              verified electricians, plumbers, painters, AC technicians, and more — starting in{" "}
              <strong className="font-semibold text-foreground">Abuja</strong>. Pros get fair pay via
              escrow, skill badges, and real customer demand.
            </p>
            <ul className="mt-6 space-y-3 text-muted-foreground">
              {JOIN_BENEFITS.slice(0, 3).map((b) => (
                <li key={b.title}>
                  <span className="font-semibold text-foreground">{b.title}.</span> {b.body}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/artisans"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 font-semibold text-primary-foreground transition hover:brightness-110"
              >
                Browse artisans
                <ArrowUpRight size={18} className="transition-transform group-hover:rotate-45" />
              </Link>
              <Link
                href="/artisans/join"
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3.5 font-semibold transition hover:bg-muted"
              >
                Become an artisan
              </Link>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="aspect-[16/10] overflow-hidden rounded-3xl shadow-elegant">
              <img
                src={imageSrc(artisansAtWork)}
                alt="Artisans collaborating on a home job"
                className="h-full w-full object-cover"
                loading="lazy"
                width={1400}
                height={900}
              />
            </div>
            <div className="aspect-[16/9] overflow-hidden rounded-3xl shadow-soft">
              <img
                src={imageSrc(verifiedScene)}
                alt="Verified artisan professional"
                className="h-full w-full object-cover"
                loading="lazy"
                width={1200}
                height={675}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="container-page mt-24 md:mt-32">
        <div className="rounded-4xl overflow-hidden bg-secondary/30 grid lg:grid-cols-2">
          <div className="p-10 md:p-16 flex flex-col justify-center">
            <p className="text-sm uppercase tracking-[0.2em] text-primary/70">The Team</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl font-semibold text-balance">
              Builders, brokers, designers — and people who've moved a lot.
            </h2>
            <p className="mt-5 text-muted-foreground text-lg max-w-lg">
              We're a small, opinionated team based across three cities, obsessed with the details of what "home" actually feels like.
            </p>
            <div className="mt-8 flex gap-6">
              <Stat n="48" l="Cities live" />
              <Stat n="2,800+" l="Verified pros" />
              <Stat n="12k+" l="Listings" />
            </div>
          </div>
          <div className="aspect-[5/4] lg:aspect-auto">
            <img src={imageSrc(team)} alt="The HomeConnect team" className="w-full h-full object-cover" loading="lazy" width={1400} height={1000} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <p className="font-display text-3xl font-semibold text-primary">{n}</p>
      <p className="text-sm text-muted-foreground">{l}</p>
    </div>
  );
}
