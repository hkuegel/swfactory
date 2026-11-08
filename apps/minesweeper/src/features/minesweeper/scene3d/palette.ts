import type { SceneColour, SceneLook, ScenePalette } from './types.ts';

/**
 * The tokens the 3D scene reads (story 009, UX §3.2, ADR 0004). three-free; src/tokens.test.ts
 * checks that every listed token exists in light and dark.
 */
export const SCENE_COLOUR_TOKENS: Readonly<Record<SceneColour, string>> = {
  table: '--scene-table',
  slab: '--scene-slab',
  tileTop: '--scene-tile-top',
  revealedTop: '--scene-revealed-top',
  explodedTop: '--color-danger-bg',
  keyLight: '--scene-key',
  fillSky: '--scene-fill-sky',
  fillGround: '--scene-fill-ground',
  flag: '--color-danger-solid',
  pole: '--color-text',
  mineLit: '--scene-mine-lit',
  mineShade: '--scene-mine-shade',
  exploded: '--color-danger-solid',
  explodedGlyph: '--color-on-danger-solid',
  slash: '--color-text',
  n1: '--n1',
  n2: '--n2',
  n3: '--n3',
  n4: '--n4',
  n5: '--n5',
  n6: '--n6',
  n7: '--n7',
  n8: '--n8',
  fxFlash: '--scene-fx-flash',
  fxFireCore: '--scene-fx-fire-core',
  fxFireMid: '--scene-fx-fire-mid',
  fxFireEdge: '--scene-fx-fire-edge',
  fxSmoke: '--scene-fx-smoke',
  confetti1: '--scene-confetti-1',
  confetti2: '--scene-confetti-2',
  confetti3: '--scene-confetti-3',
  confetti4: '--scene-confetti-4',
  confetti5: '--scene-confetti-5',
  confetti6: '--scene-confetti-6',
};

/** Unitless look numbers: parity and range checks only, never colour or contrast checks. */
export const SCENE_LOOK_TOKENS: Readonly<Record<keyof SceneLook, string>> = {
  keyIntensity: '--scene-key-intensity',
  fillIntensity: '--scene-fill-intensity',
  shadowStrength: '--scene-shadow-strength',
  gloss: '--scene-gloss',
  envIntensity: '--scene-env-intensity',
  fxFlashAlpha: '--scene-fx-flash-alpha',
  fxSmokeAlpha: '--scene-fx-smoke-alpha',
  fxLightIntensity: '--scene-fx-light-intensity',
};

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Lower-case 6-digit form: a minifier shortens the 6-digit white to the 3-digit form, and the browser returns it as authored (bug 020). */
function normaliseHex(value: string): string {
  const lower = value.toLowerCase();
  if (lower.length === 7) return lower;
  return `#${[...lower.slice(1)].map((digit) => digit + digit).join('')}`;
}

/** Reads the palette through `getVar` (a computed custom property). Throws on a missing or invalid token. */
export function readPalette(getVar: (name: string) => string): ScenePalette {
  const colours = Object.fromEntries(
    Object.entries(SCENE_COLOUR_TOKENS).map(([key, token]) => {
      const value = getVar(token).trim();
      if (!HEX.test(value))
        throw new Error(`${token} must be a 3- or 6-digit hex colour, got "${value}"`);
      return [key, normaliseHex(value)];
    }),
  ) as Record<SceneColour, string>; // every key of SCENE_COLOUR_TOKENS is mapped above
  const look = Object.fromEntries(
    Object.entries(SCENE_LOOK_TOKENS).map(([key, token]) => {
      const value = Number.parseFloat(getVar(token));
      if (!Number.isFinite(value)) throw new Error(`${token} must be a number`);
      return [key, value];
    }),
  ) as Record<keyof SceneLook, number>; // every key of SCENE_LOOK_TOKENS is mapped above
  return { colours, look };
}
