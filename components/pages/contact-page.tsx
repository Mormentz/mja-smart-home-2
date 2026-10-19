"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone, Send, Wrench } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <section className="container-page pt-4">
        <div className="relative overflow-hidden rounded-4xl bg-ink text-ink-foreground pt-40 md:pt-44 pb-20 md:pb-28 px-6 md:px-14">
          <Header variant="dark" />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="text-sm uppercase tracking-[0.2em] text-ink-foreground/60">Contact</p>
            <h1 className="mt-4 font-display text-5xl md:text-7xl font-semibold text-balance max-w-3xl">
              Say hello. We <span className="text-success">reply fast.</span>
            </h1>
            <p className="mt-6 text-ink-foreground/70 max-w-xl text-lg">
              Support, partnerships, press, artisan onboarding — or just chat about where you&apos;d like
              to live next.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container-page mt-10">
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="flex gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <Wrench size={20} />
            </div>
            <div>
              <p className="font-display text-xl font-semibold">Joining as an artisan?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Register for Artisans Hub in Abuja — verification, jobs, and escrow pay.
              </p>
            </div>
          </div>
          <Link
            href="/artisans/join"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            Become an artisan
            <ArrowUpRight size={16} className="transition-transform group-hover:rotate-45" />
          </Link>
        </div>
      </section>

      <section className="container-page mt-12 grid lg:grid-cols-5 gap-10">
        {/* Info */}
        <div className="lg:col-span-2 space-y-4">
          <InfoCard icon={<Mail size={18} />} title="Email" body="hello@homeconnect.app" />
          <InfoCard icon={<Phone size={18} />} title="Phone" body="+234 800 123 4567" />
          <InfoCard icon={<MessageCircle size={18} />} title="Live chat" body="Mon–Fri, 9am – 7pm WAT" />
          <InfoCard icon={<MapPin size={18} />} title="Head office" body="27 Adeola Odeku, Victoria Island, Lagos" />
        </div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="lg:col-span-3 rounded-4xl bg-muted p-8 md:p-12"
        >
          <h2 className="font-display text-3xl font-semibold">Send us a message</h2>
          <p className="mt-2 text-muted-foreground">We usually respond within a few hours.</p>

          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            <Field label="First name" placeholder="Ada" />
            <Field label="Last name" placeholder="Okonkwo" />
            <Field label="Email" type="email" placeholder="you@email.com" />
            <Field label="Topic" placeholder="Support / Artisan join / Partnerships / Press" />
          </div>
          <label className="block mt-4">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Message</span>
            <textarea rows={5} required placeholder="Tell us what's on your mind…" className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-primary transition" />
          </label>

          <button type="submit" className="mt-6 inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold hover:brightness-110 transition">
            {sent ? "Message sent ✓" : "Send message"} <Send size={16} />
          </button>
        </motion.form>
      </section>

      <Footer />
    </div>
  );
}

function InfoCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="rounded-3xl border border-border p-6 bg-card">
      <div className="grid place-items-center w-11 h-11 rounded-2xl bg-primary text-primary-foreground">{icon}</div>
      <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">{title}</p>
      <p className="mt-1 font-display text-lg font-semibold">{body}</p>
    </motion.div>
  );
}

function Field({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <input required {...rest} className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-primary transition" />
    </label>
  );
}
