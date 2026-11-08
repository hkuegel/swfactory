/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  bypassProblems,
  contrastProblems,
  parityProblems,
  parseTokens,
  readCss,
  readPlatformScheme,
  undefinedVarProblems,
  NON_TEXT,
  withBase,
  type Pair,
} from '@swfactory/platform/test/tokenRules';

// The app half of the token tests (ADR 0004, ADR 0006): the app's own tokens on top of the
// platform's, and every app stylesheet, checked with the platform's rules.
const SRC = import.meta.dirname;
const app = parseTokens(readFileSync(join(SRC, 'tokens.css'), 'utf8'));
const merged = withBase(readPlatformScheme(), app);
const allCss = readCss(SRC);

/** Fills of the chart series (story 017, UX §2), bottom to top as in the bar. */
const SERIES = [
  '--chart-contributions',
  '--chart-zulagen',
  '--chart-reinvested',
  '--chart-returns',
  '--chart-loss',
] as const;
/** Least contrast between any two series fills (story 017, UX §2). */
const SERIES_DISTINCT = 1.35;

/** Contrast pairs that involve an app token: [foreground, background, minimum ratio]. */
const PAIRS: readonly Pair[] = [
  // Every fill against the panel (story 013, UX §8; values story 017, UX §2).
  ...SERIES.map((fill): Pair => [fill, '--color-surface', NON_TEXT]),
  // Any two fills, not only current neighbours: an absent series lets two others touch.
  ...SERIES.flatMap((fill, index) =>
    SERIES.slice(index + 1).map((other): Pair => [fill, other, SERIES_DISTINCT]),
  ),
];

describe('Altersvorsorgedepot design tokens', () => {
  it('light and dark define the same colour tokens', () => {
    expect(parityProblems(app)).toEqual([]);
  });

  it('017/AC2: every series fill has 3:1 against the surface and 1.35:1 against every other fill', () => {
    // 5 fills against the surface plus all 10 fill pairs, so the check can't pass vacuously.
    expect(PAIRS).toHaveLength(15);
    expect(contrastProblems(merged, PAIRS)).toEqual([]);
  });

  it('no module bypasses the tokens (colours, font, radius, motion)', () => {
    expect(bypassProblems(allCss)).toEqual([]);
  });

  it('every var(--x) is a platform or app token', () => {
    // The pattern URLs are set inline by BalanceChart (useId), read only in forced colours.
    expect(
      undefinedVarProblems(allCss, merged.light, ['--zulagen-stripes', '--reinvested-stripes']),
    ).toEqual([]);
  });
});
