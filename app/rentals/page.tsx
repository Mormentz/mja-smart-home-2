import type { Metadata } from "next";
import Link from "next/link";
import { Package, PackagePlus } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const metadata: Metadata = {
  title: "Equipment Rentals — HomeConnect",
  description:
    "Rent equipment, gadgets, and tools — or list your gear and earn. Verified owners and documented handovers.",
};

export default function RentalsHubPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink to-ink/90" />
        <Header variant="dark" />
        <div className="relative container-page pb-16 pt-36 md:pb-20 md:pt-40">
          <p className="text-sm uppercase tracking-[0.2em] text-ink-foreground/65">Rentals Hub</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold text-balance md:text-6xl">
            Equipment & gadget rentals you can{" "}
            <span className="text-success">trust</span>.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink-foreground/75">
            Verified ownership, clear pricing, secure deposits, and documented handovers — without
            exposing private home addresses publicly.
          </p>
        </div>
      </section>

      <section className="container-page py-14 md:py-20">
        <h2 className="font-display text-2xl font-semibold md:text-3xl">What would you like to do?</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <HubCard
            href="/rentals/browse"
            icon={<Package size={22} />}
            title="I want to rent equipment"
            description="Browse verified listings, request a rental, and complete identity checks proportionate to the item’s value."
          />
          <HubCard
            href="/rentals/list"
            icon={<PackagePlus size={22} />}
            title="I want to list equipment for rent"
            description="Register as an owner, verify identity and ownership evidence, set pricing, and manage availability."
          />
        </div>
      </section>
      <Footer />
    </div>
  );
}

function HubCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-border/70 bg-card p-6 transition hover:border-primary/40 hover:shadow-sm"
    >
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</span>
      <h3 className="mt-4 font-display text-xl font-semibold group-hover:text-primary">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
