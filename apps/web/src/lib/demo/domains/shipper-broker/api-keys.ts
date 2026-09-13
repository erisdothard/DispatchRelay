/** Apex Freight's integration API keys, request log, and the key-management Postgres functions. */
import { DEMO_IDS } from '../../identities';
import { daysFromNow, hoursAgo } from '../../time';
import type { DemoHandler, Row, SeedTables } from '../../types';
import { findById, nowIso, num, requireIdentity, str } from './helpers';

const BROKER_CO = DEMO_IDS.brokerCompany;
const KEY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const KEY_PREFIX = 'fxk_demo_';
const PREFIX_LENGTH = KEY_PREFIX.length + 4;

interface KeySeed {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  rpm: number;
  ageDays: number;
  lastUsedHours: number | null;
  ipWhitelist?: string[];
  revokedDays?: number;
}

const KEY_SEEDS: KeySeed[] = [
  {
    id: 'apikey-001',
    name: 'McLeod TMS Integration',
    prefix: 'fxk_demo_4Tq9',
    scopes: ['loads:read', 'loads:write', 'bids:read', 'tracking:read'],
    rpm: 120,
    ageDays: 64,
    lastUsedHours: 0.4,
    ipWhitelist: ['52.14.88.0/24'],
  },
  {
    id: 'apikey-002',
    name: 'Shipper Portal Webhooks',
    prefix: 'fxk_demo_9Hc2',
    scopes: ['tracking:read', 'documents:read', 'webhooks:manage'],
    rpm: 60,
    ageDays: 31,
    lastUsedHours: 3,
  },
  {
    id: 'apikey-003',
    name: 'Rate Analytics (read-only)',
    prefix: 'fxk_demo_2Lm7',
    scopes: ['rates:read', 'loads:read'],
    rpm: 30,
    ageDays: 12,
    lastUsedHours: 26,
  },
  {
    id: 'apikey-004',
    name: 'Legacy EDI Bridge',
    prefix: 'fxk_demo_7Xv3',
    scopes: ['loads:read', 'loads:write'],
    rpm: 60,
    ageDays: 210,
    lastUsedHours: 24 * 22,
    revokedDays: 20,
  },
];

function keyToRow(seed: KeySeed): Row {
  return {
    id: seed.id,
    company_id: BROKER_CO,
    name: seed.name,
    key_hash: `sha256:demo-${seed.id}`,
    key_prefix: seed.prefix,
    scopes: seed.scopes,
    rate_limit_rpm: seed.rpm,
    ip_whitelist: seed.ipWhitelist ?? null,
    expires_at: null,
    last_used_at: seed.lastUsedHours === null ? null : hoursAgo(seed.lastUsedHours),
    revoked_at: seed.revokedDays ? hoursAgo(24 * seed.revokedDays) : null,
    created_by: DEMO_IDS.broker,
    created_at: hoursAgo(24 * seed.ageDays),
  };
}

type UsageSeed = [
  keyId: string,
  method: string,
  endpoint: string,
  status: number,
  ms: number,
  hours: number,
];

const USAGE_SEEDS: UsageSeed[] = [
  ['apikey-001', 'GET', '/v1/loads?status=posted', 200, 142, 0.4],
  ['apikey-001', 'POST', '/v1/loads', 201, 318, 1.2],
  ['apikey-001', 'GET', '/v1/loads/DR-1046/bids', 200, 97, 1.3],
  ['apikey-001', 'GET', '/v1/tracking/DR-1042', 200, 121, 2.1],
  ['apikey-002', 'POST', '/v1/webhooks/deliveries', 202, 84, 3],
  ['apikey-002', 'GET', '/v1/documents/doc-bol-004', 404, 61, 5],
  ['apikey-003', 'GET', '/v1/rates/lanes?origin=GA&dest=TX', 200, 233, 26],
  ['apikey-001', 'POST', '/v1/loads', 429, 12, 30],
];

