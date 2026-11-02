import { describe, expect, it } from "vitest";
import { estimateRentalTotal } from "@/lib/rentals/pricing";
import { canViewCv, checkCvViewRateLimit, resetCvViewRateLimitForTests, watermarkText } from "@/lib/jobs/cv-access";

describe("rental pricing", () => {
  it("estimates daily band with deposit", () => {
    const start = new Date("2026-01-01T10:00:00Z");
    const end = new Date("2026-01-03T10:00:00Z");
    const r = estimateRentalTotal({
      start,
      end,
      dailyPrice: 10000,
      securityDeposit: 5000,
      pickupOrDelivery: "PICKUP",
      pickupCharge: 1000,
    });
    expect(r.rentalSubtotal).toBe(20000);
    expect(r.deposit).toBe(5000);
    expect(r.deliveryOrPickup).toBe(1000);
    expect(r.estimatedTotal).toBe(26000);
  });
});

describe("cv access", () => {
  it("enforces levels", () => {
    expect(canViewCv(null)).toBe(false);
    expect(canViewCv("PRIVATE", "APPLICATION")).toBe(false);
    expect(canViewCv("APPLICATION", "APPLICATION")).toBe(true);
    expect(canViewCv("AUTHORIZED", "APPLICATION")).toBe(true);
  });

  it("rate limits and watermarks", () => {
    resetCvViewRateLimitForTests();
    for (let i = 0; i < 40; i++) expect(checkCvViewRateLimit("u1", 40)).toBe(true);
    expect(checkCvViewRateLimit("u1", 40)).toBe(false);
    expect(watermarkText("HC-EMP-ABJ-1")).toContain("HC-EMP-ABJ-1");
  });
});
