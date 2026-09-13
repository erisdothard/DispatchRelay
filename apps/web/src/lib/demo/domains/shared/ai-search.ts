/**
 * Demo `ai-load-search` edge function. Turns a natural-language request ("reefer loads out
 * of Nashville over $2.50/mi tomorrow") into structured load-board filters, and answers
 * `action: 'suggest_rate'` from the lane rate history.
 */
import { daysFromNow } from '../../time';
import type { DemoHandler, Row } from '../../types';
import { CITIES, STATE_CODES, STATE_NAMES, type City } from './geo';
import { suggestRate } from './lanes';

const EQUIPMENT_PATTERNS: ReadonlyArray<[RegExp, string]> = [
  [/\b(reefers?|refrigerated|temp(?:erature)?[- ]controlled|cold chain)\b/, 'reefer'],
  [/\b(step ?decks?|drop ?decks?)\b/, 'step_deck'],
  [/\b(flat ?beds?|flats?)\b/, 'flatbed'],
  [/\b(lowboys?|rgn)\b/, 'lowboy'],
  [/\b(tankers?)\b/, 'tanker'],
  [/\b(box trucks?|straight trucks?)\b/, 'box_truck'],
  [/\b(sprinters?|cargo vans?)\b/, 'sprinter'],
  [/\b(dry ?vans?|vans?|dry freight|dry)\b/, 'van'],
];

const EQUIPMENT_LABELS: Record<string, string> = {
  van: 'Dry van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  step_deck: 'Step deck',
  lowboy: 'Lowboy',
  tanker: 'Tanker',
  box_truck: 'Box truck',
  sprinter: 'Sprinter',
};

const ORIGIN_CUE =
  /(?:\bfrom|\bout of|\bleaving|\bdeparting|\bshipping from|\borigin(?:ating)?(?: in)?|\bpick(?:ing)?[ -]?ups?(?: \w+)? (?:in|at)|\bin|\bnear|\baround)\s+$/;
const DEST_CUE =
  /(?:\bto|\binto|\bgoing to|\bhead(?:ing|ed)? to|\bdeliver(?:ing|y|ed)? (?:to|in|at)|\bdestined for|\bbound for|\btowards?|\bdrop(?:ping)?(?: off)? (?:in|at))\s+$/;

const STOPWORDS = new Set([
  'loads',
  'load',
  'freight',
  'find',
  'show',
  'need',
  'want',
  'looking',
  'with',
  'that',
  'this',
  'week',
  'today',
  'tomorrow',
  'from',
  'going',
  'heading',
  'into',
  'over',
  'under',
  'pickup',
  'picking',
  'deliver',
  'delivering',
  'paying',
  'rate',
  'rates',
  'mile',
  'miles',
  'anything',
]);

type Role = 'origin' | 'dest';

interface Place {
  index: number;
  end: number;
  state: string;
  city: City | null;
  role: Role | null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function overlaps(places: readonly Place[], index: number, end: number): boolean {
  return places.some((p) => index < p.end && end > p.index);
}

function findPlaces(original: string): Place[] {
  const q = original.toLowerCase();
  const places: Place[] = [];
  const push = (index: number, length: number, state: string, city: City | null) => {
    if (!overlaps(places, index, index + length)) {
      places.push({ index, end: index + length, state, city, role: null });
    }
  };

  // Cities first (longest names win, so "Kansas City" beats the state "Kansas").
  [...CITIES]
    .sort((a, b) => b.name.length - a.name.length)
    .forEach((city) => {
      const m = new RegExp(`\\b${escapeRegExp(city.name.toLowerCase())}\\b`).exec(q);
      if (m) push(m.index, m[0].length, city.state, city);
    });

  Object.entries(STATE_NAMES)
    .sort(([a], [b]) => b.length - a.length)
    .forEach(([name, code]) => {
      const m = new RegExp(`\\b${escapeRegExp(name)}\\b`).exec(q);
      if (m) push(m.index, m[0].length, code, null);
    });

  // Uppercase abbreviations anywhere ("TX", "IL"); lowercase only right after from/to.
  for (const m of original.matchAll(/\b([A-Z]{2})\b/g)) {
    if (STATE_CODES.has(m[1]) && m.index !== undefined) push(m.index, 2, m[1], null);
  }
  for (const m of q.matchAll(/\b(?:from|to|out of|into)\s+([a-z]{2})\b/g)) {
    const code = m[1].toUpperCase();
    if (STATE_CODES.has(code) && m.index !== undefined) {
      push(m.index + m[0].length - 2, 2, code, null);
    }
  }

  const sorted = places.sort((a, b) => a.index - b.index);
  const withCues = sorted.map((p) => {
    const before = q.slice(0, p.index);
    const role: Role | null = DEST_CUE.test(before)
      ? 'dest'
      : ORIGIN_CUE.test(before)
        ? 'origin'
        : null;
    return { ...p, role };
  });
  // Uncued places fill whichever end of the lane is still open, in reading order.
  return withCues.map((p, i) => {
    if (p.role) return p;
    const earlier = withCues.slice(0, i);
    const later = withCues.slice(i + 1);
    const hasOrigin =
      earlier.some((x) => x.role === 'origin') || later.some((x) => x.role === 'origin');
    return { ...p, role: hasOrigin ? 'dest' : 'origin' };
  });
}

function parseRatePerMile(q: string): number | null {
  const m = /\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:\/\s*mi(?:le)?\b|per\s+mile|a\s+mile|rpm\b|cpm\b)/.exec(
    q,
  );
  if (!m) return null;
  const value = Number(m[1]);
  return value > 0 && value <= 10 ? value : null;
}