function usageToRow([keyId, method, endpoint, status, ms, hours]: UsageSeed, i: number): Row {
  return {
    id: `apiusage-${i + 1}`,
    api_key_id: keyId,
    endpoint,
    method,
    response_status: status,
    response_time_ms: ms,
    ip_address: '52.14.88.17',
    user_agent: 'McLeod-LoadMaster/24.2',
    error_message:
      status === 429
        ? 'Rate limit exceeded (120 rpm)'
        : status === 404
          ? 'Document not found'
          : null,
    created_at: hoursAgo(hours),
  };
}

// ── Postgres functions ───────────────────────────────

function randomKeyBody(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => KEY_ALPHABET[b % KEY_ALPHABET.length]).join('');
}

const generateApiKey: DemoHandler = (args, ctx) => {
  const identity = requireIdentity(ctx, 'create API keys');
  const companyId = str(args.p_company_id);
  if (companyId !== identity.companyId) {
    throw new Error('You can only create API keys for your own company.');
  }
  const name = str(args.p_name).trim();
  if (!name) throw new Error('Give the key a name.');
  const scopes = Array.isArray(args.p_scopes) ? args.p_scopes.map(str).filter(Boolean) : [];
  if (scopes.length === 0) throw new Error('Select at least one scope.');

  const plaintext = `${KEY_PREFIX}${randomKeyBody(32)}`;
  const [key] = ctx.db.insert('api_keys', [
    {
      company_id: companyId,
      name,
      key_hash: `sha256:demo-${plaintext.slice(-8)}`,
      key_prefix: plaintext.slice(0, PREFIX_LENGTH),
      scopes,
      rate_limit_rpm: num(args.p_rate_limit_rpm) ?? 60,
      ip_whitelist: Array.isArray(args.p_ip_whitelist) ? args.p_ip_whitelist.map(str) : null,
      expires_at: null,
      last_used_at: null,
      revoked_at: null,
      created_by: identity.id,
    },
  ]);
  return { key, plaintext_key: plaintext };
};

const revokeApiKey: DemoHandler = (args, ctx) => {
  const identity = requireIdentity(ctx, 'revoke API keys');
  const key = findById(ctx.db.read('api_keys'), args.p_key_id);
  if (!key || key.company_id !== identity.companyId) throw new Error('API key not found.');
  ctx.db.update('api_keys', (k) => k.id === key.id, { revoked_at: nowIso() });
  return null;
};

/** Daily request volume for the company's keys — shaped like the real aggregate view. */
const getApiUsageStats: DemoHandler = (args, { db }) => {
  const activeKeys = db
    .read('api_keys')
    .filter((k) => k.company_id === args.p_company_id && !k.revoked_at).length;
  if (activeKeys === 0) return [];
  const days = Math.min(Math.max(num(args.p_days) ?? 30, 1), 90);
  return Array.from({ length: days }, (_, idx) => {
    const offset = days - 1 - idx;
    const date = daysFromNow(-offset);
    const weekday = new Date(`${date}T12:00:00`).getDay();
    const weekend = weekday === 0 || weekday === 6;
    const total = Math.round((weekend ? 260 : 820) * activeKeys * 0.5 + ((offset * 37) % 11) * 18);
    const errors = Math.round(total * 0.011) + (offset % 3);
    return {
      date,
      total_requests: total,
      success_count: total - errors,
      error_count: errors,
      avg_latency_ms: 118 + ((offset * 13) % 57),
    };
  });
};

export function apiKeySeeds(): SeedTables {
  return {
    api_keys: KEY_SEEDS.map(keyToRow),
    api_key_usage: USAGE_SEEDS.map(usageToRow),
  };
}

export const API_KEY_RPC: Record<string, DemoHandler> = {
  generate_api_key: generateApiKey,
  revoke_api_key: revokeApiKey,
  get_api_usage_stats: getApiUsageStats,
};
