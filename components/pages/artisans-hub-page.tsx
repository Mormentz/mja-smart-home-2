"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUpRight, Search, Wrench } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { imageSrc } from "@/lib/utils";
import { HIRE_BENEFITS } from "@/lib/artisans-content";
import { NIGERIA_STATES } from "@/lib/geo/nigeria-states";
import { skillProficiencyLabel } from "@/lib/services/skill-proficiency";
import { formatMoneyPerHour } from "@/lib/currency";
import heroGroup from "@/assets/artisans/artisans-hero-group.jpg";
import electrician from "@/assets/artisans/artisan-electrician.jpg";
import plumber from "@/assets/artisans/artisan-plumber.jpg";
import painter from "@/assets/artisans/artisan-painter.jpg";
import acTech from "@/assets/artisans/artisan-ac-tech.jpg";
import carpenter from "@/assets/artisans/artisan-carpenter.jpg";
import tiler from "@/assets/artisans/artisan-tiler.jpg";
import cleaner from "@/assets/artisans/artisan-cleaner.jpg";
import welder from "@/assets/artisans/artisan-welder.jpg";
import cctv from "@/assets/artisans/artisan-cctv.jpg";

export type ArtisanListItem = {
  id: string;
  name: string | null;
  email: string;
  kycLevel: string;
  stateCode: string | null;
  areaName: string | null;
  serviceProfile: {
    trade: string;
    bio: string;
    verified: boolean;
    skillBadge: string;
    hourlyRate: number;
    available: boolean;
    serviceArea: string | null;
  } | null;
  categories: {
    categorySlug: string;
    categoryName: string;
    subcategorySlug: string;
    subcategoryName: string;
    proficiency: string;
  }[];
  reviewsReceived: { rating: number }[];
};

type CategoryChip = {
  slug: string;
  name: string;
  isPrimary: boolean;
  subcategories: { slug: string; name: string }[];
};

const TRADE_THUMBS: Record<string, typeof electrician> = {
  electrical: electrician,
  plumbing: plumber,
  painting: painter,
  "ac-refrigeration": acTech,
  carpentry: carpenter,
  tiling: tiler,
  cleaning: cleaner,
  welding: welder,
  "cctv-security": cctv,
};

function tradeThumb(item: ArtisanListItem) {
  const slug = item.categories[0]?.categorySlug;
  if (slug && TRADE_THUMBS[slug]) return TRADE_THUMBS[slug]!;
  return heroGroup;
}

function trustBadge(level: string) {
  if (level === "ENHANCED") return "Fully verified";
  if (level === "STANDARD") return "Trusted pro";
  return null;
}

