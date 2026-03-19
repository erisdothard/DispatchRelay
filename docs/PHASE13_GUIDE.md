# FreightX — Phase 13 Guide: Enterprise Completion

**Goal:** Fill the gaps between a working MVP and a production platform capable of serving 100k+ users — the features required to compete with DAT/Truckstop at an elite level.

**Timeline:** 4 weeks (4 independent sections, each deployable separately)
**Prerequisites:** Phase 12 complete (GPS Real-Time Tracking)

---

## Overview

Phase 13 is broken into 4 sections that can be deployed independently:

| Section    | Name                  | Focus                                                           |
| ---------- | --------------------- | --------------------------------------------------------------- |
| **Step 0** | Phase 11/12 Gap Fixes | Blocking bugs from prior phases                                 |
| **13A**    | Critical Completions  | Email, SMS, pagination, audit log                               |
| **13B**    | Enterprise Operations | Multi-user companies, templates, e-sig, accessorials            |
| **13C**    | Trust & Intelligence  | Lane alerts, broker credit score, rate intelligence, AI upgrade |
| **13D**    | Scale Infrastructure  | Full-text search, notification queue, real rate limiting        |

---

## Step 0 — Phase 11/12 Gap Fixes

### 0A: carrier_preferences Migration (Phase 11 blocker)

**File:** `database/migrations/011-carrier-preferences.sql`

The `carrier_preferences` table was missing — preferences silently failed to persist on page reload. This migration creates the table, enables RLS, and adds an `updated_at` auto-trigger.

**Run in Supabase SQL Editor:** Copy and execute `011-carrier-preferences.sql`

### 0B: location-cleanup pg_cron Job (Phase 12)

The `location-cleanup` edge function existed but the pg_cron schedule was never created. Stale location pings accumulated indefinitely.

**Fix:** Run the pg_cron SQL from `021-notification-queue.sql` (see comments at the bottom of that file):

```sql
SELECT cron.schedule('location-cleanup','0 * * * *',
  $$SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/location-cleanup',
    headers:='{"Authorization":"Bearer YOUR_SERVICE_ROLE_KEY"}'
  )$$
);
```

### 0C: LLM Model Decision

| Use Case                       | Model                       | Reason                     |
| ------------------------------ | --------------------------- | -------------------------- |
| Natural language query parsing | `claude-haiku-4-5-20251001` | Fast, cheap, deterministic |
| Rate suggestions + reasoning   | `claude-sonnet-4-6`         | Complex market analysis    |
| Load matching engine (future)  | `claude-sonnet-4-6`         | Multi-factor optimization  |

Both models are now routed via the same `ai-load-search` edge function using the `action` parameter.

---

## Phase 13A — Critical Completions

### 1. Email Notifications

**Edge function:** `supabase/functions/send-notification-email/index.ts`
**Service:** `apps/web/src/services/email-notifications.service.ts`

**Provider:** Resend (`RESEND_API_KEY` env var — already in Supabase secrets)

**Templates (7 total):**

- `new_bid` — load poster notified when carrier submits a bid
- `bid_accepted` — carrier notified their bid won
- `bid_declined` — carrier notified bid was not selected
- `booking_confirmed` — both parties notified on book-now
- `load_status_change` — all parties notified on status update
- `new_message` — recipient notified of incoming message
- `lane_alert` — carrier notified when saved search matches new load

All templates are role-aware dark-theme HTML emails matching the FreightX brand.

**Wired into:**

- `bids.service.ts` — submitBid, acceptBid, declineBid, bookNow
- `loads.service.ts` — updateLoad (status changes)

All email calls are **non-fatal** — they never block the main action if they fail.

### 2. SMS Notifications

**Edge function:** `supabase/functions/send-sms/index.ts`
**Provider:** Twilio

