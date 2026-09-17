# DispatchRelay — SEO / AI-Visibility Content System

> **Status:** Phase 0 (audit) complete — awaiting approval for Phase 1
> **Owner:** Eris Thard · **Created:** 2026-09-17 · **Last updated:** 2026-09-17

This document is the running record for the automated SEO / AI-visibility system on the
public marketing side of `dispatchrelay.co`. It is updated at the end of every phase.

---

## 1. Phase 0 — Audit Findings

All findings below were verified against the checked-out repo and a real production build
(`pnpm build:web`, then serving `apps/web/dist` and fetching it over HTTP). Nothing here is
inferred from documentation.

### 1.1 Stack and build

| Item       | Finding                                                                                                                           |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo   | Turborepo + pnpm workspaces (`pnpm@10.29.2`, `engines.node: 20.x`)                                                                |
| Apps       | **One**: `apps/web` (`@dispatchrelay/web`). Root scripts also reference a `freightx-academy` app that **does not exist** — stale. |
| Packages   | `packages/shared` (types + constants), `packages/typescript-config`                                                               |
| Build tool | Vite 6 (`@vitejs/plugin-react`), plus gzip + brotli emit, optional `rollup-plugin-visualizer`                                     |
| Framework  | React 19, React Router 6 (`react-router-dom`), TypeScript 5.6 strict                                                              |
| Styling    | Tailwind CSS v3, shadcn-style components, Lucide icons                                                                            |
| Hosting    | Vercel, configured in `apps/web/vercel.json` (`framework: "vite"`, `outputDirectory: "dist"`)                                     |
| CI         | `.github/workflows/ci.yml` — lint → format:check → typecheck → test → build; Playwright E2E on PRs                                |
| Git hooks  | Husky: `pre-commit` lint-staged, `commit-msg` commitlint, `pre-push` format + typecheck + tests                                   |
| Tests      | Vitest, `environment: 'node'`, include globs `src/**/*.test.ts` and `../../test/test-features/**/*.test.ts`                       |

### 1.2 How the site renders today — **verified, not assumed**

The app is a **pure client-side SPA**. There is no SSR and no SSG anywhere in the pipeline.

`apps/web/vercel.json` rewrites everything that is not `/api/*`, `manifest.json`, `/assets/*`,
or a dotted filename to `/index.html`:

```json
{ "source": "/((?!api/|manifest\\.json|assets/|.*\\.).*)", "destination": "/index.html" }
```

The build emits exactly **one** HTML file (`dist/index.html`, 3.3 KB). Serving `dist` and
fetching it produced:

```
$ curl -s http://localhost:4180/        | md5sum   →  26e07eb3940b1676d5a7d6a2f64ee583
$ curl -s http://localhost:4180/privacy | md5sum   →  26e07eb3940b1676d5a7d6a2f64ee583
$ curl -s http://localhost:4180/anything-at-all | md5sum → 26e07eb3940b1676d5a7d6a2f64ee583
```

**Every URL on the site returns byte-identical HTML.** The entire `<body>` a crawler receives is:

```html
<body>
  <div id="root">
    <div style="height: 100vh; ...">
      <div style="width: 40px; height: 40px; border: 3px solid #38383a; ..."></div>
    </div>
  </div>
</body>
```

That is a loading spinner. Measured against the raw response:

- **0** `<h1>` elements
- **0** `<script type="application/ld+json">` blocks
- **0** words of real content (the ~37 "words" counted are CSS text inside `style` attributes)
- **0** internal links

**Consequence.** Any crawler or AI retrieval system that does not execute JavaScript — which
includes most LLM training and retrieval fetchers, and every social/link unfurler — sees a
blank page with one generic title on every URL. The site is currently invisible to them. This
is the single finding that everything in Phase 1 exists to fix.

### 1.3 Head tags and metadata

`apps/web/index.html` carries a reasonable but **completely static** head. Because it is the only
HTML file, every route shares it:

