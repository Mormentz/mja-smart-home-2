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
import { DashboardKpiBadge, DashboardPageToolbar } from "@/components/dashboard/dashboard-header";
import { AddWidgetModal } from "@/components/dashboard/add-widget-modal";
import { cn } from "@/lib/utils";
import p1 from "@/assets/property-1.jpg";
import p2 from "@/assets/property-2.jpg";
import p3 from "@/assets/property-3.jpg";

const IMAGE_MAP: Record<string, string> = {
  "property-1.jpg": p1.src,
  "property-2.jpg": p2.src,
  "property-3.jpg": p3.src,
};

function resolveImage(key: string) {
  return IMAGE_MAP[key] ?? p1.src;
}

const trendChartConfig = {
  value: { label: "Tour requests", color: "oklch(0.34 0.045 175)" },
};

const dayChartConfig = {
  count: { label: "Activity", color: "oklch(0.34 0.045 175)" },
};

type DashboardOverviewProps = {
  data: DashboardData;
};

export function DashboardOverview({ data }: DashboardOverviewProps) {
  const [widgetOpen, setWidgetOpen] = useState(false);
  const { stats, role } = data;
  const isOwner = role === "LANDLORD" || role === "AGENT";

  const kpis = isOwner
    ? [
        { label: "Listing views", value: stats.propertyViews.toLocaleString(), trend: stats.propertyViewsTrend, icon: Eye },
        { label: "Tour requests", value: stats.tourRequests.toLocaleString(), trend: stats.tourRequestsTrend, icon: Calendar },
        { label: "Unread messages", value: stats.messages.toLocaleString(), trend: stats.messagesTrend, icon: MessageSquare },
        { label: "Active listings", value: stats.listings.toLocaleString(), trend: stats.listingsTrend, icon: Home },
      ]
    : [
        { label: "Properties viewed", value: stats.propertyViews.toLocaleString(), trend: stats.propertyViewsTrend, icon: Eye },
        { label: "Tour requests", value: stats.tourRequests.toLocaleString(), trend: stats.tourRequestsTrend, icon: Calendar },
        { label: "Unread messages", value: stats.messages.toLocaleString(), trend: stats.messagesTrend, icon: MessageSquare },
        { label: "Saved homes", value: "12", trend: 4.4, icon: Home },
      ];

  const totalTrend = data.bookingTrend.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-6">
      <DashboardPageToolbar
        onAddWidget={() => setWidgetOpen(true)}
        onExport={() => undefined}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-muted p-2.5 text-muted-foreground">
                <kpi.icon size={18} />
              </div>
              <DashboardKpiBadge value={kpi.trend} positive={kpi.trend >= 0} />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{kpi.label}</p>
            <p className="mt-1 font-display text-3xl font-semibold tracking-tight">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Total activity</p>
              <div className="mt-1 flex items-end gap-2">
                <p className="font-display text-3xl font-semibold">{totalTrend.toLocaleString()}</p>
                <span className="mb-1 flex items-center gap-1 text-sm text-success">
                  <TrendingUp size={14} /> +24.4% vs last period
                </span>
              </div>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-primary font-medium">Tours</span>
              <span className="rounded-lg bg-muted px-2.5 py-1 text-muted-foreground">Messages</span>
            </div>
          </div>
          <ChartContainer config={trendChartConfig} className="mt-6 h-[280px] w-full aspect-auto">
            <AreaChart data={data.bookingTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
              <YAxis tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="value" stroke="var(--color-value)" fill="url(#fillTrend)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {data.segments.map((seg) => (
              <div
                key={seg.label}
                className={cn(
                  "rounded-xl border px-4 py-3",
                  seg.tone === "blue" && "border-blue-200/60 bg-blue-50/50",
                  seg.tone === "green" && "border-emerald-200/60 bg-emerald-50/50",
                  seg.tone === "orange" && "border-orange-200/60 bg-orange-50/50",
                )}
              >
                <p className="text-xs text-muted-foreground">{seg.label}</p>
                <p className="mt-1 font-display text-xl font-semibold">{seg.count.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <p className="font-medium">Most day active</p>
            <ChartContainer config={dayChartConfig} className="mt-4 h-[220px] w-full aspect-auto">
              <BarChart data={data.activeByDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={24} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <p className="font-medium">Tour approval rate</p>
            <div className="mt-4 flex items-center justify-center">
              <div className="relative h-36 w-36">
                <ChartContainer config={{ rate: { label: "Rate", color: "oklch(0.34 0.045 175)" } }} className="h-full w-full aspect-square">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "approved", value: data.engagementRate },
                        { name: "remaining", value: 100 - data.engagementRate },
                      ]}
                      dataKey="value"
                      innerRadius={52}
                      outerRadius={68}
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
                  <span className="font-display text-2xl font-semibold">{data.engagementRate}%</span>
                </div>
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">On track for 80% target</p>
            <Link href="/dashboard/bookings" className="mt-3 block text-center text-sm font-medium text-primary hover:underline">
              Show details
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
            <p className="font-medium">{isOwner ? "Top performing listings" : "Featured properties"}</p>
            <Link href={isOwner ? "/dashboard/listings" : "/properties"} className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Property</th>
                  <th className="px-5 py-3 text-left font-medium">Tours</th>
                  <th className="px-5 py-3 text-left font-medium">Price</th>
                  <th className="px-5 py-3 text-left font-medium">Rating</th>
                </tr>
              </thead>
              <tbody>
                {data.topProperties.map((p) => (
                  <tr key={p.id} className="border-t border-border/40 hover:bg-muted/20">
                    <td className="px-5 py-3">
                      <Link href={`/properties/${p.id}`} className="flex items-center gap-3">
                        <img
                          src={resolveImage(p.image)}
                          alt={p.title}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium">{p.title}</p>
                          <p className="text-xs text-muted-foreground">{p.location}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3">{p.tours}</td>
                    <td className="px-5 py-3">
                      <span className={cn(p.trend >= 0 ? "text-success" : "text-destructive")}>
                        ${p.price.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1">
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        {p.rating.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15">
              <Sparkles size={18} className="text-primary" />
            </div>
            <div>
              <p className="font-medium">HomeConnect AI</p>
              <p className="text-xs text-muted-foreground">Your property assistant</p>
            </div>
          </div>
          <div className="mt-4 flex-1 rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground leading-relaxed">
            Ask about neighborhoods, tour scheduling, listing performance, or market trends in Lagos.
          </div>
          <div className="mt-4 flex gap-2">
            <input
              placeholder="Ask me anything..."
              className="flex-1 rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              className="rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:brightness-105"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <AddWidgetModal open={widgetOpen} onOpenChange={setWidgetOpen} />
    </div>
  );
}
