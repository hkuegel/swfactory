import type { YearRow } from './project.ts';

export type Series = 'contributions' | 'zulagen' | 'reinvested' | 'returns';

export interface Segment {
  readonly series: Series;
  /** Fraction of the plot height, 0 = baseline, from < to. */
  readonly from: number;
  readonly to: number;
  /** returns < 0: drawn from the balance up to contributions + Zulagen + reinvested. */
  readonly loss: boolean;
}

export interface Bar {
  readonly year: number;
  readonly age: number;
  /** Zero-height segments omitted. */
  readonly segments: readonly Segment[];
}

export interface Tick {
  readonly cents: number;
  /** Fraction 0..1 of the plot height. */
  readonly at: number;
}

export interface ChartGeometry {
  readonly bars: readonly Bar[];
  readonly ticks: readonly Tick[];
}

/** At most this many intervals between ticks (so 3 to 6 ticks incl. 0). */
const MAX_INTERVALS = 5;
/** Smallest tick step: 1 EUR, so whole-euro tick labels never repeat. */
const MIN_STEP_CENTS = 100;

/** Smallest 1/2/5 · 10^k step (at least 1 EUR) that covers `max` in at most 5 intervals. */
function niceStep(max: number): number {
  const minimum = max / MAX_INTERVALS;
  const magnitude = 10 ** Math.floor(Math.log10(minimum));
  for (const factor of [1, 2, 5, 10]) {
    const step = factor * magnitude;
    if (step >= minimum) return Math.max(step, MIN_STEP_CENTS);
  }
  return Math.max(10 * magnitude, MIN_STEP_CENTS);
}

function segment(series: Series, from: number, to: number, loss: boolean): Segment[] {
  return to > from ? [{ series, from, to, loss }] : [];
}

/**
 * Rows → one stacked bar per saving year (contributions, Zulagen, reinvested refund, returns from
 * the baseline up) and the y-axis ticks, all as fractions of the plot height. Negative returns
 * become a `loss` segment from the balance up to the paid-in sum, drawn over the stack.
 */
export function chartGeometry(rows: readonly YearRow[]): ChartGeometry {
  let max = 0;
  for (const row of rows) {
    max = Math.max(
      max,
      row.contributionsCents + row.zulagenCents + row.reinvestedCents,
      row.balanceCents,
    );
  }
  if (max <= 0) {
    return {
      bars: rows.map((row) => ({ year: row.year, age: row.age, segments: [] })),
      ticks: [{ cents: 0, at: 0 }],
    };
  }
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const ticks: Tick[] = [];
  for (let cents = 0; cents <= top; cents += step) ticks.push({ cents, at: cents / top });

  const bars = rows.map((row): Bar => {
    const contributions = row.contributionsCents / top;
    const zulagen = (row.contributionsCents + row.zulagenCents) / top;
    const paid = (row.contributionsCents + row.zulagenCents + row.reinvestedCents) / top;
    const balance = row.balanceCents / top;
    return {
      year: row.year,
      age: row.age,
      segments: [
        ...segment('contributions', 0, contributions, false),
        ...segment('zulagen', contributions, zulagen, false),
        ...segment('reinvested', zulagen, paid, false),
        ...(row.returnsCents < 0
          ? segment('returns', balance, paid, true)
          : segment('returns', paid, balance, false)),
      ],
    };
  });
  return { bars, ticks };
}

/** Candidate spacings of the x-axis labels (saving years). */
const LABEL_STEPS = [1, 2, 5, 10] as const;

/**
 * The saving years that get an x-axis label: year 1, the last year and the multiples of the
 * smallest step of 1, 2, 5, 10 that gives at most `maxLabels` labels. A multiple closer than half
 * a step to the last year is dropped, so its label doesn't collide with the last one.
 */
export function xAxisYears(count: number, maxLabels: number): readonly number[] {
  let chosen: number[] = [];
  for (const step of LABEL_STEPS) {
    const years = new Set<number>([1, count]);
    for (let year = step; year < count; year += step) {
      if (count - year >= step / 2) years.add(year);
    }
    chosen = [...years].filter((year) => year >= 1).sort((a, b) => a - b);
    if (chosen.length <= maxLabels) return chosen;
  }
  return chosen;
}
