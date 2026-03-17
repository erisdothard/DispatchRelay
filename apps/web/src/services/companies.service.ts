import { supabase } from '@/lib/supabase';
import type { CompanyRow } from '@/lib/database.types';

export async function getCompany(id: string): Promise<CompanyRow | null> {
  const { data, error } = await supabase.from('companies').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as CompanyRow | null;
}

export interface CompanyFilters {
  type?: CompanyRow['type'];
  verified?: boolean;
}

export async function getCompanies(filters: CompanyFilters = {}): Promise<CompanyRow[]> {
  let query = supabase.from('companies').select('*').order('name', { ascending: true });
  if (filters.type !== undefined) query = query.eq('type', filters.type);
  if (filters.verified !== undefined) query = query.eq('verified', filters.verified);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as CompanyRow[];
}

export async function updateCompany(
  id: string,
  updates: Partial<CompanyRow>,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('companies').update(updates).eq('id', id);
  return { error: error?.message ?? null };
}
