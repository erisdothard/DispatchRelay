# FreightX — Development Roadmap

**Version:** 1.0
**Date:** February 17, 2026
**Starting Point:** Empty monorepo
**Target:** Production-ready SaaS load board

---

## Overview

Thirteen phases, each with a clear goal, acceptance criteria, and definition of done. Phases are sequential — each unlocks the next. Do not skip phases or carry incomplete work forward.

```
Phase 0 — Repo, CI/CD, Tooling          Week 1 ✅
Phase 1 — Database, Auth, Infra         Weeks 2–4 ✅
Phase 2 — Core Data Layer & CRUD        Weeks 5–8 ✅
Phase 3 — Real-Time & Messaging         Weeks 9–11 ✅
Phase 4 — Booking Workflow & Documents  Weeks 12–15 ✅
Phase 5 — Verification & Payments       Weeks 16–19 ✅
Phase 6 — Testing, Hardening & Launch   Weeks 20–27 ✅
Phase 7 — Elite Automation Scripts      Week 28 ✅
Phase 8 — Study Guide & Learning        Weeks 29–31 ✅
Phase 9 — Apple Maps-Style Live Maps    Week 32 ✅
Phase 10 — Interactive Maps & Profiles  Week 33 ✅
Phase 11 — AI Assisted Load Seeking     Week 34 ✅
Phase 12 — GPS Tracking                 Week 35 ✅
Phase 13 — Enterprise Completion        Week 36 ✅
```

**Solo developer estimate:** 8–9 months (including post-dev phases) ✅
**Two developers (parallel):** 5–6 months ✅

---

## Phase 0 — Repo, CI/CD, Tooling

**Goal:** Professional monorepo that enforces quality from commit #1.

**Deliverables:**

- [x] pnpm + Turborepo monorepo initialized
- [x] `apps/web` scaffolded (React 19 + Vite 6 + TypeScript strict)
- [x] `packages/shared` scaffolded (types, schemas, constants)
- [x] `packages/typescript-config` shared tsconfig presets
- [x] Tailwind CSS v3 + shadcn/ui configured (orange + dark grey theme)
- [x] GitHub Actions CI pipeline (`ci.yml`)
- [x] Husky pre-commit hook — needs `husky init` to activate
- [x] Husky commit-msg hook (commitlint conventional commits)
- [x] `.env.example` with all required variables documented
- [x] `supabase/migrations/` directory — using `database/migrations/` instead
- [x] All phase guide docs in `docs/`
- [x] README complete with setup instructions

**Definition of Done:**

- `pnpm install && pnpm dev:web` runs without errors
- `pnpm build:web` produces a working production build
- CI pipeline passes on a test PR
- Committing with an invalid commit message is rejected by the hook

See [`PHASE0_GUIDE.md`](./PHASE0_GUIDE.md) for step-by-step instructions.

---

## Phase 1 — Database, Auth, Infra

**Goal:** Replace zero backend with real infrastructure. Users can register, log in, and maintain sessions.

**Deliverables:**

- [x] Supabase project created (dev) — qeovhjdrwihnyfcbnujk
- [x] Supabase project created (production) — **COMPLETED**
- [x] Migration 001: `profiles` — in `database/migrations/001-initial-schema.sql`
- [x] Migration 002: `companies` — **COMPLETED**: proper companies table with owner_id FK, type, MC/DOT/broker authority, rating, metrics; added to `001-initial-schema.sql`; company fields removed from profiles
- [x] RLS policies on profiles and all tables
- [x] Supabase Auth: email/password
- [x] Google OAuth — **COMPLETED**
- [x] Multi-step registration: email → role → company info (3 steps complete)
- [x] Registration step 3: company info — **COMPLETED** (name, MC/DOT, phone) — 3-step onboarding; MC/DOT shown for carriers, broker authority for brokers; "skip" option available
- [x] Real `AuthContext` with JWT management and session persistence
- [x] Protected routes — with role-based enforcement
- [x] Password reset flow — **COMPLETED** (`/forgot-password` + `/reset-password` pages; Supabase PASSWORD_RECOVERY event handled)
- [x] Remove all hardcoded credentials — **COMPLETED** (DEMO_ACCOUNTS array and demo buttons deleted from login.tsx)
- [x] Environment config: dev only; staging/production **COMPLETED**
- [x] Vercel project linked to `main` branch — **COMPLETED**
- [x] Staging environment linked to `develop` branch — **COMPLETED**

