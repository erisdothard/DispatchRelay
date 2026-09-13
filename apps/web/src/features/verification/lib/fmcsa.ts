import { supabase } from '@/lib/supabase';
import { isDemoActive } from '@/lib/demo/demo-session';

const FMCSA_BASE = 'https://mobile.fmcsa.dot.gov/qc/services';
const API_KEY = import.meta.env.VITE_FMCSA_API_KEY as string;

export interface FmcsaResult {
  status: 'AUTHORIZED' | 'NOT AUTHORIZED' | 'PENDING' | 'UNKNOWN';
  legalName: string | null;
  dotNumber: string | null;
  mcNumber: string | null;
  safetyRating: string | null;
  csaScore: number | null;
}

export async function verifyByMcNumber(mcNumber: string): Promise<FmcsaResult> {
  if (isDemoActive()) return demoFmcsaResult(mcNumber);
  if (API_KEY === 'PLACEHOLDER_FMCSA_KEY') {
    return mockFmcsaResult(mcNumber);
  }
  const res = await fetch(`${FMCSA_BASE}/carriers/${mcNumber}?webKey=${API_KEY}`);
  if (!res.ok) throw new Error('FMCSA lookup failed');
  const data = await res.json();
  const carrier = data?.content?.carrier;
  return {
    status: carrier?.allowedToOperate === 'Y' ? 'AUTHORIZED' : 'NOT AUTHORIZED',
    legalName: carrier?.legalName ?? null,
    dotNumber: carrier?.dotNumber ? String(carrier.dotNumber) : null,
    mcNumber: mcNumber,
    safetyRating: carrier?.safetyRating ?? null,
    csaScore: null,
  };
}

export async function verifyByDotNumber(dotNumber: string): Promise<FmcsaResult> {
  if (isDemoActive()) return demoFmcsaResult(dotNumber);
  if (API_KEY === 'PLACEHOLDER_FMCSA_KEY') {
    return mockFmcsaResult(dotNumber);
  }
  const res = await fetch(`${FMCSA_BASE}/carriers/docket-number/${dotNumber}?webKey=${API_KEY}`);
  if (!res.ok) throw new Error('FMCSA lookup failed');
  const data = await res.json();
  const carrier = data?.content?.carrier;
  return {
    status: carrier?.allowedToOperate === 'Y' ? 'AUTHORIZED' : 'NOT AUTHORIZED',
    legalName: carrier?.legalName ?? null,
    dotNumber: dotNumber,
    mcNumber: carrier?.mcNumber ? String(carrier.mcNumber) : null,
    safetyRating: carrier?.safetyRating ?? null,
    csaScore: null,
  };
}

/** Demo mode: answer from the demo company records instead of calling FMCSA. */
async function demoFmcsaResult(identifier: string): Promise<FmcsaResult> {
  const digits = identifier.replace(/\D/g, '');
  const { data } = digits
    ? await supabase
        .from('companies')
        .select('name, mc_number, dot_number')
        .or(`mc_number.ilike.%${digits}%,dot_number.ilike.%${digits}%`)
        .limit(1)
        .maybeSingle()
    : { data: null };
  return {
    status: 'AUTHORIZED',
    legalName: data?.name ?? 'Demo Carrier LLC',
    dotNumber: data?.dot_number ?? identifier,
    mcNumber: data?.mc_number ?? identifier,
    safetyRating: 'Satisfactory',
    csaScore: 12,
  };
}

// Stub when FMCSA key isn't configured yet
function mockFmcsaResult(identifier: string): FmcsaResult {
  return {
    status: 'AUTHORIZED',
    legalName: 'PLACEHOLDER — FMCSA API key not configured',
    dotNumber: identifier,
    mcNumber: null,
    safetyRating: 'Satisfactory',
    csaScore: null,
  };
}
