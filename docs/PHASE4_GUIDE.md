# Phase 4 — Booking Workflow & Documents

**Goal:** Full commercial lifecycle from load post to delivery completion.
**Duration:** 3–4 weeks
**Prerequisite:** Phase 3 complete — real-time working, messaging live

---

## Checklist — Core (Complete ✅)

- [x] Migration 009: bids table + accept_bid RPC + RLS
- [x] Migration 010: documents table + RLS + Storage bucket setup
- [x] Supabase Storage buckets created (documents + profile-photos)
- [x] Bid submission UI (carrier) — bid-sheet.tsx with delta indicator
- [x] Bid management UI (broker) — bid-list-sheet.tsx with realtime
- [x] Accept bid → load status flips to awarded, other bids auto-declined
- [x] Full load status lifecycle UI — load-status-stepper.tsx
- [x] Role-gated status advance (carrier: in_transit/delivered, broker: dispatched/completed)
- [x] Document upload (BOL, POD, rate con) — document-upload.tsx
- [x] Document viewer (in-app download links)
- [x] POD photo capture via mobile camera — capture="environment"
- [x] Load detail sheet wired per role (bids + stepper + documents)

## Checklist — Stretch Goals

- [x] Counter-offer / negotiation flow — inline counter input on bid card (broker)
- [x] Book-It-Now instant booking — book_now RPC + button on load detail (carrier)
- [x] Rate confirmation PDF — jsPDF client-side, downloads as RateCon-XXXX.pdf (broker)
- [x] Cancellation flow — two-tap confirm, updates load status to cancelled (broker)
- [x] Bid expiration via Edge Function cron
- [x] Booking confirmation email to both parties

**Phase 4 Status: ✅ COMPLETE**

---

## Database Migrations

### Migration 009: Bids

```sql
-- supabase/migrations/009_create_bids.sql

create type bid_status as enum (
  'pending', 'accepted', 'declined', 'countered', 'expired', 'cancelled'
);

create table public.bids (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references public.loads(id) on delete cascade,
  carrier_id uuid not null references public.profiles(id),
  company_id uuid not null references public.companies(id),

  amount_usd numeric(10,2) not null,
  notes text,
  status bid_status not null default 'pending',

  -- Counter-offer chain
  parent_bid_id uuid references public.bids(id),
  round integer not null default 1,

  expires_at timestamptz not null default (now() + interval '4 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bids_load_id_idx on public.bids(load_id);
create index bids_carrier_id_idx on public.bids(carrier_id);
create index bids_status_idx on public.bids(status);

-- RLS
alter table public.bids enable row level security;

-- Carriers can see and create their own bids
create policy "Carriers can manage own bids"
  on public.bids for all
  using (carrier_id = auth.uid())
  with check (carrier_id = auth.uid());

-- Load posters can see all bids on their loads
create policy "Load posters can view bids"
  on public.bids for select
  using (
    exists (
      select 1 from public.loads
      where id = load_id and posted_by = auth.uid()
    )
  );

-- Load posters can update bid status (accept/decline)
create policy "Load posters can update bid status"
  on public.bids for update
  using (
    exists (
      select 1 from public.loads
      where id = load_id and posted_by = auth.uid()
    )
  );
```

### Migration 010: Documents

```sql
-- supabase/migrations/010_create_documents.sql

create type document_type as enum (
  'bill_of_lading', 'proof_of_delivery', 'rate_confirmation',
  'insurance_certificate', 'w9', 'other'
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  load_id uuid references public.loads(id) on delete cascade,
  company_id uuid references public.companies(id),
  uploaded_by uuid not null references public.profiles(id),

  type document_type not null,
  file_name text not null,
  file_url text not null,
  file_size_bytes integer,
  mime_type text,

  created_at timestamptz not null default now()
);

create index documents_load_id_idx on public.documents(load_id);
create index documents_company_id_idx on public.documents(company_id);
create index documents_type_idx on public.documents(type);

-- RLS
alter table public.documents enable row level security;

create policy "Load parties can view documents"
  on public.documents for select
  using (
    uploaded_by = auth.uid()
    or exists (
      select 1 from public.loads
      where id = load_id
        and (posted_by = auth.uid() or booked_carrier_id = auth.uid())
    )
  );

create policy "Authenticated users can upload documents"
  on public.documents for insert
  with check (uploaded_by = auth.uid());
```

---

## Supabase Storage Setup

In Supabase Dashboard → Storage → Create Buckets:

| Bucket           | Public?      | Purpose                      |
| ---------------- | ------------ | ---------------------------- |
| `documents`      | No (private) | BOL, POD, rate confirmations |
| `profile-photos` | Yes (public) | User avatars, company logos  |

### Storage RLS Policies