**Completed ahead of schedule (Phase 2 work):**

- [x] Full data service layer (loads, trucks, messages)
- [x] All dashboards pulling from Supabase (carrier, broker, shipper)
- [x] TypeScript database types + camelCase mappers
- [x] Seed data in migration (6 loads, 3 trucks, tracking milestones)

**Definition of Done:**

- User registers with email and selects a role (Carrier/Broker/Shipper)
- User logs in and session persists across page refreshes
- User logs out and is redirected to login
- Direct URL access to protected routes redirects to login
- No hardcoded credentials exist anywhere in the codebase
- CI passes on all PRs to develop/main

See [`PHASE1_GUIDE.md`](./PHASE1_GUIDE.md) for step-by-step instructions.

---

## Phase 2 — Core Data Layer & CRUD

**Goal:** All mock data replaced with real Supabase database operations. Data persists.

**Deliverables:**

- [x] Migration 003: `loads` — full schema with status lifecycle (included in `001-initial-schema.sql`)
- [x] Migration 004: `trucks` — equipment postings (included in `001-initial-schema.sql`)
- [x] Migration 005: `bookings` — load-carrier assignments (stub — full workflow in Phase 4)
- [x] RLS policies: users can only see/edit their own data + public listings
- [x] Supabase client utility in `packages/shared`
- [x] TanStack Query setup with proper error handling
- [x] `useLoads` hook — paginated list with filters, create, update, delete
- [x] `useTrucks` hook — same pattern
- [x] `useCompany` hook — profile management
- [x] Carrier dashboard — real data: posted trucks, available loads board
- [x] Broker dashboard — real data: posted loads, truck search
- [x] Shipper dashboard — real data: shipments, truck search
- [x] Load posting form — all fields, validation, Supabase write
- [x] Truck posting form — all fields, validation, Supabase write
- [x] Settings pages — editable profile, company info, save to DB
- [x] Loading states (skeleton screens) on all data fetches
- [x] Empty states with helpful messaging
- [x] Error states with user-facing error messages
- [x] `mockData.ts` file completely deleted
- [ ] Server-side pagination on all list views

**Definition of Done:**

- Load/truck posted by user A is visible to user B after page refresh
- Deleting a load removes it from the database permanently
- Filtering loads by equipment type runs a server-side query (not client filter)
- All three role dashboards function with zero mock data
- No `sharedState` or `mockData` references remain in codebase

See [`PHASE2_GUIDE.md`](./PHASE2_GUIDE.md) for step-by-step instructions.

---

## Phase 3 — Real-Time & Messaging

**Goal:** The load board is live. New posts appear instantly. Users can message each other.

**Deliverables:**

- [x] Migration 006: `messages` — conversation threads per booking (included in `001-initial-schema.sql`)
- [x] Migration 007: `message_items` — individual messages (included in `001-initial-schema.sql`)
- [x] Migration 008: `notifications` — system notifications (`database/migrations/002-notifications.sql`)
- [x] Supabase Realtime subscriptions on `loads` and `trucks` tables (useLoads hook subscribes via postgres_changes)
- [x] New loads/trucks appear on the board without page refresh (< 2 seconds)
- [x] Load status changes propagate in real time
- [x] Real-time per-load chat (Supabase Realtime on `message_items`)
- [x] Conversation list in sidebar with unread count badges
- [ ] File sharing within message threads (Supabase Storage)
- [x] In-app notification bell — real-time unread count (all three dashboards wired to useNotifications + NotificationSheet)
- [x] Notification dropdown — list of recent notifications with links
- [ ] Email notifications via Supabase Edge Functions:
  - New bid received
  - Bid accepted/declined
  - New message
  - Load status change
