"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import {
  Calendar,
  Home,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: Role[];
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: <LayoutDashboard size={18} />, roles: ["RENTER", "BUYER", "LANDLORD", "AGENT", "ARTISAN"] },
  { href: "/dashboard/bookings", label: "Bookings", icon: <Calendar size={18} />, roles: ["RENTER", "BUYER", "LANDLORD", "AGENT"] },
  { href: "/dashboard/listings", label: "Listings", icon: <Home size={18} />, roles: ["LANDLORD", "AGENT"] },
  { href: "/dashboard/messages", label: "Messages", icon: <MessageSquare size={18} />, roles: ["RENTER", "BUYER", "LANDLORD", "AGENT", "ARTISAN"] },
  { href: "/dashboard/services", label: "Services", icon: <Wrench size={18} />, roles: ["ARTISAN"] },
  { href: "/dashboard/settings", label: "Settings", icon: <Settings size={18} />, roles: ["RENTER", "BUYER", "LANDLORD", "AGENT", "ARTISAN"] },
];

export function DashboardSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium whitespace-nowrap transition",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
