"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Calendar,
  Eye,
  Home,
  MessageSquare,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import type { DashboardData } from "@/lib/dashboard/get-dashboard-data";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { DashboardPageToolbar } from "@/components/dashboard/dashboard-header";
import { DashboardKpiGrid } from "@/components/dashboard/dashboard-kpi-grid";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import {
  DashboardDataTable,
  DashboardTableCell,
  DashboardTableHead,
  Table,
  TableBody,
  TableHeader,
  TableRow,
} from "@/components/dashboard/dashboard-data-table";
import { AddWidgetModal } from "@/components/dashboard/add-widget-modal";
import { cn } from "@/lib/utils";
import { imageSrc, resolveImage } from "@/lib/properties";

const trendChartConfig = {
  value: { label: "Tour requests", color: "#19403d" },
};

const dayChartConfig = {
  count: { label: "Activity", color: "#19403d" },
};

type DashboardOverviewProps = {
  data: DashboardData;
};

export function DashboardOverview({ data }: DashboardOverviewProps) {
  const [widgetOpen, setWidgetOpen] = useState(false);
  const { stats, role } = data;
  const isOwner = role === "AGENT";
  const isArtisan = role === "ARTISAN";
  const isAdmin = role === "ADMIN";

  const kpis = isAdmin
    ? [
        { label: "Pending verifications", value: String(stats.pendingVerifications ?? 0), trend: stats.listingsTrend, icon: Home },
        { label: "Verified listings", value: stats.listings.toLocaleString(), trend: stats.propertyViewsTrend, icon: Eye },
        { label: "Unread messages", value: stats.messages.toLocaleString(), trend: stats.messagesTrend, icon: MessageSquare },
        { label: "Tour requests (platform)", value: stats.tourRequests.toLocaleString(), trend: stats.tourRequestsTrend, icon: Calendar },
      ]
    : isArtisan
      ? [
          { label: "Open jobs", value: String(stats.openJobs ?? 0), trend: stats.tourRequestsTrend, icon: Calendar },
          { label: "Escrow held", value: `$${stats.escrowHeld ?? 0}`, trend: stats.propertyViewsTrend, icon: Eye },
          { label: "Released earnings", value: `$${stats.escrowReleased ?? 0}`, trend: stats.listingsTrend, icon: Home },
          { label: "Unread messages", value: stats.messages.toLocaleString(), trend: stats.messagesTrend, icon: MessageSquare },
        ]
      : isOwner
        ? [
            { label: "Listing reach", value: stats.propertyViews.toLocaleString(), trend: stats.propertyViewsTrend, icon: Eye },
            { label: "Tour requests", value: stats.tourRequests.toLocaleString(), trend: stats.tourRequestsTrend, icon: Calendar },
            { label: "Escrow held", value: `$${stats.escrowHeld ?? 0}`, trend: stats.messagesTrend, icon: MessageSquare },
            { label: "Active listings", value: stats.listings.toLocaleString(), trend: stats.listingsTrend, icon: Home },
          ]
        : [
            { label: "Activity score", value: stats.propertyViews.toLocaleString(), trend: stats.propertyViewsTrend, icon: Eye },
            { label: "Bookings", value: stats.tourRequests.toLocaleString(), trend: stats.tourRequestsTrend, icon: Calendar },
            { label: "Unread messages", value: stats.messages.toLocaleString(), trend: stats.messagesTrend, icon: MessageSquare },
            { label: "Saved homes", value: String(stats.savedHomes ?? 0), trend: stats.listingsTrend, icon: Home },
          ];

  const totalTrend = data.bookingTrend.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-4">
      <DashboardPageToolbar
        onAddWidget={() => setWidgetOpen(true)}
        onExport={() => undefined}
      />

      <DashboardKpiGrid items={kpis} />

      <div className="grid gap-3 xl:grid-cols-3">
        <DashboardPanel className="xl:col-span-2" bodyClassName="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Total activity</p>
              <div className="mt-0.5 flex items-end gap-2">
                <p className="font-display text-2xl font-semibold">{totalTrend.toLocaleString()}</p>
                <span className="mb-0.5 flex items-center gap-1 text-xs text-success">
                  <TrendingUp size={12} /> +24.4% vs last period
                </span>
              </div>
            </div>
            <div className="flex gap-1.5 text-[11px]">
              <span className="rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary">Tours</span>
              <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">Messages</span>
            </div>
          </div>
          <ChartContainer config={trendChartConfig} className="h-[220px] w-full aspect-auto">
            <AreaChart data={data.bookingTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
              <YAxis tickLine={false} axisLine={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="value" stroke="var(--color-value)" fill="url(#fillTrend)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>

          <div className="grid gap-2 sm:grid-cols-3">
            {data.segments.map((seg) => (
              <div
                key={seg.label}
                className={cn(
                  "rounded-lg border px-3 py-2",
                  seg.tone === "blue" && "border-blue-200/60 bg-blue-50/50",
                  seg.tone === "green" && "border-emerald-200/60 bg-emerald-50/50",
                  seg.tone === "orange" && "border-orange-200/60 bg-orange-50/50",
                )}
              >
                <p className="text-[11px] text-muted-foreground">{seg.label}</p>
                <p className="mt-0.5 font-display text-lg font-semibold">{seg.count.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </DashboardPanel>

        <div className="space-y-3">
          <DashboardPanel title="Most day active">
            <ChartContainer config={dayChartConfig} className="h-[160px] w-full aspect-auto">
              <BarChart data={data.activeByDay} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={20} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </DashboardPanel>

          <DashboardPanel title="Tour approval rate">
            <div className="flex items-center justify-center">
              <div className="relative h-28 w-28">
                <ChartContainer
                  config={{ rate: { label: "Rate", color: "oklch(0.34 0.045 175)" } }}
                  className="h-full w-full aspect-square"
                >
                  <PieChart>
                    <Pie
                      data={[
                        { name: "approved", value: data.engagementRate },
                        { name: "remaining", value: 100 - data.engagementRate },
                      ]}
                      dataKey="value"
                      innerRadius={40}
                      outerRadius={52}
                      startAngle={90}
                      endAngle={-270}
                      strokeWidth={0}
                    >
                      <Cell fill="var(--color-rate)" />
                      <Cell fill="hsl(var(--muted))" />
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-xl font-semibold">{data.engagementRate}%</span>
                </div>
              </div>
            </div>
            <p className="mt-1 text-center text-[11px] text-muted-foreground">On track for 80% target</p>
            <Link
              href="/dashboard/bookings"
              className="mt-2 block text-center text-xs font-medium text-primary hover:underline"
            >
              Show details
            </Link>
          </DashboardPanel>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <DashboardDataTable
          className="xl:col-span-2"
          toolbar={
            <>
              <p className="text-sm font-medium">
                {isOwner ? "Top performing listings" : "Featured properties"}
              </p>
              <Link
                href={isOwner ? "/dashboard/listings" : "/properties"}
                className="text-xs text-primary hover:underline"
              >
                View all
              </Link>
            </>
          }
        >
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <DashboardTableHead>Property</DashboardTableHead>
                <DashboardTableHead className="text-right">Tours</DashboardTableHead>
                <DashboardTableHead className="text-right">Price</DashboardTableHead>
                <DashboardTableHead className="text-right">Rating</DashboardTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topProperties.map((p) => (
                <TableRow key={p.id} className="border-border/40 hover:bg-muted/20">
                  <DashboardTableCell>
                    <Link href={`/properties/${p.id}`} className="flex items-center gap-2.5">
                      <img
                        src={imageSrc(resolveImage(p.image))}
                        alt={p.title}
                        className="h-8 w-8 rounded-md object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium leading-tight">{p.title}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{p.location}</p>
                      </div>
                    </Link>
                  </DashboardTableCell>
                  <DashboardTableCell className="text-right tabular-nums">{p.tours}</DashboardTableCell>
                  <DashboardTableCell
                    className={cn(
                      "text-right tabular-nums",
                      p.trend >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    ${p.price.toLocaleString()}
                  </DashboardTableCell>
                  <DashboardTableCell className="text-right">
                    <span className="inline-flex items-center justify-end gap-1">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      {p.rating.toFixed(1)}
                    </span>
                  </DashboardTableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DashboardDataTable>

        <DashboardPanel>
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/15">
              <Sparkles size={14} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Trust snapshot</p>
              <p className="text-[11px] text-muted-foreground">Neighborhood & escrow status</p>
            </div>
          </div>
          <div className="mt-3 rounded-lg bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
            {data.trustSummary}
          </div>
          <div className="mt-3 grid gap-1.5">
            {isOwner ? (
              <Link
                href="/dashboard/listings"
                className="rounded-lg bg-primary px-3 py-2 text-center text-xs font-medium text-primary-foreground hover:brightness-105"
              >
                Manage listings
              </Link>
            ) : (
              <Link
                href="/properties"
                className="rounded-lg bg-primary px-3 py-2 text-center text-xs font-medium text-primary-foreground hover:brightness-105"
              >
                Browse verified homes
              </Link>
            )}
            {(role === "USER" || role === "AGENT") && (
              <Link
                href="/artisans"
                className="rounded-lg border border-border px-3 py-2 text-center text-xs font-medium hover:bg-muted"
              >
                Artisan hub
              </Link>
            )}
            {isArtisan && (
              <Link
                href="/dashboard/jobs"
                className="rounded-lg border border-border px-3 py-2 text-center text-xs font-medium hover:bg-muted"
              >
                View jobs
              </Link>
            )}
          </div>
        </DashboardPanel>
      </div>

      <AddWidgetModal open={widgetOpen} onOpenChange={setWidgetOpen} />
    </div>
  );
}
