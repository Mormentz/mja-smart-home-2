/** Pure helper for agent tour approval rate. */
export function computeTourApprovalRate(bookings: { status: string; kind?: string | null }[]) {
  const tours = bookings.filter((b) => !b.kind || b.kind === "TOUR");
  const total = tours.length;
  const approved = tours.filter((b) => b.status === "APPROVED").length;
  const rate = total > 0 ? Math.round((approved / total) * 100) : 0;
  return { total, approved, rate };
}
