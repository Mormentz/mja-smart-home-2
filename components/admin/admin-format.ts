export function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function personLabel(
  p: { name?: string | null; email?: string | null } | null | undefined,
) {
  if (!p) return "—";
  return p.name || p.email || "—";
}

export function humanize(v: string | null | undefined) {
  return v ? v.replace(/_/g, " ").toLowerCase() : "—";
}
