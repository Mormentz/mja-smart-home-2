import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { cn } from "@/lib/utils";

export function AdminDetailShell({
  backHref,
  backLabel = "Back",
  title,
  subtitle,
  status,
  actions,
  children,
  className,
}: {
  backHref: string;
  backLabel?: string;
  title: string;
  subtitle?: string;
  status?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={14} /> {backLabel}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl font-semibold tracking-tight">{title}</h1>
            {status && <AdminStatusBadge status={status} />}
          </div>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
