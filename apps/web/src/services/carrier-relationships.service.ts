import { supabase } from '@/lib/supabase';

export type RelationshipStatus = 'preferred' | 'blocked';

export interface CarrierRelationship {
  id: string;
  company_id: string;
  carrier_id: string;
  carrier_name: string | null;
  status: RelationshipStatus;
  notes: string | null;
  created_at: string;
}

interface RelRow {
  id: string;
  company_id: string;
  carrier_id: string;
  status: RelationshipStatus;
  notes: string | null;
  created_at: string;
}

/** Resolves the signed-in user's id and company via company_members (profiles has no company_id). */
async function getMyCompany(): Promise<{ userId: string; companyId: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  const companyId = (membership as { company_id?: string } | null)?.company_id;
  if (!companyId) throw new Error('No company found');
  return { userId: user.id, companyId };
}

/** Carrier ids are carrier company ids (the sheet adds from `companies`); fall back to profiles. */
async function resolveCarrierNames(ids: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  if (ids.length === 0) return names;

  const { data: companies } = await supabase.from('companies').select('id, name').in('id', ids);
  for (const c of companies ?? []) {
    if (c.name) names.set(c.id, c.name);
  }

  const missing = ids.filter((id) => !names.has(id));
  if (missing.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', missing);
    for (const p of profiles ?? []) {
      if (p.full_name) names.set(p.id, p.full_name);
    }
  }
  return names;
}

export async function getRelationships(): Promise<CarrierRelationship[]> {
  const { companyId } = await getMyCompany();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('carrier_relationships')
    .select('id, company_id, carrier_id, status, notes, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw new Error((error as { message: string }).message);

  const rows = (data as RelRow[]) ?? [];
  const nameMap = await resolveCarrierNames([
    ...new Set(rows.map((r) => r.carrier_id).filter(Boolean)),
  ]);

  return rows.map((row) => ({
    id: row.id,
    company_id: row.company_id,
    carrier_id: row.carrier_id,
    carrier_name: nameMap.get(row.carrier_id) ?? null,
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
  const { userId, companyId } = await getMyCompany();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('carrier_relationships').upsert(
    {
      company_id: companyId,
      carrier_id: carrierId,
      status,
      notes: notes ?? null,
      created_by: userId,
    },
    { onConflict: 'company_id,carrier_id' },
  );

  if (error) throw new Error((error as { message: string }).message);
}

export async function removeRelationship(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('carrier_relationships').delete().eq('id', id);
  if (error) throw new Error((error as { message: string }).message);
}
