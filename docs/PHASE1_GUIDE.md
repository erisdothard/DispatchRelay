# Phase 1 — Database, Auth, Infra

**Goal:** Real infrastructure. Users can register, log in, maintain sessions.
**Duration:** 2–3 weeks
**Prerequisite:** Phase 0 complete and CI green

---

## Checklist

- [x] Supabase project created (dev) — qeovhjdrwihnyfcbnujk
- [x] Supabase project created (production) — **COMPLETED**
- [x] Migration 001: profiles — included in `database/migrations/001-initial-schema.sql`
- [x] Migration 002: companies — proper `companies` table with owner_id FK, type, MC/DOT/broker authority, rating, metrics; added to `001-initial-schema.sql`; company fields removed from `profiles`
- [x] RLS policies on both tables — profiles + all tables have RLS
- [x] Supabase Auth configured (email/password)
- [x] Google OAuth — **COMPLETED**
- [x] Registration flow: email → role → company info (3 steps complete)
- [x] Registration step 3: company info (name, MC/DOT, phone) — 3-step onboarding; MC/DOT shown for carriers, broker authority for brokers; "skip" option available
- [x] Real AuthContext with JWT + session persistence
- [x] Protected routes — ProtectedRoute component with role enforcement
- [x] Password reset flow — `/forgot-password` + `/reset-password` pages; Supabase PASSWORD_RECOVERY event handled
- [x] Vercel project linked to repo — **COMPLETED**
- [x] Staging deploy on `develop`, production deploy on `main` — **COMPLETED**
- [x] All hardcoded credentials removed — DEMO_ACCOUNTS array and demo buttons deleted from login.tsx
- [x] CI passes on first PR to develop — **COMPLETED** (CI file exists, tested on PR)

**Phase 1 Status: 🟢 COMPLETE — Auth, data layer, companies schema, 3-step onboarding, password reset, real-data tracking + messages all done; Google OAuth + Vercel deploy completed**

### What was completed beyond Phase 1 scope (Phase 2 work done early):

- [x] `@supabase/supabase-js` installed, client configured with full TypeScript types
- [x] All 6 DB tables in single migration (loads, trucks, conversations, messages, tracking_milestones)
- [x] Service layer: `loads.service.ts`, `trucks.service.ts`, `messages.service.ts`
- [x] camelCase mappers (`lib/mappers.ts`) for shared type compatibility
- [x] All 6 dashboards replaced with live Supabase queries (carrier, broker, shipper)
- [x] Seed data for demo loads, trucks, tracking milestones

---

## Step 1 — Supabase Project Setup

1. Go to [supabase.com](https://supabase.com) → New Project
2. **Development project:** name `freightx-dev`, region closest to you
3. **Production project:** name `freightx-prod`, same region
4. In each project, go to Settings → API → copy URL and anon key
5. Fill in `apps/web/.env.local` from `.env.example`

### Supabase CLI (optional but recommended)

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
```

---

## Step 2 — Database Migrations

Run SQL files in order via Supabase Dashboard → SQL Editor, or via CLI.

### Migration 001: Profiles

```sql
-- supabase/migrations/001_create_profiles.sql

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('carrier', 'broker', 'shipper', 'admin')),
  full_name text,
  phone text,
  avatar_url text,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'role', 'carrier'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins can view all profiles
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
```

### Migration 002: Companies

```sql
-- supabase/migrations/002_create_companies.sql

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('carrier', 'broker', 'shipper')),
  name text not null,
  mc_number text,                  -- Carrier/Broker motor carrier number
  dot_number text,                 -- Carrier DOT number
  broker_authority text,           -- Broker authority number
  address text,
  city text,
  state char(2),
  zip text,
  phone text,
  email text,
  website text,
  logo_url text,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index companies_owner_id_idx on public.companies(owner_id);
create index companies_type_idx on public.companies(type);
create unique index companies_mc_number_idx on public.companies(mc_number)
  where mc_number is not null;

-- RLS
alter table public.companies enable row level security;

create policy "Company owners can manage own company"
  on public.companies for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "All authenticated users can view companies"
  on public.companies for select
  using (auth.role() = 'authenticated');
```

---

## Step 3 — Configure Supabase Auth

In Supabase Dashboard → Authentication → Providers:

1. **Email** — enable, disable email confirmation for dev, enable for prod
2. **Google** — enable, set OAuth redirect URL to `https://your-app.vercel.app/auth/callback`

In Authentication → Email Templates — customize the password reset and confirmation emails with FreightX branding.

---

## Step 4 — Supabase Client (packages/shared)

```typescript
// packages/shared/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
```

---

## Step 5 — Auth Context

```typescript
// apps/web/src/features/auth/context/auth-context.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@freightx/shared';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      loading,
      signOut: () => supabase.auth.signOut(),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
```

---

## Step 6 — Registration Flow

Multi-step form:

1. **Step 1:** Email + password
2. **Step 2:** Select role (Carrier / Broker / Shipper) — big clickable cards
3. **Step 3:** Company info (name, MC/DOT/broker authority, phone)

Pass role in `options.data` when calling `supabase.auth.signUp`:

```typescript
await supabase.auth.signUp({
  email,
  password,
  options: { data: { role } },
});
```

The `handle_new_user` trigger reads `raw_user_meta_data.role` and writes it to `profiles`.

---

## Step 7 — Protected Routes

```typescript
// apps/web/src/features/auth/components/protected-route.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/auth-context';

export function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) return <div>Loading...</div>; // replace with skeleton
  if (!session) return <Navigate to="/login" replace />;

  return <Outlet />;
}
```

---

## Step 8 — Vercel Deployment

1. Push repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. **Root directory:** `apps/web`
4. **Build command:** `pnpm build`
5. **Output directory:** `dist`
6. Add environment variables from `.env.example`
7. Set up two Vercel environments:
   - **Production** → `main` branch
   - **Preview** → `develop` branch (and all PRs)

---

## Step 9 — Remove All Mock Auth

Search the codebase and delete:

```bash
# Find and remove all mock credentials
grep -r "frieghtx26\|user-carrier\|user-broker\|user-shipper\|mockUsers\|sharedState" --include="*.ts" --include="*.tsx"
```

Delete `src/data/mockData.ts` entirely.

---

## Acceptance Criteria

- [ ] `https://freightx-dev.vercel.app` loads the app
- [ ] User can register with email, select role, enter company info
- [ ] User logs in → session persists on page refresh (F5)
- [ ] Unauthenticated user hitting `/carrier/dashboard` → redirected to `/login`
- [ ] Password reset email delivered and link works
- [ ] CI pipeline passes on PR to `develop`
- [ ] Zero occurrences of `mockData`, `sharedState`, or hardcoded credentials in codebase

---

## Next Phase

Once Phase 1 is complete, move to [`PHASE2_GUIDE.md`](./PHASE2_GUIDE.md).
