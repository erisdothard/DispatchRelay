# Phase 5 — Verification, Payments & Ratings

**Goal:** FreightX is commercially viable. Real money moves. Trust is enforced.
**Duration:** 3–4 weeks
**Prerequisite:** Phase 4 complete — full booking lifecycle working

---

## Checklist

- [x] Migration 011: carrier_verifications — MC/DOT/insurance records
- [x] Migration 012: ratings — post-load ratings both directions
- [x] Migration 013: subscriptions — Stripe billing records
- [x] FMCSA SAFER API integration — MC/DOT auto-verified on signup
- [x] Insurance certificate upload + expiry tracking
- [x] CSA safety score display on carrier profiles
- [x] Verified badge shown on carrier/broker cards
- [x] Auto-alert when insurance is expiring (60 days, 30 days, 7 days)
- [x] Stripe integration — subscription billing (monthly/annual)
- [x] Subscription tier enforcement — feature gating by plan
- [x] Invoice auto-generation on load completion
- [x] In-platform payment (ACH via Stripe) — carrier gets paid
- [x] Quick Pay option — 2% fee for 2-day payment
- [x] Payment status tracking — Invoiced → Approved → Paid
- [x] Post-load rating prompt — both parties rate after completion
- [x] 5-star rating display on carrier/broker profiles
- [x] Performance metrics — on-time %, load count, avg rating

**Phase 5 Status: ✅ COMPLETE**

---

## Database Migrations

### Migration 011: Carrier Verifications

```sql
-- supabase/migrations/011_create_carrier_verifications.sql

create type verification_status as enum ('pending', 'verified', 'failed', 'expired');

create table public.carrier_verifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,

  -- FMCSA data
  mc_number text,
  dot_number text,
  fmcsa_status text,                -- 'AUTHORIZED', 'NOT AUTHORIZED', etc.
  fmcsa_verified_at timestamptz,
  csa_score numeric(5,2),
  safety_rating text,               -- 'Satisfactory', 'Conditional', 'Unsatisfactory'

  -- Insurance
  insurance_carrier text,
  insurance_policy text,
  insurance_amount_usd integer,
  insurance_expires_at date,
  insurance_cert_url text,

  -- W-9
  w9_url text,
  w9_uploaded_at timestamptz,

  -- Overall status
  status verification_status not null default 'pending',
  verified_at timestamptz,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index carrier_verifications_company_id_idx
  on public.carrier_verifications(company_id);

-- Auto-update company.verified when verification status changes
create or replace function sync_company_verified()
returns trigger language plpgsql security definer as $$
begin
  update public.companies
    set verified = (new.status = 'verified')
    where id = new.company_id;
  return new;
end;
$$;

create trigger on_verification_status_change
  after update of status on public.carrier_verifications
  for each row execute procedure sync_company_verified();
```

### Migration 012: Ratings

```sql
-- supabase/migrations/012_create_ratings.sql

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references public.loads(id),
  rater_id uuid not null references public.profiles(id),
  rated_id uuid not null references public.profiles(id),

  overall integer not null check (overall between 1 and 5),
  communication integer check (communication between 1 and 5),
  reliability integer check (reliability between 1 and 5),
  professionalism integer check (professionalism between 1 and 5),
  comment text,

  created_at timestamptz not null default now(),

  unique(load_id, rater_id)  -- one rating per person per load
);

create index ratings_rated_id_idx on public.ratings(rated_id);

-- RLS
alter table public.ratings enable row level security;

create policy "All authenticated users can view ratings"
  on public.ratings for select
  using (auth.role() = 'authenticated');

create policy "Load parties can rate each other"
  on public.ratings for insert
  with check (
    rater_id = auth.uid()
    and exists (
      select 1 from public.loads
      where id = load_id
        and status = 'completed'
        and (posted_by = auth.uid() or booked_carrier_id = auth.uid())
    )
  );
```

### Migration 013: Subscriptions

```sql
-- supabase/migrations/013_create_subscriptions.sql

create type subscription_tier as enum (
  'free', 'carrier_pro', 'broker_starter', 'broker_growth', 'shipper', 'enterprise'
);

create type subscription_status as enum (
  'active', 'past_due', 'cancelled', 'trialing'
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,

  stripe_customer_id text unique,
  stripe_subscription_id text unique,

  tier subscription_tier not null default 'free',
  status subscription_status not null default 'active',

  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index subscriptions_company_id_idx on public.subscriptions(company_id);
```

---

## FMCSA SAFER API Integration

The FMCSA provides a free REST API to verify carrier/broker authority.

