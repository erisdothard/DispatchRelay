# DispatchRelay

**Multi-role logistics load board SaaS platform** connecting Carriers, Brokers, and Shippers in the freight industry. Formerly FreightX.

## Status

`Phases 1–10 Complete — Production Ready`

## Live Demo

**[dispatchrelay.co/demo](https://dispatchrelay.co/demo)** — pick a role, no sign-up. Or jump straight in as a [carrier](https://dispatchrelay.co/demo/carrier), [broker](https://dispatchrelay.co/demo/broker), [shipper](https://dispatchrelay.co/demo/shipper), or [driver](https://dispatchrelay.co/demo/driver).

The demo needs no database. When `VITE_SUPABASE_URL` is unset (or `VITE_DEMO_MODE=true`), `apps/web/src/lib/supabase.ts` routes every call to an in-memory demo client (`apps/web/src/lib/demo`) backed by seeded tables, so the whole app runs on sample data.

---

## What Is DispatchRelay?

DispatchRelay is a unified marketplace where:

- **Carriers** post available trucks, search for loads, bid, and track deliveries with live GPS
- **Brokers** post loads, search for available trucks, manage bids, and issue rate confirmations
- **Shippers** post freight, book carriers, and track shipments end-to-end

**Key differentiator:** Most competitors (DAT, Truckstop) serve one or two roles. DispatchRelay puts all three in one platform with real-time bidding, AI load matching, live GPS tracking, in-platform payments, and built-in carrier verification.

---

## Monorepo Structure

```
dispatchrelay/
├── apps/
│   └── web/                    # React 19 + Vite 6 SPA (primary app)
│       └── src/
│           ├── features/       # Feature-based components + hooks
│           ├── pages/          # Route-level page components
│           ├── services/       # Supabase data layer (9 services)
│           ├── lib/            # supabase.ts, rate-limit.ts, geocoding.ts…
│           └── shared/         # UI primitives, maps, nav, contexts
├── packages/
│   ├── shared/                 # Shared types and constants (@dispatchrelay/shared)
│   └── typescript-config/      # Shared tsconfig presets
├── freightx-academy/           # Next.js 16 visual learning platform (port 3001)
├── supabase/
│   └── functions/              # Deno edge functions (8 deployed)
├── database/
│   └── migrations/             # Ordered SQL migration files (001–012, skip 011)
├── docs/                       # Phase guides, roadmap, product brief
├── scripts/                    # Ops scripts: health, deploy, seed, audit, load-test
├── test/
│   └── test-features/          # Vitest unit tests organized by phase (1–10)
├── .github/
│   └── workflows/ci.yml        # Lint → Typecheck → Test → Build
├── package.json                # Root (pnpm workspaces + turbo)
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Tech Stack

| Layer        | Technology                             |
| ------------ | -------------------------------------- |
| Framework    | React 19 + Vite 6                      |
| Language     | TypeScript 5.6 (strict)                |
| Styling      | Tailwind CSS v3 (custom fx-\* tokens)  |
| Routing      | React Router v6                        |
| Database     | Supabase (PostgreSQL + RLS)            |
| Auth         | Supabase Auth (JWT + OAuth)            |
| Realtime     | Supabase Realtime (WebSocket)          |
| Storage      | Supabase Storage (S3)                  |
| Payments     | Stripe (subscriptions + invoices)      |
| Maps         | Leaflet + React Leaflet (Stadia tiles) |
| PDF          | jsPDF (rate confirmations)             |
| Rate Limit   | Upstash Redis (sliding window)         |
| AI Search    | Anthropic Claude Haiku (load matching) |
| GPS Tracking | location_pings table + Realtime        |
| Monitoring   | Sentry                                 |
| Deploy       | Vercel                                 |
| Monorepo     | pnpm + Turborepo                       |
| Academy      | Next.js 16                             |

---

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 10

### Install

```bash
pnpm install
```

### Develop

```bash
# Main app → http://localhost:5173
npm run dev:web

# Academy → http://localhost:3001
npm run dev:academy

# Both simultaneously
npm run dev:all
```

### Build

```bash
pnpm build:web
```

### Type Check / Lint / Test

```bash
pnpm typecheck
pnpm lint
pnpm test
```

### Format

```bash
pnpm format
```

### Ops Scripts

```bash
npm run health-check      # Ping all services — Supabase, Redis, edge functions
npm run security-audit    # Check deps for vulnerabilities
npm run audit             # Generate timestamped code audit report
npm run seed              # Insert test loads, users, trucks into DB
npm run db:maintenance    # Expire stale loads + prune location_pings > 24h
npm run deploy            # Typecheck → build → health-check → Vercel push
npm run load-test         # Run concurrent GET load test
npm run perf-monitor      # Collect performance metrics
```

---

## Environment Variables

Copy `.env.example` to `apps/web/.env.local` and fill in your values.

```bash
cp .env.example apps/web/.env.local
```

| Variable                        | Required | Description                                       |
| ------------------------------- | -------- | ------------------------------------------------- |
| `VITE_SUPABASE_URL`             | ✅       | Supabase project URL                              |
| `VITE_SUPABASE_ANON_KEY`        | ✅       | Supabase anon/public key                          |
| `VITE_STRIPE_PUBLISHABLE_KEY`   | ✅       | Stripe publishable key                            |
| `VITE_FMCSA_API_KEY`            | ✅       | FMCSA SAFER API key                               |
| `VITE_UPSTASH_REDIS_REST_URL`   | ✅       | Upstash Redis REST URL                            |
| `VITE_UPSTASH_REDIS_REST_TOKEN` | ✅       | Upstash Redis token                               |
| `ANTHROPIC_API_KEY`             | ✅       | Claude API key for AI load search (edge function) |
| `VITE_SENTRY_DSN`               | optional | Sentry error tracking                             |
| `VITE_APP_URL`                  | optional | App base URL (default: http://localhost:5173)     |
| `VITE_GOOGLE_MAPS_API_KEY`      | optional | Google Maps (fallback geocoding)                  |

---

## Database

Migrations live in `database/migrations/`. Run them **in order** in the Supabase SQL editor:

| File                            | Contents                                                     |
| ------------------------------- | ------------------------------------------------------------ |
| `001-initial-schema.sql`        | profiles, companies, loads, trucks, conversations, messages  |
| `002-notifications.sql`         | notifications table                                          |
| `003-bids.sql`                  | bids table + `accept_bid()` RPC                              |
| `004-documents.sql`             | documents table + storage buckets                            |
| `005-book-now.sql`              | bookings table                                               |
| `006-carrier-verifications.sql` | carrier_verifications + FMCSA                                |
| `007-ratings.sql`               | ratings + `update_company_rating()` trigger                  |
| `008-subscriptions.sql`         | subscriptions, invoices + `auto_create_invoice()` trigger    |
| `009-webhooks.sql`              | webhooks, webhook_deliveries + `trigger_webhook_event()` RPC |
| `010-missing-features.sql`      | tracking_milestones                                          |
| ~~011~~                         | _(not present — sequence skipped)_                           |
| `012-location-pings.sql`        | location_pings table for real-time GPS tracking              |

---

## Edge Functions (Supabase Deno)

| Function                  | Trigger       | Description                               |
| ------------------------- | ------------- | ----------------------------------------- |
| `health`                  | GET request   | DB ping + uptime check                    |
| `create-checkout-session` | Client call   | Creates Stripe checkout URL               |
| `stripe-webhook`          | Stripe event  | Syncs subscription + invoice state        |
| `auto-expiry-check`       | Cron (daily)  | Expires stale bids + insurance certs      |
| `load-expiry`             | Cron (hourly) | Auto-expires posted loads                 |
| `webhook-delivery`        | Queue         | Retries failed webhook deliveries         |
| `ai-load-search`          | Client call   | Claude Haiku natural-language load search |
| `location-cleanup`        | Cron (daily)  | Deletes location_pings older than 24h     |

---

## Commit Convention

This repo enforces [Conventional Commits](https://www.conventionalcommits.org/).

**Format:** `type(scope): description`

**Types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `perf`

**Scopes:** `web`, `shared`, `db`, `auth`, `loads`, `trucks`, `bookings`, `messages`, `notifications`, `payments`, `verify`, `analytics`, `ci`, `docs`, `deps`, `config`

**Examples:**

```
feat(loads): add AI load search with Claude Haiku
fix(auth): handle token refresh on session expiry
chore(deps): upgrade supabase-js to 2.x
docs(db): add migration notes for phase 3
```

---

## Branch Strategy

| Branch      | Purpose                                  |
| ----------- | ---------------------------------------- |
| `main`      | Production — protected, no direct pushes |
| `develop`   | Integration branch — PRs merge here      |
| `feature/*` | Feature branches cut from develop        |
| `fix/*`     | Bug fix branches                         |

---

## Documentation

| Document                                                    | Description                                             |
| ----------------------------------------------------------- | ------------------------------------------------------- |
| [PRODUCT_BRIEF.md](./docs/PRODUCT_BRIEF.md)                 | Vision, users, market opportunity, competitive analysis |
| [FEATURE_CATALOG.md](./docs/FEATURE_CATALOG.md)             | Full feature list with priorities                       |
| [IMPLEMENTATION_STATUS.md](./docs/IMPLEMENTATION_STATUS.md) | Phase-by-phase completion checklist                     |
| [DEVELOPMENT_ROADMAP.md](./docs/DEVELOPMENT_ROADMAP.md)     | 10-phase plan, timeline, decisions                      |
| [DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md)           | Vercel + Supabase production setup                      |
| [CLIENT_HANDOFF_GUIDE.md](./docs/CLIENT_HANDOFF_GUIDE.md)   | Handoff documentation                                   |
| [TESTING.md](./docs/TESTING.md)                             | Test suite guide + E2E instructions                     |
| [PHASE0_GUIDE.md](./docs/PHASE0_GUIDE.md)                   | Repo setup, CI/CD, tooling                              |
| [PHASE1_GUIDE.md](./docs/PHASE1_GUIDE.md)                   | Database, auth, environment                             |
| [PHASE2_GUIDE.md](./docs/PHASE2_GUIDE.md)                   | Core CRUD data layer                                    |
| [PHASE3_GUIDE.md](./docs/PHASE3_GUIDE.md)                   | Real-time, messaging, notifications                     |
| [PHASE4_GUIDE.md](./docs/PHASE4_GUIDE.md)                   | Booking workflow, bidding, documents                    |
| [PHASE5_GUIDE.md](./docs/PHASE5_GUIDE.md)                   | Verification, payments, ratings                         |
| [PHASE6_GUIDE.md](./docs/PHASE6_GUIDE.md)                   | Testing, optimization, launch prep                      |
| [PHASE6.5_GUIDE.md](./docs/PHASE6.5_GUIDE.md)               | Production hardening (webhooks, queues)                 |
| [PHASE7_GUIDE.md](./docs/PHASE7_GUIDE.md)                   | Automation scripts + health checks                      |
| [PHASE8_GUIDE.md](./docs/PHASE8_GUIDE.md)                   | Academy + study guide                                   |
| [PHASE9_GUIDE.md](./docs/PHASE9_GUIDE.md)                   | Live maps, AI search, GPS tracking, match scoring       |
| [PHASE10_GUIDE.md](./docs/PHASE10_GUIDE.md)                 | Profile enhancements, messaging FAB, rate limiter       |
