import Link from "next/link";
import { requireRole } from "@/lib/auth/roles";
import { getAdminStats } from "@/lib/actions/admin";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { Eye, Home, ShieldCheck, Users, Wrench } from "lucide-react";
import { formatMoney } from "@/lib/currency";

export default async function AdminOverviewPage() {
  await requireRole(["ADMIN"]);
  const stats = await getAdminStats();

  const cards = [
    { label: "Users", value: String(stats?.users ?? 0), href: "/dashboard/admin/users", icon: Users },
    { label: "Agents", value: String(stats?.agents ?? 0), href: "/dashboard/admin/users", icon: Eye },
    { label: "Artisans", value: String(stats?.artisans ?? 0), href: "/dashboard/admin/artisans", icon: Wrench },
    { label: "Properties", value: String(stats?.properties ?? 0), href: "/dashboard/admin/properties", icon: Home },
    { label: "Pending KYC", value: String(stats?.pendingKyc ?? 0), href: "/dashboard/admin/verifications", icon: ShieldCheck },
    { label: "Pending listings", value: String(stats?.pendingProps ?? 0), href: "/dashboard/admin/verifications", icon: Home },
    { label: "Pending artisans", value: String(stats?.pendingArtisans ?? 0), href: "/dashboard/admin/verifications", icon: Wrench },
    { label: "Escrow held", value: formatMoney(stats?.escrowHeld ?? 0), href: "/dashboard/admin", icon: ShieldCheck },
  ];

  return (
    <DashboardSection
      title="Platform admin"
      description="Manage users, properties, artisans, verifications, and site content."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-xl border border-border/60 bg-card p-3.5 shadow-sm transition hover:shadow-md"
          >
            <div className="rounded-lg bg-muted p-2 text-muted-foreground w-fit">
              <c.icon size={16} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-0.5 font-display text-2xl font-semibold tracking-tight">{c.value}</p>
          </Link>
        ))}
      </div>

      <DashboardPanel title="Quick links" className="mt-4" bodyClassName="divide-y divide-border/50">
        <QuickLink href="/dashboard/admin/users" title="Users & agents" desc="Search, KYC, activate, change roles" />
        <QuickLink href="/dashboard/admin/properties" title="All properties" desc="Verify, feature, or remove listings" />
        <QuickLink href="/dashboard/admin/content" title="Site content" desc="Featured flags and about blurb" />
      </DashboardPanel>
    </DashboardSection>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="flex items-baseline justify-between gap-3 py-2.5 first:pt-0 last:pb-0 hover:bg-muted/30 -mx-1 px-1 rounded-md transition">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <span className="text-xs text-primary shrink-0">Open →</span>
    </Link>
  );
}
