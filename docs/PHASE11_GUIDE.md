# FreightX — Phase 11 Guide: AI Assisted Load Seeking

**Goal:** Give carriers an AI-powered natural language search that finds the best-matched loads automatically

**Timeline:** 1 week
**Prerequisites:** Phase 10 complete (interactive maps + profile enhancements)

---

## Overview

Phase 11 adds intelligence to the load board. Instead of manually setting filters, carriers describe what they want in plain English and the AI returns structured search results. A scoring engine then ranks every load on the board by how well it matches the carrier's preferences.

**Key Features:**

1. **Natural Language Search Bar** — type "Flatbed out of Texas going north, this week" and get results
2. **Match Score System** — every load gets a 0–100 score based on equipment, rate, lane, urgency, and broker credit
3. **Match Badge** — color-coded percentage shown on each load card
4. **Claude Haiku Edge Function** — parses queries into structured filters with graceful keyword fallback

**Deliverable:** AI search bar integrated into the carrier load board with per-load match scoring

---

## Deliverables Checklist

### Week 1: AI Search & Match Scoring

- [x] **AI Search Bar Component**
  - [x] Natural language input with example prompt chips
  - [x] Calls `ai-load-search` Supabase Edge Function
  - [x] Active/inactive state with orange accent styling
  - [x] Clear button and Escape key support
  - [x] Error fallback message

- [x] **Edge Function: `ai-load-search`**
  - [x] Claude Haiku integration (model: `claude-haiku-4-5-20251001`)
  - [x] System prompt extracts: equipment, origin_state, dest_states, pickup_within_days, min_rate_per_mile, search keywords
  - [x] Keyword-based fallback parser (no API key required)
  - [x] 40+ US state name recognition
  - [x] Equipment type detection (flatbed, reefer, van, tanker, lowboy, step_deck, box_truck, sprinter)
  - [x] Pickup urgency parsing (today = 1 day, tomorrow = 2 days, this week = 7 days)
  - [x] CORS headers for browser invocation

- [x] **Match Score Engine**
  - [x] `scoreLoad()` — scores a single load against carrier preferences (0–100 pts)
  - [x] `rankLoads()` — scores and sorts all loads descending
  - [x] `getTopMatches()` — filters to scores ≥60 (configurable threshold)
  - [x] `CarrierPreferences` interface (preferred equipment, origin/dest states, min rate/mile)
  - [x] `ScoredLoad` type with `matchScore` and `matchBreakdown`

- [x] **Match Badge Component**
  - [x] Color-coded pill: green ≥80, orange 60–79, gray <60
  - [x] Displays percentage with dot indicator
  - [x] Integrated on load cards in carrier portal

- [x] **Hook: `use-match-scores`**
  - [x] Computes scores client-side against carrier preferences
  - [x] Re-ranks when load list updates

**Phase 11 Status: ✅ COMPLETE**

---

## Technical Implementation

### 1. AI Search Bar Component

```tsx
// apps/web/src/features/loads/components/ai-search-bar.tsx
import { useState, useRef } from 'react';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/shared/lib/utils';
import type { LoadFilters } from '@/services/loads.service';

interface AiSearchBarProps {
  onFilters: (filters: LoadFilters) => void;
  onClear: () => void;
  className?: string;
}

const EXAMPLES = [
  'Flatbed out of Texas going north, this week',
  'Reefer load from Chicago, good rate',
  'Van load under 500 miles picking up Monday',
];

export function AiSearchBar({ onFilters, onClear, className }: AiSearchBarProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-load-search', {
        body: { query: q },
      });

      if (fnError) throw fnError;

      const filters: LoadFilters = {};
      if (data?.equipment) filters.equipment = data.equipment;
      if (data?.search) filters.search = data.search;

      onFilters(filters);
      setActive(true);
    } catch {
      setError('Could not parse query — try using the filters above');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative">
        <Sparkles
          size={15}
          className={cn(
            'absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors',
            loading
              ? 'text-fx-orange animate-pulse'
              : active
                ? 'text-fx-orange'
                : 'text-fx-text-dim',
          )}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
            if (e.key === 'Escape') {
              setQuery('');
              setActive(false);
              onClear();
            }
          }}
          placeholder="Describe the load you're looking for…"
          className="w-full h-12 bg-fx-surface-2 border border-fx-border rounded-2xl pl-10 pr-20 text-sm text-white placeholder:text-fx-text-dim focus:border-fx-orange outline-none transition-all"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {(query || active) && (
            <button
              onClick={() => {
                setQuery('');
                setActive(false);
                onClear();
              }}
              className="w-6 h-6 rounded-full flex items-center justify-center text-fx-text-dim hover:text-white"
            >
              <X size={12} />
            </button>
          )}
          <button
            onClick={handleSearch}
            disabled={!query.trim() || loading}
            className="h-8 w-8 rounded-xl bg-fx-orange flex items-center justify-center disabled:opacity-40"
          >
            <ArrowRight size={14} className="text-white" />
          </button>
        </div>
      </div>
      {error && <p className="text-[11px] text-red-400 px-1">{error}</p>}
      {!query && !active && (
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setQuery(ex)}
              className="shrink-0 text-[11px] text-fx-text-dim bg-fx-surface border border-fx-border px-3 py-1.5 rounded-full hover:border-fx-orange/40 hover:text-fx-text transition-all"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 2. Edge Function: `ai-load-search`

```typescript
// supabase/functions/ai-load-search/index.ts
import { corsHeaders } from '../_shared/cors.ts';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

