import Link from "next/link";
import { cn } from "@/lib/utils";

export function AdminStatCard({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: number | string;
  href?: string;
  tone?: "warn" | "danger";
}) {
  const body = (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-card p-3.5 shadow-sm transition",
        href && "hover:shadow-md",
        tone === "warn" && "border-amber-200 bg-amber-50/50",
        tone === "danger" && "border-red-200 bg-red-50/50",
      )}
    >
      <p className="font-display text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function AdminEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border/70 bg-card px-4 py-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

export function AdminKeyValue({
  items,
}: {
  items: { label: string; value: React.ReactNode }[];
}) {
  return (
    <dl className="grid gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
      {items.map((i) => (
        <div key={i.label} className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{i.label}</dt>
          <dd className="mt-0.5 break-words">{i.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
