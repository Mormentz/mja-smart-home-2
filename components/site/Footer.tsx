import Link from "next/link";
import { Instagram, Twitter, Linkedin, ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 md:mt-32 px-3 md:px-5 pb-3 md:pb-5">
      <div className="w-full rounded-4xl bg-ink text-ink-foreground p-8 md:p-14 overflow-hidden relative">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-success/10 blur-3xl" />
        <div className="absolute -left-32 -bottom-32 w-96 h-96 rounded-full bg-secondary/10 blur-3xl" />

        <div className="relative grid md:grid-cols-2 gap-10 pb-14 border-b border-ink-foreground/10">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-ink-foreground/60">Get Started</p>
            <h2 className="mt-4 text-4xl md:text-6xl font-display font-semibold text-balance">
              Your next home is <span className="text-success">one click</span> away.
            </h2>
          </div>
          <div className="flex md:justify-end md:items-end">
            <Link
              href="/properties"
              className="group inline-flex items-center gap-3 px-6 py-4 rounded-full bg-success text-ink font-semibold hover:brightness-105 transition"
            >
              Explore Properties
              <ArrowUpRight className="group-hover:rotate-45 transition-transform" size={18} />
            </Link>
          </div>
        </div>

        <div className="relative grid md:grid-cols-4 gap-10 mt-14">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="grid place-items-center w-9 h-9 rounded-full bg-success">
                <span className="w-3 h-3 rounded-sm bg-ink rotate-45" />
              </span>
              <span className="font-display text-lg font-bold">HomeConnect</span>
            </div>
            <p className="mt-4 text-ink-foreground/70 max-w-sm">
              Find. Connect. Move. Live. The housing ecosystem for renters, buyers, landlords and artisans.
            </p>
            <div className="mt-6 flex gap-2">
              {[Instagram, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid place-items-center w-10 h-10 rounded-full border border-ink-foreground/15 hover:bg-ink-foreground/10 transition"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <FooterCol
            title="Platform"
            links={[
              { href: "/properties", label: "Browse" },
              { href: "/artisans", label: "Artisans" },
              { href: "/artisans/join", label: "Become an artisan" },
              { href: "/about", label: "About" },
              { href: "/contact", label: "Contact" },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { href: "/about", label: "Our Story" },
              { href: "/contact", label: "Support" },
              { href: "/", label: "Careers" },
            ]}
          />
        </div>

        <div className="relative mt-14 pt-6 border-t border-ink-foreground/10 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-ink-foreground/60">
          <p>© {new Date().getFullYear()} HomeConnect. All rights reserved.</p>
          <p>Find. Connect. Move. Live.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-sm uppercase tracking-[0.2em] text-ink-foreground/60">{title}</p>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="hover:text-success transition">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
