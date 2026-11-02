import { describe, expect, it, beforeEach } from "vitest";
import {
  checkVerificationResendAllowed,
  recordVerificationResend,
  resetVerificationResendRateLimitForTests,
  verificationResendDelaySeconds,
} from "@/lib/auth/email-verify-rate-limit";

describe("email verification resend rate limit", () => {
  beforeEach(() => {
    resetVerificationResendRateLimitForTests();
  });

  it("grows exponentially then caps", () => {
    expect(verificationResendDelaySeconds(1)).toBe(30);
    expect(verificationResendDelaySeconds(2)).toBe(60);
    expect(verificationResendDelaySeconds(3)).toBe(120);
    expect(verificationResendDelaySeconds(4)).toBe(240);
    expect(verificationResendDelaySeconds(10)).toBe(60 * 60);
  });

  it("blocks until cooldown elapses", () => {
    expect(checkVerificationResendAllowed("a@example.com").allowed).toBe(true);
    const first = recordVerificationResend("a@example.com");
    expect(first.attempts).toBe(1);
    expect(first.retryAfterSeconds).toBe(30);

    const blocked = checkVerificationResendAllowed("a@example.com");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});
