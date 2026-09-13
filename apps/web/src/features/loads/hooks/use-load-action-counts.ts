import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { realtimeSubscribe } from '@/lib/realtime-manager';

/**
 * Returns the number of loads requiring action for the current user's role.
 * Used to drive the orange badge on the Loads nav icon.
 *
 * Broker  → bid_received loads they posted (bids awaiting review)
 * Carrier → awarded loads they have an accepted bid on (awaiting dispatch)
 * Driver  → dispatched loads assigned to them (upcoming pickup)
 * Others  → 0
 */
export function useLoadActionCounts(): number {
  const { user, profile } = useAuth();
  // App role lives on the profile — the auth user's `role` is always 'authenticated'.
  const role = profile?.role;
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!user?.id || !role) return;

    try {
      if (role === 'broker') {
        const { count: c } = await supabase
          .from('loads')
          .select('*', { count: 'exact', head: true })
          .eq('posted_by', user.id)
          .eq('status', 'bid_received');
        setCount(c ?? 0);
      } else if (role === 'carrier') {
        // Find load IDs where this carrier has an accepted bid
        const { data: bids } = await supabase
          .from('bids')
          .select('load_id')
          .eq('carrier_id', user.id)
          .eq('status', 'accepted');
        const loadIds = (bids ?? []).map((b) => b.load_id);
        if (loadIds.length === 0) {
          setCount(0);
          return;
        }

        const { count: c } = await supabase
          .from('loads')
          .select('*', { count: 'exact', head: true })
          .in('id', loadIds)
          .eq('status', 'awarded');
        setCount(c ?? 0);
      } else if (role === 'driver') {
        const { count: c } = await supabase
          .from('loads')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_driver_id', user.id)
          .eq('status', 'dispatched');
        setCount(c ?? 0);
      } else {
        setCount(0);
      }
    } catch {
      // non-fatal — badge just won't show
    }
  }, [user?.id, role]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Refresh on any load update (status changes)
  useEffect(() => {
    if (!user?.id) return;
    return realtimeSubscribe({ table: 'loads', event: 'UPDATE' }, fetchCount);
  }, [user?.id, fetchCount]);

  return count;
}