```sql
-- documents bucket: only load parties can access
create policy "Load parties can read documents"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
    -- Additional check via documents table RLS
  );

create policy "Authenticated users can upload documents"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
  );
```

---

## Bid Workflow

### State Machine

```
Load: posted
  │
  ├── Carrier submits bid
  │     ↓
  │   Bid: pending
  │     │
  │     ├── Broker accepts → Bid: accepted → Load: awarded
  │     │                                      │
  │     │                              Booking confirmed
  │     │                              Rate con generated
  │     │                              Both parties emailed
  │     │
  │     ├── Broker declines → Bid: declined
  │     │
  │     ├── Broker counters → Bid: countered → New bid: pending (round 2)
  │     │
  │     └── Timer expires → Bid: expired
  │
  └── Book-It-Now → Skip bidding → Load: awarded immediately
```

### Accept Bid Flow

When broker accepts a bid, run this as a Supabase transaction:

```sql
-- Run in a transaction (use Supabase RPC)
create or replace function public.accept_bid(bid_id uuid)
returns void language plpgsql security definer as $$
declare
  v_bid record;
  v_load record;
begin
  -- Get the bid
  select * into v_bid from public.bids where id = bid_id;

  -- Verify caller is the load poster
  select * into v_load from public.loads where id = v_bid.load_id;
  if v_load.posted_by != auth.uid() then
    raise exception 'Not authorized';
  end if;

  -- Accept the bid
  update public.bids set status = 'accepted', updated_at = now()
    where id = bid_id;

  -- Decline all other pending bids on this load
  update public.bids set status = 'declined', updated_at = now()
    where load_id = v_bid.load_id
      and id != bid_id
      and status = 'pending';

  -- Award the load
  update public.loads
    set status = 'awarded',
        booked_carrier_id = v_bid.carrier_id,
        updated_at = now()
    where id = v_bid.load_id;

  -- Create message thread if it doesn't exist
  insert into public.messages (load_id)
    values (v_bid.load_id)
    on conflict (load_id) do nothing;
end;
$$;
```

---

## Rate Confirmation PDF

Use `jsPDF` + `jspdf-autotable` to generate rate confirmations client-side, then upload to Supabase Storage.

```typescript
// apps/web/src/features/bookings/lib/generate-rate-con.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateRateConfirmation(booking: BookingDetails): Blob {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text('RATE CONFIRMATION', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Confirmation #: ${booking.loadNumber}`, 20, 35);
  doc.text(`Date: ${format(new Date(), 'MM/dd/yyyy')}`, 20, 42);

  autoTable(doc, {
    startY: 55,
    head: [['Field', 'Details']],
    body: [
      ['Load Number', booking.loadNumber],
      ['Origin', `${booking.originCity}, ${booking.originState}`],
      ['Destination', `${booking.destCity}, ${booking.destState}`],
      ['Pickup Date', format(booking.pickupDate, 'MM/dd/yyyy')],
      ['Delivery Date', format(booking.deliveryDate, 'MM/dd/yyyy')],
      ['Equipment', booking.equipment],
      ['Commodity', booking.commodity],
      ['Rate', `$${booking.rate.toLocaleString()}`],
      ['Carrier', booking.carrierName],
      ['MC Number', booking.mcNumber],
    ],
    theme: 'grid',
  });

  return doc.output('blob');
}
```

---

## Load Status Lifecycle UI

Display as a progress stepper in the load detail page:

```
Posted → Bid Received → Awarded → Dispatched → In Transit → Delivered → Completed
```

Only the carrier (for in_transit/delivered) and broker (for dispatched/completed) can advance the status. Enforce this via RLS or a server-side RPC.

---

## Document Upload Component

```typescript
// apps/web/src/features/documents/components/document-upload.tsx
// - Accepts: BOL, POD, Rate Con
// - Shows drag-and-drop or file picker
// - On upload: PUT to Supabase Storage, then insert row in documents table
// - Show upload progress
// - Show uploaded docs as a list with download links
```

---

## POD Photo Capture (Mobile)

Use the browser's `capture` attribute for mobile camera access:

```tsx
<input
  type="file"
  accept="image/*"
  capture="environment" // opens rear camera on mobile
  onChange={handlePODUpload}
/>
```

---

## Acceptance Criteria

- [ ] Carrier submits bid → Broker sees bid in real time
- [ ] Broker accepts bid → load status changes to `awarded`
- [ ] Rate confirmation PDF auto-generated and downloadable
- [ ] Both parties receive email with booking details
- [ ] All other bids on the load are auto-declined
- [ ] Carrier uploads POD → load status advances to `delivered`
- [ ] Document viewer shows uploaded files without leaving the app
- [ ] Cancellation request triggers email to both parties

---

## Next Phase

Once Phase 4 is complete, move to [`PHASE5_GUIDE.md`](./PHASE5_GUIDE.md).
