import { describe, expect, it } from 'vitest';
import { DemoQueryBuilder } from './query-builder';
import { columnPredicate, orPredicate, parseSelect } from './query-engine';
import type { Row } from './types';

const row: Row = {
  id: 'l1',
  status: 'posted',
  company_id: 'c1',
  assigned_driver_id: 'd1',
  second_driver_id: null,
  name: 'Rivera Transport',
};

describe('orPredicate', () => {
  it('matches when either driver column equals the id', () => {
    const predicate = orPredicate('assigned_driver_id.eq.d1,second_driver_id.eq.d1');
    expect(predicate(row)).toBe(true);
    expect(predicate({ ...row, assigned_driver_id: 'd9' })).toBe(false);
  });

  it('treats % as a case-insensitive wildcard for ilike', () => {
    const predicate = orPredicate('name.ilike.%rivera%,mc_number.ilike.%rivera%');
    expect(predicate(row)).toBe(true);
    expect(predicate({ ...row, name: 'Summit Haulers' })).toBe(false);
  });

  it('evaluates nested and() groups with in-lists', () => {
    const predicate = orPredicate('id.in.(l2,l3),and(company_id.eq.c1,status.in.(awarded,posted))');
    expect(predicate(row)).toBe(true);
    expect(predicate({ ...row, company_id: 'c2' })).toBe(false);
    expect(predicate({ ...row, id: 'l3', company_id: 'c2' })).toBe(true);
  });
});

describe('columnPredicate', () => {
  it('negates quoted in-lists like .not(status, in, ...)', () => {
    const predicate = columnPredicate('status', 'in', '("cancelled","tonu","rejected")', true);
    expect(predicate(row)).toBe(true);
    expect(predicate({ ...row, status: 'tonu' })).toBe(false);
  });

  it('matches null with is', () => {
    expect(columnPredicate('second_driver_id', 'is', null)(row)).toBe(true);
    expect(columnPredicate('assigned_driver_id', 'is', null)(row)).toBe(false);
  });

  it('never hides rows over embedded-column filters', () => {
    expect(columnPredicate('loads.status', 'eq', 'nope')(row)).toBe(true);
  });
});

describe('parseSelect', () => {
  it('parses aliases, fkey hints and nested embeds', () => {
    const spec = parseSelect(
      '*, assignee_profile:assignee_id(full_name), company_logo_url:companies!loads_company_id_fkey(logo_url)',
    );
    expect(spec.embeds.map((e) => [e.alias, e.target, e.hint])).toEqual([
      ['assignee_profile', 'assignee_id', null],
      ['company_logo_url', 'companies', 'loads_company_id_fkey'],
    ]);
  });
});

describe('DemoQueryBuilder over seeded tables', () => {
  it('embeds the related load on a bid as an object', async () => {
    const { data, error } = await new DemoQueryBuilder('bids')
      .select('*, loads(load_number, status)')
      .eq('id', 'bid-001')
      .single();
    expect(error).toBeNull();
    expect((data as Row).loads).toMatchObject({ load_number: 'DR-1046' });
  });

  it('resolves column-named and fkey-hinted embeds on loads', async () => {
    const { data } = await new DemoQueryBuilder('loads')
      .select(
        '*, driver_profile:assigned_driver_id(full_name), company_logo_url:companies!loads_company_id_fkey(logo_url)',
      )
      .eq('id', 'load-001')
      .single();
    const load = data as Row;
    expect(load.driver_profile).toMatchObject({ full_name: 'Carlos Mendez' });
    expect(load.company_logo_url).toMatchObject({ name: 'Apex Freight Solutions' });
  });

  it('returns only a count for head requests', async () => {
    const result = await new DemoQueryBuilder('loads')
      .select('*', { count: 'exact', head: true })
      .eq('posted_by', 'demo-broker')
      .eq('status', 'bid_received');
    expect(result.data).toBeNull();
    // DR-1046 only — DR-1050 is seeded back to "posted" while Apex's counter is out.
    expect(result.count).toBe(1);
  });

  it('errors on single() with no rows and returns null from maybeSingle()', async () => {
    const single = await new DemoQueryBuilder('loads').select('*').eq('id', 'missing').single();
    expect(single.error?.code).toBe('PGRST116');
    const maybe = await new DemoQueryBuilder('loads').select('*').eq('id', 'missing').maybeSingle();
    expect(maybe).toMatchObject({ data: null, error: null });
  });

  it('supports the carrier active-loads query shape', async () => {
    const { data } = await new DemoQueryBuilder('loads')
      .select('*')
      .or('id.in.(load-001,load-002,load-003),and(company_id.eq.none,status.in.(awarded))')
      .not('status', 'in', '("posted","bid_received")')
      .order('pickup_date', { ascending: true });
    expect((data as Row[]).map((l) => l.id).sort()).toEqual(['load-001', 'load-002']);
  });

  it('applies insert defaults and returns the row with .select().single()', async () => {
    const { data } = await new DemoQueryBuilder('loads')
      .insert({ origin_city: 'Nashville', dest_city: 'Atlanta', posted_by: 'demo-broker' })
      .select()
      .single();
    expect(data).toMatchObject({ status: 'posted', bid_count: 0, origin_city: 'Nashville' });
    expect((data as Row).load_number).toMatch(/^DR-\d+$/);
  });

  it('updates only the filtered rows and returns no data without .select()', async () => {
    const update = await new DemoQueryBuilder('bids')
      .update({ status: 'declined' })
      .eq('id', 'bid-004');
    expect(update.data).toBeNull();
    const { data } = await new DemoQueryBuilder('bids')
      .select('id, status')
      .in('id', ['bid-004', 'bid-005']);
    expect(Object.fromEntries((data as Row[]).map((b) => [b.id, b.status]))).toEqual({
      'bid-004': 'declined',
      'bid-005': 'pending',
    });
  });
});