- **One title for the whole site** — `DispatchRelay — Move Freight Smarter` on `/privacy`, `/login`, every future marketing page.
- **One meta description** for the whole site.
- **`<link rel="canonical" href="https://dispatchrelay.co" />` is hardcoded to the homepage.** Today this is merely useless; the moment marketing pages exist it becomes _actively harmful_ — every page would self-canonicalize to `/`, telling search engines to drop them from the index. This must be fixed before, or in the same change as, any new page.
- Open Graph and Twitter Card tags exist but are homepage-only for the same reason.
- **No head manager.** `grep` for `document.title`, `helmet`, `Helmet` across `apps/web/src` returns nothing, and `react-helmet` is not a dependency. Titles do not change per route even client-side, in a real browser, for a real user.
- **`<meta name="viewport" content="... maximum-scale=1.0, user-scalable=no" />`** — blocks pinch-zoom. This is a WCAG 2.1 SC 1.4.4 (Resize Text) failure and a documented mobile-usability signal. Slated for removal in Phase 1 per your instruction.
- Stale `dns-prefetch` to `https://qeovhjdrwihnyfcbnujk.supabase.co` — a **different** project ref than the one in `CLAUDE.md` (`gqmcuzhdqvfczqreklpk`), and the Supabase project is retired anyway. Dead hint.

### 1.4 Existing SEO assets

`apps/web/public/robots.txt` — hand-written, serves fine, but:

- Disallows `/carrier/`, `/broker/`, `/shipper/`, `/messages`, `/profile`, `/track/`, `/onboarding`, `/reset-password`.
- **Does not** disallow `/driver/` or `/admin/`, though they are equally private — inconsistent.
- `Allow: /` followed by `Allow: /privacy` and `Allow: /terms` is redundant.
- Correctly points at `https://dispatchrelay.co/sitemap.xml`.

`apps/web/public/sitemap.xml` — 4 static URLs (`/`, `/login`, `/privacy`, `/terms`), no
`<lastmod>`, hand-maintained. It will go stale the instant content generation starts; it needs
to become a build artifact.

`apps/web/public/manifest.json` — healthy PWA manifest, no changes needed.

### 1.5 Marketing surface — what exists

Public (unauthenticated) routes in `apps/web/src/App.tsx`:

| Route                  | Component                   | Content value                                                                                                         |
| ---------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `/`                    | `pages/splash.tsx`          | 241 lines, ~95% of it a hand-drawn inline truck SVG. A headline and a CTA button. Essentially **no indexable prose**. |
| `/login`               | `pages/login.tsx`           | Auth form                                                                                                             |
| `/demo`, `/demo/:role` | `pages/demo.tsx`            | Demo role picker                                                                                                      |
| `/privacy`, `/terms`   | `pages/legal/*`             | Legal copy                                                                                                            |
| `/t/:token`            | `pages/public-tracking.tsx` | Per-shipment tracking, should stay noindex                                                                            |

**There is no `/pricing` page** — `grep -ril "pricing"` across `apps/web/src` returns nothing.
There are no tool pages, no comparison pages, and no role/persona pages. The marketing site
that this project is meant to grow **does not exist yet**; Phase 1 is building it, not
retrofitting it. That is good news: there is no legacy marketing markup to preserve.

Everything else in `App.tsx` (carrier, broker, shipper, driver, admin, profile, messages) sits
behind `<ProtectedRoute>` and stays client-side. Confirmed: **the logged-in app and the
marketing site share no routing concerns**, so they can be split cleanly.

### 1.6 Reusable integrations for Phase 2 tools

**FMCSA — `apps/web/src/features/verification/lib/fmcsa.ts`** (exists and works):

- Hits `https://mobile.fmcsa.dot.gov/qc/services/carriers/{mc}` and `.../carriers/docket-number/{dot}`.
- Returns `{ status, legalName, dotNumber, mcNumber, safetyRating, csaScore }`.
- Has demo-mode and placeholder-key fallbacks already.

