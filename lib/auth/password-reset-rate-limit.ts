/** Exponential cooldown for password-reset emails (per process / email key). */

const BASE_SECONDS = 60;
const MAX_SECONDS = 60 * 60;

type Bucket = {
  attempts: number;
  nextAllowedAt: number;
};

const buckets = new Map<string, Bucket>();

export function passwordResetDelaySeconds(attemptsAfterSend: number): number {
  const exp = Math.max(0, attemptsAfterSend - 1);
  return Math.min(BASE_SECONDS * 2 ** exp, MAX_SECONDS);
}

export function checkPasswordResetAllowed(emailKey: string): {
  allowed: boolean;
  retryAfterSeconds: number;
  attempts: number;
} {
  const key = emailKey.trim().toLowerCase();
  const now = Date.now();
  const row = buckets.get(key);
  if (!row) return { allowed: true, retryAfterSeconds: 0, attempts: 0 };
  if (now >= row.nextAllowedAt) {
    return { allowed: true, retryAfterSeconds: 0, attempts: row.attempts };
  }
  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((row.nextAllowedAt - now) / 1000)),
    attempts: row.attempts,
  };
}

export function recordPasswordResetRequest(emailKey: string): {
  attempts: number;
  retryAfterSeconds: number;
} {
  const key = emailKey.trim().toLowerCase();
  const prev = buckets.get(key);
  const attempts = (prev?.attempts ?? 0) + 1;
  const retryAfterSeconds = passwordResetDelaySeconds(attempts);
  buckets.set(key, {
    attempts,
    nextAllowedAt: Date.now() + retryAfterSeconds * 1000,
  });
  return { attempts, retryAfterSeconds };
}

export function resetPasswordResetRateLimitForTests() {
  buckets.clear();
}
