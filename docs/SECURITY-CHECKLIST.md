# HomeConnect Security Checklist

Platform controls tailored for consumer + isolated admin authentication.

| Area | Requirement | Status |
|------|-------------|--------|
| Authn | Separate admin cookie (`hc-admin.session-token`) via Auth.js at `/api/admin/auth`; consumer uses `hc-session` | Implemented |
| Authn | `ADMIN` blocked from consumer `/login` (`ADMIN_USE_ADMIN_LOGIN`); non-admins rejected on `/admin/login` | Implemented |
| Authz | `requireAdminSession()` / `getAdminSessionOrNull()` on every admin page and admin server action | Implemented |
| Authz | Proxy (`proxy.ts`) gates `/admin/*`, `/api/admin/*` (except auth), and `/dashboard/*` | Implemented |
| Email | Unverified credentials cannot access `/dashboard` (authorize + proxy JWT claim + layout) | Implemented |
| Sessions | HttpOnly, SameSite=lax, Secure in production on both session cookies | Implemented |
| CSRF | Next.js server actions + Auth.js CSRF for sign-in | Inherited |
| Passwords | bcrypt via `bcryptjs` | Existing |
| IDOR | Bookings/leases/jobs/messages actions check ownership or counterparty before mutate | Maintain on change |
| Uploads | MIME/size limits on KYC and equipment photo uploads; private paths not listed publicly | Existing + review |
| Headers | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` set in proxy | Implemented |
| Audit | `AuditLog` / admin verify & delete paths retain logging where present | Existing — extend on new admin ops |
| Rate limit | Login + CV view rate limits | Existing basics |
| Secrets | No secrets in client bundles; use server env (`AUTH_SECRET`, DB, SMTP) | Policy |
| Admin MFA | Required at IdP/host for production admins; optional TOTP stub deferred (`ADMIN_MFA_REQUIRED` flag later) | Documented |

## Admin isolation diagram

- Consumer: `/login` → `hc-session` → `/dashboard/*`
- Admin: `/admin/login` → `hc-admin.session-token` → `/admin/*` and `/api/admin/*`
- Legacy `/dashboard/admin/*` redirects to `/admin/*`

## Production hardening notes

1. Set strong `AUTH_SECRET`; rotate on compromise.
2. Enforce HTTPS so Secure cookies apply.
3. Prefer SSO/MFA at the edge for `/admin` before relying on password alone.
4. Keep KYC documents behind gated/signed routes; do not expose guessable public URLs long-term.
5. Re-audit IDOR whenever new booking/lease/job/message actions are added.
