# Phase 3 — Real-Time & Messaging

**Goal:** The board is live. New posts appear instantly. Per-load chat works.
**Duration:** 2–3 weeks
**Prerequisite:** Phase 2 complete — all CRUD connected to real DB

---

## Checklist

- [x] Migration: conversations + messages tables (001-initial-schema.sql)
- [x] Migration 002: notifications table (database/migrations/002-notifications.sql) — run in Supabase Dashboard
- [x] Supabase Realtime enabled on loads table — useLoads hook subscribes via postgres_changes
- [x] Supabase Realtime enabled on trucks table — useTrucks hook subscribes via postgres_changes
- [x] New postings appear < 2 seconds for all users
- [x] Status changes propagate in real time
- [x] Per-load chat UI — pages/messages.tsx fully built
- [x] Realtime message delivery — postgres_changes INSERT on messages table per conversation
- [x] File sharing in message threads
- [x] Conversation list with unread count
- [x] In-app notification bell — all three dashboards wired to useNotifications + NotificationSheet
- [x] Notification sheet with mark-all-read
- [x] Email notifications (Edge Functions)
- [x] Notification preferences

**Phase 3 Status: 🟢 CORE COMPLETE** (core realtime + notifications done; email + file sharing are stretch goals)

---

## Database Migrations

### Migration 006: Messages (Threads)

```sql
-- supabase/migrations/006_create_messages.sql

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references public.loads(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.message_items (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.messages(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text,                        -- null if file-only message
  file_url text,
  file_name text,
  file_type text,
  read_by uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Index for fast thread loading
create index message_items_thread_id_idx on public.message_items(thread_id);
create index message_items_sender_id_idx on public.message_items(sender_id);
create unique index one_thread_per_load on public.messages(load_id);

-- RLS
alter table public.messages enable row level security;
alter table public.message_items enable row level security;

-- Only parties on the load (poster + booked carrier) can see the thread
create policy "Load parties can access message thread"
  on public.messages for all
  using (
    exists (
      select 1 from public.loads
      where id = load_id
        and (posted_by = auth.uid() or booked_carrier_id = auth.uid())
    )
  );

create policy "Load parties can send messages"
  on public.message_items for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.messages m
      join public.loads l on l.id = m.load_id
      where m.id = thread_id
        and (l.posted_by = auth.uid() or l.booked_carrier_id = auth.uid())
    )
  );

create policy "Load parties can view messages"
  on public.message_items for select
  using (
    exists (
      select 1 from public.messages m
      join public.loads l on l.id = m.load_id
      where m.id = thread_id
        and (l.posted_by = auth.uid() or l.booked_carrier_id = auth.uid())
    )
  );
```

### Migration 007: Notifications

```sql
-- supabase/migrations/007_create_notifications.sql

create type notification_type as enum (
  'new_bid', 'bid_accepted', 'bid_declined', 'bid_countered',
  'load_booked', 'load_status_change', 'new_message',
  'load_cancelled', 'document_uploaded', 'payment_received'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  load_id uuid references public.loads(id) on delete set null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications(user_id);
create index notifications_read_idx on public.notifications(user_id, read);

-- RLS
alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Users can mark own notifications as read"
  on public.notifications for update
  using (user_id = auth.uid());
```

---

## Supabase Realtime Setup

Enable Realtime for the tables you need in Supabase Dashboard → Database → Replication:

- `loads` — enable INSERT, UPDATE
- `trucks` — enable INSERT, UPDATE
- `message_items` — enable INSERT
- `notifications` — enable INSERT

### Realtime Hook Pattern

```typescript
// apps/web/src/shared/hooks/use-realtime-loads.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@freightx/shared';

export function useRealtimeLoads() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('loads-board')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'loads' }, () => {
        // Invalidate and refetch the loads query
        queryClient.invalidateQueries({ queryKey: ['loads'] });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'loads' }, (payload) => {
        // Update the specific load in cache
        queryClient.setQueryData(['load', payload.new.id], payload.new);
        queryClient.invalidateQueries({ queryKey: ['loads'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
```

Call this hook in the dashboard layouts so it runs as long as the user is on the board.

---

## Real-Time Chat

### useMessages Hook

```typescript
// apps/web/src/features/messages/hooks/use-messages.ts
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@freightx/shared';

export function useMessages(threadId: string) {
  const queryClient = useQueryClient();

  // Initial load
  const query = useQuery({
    queryKey: ['messages', threadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_items')
        .select('*, profiles(full_name, avatar_url)')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`thread-${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_items',
          filter: `thread_id=eq.${threadId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', threadId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, queryClient]);

  return query;
}
```

---

## Notification Bell

### useNotifications Hook

```typescript
// apps/web/src/features/notifications/hooks/use-notifications.ts
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@freightx/shared';

export function useNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  // Real-time new notifications
  useEffect(() => {
    const channel = supabase
      .channel('my-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useUnreadCount() {
  const { data } = useNotifications();
  return data?.filter((n) => !n.read).length ?? 0;
}
```

---

## Email Notifications (Supabase Edge Functions)

Create a Supabase Edge Function triggered by DB events to send emails via Resend.

```
supabase/functions/
└── notify-on-bid/
    └── index.ts
```

```typescript
// supabase/functions/notify-on-bid/index.ts
import { Resend } from 'npm:resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  const { record } = await req.json();

  // record = the new bid row from the bids table
  // Look up the load and poster's email from Supabase
  // Send email via Resend

  await resend.emails.send({
    from: 'FreightX <notifications@freightx.com>',
    to: [posterEmail],
    subject: `New bid received on load ${loadNumber}`,
    html: `<p>A carrier has submitted a bid of $${record.amount} on your load.</p>`,
  });

  return new Response('ok');
});
```

Trigger via a Database Webhook in Supabase Dashboard → Database → Webhooks.

---

## Notification Preferences

Add a `notification_preferences` column to profiles:

```sql
-- supabase/migrations/008_notification_preferences.sql
alter table public.profiles
  add column notification_preferences jsonb not null default '{
    "new_bid": true,
    "bid_accepted": true,
    "new_message": true,
    "load_status_change": true,
    "email_notifications": true
  }';
```

---

## Acceptance Criteria

- [ ] User A posts a load → User B (on load board tab) sees it within 2 seconds, no refresh
- [ ] User A sends a chat message → User B sees it appear in real time
- [ ] Notification bell count updates in real time when notification received
- [ ] Email sent when a bid is received (check email inbox in staging)
- [ ] Unread message count shows in sidebar conversation list

---

## Next Phase

Once Phase 3 is complete, move to [`PHASE4_GUIDE.md`](./PHASE4_GUIDE.md).
