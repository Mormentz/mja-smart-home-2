"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/generated/prisma/browser";
import {
  Calendar,
  FileText,
  Heart,
  HelpCircle,
  Home,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  Wrench,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { HomeConnectLogo } from "@/components/brand/homeconnect-logo";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: Role[];
  badge?: number;
};

const mainNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} />, roles: ["USER", "AGENT", "ARTISAN"] },
  // Housing / renter–agent only
  { href: "/dashboard/bookings", label: "Bookings", icon: <Calendar size={18} />, roles: ["USER", "AGENT"] },
  { href: "/dashboard/leases", label: "Leases & escrow", icon: <FileText size={18} />, roles: ["USER", "AGENT"] },
  { href: "/dashboard/saved", label: "Saved homes", icon: <Heart size={18} />, roles: ["USER"] },
  { href: "/dashboard/move-in", label: "Move-in", icon: <Truck size={18} />, roles: ["USER"] },
  { href: "/dashboard/listings", label: "Listings", icon: <Home size={18} />, roles: ["AGENT"] },
  { href: "/dashboard/employment", label: "Employment", icon: <Users size={18} />, roles: ["USER", "AGENT"] },
  { href: "/dashboard/equipment", label: "My rentals", icon: <Truck size={18} />, roles: ["USER", "AGENT"] },
  { href: "/properties", label: "Browse homes", icon: <Home size={18} />, roles: ["USER", "AGENT"] },
  { href: "/services", label: "Browse services", icon: <Wrench size={18} />, roles: ["USER", "AGENT"] },
  { href: "/jobs", label: "Browse jobs", icon: <Users size={18} />, roles: ["USER", "AGENT"] },
  { href: "/rentals", label: "Browse rentals", icon: <Truck size={18} />, roles: ["USER", "AGENT"] },
  // Artisan workspace
  { href: "/dashboard/jobs", label: "Service jobs", icon: <Wrench size={18} />, roles: ["USER", "AGENT", "ARTISAN"] },
  { href: "/dashboard/services", label: "My services", icon: <Wrench size={18} />, roles: ["ARTISAN"] },
  { href: "/dashboard/onboarding/artisan", label: "Onboarding", icon: <Wrench size={18} />, roles: ["ARTISAN"] },
  { href: "/dashboard/messages", label: "Messages", icon: <MessageSquare size={18} />, roles: ["USER", "AGENT", "ARTISAN"] },
];

const secondaryNav: NavItem[] = [
  { href: "/dashboard/kyc", label: "KYC", icon: <ShieldCheck size={18} />, roles: ["USER", "AGENT", "ARTISAN"] },
  { href: "/dashboard/wallet", label: "Wallet", icon: <Wallet size={18} />, roles: ["AGENT"] },
  { href: "/dashboard/settings", label: "Settings", icon: <Settings size={18} />, roles: ["USER", "AGENT", "ARTISAN"] },
  { href: "/contact", label: "Help & Support", icon: <HelpCircle size={18} />, roles: ["USER", "AGENT", "ARTISAN"] },
];

type DashboardSidebarProps = {
  role: Role;
  pendingBookings?: number;
  unreadMessages?: number;
  className?: string;
};

export function DashboardSidebar({ role, pendingBookings = 0, unreadMessages = 0, className }: DashboardSidebarProps) {
  const pathname = usePathname();

  const items = mainNav
    .filter((item) => item.roles.includes(role))
    .map((item) => ({
      ...item,
      badge:
        item.href === "/dashboard/bookings" && pendingBookings > 0
          ? pendingBookings
          : item.href === "/dashboard/messages" && unreadMessages > 0
            ? unreadMessages
            : undefined,
    }));

  const secondary = secondaryNav.filter((item) => item.roles.includes(role));

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className={cn("flex w-[260px] shrink-0 flex-col border-r border-border/60 bg-card", className)}>
      <div className="flex h-16 items-center border-b border-border/60 px-5">
        <HomeConnectLogo height={30} />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-primary/10 text-primary border-l-2 border-primary pl-[10px]"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span className="flex items-center gap-3">
              {item.icon}
              {item.label}
            </span>
            {item.badge !== undefined && (
              <Badge className="h-5 min-w-5 rounded-full bg-success text-success-foreground px-1.5 text-[10px]">
                {item.badge}
              </Badge>
            )}
          </Link>
        ))}
      </nav>

      <div className="border-t border-border/60 p-3 space-y-1">
        {secondary.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
