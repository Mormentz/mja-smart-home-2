"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: Role[];
  badge?: number;
};

const mainNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} />, roles: ["USER", "AGENT", "ARTISAN", "ADMIN"] },
  { href: "/dashboard/admin", label: "Overview", icon: <ShieldCheck size={18} />, roles: ["ADMIN"] },
  { href: "/dashboard/admin/users", label: "Users", icon: <Users size={18} />, roles: ["ADMIN"] },
  { href: "/dashboard/admin/artisans", label: "Artisans", icon: <Wrench size={18} />, roles: ["ADMIN"] },
  { href: "/dashboard/admin/properties", label: "Properties", icon: <Home size={18} />, roles: ["ADMIN"] },
  { href: "/dashboard/admin/verifications", label: "Verifications", icon: <ShieldCheck size={18} />, roles: ["ADMIN"] },
  { href: "/dashboard/admin/content", label: "Content", icon: <FileText size={18} />, roles: ["ADMIN"] },
  { href: "/dashboard/admin/amenities", label: "Amenities", icon: <Home size={18} />, roles: ["ADMIN"] },
  { href: "/dashboard/bookings", label: "Bookings", icon: <Calendar size={18} />, roles: ["USER", "AGENT"] },
  { href: "/dashboard/leases", label: "Leases & escrow", icon: <FileText size={18} />, roles: ["USER", "AGENT"] },
  { href: "/dashboard/saved", label: "Saved homes", icon: <Heart size={18} />, roles: ["USER"] },
  { href: "/dashboard/move-in", label: "Move-in", icon: <Truck size={18} />, roles: ["USER"] },
  { href: "/dashboard/listings", label: "Listings", icon: <Home size={18} />, roles: ["AGENT"] },
  { href: "/dashboard/jobs", label: "Jobs", icon: <Wrench size={18} />, roles: ["USER", "AGENT", "ARTISAN"] },
  { href: "/properties", label: "Browse homes", icon: <Home size={18} />, roles: ["USER", "AGENT", "ARTISAN"] },
  { href: "/artisans", label: "Browse artisans", icon: <Wrench size={18} />, roles: ["USER", "AGENT"] },
  { href: "/dashboard/messages", label: "Messages", icon: <MessageSquare size={18} />, roles: ["USER", "AGENT", "ARTISAN", "ADMIN"] },
  { href: "/dashboard/onboarding/artisan", label: "Onboarding", icon: <Wrench size={18} />, roles: ["ARTISAN"] },
  { href: "/dashboard/services", label: "Services", icon: <Wrench size={18} />, roles: ["ARTISAN"] },
];

const secondaryNav: NavItem[] = [
  { href: "/dashboard/settings", label: "Settings", icon: <Settings size={18} />, roles: ["USER", "AGENT", "ARTISAN", "ADMIN"] },
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
    if (href === "/dashboard/admin") return pathname === "/dashboard/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className={cn("flex w-[260px] shrink-0 flex-col border-r border-border/60 bg-card", className)}>
      <div className="flex h-16 items-center gap-2.5 border-b border-border/60 px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary text-primary-foreground shadow-sm">
            <span className="w-3 h-3 rounded-sm bg-primary-foreground rotate-45" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">HomeConnect</span>
        </Link>
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