```typescript
// apps/web/src/features/verification/lib/fmcsa.ts

const FMCSA_BASE = 'https://mobile.fmcsa.dot.gov/qc/services';
const API_KEY = import.meta.env.VITE_FMCSA_API_KEY; // register at fmcsa.dot.gov

export async function verifyCarrierByMCNumber(mcNumber: string) {
  const res = await fetch(`${FMCSA_BASE}/carriers/${mcNumber}?webKey=${API_KEY}`);

  if (!res.ok) throw new Error('FMCSA lookup failed');

  const data = await res.json();
  return {
    status: data.content?.carrier?.allowedToOperate === 'Y' ? 'AUTHORIZED' : 'NOT AUTHORIZED',
    legalName: data.content?.carrier?.legalName,
    dotNumber: data.content?.carrier?.dotNumber,
    safetyRating: data.content?.carrier?.safetyRating,
  };
}
```

Call this on company creation for carriers/brokers. Store the result in `carrier_verifications`.

**FMCSA API Key:** Register free at https://portal.fmcsa.dot.gov/Developer/

---

## Stripe Integration

### Setup

```bash
pnpm add stripe @stripe/stripe-js
```

Environment variables:

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...    # server-side only (Edge Function)
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Subscription Tiers

| Tier           | Price   | Loads/month | Trucks/month |
| -------------- | ------- | ----------- | ------------ |
| Free (Carrier) | $0      | View only   | 2            |
| Carrier Pro    | $49/mo  | View only   | Unlimited    |
| Broker Starter | $149/mo | 50          | View only    |
| Broker Growth  | $349/mo | Unlimited   | View only    |
| Shipper        | $199/mo | 25          | View only    |

### Feature Gating

```typescript
// packages/shared/src/constants/subscription.ts
export const TIER_LIMITS = {
  free: { maxTruckPostings: 2, canPostLoads: false },
  carrier_pro: { maxTruckPostings: null, canPostLoads: false },
  broker_starter: { maxTruckPostings: null, canPostLoads: true, maxLoads: 50 },
  broker_growth: { maxTruckPostings: null, canPostLoads: true, maxLoads: null },
  shipper: { maxTruckPostings: null, canPostLoads: true, maxLoads: 25 },
} as const;
```

### Stripe Webhook Handler (Edge Function)

```typescript
// supabase/functions/stripe-webhook/index.ts
// Handle: checkout.session.completed, invoice.payment_succeeded,
//         customer.subscription.updated, customer.subscription.deleted
```

---

## Quick Pay Flow

When a load reaches `completed` status:

1. System auto-generates an invoice record
2. Broker sees invoice in their dashboard → clicks "Approve"
3. Carrier sees two payment options:
   - **Standard:** Net 30 (no fee)
   - **Quick Pay:** 2% fee, paid within 2 business days
4. Carrier selects → Stripe ACH transfer initiated
5. Payment status tracks: `invoiced → approved → processing → paid`

---

## Post-Load Rating Prompt

After a load reaches `completed` status, send both parties a notification:

```
"Your load FX-20260217-0042 is complete!
Rate your experience with [carrier/broker name] →"
```

Rating modal:

- 5 stars overall
- Optional: communication, reliability, professionalism
- Optional comment (max 500 chars)

Once both parties rate, show the ratings on their public profiles.

---

## Auto-Expiry Alerts (Edge Function Cron)

Run daily to check insurance expiry dates:

```typescript
// supabase/functions/insurance-expiry-check/index.ts
// Query carrier_verifications where insurance_expires_at
//   is 60, 30, or 7 days from today
// Send email via Resend to carrier and to admin
// Insert notification record for in-app alert
```

Schedule in Supabase Dashboard → Edge Functions → Cron: `0 9 * * *` (9am daily).

---

## Acceptance Criteria

- [ ] New carrier cannot post trucks until MC/DOT verified via FMCSA
- [ ] Verified badge appears on verified carrier cards
- [ ] Insurance cert uploaded, expiry date stored
- [ ] Alert email sent 30 days before insurance expires
- [ ] Stripe test subscription created successfully
- [ ] Feature gate prevents broker on free tier from posting > limit
- [ ] Invoice auto-generated when load status reaches `completed`
- [ ] Quick Pay option available to carrier after invoice approved
- [ ] Rating prompt appears after load completion
- [ ] Average rating displayed on carrier profile

---

## Next Phase

Once Phase 5 is complete, move to [`PHASE6_GUIDE.md`](./PHASE6_GUIDE.md).