**Required env vars (set in Supabase Edge Function secrets):**

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+15551234567
```

**Triggers (critical events only):**

- Load booked (book_now) → carrier SMS
- Pickup reminder (day before) → carrier SMS
- Delivery confirmed → broker SMS

**User control:** Notification preferences page (`/profile/notifications`) now saves to the `notification_preferences` table. Users toggle SMS per event type and enter their E.164 phone number.

### 3. Server-Side Pagination

**Before:** All list queries fetched entire tables — broken at scale.
**After:** All queries use `.range(offset, offset + 24)` — max 25 rows per request.

**Changed files:**

- `services/loads.service.ts` — new `getLoadsPage()` with `count: 'exact'`
- `services/trucks.service.ts` — `page` param on `getTrucks()`
- `features/loads/hooks/use-loads.ts` — `loadMore()` + `hasMore` + `loadingMore`
- `features/trucks/hooks/use-trucks.ts` — same pattern

**New hook API:**

```ts
const { loads, loading, loadingMore, hasMore, loadMore, refresh } = useLoads(filters);
```

### 4. Audit Log

**Migration:** `database/migrations/020-audit-log.sql`

**Table:** `audit_log` (user_id, action, entity_type, entity_id, diff JSON, ip, created_at)

**RPC:** `write_audit_log(action, entity_type, entity_id, diff)` — called after every mutation, non-fatal.

**Wired into:**

- Load created, load status updated
- Bid submitted, bid accepted, bid declined
- Booking confirmed

**Admin UI:** `pages/admin/audit-log.tsx` — paginated table with filter by entity type, diff viewer, user attribution.

---

## Phase 13B — Enterprise Operations

### 5. Multi-User Company Accounts

**Migrations:** `database/migrations/013-company-members.sql`

**Tables:**

- `company_members` (company_id, user_id, role, invited_by, joined_at)
- `company_invites` (email, company_id, role, token, expires_at, accepted_at)

**Roles:** `owner | admin | dispatcher | accounting | viewer`

**RPC:** `accept_company_invite(token)` — validates token, inserts member, marks invite accepted.

**Service:** `services/company-members.service.ts`

- `getCompanyMembers(companyId)`
- `inviteMember({ companyId, email, role })`
- `updateMemberRole(memberId, role)`
- `removeMember(memberId)`
- `revokeInvite(inviteId)`
- `acceptInvite(token)`

**UI:** `pages/profile/team.tsx` — full team management page with invite form, member list with role dropdowns, pending invites section.

**Backfill:** Migration automatically inserts existing company owners as `owner` role members.

### 6. Load Templates

**Migration:** `database/migrations/014-load-templates.sql`

**Table:** `load_templates` (user_id, company_id, name, template_data JSONB)

**UI changes to post-load-sheet:**

- "Use Template" dropdown — appears when user has saved templates
- "Save as Template" — expands inline name input, saves current form state

### 7. Digital E-Signature on Rate Confirmations

**Component:** `features/bookings/components/signature-modal.tsx`

**Flow:**

1. After booking confirmed → show signature modal
2. User draws signature on HTML Canvas with finger/mouse
3. Canvas exported to PNG blob → uploaded to Supabase Storage (`documents` bucket, `signatures/` path)
4. `bids` table updated: `signed_at`, `signature_url`, `signatory_name`

**New columns on `bids`:** Added in migration 015:

```sql
signed_at TIMESTAMPTZ, signature_url TEXT, signatory_name TEXT
```

No external vendor — uses native browser Canvas API.

### 8. Accessorial Charges

**Migration:** `database/migrations/015-accessorial-charges.sql`

**Table:** `accessorial_charges` (load_id, booking_id, type, amount_usd, notes, status, created_by, approved_by)

**Types:** `detention | lumper | layover | tonu | fuel_surcharge | other`
**Statuses:** `pending | approved | denied`

**Service:** `services/accessorials.service.ts`

- `addAccessorial()` — carrier submits charge
- `approveAccessorial()` / `denyAccessorial()` — broker approves or denies
- `getApprovedAccessorialTotal()` — returns sum for invoice calculation

**UI:** `features/loads/components/accessorials-sheet.tsx`

- Live invoice total (base rate + approved accessorials)
- Submit form for carriers
- Approve/deny buttons for brokers

---

## Phase 13C — Trust & Intelligence

### 9. Saved Searches + Lane Alerts

**Migration:** `database/migrations/016-saved-searches.sql`

**Table:** `saved_searches` (user_id, name, filters JSONB, alert_enabled, last_alerted_at)

**Service:** `services/saved-searches.service.ts`

**UI:** `features/loads/components/saved-searches-sheet.tsx`

- Save current filter state with a name
- Apply saved search with one tap
- Toggle per-search email+SMS alerts
- Shows last alert time

**Alert mechanism:** `supabase/functions/lane-alert/index.ts`

- Triggered on new load INSERT (via Supabase webhook or direct call from `createLoad`)
- Checks all `alert_enabled` saved searches against the new load's fields
- Creates in-app notification + enqueues email for each match
- Updates `last_alerted_at`

### 10. Broker Credit Score / Days-to-Pay Display

**Migration:** `database/migrations/017-broker-payment-metrics.sql`

**Table:** `broker_payment_metrics` (company_id, avg_days_to_pay, on_time_pct, payment_count, total_paid_usd)

**RPC:** `record_broker_payment(company_id, days_to_pay, on_time, amount_usd)` — updates rolling averages after each payment.

**Component:** `features/loads/components/broker-credit-badge.tsx`

- Inline chip: "Pays ~18d · 94% on-time"
- Full card: avg days, on-time %, payment count
- Color coded: green (≤14d / ≥90%), yellow (≤30d / ≥70%), red (>30d / <70%)

### 11. Preferred Carrier Lists + Blocking

**Migration:** `database/migrations/018-carrier-relationships.sql`

**Table:** `carrier_relationships` (company_id, carrier_id, status: preferred|blocked)

**New column on `loads`:** `preferred_carriers_only BOOLEAN DEFAULT FALSE`

**RLS enforced:** Blocked carriers cannot see or bid on that company's loads.

### 12. Lane Rate Intelligence

**Migration:** `database/migrations/019-rate-history.sql`

**Table:** `rate_history` (lane_hash, origin_state, dest_state, equipment, rate_usd, total_miles, rate_per_mile, recorded_at)

**RPCs:**

- `get_lane_stats(origin, dest, equipment, days)` — avg/min/max rate/mile + sample count
- `get_lane_trend(origin, dest, equipment)` — daily avg for last 30 days (sparkline data)

**Service:** `services/rate-intelligence.service.ts`

- `getLaneStats()` — fetches market stats for a lane
- `getLaneTrend()` — fetches trend data for sparkline
- `recordLaneRate()` — writes snapshot on booking confirmed
- `suggestRate()` — calls AI edge function for Sonnet-powered suggestion

**Auto-populated:** `recordBookingRateHistory()` called after `acceptBid()` and `bookNow()`.

### 13. AI Upgrade — Claude Sonnet for Rate Suggestions

**Changed file:** `supabase/functions/ai-load-search/index.ts`

**New mode:** `action: 'suggest_rate'`

```json
{
  "action": "suggest_rate",
  "origin_state": "TX",
  "dest_state": "CA",
  "equipment": "flatbed",
  "total_miles": 1450,
  "lane_stats": { "avg_rate_per_mile": 2.45, "sample_count": 12 }
}
```

**Returns:**

```json
{
  "suggested_low": 2.28,
  "suggested_mid": 2.45,
  "suggested_high": 2.74,
  "confidence": "high",
  "reasoning": "Based on 12 recent transactions. Flatbed premium applied.",
  "sample_count": 12
}
```

**Model routing:**

- `parse_query` mode → `claude-haiku-4-5-20251001` (fast, cheap)
- `suggest_rate` mode → `claude-sonnet-4-6` (complex reasoning)

**Fallback:** If Anthropic API unavailable, `fallbackRateSuggestion()` uses national averages + historical data.

**UI:** Rate suggestion chip in post-load-sheet shows Low/Mid/High buttons — tap any to auto-fill the rate field.

---

## Phase 13D — Scale Infrastructure

### 14. Full-Text Search Optimization

**Migration:** `database/migrations/022-fulltext-search.sql`

**Changes:**

- GIN indexes on `origin_city`, `dest_city`, `commodity`, `company_name`
- B-tree indexes on all filter columns (`equipment`, `status`, `origin_state`, `dest_state`, `rate_per_mile`, `pickup_date`, `posted_at`)
- `search_vector` GENERATED ALWAYS AS STORED column (tsvector with weighted fields: load_number=A, cities=B, commodity=C, company=D)
- GIN index on `search_vector`
- `search_loads()` RPC using `websearch_to_tsquery` — target: <50ms at 100k rows

### 15. Background Notification Queue

**Migration:** `database/migrations/021-notification-queue.sql`

**Tables:**

- `notification_preferences` — per-user channel settings + phone number
- `notification_queue` — type, recipient, payload, status, attempts, next_retry_at

**Worker:** `supabase/functions/notification-worker/index.ts`

- Processes up to 50 items per invocation
- Exponential backoff retry (max 3 attempts)
- Dead-letter after 3 failures
- Dispatches via `send-notification-email` and `send-sms` edge functions

**Schedule:** pg_cron every 30 seconds (see comments in migration 021)

**Why:** Edge function calls in the main request path add latency and fail silently. Queue + worker decouples delivery from the user action.

### 16. Real Rate Limiting

**File:** `middleware.ts` (project root — Vercel Edge Middleware)

**Limits (per IP, per 60-second window):**
| Route | Limit |
|---|---|
| `/api/loads/post` | 10 req/min |
| `/api/bids` | 30 req/min |
| `/api/ai-search` | 20 req/min |
| `/api/messages` | 60 req/min |

**Storage:** Vercel KV (sorted set sliding window)
**Fail-open:** If KV unavailable, all requests pass through — never blocks legitimate traffic.

**Required env vars (Vercel dashboard):**

```
KV_REST_API_URL=https://...upstash.io
KV_REST_API_TOKEN=your_token
```

---

## Database Migrations — Run Order

Run all migrations in order in Supabase Dashboard → SQL Editor:

| #   | File                             | Purpose                            |
| --- | -------------------------------- | ---------------------------------- |
| 011 | `011-carrier-preferences.sql`    | Carrier preferences table          |
| 012 | `012-location-pings.sql`         | GPS location pings (Phase 12)      |
| 013 | `013-company-members.sql`        | Multi-user company teams           |
| 014 | `014-load-templates.sql`         | Load posting templates             |
| 015 | `015-accessorial-charges.sql`    | Accessorial charges + e-sig fields |
| 016 | `016-saved-searches.sql`         | Saved searches + lane alerts       |
| 017 | `017-broker-payment-metrics.sql` | Broker payment trust metrics       |
| 018 | `018-carrier-relationships.sql`  | Preferred/blocked carrier lists    |
| 019 | `019-rate-history.sql`           | Lane rate history + RPCs           |
| 020 | `020-audit-log.sql`              | System audit trail                 |
| 021 | `021-notification-queue.sql`     | Notification preferences + queue   |
| 022 | `022-fulltext-search.sql`        | Full-text search indexes + RPC     |

After running migrations, schedule the pg_cron jobs from the comments in migration 021.

---

## New Environment Variables

| Variable             | Where            | Used For                                       |
| -------------------- | ---------------- | ---------------------------------------------- |
| `RESEND_API_KEY`     | Supabase secrets | Email delivery                                 |
| `TWILIO_ACCOUNT_SID` | Supabase secrets | SMS delivery                                   |
| `TWILIO_AUTH_TOKEN`  | Supabase secrets | SMS delivery                                   |
| `TWILIO_FROM_NUMBER` | Supabase secrets | SMS sender number                              |
| `KV_REST_API_URL`    | Vercel dashboard | Rate limiting storage                          |
| `KV_REST_API_TOKEN`  | Vercel dashboard | Rate limiting storage                          |
| `ANTHROPIC_API_KEY`  | Supabase secrets | Already set — now used for both Haiku + Sonnet |

---

## New Files Summary

### Database Migrations (12 new)

- `011` through `022` — see table above

### Edge Functions (4 new)

- `send-notification-email/` — Resend email dispatch with 7 templates
- `send-sms/` — Twilio SMS dispatch
- `lane-alert/` — Match new loads against saved searches
- `notification-worker/` — Background queue processor with retry

### Services (5 new)

- `email-notifications.service.ts` — All email/SMS trigger helpers
- `company-members.service.ts` — Team invite/manage
- `saved-searches.service.ts` — Save/apply/alert searches
- `rate-intelligence.service.ts` — Lane stats, rate recording, AI suggestion
- `accessorials.service.ts` — Charge submission and approval

### Updated Services (3)

- `loads.service.ts` — Pagination, audit log, email trigger, rate history write
- `trucks.service.ts` — Pagination
- `bids.service.ts` — Email triggers, audit log, rate history write, SMS

### Updated Hooks (2)

- `use-loads.ts` — `loadMore()`, `hasMore`, `loadingMore`
- `use-trucks.ts` — same pattern

### New Components (7)

- `post-load-sheet.tsx` (updated) — Templates + AI rate suggestion chip
- `saved-searches-sheet.tsx` — Saved search management
- `accessorials-sheet.tsx` — Charge submit/approve/deny + invoice total
- `broker-credit-badge.tsx` — Inline broker payment trust signal
- `signature-modal.tsx` — Canvas e-signature → Supabase Storage

### New Pages (3)

- `pages/profile/team.tsx` — Company team management
- `pages/profile/notifications.tsx` (updated) — Now saves to DB with phone number
- `pages/admin/audit-log.tsx` — System audit trail

### Infrastructure (2)

- `middleware.ts` (project root) — Vercel Edge rate limiting
- `vercel.json` — Phase marker updated to `phase-13`

---

## Verification Checklist

```
[ ] carrier_preferences: Save prefs → reload page → prefs still there
[ ] Emails: Post load → check Resend dashboard for triggered emails
[ ] SMS: Book now → check Twilio logs (requires TWILIO_* env vars)
[ ] Pagination: Open Network tab → confirm ?range=0,24 in Supabase requests
[ ] Notifications page: Toggle settings → save → reload → settings persist
[ ] Templates: Save template → close sheet → reopen → template in dropdown
[ ] Team: Invite user → pending invite appears → accept token → member added
[ ] Accessorials: Add detention charge → broker approves → invoice total updates
[ ] Rate history: Book a load → query rate_history table → row inserted
[ ] Rate suggestion: Open post-load form + fill origin/dest/miles → AI chip appears
[ ] Audit log: Admin dashboard → audit trail page → entries appear after actions
[ ] Lane alerts: Save search → post matching load → in-app notification fires
[ ] Full-text: Run EXPLAIN ANALYZE on search_loads() → confirm index scan
```
