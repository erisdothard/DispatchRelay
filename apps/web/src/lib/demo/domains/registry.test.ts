import { describe, expect, it } from 'vitest';
import type { DemoDomain } from '../types';
import { carrierDomain } from './carrier';
import { coreDomain } from './core';
import { driverDomain } from './driver';
import { buildSeedTables } from './index';
import { sharedDomain } from './shared';
import { shipperBrokerDomain } from './shipper-broker';

const DOMAINS: Record<string, DemoDomain> = {
  core: coreDomain,
  carrier: carrierDomain,
  driver: driverDomain,
  shipperBroker: shipperBrokerDomain,
  shared: sharedDomain,
};

/** Handlers merge with last-wins, so a name owned by two domains silently shadows one of them. */
function sharedNames(key: 'rpc' | 'functions'): string[] {
  const owners = new Map<string, string[]>();
  for (const [domainName, domain] of Object.entries(DOMAINS)) {
    for (const fn of Object.keys(domain[key] ?? {})) {
      owners.set(fn, [...(owners.get(fn) ?? []), domainName]);
    }
  }
  return [...owners]
    .filter(([, names]) => names.length > 1)
    .map(([fn, names]) => `${fn}: ${names.join(', ')}`);
}

describe('demo domain registry', () => {
  it('gives every rpc handler exactly one owning domain', () => {
    expect(sharedNames('rpc')).toEqual([]);
  });

  it('gives every edge-function handler exactly one owning domain', () => {
    expect(sharedNames('functions')).toEqual([]);
  });

  it('never seeds two rows with the same id in one table', () => {
    const duplicates = Object.entries(buildSeedTables()).flatMap(([table, rows]) => {
      const seen = new Set<unknown>();
      return rows
        .map((row) => row.id)
        .filter((id) => id !== undefined && (seen.has(id) || !seen.add(id)))
        .map((id) => `${table}.${String(id)}`);
    });
    expect(duplicates).toEqual([]);
  });
});
