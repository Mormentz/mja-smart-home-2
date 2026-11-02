"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export type AdminTabItem = {
  id: string;
  label: string;
  count?: number;
};

export function AdminTabs({
  tabs,
  param = "tab",
  defaultTab,
  className,
}: {
  tabs: AdminTabItem[];
  param?: string;
  defaultTab?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get(param) || defaultTab || tabs[0]?.id;

  return (
    <div className={cn("flex flex-wrap gap-1 border-b border-border/60 pb-px", className)}>
      {tabs.map((tab) => {
        const sp = new URLSearchParams(searchParams.toString());
        sp.set(param, tab.id);
        const href = `${pathname}?${sp.toString()}`;
        const isActive = active === tab.id;
        return (
          <Link
            key={tab.id}
            href={href}
            scroll={false}
            className={cn(
              "-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {typeof tab.count === "number" && tab.count > 0 && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                {tab.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export function AdminStatusTabs({
  counts,
}: {
  counts?: { pending?: number; approved?: number; rejected?: number };
}) {
  return (
    <AdminTabs
      param="status"
      defaultTab="pending"
      tabs={[
        { id: "pending", label: "Pending", count: counts?.pending },
        { id: "approved", label: "Approved", count: counts?.approved },
        { id: "rejected", label: "Rejected", count: counts?.rejected },
      ]}
    />
  );
}
