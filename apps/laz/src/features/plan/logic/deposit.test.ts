import { describe, expect, it } from 'vitest';
import {
  DEPOSIT_OFF,
  parkInterestMicroEur,
  parkNetMicroEur,
  parkTaxMicroEur,
  parkTerm,
  type DepositOption,
} from './deposit.ts';
import { FUND_LIST, type Fund } from './fund.ts';
import { formatEuroMicroEur, formatShares } from './format.ts';
import { payoutPerShareMicroEur, type Tax } from './projection.ts';
import { taxFromState } from './tax.ts';

/**
 * Story 046 AC2 and AC3: the oracles are written here from the story's own arithmetic (P16), never read back
 * from `deposit.ts`. `P` is the MONTHLY target in micro-euro, because the AC's formula is
 * `P × rate × m(m+1)/24` (risk 7): `100,00 €` = 10.000 Cent = 100.000.000 µ€. The rate `2,50 %` is 250
 * hundredths. Only the exported callers are read: the month sum is internal, so a fix shows up here (CLAUDE.md,
 * story 026 R3).
 */
const P = 100_000_000;
const ON: DepositOption = { on: true, hundredths: 250 };
const RATE_ZERO: DepositOption = { on: true, hundredths: 0 };
/** AC1's off state in the shape the UI can be in: the switch off while a rate is typed. With `DEPOSIT_OFF`
 * the rate is 0 as well, so the option guard cannot be moved there; this is the off half that is falsifiable,
 * and the e2e test reads the same state on the figure it shows. */
const OFF_RATE: DepositOption = { on: false, hundredths: 250 };
const TAX_26375: Tax = { on: true, rateMillionths: 263750 };
const TAX_OFF: Tax = { on: false, rateMillionths: 0 };
/** The fixture copy's asOf, the date the projection reads (ADR 0013). */
const AS_OF = '2026-12-31';

describe('deposit (story 046, AC2: the month sum of one phase year)', () => {
  it('AC2: the interest of a phase year, read through its exported callers', () => {
    // Hand, full phase year: 6,5 × 100,00 € × 2,50 % = 16,25 € = 16.250.000 µ€. The term reads the same
    // expression (risk 4), so its hand value is the rate times the year units: 0,025 × 6,5 = 0,1625.
    expect(parkInterestMicroEur(P, ON, 12)).toBe(16_250_000);
    expect(parkTerm(12, ON, TAX_OFF)).toBe(0.1625);
    // Hand, three phase months: 0,5 × 100,00 € × 2,50 % = 1,25 € = 1.250.000 µ€; term 0,025 × 0,5.
    expect(parkInterestMicroEur(P, ON, 3)).toBe(1_250_000);
    expect(parkTerm(3, ON, TAX_OFF)).toBe(0.0125);
    // Hand, one phase month: 100 × 0,025 × 2/24 = 0,2083333 €, which is not a whole cent - the case that
    // shows why the interest cannot be stored in Cent. The shown figure is its single rounding.
    const oneMonth = parkInterestMicroEur(P, ON, 1);
    expect(oneMonth).toBeCloseTo(208_333.333333, 6);
    expect(Number.isInteger(oneMonth / 10_000)).toBe(false);
    expect(formatEuroMicroEur(oneMonth)).toBe('0,21\u00a0€');
    // AC2: no interest is invented for a phase year without phase months.
    expect(parkInterestMicroEur(P, ON, 0)).toBe(0);
    expect(parkTerm(0, ON, TAX_OFF)).toBe(0);
    // AC2: the interest is never negative (the account cannot go below zero).
    expect(parkInterestMicroEur(-P, ON, 12)).toBe(0);
    // AC1's control: with the option off nothing is calculated anywhere, so both hand paths above are 0.
    expect(parkInterestMicroEur(P, DEPOSIT_OFF, 12)).toBe(0);
    expect(parkTerm(12, DEPOSIT_OFF, TAX_26375)).toBe(0);
    // The same half in the shape the UI can be in, switch off with a rate typed: this is the off path that a
    // mutation of the option guard can move, because `DEPOSIT_OFF` has the rate 0 too.
    expect(parkInterestMicroEur(P, OFF_RATE, 12)).toBe(0);
    expect(parkTerm(12, OFF_RATE, TAX_26375)).toBe(0);
    expect(parkNetMicroEur(P, OFF_RATE, 12, TAX_26375)).toBe(0);
    // AC1 names the rate 0 as the same state as off; read as the pair of the two paths above.
    expect(parkInterestMicroEur(P, RATE_ZERO, 12)).toBe(0);
    expect(parkTerm(12, RATE_ZERO, TAX_26375)).toBe(0);
  });

  it('AC3: the tax on the interest, the net that reduces the money, and the fund value untouched', () => {
    // Hand, the corrected values of the story: 16,25 € × 26,375 % = 4,2859375 €.
    expect(parkTaxMicroEur(16_250_000, TAX_26375)).toBeCloseTo(4_285_937.5, 6);
    // Hand, the church case by § 32d (story 048 AC1): 25 % / 1,02 = 24,5098 %, Soli 1,3480 %, KiSt 1,9608 %,
    // together 27,8186 % -> 16,25 € × 27,8186 % = 4,520527 €. The rate is read through `taxFromState`.
    const church = taxFromState({ kstOn: true, kistOn: true, bundesland: 'bayern' });
    expect(church.rateMillionths).toBeCloseTo(278_186.27, 2);
    expect(parkTaxMicroEur(16_250_000, church)).toBeCloseTo(4_520_526.96, 1);
    // The one assertion the "tax not deducted" mutation can move: the net is interest minus tax at the
    // Zufluss (hak's Q4), and the net is what reduces the money the plan needs. Hand: 11,9640625 €.
    expect(parkNetMicroEur(P, ON, 12, TAX_26375)).toBeCloseTo(11_964_062.5, 6);
    // Outside the tax case the gross interest is what reduces it (AC3): the same call, tax off.
    expect(parkNetMicroEur(P, ON, 12, TAX_OFF)).toBe(16_250_000);
    // Story 045's rule stays: the parked money is not invested in a fund, so the fund's own value is not
    // reduced. Hand on the fixture copy: fund 2027, ρ′ = 1,0150000, no flat base -> 36.540.000 µ€. The call
    // takes no option, so it cannot read one. Hand pair computed here (P16): the money the year needs is
    // 1.183.750.000 µ€ (120.000 Cent less the gross interest, tax off) over that share -> 32,40 shares. If
    // the share had been reduced by the year's interest (36.540.000 − 16.250.000 = 20.290.000 µ€), the same
    // money would give 58,34, so this pins which of the two numbers the row divides by.
    const fund2027 = FUND_LIST.find((fund) => fund.year === 2027) as Fund;
    expect(payoutPerShareMicroEur(fund2027, TAX_OFF, 0, AS_OF)).toBe(36_540_000);
    expect(formatShares(1_183_750_000 / 36_540_000)).toBe('32,40');
    // The tax on the gain with the flat base 0, the shape the year row reads: hand 54.994.902,343078 µ€
    // for fund 2032, the fund behind the phase year 2033.
    const fund2032 = FUND_LIST.find((fund) => fund.year === 2032) as Fund;
    expect(payoutPerShareMicroEur(fund2032, TAX_26375, 0, AS_OF)).toBeCloseTo(54_994_902.343078, 6);
  });
});
