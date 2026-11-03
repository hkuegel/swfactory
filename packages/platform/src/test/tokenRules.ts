/// <reference types="node" />
// The design-token rules (story 007, ADR 0004), shared by the platform's and every app's
// tokens.test.ts. Test-only: never imported by production code. Vitest does not process CSS
// imports (they come back empty), so the stylesheets are read from disk.
import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

export type Tokens = ReadonlyMap<string, string>;

/** The token values of one stylesheet: `:root` (light) and the dark media block. */
export interface Scheme {
  readonly light: Tokens;
  readonly dark: Tokens;
}

/** [foreground, background, minimum ratio]. */
export type Pair = readonly [foreground: string, background: string, minimum: number];

export const TEXT = 4.5;
export const NON_TEXT = 3;

export function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Text between the braces of the first block whose header contains `header`. */
export function blockOf(css: string, header: string): string {
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

/** Parses `:root { … }` and `@media (prefers-color-scheme: dark) { :root { … } }`. */
export function parseTokens(css: string): Scheme {
  const text = stripComments(css);
  return {
    light: declarations(blockOf(text, ':root {')),
    dark: declarations(blockOf(blockOf(text, '@media (prefers-color-scheme: dark)'), ':root')),
  };
}

/**
 * An app's scheme on top of the platform's: the app's values win, and in each scheme the app's
 * dark block only redefines what differs (the rest is inherited from the light values).
 */
export function withBase(base: Scheme, extension: Scheme): Scheme {
  return {
    light: new Map([...base.light, ...extension.light]),
    dark: new Map([...base.dark, ...extension.dark]),
  };
}

/** The platform's own scheme, for apps that extend it. */
export function readPlatformScheme(): Scheme {
  return parseTokens(readFileSync(join(import.meta.dirname, '..', 'styles', 'tokens.css'), 'utf8'));
}

/** A colour token is classified by its value (hex or rgb()), not by its name. */
function isColourValue(value: string): boolean {
  return /^#[0-9a-f]{3,8}$/i.test(value) || /\brgba?\(/.test(value);
}

export function colourTokenNames(scheme: Scheme): string[] {
  const names = new Set<string>();
  for (const tokens of [scheme.light, scheme.dark]) {
    for (const [name, value] of tokens) if (isColourValue(value)) names.add(name);
  }
  return [...names].sort();
}

/** Light and dark define the same colour tokens, and nothing is dark-only. */
export function parityProblems(scheme: Scheme): string[] {
  const problems: string[] = [];
  for (const name of colourTokenNames(scheme)) {
    if (!scheme.light.has(name)) problems.push(`${name} has no light value`);
    if (!scheme.dark.has(name)) problems.push(`${name} has no dark value`);
  }
  for (const name of scheme.dark.keys()) {
    if (!scheme.light.has(name)) problems.push(`${name} is dark-only`);
  }
  return problems;
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

function hexValue(tokens: Tokens, name: string): string {
  const found = tokens.get(name);
  if (found === undefined || !/^#[0-9a-f]{6}$/.test(found)) {
    throw new Error(`${name} must be an opaque 6-digit hex colour, got "${found ?? 'nothing'}"`);
  }
  return found;
}

/** Every pair holds in both schemes; the dark block only redefines what differs from light. */
export function contrastProblems(scheme: Scheme, pairs: readonly Pair[]): string[] {
  const problems: string[] = [];
  for (const [name, tokens] of [
    ['light', scheme.light],
    ['dark', scheme.dark],
  ] as const) {
    const effective: Tokens = new Map([...scheme.light, ...tokens]);
    for (const [foreground, background, minimum] of pairs) {
      const ratio = contrast(hexValue(effective, foreground), hexValue(effective, background));
      if (ratio < minimum) {
        problems.push(
          `${name}: ${foreground} on ${background} is ${ratio.toFixed(2)}:1, needs ${minimum}:1`,
        );
      }
    }
  }
  return problems;
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

/**
 * Every stylesheet below `srcDir` as raw text, keyed by its path below the workspace
 * (`src/…`), so the keys of the platform and of an app look alike.
 */
export function readCss(srcDir: string): Record<string, string> {
  return Object.fromEntries(
    readdirSync(srcDir, { recursive: true, encoding: 'utf8' })
      .filter((path) => path.endsWith('.css'))
      .map((path) => [`${basename(srcDir)}/${path}`, readFileSync(join(srcDir, path), 'utf8')]),
  );
}

/** Exact keys of `readCss` (platform: `src/styles/…`, app: `src/tokens.css`), not path suffixes. */
const TOKEN_FILES: ReadonlySet<string> = new Set(['src/tokens.css', 'src/styles/tokens.css']);
const BASE_FILE = 'src/styles/base.css';

/**
 * No stylesheet bypasses the tokens: no colour literal, `font-family`, own dark-mode block, free
 * radius, free transition or animation outside `tokens.css` (and `base.css`, the reduced-motion
 * reset and the font). The login spinner is the only animation.
 */
export function bypassProblems(cssByPath: Readonly<Record<string, string>>): string[] {
  const problems: string[] = [];
  for (const [path, raw] of Object.entries(cssByPath)) {
    if (TOKEN_FILES.has(path)) continue;
    const text = stripComments(raw);
    const isBase = path === BASE_FILE;
    if (/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(|color-mix\(/.test(text)) {
      problems.push(`${path}: colour literal`);
    }
    if (/font-family\s*:/.test(text) && !isBase) {
      problems.push(`${path}: font-family outside base.css`);
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
      if (property === 'border-radius' && !/^(var\(--radius-[\w-]+\)|0|50%)$/.test(propertyValue)) {
        problems.push(`${path}: border-radius ${propertyValue}`);
      }
      if (
        property === 'transition' ||
        property === 'transition-duration' ||
        property === 'transition-delay'
      ) {
        const resetOnlyInBase =
          propertyValue === 'none' && rawValue.endsWith('!important') && isBase;
        if (
          !resetOnlyInBase &&
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
        if (!spinner && !isBase) problems.push(`${path}: ${property} ${rawValue}`);
      }
    }
  }
  return problems;
}

/**
 * Every `var(--x)` is a defined token, declared somewhere in the stylesheets themselves (a
 * module-local custom property), or one of `allowed` (set inline by a component). In the
 * platform `defined` is its own tokens, so an app token can't leak into platform CSS.
 */
export function undefinedVarProblems(
  cssByPath: Readonly<Record<string, string>>,
  defined: Tokens,
  allowed: readonly string[] = [],
): string[] {
  const texts = Object.entries(cssByPath).map(([path, raw]) => [path, stripComments(raw)] as const);
  const local = new Set(
    texts.flatMap(([, text]) => [...text.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1] ?? '')),
  );
  const problems: string[] = [];
  for (const [path, text] of texts) {
    for (const match of text.matchAll(/var\(\s*(--[\w-]+)/g)) {
      const name = match[1] ?? '';
      if (!defined.has(name) && !local.has(name) && !allowed.includes(name)) {
        problems.push(`${path}: var(${name}) is not defined`);
      }
    }
  }
  return [...new Set(problems)];
}
