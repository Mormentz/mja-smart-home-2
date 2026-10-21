"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Bath, BedDouble, MapPin, Ruler } from "lucide-react";
import type { Property } from "@/lib/properties";
import { formatMoney } from "@/lib/currency";
import { imageSrc } from "@/lib/utils";

export function PropertyCard({ p, delay = 0 }: { p: Property; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="group rounded-3xl bg-card border border-border overflow-hidden shadow-soft hover:shadow-elegant transition-shadow"
    >
      <Link href={`/properties/${p.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={imageSrc(p.image)}
            alt={p.title}
            loading="lazy"
            width={1200}
            height={900}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-semibold bg-background/95 backdrop-blur">
            {p.type}
          </span>
          <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-ink/80 text-ink-foreground backdrop-blur">
              {p.category}
            </span>
            {p.verificationStatus === "VERIFIED" && (
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground">
                Verified
              </span>
            )}
            {p.neighborhood && (
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-background/95">
                Safety {p.neighborhood.safety}
              </span>
            )}
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <MapPin size={14} /> {p.location}
          </div>
          <h3 className="mt-2 font-display text-xl font-semibold">{p.title}</h3>
          <div className="mt-4 flex items-center gap-5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><BedDouble size={16} /> {p.beds}</span>
            <span className="inline-flex items-center gap-1.5"><Bath size={16} /> {p.baths}</span>
            <span className="inline-flex items-center gap-1.5"><Ruler size={16} /> {p.area} ft²</span>
          </div>
          <div className="mt-5 flex items-end justify-between">
            <p className="font-display text-2xl font-semibold text-primary">
              {formatMoney(p.price, { currency: p.currency })}
              {p.type === "For Rent" && <span className="text-sm text-muted-foreground font-normal">/mo</span>}
            </p>
            <span className="grid place-items-center w-10 h-10 rounded-full bg-primary text-primary-foreground group-hover:bg-success group-hover:text-ink transition">
              <ArrowUpRight size={16} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