⚠️ **Security issue for reuse as a public tool.** The key is read as
`import.meta.env.VITE_FMCSA_API_KEY`, and the fetch appends `?webKey=${API_KEY}` **from the
browser**. Any `VITE_`-prefixed variable is inlined into the shipped JS bundle. Today that key
is only exposed to logged-in users; putting the same code behind a **public, no-login tool**
would hand your FMCSA web key to every anonymous visitor and every scraper, and the resulting
rate-limit burn would land on your key. The lookup logic is reusable; **the transport is not.**
Phase 2 must proxy it server-side under a non-`VITE_` secret. This also avoids widening the CSP
`connect-src`.

Related: `supabase/functions/carrier-health-check/index.ts` and
`apps/web/src/services/verification.service.ts` also touch FMCSA, but both depend on the retired
Supabase backend — not reusable for public tools.

**Rate confirmation — `apps/web/src/features/bookings/lib/generate-rate-con.ts`**:

- 316 lines, client-side `jsPDF`, letter format, branded header. Clean and self-contained.
- Signature: `generateRateCon({ load: Load, carrierName, carrierMC?, brokerName, brokerContact? })`.
- **Coupling:** takes a full `Load` from `@dispatchrelay/shared`. A public generator has no
  `Load` record. Reuse requires widening the parameter to a plain field object — a **non-breaking,
  additive refactor** (existing callers keep working), not a rewrite. Tool #3 is therefore cheap.

**Fuel / diesel pricing:** no EIA integration exists. `grep` hits for "diesel" are all demo seed
data (`lib/demo/domains/...`). Tool #2 needs a new EIA client from scratch.

**Distance/miles:** `mapbox-gl` and `leaflet` are present, and CSP already allows
`nominatim.openstreetmap.org` for geocoding. Phase 2 tool #2 will need a routing distance source —
flagged as an open decision in §5.

### 1.7 Serverless / API layer

**There is no `api/` directory anywhere in the repo.** `apps/web/vercel.json` rewrites
`/api/(.*)` → `/api/$1`, but nothing serves those paths — the rewrite is a no-op placeholder.

`middleware.ts` at the repo root imports `NextRequest`/`NextResponse` from `next/server`, but
**`next` is not a dependency of this project and this is not a Next.js app.** The file cannot
execute as written. It is pre-existing dead code. Flagging it only — I will not touch it, as it
sits outside the scope you gave me.

So Phase 2 requires standing up the first real serverless functions in this repo. That is
additive and touches no app logic.

### 1.8 Backend status

Per `CLAUDE.md`, the Supabase project is **retired**; the app runs on an in-memory demo backend
(`apps/web/src/lib/demo`) when `VITE_SUPABASE_URL` is unset. **This is a positive for this
project**: the public tools and marketing pages need no database, no auth, and no schema
changes. Nothing in this plan touches the database, auth, or payment code.

---

## 2. Proposed Architecture

### 2.1 The core decision: how to pre-render

Three options were considered against "least invasive for this stack."

| Option                                                                        | Verdict                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Migrate to Vike / vite-react-ssg**                                       | Rejected. Requires rewriting `App.tsx` routing and the app entry — directly violates "do not modify existing app logic."                                                                                                                |
| **B. Headless-browser post-build snapshot** (Playwright is already installed) | Rejected as primary. Zero app changes, but it renders the _existing_ SPA — and the existing marketing pages have no content to snapshot. It also adds a slow, flaky browser step to every build for pages that never needed JavaScript. |
| **C. Static generation of marketing pages, app untouched**                    | **Recommended.**                                                                                                                                                                                                                        |
| **D. Separate Next.js app for marketing**                                     | Viable, strongest long-term. Rejected for now as heaviest: second app, second build, second deploy target, path-based rewrite between them, duplicated design system.                                                                   |

**Recommendation — Option C.** Marketing pages are content, not application. They do not need
React at runtime. A build step reads content from `/content`, renders it through templates, and
emits real static HTML into `dist/`:

```
dist/
├── index.html                          ← SPA entry (unchanged, still serves the app)
├── pricing/index.html                  ← static, full content in raw HTML
├── tools/carrier-lookup/index.html     ← static content + small interactive island
├── compare/dispatchrelay-vs-dat/index.html
├── for/small-brokers/index.html
├── sitemap.xml                         ← generated, not hand-maintained
└── assets/…                            ← unchanged
```

Why this wins for this specific stack:

1. **Zero changes to app logic, auth, routing, or payments.** The generator runs _after_
   `vite build` and only _adds_ files. `App.tsx` is not edited.
2. **Vercel serves these natively.** `rewrites` in `vercel.json` are evaluated _after_ the
   filesystem check, so `dist/pricing/index.html` is served at `/pricing` and the SPA fallback
   never fires for it. Directory-style `index.html` (rather than `pricing.html`) avoids any
   dependency on `cleanUrls`. **Flagged for verification on a preview deploy — see §5.**
3. **Perfect for AI crawlers.** Content is in the initial HTML response with no JS execution,
   no hydration, and no loading state. Verifiable with a single `curl | grep`.
4. **The Phase 3 pipeline falls out of it for free.** The generator's input is already
   structured content; Phase 3 just adds an authoring step in front of it.
5. **Fast.** Content pages ship no React bundle at all.

**Interactivity (Phase 2 tools).** Each tool page is static HTML — headline, explanation, FAQ,
JSON-LD, CTA all in the raw response — with one `<div id="tool-root">` that a small, separately
bundled island script mounts into. The prose is indexable whether or not the island loads; the
island is progressive enhancement.

**The homepage (`/`).** This is the one place needing care: `dist/index.html` is the SPA entry,
and overwriting it would break every deep link in the app. Proposal: generate the marketing
homepage **into the existing `#root` div** of `index.html` as pre-rendered markup, which React 19
replaces on mount. Crawlers get full content; the app boots exactly as it does today. This is
called out as decision **D-1** in §5 because it is the only part of Phase 1 that writes into a
file the app depends on.

### 2.2 Per-page metadata

A single source of truth per page — title, description, canonical, OG/Twitter, JSON-LD — lives
in the content record and is rendered into that page's `<head>` by the generator. The hardcoded
site-wide `<link rel="canonical">` in `apps/web/index.html` is corrected to the homepage's own
URL so it stops mis-canonicalizing the new pages.

### 2.3 Data flow

```
content/*.json  ──┐
competitors.json ─┼──►  scripts/seo/generate.mjs  ──►  validators  ──►  dist/**/index.html
templates/       ─┘            (Phase 1: hand-authored content)         + dist/sitemap.xml
                               (Phase 3: Anthropic-drafted content)
```

Validators run **between** generation and emit, and **fail the build** on violation (Phase 3).

---

## 3. Proposed File Structure

Everything below is **new**. No existing file is restructured.

```
content/                                  # NEW — content source of truth (Phase 3)
├── competitors.json                      #   hand-maintained by you; never scraped
├── tools/*.json
├── comparisons/*.json
└── roles/*.json

scripts/seo/                              # NEW — generator + validators
├── generate.mjs                          #   content + template → static HTML
├── render/
│   ├── layout.mjs                        #   shared shell: head, header, footer
│   ├── head.mjs                          #   title/description/canonical/OG/Twitter
│   └── jsonld.mjs                        #   Organization, SoftwareApplication, FAQPage
├── sitemap.mjs                           #   generates sitemap.xml from emitted pages
├── validators/
│   ├── jsonld.mjs                        #   parses + shape-checks every JSON-LD block
│   ├── required-fields.mjs
│   ├── numbers-match-source.mjs          #   every number traces to a source field
│   ├── similarity.mjs                    #   near-duplicate detection across pages
│   └── claims.mjs                        #   no claim without a source field
├── authoring/                            # Phase 3
│   └── draft.mjs                         #   Anthropic API drafting, one row at a time
└── monitor/                              # Phase 4
    └── visibility.mjs                    #   ~10 buyer questions → CSV

api/                                      # NEW — Vercel serverless (Phase 2)
├── carrier-lookup.ts                     #   FMCSA proxy; key stays server-side
└── fuel-price.ts                         #   EIA proxy + cache

apps/web/src/marketing/                   # NEW — interactive islands only
└── islands/
    ├── carrier-lookup.tsx
    ├── lane-calculator.tsx
    └── rate-con-generator.tsx

test/test-features/seo/                   # NEW — tests live here so Vitest picks them up
├── validators.test.ts
├── carrier-lookup.test.ts
└── lane-cost.test.ts

data/                                     # NEW — refreshed monthly by CI (Phase 4)
└── fuel-prices.json

docs/SEO_VISIBILITY_LOG.csv               # NEW — weekly monitor output (Phase 4)
```