- [ ] Notification preferences per user (which events, which channels)

**Definition of Done:**

- User A posts a load → User B (on load board) sees it within 2 seconds, no refresh
- User A sends a message → User B sees it appear in real time
- Notification bell shows unread count and updates in real time
- Email sent to load poster when a carrier submits a bid

See [`PHASE3_GUIDE.md`](./PHASE3_GUIDE.md) for step-by-step instructions.

---

## Phase 4 — Booking Workflow & Documents

**Goal:** The full commercial lifecycle from load post to delivery completion.

**Deliverables:**

- [ ] Migration 009: `bids` — carrier bids with amount, status, expiry
- [ ] Migration 010: `documents` — BOL, POD, rate confirmations
- [ ] Supabase Storage buckets: `documents`, `profile-photos`
- [ ] Bid submission UI — carrier submits rate on available load
- [ ] Bid management UI — broker views all bids, accept / counter / decline
- [ ] Counter-offer flow — multi-round negotiation
- [ ] Book-It-Now — instant booking at posted rate
- [ ] Bid expiration — stale bids auto-expire (Supabase cron/edge function)
- [ ] Booking confirmation — accept bid → create booking → notify all parties
- [ ] Rate confirmation PDF — auto-generated on booking, downloadable
- [ ] Load status lifecycle UI — dispatched → in-transit → delivered
- [ ] Cancellation flow — request, confirmation, policy enforcement
- [ ] Document upload — BOL, POD, rate confirmation per load
- [ ] Document viewer — in-app preview of uploaded files
- [ ] POD capture — photo upload from mobile browser (camera API)
- [ ] Load completion — finalize with actual miles, weights, accessorials

**Definition of Done:**

- Carrier bids on load → Broker sees bid → Broker accepts → Rate confirmation auto-generated
- Both parties receive email confirmation with load details
- Carrier uploads POD → load status changes to Delivered → Broker notified
- Rate confirmation PDF downloadable from load detail page
- Cancellation flow tested end-to-end

See [`PHASE4_GUIDE.md`](./PHASE4_GUIDE.md) for step-by-step instructions.

---

## Phase 5 — Verification, Payments & Ratings

**Goal:** FreightX is commercially viable. Real money moves. Trust is enforced.

**Deliverables:**

- [ ] Migration 011: `carrier_verifications` — MC/DOT/insurance records
- [ ] Migration 012: `ratings` — post-load ratings both directions
- [ ] Migration 013: `subscriptions` — Stripe billing records
- [ ] FMCSA SAFER API integration — MC/DOT auto-verified on signup
- [ ] Insurance certificate upload + expiry tracking
- [ ] CSA safety score display on carrier profiles
- [ ] Verified badge shown on carrier/broker cards
- [ ] Auto-alert when insurance is expiring (60 days, 30 days, 7 days)
- [ ] Stripe integration — subscription billing (monthly/annual)
- [ ] Subscription tier enforcement — feature gating by plan
- [ ] Invoice auto-generation on load completion
- [ ] In-platform payment (ACH via Stripe) — carrier gets paid
- [ ] Quick Pay option — 2% fee for 2-day payment
- [ ] Payment status tracking — Invoiced → Approved → Paid
- [ ] Post-load rating prompt — both parties rate after completion
- [ ] 5-star rating display on carrier/broker profiles
- [ ] Performance metrics — on-time %, load count, avg rating

**Definition of Done:**

- New carrier can't post trucks until MC/DOT verified
- Stripe subscription billing charges test card successfully
- Invoice generated automatically when load status reaches Delivered
- Rating prompt appears after load completion for both parties
- Expired insurance blocks carrier from being booked

See [`PHASE5_GUIDE.md`](./PHASE5_GUIDE.md) for step-by-step instructions.

---

## Phase 6 — Testing, Hardening & Launch

**Goal:** Production-hardened, tested, monitored, and ready for real users.

**Deliverables:**

**Testing:**

