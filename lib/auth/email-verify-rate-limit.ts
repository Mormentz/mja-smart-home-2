/** Exponential cooldown for verification email resends (per process / email key). */

const BASE_SECONDS = 30;
const MAX_SECONDS = 60 * 60; // 1 hour

type Bucket = {
  attempts: number;
  nextAllowedAt: number;
};

const buckets = new Map<string, Bucket>();

export function verificationResendDelaySeconds(attemptsAfterSend: number): number {
  // After 1st send → 30s, 2nd → 60s, 3rd → 120s, …
  const exp = Math.max(0, attemptsAfterSend - 1);
  return Math.min(BASE_SECONDS * 2 ** exp, MAX_SECONDS);
}

export function checkVerificationResendAllowed(emailKey: string): {
  allowed: boolean;
  retryAfterSeconds: number;
  attempts: number;
} {
  const key = emailKey.trim().toLowerCase();
  const now = Date.now();
  const row = buckets.get(key);
  if (!row) {
    return { allowed: true, retryAfterSeconds: 0, attempts: 0 };
  }
  if (now >= row.nextAllowedAt) {
    return { allowed: true, retryAfterSeconds: 0, attempts: row.attempts };
  }
  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((row.nextAllowedAt - now) / 1000)),
    attempts: row.attempts,
  };
}

/** Record a successful (or attempted) send and schedule the next cooldown. */
export function recordVerificationResend(emailKey: string): {
  attempts: number;
  retryAfterSeconds: number;
  nextAllowedAt: number;
} {
  const key = emailKey.trim().toLowerCase();
  const prev = buckets.get(key);
  const attempts = (prev?.attempts ?? 0) + 1;
  const retryAfterSeconds = verificationResendDelaySeconds(attempts);
  const nextAllowedAt = Date.now() + retryAfterSeconds * 1000;
  buckets.set(key, { attempts, nextAllowedAt });
  return { attempts, retryAfterSeconds, nextAllowedAt };
}

export function resetVerificationResendRateLimitForTests() {
  buckets.clear();
}
