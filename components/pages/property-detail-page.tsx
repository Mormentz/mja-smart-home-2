"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Bath, BedDouble, MapPin, Ruler, ShieldCheck, Check } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PropertyActions } from "@/components/property-actions";
import type { Property } from "@/lib/properties";
import { imageSrc } from "@/lib/utils";
import detailKitchen from "@/assets/detail-kitchen.jpg";

export function PropertyDetailPage({
  property: p,
  similar,
}: {
  property: Property;
  similar: Property[];
}) {

  return (
    <div className="min-h-screen bg-background">
      <div className="container-page pt-4">
        <div className="relative overflow-hidden rounded-4xl bg-ink text-ink-foreground pt-32 md:pt-36 pb-10 px-6 md:px-12">
          <Header variant="dark" />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <Link href="/properties" className="inline-flex items-center gap-2 text-ink-foreground/70 hover:text-ink-foreground text-sm">
                <ArrowLeft size={14} /> All properties
              </Link>
              <div className="mt-4 flex gap-2">
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-success text-ink">{p.type}</span>
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-ink-foreground/10 border border-ink-foreground/15">{p.category}</span>
              </div>
              <h1 className="mt-4 font-display text-4xl md:text-6xl font-semibold text-balance">{p.title}</h1>
              <p className="mt-3 inline-flex items-center gap-2 text-ink-foreground/70"><MapPin size={16} /> {p.location}</p>
            </div>
            <div className="text-right">
              <p className="text-ink-foreground/60 text-sm">Asking</p>
              <p className="font-display text-4xl md:text-5xl font-semibold text-success">
                {p.currency}{p.price.toLocaleString()}
                {p.type === "For Rent" && <span className="text-lg text-ink-foreground/60 font-normal"> /mo</span>}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <section className="container-page mt-6 grid md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="md:col-span-2 aspect-[16/10] rounded-3xl overflow-hidden shadow-soft">
          <img src={imageSrc(p.image)} alt={p.title} className="w-full h-full object-cover" width={1200} height={900} />
        </motion.div>
        <div className="grid grid-rows-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="rounded-3xl overflow-hidden shadow-soft">
            <img src={imageSrc(detailKitchen)} alt="Interior kitchen" className="w-full h-full object-cover" loading="lazy" width={1400} height={900} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="rounded-3xl overflow-hidden shadow-soft">
            <img src={imageSrc(similar[0]?.image ?? p.image)} alt="Additional view" className="w-full h-full object-cover" loading="lazy" width={1200} height={900} />
          </motion.div>
        </div>
      </section>

      <section className="container-page mt-14 grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-3 gap-3">
            <Fact icon={<BedDouble size={18} />} label="Bedrooms" value={p.beds.toString()} />
            <Fact icon={<Bath size={18} />} label="Bathrooms" value={p.baths.toString()} />
            <Fact icon={<Ruler size={18} />} label="Area" value={`${p.area} ft²`} />
          </div>

          <h2 className="mt-12 font-display text-3xl font-semibold">About this home</h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">{p.description}</p>

          <h3 className="mt-12 font-display text-2xl font-semibold">What&apos;s included</h3>
          <ul className="mt-6 grid sm:grid-cols-2 gap-3">
            {p.amenities.map((a) => (
              <li key={a} className="flex items-center gap-3 rounded-2xl border border-border p-4">
                <span className="grid place-items-center w-8 h-8 rounded-lg bg-success/20 text-success"><Check size={16} /></span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>

        <aside className="lg:sticky lg:top-8 h-max rounded-3xl border border-border p-6 shadow-soft bg-card">
          <div className="flex items-center gap-2 text-success">
            <ShieldCheck size={18} /> <span className="text-sm font-semibold">Verified listing</span>
          </div>
          <p className="mt-4 font-display text-3xl font-semibold text-primary">
            {p.currency}{p.price.toLocaleString()}
            {p.type === "For Rent" && <span className="text-base text-muted-foreground font-normal"> /mo</span>}
          </p>
          <PropertyActions propertyId={p.id} ownerId={p.ownerId} propertyTitle={p.title} />
        </aside>
      </section>

      <section className="container-page mt-24">
        <h2 className="font-display text-3xl font-semibold">You might also like</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {similar.map((s) => (
            <Link key={s.id} href={`/properties/${s.id}`} className="group rounded-3xl overflow-hidden bg-card border border-border shadow-soft hover:shadow-elegant transition-shadow">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={imageSrc(s.image)} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" width={1200} height={900} />
              </div>
              <div className="p-5">
                <p className="text-sm text-muted-foreground">{s.location}</p>
                <p className="mt-1 font-display text-lg font-semibold">{s.title}</p>
                <p className="mt-2 text-primary font-semibold">{s.currency}{s.price.toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted p-5">
      <div className="grid place-items-center w-9 h-9 rounded-lg bg-background text-primary">{icon}</div>
      <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold">{value}</p>
    </div>
  );
}
