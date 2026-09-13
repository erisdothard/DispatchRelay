/**
 * Registry of demo domains. Each domain contributes seed rows, rpc handlers and
 * edge-function handlers; seeds for the same table are concatenated.
 */
import type { DemoDomain, DemoHandler, SeedTables } from '../types';
import { carrierDomain } from './carrier';
import { coreDomain } from './core';
import { driverDomain } from './driver';
import { sharedDomain } from './shared';
import { shipperBrokerDomain } from './shipper-broker';

const DOMAINS: readonly DemoDomain[] = [
  coreDomain,
  carrierDomain,
  driverDomain,
  shipperBrokerDomain,
  sharedDomain,
];

export function buildSeedTables(): SeedTables {
  const merged: SeedTables = {};
  for (const domain of DOMAINS) {
    for (const [table, rows] of Object.entries(domain.seeds())) {
      merged[table] = [...(merged[table] ?? []), ...rows];
    }
  }
  return merged;
}

function collect(key: 'rpc' | 'functions'): Record<string, DemoHandler> {
  return DOMAINS.reduce<Record<string, DemoHandler>>(
    (all, domain) => ({ ...all, ...(domain[key] ?? {}) }),
    {},
  );
}

export const RPC_HANDLERS = collect('rpc');
export const FUNCTION_HANDLERS = collect('functions');
