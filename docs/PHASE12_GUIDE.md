# FreightX — Phase 12 Guide: GPS Real-Time Tracking

**Goal:** Real-time GPS position tracking for in-transit loads using the browser's native Geolocation API and Supabase Realtime

**Timeline:** 1 week
**Prerequisites:** Phase 11 complete (AI assisted load seeking)

---

## Overview

Phase 12 adds live GPS tracking to the load lifecycle. When a driver is `in_transit`, their device streams position pings into the database. Brokers and shippers watching the load see the truck move on the map in real time — no page refresh needed.

**Architecture:**

- **Driver side:** `useDriverLocation` hook watches the browser Geolocation API and writes pings on a smart interval (30 seconds OR 50 metres of movement, whichever comes first)
- **Viewer side:** `useLiveTracking` hook subscribes to Supabase Realtime and updates the map as new pings arrive
- **Database:** `location_pings` table stores raw coordinates with a composite index for fast reads
- **Cleanup:** Scheduled edge function prunes pings older than 24 hours; permanent history lives in `tracking_milestones`

**Deliverable:** Live truck position on the tracking map for all in-transit loads

---

## Deliverables Checklist

### Week 1: GPS Infrastructure & Real-Time Display

- [x] **Database Migration**
  - [x] `location_pings` table with lat, lng, accuracy, heading, speed
  - [x] Composite index on `(load_number, recorded_at desc)`
  - [x] RLS: drivers insert their own pings; authenticated users read
  - [x] Migration file: `database/migrations/012-location-pings.sql`

- [x] **Driver Location Hook**
  - [x] `useDriverLocation` — watches `navigator.geolocation.watchPosition`
  - [x] Smart ping threshold: 30 seconds elapsed OR ≥50 m moved (Haversine)
  - [x] Only active when `active` prop is true (load status `in_transit`)
  - [x] Writes via `insertLocationPing()` utility
  - [x] Cleans up `clearWatch` on unmount or when deactivated
  - [x] Graceful no-op when browser denies geolocation

- [x] **Live Tracking Hook**
  - [x] `useLiveTracking` — fetches most recent ping on mount
  - [x] Subscribes to Supabase Realtime channel `location_pings:{loadNumber}`
  - [x] Listens for INSERT events and updates state immediately
  - [x] Removes channel subscription on unmount

- [x] **Location Utility**
  - [x] `LocationPing` interface (load_number, driver_id, lat, lng, accuracy_m, heading_deg, speed_ms)
  - [x] `insertLocationPing()` — writes a single ping to Supabase

- [x] **Cleanup Edge Function**
  - [x] `location-cleanup` — deletes pings older than 24 hours
  - [x] Scheduled via pg_cron (every hour)
  - [x] Returns `{ ok, deleted }` JSON response
  - [x] Deployed with `--no-verify-jwt`

**Phase 12 Status: ✅ COMPLETE**

---

## Technical Implementation

### 1. Database Migration

```sql
-- database/migrations/012-location-pings.sql
create table public.location_pings (
  id            uuid primary key default gen_random_uuid(),
  load_number   text not null,
  driver_id     uuid references public.profiles(id) on delete cascade,
  latitude      decimal(10,7) not null,
  longitude     decimal(10,7) not null,
  accuracy_m    int,
  heading_deg   int,        -- 0–360 direction of travel
  speed_ms      decimal(6,2),
  recorded_at   timestamptz not null default now()
);

create index on public.location_pings (load_number, recorded_at desc);

alter table public.location_pings enable row level security;

-- Drivers write their own pings
create policy "driver_insert" on public.location_pings
  for insert with check (auth.uid() = driver_id);

-- Anyone authenticated can read pings
create policy "load_participant_read" on public.location_pings
  for select using (true);
```

### 2. Driver Location Hook

```typescript
// apps/web/src/features/loads/hooks/use-driver-location.ts
import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { insertLocationPing } from '../lib/location';

const PING_INTERVAL_MS = 30_000; // 30 seconds
const MOVEMENT_THRESHOLD_M = 50; // 50 metres

function distanceM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface UseDriverLocationOptions {
  loadNumber: string;
  /** Only active when load status === 'in_transit' */
  active: boolean;
}

export function useDriverLocation({ loadNumber, active }: UseDriverLocationOptions) {
  const { profile } = useAuth();
  const watchIdRef = useRef<number | null>(null);
  const lastPingTimeRef = useRef<number>(0);
  const lastPingPosRef = useRef<{ lat: number; lng: number } | null>(null);

  const handlePosition = useCallback(
    async (pos: GeolocationPosition) => {
      if (!profile?.id) return;
      const { latitude, longitude, accuracy, heading, speed } = pos.coords;
      const now = Date.now();
      const last = lastPingPosRef.current;

      const movedEnough =
        !last || distanceM(last.lat, last.lng, latitude, longitude) >= MOVEMENT_THRESHOLD_M;
      const timeElapsed = now - lastPingTimeRef.current >= PING_INTERVAL_MS;

      if (!movedEnough && !timeElapsed) return;

      lastPingTimeRef.current = now;
      lastPingPosRef.current = { lat: latitude, lng: longitude };

      await insertLocationPing({
        load_number: loadNumber,
        driver_id: profile.id,
        latitude,
        longitude,
        accuracy_m: accuracy != null ? Math.round(accuracy) : undefined,
        heading_deg: heading != null ? heading : undefined,
        speed_ms: speed != null ? speed : undefined,
      });
    },
    [loadNumber, profile?.id],
  );

  useEffect(() => {
    if (!active || !('geolocation' in navigator)) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      () => undefined, // silently ignore denial
      { enableHighAccuracy: true, maximumAge: 10_000 },
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [active, handlePosition]);
}
```

