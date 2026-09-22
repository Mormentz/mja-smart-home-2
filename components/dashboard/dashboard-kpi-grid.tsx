import type { LucideIcon } from "lucide-react";
import { DashboardKpiBadge } from "@/components/dashboard/dashboard-header";
import { cn } from "@/lib/utils";

export type DashboardKpi = {
  label: string;
  value: string;
  trend?: number;
  icon: LucideIcon;
};

export function DashboardKpiGrid({
  items,
  className,
}: {
  items: DashboardKpi[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {items.map((kpi) => (
        <div
          key={kpi.label}
          className="rounded-xl border border-border/60 bg-card p-3.5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="rounded-lg bg-muted p-2 text-muted-foreground">
              <kpi.icon size={16} />
            </div>
            {typeof kpi.trend === "number" && (
              <DashboardKpiBadge value={kpi.trend} positive={kpi.trend >= 0} />
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{kpi.label}</p>
          <p className="mt-0.5 font-display text-2xl font-semibold tracking-tight">{kpi.value}</p>
        </div>
      ))}
    </div>
  );
}
