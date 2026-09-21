"use client";

import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { roleLabel } from "@/lib/auth/role-labels";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

type DashboardHeaderProps = {
  onMenuClick?: () => void;
  unreadMessages?: number;
};

export function DashboardHeader({ onMenuClick, unreadMessages = 0 }: DashboardHeaderProps) {
  const { data: session } = useSession();
  const [dark, setDark] = useState(false);

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "HC";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/60 bg-card/95 backdrop-blur px-4 lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={onMenuClick}>
        <Menu size={20} />
      </Button>

      <div className="relative flex-1 max-w-xl">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search anything..."
          className="h-10 rounded-xl border-border/60 bg-muted/40 pl-9 pr-16"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl"
          onClick={() => setDark((v) => !v)}
          aria-label="Toggle theme"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </Button>

        <Button variant="ghost" size="icon" className="rounded-xl relative">
          <Bell size={18} />
          {unreadMessages > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="ml-1 flex items-center gap-2 rounded-xl p-1 hover:bg-muted transition outline-none">
              <Avatar className="h-9 w-9 border">
                <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <span>{session?.user?.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {session?.user?.role ? roleLabel(session.user.role) : "Member"}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/dashboard/settings">Settings</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <div className="w-full cursor-pointer">
                <SignOutButton variant="menu" />
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export function DashboardPageToolbar({
  title = "Dashboard",
  onAddWidget,
  onExport,
}: {
  title?: string;
  onAddWidget?: () => void;
  onExport?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="rounded-xl h-9 bg-card">
          Jan 1, 2025 – Feb 1, 2025
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl h-9 bg-card">
          Last 30 days
        </Button>
        {onAddWidget && (
          <Button variant="outline" size="sm" className="rounded-xl h-9 bg-card" onClick={onAddWidget}>
            + Add widget
          </Button>
        )}
        <Button size="sm" className="rounded-xl h-9" onClick={onExport}>
          Export
        </Button>
      </div>
    </div>
  );
}

export function DashboardKpiBadge({ value, positive }: { value: number; positive?: boolean }) {
  const isPositive = positive ?? value >= 0;
  return (
    <Badge
      variant="outline"
      className={
        isPositive
          ? "border-success/30 bg-success/10 text-success hover:bg-success/10"
          : "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/10"
      }
    >
      {isPositive ? "+" : ""}
      {value}%
    </Badge>
  );
}