export function ArtisansHubPage({
  artisans,
  categories,
  initialFilters,
}: {
  artisans: ArtisanListItem[];
  categories: CategoryChip[];
  initialFilters: {
    category: string;
    subcategory: string;
    state: string;
    area: string;
    q: string;
  };
}) {
  const router = useRouter();
  const primary = categories.filter((c) => c.isPrimary);
  const more = categories.filter((c) => !c.isPrimary);
  const [query, setQuery] = useState(initialFilters.q);
  const [category, setCategory] = useState(initialFilters.category);
  const [showMore, setShowMore] = useState(
    Boolean(initialFilters.category && more.some((c) => c.slug === initialFilters.category)),
  );
  const [subcategory, setSubcategory] = useState(initialFilters.subcategory);
  const [state, setState] = useState(initialFilters.state);
  const [area, setArea] = useState(initialFilters.area);

  const activeCategory = categories.find((c) => c.slug === category);
  const stateAreas = useMemo(() => {
    if (!state) return [] as string[];
    const st = NIGERIA_STATES.find((s) => s.code === state);
    const set = new Set<string>();
    for (const lga of st?.lgas ?? []) {
      for (const a of lga.areas ?? ["Other / Nearby"]) set.add(a);
    }
    return Array.from(set);
  }, [state]);

  function applyFilters(next: Partial<typeof initialFilters>) {
    const params = new URLSearchParams();
    const merged = {
      category,
      subcategory,
      state,
      area,
      q: query,
      ...next,
    };
    if (merged.category) params.set("category", merged.category);
    if (merged.subcategory) params.set("subcategory", merged.subcategory);
    if (merged.state) params.set("state", merged.state);
    if (merged.area) params.set("area", merged.area);
    if (merged.q.trim()) params.set("q", merged.q.trim());
    const qs = params.toString();
    router.push(qs ? `/artisans?${qs}` : "/artisans");
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="relative min-h-[70vh] w-full overflow-hidden bg-ink text-ink-foreground">
        <img
          src={imageSrc(heroGroup)}
          alt="Verified HomeConnect artisans"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
          width={1600}
          height={1200}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
        <Header variant="dark" />
        <div className="relative container-page flex min-h-[70vh] flex-col justify-end pb-14 pt-36 md:pb-16 md:pt-40">
          <p className="text-sm uppercase tracking-[0.2em] text-ink-foreground/65">Artisan Hub</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold text-balance md:text-6xl">
            Verified pros for every home fix in{" "}
            <span className="text-success">Abuja</span>.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink-foreground/75">
            Real-time availability, escrow payments, skill badges, and emergency help — hire
            trusted artisans or join the network as a professional.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#directory"
              className="group inline-flex items-center gap-2 rounded-full bg-success px-6 py-3.5 font-semibold text-ink transition hover:brightness-105"
            >
              Hire an artisan
              <ArrowUpRight size={18} className="transition-transform group-hover:rotate-45" />
            </a>
            <Link
              href="/artisans/join"
              className="inline-flex items-center gap-2 rounded-full border border-ink-foreground/25 px-6 py-3.5 transition hover:bg-ink-foreground/5"
            >
              Become an artisan
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page mt-16 grid gap-4 md:grid-cols-3">
        {HIRE_BENEFITS.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="rounded-3xl border border-border bg-card p-6 shadow-soft"
          >
            <h3 className="font-display text-lg font-semibold">{b.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{b.body}</p>
          </motion.div>
        ))}
      </section>

      <section id="directory" className="container-page mt-16 scroll-mt-24 pb-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-primary/70">Directory</p>
            <h2 className="mt-2 font-display text-3xl font-semibold md:text-4xl">
              Browse verified artisans
            </h2>
          </div>
          <Link
            href="/signup/artisan"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Want to be listed? Join the hub →
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setCategory("");
              setSubcategory("");
              applyFilters({ category: "", subcategory: "" });
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              !category ? "bg-ink text-ink-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            All
          </button>
          {primary.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => {
                setCategory(c.slug);
                setSubcategory("");
                applyFilters({ category: c.slug, subcategory: "" });
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                category === c.slug
                  ? "bg-ink text-ink-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {c.name.replace(/ Services$/, "").replace(/ & .*$/, "")}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground"
          >
            {showMore ? "Less" : "More services"}
          </button>
        </div>

        {showMore && (
          <div className="mt-2 flex flex-wrap gap-2">
            {more.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => {
                  setCategory(c.slug);
                  setSubcategory("");
                  applyFilters({ category: c.slug, subcategory: "" });
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  category === c.slug
                    ? "bg-ink text-ink-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div className="relative min-w-0 lg:col-span-2">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilters({ q: query });
              }}
              placeholder="Search name, trade, area…"
              className="h-11 rounded-full pl-9"
            />
          </div>
          <select
            value={subcategory}
            onChange={(e) => {
              setSubcategory(e.target.value);
              applyFilters({ subcategory: e.target.value });
            }}
            className="h-11 rounded-full border border-border bg-background px-4 text-sm"
            disabled={!activeCategory}
          >
            <option value="">All subcategories</option>
            {(activeCategory?.subcategories ?? []).map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setArea("");
              applyFilters({ state: e.target.value, area: "" });
            }}
            className="h-11 rounded-full border border-border bg-background px-4 text-sm"
          >
            <option value="">All states</option>
            {NIGERIA_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={area}
            onChange={(e) => {
              setArea(e.target.value);
              applyFilters({ area: e.target.value });
            }}
            className="h-11 rounded-full border border-border bg-background px-4 text-sm"
            disabled={!state}
          >
            <option value="">All areas</option>
            {stateAreas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {artisans.map((a) => {
            const profile = a.serviceProfile!;
            const ratings = a.reviewsReceived.map((r) => r.rating);
            const avg =
              ratings.length > 0
                ? (ratings.reduce((s, n) => s + n, 0) / ratings.length).toFixed(1)
                : null;
            const thumb = tradeThumb(a);
            const badge = trustBadge(a.kycLevel);
            return (
              <Link
                key={a.id}
                href={`/artisans/${a.id}`}
                className="group overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition hover:shadow-elegant"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={imageSrc(thumb)}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    {profile.verified && (
                      <Badge className="bg-success text-ink">Verified</Badge>
                    )}
                    {badge && <Badge variant="secondary">{badge}</Badge>}
                    <Badge variant="secondary">{profile.available ? "Available" : "Busy"}</Badge>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-xl font-semibold">
                        {a.name ?? a.email}
                      </h2>
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Wrench size={12} /> {profile.trade}
                      </p>
                    </div>
                    {avg && (
                      <span className="shrink-0 text-sm font-medium text-primary">{avg}★</span>
                    )}
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{profile.bio}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    {(a.areaName || profile.serviceArea) && (
                      <span className="rounded-full bg-muted px-3 py-1">
                        {a.areaName || profile.serviceArea}
                      </span>
                    )}
                    <span className="rounded-full bg-muted px-3 py-1">
                      {formatMoneyPerHour(profile.hourlyRate)}
                    </span>
                    {a.categories[0] && (
                      <span className="rounded-full bg-muted px-3 py-1">
                        {skillProficiencyLabel(a.categories[0].proficiency)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {artisans.length === 0 && (
          <div className="mt-10 rounded-3xl border border-dashed border-border bg-muted/40 px-6 py-16 text-center">
            <p className="font-display text-xl font-semibold">No artisans match that filter</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try another category — or join the hub if you&apos;re a professional in Abuja.
            </p>
            <Link
              href="/signup/artisan"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Become an artisan <ArrowUpRight size={16} />
            </Link>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
