# HomeConnect QA checklist

Use this file to tick off what works. In most editors, click the `[ ]` boxes (or change to `[x]`).

**Demo accounts** (seed password: `password123`):

| Role    | Email             |
|---------|-------------------|
| User    | `user@demo.com`   |
| Agent   | `agent@demo.com`  |
| Artisan | `artisan@demo.com`|
| Admin   | `admin@demo.com`  |

Or register fresh accounts. Ensure Postgres is running and `npm run dev` is up before testing.

---

## A. Shared / public (any visitor)

- [ ] Homepage loads at `/`
- [ ] Header shows **Home | Properties | Services | Jobs | Rentals | About | Contact** (no “Artisans”)
- [ ] Footer links to Services, Jobs, Rentals
- [ ] `/artisans` redirects to `/services`
- [ ] `/services` directory loads (filters work: category / state / area / search)
- [ ] `/jobs` hub shows seeker / employer / browse CTAs
- [ ] `/rentals` hub shows rent / list CTAs
- [ ] `/about` and `/contact` still work
- [ ] Login / signup pages load

---

## B. Regular user (`USER`)

### Auth & account

- [ ] Sign up as user (or log in as `user@demo.com`)
- [ ] Email verify flow works if enabled in your env
- [ ] Dashboard opens; role shown correctly
- [ ] Settings: change password / profile basics
- [ ] Sign out / sign in again

### Properties (unchanged)

- [ ] Browse `/properties`
- [ ] Open a property detail
- [ ] Save a home (Saved homes)
- [ ] Book a tour / purchase interest
- [ ] See booking in **Bookings**
- [ ] Messages with agent/owner (if available)
- [ ] Leases & escrow (if you have a lease in seed/demo)
- [ ] Move-in request flow

### Services (ex-Artisans)

- [ ] Browse `/services` and open a pro profile
- [ ] Book a service (creates **Service job** + escrow hold)
- [ ] Track it under dashboard **Service jobs** (not employment)
- [ ] After completion, leave a review (if flow available)

### Jobs — job seeker

- [ ] Jobs → **Register as a Job Seeker** (must be logged in)
- [ ] HC ID shown (e.g. `HC-JOB-…`)
- [ ] Save & continue across sections A–J; progress persists after refresh
- [ ] Upload ID (never appears on public profile)
- [ ] Submit blocked until declaration checkboxes checked
- [ ] After submit, appears on `/jobs/seekers` as **First + last initial** (or display name)
- [ ] Public profile: no phone, email, address, or ID images
- [ ] Badges show only after admin verifies (Identity / Employment / Guarantor)
- [ ] Apply to a published vacancy → application recorded
- [ ] Receive employer contact request → Accept / Decline
- [ ] Accept opens messaging; CV access granted for that employer
- [ ] Privacy dashboard: hide profile, see views/grants, revoke CV access, file correction/deletion request
- [ ] Guarantor invite link confirms → “Reference Confirmed” (PII still private)

### Jobs — employer (same user or second account)

- [ ] Register as employer (individual or business)
- [ ] Status **PENDING** until admin approves
- [ ] Unverified: cannot publish vacancy / contact blocked with clear error
- [ ] After verify: publish vacancy → shows on `/jobs/vacancies`
- [ ] Request to contact a seeker (no public phone shown)
- [ ] View CV only via secure viewer when authorized; download disabled by default

### Equipment rentals — customer

- [ ] Register rental customer
- [ ] Browse `/rentals/browse` — only **area**, not street address
- [ ] Open listing; see estimate; submit rental request
- [ ] See booking under **My rentals**
- [ ] After owner accepts: payment hold stub created
- [ ] Acknowledge handover (customer)
- [ ] Complete return / open dispute if needed

### Equipment rentals — owner (same or other user)

- [ ] List equipment (ownership declaration required)
- [ ] Photos of actual gear; precise address stays private
- [ ] Listing **PENDING_REVIEW** until admin approves
- [ ] After approve: listing public with separate badges (Identity / Ownership / Inspected / Functionality)
- [ ] Accept booking → calendar blocked for dates
- [ ] Owner handover ack → status **ACTIVE** when both ack
- [ ] Complete return → deposit released (or disputed)

