import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/admin";
import { getAdminStats } from "@/lib/actions/admin";
import { listAdminNotifications } from "@/lib/actions/admin-notifications";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { fmtDateTime } from "@/components/admin/admin-format";
import {
  Briefcase,
  Eye,
  Home,
  Lock,
  Scale,
  ShieldCheck,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { formatMoney } from "@/lib/currency";

export default async function AdminOverviewPage() {
  await requireAdminSession();
  const [stats, unread] = await Promise.all([
    getAdminStats(),
    listAdminNotifications({ unreadOnly: true, take: 8 }),
  ]);

  const cards = [
    { label: "Users", value: String(stats?.users ?? 0), href: "/admin/users", icon: Users },
    { label: "Agents", value: String(stats?.agents ?? 0), href: "/admin/users?role=AGENT", icon: Eye },
    { label: "Artisans", value: String(stats?.artisans ?? 0), href: "/admin/artisans", icon: Wrench },
    { label: "Properties", value: String(stats?.properties ?? 0), href: "/admin/properties", icon: Home },
    { label: "Pending KYC", value: String(stats?.pendingKyc ?? 0), href: "/admin/verifications", icon: ShieldCheck },
    { label: "Pending listings", value: String(stats?.pendingProps ?? 0), href: "/admin/properties?status=PENDING", icon: Home },
    { label: "Pending artisans", value: String(stats?.pendingArtisans ?? 0), href: "/admin/verifications", icon: Wrench },
    { label: "Escrow held", value: formatMoney(stats?.escrowHeld ?? 0), href: "/admin/escrow", icon: Wallet },
    { label: "Open jobs", value: String(stats?.openJobs ?? 0), href: "/admin/jobs", icon: Briefcase },
    { label: "Rental disputes", value: String(stats?.openDisputes ?? 0), href: "/admin/rentals?tab=disputes&status=OPEN", icon: Scale },
    { label: "Privacy requests", value: String(stats?.openPrivacy ?? 0), href: "/admin/security?tab=privacy", icon: Lock },
    { label: "Open flags", value: String(stats?.openFlags ?? 0), href: "/admin/security", icon: ShieldCheck },
  ];

  return (
    <DashboardSection
      title="Platform admin"
      description="Manage users, properties, rentals, escrow, verifications, and site content."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-xl border border-border/60 bg-card p-3.5 shadow-sm transition hover:shadow-md"
          >
            <div className="w-fit rounded-lg bg-muted p-2 text-muted-foreground">
              <c.icon size={16} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-0.5 font-display text-2xl font-semibold tracking-tight">{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <DashboardPanel
          title="Attention needed"
          description="Unread admin notifications that need action."
          actions={
            <Link href="/admin/notifications" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          }
          bodyClassName="divide-y divide-border/50"
        >
          {unread.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">You&apos;re all caught up.</p>
          ) : (
            unread.map((n) => {
              const inner = (
                <div className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.body && <p className="line-clamp-1 text-xs text-muted-foreground">{n.body}</p>}
                    <p className="text-[11px] text-muted-foreground">{fmtDateTime(n.createdAt)}</p>
                  </div>
                  <AdminStatusBadge status={n.severity} />
                </div>
              );
              return n.href ? (
                <Link key={n.id} href={n.href} className="-mx-1 block rounded-md px-1 transition hover:bg-muted/30">
                  {inner}
                </Link>
              ) : (
                <div key={n.id}>{inner}</div>
              );
            })
          )}
        </DashboardPanel>

        <DashboardPanel title="Quick links" bodyClassName="divide-y divide-border/50">
          <QuickLink href="/admin/users" title="Users & agents" desc="Search, KYC, activate, change roles" />
          <QuickLink href="/admin/properties" title="All properties" desc="Edit, verify, feature, or remove listings" />
          <QuickLink
            href="/admin/escrow"
            title="Escrow"
            desc={`${formatMoney(stats?.escrowHeld ?? 0)} held — release or refund`}
          />
          <QuickLink
            href="/admin/bookings"
            title="Bookings"
            desc={`${stats?.pendingTours ?? 0} tour request${stats?.pendingTours === 1 ? "" : "s"} awaiting approval`}
          />
          <QuickLink
            href="/admin/leases"
            title="Leases"
            desc={`${stats?.activeLeases ?? 0} active lease${stats?.activeLeases === 1 ? "" : "s"}`}
          />
          <QuickLink href="/admin/content" title="Site content" desc="Copy, banner, support contacts, featured homes" />
        </DashboardPanel>
      </div>
    </DashboardSection>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="-mx-1 flex items-baseline justify-between gap-3 rounded-md px-1 py-2.5 transition first:pt-0 last:pb-0 hover:bg-muted/30"
    >
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <span className="shrink-0 text-xs text-primary">Open →</span>
    </Link>
  );
}
