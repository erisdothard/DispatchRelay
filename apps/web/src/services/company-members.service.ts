import { supabase } from '@/lib/supabase';

export type MemberRole = 'owner' | 'admin' | 'dispatcher' | 'accounting' | 'viewer';

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: MemberRole;
  invited_by: string | null;
  joined_at: string;
  created_at: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
}

export interface CompanyInvite {
  id: string;
  company_id: string;
  email: string;
  role: MemberRole;
  token: string;
  invited_by: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export async function getCompanyMembers(companyId: string): Promise<CompanyMember[]> {
  const { data, error } = await db
    .from('company_members')
    .select('*, profiles!company_members_user_id_fkey(full_name, email, avatar_url)')
    .eq('company_id', companyId)
    .order('joined_at', { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    company_id: row.company_id as string,
    user_id: row.user_id as string,
    role: row.role as MemberRole,
    invited_by: (row.invited_by as string) ?? null,
    joined_at: row.joined_at as string,
    created_at: row.created_at as string,
    full_name: (row.profiles as Record<string, string> | null)?.full_name ?? undefined,
    email: (row.profiles as Record<string, string> | null)?.email ?? undefined,
    avatar_url: (row.profiles as Record<string, string> | null)?.avatar_url ?? undefined,
  }));
}

export async function getCompanyInvites(companyId: string): Promise<CompanyInvite[]> {
  const { data, error } = await db
    .from('company_invites')
    .select('*')
    .eq('company_id', companyId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as CompanyInvite[];
}

export async function inviteMember(params: {
  companyId: string;
  email: string;
  role: MemberRole;
}): Promise<CompanyInvite> {
  const { data: authData } = await supabase.auth.getUser();
  const { data, error } = await db
    .from('company_invites')
    .insert({
      company_id: params.companyId,
      email: params.email,
      role: params.role,
      invited_by: authData.user?.id ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as CompanyInvite;
}

export async function revokeInvite(inviteId: string): Promise<void> {
  const { error } = await db.from('company_invites').delete().eq('id', inviteId);
  if (error) throw new Error(error.message);
}

export async function updateMemberRole(memberId: string, role: MemberRole): Promise<void> {
  const { error } = await db
    .from('company_members')
    .update({ role })
    .eq('id', memberId);
  if (error) throw new Error(error.message);
}

export async function removeMember(memberId: string): Promise<void> {
  const { error } = await db.from('company_members').delete().eq('id', memberId);
  if (error) throw new Error(error.message);
}

export async function acceptInvite(token: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('accept_company_invite', { p_token: token });
  if (error) throw new Error(error.message);
}

export async function getMyCompanyRole(companyId: string): Promise<MemberRole | null> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data, error } = await db
    .from('company_members')
    .select('role')
    .eq('company_id', companyId)
    .eq('user_id', authData.user.id)
    .maybeSingle();

  if (error || !data) return null;
  return (data as { role: MemberRole }).role;
}
