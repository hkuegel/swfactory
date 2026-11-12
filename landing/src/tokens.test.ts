/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  blockOf,
  bypassProblems,
  contrastProblems,
  NON_TEXT,
  parityProblems,
  parseTokens,
  readCss,
  readPlatformScheme,
  stripComments,
  TEXT,
  undefinedVarProblems,
  withBase,
  type Pair,
} from '@swfactory/platform/test/tokenRules';

// The landing page's half of the token tests (ADR 0004, ADR 0011): its own tokens on top of the
// platform's, and every stylesheet of the page, checked with the platform's rules.
const SRC = import.meta.dirname;
const tokensCss = readFileSync(join(SRC, 'tokens.css'), 'utf8');
const landing = parseTokens(tokensCss);
const merged = withBase(readPlatformScheme(), landing);
const allCss = readCss(SRC);

/** The one stylesheet that may animate: the entry rise of the hero (ADR 0011). */
const ANIMATION_FILE = 'src/components/Hero.module.css';
const MAX_ENTRY_MS = 2000;

/** Fills the page paints: the cards, tiles and hovers, the selected tab, and the hero gradient. */
const SURFACE = '--color-surface';
const SUBTLE = '--color-surface-subtle';
const SELECTED = '--color-accent-subtle'; // also the top of the hero gradient
const PAGE = '--color-page';

/** What the stylesheets of the page paint (UX design §4): [foreground, background, minimum]. */
const PAIRS: readonly Pair[] = [
  // Text: body and headings, tab labels (plain, hovered, selected), figures on the tiles.
  ...[PAGE, SURFACE, SUBTLE, SELECTED].map((bg): Pair => ['--color-text', bg, TEXT]),
  // Muted text: eyebrow and claim on the gradient, leads, owners, source lines, tile labels.
  ...[PAGE, SURFACE, SUBTLE, SELECTED].map((bg): Pair => ['--color-text-muted', bg, TEXT]),
  // Accent text: secondary hero link (also hovered), app titles (also hovered), list numbers,
  // text links, the pointer glyph of the selected tab.
  ...[PAGE, SURFACE, SUBTLE, SELECTED].map((bg): Pair => ['--color-accent', bg, TEXT]),
  // Primary hero link, also hovered.
  ['--color-on-accent', '--color-accent', TEXT],
  ['--color-on-accent', '--color-accent-hover', TEXT],
  // Diagram parts that carry meaning: marker rings and the spine, the motif, card and tile edges.
  ...[PAGE, SURFACE, SUBTLE, SELECTED].map((bg): Pair => ['--color-edge', bg, NON_TEXT]),
  // The human gates: diamonds in rows, tabs (plain, hovered, selected) and on the hero gradient.
  ...[PAGE, SURFACE, SUBTLE, SELECTED].map((bg): Pair => ['--landing-gate', bg, NON_TEXT]),
  // Focus ring: around links on the page, inside tabs (plain, hovered, selected).
  ...[PAGE, SURFACE, SUBTLE, SELECTED].map((bg): Pair => ['--color-focus', bg, NON_TEXT]),
];

function milliseconds(value: string | undefined): number {
  const match = /^(\d*\.?\d+)(ms|s)$/.exec(value ?? '');
  if (match === null) throw new Error(`not a duration: "${value ?? 'nothing'}"`);
  return Number(match[1]) * (match[2] === 's' ? 1000 : 1);
}

describe('landing page design tokens', () => {
  it('AC6: light and dark define the same colour tokens', () => {
    expect(parityProblems(landing)).toEqual([]);
    expect(landing.dark.has('--landing-gate')).toBe(true);
  });

  it('AC6: every painted pair holds in both schemes (4.5:1 text, 3:1 meaningful diagram parts)', () => {
    expect(PAIRS).toHaveLength(26);
    expect(contrastProblems(merged, PAIRS)).toEqual([]);
  });

  it('AC2/AC6: no module bypasses the tokens; only the hero stylesheet animates', () => {
    expect(bypassProblems(allCss, { animationFiles: [ANIMATION_FILE] })).toEqual([]);
    // Without the exception the entry animation is refused: the option is what allows it.
    expect(bypassProblems(allCss)).toEqual([
      expect.stringContaining(`${ANIMATION_FILE}: animation`),
      `${ANIMATION_FILE}: animation none`,
    ]);
    expect(Object.keys(allCss).length).toBeGreaterThan(5);
  });

  it('AC2/AC6: the entry animation lasts at most 2 s, runs once and is off under reduced motion', () => {
    const hero = stripComments(allCss[ANIMATION_FILE] ?? '');
    // The animation takes its duration from the token, with no iteration count (one run).
    expect(hero).toMatch(/animation:\s*[\w-]+ var\(--duration-entry\) var\(--ease\) backwards;/);
    expect(hero).toMatch(/prefers-reduced-motion: reduce\)[^@]*animation:\s*none/);

    const entry = milliseconds(landing.light.get('--duration-entry'));
    expect(entry).toBeGreaterThan(0);
    expect(entry).toBeLessThanOrEqual(MAX_ENTRY_MS);
    const reduced = blockOf(stripComments(tokensCss), '@media (prefers-reduced-motion: reduce)');
    expect(reduced).toMatch(/--duration-entry:\s*0s;/);

    // Nothing loops, in any stylesheet of the page.
    for (const [path, css] of Object.entries(allCss)) {
      expect(stripComments(css), path).not.toMatch(/infinite|animation-iteration-count/);
    }
  });

  it('AC6: every var(--x) is a platform or landing token', () => {
    expect(undefinedVarProblems(allCss, merged.light)).toEqual([]);
  });
});
