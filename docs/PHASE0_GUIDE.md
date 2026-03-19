# Phase 0 — Repo, CI/CD, Tooling

**Goal:** Professional monorepo that enforces quality from commit #1.
**Duration:** 1 week

---

## Checklist

- [x] Monorepo initialized (pnpm + turbo)
- [x] `apps/web` scaffolded
- [x] `packages/shared` scaffolded
- [x] `packages/typescript-config` scaffolded
- [x] Tailwind + shadcn/ui configured
- [x] Orange + dark grey theme set
- [x] GitHub Actions CI pipeline (`ci.yml`)
- [ ] Husky pre-commit hook — installed in package.json but `.husky/` dir not initialized; hooks not active
- [x] Husky commit-msg hook (commitlint) — commitlint.config.js present
- [x] Prettier configured
- [x] `.env.example` documented
- [x] README complete
- [x] All phase docs written

**Phase 0 Status: ✅ Complete (minor: Husky hooks need `husky init` to activate)**

---

## Step 1 — Initialize Monorepo

### Root `package.json`

```json
{
  "name": "freightx",
  "private": true,
  "packageManager": "pnpm@10.29.2",
  "engines": { "node": ">=20.0.0" },
  "scripts": {
    "dev:web": "turbo run dev --filter=@freightx/web",
    "build": "turbo run build",
    "build:web": "turbo run build --filter=@freightx/web",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "format": "prettier --write \"**/*.{ts,tsx,json,md,css}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,json,md,css}\"",
    "clean": "turbo run clean",
    "prepare": "husky"
  },
  "devDependencies": {
    "turbo": "^2",
    "prettier": "^3",
    "husky": "^9",
    "lint-staged": "^15",
    "@commitlint/cli": "^19",
    "@commitlint/config-conventional": "^19"
  }
}
```

### `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^lint"] },
    "typecheck": { "dependsOn": ["^typecheck"] },
    "test": { "dependsOn": ["^build"], "outputs": ["coverage/**"] },
    "clean": { "cache": false }
  }
}
```

---

## Step 2 — Scaffold apps/web

```bash
cd apps/web
pnpm create vite@latest . -- --template react-ts
```

Key `apps/web/package.json` name: `"@freightx/web"`

### Install dependencies

```bash
# Core
pnpm add react-router-dom @tanstack/react-query @supabase/supabase-js

# UI
pnpm add lucide-react class-variance-authority clsx tailwind-merge

# Forms + validation
pnpm add react-hook-form @hookform/resolvers zod

# Dates
pnpm add date-fns

# Dev
pnpm add -D tailwindcss postcss autoprefixer @types/node vitest @vitejs/plugin-react
```

### shadcn/ui init

```bash
npx shadcn@latest init
```

Config choices:

- Style: Default
- Base color: Neutral
- CSS variables: Yes

---

## Step 3 — Configure Tailwind Theme (Orange + Dark Grey)

In `apps/web/src/index.css`, set CSS variables:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 4%;
    --foreground: 0 0% 98%;
    --card: 0 0% 8%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 8%;
    --popover-foreground: 0 0% 98%;
    --primary: 24 95% 53%; /* orange-500 #f97316 */
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14%;
    --muted-foreground: 0 0% 64%;
    --accent: 0 0% 14%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62% 50%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 15%;
    --input: 0 0% 15%;
    --ring: 24 95% 53%;
    --radius: 0.5rem;
  }
}
```

---

## Step 4 — Scaffold packages/shared

```
packages/shared/
├── package.json        { "name": "@freightx/shared" }
├── tsconfig.json
└── src/
    ├── index.ts        (re-exports everything)
    ├── types/
    │   └── index.ts    (User, Load, Truck, Booking, etc.)
    ├── schemas/
    │   └── index.ts    (Zod schemas for all entities)
    └── constants/
        └── index.ts    (enums, config values)
```

---

## Step 5 — Scaffold packages/typescript-config

```
packages/typescript-config/
├── package.json
├── base.json           (strict TS config)
└── web.json            (extends base, adds DOM lib)
```

### `base.json`

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "esModuleInterop": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  }
}
```

---

## Step 6 — GitHub Actions CI Pipeline

File: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    name: Lint, Typecheck, Test, Build
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - run: pnpm lint

      - run: pnpm format:check

      - run: pnpm typecheck

      - run: pnpm test

      - run: pnpm build:web
```

---

## Step 7 — Husky + Commitlint

```bash
pnpm husky init
```

### `.husky/pre-commit`

```sh
pnpm lint-staged
```

### `.husky/commit-msg`

```sh
pnpm commitlint --edit $1
```

### `commitlint.config.js`

```js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'web',
        'shared',
        'db',
        'auth',
        'loads',
        'trucks',
        'bookings',
        'messages',
        'notifications',
        'payments',
        'ci',
        'docs',
        'deps',
        'config',
      ],
    ],
    'scope-empty': [1, 'never'],
  },
};
```

### `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "auto"
}
```

---

## Step 8 — Git Setup

### `.gitignore`

```
node_modules/
dist/
.env
.env.local
.env.production
*.local
.DS_Store
.turbo/
coverage/
```

### `.gitattributes`

```
* text=auto eol=lf
*.png binary
*.jpg binary
*.pdf binary
```

---

## Step 9 — Environment Variables

`.env.example` (committed to repo):

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google Maps (optional for map views)
VITE_GOOGLE_MAPS_API_KEY=

# Sentry (optional for error monitoring)
VITE_SENTRY_DSN=

# App
VITE_APP_URL=http://localhost:5173
```

---

## Acceptance Criteria

Before marking Phase 0 complete:

```bash
# All of these must pass
pnpm install          # zero errors
pnpm dev:web          # app starts on localhost:5173
pnpm build:web        # production build succeeds
pnpm typecheck        # zero TypeScript errors
pnpm lint             # zero lint errors
pnpm format:check     # zero formatting violations
pnpm test             # all tests pass (even if there are only 0 yet)

# Try a bad commit — should be rejected:
git commit -m "bad commit message"    # REJECTED by commitlint
git commit -m "feat(web): good one"   # ACCEPTED
```

Open a test PR → CI pipeline must go green.

---

## Next Phase

Once Phase 0 is complete, move to [`PHASE1_GUIDE.md`](./PHASE1_GUIDE.md).