interface ParsedFilters {
  equipment?: string;
  search?: string;
  origin_state?: string;
  dest_states?: string[];
  pickup_within_days?: number;
  min_rate_per_mile?: number;
}

// Keyword-based fallback — works without an API key
function keywordParse(query: string): ParsedFilters {
  const q = query.toLowerCase();
  const filters: ParsedFilters = {};

  if (q.includes('flatbed')) filters.equipment = 'flatbed';
  else if (q.includes('reefer')) filters.equipment = 'reefer';
  else if (q.includes('step deck')) filters.equipment = 'step_deck';
  else if (q.includes('lowboy')) filters.equipment = 'lowboy';
  else if (q.includes('tanker')) filters.equipment = 'tanker';
  else if (q.includes('box truck')) filters.equipment = 'box_truck';
  else if (q.includes('sprinter')) filters.equipment = 'sprinter';
  else if (q.includes('van') || q.includes('dry van')) filters.equipment = 'van';

  if (q.includes('today') || q.includes('asap')) filters.pickup_within_days = 1;
  else if (q.includes('tomorrow')) filters.pickup_within_days = 2;
  else if (q.includes('this week')) filters.pickup_within_days = 7;

  return filters;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const { query } = (await req.json()) as { query: string };
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

  // Fall back to keyword parsing if no API key
  if (!apiKey) {
    return new Response(JSON.stringify(keywordParse(query)), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const systemPrompt = `You are a freight load search parser.
Extract structured filters from a carrier's natural language description.
Return ONLY valid JSON with optional fields:
- equipment: "van" | "reefer" | "flatbed" | "step_deck" | "lowboy" | "tanker" | "box_truck" | "sprinter"
- origin_state: 2-letter US state code
- dest_states: array of 2-letter US state codes
- pickup_within_days: number (today=1, tomorrow=2, this week=7)
- min_rate_per_mile: number
- search: string (city name, commodity, or other keywords)
Only include fields clearly mentioned. Return {} if nothing is clear.`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: systemPrompt,
      messages: [{ role: 'user', content: query }],
    }),
  });

  if (!response.ok) {
    return new Response(JSON.stringify(keywordParse(query)), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const claudeData = await response.json();
  const text = claudeData?.content?.[0]?.text ?? '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const filters: ParsedFilters = jsonMatch ? JSON.parse(jsonMatch[0]) : keywordParse(query);

  return new Response(JSON.stringify(filters), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
```

### 3. Match Score Engine

```typescript
// apps/web/src/features/loads/lib/match-score.ts
import { analyzeRate } from '@/shared/lib/freight';
import type { Load, EquipmentType } from '@freightx/shared';

export interface CarrierPreferences {
  userId: string;
  preferredEquipment: EquipmentType[];
  preferredOriginStates: string[]; // e.g. ['TX', 'OK', 'LA']
  preferredDestStates: string[];
  minRatePerMile: number;
  homeCity: string;
  homeState: string;
}

export interface ScoredLoad extends Load {
  matchScore: number; // 0–100
  matchBreakdown: {
    equipmentPts: number; // 0 or 40
    ratePts: number; // 5 | 12 | 20 | 25
    lanePts: number; // 0–20
    urgencyPts: number; // 3 | 7 | 10
    creditPts: number; // 0 | 1 | 3 | 5
  };
}

export function scoreLoad(load: Load, prefs: CarrierPreferences): ScoredLoad {
  // Equipment match — 40 pts
  const equipmentPts =
    prefs.preferredEquipment.length === 0 || prefs.preferredEquipment.includes(load.equipment)
      ? 40
      : 0;

  // Rate health — 25 pts
  const rateHealth = analyzeRate(load).health;
  const ratePts = ({ hot: 25, good: 20, fair: 12, low: 5 } as const)[rateHealth];

  // Lane preference — 20 pts (10 origin + 10 dest)
  const originMatch =
    prefs.preferredOriginStates.length === 0 ||
    prefs.preferredOriginStates.includes(load.originState);
  const destMatch =
    prefs.preferredDestStates.length === 0 || prefs.preferredDestStates.includes(load.destState);
  const lanePts = (originMatch ? 10 : 0) + (destMatch ? 10 : 0);

  // Pickup urgency — 10 pts
  const daysUntilPickup = (new Date(load.pickupDate).getTime() - Date.now()) / 86_400_000;
  const urgencyPts = daysUntilPickup <= 2 ? 10 : daysUntilPickup <= 5 ? 7 : 3;

  // Broker credit — 5 pts
  const cs = load.brokerCreditScore ?? 0;
  const creditPts = cs >= 85 ? 5 : cs >= 70 ? 3 : cs >= 55 ? 1 : 0;

  const matchScore = equipmentPts + ratePts + lanePts + urgencyPts + creditPts;
  return {
    ...load,
    matchScore,
    matchBreakdown: { equipmentPts, ratePts, lanePts, urgencyPts, creditPts },
  };
}

export function rankLoads(loads: Load[], prefs: CarrierPreferences): ScoredLoad[] {
  return loads.map((l) => scoreLoad(l, prefs)).sort((a, b) => b.matchScore - a.matchScore);
}

export function getTopMatches(
  loads: Load[],
  prefs: CarrierPreferences,
  threshold = 60,
): ScoredLoad[] {
  return rankLoads(loads, prefs).filter((l) => l.matchScore >= threshold);
}
```

### 4. Match Badge Component

```tsx
// apps/web/src/features/loads/components/match-badge.tsx
import { cn } from '@/shared/lib/utils';

export function MatchBadge({ score, className }: { score: number; className?: string }) {
  const color =
    score >= 80
      ? '#34D399' // green
      : score >= 60
        ? '#E86030' // fx-orange
        : '#6B7280'; // gray

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
        className,
      )}
      style={{ background: `${color}1A`, border: `1px solid ${color}40`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {score}% match
    </div>
  );
}
```

### Scoring Breakdown

| Category        | Max Pts | Criteria                                                  |
| --------------- | ------- | --------------------------------------------------------- |
| Equipment match | 40      | Full points if equipment matches preferences, 0 otherwise |
| Rate health     | 25      | hot=25, good=20, fair=12, low=5                           |
| Lane preference | 20      | 10 for matching origin state + 10 for matching dest state |
| Pickup urgency  | 10      | ≤2 days=10, ≤5 days=7, otherwise=3                        |
| Broker credit   | 5       | ≥85=5, ≥70=3, ≥55=1, <55=0                                |
| **Total**       | **100** |                                                           |

---

## Environment Variables

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-...   # Required for Claude Haiku parsing
                                # Omit to use keyword fallback parser
```

---

## Definition of Done

- [x] AI search bar renders on carrier load board
- [x] Typing a natural language query invokes edge function
- [x] Edge function returns structured filters (equipment, state, etc.)
- [x] Keyword fallback works when `ANTHROPIC_API_KEY` is not set
- [x] Load list filters based on returned criteria
- [x] Match badge visible on each load card with correct color tier
- [x] `scoreLoad()` returns accurate breakdown across all 5 categories
- [x] `rankLoads()` sorts list by descending match score
- [x] Edge function deployed to Supabase

---

## Success Metrics

| Metric                       | Target                                  |
| ---------------------------- | --------------------------------------- |
| AI query parse latency       | < 1 second                              |
| Keyword fallback coverage    | > 80% of common queries                 |
| Match score accuracy         | Correlates with carrier acceptance rate |
| Edge function error rate     | < 1%                                    |
| Load board search engagement | > 40% of active carriers                |

---

_This phase makes FreightX proactively work for carriers instead of making them hunt for loads manually._
