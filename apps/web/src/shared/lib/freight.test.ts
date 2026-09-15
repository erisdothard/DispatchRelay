import { describe, expect, it } from 'vitest';
import type { Load } from '@dispatchrelay/shared';
import { analyzeRate, getBrokerCreditLabel } from './freight';

// Van market rate is 2.82/mi, so these land in hot / good / fair / low respectively.
const vanLoadAt = (ratePerMile: number): Load =>
  ({ equipment: 'van', ratePerMile }) as unknown as Load;

describe('freight colour tiers', () => {
  it('gives every rate-health tier its own colour', () => {
    const tiers = [3.3, 3.0, 2.82, 2.0].map((rate) => analyzeRate(vanLoadAt(rate)));

    expect(tiers.map((t) => t.health)).toEqual(['hot', 'good', 'fair', 'low']);
    expect(new Set(tiers.map((t) => t.color)).size).toBe(tiers.length);
  });

  it('gives every broker credit tier its own colour', () => {
    const tiers = [90, 75, 60, 40].map((score) => getBrokerCreditLabel(score));

    expect(tiers.map((t) => t?.label)).toEqual(['Credit A+', 'Credit B', 'Credit C', 'Credit D']);
    expect(new Set(tiers.map((t) => t?.color)).size).toBe(tiers.length);
  });
});
