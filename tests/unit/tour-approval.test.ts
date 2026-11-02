import { describe, expect, it } from "vitest";
import { computeTourApprovalRate } from "@/lib/dashboard/tour-approval";

describe("computeTourApprovalRate", () => {
  it("counts only tours", () => {
    const r = computeTourApprovalRate([
      { status: "APPROVED", kind: "TOUR" },
      { status: "PENDING", kind: "TOUR" },
      { status: "APPROVED", kind: "PURCHASE_INTEREST" },
    ]);
    expect(r.total).toBe(2);
    expect(r.approved).toBe(1);
    expect(r.rate).toBe(50);
  });

  it("handles empty", () => {
    expect(computeTourApprovalRate([])).toEqual({ total: 0, approved: 0, rate: 0 });
  });
});