- [ ] Vitest unit tests — all shared utility functions and schemas
- [ ] Component tests — critical UI flows (login, load post, bid flow)
- [ ] Integration tests — Supabase RLS policies verified
- [ ] Playwright E2E — happy path for each role (register → post → book → deliver)
- [ ] Security audit — OWASP Top 10 review
- [ ] Load testing — 1,000 concurrent users on load board
- [ ] Mobile responsiveness — tested on iOS Safari, Android Chrome
- [ ] Cross-browser — Chrome, Firefox, Safari, Edge

**Performance:**

- [ ] Code splitting — lazy-load all route components
- [ ] Bundle analysis — no single chunk > 250KB
- [ ] Lighthouse score > 85 on all pages
- [ ] Image optimization — WebP, lazy loading
- [ ] Database indexes reviewed — all search queries < 100ms

**Operations:**

- [ ] Sentry error monitoring configured + alerting
- [ ] Vercel Analytics enabled
- [ ] Uptime monitor configured (BetterStack or similar)
- [ ] Supabase PITR (Point-in-Time Recovery) enabled
- [ ] GitHub Actions CD pipeline — auto-deploy to Vercel on main merge

**Launch:**

- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] Custom domain configured with SSL
- [ ] SEO meta tags, Open Graph images
- [ ] Beta invite flow — waitlist or invite codes
- [ ] Onboarding checklist for new users
- [ ] Support channel established (Discord, email, or Intercom)

**Definition of Done:**

- Test coverage > 70% on critical paths
- Zero critical Sentry errors in 48-hour staging burn-in
- Lighthouse performance > 85 across all pages
- Legal documents reviewed and published
- At least 5 beta users successfully onboarded end-to-end

See [`PHASE6_GUIDE.md`](./PHASE6_GUIDE.md) for step-by-step instructions.

---

### Phase 6 (Part 2) — Production Hardening

**Goal:** Harden FreightX for 100k+ concurrent users with enterprise-grade infrastructure.

**Deliverables:**

- [ ] Redis setup (Upstash or self-hosted)
- [ ] Rate limiting implementation
- [ ] Webhook system with retry logic
- [ ] Job queue system (BullMQ)
- [ ] Health check endpoint
- [ ] Comprehensive monitoring (Sentry + uptime)
- [ ] Load testing (100k concurrent users)
- [ ] Security audit (OWASP Top 10)
- [ ] Database optimization

**Definition of Done:**

- Redis deployed and connected
- Rate limiting active on all API endpoints
- Webhook system fully functional
- Job queues processing emails, webhooks, reports
- Load testing completed successfully
- Security audit passed with no critical issues

See [`PHASE6_GUIDE.md`](./PHASE6_GUIDE.md) for step-by-step instructions.

---

## Phase 7 — Elite Automation Scripts

**Goal:** Build bulletproof maintenance tools to minimize manual intervention.

**Deliverables:**

- [ ] Health check script
- [ ] Security audit script
- [ ] Load testing suite
- [ ] Deployment automation script
- [ ] Database maintenance script
- [ ] Developer SDK (`@freightx/sdk`)
- [ ] Data seeding script

**Definition of Done:**

- All scripts created and tested
- Developer SDK published to npm
- Scripts integrated into CI/CD
- Deployment automation tested end-to-end

See [`PHASE7_GUIDE.md`](./PHASE7_GUIDE.md) for step-by-step instructions.

---

## Phase 8 — Study Guide & Learning Platform

**Goal:** Create comprehensive learning platform for understanding FreightX end-to-end.

**Deliverables:**

- [ ] FreightX Academy Next.js app
- [ ] Interactive architecture diagrams
- [ ] Database schema visualizer
- [ ] Feature catalog with videos
- [ ] Interactive API explorer
- [ ] CEO presentation mode
- [ ] Developer onboarding guide
- [ ] Interactive tutorials

**Definition of Done:**

- Academy app fully functional
- All sections complete
- CEO presentation polished
- Video tutorials recorded
- Documentation complete

See [`PHASE8_GUIDE.md`](./PHASE8_GUIDE.md) for step-by-step instructions.

---

## Phase 9 — Apple Maps-Style Live Maps

