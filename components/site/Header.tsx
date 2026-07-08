"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Home", exact: true },
  { href: "/properties", label: "Properties" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export function Header({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isDark = variant === "dark";
  const textCls = isDark ? "text-ink-foreground" : "text-ink";
  const mutedCls = isDark ? "text-ink-foreground/70" : "text-ink/70";
  const borderCls = isDark ? "border-ink-foreground/10" : "border-ink/10";

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : href !== "/" && pathname.startsWith(href);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn("absolute top-0 left-0 right-0 z-50", textCls)}
    >
      <div className="container-page">
        <div
          className={cn(
            "mt-4 flex items-center justify-between rounded-full border px-5 py-3 transition-all duration-300",
            borderCls,
            scrolled && "backdrop-blur-xl bg-ink/30",
          )}
        >
          <Link href="/" className="flex items-center gap-2 group">
            <span className="grid place-items-center w-9 h-9 rounded-full bg-success/90">
              <span className="w-3 h-3 rounded-sm bg-ink rotate-45" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">HomeConnect</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "px-4 py-2 rounded-full text-sm transition",
                  isActive(n.href, "exact" in n ? n.exact : false)
                    ? cn("font-semibold", textCls)
                    : cn(mutedCls, isDark ? "hover:text-ink-foreground hover:bg-ink-foreground/5" : "hover:text-ink hover:bg-ink/5"),
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <button className={cn("px-4 py-2 rounded-full text-sm transition", mutedCls)}>Sign In</button>
            <button className="px-5 py-2.5 rounded-full text-sm font-semibold bg-success text-ink hover:brightness-105 transition shadow-soft">
              Get Started
            </button>
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            className={cn("md:hidden grid place-items-center w-10 h-10 rounded-full border", borderCls)}
            aria-label="Toggle menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-2 rounded-3xl bg-ink text-ink-foreground p-4 border border-ink-foreground/10"
          >
            <div className="flex flex-col">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 rounded-2xl hover:bg-ink-foreground/5"
                >
                  {n.label}
                </Link>
              ))}
              <div className="mt-2 flex gap-2 px-2">
                <button className="flex-1 py-2.5 rounded-full border border-ink-foreground/15">Sign In</button>
                <button className="flex-1 py-2.5 rounded-full bg-success text-ink font-semibold">Get Started</button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