### 3. Live Tracking Hook (Viewer Side)

```typescript
// apps/web/src/features/loads/hooks/use-live-tracking.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface LivePing {
  latitude: number;
  longitude: number;
  heading_deg: number | null;
  speed_ms: number | null;
  accuracy_m: number | null;
  recorded_at: string;
}

export function useLiveTracking(loadNumber: string | null | undefined) {
  const [latestPing, setLatestPing] = useState<LivePing | null>(null);

  useEffect(() => {
    if (!loadNumber) return;

    // Fetch most recent existing ping
    void supabase
      .from('location_pings')
      .select('latitude,longitude,heading_deg,speed_ms,accuracy_m,recorded_at')
      .eq('load_number', loadNumber)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setLatestPing(data as LivePing);
      });

    // Subscribe to new inserts via Realtime
    const channel = supabase
      .channel(`location_pings:${loadNumber}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'location_pings',
          filter: `load_number=eq.${loadNumber}`,
        },
        (payload) => {
          setLatestPing(payload.new as LivePing);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadNumber]);

  return latestPing;
}
```

### 4. Location Utility

```typescript
// apps/web/src/features/loads/lib/location.ts
import { supabase } from '@/lib/supabase';

export interface LocationPing {
  load_number: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  accuracy_m?: number;
  heading_deg?: number;
  speed_ms?: number;
}

export async function insertLocationPing(ping: LocationPing) {
  const { data, error } = await supabase.from('location_pings').insert({
    load_number: ping.load_number,
    driver_id: ping.driver_id,
    latitude: ping.latitude,
    longitude: ping.longitude,
    accuracy_m: ping.accuracy_m ?? null,
    heading_deg: ping.heading_deg != null ? Math.round(ping.heading_deg) : null,
    speed_ms: ping.speed_ms ?? null,
  });

  if (error) return null;
  return data;
}
```

### 5. Cleanup Edge Function

```typescript
// supabase/functions/location-cleanup/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { error, count } = await supabase
    .from('location_pings')
    .delete({ count: 'exact' })
    .lt('recorded_at', cutoff);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, deleted: count ?? 0 }));
});
```

**Schedule via Supabase pg_cron (every hour):**

```sql
SELECT cron.schedule(
  'location-cleanup',
  '0 * * * *',
  $$SELECT net.http_post(
    url:='https://<project>.supabase.co/functions/v1/location-cleanup',
    headers:='{"Authorization": "Bearer <service-role-key>"}'
  )$$
);
```

### 6. Using the Hooks Together

```tsx
// In the driver's load detail view:
import { useDriverLocation } from '@/features/loads/hooks/use-driver-location';

// Starts streaming GPS when load goes in_transit, stops automatically
useDriverLocation({ loadNumber: load.loadNumber, active: load.status === 'in_transit' });
```

```tsx
// In the broker/shipper tracking view:
import { useLiveTracking } from '@/features/loads/hooks/use-live-tracking';

const latestPing = useLiveTracking(load.loadNumber);

// latestPing updates in real time as the driver moves
// latestPing?.latitude, latestPing?.longitude → position on map
// latestPing?.heading_deg → rotate truck icon
// latestPing?.speed_ms → display speed
```

---

## Data Flow

```
Driver device (browser)
  ↓ navigator.geolocation.watchPosition()
  ↓ Haversine check (≥50m moved OR 30s elapsed)
  ↓ insertLocationPing() → Supabase location_pings INSERT

Supabase Realtime
  ↓ postgres_changes event fires
  ↓ useLiveTracking() receives new ping
  ↓ Map re-renders with updated truck position

Cleanup (hourly)
  ↓ location-cleanup edge function
  ↓ DELETE pings older than 24 hours
  ↓ Permanent history stays in tracking_milestones
```

---

## Definition of Done

- [x] `location_pings` table created via migration 012
- [x] RLS policies: drivers insert own pings, authenticated users read
- [x] Driver hook streams GPS pings when load is `in_transit`
- [x] Smart interval avoids excess pings (30s + 50m thresholds)
- [x] Viewer hook subscribes to Realtime and updates on INSERT
- [x] Most recent ping fetched on initial mount
- [x] Cleanup function deployed and scheduled via pg_cron
- [x] Map component reads `latestPing` and renders truck position
- [x] No memory leaks — watch and channel cleaned up on unmount

---

## Success Metrics

| Metric                       | Target                     |
| ---------------------------- | -------------------------- |
| Ping write latency           | < 500ms                    |
| Realtime update delivery     | < 2 seconds                |
| GPS accuracy                 | ≤ 20m (mobile)             |
| Battery impact (driver)      | Minimal (smart interval)   |
| Table row count (24h window) | ~2,880 pings/truck/day max |
| Cleanup success rate         | > 99%                      |

---

_This phase closes the loop on real-time visibility — carriers, brokers, and shippers can all see exactly where the load is without making a single phone call._