**Goal:** Premium mapping experience with Stadia dark tiles, SVG teardrop pins, and animated truck markers.

**Deliverables:**

- [x] Stadia Alidade Smooth Dark tile integration
- [x] SVG teardrop load pins with dual-layer route glow
- [x] Animated truck marker with direction indicator
- [x] Frosted glass LIVE badge and zoom controls
- [x] Fleet map with pulsing pins and glass tooltips
- [x] Leaflet global CSS overrides (glass popups, pulse keyframes)
- [x] Carrier load board: Bid Now button restored
- [x] Independent carrier truck posting (no company profile required)

**Definition of Done:**

- Dark map tiles render on all dashboards
- Load pins appear with teardrop shape and glow route
- Truck marker animates and shows direction
- Carrier can post a truck without completing company setup

See [`PHASE9_GUIDE.md`](./PHASE9_GUIDE.md) for step-by-step instructions.

---

## Phase 10 — Interactive Maps & Profile Enhancements

**Goal:** Complete profile management suite and enhanced live tracking with progress indicators.

**Deliverables:**

- [x] Help Center page with FAQ accordion (general, billing, technical)
- [x] Notifications Settings page with push/email/SMS toggles per event type
- [x] Documents page for carrier/broker verification uploads
- [x] Avatar upload via Supabase Storage (`avatars` bucket)
- [x] New Message FAB — modal for "Message about a Load" or "Message a User"
- [x] Automatic load notifications pushed to all carriers on load creation
- [x] Enhanced live tracking map with progress overlay and load info panel
- [x] Rate limiting library (`RateLimiter` class)
- [x] Webhooks migration + edge function deployed

**Definition of Done:**

- All profile sub-pages (help, notifications, documents) navigate correctly
- Avatar upload saves to Supabase and displays on profile
- New Message FAB opens search modal and starts conversation
- Carrier gets in-app notification when any shipper posts a load

See [`PHASE10_GUIDE.md`](./PHASE10_GUIDE.md) for step-by-step instructions.

---

## Phase 11 — AI Assisted Load Seeking

**Goal:** Natural language search and intelligent match scoring to surface the best loads for each carrier automatically.

**Deliverables:**

- [x] AI search bar with example prompt chips on carrier load board
- [x] `ai-load-search` Supabase Edge Function (Claude Haiku + keyword fallback)
- [x] Structured filter extraction: equipment, origin/dest states, pickup window, min rate/mile
- [x] `scoreLoad()` — 0–100 match score across 5 weighted categories
- [x] `rankLoads()` / `getTopMatches()` — sorted load list by match score
- [x] `MatchBadge` component — color-coded pill on each load card (green ≥80, orange 60–79, gray <60)
- [x] `useMatchScores` hook — re-ranks on load list updates

**Definition of Done:**

- Carrier types "Flatbed out of Texas going north" → load list filters correctly
- Match badge shows on every load card with accurate percentage
- Edge function returns structured JSON from Claude Haiku
- Keyword fallback works when `ANTHROPIC_API_KEY` is not configured

See [`PHASE11_GUIDE.md`](./PHASE11_GUIDE.md) for step-by-step instructions.

---

## Phase 12 — GPS Real-Time Tracking

**Goal:** Live driver position streaming so brokers and shippers can watch the truck move on the map in real time.

**Deliverables:**

- [x] Migration 012: `location_pings` table with lat/lng/accuracy/heading/speed + RLS
- [x] `useDriverLocation` hook — Web Geolocation API, smart ping (30s OR 50m movement)
- [x] Haversine distance calculation for movement threshold
- [x] `insertLocationPing()` utility writes pings to Supabase
- [x] `useLiveTracking` hook — Supabase Realtime channel, updates on INSERT
- [x] `location-cleanup` Edge Function — deletes pings >24 hours old
- [x] pg_cron schedule: cleanup runs every hour

**Definition of Done:**

- Driver's truck position updates on tracking map within 2 seconds of movement
- Tracking only active when load status is `in_transit`
- Cleanup function removes stale pings hourly
- No memory leaks — geolocation watch and Realtime channel removed on unmount

