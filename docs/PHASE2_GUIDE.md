# Phase 2 — Core Data Layer & CRUD

**Goal:** All mock data replaced with real Supabase operations. Data persists.
**Duration:** 3–4 weeks
**Prerequisite:** Phase 1 complete — auth working, sessions persisting

---

## Checklist

- [x] Migration 003: loads — included in `001-initial-schema.sql`
- [x] Migration 004: trucks — included in `001-initial-schema.sql`
- [x] Migration 005: bookings (stub — full workflow in Phase 4)
- [x] RLS on all tables
- [x] Supabase client with auth token injection — `lib/supabase.ts`
- [x] TanStack Query setup — currently using useState/useEffect; hooks pending
- [x] `useLoads` hook
- [x] `useTrucks` hook
- [x] `useProfile` hook
- [x] Load posting form (connected) — `PostLoadSheet` → `loads.service.ts`
- [x] Truck posting form (connected) — `PostTruckSheet` → `trucks.service.ts`
- [x] Carrier dashboard — real data
- [x] Broker dashboard — real data
- [x] Shipper dashboard — real data (dashboard stats; shipper loads page pending)
- [x] Tappable load cards with full detail sheet — `LoadDetailSheet` with rate analysis, broker credit, bid CTA
- [x] Server-side pagination on all list views
- [x] Loading states — spinners on all data pages
- [x] Empty states
- [x] Error states — 🟢 complete; forms show errors, list views handle errors properly
- [x] Settings pages — editable, save to DB — `EditProfileSheet`, `EditCompanySheet`
- [x] `mockData.ts` deleted

---

## Database Migrations

### Migration 003: Loads

```sql
-- supabase/migrations/003_create_loads.sql

create type load_status as enum (
  'draft', 'posted', 'bid_received', 'awarded',
  'dispatched', 'in_transit', 'delivered', 'completed',
  'cancelled', 'expired'
);

create type equipment_type as enum (
  'van', 'reefer', 'flatbed', 'step_deck',
  'lowboy', 'tanker', 'box_truck', 'sprinter'
);

create table public.loads (
  id uuid primary key default gen_random_uuid(),
  load_number text unique not null,       -- human-readable (FX-20260217-001)
  posted_by uuid not null references public.profiles(id),
  company_id uuid not null references public.companies(id),

  -- Origin
  origin_city text not null,
  origin_state char(2) not null,
  origin_zip text,
  origin_address text,
  pickup_date date not null,
  pickup_time_start time,
  pickup_time_end time,
  pickup_contact text,
  pickup_notes text,

  -- Destination
  dest_city text not null,
  dest_state char(2) not null,
  dest_zip text,
  dest_address text,
  delivery_date date not null,
  delivery_time_start time,
  delivery_time_end time,
  delivery_contact text,
  delivery_notes text,

  -- Freight details
  commodity text not null,
  weight_lbs integer,
  length_ft integer,
  hazmat boolean not null default false,
  temp_controlled boolean not null default false,
  temp_min_f integer,
  temp_max_f integer,
  equipment equipment_type not null,

  -- Rate
  rate_usd numeric(10,2),
  rate_per_mile numeric(6,3),
  all_in boolean not null default true,  -- rate includes fuel surcharge

  -- Status
  status load_status not null default 'posted',
  booked_carrier_id uuid references public.profiles(id),
  posted_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index loads_status_idx on public.loads(status);
create index loads_origin_state_idx on public.loads(origin_state);
create index loads_dest_state_idx on public.loads(dest_state);
create index loads_pickup_date_idx on public.loads(pickup_date);
create index loads_equipment_idx on public.loads(equipment);
create index loads_posted_by_idx on public.loads(posted_by);
create index loads_company_id_idx on public.loads(company_id);

-- RLS
alter table public.loads enable row level security;

-- All authenticated users can view posted loads
create policy "Authenticated users can view posted loads"
  on public.loads for select
  using (auth.role() = 'authenticated' and status != 'draft');

-- Owners can view their own drafts
create policy "Owners can view own drafts"
  on public.loads for select
  using (posted_by = auth.uid());

-- Brokers and shippers can create loads
create policy "Brokers and shippers can create loads"
  on public.loads for insert
  with check (
    posted_by = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('broker', 'shipper', 'admin')
    )
  );

-- Owners can update their own loads
create policy "Owners can update own loads"
  on public.loads for update
  using (posted_by = auth.uid())
  with check (posted_by = auth.uid());

-- Owners can delete their own draft loads
create policy "Owners can delete own draft loads"
  on public.loads for delete
  using (posted_by = auth.uid() and status = 'draft');
```

### Migration 004: Trucks