function parseMaxWeight(q: string): number | null {
  const m =
    /(?:under|below|less than|max(?:imum)?|up to|<)\s*(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?\s*k)\s*(?:lbs?|pounds)?/.exec(
      q,
    );
  if (!m) return null;
  const raw = m[1].replace(/,/g, '').trim();
  return raw.endsWith('k') ? Math.round(parseFloat(raw) * 1000) : Number(raw);
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

interface DateWindow {
  from: string;
  to: string;
  label: string;
}

function parsePickupWindow(q: string): DateWindow | null {
  const dow = new Date().getDay();
  const span = (from: number, to: number, label: string): DateWindow => ({
    from: daysFromNow(from),
    to: daysFromNow(to),
    label,
  });
  if (/\b(today|tonight|asap|same[- ]day)\b/.test(q)) return span(0, 0, 'today');
  if (/\btomorrow\b/.test(q)) return span(1, 1, 'tomorrow');
  if (/\bthis weekend\b/.test(q)) {
    const toSat = (6 - dow + 7) % 7;
    return span(toSat, toSat + 1, 'this weekend');
  }
  if (/\bnext week\b/.test(q)) {
    const toMon = (8 - dow) % 7 || 7;
    return span(toMon, toMon + 6, 'next week');
  }
  if (/\bthis week\b/.test(q)) return span(0, (7 - dow) % 7, 'this week');
  const within = /\b(?:next|within)\s+(\d{1,2})\s+days?\b/.exec(q);
  if (within) return span(0, Number(within[1]), `within ${within[1]} days`);
  const day =
    /\b(by |on |this |next )?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/.exec(q);
  if (day) {
    const offset = (WEEKDAYS.indexOf(day[2]) - dow + 7) % 7 || 7;
    const name = day[2][0].toUpperCase() + day[2].slice(1);
    return day[1] === 'by ' ? span(0, offset, `by ${name}`) : span(offset, offset, name);
  }
  return null;
}

function commodityKeyword(q: string, loads: readonly Row[]): string | null {
  const words = q.match(/[a-z]{4,}/g) ?? [];
  const commodities = loads.map((l) => String(l.commodity ?? '').toLowerCase());
  return words.find((w) => !STOPWORDS.has(w) && commodities.some((c) => c.includes(w))) ?? null;
}

function placeLabel(place: Place | undefined): string {
  if (!place) return 'Anywhere';
  return place.city ? `${place.city.name}, ${place.state}` : place.state;
}

export function parseLoadQuery(query: string, loads: readonly Row[]): Row {
  const q = query.toLowerCase();
  const equipment = EQUIPMENT_PATTERNS.find(([re]) => re.test(q))?.[1] ?? null;
  const places = findPlaces(query);
  const origin = places.find((p) => p.role === 'origin');
  const dests = places.filter((p) => p.role === 'dest');
  const dest = dests[0];
  const minRate = parseRatePerMile(q);
  const window = parsePickupWindow(q);
  const maxWeight = parseMaxWeight(q);
  const keyword = !equipment && places.length === 0 ? commodityKeyword(q, loads) : null;

  const summary = [
    equipment ? EQUIPMENT_LABELS[equipment] : null,
    origin || dest ? `${placeLabel(origin)} → ${placeLabel(dest)}` : null,
    minRate ? `≥ $${minRate.toFixed(2)}/mi` : null,
    keyword ? `“${keyword}”` : null,
  ].filter(Boolean);

  return {
    equipment,
    origin_state: origin?.state ?? null,
    origin_city: origin?.city?.name ?? null,
    dest_states: [...new Set(dests.map((p) => p.state))],
    dest_city: dest?.city?.name ?? null,
    min_rate_per_mile: minRate,
    pickup_date_from: window?.from ?? null,
    pickup_date_to: window?.to ?? null,
    pickup_window: window?.label ?? null,
    max_weight_lbs: maxWeight,
    keyword,
    summary: summary.length > 0 ? summary.join(' · ') : null,
  };
}

export const aiLoadSearch: DemoHandler = (args, { db }) => {
  if (args.action === 'suggest_rate') return suggestRate(args, db);
  const query = String(args.query ?? '').trim();
  if (!query) throw new Error('Describe the load you are looking for.');
  return parseLoadQuery(query, db.read('loads'));
};
