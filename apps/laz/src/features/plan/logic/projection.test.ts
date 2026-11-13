import { describe, expect, it } from 'vitest';
import type { Fund } from './fund.ts';
import { formatEuroMicroEur } from './format.ts';
import { payoutFactor, payoutPerShareMicroEur, type Tax } from './projection.ts';

/** The hand cases use explicit inputs, so no calendar arithmetic is needed (test set). */
const AS_OF = '2026-12-31';

function fund(overrides: Partial<Fund>): Fund {
  return {
    year: 2030,
    isin: 'DE000HAND0',
    name: 'hand case',
    navMicroEur: 40000000,
    ytmBp: 0,
    avgMaturityHundredths: 360,
    sharesOutstanding: 1000000,
    ...overrides,
  };
}

const TAX_OFF: Tax = { on: false, rateBp: 0 };

describe('projection (ADR 0012, micro-euro unit of story 025)', () => {
  it('AC1: YTM 0 % and asOf at the liquidation date give exactly the NAV, and YTM 0 % / 2 % / 4 % never decrease', () => {
    const base = fund({});
    expect(payoutPerShareMicroEur(base, TAX_OFF, AS_OF)).toBe(40000000);
    expect(payoutPerShareMicroEur(fund({ ytmBp: 200 }), TAX_OFF, AS_OF)).toBeCloseTo(
      43299635.50488912,
      4,
    );
    expect(payoutPerShareMicroEur(fund({ ytmBp: 400 }), TAX_OFF, AS_OF)).toBeCloseTo(
      46799370.909834445,
      4,
    );
    // The shown figures are the single rounding of those unrounded values.
    expect(formatEuroMicroEur(payoutPerShareMicroEur(base, TAX_OFF, AS_OF))).toBe('40,00\u00a0€');
    expect(formatEuroMicroEur(payoutPerShareMicroEur(fund({ ytmBp: 200 }), TAX_OFF, AS_OF))).toBe(
      '43,30\u00a0€',
    );
    expect(formatEuroMicroEur(payoutPerShareMicroEur(fund({ ytmBp: 400 }), TAX_OFF, AS_OF))).toBe(
      '46,80\u00a0€',
    );
    // asOf equals the liquidation date: d = 0.
    expect(payoutPerShareMicroEur(base, TAX_OFF, '2030-12-31')).toBe(40000000);
    const preTax = [0, 200, 400].map((ytmBp) =>
      payoutPerShareMicroEur(fund({ ytmBp }), TAX_OFF, AS_OF),
    );
    expect(preTax[0]).toBeLessThan(preTax[1] ?? 0);
    expect(preTax[1]).toBeLessThan(preTax[2] ?? 0);
  });

  it('AC4: tax on the gain only, base max(0, gain), measured at r = 0 %, 100 % and 25 %', () => {
    // Hand case: d = 365, NAV 10,00 EUR, YTM 40,00 % → pre-tax 14,00 EUR, gain 4,00 EUR.
    const hand = fund({ year: 2027, navMicroEur: 10000000, ytmBp: 4000 });
    expect(payoutPerShareMicroEur(hand, TAX_OFF, AS_OF)).toBe(14000000);
    expect(payoutPerShareMicroEur(hand, { on: true, rateBp: 0 }, AS_OF)).toBe(14000000);
    expect(payoutPerShareMicroEur(hand, { on: true, rateBp: 10000 }, AS_OF)).toBe(10000000);
    // 13,00 € comes from 12999999.999999998 micro, which is not exactly representable, so the
    // assertion is the shown figure (ADR 0012).
    expect(payoutPerShareMicroEur(hand, { on: true, rateBp: 2500 }, AS_OF)).toBeCloseTo(
      13000000,
      4,
    );
    expect(
      formatEuroMicroEur(payoutPerShareMicroEur(hand, { on: true, rateBp: 2500 }, AS_OF)),
    ).toBe('13,00\u00a0€');
    // Turning tax off again gives the same numbers as before.
    expect(payoutPerShareMicroEur(hand, TAX_OFF, AS_OF)).toBe(14000000);

    // The fixture row 2030, tax on at 25 %: 45,9564 € → the shown 45,96 €.
    const row = fund({ navMicroEur: 42000000, ytmBp: 300 });
    expect(payoutPerShareMicroEur(row, { on: true, rateBp: 2500 }, AS_OF)).toBeCloseTo(
      45956398.76498182,
      4,
    );
    expect(formatEuroMicroEur(payoutPerShareMicroEur(row, { on: true, rateBp: 2500 }, AS_OF))).toBe(
      '45,96\u00a0€',
    );

    // Negative gain through an override: the gain stays untaxed, so tax on at 25 % gives the same
    // figure as tax off, `pre-tax − r × max(0, gain)` = pre-tax (finding 7).
    const negative = fund({ year: 2029, ytmBp: -300 });
    expect(payoutFactor(negative, { on: true, rateBp: 2500 }, AS_OF)).toBe(
      payoutFactor(negative, TAX_OFF, AS_OF),
    );
    expect(payoutPerShareMicroEur(negative, { on: true, rateBp: 2500 }, AS_OF)).toBe(
      payoutPerShareMicroEur(negative, TAX_OFF, AS_OF),
    );
    expect(
      formatEuroMicroEur(payoutPerShareMicroEur(negative, { on: true, rateBp: 2500 }, AS_OF)),
    ).toBe('36,50\u00a0€');
  });
});
