# DispatchRelay — Claude Context

> Created: 2026-04-01 | Stack: React 19 + Vite + TypeScript + Supabase | Status: active (Phase 20)

---

## Project Overview

Multi-role SaaS freight marketplace for 3 Aces Trucking Inc. Connects carriers, drivers, brokers, and shippers for load booking, dispatch, and fleet management. Built as flagship case study for AI consulting firm.

---

## Architecture Map

```
dispatchrelay/                    # Turborepo monorepo (pnpm)
├── apps/
│   └── web/                      # Main React app (Vite + React 19)
│       ├── api/                  # Vercel edge functions (waitlist)
│       ├── src/
│       │   ├── contexts/         # AuthContext, NotificationContext
│       │   ├── features/         # Feature-specific components
│       │   ├── pages/            # Route components (carrier, driver, broker, shipper, admin)
│       │   ├── services/         # Supabase API calls
│       │   ├── shared/           # Shared components, hooks, utils
│       │   ├── lib/              # Utilities (supabase client, cn, schemas)
│       │   ├── main.tsx          # Entry point
│       │   └── App.tsx           # Route configuration
│       ├── package.json          # Dependencies, scripts
│       └── vite.config.ts        # Vite config
├── packages/
│   ├── shared/                   # Shared types, constants
│   │   └── src/
│   │       ├── types/            # TypeScript types
│   │       └── constants/        # App-wide constants
│   └── typescript-config/        # Shared TS config
├── database/
│   └── migrations/               # SQL migrations
├── supabase/
│   └── functions/                # Edge functions (ai-load-search, etc.)
├── scripts/                      # Ops scripts (health-check, deploy, seed, etc.)
│   └── seo/                      # Static marketing-site generator (zero deps)
├── docs/                         # Feature catalog, roadmap, phase guides
├── test/                         # Test utilities
├── .env.example                  # Env var template
├── turbo.json                    # Turborepo config
├── package.json                  # Root workspace scripts
└── CLAUDE.md                     # This file
```

---

## Key Commands

```bash
# Development
pnpm dev:web                     # Start web app dev server (Vite)
pnpm dev:all                     # Start all apps

# Build & Test
pnpm build                       # Build all apps (Turborepo)
pnpm build:web                   # Build web app only
pnpm build:site                  # Generate the static marketing site into dist (run AFTER build:web)
pnpm lint                        # Lint all packages
pnpm typecheck                   # TypeScript check all packages
pnpm test                        # Run all tests (Vitest + Playwright)
pnpm format                      # Format all files (Prettier)
pnpm format:check                # Check formatting

# Ops
pnpm health-check                # Run system health checks
pnpm security-audit              # Security audit
pnpm seed                        # Seed database with test data
pnpm deploy                      # Deploy to Vercel

# Supabase Edge Functions
npx supabase functions deploy <name> --project-ref gqmcuzhdqvfczqreklpk
npx supabase secrets set KEY=value --project-ref gqmcuzhdqvfczqreklpk
```

---

## Database

- **Status:** The Supabase project is retired. The app runs as a no-database demo on an in-memory backend (`apps/web/src/lib/demo`), which activates when `VITE_SUPABASE_URL` is unset or `VITE_DEMO_MODE=true`. Public demo: https://dispatchrelay.co/demo and `/demo/:role` (carrier, broker, shipper, driver). The notes below describe the retired backend.
- **Supabase URL (retired):** `https://gqmcuzhdqvfczqreklpk.supabase.co`
- **Auth:** Supabase Auth (JWT, email/password, magic links)
- **RLS:** Enabled on all tables
- **Key tables:** users, companies, loads, trucks, drivers, bookings, messages, notifications, payments, equipment, routes, team_members
- **Edge Functions:** ai-load-search (Anthropic Claude API for semantic load search)
- **See:** `schema_map.md` in the Claude memory for the original checkout (`~/.claude/projects/<original-checkout-slug>/memory/`) for the full schema as it stood before retirement

---

## Environment Variables

