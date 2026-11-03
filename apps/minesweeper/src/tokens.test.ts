/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
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
  readPlatformScheme,
  stripComments,
  TEXT,
  undefinedVarProblems,
  withBase,
  type Pair,
} from '@swfactory/platform/test/tokenRules';
import { boardMargins } from './features/minesweeper/scene3d/geometry.ts';
import { SCENE_COLOUR_TOKENS, SCENE_LOOK_TOKENS } from './features/minesweeper/scene3d/palette.ts';
import { TILE_RADIUS } from './features/minesweeper/scene3d/sceneLayout.ts';

// The app half of the token tests (story 007, 009, ADR 0004, ADR 0006): the app's own tokens on
// top of the platform's, the scene-parity checks and every app stylesheet. The generic rules
// (the same engine) run over the platform in its own tokens.test.ts.
const SRC = import.meta.dirname;
const app = parseTokens(readFileSync(join(SRC, 'tokens.css'), 'utf8'));
const merged = withBase(readPlatformScheme(), app);
const { light, dark } = app;
const allCss = readCss(SRC);

/** Unitless numbers of the 3D scene: parity and range only, no colour or contrast checks. */
const LOOK_TOKENS: ReadonlySet<string> = new Set(Object.values(SCENE_LOOK_TOKENS));

/** The placements of the UX design (§2.2) that involve a cell, digit or scene token. */
const PAIRS: readonly Pair[] = [
  ...['--cell-revealed-fill'].map((bg) => ['--color-text', bg, TEXT] as const),
  ['--color-text', '--cell-tile-fill', TEXT],
  ['--color-text-muted', '--cell-revealed-fill', TEXT],
  ['--color-edge', '--cell-revealed-fill', NON_TEXT],
  ['--color-edge', '--cell-tile-fill', NON_TEXT],
  ['--color-focus', '--cell-tile-fill', NON_TEXT],
  ['--color-focus', '--cell-revealed-fill', NON_TEXT],
  // 3D: the focus ring also sits on the thicker lip of a raised tile (story 008).
  ['--color-focus', '--cell-tile-lip', NON_TEXT],
  ['--color-focus', '--cell-pressed-shade', NON_TEXT], // ring next to the lowered cell's top shade
  ['--color-danger-solid', '--cell-tile-fill', NON_TEXT],
  // The flag also sits on hovered and pressed tiles, and (wrong flag) on a revealed cell.
  ['--color-danger-solid', '--cell-tile-hover', NON_TEXT],
  ['--color-danger-solid', '--cell-tile-pressed', NON_TEXT],
  ['--color-danger-solid', '--cell-revealed-fill', NON_TEXT],
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => [`--n${n}`, '--cell-revealed-fill', TEXT] as const),
  // 3D scene (story 009, UX §14.14): unlit glyphs on the token colour of the surface (their halo).
  ['--color-danger-solid', '--scene-tile-top', TEXT],
  ['--color-text', '--scene-tile-top', NON_TEXT],
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => [`--n${n}`, '--scene-revealed-top', TEXT] as const),
  ['--color-danger-solid', '--scene-revealed-top', NON_TEXT],
  ['--scene-mine-lit', '--scene-revealed-top', NON_TEXT],
  ['--scene-mine-shade', '--scene-revealed-top', NON_TEXT],
  ['--color-text', '--scene-revealed-top', NON_TEXT],
  ['--color-focus', '--scene-focus-halo', NON_TEXT],
];

describe('Minesweeper design tokens', () => {
  it('AC2: light and dark define the same colour tokens', () => {
    expect(parityProblems(app)).toEqual([]);
    expect(colourTokenNames(app).length).toBeGreaterThan(20);
  });

  it('AC3: contrast pairs hold in both schemes (4.5:1 text and digits, 3:1 non-text)', () => {
    expect(contrastProblems(merged, PAIRS)).toEqual([]);
  });

  it('AC1: --board3d-fit matches the inline margins of a square 3D board (story 009)', () => {
    const fit = parseFloat(light.get('--board3d-fit') ?? '');
    const width = 9 * 32 + 8 * 2;
    const expected = 1 + (2 * boardMargins(width, width).inline) / width;
    expect(fit).toBeGreaterThanOrEqual(expected);
    expect(fit).toBeLessThanOrEqual(expected + 0.005);
  });

  it('AC1: the scene tokens exist in light and dark; look numbers are in range (story 009)', () => {
    for (const token of Object.values(SCENE_COLOUR_TOKENS)) {
      expect(merged.light.has(token), `${token} in light`).toBe(true);
      expect(merged.dark.has(token), `${token} in dark`).toBe(true);
    }
    for (const token of LOOK_TOKENS) {
      for (const tokens of [light, dark]) {
        const number = Number(tokens.get(token));
        expect(Number.isFinite(number), token).toBe(true);
        expect(number).toBeGreaterThanOrEqual(0);
        expect(number).toBeLessThanOrEqual(2);
      }
    }
    // Digits keep the 007 pairs by construction: the revealed top is the 2D revealed fill.
    expect(light.get('--scene-revealed-top')).toBe(light.get('--cell-revealed-fill'));
    expect(dark.get('--scene-revealed-top')).toBe(dark.get('--cell-revealed-fill'));
  });

  it('AC1: the overlay tint radius follows the scene tile radius (story 009)', () => {
    const board = stripComments(allCss['src/features/minesweeper/Board.module.css'] ?? '');
    const factor = /--radius-tile-3d:\s*calc\(var\(--cell\)\s*\*\s*([\d.]+)\)/.exec(board)?.[1];
    expect(Number(factor)).toBe(TILE_RADIUS);
  });

  it('AC1: the scene code has no colour literals (story 009)', () => {
    const dir = join(SRC, 'features', 'minesweeper', 'scene3d');
    const literals = readdirSync(dir, { recursive: true, encoding: 'utf8' })
      .filter((path) => path.endsWith('.ts'))
      .filter((path) =>
        /#[0-9a-fA-F]{3,8}\b|\b0x[0-9a-fA-F]+\b/.test(readFileSync(join(dir, path), 'utf8')),
      );
    expect(literals).toEqual([]);
  });

  it('AC2/AC6: no module bypasses the tokens (colours, font, radius, motion)', () => {
    expect(bypassProblems(allCss)).toEqual([]);
    expect(Object.keys(allCss).length).toBeGreaterThan(5);
  });

  it('AC2: every var(--x) is a platform or app token (the grid size is set inline)', () => {
    expect(undefinedVarProblems(allCss, merged.light, ['--cols', '--rows'])).toEqual([]);
  });
});
