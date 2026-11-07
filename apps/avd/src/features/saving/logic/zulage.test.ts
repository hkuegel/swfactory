import { describe, expect, it } from 'vitest';
import { zulage } from './zulage.ts';

describe('zulage', () => {
  it('AC2: second band of the Grundzulage (c = 1.000,08 EUR → 340,02 EUR)', () => {
    expect(zulage(100_008, 0, 40)).toEqual({
      grundCents: 34_002,
      kinderCents: 0,
      perYearCents: 34_002,
      bonusCents: 0,
    });
  });

  it('AC2: just above the band edge the Grundzulage stays at 540 EUR', () => {
    expect(zulage(180_012, 0, 40).grundCents).toBe(54_000);
  });

  it('AC3: Kinderzulage is capped at 300 EUR per child and follows c below the cap', () => {
    expect(zulage(684_000, 10, 40).kinderCents).toBe(300_000);
    expect(zulage(29_988, 1, 40).kinderCents).toBe(29_988);
  });

  it('AC3: the bonus applies at age 18 with c = 120 EUR', () => {
    expect(zulage(12_000, 0, 18)).toEqual({
      grundCents: 6_000,
      kinderCents: 0,
      perYearCents: 6_000,
      bonusCents: 20_000,
    });
  });

  it('every allowed monthly contribution gives whole cents in every part', () => {
    const notWhole: number[] = [];
    for (let monthlyCents = 0; monthlyCents <= 57_000; monthlyCents++) {
      const z = zulage(12 * monthlyCents, 3, 20);
      if (
        !Number.isInteger(z.grundCents) ||
        !Number.isInteger(z.kinderCents) ||
        !Number.isInteger(z.perYearCents) ||
        !Number.isInteger(z.bonusCents)
      ) {
        notWhole.push(monthlyCents);
      }
    }
    expect(notWhole).toEqual([]);
  });
});