```bash
# Required (apps/web/.env.local)
VITE_SUPABASE_URL=https://gqmcuzhdqvfczqreklpk.supabase.co
VITE_SUPABASE_ANON_KEY=<from Supabase dashboard>
VITE_STRIPE_PUBLISHABLE_KEY=<from Stripe dashboard>
VITE_UPSTASH_REDIS_REST_URL=<from Upstash>
VITE_UPSTASH_REDIS_REST_TOKEN=<from Upstash>
VITE_APP_URL=http://localhost:5173
ANTHROPIC_API_KEY=<for edge functions>
WAITLIST_WEBHOOK_URL=<server-side only — receives marketing-site waitlist signups>

# Optional
VITE_FMCSA_API_KEY=<carrier verification>
VITE_GOOGLE_MAPS_API_KEY=<map search>
VITE_SENTRY_DSN=<error monitoring>
VITE_VAPID_PUBLIC_KEY=<push notifications>
```

See `.env.example` for full list with comments.

---

## Stack Details

**Frontend:** React 19, Vite 6, React Router 6, TypeScript 5.6
**State:** TanStack Query v5 (queries/mutations), Context API (auth, notifications)
**UI:** Tailwind CSS v3, shadcn/ui components, Lucide icons
**Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
**Payments:** Stripe
**Monitoring:** Sentry
**Rate Limiting:** Upstash Redis
**Deployment:** Vercel (web app), Supabase (edge functions)
**Monorepo:** Turborepo + pnpm workspaces
**CI/CD:** GitHub Actions + Husky (pre-commit: prettier, commit-msg: commitlint, pre-push: format+typecheck+tests)

---

## Marketing Site vs. App

The public marketing site and the application are two separate surfaces sharing one deploy:

- **`/`, `/pricing`, `/for/*`** — static HTML generated by `scripts/seo/generate.mjs` after the
  Vite build. No React, no bundle, content in the raw response. Authored as data in
  `scripts/seo/content/pages.mjs`; never hand-edit files in `dist/`.
- **`/app` and every app route** — the SPA. Its entry is `dist/app.html` (the generator moves
  `dist/index.html` there), and `vercel.json` rewrites non-marketing paths to it.
- Build-time validators fail the build on duplicate titles, wrong canonicals, thin pages or
  template leakage. See `docs/SEO_SYSTEM_PLAN.md`.

---

## Project Rules

### Code Style

- Direct Supabase calls in services/ (no React Query wrapper library needed — using TanStack Query directly)
- Custom hooks pattern: `useLoads()`, `useAuth()`, etc.
- TypeScript strict mode — no `any`
- Zod schemas for validation
- Feature-folder structure in `apps/web/src/features/`

### Off-limits without approval

- `database/migrations/` — managed manually
- `package.json` dependencies — confirm before adding
- New env vars — update `.env.example` and docs
- Schema changes — discuss first

### Commit Format

- Conventional commits: `feat(scope):`, `fix(scope):`, `docs(scope):`
- Valid scopes: web, shared, db, auth, loads, trucks, bookings, messages, notifications, payments, verify, analytics, ci, docs, deps, config

---

## Test Accounts

Demo logins (demo builds only). Password for all: `dispatchrelay` (override with `VITE_DEMO_PASSWORD`).

- Carrier: `carrier@dispatchrelay.co` (Marcus Rivera, Rivera Transport Inc)
- Broker: `broker@dispatchrelay.co` (Sarah Chen, Apex Freight Solutions)
- Shipper: `shipper@dispatchrelay.co` (James Park, Park Manufacturing Co)
- Driver: `driver@dispatchrelay.co` (Carlos Mendez, viewer in the carrier company)

---

## Active Work

### Phase 21 — SEO / AI visibility (in progress)

- Phase 1 complete: static marketing site at `/`, `/pricing`, `/for/{carriers,brokers,shippers}`;
  SPA moved to `/app`; waitlist endpoint; sitemap + robots; validators + 44 tests
- **Open:** verify the Vercel rewrite on a preview deploy (R-2), set `WAITLIST_WEBHOOK_URL`,
  replace placeholder pricing with real tiers
- Next: Phase 2 free public tools (carrier lookup, lane cost calculator via OSRM)
- Plan and decision record: `docs/SEO_SYSTEM_PLAN.md`

### Recently Completed

- Phase 20: Enterprise polish — load editing, BOL signatures in PDF, broker+carrier hybrid roles, company logo upload, GPS hardening, canceled load UX, dispatch permission fixes
- Phase 19: Live load ops production readiness — load assignments, equipment pills, incident log, GPS accuracy
