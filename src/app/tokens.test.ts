/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Vitest does not process CSS imports (they come back empty), so read the files from disk.
const SRC = join(import.meta.dirname, '..');
const tokensCss = readFileSync(join(SRC, 'app', 'tokens.css'), 'utf8');

/** Every stylesheet of the app as raw text, keyed by its path below src/ (story 007, ADR 0004). */
const allCss: Record<string, string> = Object.fromEntries(
  readdirSync(SRC, { recursive: true, encoding: 'utf8' })
    .filter((path) => path.endsWith('.css'))
    .map((path) => [`/src/${path}`, readFileSync(join(SRC, path), 'utf8')]),
);

type Tokens = ReadonlyMap<string, string>;

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Text between the braces of the first block whose header contains `header`. */
function blockOf(css: string, header: string): string {
  const start = css.indexOf(header);
  if (start < 0) throw new Error(`block "${header}" not found`);
  const open = css.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}') depth--;
    if (depth === 0) return css.slice(open + 1, i);
  }
  throw new Error(`block "${header}" is not closed`);
}

function declarations(block: string): Tokens {
  const map = new Map<string, string>();
  for (const match of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    const [, name, value] = match;
    if (name !== undefined && value !== undefined) map.set(name, value.trim());
  }
  return map;
}

const css = stripComments(tokensCss);
const light = declarations(blockOf(css, ':root {'));
const dark = declarations(blockOf(blockOf(css, '@media (prefers-color-scheme: dark)'), ':root'));

