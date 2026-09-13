/**
 * Shipper and broker screens: dock scheduling, RFPs, API keys, carrier sourcing,
 * relationships, templates, ratings and accessorials. Each area lives in ./shipper-broker/.
 */
import type { DemoDomain, SeedTables } from '../types';
import { API_KEY_RPC, apiKeySeeds } from './shipper-broker/api-keys';
import { DOCK_RPC, dockSeeds } from './shipper-broker/docks';
import { MARKETPLACE_RPC, marketplaceSeeds } from './shipper-broker/marketplace';
import { RFP_RPC, rfpSeeds } from './shipper-broker/rfps';
import { SOURCING_RPC, sourcingSeeds } from './shipper-broker/sourcing';

function mergeSeeds(...parts: SeedTables[]): SeedTables {
  return parts.reduce<SeedTables>((all, part) => {
    const next = { ...all };
    for (const [table, rows] of Object.entries(part))
      next[table] = [...(next[table] ?? []), ...rows];
    return next;
  }, {});
}

export const shipperBrokerDomain: DemoDomain = {
  seeds: () =>
    mergeSeeds(dockSeeds(), rfpSeeds(), apiKeySeeds(), sourcingSeeds(), marketplaceSeeds()),
  rpc: {
    ...DOCK_RPC,
    ...RFP_RPC,
    ...API_KEY_RPC,
    ...SOURCING_RPC,
    ...MARKETPLACE_RPC,
  },
};
