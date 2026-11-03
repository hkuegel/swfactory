/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  bypassProblems,
  colourTokenNames,
  contrastProblems,
  NON_TEXT,
  parityProblems,
  parseTokens,
  readCss,
  TEXT,
  undefinedVarProblems,
  type Pair,
} from '../test/tokenRules.ts';

// The generic half of the token tests (story 007, ADR 0004, ADR 0006): the platform's tokens and
// every platform stylesheet. App-specific tokens are tested in the app, with the same rules.
const SRC = join(import.meta.dirname, '..');
const scheme = parseTokens(readFileSync(join(import.meta.dirname, 'tokens.css'), 'utf8'));
const allCss = readCss(SRC);

/** The placements of the UX design (§2.2) that only use platform tokens. */
const PAIRS: readonly Pair[] = [
  ...['--color-page', '--color-surface', '--color-surface-subtle'].map(
    (bg) => ['--color-text', bg, TEXT] as const,
  ),
  ['--color-text', '--color-danger-bg', TEXT],
  ['--color-text', '--color-success-bg', TEXT],
  ['--color-text', '--color-input-bg', TEXT],
  ['--color-text-muted', '--color-surface', TEXT],
  ['--color-text-muted', '--color-page', TEXT],
  ['--color-text-muted', '--color-surface-subtle', TEXT],
  // Hover and pressed fills of secondary buttons: preset detail text and the guest button's text.
  ['--color-text-muted', '--color-accent-subtle', TEXT],
  ['--color-text-muted', '--color-accent-subtle-press', TEXT],
  ['--color-text', '--color-accent-subtle', TEXT],
  ['--color-text', '--color-accent-subtle-press', TEXT],
  ['--color-accent', '--color-surface', TEXT],
  ['--color-accent', '--color-page', TEXT],
  ['--color-accent', '--color-accent-subtle', TEXT],
  ['--color-accent', '--color-accent-subtle-press', TEXT],
  ['--color-on-accent', '--color-accent', TEXT],
  ['--color-on-accent', '--color-accent-hover', TEXT],
  ['--color-on-accent', '--color-accent-active', TEXT],
  ['--color-edge', '--color-surface', NON_TEXT],
  ['--color-edge', '--color-page', NON_TEXT],
  ['--color-edge', '--color-input-bg', NON_TEXT],
  ['--color-focus', '--color-page', NON_TEXT],
  ['--color-focus', '--color-surface', NON_TEXT],
  // View control (story 008): segment border on the selected and hover fills.
  ['--color-edge', '--color-accent-subtle', NON_TEXT],
  ['--color-edge', '--color-accent-subtle-press', NON_TEXT],
  ['--color-focus', '--color-accent-subtle-press', NON_TEXT],
  ['--color-focus', '--color-danger-bg', NON_TEXT],
  ['--color-danger', '--color-danger-bg', NON_TEXT],
  ['--color-danger', '--color-surface', NON_TEXT],
  ['--color-success', '--color-success-bg', NON_TEXT],
  ['--color-success', '--color-surface', NON_TEXT],
  ['--color-danger-solid', '--color-danger-bg', NON_TEXT],
  ['--color-on-danger-solid', '--color-danger-solid', NON_TEXT],
  ['--google-text', '--google-fill', TEXT],
  ['--google-text', '--google-hover', TEXT],
  ['--google-text', '--google-press', TEXT],
  ['--google-border', '--color-surface', NON_TEXT],
];

describe('platform design tokens', () => {
  it('AC2: light and dark define the same colour and shadow tokens', () => {
    expect(parityProblems(scheme)).toEqual([]);
    expect(colourTokenNames(scheme).length).toBeGreaterThan(25);
  });

  it('AC3: contrast pairs hold in both schemes (4.5:1 text, 3:1 non-text)', () => {
    expect(contrastProblems(scheme, PAIRS)).toEqual([]);
  });

  it('AC2/AC6: no module bypasses the tokens (colours, font, radius, motion)', () => {
    // The spinner's file must switch its animation off under reduced motion.
    const login = allCss['src/auth/LoginView.module.css'] ?? '';
    expect(login).toMatch(/prefers-reduced-motion: reduce\)[^@]*animation:\s*none/);
    expect(bypassProblems(allCss)).toEqual([]);
    expect(Object.keys(allCss).length).toBeGreaterThan(5);
  });

  it('AC2: every var(--x) in platform CSS is a platform token (no app token leaks in)', () => {
    expect(undefinedVarProblems(allCss, scheme.light)).toEqual([]);
  });
});
