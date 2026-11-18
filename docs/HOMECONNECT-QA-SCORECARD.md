# Intensive QA scorecard — 2026-11-18

Environment: local `http://localhost:3000` · Postgres `:5433` · seed demos + yopmail fresh accounts  
Full row log: [INTENSIVE-QA-RESULTS.md](./INTENSIVE-QA-RESULTS.md)

## Phase results

| Phase | Verdict | Notes |
|-------|---------|-------|
| Preflight | **PASS** | Prisma generate/push, seed, vitest 11/11, Next Ready |
| 0 Public | **PASS** | All public/auth routes HTTP 200; nav triad OK; `/artisans`→`/services` |
| 1 Admin | **PASS** | Consumer rejects ADMIN; all `/admin/*` routes 200 via session; legacy redirect 307 |
| 2 USER | **PASS** | Sidebar correct; all dashboard pages 200; bookings/leases/jobs present in DB |
| 2D Escrow | **PASS** | Agent handover UI + dual confirm → wallet credit (bal after credit) |
| 3 AGENT | **PASS** | Listings/wallet/leases/rentals list; withdrawal request created |
| 4 ARTISAN | **PASS** | Onboarding/services/jobs; available; accept action present |
| 5 Admin writes | **PASS** | Search/verifications/escrow/withdrawals/content/security/notifications; withdrawal PAID |
| 6 Privacy | **PASS** | Seekers page no NIN dump; rental browse OK; guarantor route OK |
| 7 Auth edges | **PASS** | Forgot-password submit; concurrent admin+user sessions |
| 8 Yopmail | **PASS*** | Accounts created + verified + login to KYC/listings/onboarding (*email send may need SMTP check) |
| 9 Wrap | **PASS** with known defects | See bugs below |

## Accounts

| Account | Password | Status |
|---------|----------|--------|
| `user@demo.com` / `agent@demo.com` / `artisan@demo.com` | `password123` | Seed; `emailVerified` now set by seed |
| `admin@demo.com` | `password123` | `/admin/login` only |
| `homeconnectuser@yopmail.com` | `HomeConnectQA!234` | Verified + logged in |
| `homeconnectagent@yopmail.com` | `HomeConnectQA!234` | Verified + logged in |
| `homeconnectartisan@yopmail.com` | `HomeConnectQA!234` | Verified + logged in |

## Bugs / fixes from this pass

| Severity | Item | Result |
|----------|------|--------|
| High (fixed) | Seed demos had `emailVerified: null` → could not log in | Seed now sets `emailVerified`; agent KYC bumped to `ENHANCED` |
| Medium | Login/signup forms do not hydrate under Playwright + Turbopack (native GET to `?`) | CSRF API login works; UI login broken in automated browser |
| Medium | Chromium page crashes under memory pressure on long admin walks | Mitigated with request-based checks + `--disable-dev-shm-usage` |
| Low | `registerUser` throws `after()` outside request scope when called from scripts | Accounts still created; verify via `/api/auth/verify-email?token=` |
| Design | Paystack wallet bank transfer | Ledger + admin PAID only |
| Design | Artisan escrow | Synthetic HELD (no Paystack checkout) |

## Suggested follow-ups

1. Confirm yopmail inboxes received verify emails (SMTP), even though token verify worked.
2. Investigate Turbopack client hydration in headless Chromium (or run e2e against `next start`).
3. Optional: full seeker wizard UI + employer publish + rental owner listing with photo uploads (overlays partially covered).
