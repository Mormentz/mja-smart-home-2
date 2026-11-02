import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/admin";
import {
  listAdminNotifications,
  markAllAdminNotificationsRead,
  markAdminNotificationRead,
} from "@/lib/actions/admin-notifications";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { Button } from "@/components/ui/button";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";

export default async function AdminNotificationsPage() {
  await requireAdminSession();
  const items = await listAdminNotifications({ take: 100 });

  async function markAll() {
    "use server";
    await markAllAdminNotificationsRead();
  }

  return (
    <DashboardSection
      title="Notifications"
      description="Action items and platform alerts for admins."
    >
      <div className="mb-3 flex justify-end">
        <form action={markAll}>
          <Button type="submit" variant="outline" size="sm">
            Mark all read
          </Button>
        </form>
      </div>
      <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-card">
        {items.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">No notifications yet.</p>
        )}
        {items.map((n) => (
          <div
            key={n.id}
            className={`flex flex-wrap items-start justify-between gap-3 px-4 py-3 ${!n.readAt ? "bg-amber-50/40" : ""}`}
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{n.title}</p>
                <AdminStatusBadge status={n.severity} />
                {!n.readAt && (
                  <span className="text-[10px] font-semibold uppercase text-amber-700">Unread</span>
                )}
              </div>
              {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
              <p className="text-[11px] text-muted-foreground">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {n.href && (
                <Button size="sm" variant="secondary" asChild>
                  <Link href={n.href}>Open</Link>
                </Button>
              )}
              {!n.readAt && (
                <form
                  action={async () => {
                    "use server";
                    await markAdminNotificationRead(n.id);
                  }}
                >
                  <Button type="submit" size="sm" variant="ghost">
                    Mark read
                  </Button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </DashboardSection>
  );
}
