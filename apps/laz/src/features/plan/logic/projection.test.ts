import { describe, expect, it } from 'vitest';
import type { Fund } from './fund.ts';
import { formatEuro } from './format.ts';
import { payoutFactor, payoutPerShareCents, type Tax } from './projection.ts';

/** The hand cases use explicit inputs, so no calendar arithmetic is needed (test set). */
const AS_OF = '2026-12-31';

function fund(overrides: Partial<Fund>): Fund {
  return {
    year: 2030,
    isin: 'DE000HAND0',
    name: 'hand case',
    navCents: 4000,
    ytmBp: 0,
    avgMaturity: '2030-06-30',
    sharesOutstanding: 1000000,
    ...overrides,
  };
}

const TAX_OFF: Tax = { on: false, rateBp: 0 };

describe('projection (ADR 0012)', () => {
  it('AC1: YTM 0 % and asOf at the liquidation date give exactly the NAV, and YTM 0 % / 2 % / 4 % never decrease', () => {
    const base = fund({});
    expect(payoutPerShareCents(base, TAX_OFF, AS_OF)).toBe(4000);
    expect(payoutPerShareCents(fund({ ytmBp: 200 }), TAX_OFF, AS_OF)).toBeCloseTo(
      4329.963550488912,
      6,
    );
    expect(payoutPerShareCents(fund({ ytmBp: 400 }), TAX_OFF, AS_OF)).toBeCloseTo(
      4679.937090983444,
      6,
    );
    // The shown figures are the single rounding of those unrounded values.
    expect(formatEuro(payoutPerShareCents(base, TAX_OFF, AS_OF))).toBe('40,00\u00a0€');
    expect(formatEuro(payoutPerShareCents(fund({ ytmBp: 200 }), TAX_OFF, AS_OF))).toBe(
      '43,30\u00a0€',
    );
    expect(formatEuro(payoutPerShareCents(fund({ ytmBp: 400 }), TAX_OFF, AS_OF))).toBe(
      '46,80\u00a0€',
    );
    // asOf equals the liquidation date: d = 0.
    expect(payoutPerShareCents(base, TAX_OFF, '2030-12-31')).toBe(4000);
    const preTax = [0, 200, 400].map((ytmBp) =>
      payoutPerShareCents(fund({ ytmBp }), TAX_OFF, AS_OF),
    );
    expect(preTax[0]).toBeLessThan(preTax[1] ?? 0);
    expect(preTax[1]).toBeLessThan(preTax[2] ?? 0);
  });

  it('AC4: tax on the gain only, base max(0, gain), measured at r = 0 %, 100 % and 25 %', () => {
    // Hand case: d = 365, NAV 10,00 EUR, YTM 40,00 % → pre-tax 14,00 EUR, gain 4,00 EUR.
    const hand = fund({ year: 2027, navCents: 1000, ytmBp: 4000 });
    expect(payoutPerShareCents(hand, TAX_OFF, AS_OF)).toBe(1400);
    expect(payoutPerShareCents(hand, { on: true, rateBp: 0 }, AS_OF)).toBe(1400);
    expect(payoutPerShareCents(hand, { on: true, rateBp: 10000 }, AS_OF)).toBe(1000);
    // 1300 cents is not exactly representable, so the assertion is the shown figure (ADR 0012).
    expect(payoutPerShareCents(hand, { on: true, rateBp: 2500 }, AS_OF)).toBeCloseTo(1300, 6);
    expect(formatEuro(payoutPerShareCents(hand, { on: true, rateBp: 2500 }, AS_OF))).toBe(
      '13,00\u00a0€',
    );
    // Turning tax off again gives the same numbers as before.
    expect(payoutPerShareCents(hand, TAX_OFF, AS_OF)).toBe(1400);

    // The fixture row 2030, tax on at 25 %: 45,9564 → the shown 45,96 €.
    const row = fund({ navCents: 4200, ytmBp: 300 });
    expect(payoutPerShareCents(row, { on: true, rateBp: 2500 }, AS_OF)).toBeCloseTo(
      4595.639876498182,
      6,
    );
    expect(formatEuro(payoutPerShareCents(row, { on: true, rateBp: 2500 }, AS_OF))).toBe(
      '45,96\u00a0€',
    );

    // Negative gain through an override: the gain stays untaxed, so tax on at 25 % gives the same
    // figure as tax off, `pre-tax − r × max(0, gain)` = pre-tax (finding 7).
    const negative = fund({ year: 2029, ytmBp: -300 });
    expect(payoutFactor(negative, { on: true, rateBp: 2500 }, AS_OF)).toBe(
      payoutFactor(negative, TAX_OFF, AS_OF),
    );
    expect(payoutPerShareCents(negative, { on: true, rateBp: 2500 }, AS_OF)).toBe(
      payoutPerShareCents(negative, TAX_OFF, AS_OF),
    );
    expect(formatEuro(payoutPerShareCents(negative, { on: true, rateBp: 2500 }, AS_OF))).toBe(
      '36,50\u00a0€',
    );
  });
});