**Note on test placement.** `apps/web/vite.config.ts` includes only `src/**/*.test.ts` and
`../../test/test-features/**/*.test.ts`. Tests placed in `scripts/` would be **silently skipped**.
Putting them under `test/test-features/seo/` makes them run in CI and in the `pre-push` hook with
no config change. (Also worth knowing: the include globs match `.test.ts` but **not** `.test.tsx`.)

---

## 4. Environment Variables and Secrets

No key is ever committed. Note the deliberate absence of the `VITE_` prefix on all three —
`VITE_*` variables are **inlined into the browser bundle** and would be public.

| Variable            | Used by                              | Where it lives                    | Notes                                                                                                                                                     |
| ------------------- | ------------------------------------ | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY` | Phase 3 drafting, Phase 4 monitor    | GitHub secret; local `.env.local` | Already in `.env.example`. Build-time / CI only — never shipped to the browser.                                                                           |
| `FMCSA_WEBKEY`      | `api/carrier-lookup.ts`              | Vercel env + GitHub secret        | **New.** Server-side twin of the existing `VITE_FMCSA_API_KEY`. The `VITE_` one stays for the logged-in verification flow; the public tool uses this one. |
| `EIA_API_KEY`       | `api/fuel-price.ts`, monthly refresh | Vercel env + GitHub secret        | **New.** Free registration at `eia.gov/opendata`.                                                                                                         |

`.env.example` and `turbo.json`'s `globalEnv` will both be updated when these are introduced
(Phase 2), per the CLAUDE.md rule on new env vars.

---

## 5. Risks and Open Decisions

### Risks

| #    | Risk                                                                                                                                                                                                          | Mitigation                                                                                                                                                                                        |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1  | **Canonical tag currently points every URL at `/`.** Ship a marketing page without fixing it and Google is told to de-index it.                                                                               | Fix the canonical in the **same commit** as the first new page. Non-negotiable ordering.                                                                                                          |
| R-2  | **Vercel rewrite could swallow the new static pages.** The SPA fallback regex matches `/pricing`. It _should_ lose to the filesystem check, but this is a behaviour I have not yet confirmed on this account. | Verify on a preview deploy with `curl` before merging Phase 1. Fallback: add explicit negative-lookahead entries to the rewrite source.                                                           |
| R-3  | **FMCSA key exposure** if the existing browser-side client is reused for a public tool (§1.6).                                                                                                                | Server-side proxy only; `FMCSA_WEBKEY` never `VITE_`-prefixed. Confirmed as a hard requirement.                                                                                                   |
| R-4  | **FMCSA rate limits / outages** on a public endpoint.                                                                                                                                                         | Cache by MC/DOT with a TTL, rate-limit per IP, validate input shape before calling upstream, degrade to a clear error rather than a stack trace.                                                  |
| R-5  | **AI-drafted content quality** — hallucinated competitor claims are a legal and trust risk.                                                                                                                   | `competitors.json` is hand-maintained by you and is the _only_ competitor fact source. Every claim maps to a source field. Validators fail the build on unsupported claims. Hard cap of 30 pages. |
| R-6  | **Thin / near-duplicate pages** trigger spam classifiers and hurt the whole domain.                                                                                                                           | Similarity check across all generated pages fails the build. 30-page cap. Each page carries genuinely distinct substance.                                                                         |
| R-7  | **New dependencies need your approval** (CLAUDE.md).                                                                                                                                                          | See D-3 below — nothing is installed without a yes.                                                                                                                                               |
| R-8  | **Build-time coupling**: a generator crash would break `pnpm build:web` and block app deploys.                                                                                                                | Generator runs as a **separate** script composed after the Vite build, not inside it. A generator failure fails the marketing build without corrupting `dist/assets`.                             |
| R-9  | **Estimate liability** on the lane cost calculator.                                                                                                                                                           | Every output labelled an estimate in visible copy, with the data source and its date named on the page.                                                                                           |
| R-10 | **CSP** `connect-src` does not allow `fmcsa.dot.gov` or `eia.gov`.                                                                                                                                            | Non-issue by design — the browser only ever calls same-origin `/api/*`. No CSP change needed. JSON-LD is unaffected (`'unsafe-inline'` is already present in `script-src`).                       |
| R-11 | Pre-existing: root `middleware.ts` imports `next/server` in a non-Next app (§1.7); root `package.json` references a nonexistent `freightx-academy` app (§1.1).                                                | **Out of scope — flagged, not touched.** Happy to clean up separately if you want it.                                                                                                             |

### Decisions — resolved 2026-09-17

| #   | Decision                                                                                                                                                                                                                               |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-1 | **Marketing site owns `/`; the app shell moves to `/app`.** Reframed from the original question — there was no marketing site at all, only the app's splash screen, so "pre-render the homepage" had nothing to pre-render. See §2.1a. |
| D-2 | **OSRM public server** for lane distance, behind an interface so it can be swapped if reliability disappoints.                                                                                                                         |
| D-3 | **Zero new runtime dependencies, at every phase.** The generator is plain Node; Phase 3 will call the Anthropic API with `fetch`.                                                                                                      |
| D-4 | **Placeholder pricing, visibly marked.** `/pricing` ships the tier structure with `$—` figures and a notice stating the numbers are illustrative and nothing is charged.                                                               |
| D-5 | **Waitlist is the homepage CTA** (new). Sign-up cannot work — the backend is retired — so the page asks for an email instead of implying an account it cannot create.                                                                  |

### 2.1a Revision to the core decision — the site/app split

The original §2.1 assumed a marketing homepage existed to pre-render. It did not:
`/` rendered `SplashPage`, a phone-app intro carrying one sentence of generic copy and a
button to `/onboarding`. Injecting marketing content into `#root` would also have meant
**crawlers and humans receiving different pages**, since React would immediately replace the
injected markup with the splash screen. That is cloaking, not pre-rendering.

The shipped arrangement instead separates the two surfaces:

```
dist/index.html          ← generated marketing homepage, zero JavaScript
dist/pricing/index.html  ← generated
dist/for/*/index.html    ← generated
dist/app.html            ← the SPA entry, formerly dist/index.html
```

`vercel.json` rewrites every non-marketing path to `/app.html`, so `/carrier/loads`,
`/login` and every other app route boot exactly as before. The generator performs the
`index.html → app.html` move itself, after `vite build`, and refuses to move a file that does
not contain `id="root"`.

## 6. Phased Task List

### Phase 0 — Audit ✅ Complete

- [x] Inspect repo: framework, build, routing, hosting, marketing vs. app boundary
- [x] Verify rendering empirically — build, serve, `curl` the output
- [x] Write this document
- [x] **→ Approved; Phase 1 complete**

### Phase 1 — Make the marketing site AI-readable ✅ Complete

- [x] Resolve D-1 — marketing site at `/`, app shell at `/app` (§2.1a)
- [x] Remove `user-scalable=no` and `maximum-scale=1.0` from the viewport meta tag
- [x] Retire the site-wide hardcoded canonical (R-1); the shell is now `noindex`
- [x] Remove the stale Supabase `dns-prefetch`
- [x] Build `scripts/seo/generate.mjs` + layout / section / JSON-LD renderers, zero dependencies
- [x] Pre-render: `/`, `/for/carriers`, `/for/brokers`, `/for/shippers`
- [x] Per-page title, description, canonical, OG, Twitter
- [x] JSON-LD: `Organization`, `WebSite`, `SoftwareApplication`, `FAQPage`, `BreadcrumbList`
- [x] Generate `sitemap.xml` from emitted pages; tighten `robots.txt`
- [x] Waitlist endpoint (`/api/waitlist`) + progressive-enhancement form (D-5)
- [x] Five build-time validators, failing the build on violation
- [x] 38 tests covering rendering, escaping, validators and the endpoint
- [x] Verified by building, serving `dist`, and fetching over HTTP — see below
- [ ] **Verify R-2 on a preview deploy** — the one thing that cannot be checked locally

**Local verification (build → serve `dist` → `curl`):**

| Check                    | Result                                                    |
| ------------------------ | --------------------------------------------------------- |
| `/` returns real content | 1,841 words, one `<h1>`, **zero `<script src>`** requests |
| `/` is no longer the SPA | no `id="root"` in the response                            |
| `/app.html` is the SPA   | `id="root"` present, `noindex`, loads the bundle          |
| Canonicals               | each page points at its own URL, not the homepage         |
| JSON-LD                  | one `@graph` block per page, parses, correct `@type`s     |
| `sitemap.xml`            | 5 URLs, generated from the emitted pages                  |
| Mobile layout            | 0px horizontal overflow at 390px                          |

### Phase 2 — Free public tools (one at a time)

- [ ] **Tool 1 — Carrier Lookup.** `api/carrier-lookup.ts` proxy (R-3), caching + rate limiting
      (R-4), input validation, landing page + FAQ + JSON-LD + soft CTA, tests
- [ ] **Tool 2 — Lane Cost Calculator.** D-2 resolved (OSRM); EIA client + `api/fuel-price.ts`; estimate
      labelling (R-9); landing page; tests
- [ ] **Tool 3 — Rate Confirmation Generator.** Additively widen `generateRateCon` params (§1.6);
      form → PDF; landing page; tests

### Phase 3 — Content generator pipeline

- [ ] `content/` structure; `content/competitors.json` scaffolded for you to fill in
- [ ] Anthropic drafting script — row-scoped facts only, every claim mapped to a source field
- [ ] Comparisons state honestly where DispatchRelay is weaker
- [ ] Five validators (§3), wired to fail the build
- [ ] Enforce the 30-page cap
- [ ] Tests for every validator

### Phase 4 — Automation

- [ ] Monthly workflow: refresh FMCSA/EIA data → regenerate → **open a PR** (never push to main)
- [ ] `workflow_dispatch` for on-demand batches
- [ ] PR description summarizing changes for ~15-minute phone review
- [ ] Weekly visibility monitor: ~10 buyer questions → `docs/SEO_VISIBILITY_LOG.csv`

---

## 7. Change Log

| Date       | Phase | Summary                                                                                                                                                                                                                  |
| ---------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-09-17 | 1     | D-4 reversed: `/pricing` removed. A tiered price list presents a custom build as self-serve SaaS. The `tiers` section type and its styles went with it.                                                                  |
| 2026-09-17 | 1     | Phase 1 shipped. Marketing site generated as static HTML at `/` and three role pages; SPA entry moved to `/app.html`; waitlist endpoint added; 44 tests. D-1 reframed and resolved (§2.1a), D-2/D-3 answered, D-5 added. |
| 2026-09-17 | 0     | Audit complete. Confirmed pure CSR SPA serving byte-identical, content-free HTML on every URL. No marketing surface exists. Architecture proposed; 4 decisions open.                                                     |
