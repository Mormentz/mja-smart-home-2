"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState, useTransition } from "react";
import type { Role } from "@prisma/client";
import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import {
  getHeaderNotifications,
  getUnreadMessageCount,
  searchDashboard,
  type SearchHit,
} from "@/lib/actions/dashboard-header";

type DashboardHeaderProps = {
  onMenuClick?: () => void;
  unreadMessages?: number;
  role?: Role;
  pendingBookings?: number;
};

export function DashboardHeader({
  onMenuClick,
  unreadMessages: initialUnread = 0,
  role,
}: DashboardHeaderProps) {
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const [unread, setUnread] = useState(initialUnread);
  const [notifications, setNotifications] = useState<
    { id: string; title: string; href: string; meta?: string }[]
  >([]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setUnread(initialUnread);
  }, [initialUnread]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    startTransition(async () => {
      const results = await searchDashboard(query);
      setHits(results);
    });
  }, [searchOpen, query]);

  const refreshUnread = useCallback(async () => {
    const count = await getUnreadMessageCount();
    setUnread(count);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      void refreshUnread();
    }, 10000);
    return () => clearInterval(id);
  }, [refreshUnread]);

  async function loadNotifications() {
    const data = await getHeaderNotifications();
    setNotifications(data.items);
    setUnread(data.unreadMessages);
  }

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "HC";

  const isDark = mounted && resolvedTheme === "dark";

  const pageHits = hits.filter((h) => h.group === "Pages");
  const propertyHits = hits.filter((h) => h.group === "Properties");

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b border-border/60 bg-card/95 px-3 backdrop-blur lg:h-16 lg:gap-4 lg:px-6">
      <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" onClick={onMenuClick}>
        <Menu size={20} />
      </Button>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="relative flex h-9 max-w-md flex-1 items-center rounded-xl border border-border/60 bg-muted/40 px-3 text-left text-sm text-muted-foreground transition hover:bg-muted/60 lg:h-10"
      >
        <Search size={16} className="mr-2 shrink-0" />
        <span className="flex-1 truncate">Search pages & properties…</span>
        <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 text-[10px] sm:inline-flex">
          ⌘K
        </kbd>
      </button>

      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </Button>

        <DropdownMenu
          onOpenChange={(open) => {
            if (open) void loadNotifications();
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-xl" aria-label="Notifications">
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unread > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {unread} unread
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                You&apos;re all caught up.
              </div>
            ) : (
              notifications.map((n) => (
                <DropdownMenuItem key={n.id} asChild className="cursor-pointer flex-col items-start gap-0.5 py-2">
                  <Link href={n.href}>
                    <span className="font-medium">{n.title}</span>
                    {n.meta && (
                      <span className="text-xs text-muted-foreground line-clamp-1">{n.meta}</span>
                    )}
                  </Link>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/messages">Open messages</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-0.5 flex items-center gap-2 rounded-xl p-1 outline-none transition hover:bg-muted"
            >
              <Avatar className="h-8 w-8 border lg:h-9 lg:w-9">
                <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <span>{session?.user?.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {session?.user?.role
                    ? roleLabel(session.user.role)
                    : role
                      ? roleLabel(role)
                      : "Member"}
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

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput
          placeholder="Search pages and properties…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>{pending ? "Searching…" : "No results found."}</CommandEmpty>
          {pageHits.length > 0 && (
            <CommandGroup heading="Pages">
              {pageHits.map((h) => (
                <CommandItem
                  key={h.id}
                  value={`${h.label} ${h.href}`}
                  onSelect={() => {
                    setSearchOpen(false);
                    setQuery("");
                    router.push(h.href);
                  }}
                >
                  {h.label}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {propertyHits.length > 0 && (
            <CommandGroup heading="Properties">
              {propertyHits.map((h) => (
                <CommandItem
                  key={h.id}
                  value={`${h.label} ${h.href}`}
                  onSelect={() => {
                    setSearchOpen(false);
                    setQuery("");
                    router.push(h.href);
                  }}
                >
                  {h.label}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="font-display text-xl font-semibold tracking-tight lg:text-2xl">{title}</h1>
      <div className="flex flex-wrap items-center gap-2">
        {onAddWidget && (
          <Button variant="outline" size="sm" className="h-9 rounded-xl bg-card" onClick={onAddWidget}>
            + Add widget
          </Button>
        )}
        {onExport && (
          <Button size="sm" className="h-9 rounded-xl" onClick={onExport}>
            Export
          </Button>
        )}
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
