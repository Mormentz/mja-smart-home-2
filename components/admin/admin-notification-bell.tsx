"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { markAdminNotificationRead, markAllAdminNotificationsRead } from "@/lib/actions/admin-notifications";
import { cn } from "@/lib/utils";

type Notif = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  severity: string;
  createdAt: Date | string;
  readAt: Date | string | null;
};

export function AdminNotificationBell({
  items,
  unreadCount,
}: {
  items: Notif[];
  unreadCount: number;
}) {
  const router = useRouter();

  async function openItem(n: Notif) {
    if (!n.readAt) await markAdminNotificationRead(n.id);
    if (n.href) router.push(n.href);
    else router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative grid h-9 w-9 place-items-center rounded-full border border-border/80 transition hover:bg-muted"
          aria-label="Admin notifications"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-[11px] font-medium text-primary hover:underline"
              onClick={async () => {
                await markAllAdminNotificationsRead();
                router.refresh();
              }}
            >
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">No notifications</p>
        )}
        {items.map((n) => (
          <DropdownMenuItem
            key={n.id}
            className={cn("flex cursor-pointer flex-col items-start gap-0.5 py-2", !n.readAt && "bg-amber-50/50")}
            onClick={() => openItem(n)}
          >
            <span className="text-sm font-medium leading-tight">{n.title}</span>
            {n.body && <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>}
            <span className="text-[10px] text-muted-foreground">
              {new Date(n.createdAt).toLocaleString()}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin/notifications" className="w-full justify-center text-xs font-medium">
            View all
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