See [`PHASE12_GUIDE.md`](./PHASE12_GUIDE.md) for step-by-step instructions.

---

## Timeline Summary

```
Week 1         Phase 0  — Repo setup, CI/CD, tooling
Weeks 2–4      Phase 1  — Supabase, auth, environment
Weeks 5–8      Phase 2  — Core CRUD, real data, dashboards
Weeks 9–11     Phase 3  — Real-time, messaging, notifications
Weeks 12–15    Phase 4  — Booking flow, documents, lifecycle
Weeks 16–19    Phase 5  — Verification, Stripe, ratings
Weeks 20–27    Phase 6  — Testing, hardening, polish, launch
Week 28        Phase 7  — Elite automation scripts
Weeks 29–31    Phase 8  — Study guide & learning platform (FreightX Academy)
Week 32        Phase 9  — Apple Maps-style live maps
Week 33        Phase 10 — Interactive maps & profile enhancements
Week 34        Phase 11 — AI assisted load seeking
Week 35        Phase 12 — GPS real-time tracking
```

---

## Decision Log

| Date       | Decision                        | Rationale                                                                |
| ---------- | ------------------------------- | ------------------------------------------------------------------------ |
| 2026-02-17 | pnpm + Turborepo monorepo       | Future mobile app, shared types, JustInCase pattern                      |
| 2026-02-17 | React 19 + Vite 7 (not Next.js) | SPA is fine for load board, faster DX, existing prototype base           |
| 2026-02-17 | Supabase for backend            | Built-in auth, realtime, storage, RLS — replaces 3 separate services     |
| 2026-02-17 | Vercel for deploy               | Already configured, excellent Vite support, preview deploys on PRs       |
| 2026-02-17 | Stripe for payments             | PCI compliant, industry standard, never handle raw card data             |
| 2026-02-17 | Tailwind v3 + shadcn/ui         | shadcn compatibility, CSS variables for theming, orange/dark grey design |
| 2026-02-17 | Orange + dark grey theme        | Brand direction from UI mockups                                          |
|            |                                 |                                                                          |

---

## Competitive Intelligence — DAT Gap Analysis (added 2026-02-18)

Research based on DAT, Truckstop, Convoy, Transfix, Uber Freight, Loadsmart postmortems.

### The Core Strategic Insight

DAT is a **bulletin board with data intelligence**. It does not own the transaction.
FreightX's winning move: **own the transaction** — instant book → escrow payment → POD → same-day factoring payout.
No single integrated product does this today. This is the gap.

### What DAT Has That We Must Match (Phase 2–3)

- Rate analytics by lane + equipment (we have mock rate health; Phase 2 = real historical data)
- Load alert / saved search with push notifications
- Tri-haul / backhaul lane matching (find outbound + return loads together)
- Market truck-to-load ratio by region (demand index)
- PC\*Miler mileage integration (we use totalMiles field; Phase 2 = real calculation)

### What NO Major Board Has (our differentiation, Phases 4–5)

| Feature                                                  | Why it wins                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------- |
| Instant Book + in-app digital Rate Confirmation (e-sign) | Eliminates phone tag — the #1 pain point in freight                   |
| Payment escrow / "Guaranteed Pay" badge                  | #1 carrier fear is non-payment. DAT only shows credit scores          |
| Net Revenue Per Hour calculator (not just $/mi)          | Owner-ops price loads wrong — no tool does this math                  |
| Factoring integration + same-day pay on POD              | $100B/yr industry; owning this = massive retention                    |
| Counter-offer system with live market rate anchoring     | Kills phone negotiation; both sides see spot data during offer        |
| Facility reputation database (crowdsourced dwell times)  | Think Yelp for shippers/docks. DAT has zero. Carriers want this badly |
| ELD / HOS-aware load filtering                           | Only show loads a driver can legally complete on current hours        |
| Deadhead radius optimizer (3-5 load weekly sequences)    | Saves carriers 300–600 empty miles/week vs. random booking            |
| Automated IFTA mileage logging → quarterly tax report    | Owner-ops pay $400/quarter for this. Give it free = sticky            |
| Insurance marketplace (per-load, quote-and-bind in flow) | Loadsure/Cover Whale API; high-margin, high-retention                 |

