import Link from "next/link";
import { getAdminSession } from "@/lib/auth/admin";
import { adminSignOut } from "@/admin-auth";
import { getAdminPendingBadges } from "@/lib/actions/admin-badges";
import {
  getAdminUnreadNotificationCount,
  listAdminNotifications,
} from "@/lib/actions/admin-notifications";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminNotificationBell } from "@/components/admin/admin-notification-bell";
import { AdminGlobalSearch } from "@/components/admin/admin-global-search";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  const isAuthed = Boolean(session?.user?.id && session.user.role === "ADMIN");

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#1a2332_0%,_#0f1419_55%)] text-ink-foreground">
        {children}
      </div>
    );
  }

  const [badges, notifications, unreadCount] = await Promise.all([
    getAdminPendingBadges(),
    listAdminNotifications({ take: 8 }),
    getAdminUnreadNotificationCount(),
  ]);

  async function signOutAction() {
    "use server";
    await adminSignOut({ redirectTo: "/admin/login" });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar email={session?.user?.email} badges={badges} signOutAction={signOutAction} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border/60 bg-card px-4 md:px-6">
          <Link href="/admin" className="font-display text-sm font-semibold md:hidden">
            Admin
          </Link>
          <AdminGlobalSearch />
          <div className="ml-auto flex items-center gap-2">
            <AdminNotificationBell items={notifications} unreadCount={unreadCount} />
            <Link href="/" className="hidden text-xs text-muted-foreground hover:text-foreground sm:inline">
              Public site →
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
