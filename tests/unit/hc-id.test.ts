import { describe, expect, it } from "vitest";
import { formatHcId, nextHcSequence } from "@/lib/ids/hc-id";

describe("HC ID", () => {
  it("formats job seeker IDs", () => {
    expect(formatHcId("JOB", "ABJ", 245)).toBe("HC-JOB-ABJ-000245");
  });

  it("pads sequences", () => {
    expect(formatHcId("EMP", "LA", 1)).toBe("HC-EMP-LA-000001");
  });

  it("increments sequence", () => {
    expect(nextHcSequence(0)).toBe(1);
    expect(nextHcSequence(99)).toBe(100);
  });
});
