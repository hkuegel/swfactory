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
const PAIRS: readonly Pair[] = [];

describe('__TITLE__ design tokens', () => {
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
