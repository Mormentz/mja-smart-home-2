# Intensive QA results

Updated: 2026-11-18T13:12:03.976Z

**Totals:** pass=79 fail=4 skip=1 blocked=1

| Phase | Item | Result | Notes |
|-------|------|--------|-------|
| 3-agent | login | pass | http://127.0.0.1:3000/dashboard |
| 3-agent | sidebar Listings | pass |  |
| 3-agent | sidebar Wallet | pass |  |
| 3-agent | sidebar no Saved | pass | Dashboard
Bookings
3
Leases & escrow
Listings
Employment
My rentals
Browse homes
Browse services
Browse jobs
Browse rent |
| 3-agent | /dashboard/listings | pass | HTTP 200 |
| 3-agent | /dashboard/wallet | pass | HTTP 200 |
| 3-agent | /dashboard/bookings | pass | HTTP 200 |
| 3-agent | /dashboard/leases | pass | HTTP 200 |
| 3-agent | /dashboard/employment | pass | HTTP 200 |
| 3-agent | /dashboard/equipment | pass | HTTP 200 |
| 3-agent | /dashboard/jobs | pass | HTTP 200 |
| 3-agent | /dashboard/messages | pass | HTTP 200 |
| 3-agent | /dashboard/kyc | pass | HTTP 200 |
| 3-agent | /dashboard/settings | pass | HTTP 200 |
| 3-agent | /rentals/list | pass | HTTP 200 |
| 3-agent | listings create UI | pass |  |
| 3-agent | wallet balance UI | pass |  |
| 3-agent | mark handed over | pass |  |
| 4-artisan | login | pass | http://127.0.0.1:3000/dashboard |
| 4-artisan | sidebar My services | pass |  |
| 4-artisan | sidebar Onboarding | pass |  |
| 4-artisan | sidebar no Wallet | pass |  |
| 4-artisan | /dashboard/services | pass | HTTP 200 |
| 4-artisan | /dashboard/onboarding/artisan | pass | HTTP 200 |
| 4-artisan | /dashboard/jobs | pass | HTTP 200 |
| 4-artisan | /dashboard/messages | pass | HTTP 200 |
| 4-artisan | /dashboard/kyc | pass | HTTP 200 |
| 4-artisan | /dashboard/settings | pass | HTTP 200 |
| 4-artisan | availability control present | pass |  |
| 4-artisan | job action /accept/i | pass |  |
| 5-admin-writes | users search | pass |  |
| 5-admin-writes | verifications page | pass |  |
| 5-admin-writes | escrow action buttons | pass | present if rows |
| 5-admin-writes | withdrawals page | pass |  |
| 5-admin-writes | amenities CRUD UI | pass |  |
| 5-admin-writes | content page | pass |  |
| 5-admin-writes | security page | pass |  |
| 5-admin-writes | notifications page | pass |  |
| 6-privacy | seeker public page | skip | no seekers |
| 6-privacy | browse shows area not forcing street | pass |  |
| 7-auth | forgot password page | pass | HTTP 200 |
| 7-auth | forgot password submit | pass | check email/SMTP |
| 7-auth | concurrent admin+user sessions | pass | admin=http://127.0.0.1:3000/admin user=http://127.0.0.1:3000/dashboard |
| 2-user | /properties/atelier-loft | pass | HTTP 200 |
| 2-user | /services | pass | HTTP 200 |
| 2-user | /dashboard/leases | pass | HTTP 200 |
| 2-user | /dashboard/bookings | pass | HTTP 200 |
| 2-user | /dashboard/saved | pass | HTTP 200 |
| 2-user | seed user exists | pass |  |
| 3-agent | seed agent ENHANCED | pass | ENHANCED/VERIFIED |
| 4-artisan | seed artisan available eligible | pass |  |
| 4-artisan | serviceProfile present | pass | available=true |
| 2-user | bookings in DB | pass | count=3 |
| 2-user | leases in DB | pass | count=2 |
| 2d-escrow | escrow statuses | pass | [{"_count":3,"status":"HELD"}] |
| 2-user | service jobs | pass | count=1 |
| 3-agent | wallet account | pass | bal=0 |
| 6-privacy | /jobs/seekers | pass | HTTP 200 |
| 6-privacy | seekers page no NIN label dump | pass |  |
| 6-privacy | guarantor token route responds | pass | HTTP 200 |
| 8-yopmail | signup USER | fail | Error: `after` was called outside a request scope. Read more: https://nextjs.org/docs/messages/next-dynamic-api-wrong-context |
| 8-yopmail | signup AGENT | fail | Error: `after` was called outside a request scope. Read more: https://nextjs.org/docs/messages/next-dynamic-api-wrong-context |
| 8-yopmail | signup ARTISAN | fail | Error: `after` was called outside a request scope. Read more: https://nextjs.org/docs/messages/next-dynamic-api-wrong-context |
| 8-yopmail | fresh accounts created | pass | [{"email":"homeconnectuser@yopmail.com","role":"USER","emailVerified":null},{"email":"homeconnectagent@yopmail.com","role":"AGENT","emailVerified":null},{"email":"homeconnectartisan@yopmail.com","role":"ARTISAN","emailVerified":null}] |
| 8-yopmail | await email verify links | blocked | Provide verify links from yopmail for the three accounts |
| 9-wrap | Paystack wallet transfer stub | pass | ledger/admin-paid only by design |
| 9-wrap | Artisan escrow without Paystack checkout | pass | synthetic HELD by design |
| 9-wrap | login form hydration under Playwright/Turbopack | fail | React fiber not attached; CSRF API login works |
| 9-wrap | seed emailVerified missing (fixed) | pass | seed now sets emailVerified; agent KYC bumped to ENHANCED |
| 2d-escrow | agent mark handed over | pass |  |
| 2d-escrow | dual timestamps set (DB assist) | pass | cmvz646xy001aarkbl8qbbq5f |
| 2d-escrow | wallet credit after dual confirm | pass |  |
| 3-agent | wallet after credit | pass | bal=1650 |
| 3-agent | withdrawal request created | pass | cmwm52qju000272aruq2fn5ou |
| 5-admin-writes | withdrawal marked PAID | pass |  |
| 8-yopmail | token homeconnectuser@yopmail.com | pass | verified=false token=04ef4a15... |
| 8-yopmail | token homeconnectagent@yopmail.com | pass | verified=false token=afdd0ffb... |
| 8-yopmail | token homeconnectartisan@yopmail.com | pass | verified=false token=4aa78407... |
| 8-yopmail | verify-email AGENT | pass | HTTP 307 |
| 8-yopmail | verify-email ARTISAN | pass | HTTP 307 |
| 8-yopmail | already verified USER | pass | homeconnectuser@yopmail.com |
| 8-yopmail | login+land homeconnectuser@yopmail.com | pass | login=200 dash=200 /dashboard/kyc=200 |
| 8-yopmail | login+land homeconnectagent@yopmail.com | pass | login=200 dash=200 /dashboard/listings=200 |
| 8-yopmail | login+land homeconnectartisan@yopmail.com | pass | login=200 dash=200 /dashboard/onboarding/artisan=200 |
| 8-yopmail | admin seed login still works | pass | HTTP 200 |
