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

/** Contrast pairs that involve an app token: [foreground, background, minimum ratio]. */
const PAIRS: readonly Pair[] = [
  // Chart series against the panel (story 013, UX §8); the pale fills are decorative, the
  // outline or stripe carries the series, and segments are separated by --color-surface.
  ['--chart-contributions', '--color-surface', NON_TEXT],
  ['--chart-zulagen', '--color-surface', NON_TEXT],
  ['--chart-returns', '--color-surface', NON_TEXT],
  ['--chart-loss', '--color-surface', NON_TEXT],
];

describe('Altersvorsorgedepot design tokens', () => {
  it('light and dark define the same colour tokens', () => {
    expect(parityProblems(app)).toEqual([]);
  });

  it('contrast pairs hold in both schemes', () => {
    expect(contrastProblems(merged, PAIRS)).toEqual([]);
  });

  it('no module bypasses the tokens (colours, font, radius, motion)', () => {
    expect(bypassProblems(allCss)).toEqual([]);
  });

  it('every var(--x) is a platform or app token', () => {
    expect(undefinedVarProblems(allCss, merged.light)).toEqual([]);
  });
});