### Why Convoy Failed (lessons)

- Great product, wrong unit economics — automated matching compressed broker margins to zero
- Relied on raising capital to fund the spread between shipper rates and carrier payments
- FreightX avoids this: we are a **marketplace**, not a principal. We never hold freight liability.

### Stack Notes vs Competitors

- DAT: Java (Spring Boot) backend, React frontend, PostgreSQL + Elasticsearch + Redis, AWS
- Truckstop: .NET/C# backend, React frontend, SQL Server, Azure
- Convoy: Node.js + Python (ML), PostgreSQL + DynamoDB, AWS + Kubernetes
- Uber Freight: Go microservices, PostgreSQL, GCP, custom ML matching
- **FreightX**: Supabase (PostgreSQL + Auth + Realtime + Storage) + Vercel = same data layer, 80% less infrastructure ops.
  At 100k+ concurrent loads, add: Elasticsearch (search), Redis (rate limiting/cache), Mapbox (visual routing).

---

## Post-Launch Roadmap (v2.0+)

After successful beta, prioritize based on user feedback:

1. Native mobile app (Expo React Native) — driver-focused
2. Mapbox GL route visualization (visual lane maps on every load)
3. AI-powered load matching engine (match trucks to loads automatically)
4. GPS tracking integration (Samsara, Macropoint, FourKites)
5. ELD / HOS integration (Motive/KeepTruckin API) — HOS-aware load filtering
6. Factoring partner integration (OTR Solutions, Apex Capital) — same-day pay
7. Payment escrow ("Guaranteed Pay") — surety/fintech partner
8. Facility reputation database (crowdsourced dock ratings)
9. IFTA mileage auto-logging + quarterly tax export
10. TMS integrations (MercuryGate, McLeod, TMW)
11. Insurance marketplace (Loadsure, Cover Whale per-load API)
12. DAT / Truckstop cross-posting API
13. Multi-language support (Spanish — 40% of owner-operators)
14. Open REST API + webhooks for enterprise shippers
15. Carbon emissions tracking per shipment (ESG reporting)

---

---

## ✅ Phase 13 — Enterprise Completion (March 2026)

**Status: Complete**

Phase 13 filled the critical gaps between a working MVP and an enterprise-grade platform.

### What was built:

**Step 0 — Gap Fixes**

- `carrier_preferences` migration (Phase 11 blocker fixed)
- `location-cleanup` pg_cron documentation (Phase 12 gap fixed)
- LLM model strategy: Haiku for parsing, Sonnet for reasoning

**13A — Critical Completions**

- Email notifications via Resend (7 templates, wired into all bid/load/booking mutations)
- SMS notifications via Twilio (critical events, opt-in)
- Server-side pagination on all list queries (`.range()`, `loadMore()` hooks)
- Audit log with admin viewer page

**13B — Enterprise Operations**

- Multi-user company teams (invite by email, role management, revoke access)
- Load templates (save/apply any form state)
- Digital e-signature on rate confirmations (canvas → Supabase Storage)
- Accessorial charges (detention, lumper, TONU etc. with broker approval + invoice total)

**13C — Trust & Intelligence**

- Saved searches + lane alerts (email + SMS + in-app on matching loads)
- Broker credit score display (avg days to pay, on-time %)
- Preferred carrier lists + carrier blocking (RLS enforced)
- Lane rate history (auto-populated on every booking)
- AI rate suggestion chip using Claude Sonnet on post-load form

**13D — Scale Infrastructure**

- Full-text search with GIN indexes + `search_vector` generated column
- Background notification queue with retry/dead-letter
- Real edge rate limiting via Vercel KV (replaces in-memory stub)

### Migrations added: 011–022

### Edge functions added: send-notification-email, send-sms, lane-alert, notification-worker

### Services added: email-notifications, company-members, saved-searches, rate-intelligence, accessorials

---

_This is a living document. Update the Decision Log as choices are made. Check boxes as phases are completed._
