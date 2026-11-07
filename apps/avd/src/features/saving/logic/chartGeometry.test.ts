import { describe, expect, it } from 'vitest';
import { chartGeometry, xAxisYears } from './chartGeometry.ts';
import { project } from './project.ts';

const INPUTS = {
  age: 40,
  payoutAge: 60,
  monthlyCents: 10_000,
  children: 1,
  returnBp: 500,
  costsBp: 50,
  taxRateBp: 3000,
};

describe('chartGeometry', () => {
  it('AC5: the segments of each bar end at the balance fraction', () => {
    const { years } = project(INPUTS);
    const { bars, ticks } = chartGeometry(years);
    const top = ticks.at(-1)?.cents ?? 0;
    bars.forEach((bar, i) => {
      expect(bar.segments.at(-1)?.to).toBeCloseTo((years[i]?.balanceCents ?? 0) / top, 12);
      expect(bar.segments.map((s) => s.series)).toEqual(
        i === 0 ? ['contributions', 'returns'] : ['contributions', 'zulagen', 'returns'],
      );
    });
  });

  it('AC5: negative returns become a loss segment from the balance up to the paid-in sum', () => {
    const { years } = project({ ...INPUTS, returnBp: -1000 });
    const last = years.at(-1);
    const { bars, ticks } = chartGeometry(years);
    const top = ticks.at(-1)?.cents ?? 0;
    expect(bars.at(-1)?.segments.at(-1)).toEqual({
      series: 'returns',
      from: (last?.balanceCents ?? 0) / top,
      to: ((last?.contributionsCents ?? 0) + (last?.zulagenCents ?? 0)) / top,
      loss: true,
    });
  });

  it('AC6: all-zero rows give no segments, one tick 0 and no NaN', () => {
    const geometry = chartGeometry(project({ ...INPUTS, monthlyCents: 0 }).years);
    expect(geometry.bars.every((bar) => bar.segments.length === 0)).toBe(true);
    expect(geometry.ticks).toEqual([{ cents: 0, at: 0 }]);
  });

  it.each([1_234, 99_999, 100_000, 2_225_644, 7_200_000_000])(
    'top tick covers the maximum %d with a 1/2/5 step and 3 to 6 ticks',
    (balanceCents) => {
      const { ticks } = chartGeometry([
        {
          year: 1,
          age: 40,
          contributionsCents: balanceCents,
          zulagenCents: 0,
          returnsCents: 0,
          balanceCents,
        },
      ]);
      const step = ticks[1]?.cents ?? 0;
      expect(ticks.at(-1)?.cents).toBeGreaterThanOrEqual(balanceCents);
      expect(ticks.length).toBeGreaterThanOrEqual(3);
      expect(ticks.length).toBeLessThanOrEqual(6);
      expect([1, 2, 5]).toContain(step / 10 ** Math.floor(Math.log10(step)));
      expect(ticks.at(-1)?.at).toBe(1);
    },
  );
});

describe('xAxisYears', () => {
  it('labels year 1, the last year and the multiples of the smallest fitting step', () => {
    expect(xAxisYears(1, 8)).toEqual([1]);
    expect(xAxisYears(8, 8)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(xAxisYears(25, 8)).toEqual([1, 5, 10, 15, 20, 25]);
    expect(xAxisYears(20, 8)).toEqual([1, 5, 10, 15, 20]);
    expect(xAxisYears(20, 12)).toEqual([1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
    expect(xAxisYears(52, 8)).toEqual([1, 10, 20, 30, 40, 52]);
  });

  it('drops a multiple closer than half a step to the last year', () => {
    expect(xAxisYears(41, 8)).toEqual([1, 10, 20, 30, 41]);
  });
});
