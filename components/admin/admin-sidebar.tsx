"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Truck,
  Users,
  Wrench,
  Banknote,
  CalendarDays,
  ScrollText,
  Bell,
  X,
} from "lucide-react";
import { useState } from "react";
import { HomeConnectLogo } from "@/components/brand/homeconnect-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AdminPendingBadges } from "@/lib/actions/admin-badges";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/artisans", label: "Services", icon: Wrench },
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase, badgeKey: "jobs" as const },
  { href: "/admin/rentals", label: "Rentals", icon: Truck, badgeKey: "rentals" as const },
  { href: "/admin/properties", label: "Properties", icon: Home },
  {
    href: "/admin/verifications",
    label: "Verifications",
    icon: ShieldCheck,
    badgeKey: "kyc" as const,
  },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/admin/leases", label: "Leases", icon: ScrollText },
  { href: "/admin/escrow", label: "Escrow", icon: Banknote },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: Banknote },
  { href: "/admin/security", label: "Security", icon: ShieldCheck, badgeKey: "security" as const },
  { href: "/admin/notifications", label: "Notifications", icon: Bell, badgeKey: "notifications" as const },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/amenities", label: "Amenities", icon: Home },
];

function BadgeCount({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="ml-auto rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
      {n > 99 ? "99+" : n}
    </span>
  );
}

export function AdminSidebar({
  email,
  badges,
  signOutAction,
}: {
  email?: string | null;
  badges: AdminPendingBadges;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const nav = (
    <>
      <div className="flex h-14 items-center gap-2.5 border-b border-border/60 px-4">
        <HomeConnectLogo href="/admin" height={26} />
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Admin
        </span>
        <button
          type="button"
          className="ml-auto grid h-8 w-8 place-items-center rounded-md hover:bg-muted md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV.map((item) => {
          const active = isActive(item.href, item.exact);
          const count = item.badgeKey ? badges[item.badgeKey] : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon size={16} />
              <span className="truncate">{item.label}</span>
              <BadgeCount n={count ?? 0} />
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border/60 p-3">
        <p className="mb-2 truncate px-2 text-xs text-muted-foreground">{email}</p>
        <form action={signOutAction}>
          <Button type="submit" variant="outline" size="sm" className="w-full justify-start gap-2">
            <LogOut size={14} /> Sign out
          </Button>
        </form>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-border/60 bg-card md:flex">
        {nav}
      </aside>

      <button
        type="button"
        className="fixed bottom-4 left-4 z-40 grid h-11 w-11 place-items-center rounded-full border border-border bg-card shadow-lg md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open admin menu"
      >
        <Menu size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close overlay"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[260px] flex-col bg-card shadow-xl">
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
