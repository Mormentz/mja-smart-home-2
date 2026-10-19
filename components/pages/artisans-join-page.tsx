"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BadgeCheck,
  Briefcase,
  ChartLine,
  MapPin,
  MessageCircle,
  Smartphone,
  Star,
  Wallet,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { imageSrc } from "@/lib/utils";
import { ARTISAN_TRADES, JOIN_BENEFITS } from "@/lib/artisans-content";
import heroGroup from "@/assets/artisans/artisans-hero-group.jpg";
import atWork from "@/assets/artisans/artisans-at-work.jpg";
import verifiedScene from "@/assets/artisans/artisans-verified-badge-scene.jpg";

const benefitIcons = [Briefcase, BadgeCheck, Wallet, Star, Smartphone, ChartLine] as const;

export default function ArtisansJoinPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative min-h-[85vh] w-full overflow-hidden bg-ink text-ink-foreground">
        <img
          src={imageSrc(heroGroup)}
          alt="Professional artisans ready to join HomeConnect"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
          width={1600}
          height={1200}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/50" />
        <Header variant="dark" />
        <div className="relative container-page flex min-h-[85vh] flex-col justify-end pb-16 pt-36 md:pb-20 md:pt-40">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm uppercase tracking-[0.2em] text-ink-foreground/70"
          >
            Artisans Hub
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-4 max-w-3xl font-display text-4xl font-semibold text-balance md:text-6xl lg:text-7xl"
          >
            Are you a <span className="text-success">professional artisan?</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mt-5 max-w-xl text-lg text-ink-foreground/75"
          >
            Join HomeConnect and get connected to quality customers in{" "}
            <strong className="font-semibold text-ink-foreground">Abuja</strong>. Register today
            and become a verified professional on Artisans Hub.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link
              href="/signup/artisan"
              className="group inline-flex items-center gap-2 rounded-full bg-success px-6 py-3.5 font-semibold text-ink shadow-soft transition hover:brightness-105"
            >
              Register as an artisan
              <ArrowUpRight size={18} className="transition-transform group-hover:rotate-45" />
            </Link>
            <Link
              href="/artisans"
              className="inline-flex items-center gap-2 rounded-full border border-ink-foreground/25 px-6 py-3.5 transition hover:bg-ink-foreground/5"
            >
              Browse the hub
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="container-page mt-20 md:mt-28">
        <p className="text-sm uppercase tracking-[0.2em] text-primary/70">Why join</p>
        <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold md:text-5xl">
          One platform. Every home service.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          HomeConnect Artisans Hub is built for electricians, plumbers, painters, AC techs, and
          more — so you spend less time chasing jobs and more time doing the work you&apos;re great at.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {JOIN_BENEFITS.map((b, i) => {
            const Icon = benefitIcons[i] ?? Briefcase;
            return (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-3xl bg-muted p-8"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
                  <Icon size={20} />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold">{b.title}</h3>
                <p className="mt-2 text-muted-foreground">{b.body}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="container-page mt-20 grid items-center gap-10 md:mt-28 lg:grid-cols-2">
        <div className="aspect-[5/4] overflow-hidden rounded-3xl shadow-elegant">
          <img
            src={imageSrc(verifiedScene)}
            alt="Verified HomeConnect artisan"
            className="h-full w-full object-cover"
            width={1200}
            height={960}
            loading="lazy"
          />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-primary/70">Who can join</p>
          <h2 className="mt-3 font-display text-4xl font-semibold md:text-5xl">
            Trades we&apos;re onboarding in Abuja.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            If you deliver quality home services, there&apos;s a place for you — and we&apos;re expanding
            categories as demand grows.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {ARTISAN_TRADES.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground"
              >
                {t}
              </span>
            ))}
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              and many more
            </span>
          </div>
        </div>
      </section>

      <section className="container-page mt-20 md:mt-28">
        <div className="relative overflow-hidden rounded-4xl bg-primary px-8 py-12 text-primary-foreground md:px-14 md:py-16">
          <img
            src={imageSrc(atWork)}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
            aria-hidden
          />
          <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 px-3 py-1 text-sm">
                <MapPin size={14} /> Currently focusing on Abuja
              </div>
              <h2 className="mt-4 font-display text-3xl font-semibold md:text-4xl">
                Be part of Abuja&apos;s most trusted network of professionals.
              </h2>
              <p className="mt-4 text-primary-foreground/80">
                We&apos;re building density where quality customers need you most — starting with the
                capital. Early joiners get visibility as we grow.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                href="/signup/artisan"
                className="group inline-flex items-center gap-2 rounded-full bg-success px-6 py-3.5 font-semibold text-ink transition hover:brightness-105"
              >
                Create artisan account
                <ArrowUpRight size={18} className="transition-transform group-hover:rotate-45" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-6 py-3.5 transition hover:bg-primary-foreground/10"
              >
                <MessageCircle size={16} /> Talk to our team
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
