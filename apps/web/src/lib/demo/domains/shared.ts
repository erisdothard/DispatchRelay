/**
 * Screens every role reaches: messages, tracking, profile, lane intelligence, AI search.
 * Seeds and handlers live in ./shared/*; this file merges them into one domain.
 */
import type { DemoDomain, SeedTables } from '../types';
import { ACCOUNT_FUNCTIONS, ACCOUNT_RPC, buildAccountSeeds } from './shared/account';
import { aiLoadSearch } from './shared/ai-search';
import { buildLaneSeeds, LANE_RPC } from './shared/lanes';
import { buildMarketplaceSeeds } from './shared/marketplace';
import { buildMessagingSeeds, simulateReply } from './shared/messaging';

function mergeSeeds(...parts: SeedTables[]): SeedTables {
  return parts.reduce<SeedTables>((all, part) => {
    const next = { ...all };
    for (const [table, rows] of Object.entries(part))
      next[table] = [...(next[table] ?? []), ...rows];
    return next;
  }, {});
}

export const sharedDomain: DemoDomain = {
  seeds: () =>
    mergeSeeds(
      buildMessagingSeeds(),
      buildLaneSeeds(),
      buildAccountSeeds(),
      buildMarketplaceSeeds(),
    ),
  rpc: {
    ...LANE_RPC,
    ...ACCOUNT_RPC,
    demo_simulate_reply: simulateReply,
  },
  functions: {
    'ai-load-search': aiLoadSearch,
    ...ACCOUNT_FUNCTIONS,
  },
};
