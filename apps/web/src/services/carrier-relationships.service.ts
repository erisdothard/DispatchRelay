import { supabase } from '@/lib/supabase';

export type RelationshipStatus = 'preferred' | 'blocked' | 'neutral';

export interface CarrierRelationship {
  id: string;
  broker_company_id: string;
  carrier_company_id: string;
  carrier_company_name: string | null;
  status: RelationshipStatus;
  notes: string | null;
  created_at: string;
}

interface RelRow {
  id: string;
  broker_company_id: string;
  carrier_company_id: string;
  status: RelationshipStatus;
  notes: string | null;
  created_at: string;
  companies: { name: string } | null;
}

export async function getRelationships(): Promise<CarrierRelationship[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('carrier_relationships')
    .select('id, broker_company_id, carrier_company_id, status, notes, created_at, companies:carrier_company_id(name)')
    .order('created_at', { ascending: false });

  if (error) throw new Error((error as { message: string }).message);

  return ((data as RelRow[]) ?? []).map((row) => ({
    id: row.id,
    broker_company_id: row.broker_company_id,
    carrier_company_id: row.carrier_company_id,
    carrier_company_name: row.companies?.name ?? null,
    status: row.status,
    notes: row.notes,
    created_at: row.created_at,
  }));
}

export async function upsertRelationship(
  carrierId: string,
  status: RelationshipStatus,
  notes?: string,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  // company_id exists in DB but not in generated types yet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const companyId = (profile as any)?.company_id as string | undefined;
  if (!companyId) throw new Error('No company found');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('carrier_relationships')
    .upsert(
      {
        broker_company_id: companyId,
        carrier_company_id: carrierId,
        status,
        notes: notes ?? null,
      },
      { onConflict: 'broker_company_id,carrier_company_id' },
    );

  if (error) throw new Error((error as { message: string }).message);
}

export async function removeRelationship(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('carrier_relationships')
    .delete()
    .eq('id', id);
  if (error) throw new Error((error as { message: string }).message);
}
