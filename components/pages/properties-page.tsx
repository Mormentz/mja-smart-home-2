"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PropertyCard } from "@/components/property-card";
import { properties } from "@/lib/properties";

const filters = ["All", "For Sale", "For Rent", "House", "Apartment", "Villa", "Loft", "Penthouse", "Townhouse"] as const;

export default function PropertiesPage() {
  const [active, setActive] = useState<(typeof filters)[number]>("All");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    return properties.filter((p) => {
      const matchFilter =
        active === "All" ||
        p.type === active ||
        p.category === active;
      const matchQ =
        !q ||
        p.title.toLowerCase().includes(q.toLowerCase()) ||
        p.location.toLowerCase().includes(q.toLowerCase());
      return matchFilter && matchQ;
    });
  }, [active, q]);

  return (
    <div className="min-h-screen bg-background">
      {/* Dark header band */}
      <section className="bg-background pt-4">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-4xl bg-ink text-ink-foreground pt-40 pb-16 md:pb-20 px-6 md:px-14">
            <Header variant="dark" />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <p className="text-sm uppercase tracking-[0.2em] text-ink-foreground/60">Properties</p>
              <h1 className="mt-4 font-display text-5xl md:text-7xl font-semibold text-balance max-w-3xl">
                Find a place <span className="text-success">worth coming home to.</span>
              </h1>
              <p className="mt-6 text-ink-foreground/70 max-w-xl text-lg">
                Every listing is verified. Every neighborhood is scored. Every question has an answer.
              </p>
            </motion.div>

            {/* Search */}
            <div className="mt-10 bg-background text-foreground rounded-3xl p-3 flex items-center gap-2 shadow-elegant">
              <div className="flex-1 flex items-center gap-3 px-4 py-3">
                <Search size={18} className="text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by city, neighborhood or title…"
                  className="w-full bg-transparent outline-none"
                />
              </div>
              <button className="grid place-items-center rounded-2xl bg-primary text-primary-foreground px-5 py-3 gap-2 inline-flex">
                <SlidersHorizontal size={16} /> <span className="hidden sm:inline">Filters</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Filter chips */}
      <section className="container-page mt-10">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`px-4 py-2 rounded-full text-sm border transition ${
                active === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:border-primary/40"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-8 text-sm text-muted-foreground">{list.length} homes available</div>

        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((p, i) => (
            <PropertyCard key={p.id} p={p} delay={i * 0.04} />
          ))}
        </div>

        {list.length === 0 && (
          <div className="mt-16 text-center text-muted-foreground">No properties match your search. Try clearing filters.</div>
        )}
      </section>

      <Footer />
    </div>
  );
}
