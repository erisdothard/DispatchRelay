import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Returns how many of the current user's conversations have messages they haven't read.
 * Counts only messages sent by the other participant, so each side of a conversation
 * gets its own badge. Uses realtime listeners with a 30s polling fallback.
 */
export function useUnreadMessages(): number {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data: convos, error: convoError } = await supabase
      .from('conversations')
      .select('id')
      .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`);
    if (convoError) return;
    const ids = (convos ?? []).map((c) => c.id);
    if (ids.length === 0) {
      setCount(0);
      return;
    }
    const { data: unread, error } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', ids)
      .eq('read', false)
      .neq('sender_id', user.id);
    if (error) return;
    setCount(new Set((unread ?? []).map((m) => m.conversation_id)).size);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Realtime — new or read messages re-check the badge
  useEffect(() => {
    if (!user) return;
    const onChange = () => void refresh();
    const channel = supabase
      .channel('unread-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, onChange)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  // Polling fallback
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(interval);
  }, [user, refresh]);

  return count;
}
