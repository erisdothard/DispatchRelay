import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getLoadsPage, PAGE_SIZE } from '@/services/loads.service';
import type { LoadFilters } from '@/services/loads.service';
import type { Load } from '@freightx/shared';

interface UseLoadsResult {
  loads: Load[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  total: number | null;
  refresh: () => void;
  loadMore: () => void;
}

export function useLoads(filters: LoadFilters = {}): UseLoadsResult {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const pageRef = useRef(0);

  // Stable filter key (exclude page — we manage that ourselves)
  const { page: _page, ...filtersWithoutPage } = filters;
  const filterKey = JSON.stringify(filtersWithoutPage);

  const fetchPage = useCallback(
    async (page: number, append: boolean) => {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const result = await getLoadsPage({ ...JSON.parse(filterKey), page });
        setLoads((prev) => (append ? [...prev, ...result.loads] : result.loads));
        setHasMore(result.hasMore);
        setTotal(result.total);
        pageRef.current = page;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filterKey],
  );

  const refresh = useCallback(() => {
    pageRef.current = 0;
    fetchPage(0, false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    fetchPage(pageRef.current + 1, true);
  }, [fetchPage, hasMore, loadingMore]);

  useEffect(() => {
    pageRef.current = 0;
    fetchPage(0, false);
  }, [fetchPage]);

  // Supabase Realtime — new/updated loads refresh page 0
  useEffect(() => {
    const channel = supabase
      .channel('loads-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'loads' }, () => {
        // Only auto-refresh if on first page
        if (pageRef.current === 0) fetchPage(0, false);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'loads' }, () => {
        if (pageRef.current === 0) fetchPage(0, false);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPage]);

  return { loads, loading, loadingMore, error, hasMore, total, refresh, loadMore };
}
