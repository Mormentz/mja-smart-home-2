import type { CvAccessLevel } from "@prisma/client";

const RANK: Record<CvAccessLevel, number> = {
  PRIVATE: 0,
  APPLICATION: 1,
  AUTHORIZED: 2,
};

export function canViewCv(
  grantLevel: CvAccessLevel | null | undefined,
  required: CvAccessLevel = "APPLICATION",
): boolean {
  if (!grantLevel) return false;
  return RANK[grantLevel] >= RANK[required];
}

export function watermarkText(viewerHcId: string | null | undefined, viewerEmail?: string | null) {
  const who = viewerHcId || viewerEmail || "authorized-viewer";
  return `HomeConnect confidential — ${who} — ${new Date().toISOString()}`;
}

/** Simple in-memory rate limiter for CV views (per process). */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkCvViewRateLimit(userId: string, limit = 40, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now();
  const row = buckets.get(userId);
  if (!row || row.resetAt < now) {
    buckets.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (row.count >= limit) return false;
  row.count += 1;
  return true;
}

export function resetCvViewRateLimitForTests() {
  buckets.clear();
}
