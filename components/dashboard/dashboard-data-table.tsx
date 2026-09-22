import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function DashboardDataTable({
  toolbar,
  children,
  className,
  empty,
}: {
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  empty?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm",
        className,
      )}
    >
      {toolbar && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 px-3 py-2.5">
          {toolbar}
        </div>
      )}
      <div className="overflow-x-auto">{children}</div>
      {empty}
    </div>
  );
}

export function DashboardTableHead({
  className,
  ...props
}: React.ComponentProps<typeof TableHead>) {
  return (
    <TableHead
      className={cn(
        "h-9 sticky top-0 z-10 bg-muted/40 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function DashboardTableCell({
  className,
  ...props
}: React.ComponentProps<typeof TableCell>) {
  return (
    <TableCell className={cn("px-3 py-2 align-middle text-sm", className)} {...props} />
  );
}

export function DashboardEmptyState({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-border/70 bg-card p-6 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export { Table, TableBody, TableHeader, TableRow };