function isColourToken(name: string): boolean {
  return /^--(color|cell|google|shadow|n\d)/.test(name) && !/^--(cell-gap)$/.test(name);
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => {
    const value = parseInt(hex.slice(i, i + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const [r = 0, g = 0, b = 0] = channels;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const [a, b] = [luminance(foreground), luminance(background)].sort((x, y) => y - x);
  return ((a ?? 0) + 0.05) / ((b ?? 0) + 0.05);
}

function value(tokens: Tokens, name: string): string {
  const found = tokens.get(name);
  if (found === undefined || !/^#[0-9a-f]{6}$/.test(found)) {
    throw new Error(`${name} must be an opaque 6-digit hex colour, got "${found ?? 'nothing'}"`);
  }
  return found;
}

/** All `property: value;` declarations of a stylesheet (custom properties included). */
function propertiesOf(text: string): readonly (readonly [string, string])[] {
  return [...text.matchAll(/([\w-]+)\s*:\s*([^;{}]+);/g)].flatMap((match) => {
    const [, property, propertyValue] = match;
    return property !== undefined && propertyValue !== undefined
      ? [[property, propertyValue.trim()] as const]
      : [];
  });
}

/** Properties whose value can contain a colour. */
const COLOUR_PROPERTY =
  /^(color|background(-color|-image)?|border(-(top|right|bottom|left|block|inline)(-\w+)?)?(-color)?|outline(-color)?|fill|stroke|box-shadow|text-decoration(-color)?|caret-color|accent-color)$/;

/** `var(--x)` and `var(--x, var(--y))`: the tokens themselves. */
const VAR_CALL = /var\([^()]*(?:\([^()]*\)[^()]*)*\)/g;

/** Words a colour property may use besides tokens: keywords, line styles, system colours. */
const ALLOWED_VALUE_WORDS: ReadonlySet<string> = new Set([
  'currentcolor',
  'transparent',
  'inherit',
  'initial',
  'unset',
  'none',
  'inset',
  'solid',
  'dashed',
  'dotted',
  'double',
  'thin',
  'medium',
  'thick',
  // CSS system colours (forced-colours rules)
  'canvas',
  'canvastext',
  'buttonface',
  'buttontext',
  'buttonborder',
  'graytext',
  'highlight',
  'highlighttext',
  'linktext',
  'visitedtext',
  'activetext',
  'field',
  'fieldtext',
  'mark',
  'marktext',
]);

const TEXT = 4.5;
const NON_TEXT = 3;

/** [foreground, background, minimum ratio]: the placements of the UX design (§2.2). */
const PAIRS: readonly (readonly [string, string, number])[] = [
  ...['--color-page', '--color-surface', '--color-surface-subtle', '--cell-revealed-fill'].map(
    (bg) => ['--color-text', bg, TEXT] as const,
  ),
  ['--color-text', '--cell-tile-fill', TEXT],
  ['--color-text', '--color-danger-bg', TEXT],
  ['--color-text', '--color-success-bg', TEXT],
  ['--color-text', '--color-input-bg', TEXT],
  ['--color-text-muted', '--color-surface', TEXT],
  ['--color-text-muted', '--color-page', TEXT],
  ['--color-text-muted', '--color-surface-subtle', TEXT],
  ['--color-text-muted', '--cell-revealed-fill', TEXT],
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
  ['--color-edge', '--cell-revealed-fill', NON_TEXT],
  ['--color-edge', '--cell-tile-fill', NON_TEXT],
  ['--color-focus', '--color-page', NON_TEXT],
  ['--color-focus', '--color-surface', NON_TEXT],
  ['--color-focus', '--cell-tile-fill', NON_TEXT],
  ['--color-focus', '--cell-revealed-fill', NON_TEXT],
  ['--color-focus', '--color-danger-bg', NON_TEXT],
  ['--color-danger', '--color-danger-bg', NON_TEXT],
  ['--color-danger', '--color-surface', NON_TEXT],
  ['--color-success', '--color-success-bg', NON_TEXT],
  ['--color-success', '--color-surface', NON_TEXT],
  ['--color-danger-solid', '--cell-tile-fill', NON_TEXT],
  // The flag also sits on hovered and pressed tiles, and (wrong flag) on a revealed cell.
  ['--color-danger-solid', '--cell-tile-hover', NON_TEXT],
  ['--color-danger-solid', '--cell-tile-pressed', NON_TEXT],
  ['--color-danger-solid', '--cell-revealed-fill', NON_TEXT],
  ['--color-danger-solid', '--color-danger-bg', NON_TEXT],
  ['--color-on-danger-solid', '--color-danger-solid', NON_TEXT],
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => [`--n${n}`, '--cell-revealed-fill', TEXT] as const),
  ['--google-text', '--google-fill', TEXT],
  ['--google-text', '--google-hover', TEXT],
  ['--google-text', '--google-press', TEXT],
  ['--google-border', '--color-surface', NON_TEXT],
];

describe('design tokens', () => {
  it('AC2: light and dark define the same colour and shadow tokens', () => {
    const colours = (tokens: Tokens) => [...tokens.keys()].filter(isColourToken).sort();
    expect(colours(dark)).toEqual(colours(light));
    // Everything the dark block redefines exists in light, so no name is dark-only.
    expect([...dark.keys()].filter((name) => !light.has(name))).toEqual([]);
    expect(colours(light).length).toBeGreaterThan(40);
  });

  it('AC3: contrast pairs hold in both schemes (4.5:1 text and digits, 3:1 non-text)', () => {
    const failures: string[] = [];
    for (const [scheme, tokens] of [
      ['light', light],
      ['dark', dark],
    ] as const) {
      // The dark block only redefines what differs; the rest is inherited from :root.
      const effective: Tokens = new Map([...light, ...tokens]);
      for (const [foreground, background, minimum] of PAIRS) {
        const ratio = contrast(value(effective, foreground), value(effective, background));
        if (ratio < minimum) {
          failures.push(
            `${scheme}: ${foreground} on ${background} is ${ratio.toFixed(2)}:1, needs ${minimum}:1`,
          );
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('AC2/AC6: no module bypasses the tokens (colours, font, radius, motion)', () => {
    const problems: string[] = [];
    for (const [path, raw] of Object.entries(allCss)) {
      if (path.endsWith('/tokens.css')) continue;
      const text = stripComments(raw);
      const isIndex = path.endsWith('/src/index.css');
      if (
        /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(|color-mix\(/.test(text)
      ) {
        problems.push(`${path}: colour literal`);
      }
      if (/font-family\s*:/.test(text) && !isIndex) {
        problems.push(`${path}: font-family outside index.css`);
      }
      if (/prefers-color-scheme/.test(text)) problems.push(`${path}: own dark-mode block`);

      for (const [property, rawValue] of propertiesOf(text)) {
        const propertyValue = rawValue.replace(/\s*!important$/, '');
        if (COLOUR_PROPERTY.test(property)) {
          // Named colours (white, red, …) are caught here: only these words may remain.
          const words = (
            propertyValue
              .replace(VAR_CALL, ' ')
              .replace(/-?\d*\.?\d+[a-z%]*/gi, ' ') // numbers and lengths
              .replace(/[a-z-]+\(/gi, ' ') // function names such as calc(
              .match(/[a-z][\w-]*/gi) ?? []
          )
            .map((word) => word.toLowerCase())
            .filter((word) => !ALLOWED_VALUE_WORDS.has(word));
          if (words.length > 0) problems.push(`${path}: ${property}: ${rawValue}`);
        }
        if (
          property === 'border-radius' &&
          !/^(var\(--radius-[\w-]+\)|0|50%)$/.test(propertyValue)
        ) {
          problems.push(`${path}: border-radius ${propertyValue}`);
        }
        if (
          property === 'transition' ||
          property === 'transition-duration' ||
          property === 'transition-delay'
        ) {
          const resetOnlyInIndex =
            propertyValue === 'none' && rawValue.endsWith('!important') && isIndex;
          if (
            !resetOnlyInIndex &&
            !/var\(--duration\)/.test(propertyValue) &&
            propertyValue !== '0s'
          ) {
            problems.push(`${path}: ${property} ${rawValue}`);
          }
          if (/\ball\b/.test(propertyValue)) problems.push(`${path}: ${property} all`);
        }
        if (/^animation(-|$)/.test(property)) {
          // Only the sign-in spinner (own static rule under reduced motion) and the global reset.
          const spinner = path.endsWith('/auth/LoginView.module.css');
          if (!spinner && !isIndex) problems.push(`${path}: ${property} ${rawValue}`);
        }
      }
    }
    // The spinner's file must switch its animation off under reduced motion.
    const login = allCss['/src/features/auth/LoginView.module.css'] ?? '';
    expect(login).toMatch(/prefers-reduced-motion: reduce\)[^@]*animation:\s*none/);
    expect(problems).toEqual([]);
    expect(Object.keys(allCss).length).toBeGreaterThan(5);
  });
});
