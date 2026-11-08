import { describe, expect, it } from 'vitest';
import { payoutMultiple, soldFraction } from './payout.ts';

// Annuity math of ADR 0009 (story 016); the AC oracles are checked in e2e.
const DEPOT = 1e8;
const RATES = [-0.109, -1e-8, 0.045, 0.194];
const MONTHS = [180, 240];

describe('payoutMultiple', () => {
  it('AC7: is exactly 1 at a net rate of 0 (no 0/0)', () => {
    expect(payoutMultiple(0, 240)).toBe(1);
  });

  it('AC7: equal payouts of D · M / n empty the depot at the end, never before', () => {
    const problems: string[] = [];
    for (const q of RATES) {
      for (const n of MONTHS) {
        const multiple = payoutMultiple(q, n);
        const growth = (1 + q) ** (1 / 12);
        const payout = (DEPOT * multiple) / n;
        let balance = DEPOT;
        let lowest = balance;
        for (let k = 1; k <= n; k++) {
          balance = balance * growth - payout;
          // The last payout leaves only float noise around 0; the end check bounds it.
          if (k < n) lowest = Math.min(lowest, balance);
        }
        const key = `${String(q)}/${String(n)}`;
        if (!Number.isFinite(multiple) || multiple <= 0)
          problems.push(`${key}: M ${String(multiple)}`);
        if (lowest < -1e-6) problems.push(`${key}: balance ${String(lowest)}`);
        if (Math.abs(balance) > 1e-6 * DEPOT) problems.push(`${key}: rest ${String(balance)}`);
      }
    }
    expect(problems).toEqual([]);
  });
});

describe('soldFraction', () => {
  it('AC7: sells everything with the last payout and its shares add up to D · M', () => {
    const problems: string[] = [];
    for (const q of [0, ...RATES]) {
      expect(soldFraction(q, 1)).toBe(1);
      for (const n of MONTHS) {
        const growth = (1 + q) ** (1 / 12);
        let balance = DEPOT;
        let paid = 0;
        for (let remaining = n; remaining >= 1; remaining--) {
          balance *= growth;
          const payout = balance * soldFraction(q, remaining);
          paid += payout;
          balance -= payout;
        }
        const expected = DEPOT * payoutMultiple(q, n);
        if (Math.abs(paid - expected) > 1e-6 * DEPOT) {
          problems.push(`${String(q)}/${String(n)}: ${String(paid)} vs ${String(expected)}`);
        }
      }
    }
    expect(problems).toEqual([]);
  });
});
