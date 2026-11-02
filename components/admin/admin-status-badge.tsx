import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-900",
  PENDING_REVIEW: "border-amber-200 bg-amber-50 text-amber-900",
  UNDER_REVIEW: "border-amber-200 bg-amber-50 text-amber-900",
  UNVERIFIED: "border-border bg-muted text-muted-foreground",
  VERIFIED: "border-emerald-200 bg-emerald-50 text-emerald-900",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-900",
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-900",
  HELD: "border-emerald-200 bg-emerald-50 text-emerald-900",
  REJECTED: "border-red-200 bg-red-50 text-red-900",
  CANCELLED: "border-red-200 bg-red-50 text-red-900",
  SUSPENDED: "border-red-200 bg-red-50 text-red-900",
  OPEN: "border-amber-200 bg-amber-50 text-amber-900",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-900",
  CLOSED: "border-border bg-muted text-muted-foreground",
  DRAFT: "border-border bg-muted text-muted-foreground",
  RELEASED: "border-sky-200 bg-sky-50 text-sky-900",
  REFUNDED: "border-violet-200 bg-violet-50 text-violet-900",
};

export function AdminStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const key = status.toUpperCase();
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium capitalize",
        STATUS_STYLES[key] ?? "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      {status.replace(/_/g, " ").toLowerCase()}
    </Badge>
  );
}