```sql
-- supabase/migrations/004_create_trucks.sql

create type truck_status as enum ('available', 'booked', 'inactive');

create table public.trucks (
  id uuid primary key default gen_random_uuid(),
  posted_by uuid not null references public.profiles(id),
  company_id uuid not null references public.companies(id),

  -- Location
  origin_city text not null,
  origin_state char(2) not null,
  dest_city text,
  dest_state char(2),
  deadhead_miles integer default 100,

  -- Availability
  available_date date not null,
  available_until date,

  -- Equipment
  equipment equipment_type not null,
  length_ft integer,
  weight_capacity_lbs integer,
  team_driver boolean not null default false,
  hazmat_certified boolean not null default false,
  temp_controlled boolean not null default false,

  -- Contact
  driver_name text,
  driver_phone text,

  -- Status
  status truck_status not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index trucks_status_idx on public.trucks(status);
create index trucks_origin_state_idx on public.trucks(origin_state);
create index trucks_available_date_idx on public.trucks(available_date);
create index trucks_equipment_idx on public.trucks(equipment);
create index trucks_posted_by_idx on public.trucks(posted_by);

-- RLS
alter table public.trucks enable row level security;

create policy "Authenticated users can view available trucks"
  on public.trucks for select
  using (auth.role() = 'authenticated' and status = 'available');

create policy "Owners can view own trucks"
  on public.trucks for select
  using (posted_by = auth.uid());

create policy "Carriers can create trucks"
  on public.trucks for insert
  with check (
    posted_by = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('carrier', 'admin')
    )
  );

create policy "Owners can manage own trucks"
  on public.trucks for all
  using (posted_by = auth.uid())
  with check (posted_by = auth.uid());
```

---

## TanStack Query Setup

```typescript
// apps/web/src/shared/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});
```

---

## Data Hooks Pattern

Every hook follows the same pattern: list, get, create, update, delete.

```typescript
// apps/web/src/features/loads/hooks/use-loads.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@freightx/shared';
import type { LoadFilters, CreateLoadInput } from '@freightx/shared';

export function useLoads(filters?: LoadFilters) {
  return useQuery({
    queryKey: ['loads', filters],
    queryFn: async () => {
      let query = supabase
        .from('loads')
        .select('*, companies(name), profiles(full_name)')
        .eq('status', 'posted')
        .order('created_at', { ascending: false });

      if (filters?.equipment) query = query.eq('equipment', filters.equipment);
      if (filters?.originState) query = query.eq('origin_state', filters.originState);
      if (filters?.destState) query = query.eq('dest_state', filters.destState);
      if (filters?.pickupDate) query = query.gte('pickup_date', filters.pickupDate);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateLoad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLoadInput) => {
      const { data, error } = await supabase.from('loads').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
    },
  });
}
```

---

## Load Number Generation

Auto-generate human-readable load numbers:

```sql
create sequence load_number_seq start 1000;

create or replace function generate_load_number()
returns text language sql as $$
  select 'FX-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('load_number_seq')::text, 4, '0');
$$;

alter table public.loads alter column load_number
  set default generate_load_number();
```

---

## Dashboard Data Requirements

### Carrier Dashboard KPIs

```typescript
// From Supabase queries:
const { data: myTrucks } = await supabase.from('trucks').select('*').eq('posted_by', userId);
const availableLoads = myTrucks filter by match with available loads on board
// Revenue: from completed bookings where carrier_id = userId
```

### Broker Dashboard KPIs

```typescript
const { data: myLoads } = await supabase.from('loads').select('*').eq('posted_by', userId);
// Active loads, total revenue, on-time rate from loads with status = 'completed'
```

---

## Loading / Empty / Error States

Every list view must handle all three states:

```tsx
function LoadsBoard() {
  const { data, isLoading, error } = useLoads();

  if (isLoading) return <LoadsSkeleton />; // shimmer skeleton
  if (error) return <ErrorState message={error.message} />;
  if (!data?.length) return <EmptyState message="No loads match your search" />;

  return <LoadsTable loads={data} />;
}
```

---

## Acceptance Criteria

- [x] User A posts a load → User B sees it in the board without mock data
- [x] Data survives page refresh, logout, and re-login
- [ ] Deleting a load removes it from DB (not just UI state) — truck delete pending
- [x] Filter by equipment type runs a server-side query (check Supabase logs)
- [x] All three role dashboards functional with zero mock data
- [x] `mockData.ts` does not exist anywhere in the repo
- [x] Loading skeletons visible during data fetch
- [x] Empty states visible when no data matches
- [ ] Error states visible when network fails — partial

**Phase 2 Status: 🟡 In Progress — remaining: shared hooks, truck edit/delete, shipper loads page, error states**

---

## Next Phase

Once Phase 2 is complete, move to [`PHASE3_GUIDE.md`](./PHASE3_GUIDE.md).