---

## C. Artisan (`ARTISAN`)

### Registration & onboarding

- [ ] Sign up as artisan / join via Services → Offer a service
- [ ] Onboarding: location → trades → Tier 1 KYC
- [ ] Can leave and resume (`onboardingStep`)
- [ ] Upload selfie / ID; status goes **PENDING**
- [ ] After admin KYC verify: appears in `/services` directory
- [ ] Tier 2 / Tier 3 upgrade panel (BVN / address / CAC) when unlocked

### Day-to-day

- [ ] Dashboard **My services**: bio, rate, availability, trades, proficiency
- [ ] Request trade credential verification
- [ ] Receive customer booking → **Service jobs**
- [ ] Advance: Accept → In progress → Complete (escrow releases)
- [ ] Cancel path refunds escrow (if tested)
- [ ] Browse homes still available; Jobs/Rentals hubs reachable if desired

---

## D. Agent (`AGENT`) — quick pass

- [ ] Log in as `agent@demo.com`
- [ ] Create / edit listings
- [ ] Manage bookings on own properties
- [ ] Landlord-side leases / escrow
- [ ] Browse Services / Jobs / Rentals as a customer of those hubs

---

## E. Admin (`ADMIN`)

### Auth isolation

- [ ] Admin signs in only at `/admin/login` (consumer `/login` rejects ADMIN)
- [ ] Consumer session cookie cannot open `/admin` or `/api/admin/session`
- [ ] Legacy `/dashboard/admin/*` redirects to `/admin/*`
- [ ] Admin sign-out clears admin session only

### Existing (`/admin`)

- [ ] Admin overview cards load
- [ ] Users list
- [ ] **Services** (ex-Artisans) table: verify, badges, active
- [ ] Properties verification
- [ ] Verifications queue: KYC docs, KYC profiles, properties, artisan credentials
- [ ] Site content / amenities

### Jobs admin (`/admin/jobs`)

- [ ] Stats: seekers, verified, vacancies, applications, flags, privacy
- [ ] Approve / reject job seeker identity → public **Identity Verified**
- [ ] Verify employment history → badge
- [ ] Approve / reject employers → they can publish & contact
- [ ] ID docs not shown publicly after approve

### Rentals admin (`/admin/rentals`)

- [ ] Pending listings: approve (ownership reviewed) / reject (e.g. stock photos)
- [ ] Verify equipment owner identity
- [ ] See active / overdue / open disputes

### Security / NDPA (`/admin/security`)

- [ ] Suspicious flags (e.g. CV rate-limit) appear if triggered
- [ ] Open privacy requests listed
- [ ] Process **DELETION** → sensitive seeker fields cleared / profile hidden
- [ ] Audit log entries for verify/delete actions

---

## F. Cross-cutting privacy & safety

- [ ] Public seeker/listing pages never show NIN, ID images, guarantor phone/address, emergency contacts, or precise home address
- [ ] Unverified employer cannot contact or open CV
- [ ] CV watermark includes employer HC ID when view allowed
- [ ] After ~40 rapid CV views, rate limit + account flag
- [ ] Identity Verified disclaimer visible (does not guarantee character/conduct)
- [ ] Guarantor confirm copy states no automatic financial liability

---

## G. Automated smoke (optional before manual pass)

```bash
./node_modules/.bin/vitest run
./node_modules/.bin/playwright test
```

- [ ] Vitest green
- [ ] Playwright green

---

## Suggested order

1. Public nav  
2. User properties  
3. User Services booking  
4. Artisan onboarding/KYC (admin approve)  
5. Job seeker + admin verify  
6. Employer + vacancy + contact  
7. Rentals list/browse/book  
8. Admin jobs / rentals / security  

---

## Notes / bugs found

| Date | Role | Item | Result | Notes |
|------|------|------|--------|-------|
|      |      |      |        |       |
|      |      |      |        |       |
|      |      |      |        |       |
