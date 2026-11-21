import { rng, screenToScene, screenV } from '../endPlan.ts';
import type { CellWindow } from '../types.ts';

/**
 * The fireworks of a won game in the cinematic view (story 050, AC5): a schedule of rockets that
 * burst into sparks, and the closed-form path of every spark. Pure and three-free, so the limits
 * (ends before 4 s, at most 3 flashes in any second) are unit-tested without a renderer. Every
 * random number comes from `rng(seed)`, so one game always gives the same picture.
 *
 * Units: ms after the click, cells (1 = the DOM cell width), seconds inside the spark paths.
 */

export const FIREWORKS = {
  /** First burst, then one every `gapMs` (AC5: at most 3 flashes in any second; the picture's luminance rises and falls once per burst, so
   * the gap is 1100 ms: one burst per second is two counted luminance changes in the dark). */
  firstBurstMs: 400,
  gapMs: 1100,
  bursts: 3,
  minBursts: 3,
  riseMs: 420,
  lifeMs: 900,
  sparks: 72,
  speedMin: 5.5,
  speedMax: 8,
  /** Air drag (1/s) and gravity (cells/s²) of a spark. */
  drag: 2.4,
  gravity: 6,
  /** Burst height above the board plane. */
  heightMin: 3,
  heightMax: 5.5,
  /** Share of the visible window's height (from the bottom) where bursts happen. */
  vFrom: 0.62,
  vTo: 0.95,
  flashMs: 160,
  /** Colours: indices into the confetti palette (--scene-confetti-1…6). */
  colours: 6,
} as const;

/** The last spark is gone at this time, never later than the 3.6 s of the other win effects. */
export const FIREWORKS_END_MS =
  FIREWORKS.firstBurstMs + (FIREWORKS.bursts - 1) * FIREWORKS.gapMs + FIREWORKS.lifeMs;

export interface Burst {
  /** The rocket leaves the board. */
  readonly launchMs: number;
  /** The rocket bursts: the flash and the sparks start. */
  readonly burstMs: number;
  /** Centre of the burst in scene cells (z up). */
  readonly x: number;
  readonly y: number;
  readonly z: number;
  /** Index into the palette of six. */
  readonly colour: number;
  /** Sparks: dx, dy, dz (unit), speed per spark. */
  readonly sparks: Float32Array;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Number of bursts for a particle share (board size and quality level), at least `minBursts`. */
export function burstCount(share: number): number {
  return Math.max(FIREWORKS.minBursts, Math.round(FIREWORKS.bursts * Math.min(1, share)));
}

/** Number of sparks per burst for a particle share. */
export function sparkCount(share: number): number {
  return Math.max(24, Math.round(FIREWORKS.sparks * Math.min(1, share)));
}

/** The schedule: bursts over the visible part of the board, evenly spaced in time. */
export function planFireworks(seed: number, window: CellWindow, share: number): Burst[] {
  const next = rng(seed ^ 24301);
  const count = burstCount(share);
  const sparks = sparkCount(share);
  const vBottom = screenV(window.bottom); // screen-plane up axis
  const vTop = screenV(window.top);
  const span = Math.max(1, window.right - window.left);
  const bursts: Burst[] = [];
  let previousColour = -1;
  for (let i = 0; i < count; i++) {
    const burstMs = FIREWORKS.firstBurstMs + i * FIREWORKS.gapMs;
    // Spread over the width: slot i of count, jittered inside it.
    const u = window.left + span * ((i + 0.15 + 0.7 * next()) / count);
    const v = lerp(vBottom, vTop, lerp(FIREWORKS.vFrom, FIREWORKS.vTo, next()));
    const height = lerp(FIREWORKS.heightMin, FIREWORKS.heightMax, next());
    const at = screenToScene(u, v, height);
    let colour = Math.floor(next() * FIREWORKS.colours);
    if (colour === previousColour) colour = (colour + 1) % FIREWORKS.colours;
    previousColour = colour;
    const data = new Float32Array(sparks * 4);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let s = 0; s < sparks; s++) {
      // A sphere of directions (Fibonacci), jittered; a few sparks are faster (the outer shell).
      const k = (s + 0.5) / sparks;
      const dz = 1 - 2 * k + 0.12 * (next() - 0.5);
      const ring = Math.sqrt(Math.max(0, 1 - dz * dz));
      const angle = s * golden + 0.2 * next();
      data[s * 4] = Math.cos(angle) * ring;
      data[s * 4 + 1] = Math.sin(angle) * ring;
      data[s * 4 + 2] = dz;
      data[s * 4 + 3] =
        lerp(FIREWORKS.speedMin, FIREWORKS.speedMax, next()) * (s % 5 === 0 ? 1.15 : 0.85);
    }
    bursts.push({
      launchMs: burstMs - FIREWORKS.riseMs,
      burstMs,
      x: at.x,
      y: at.y,
      z: at.z,
      colour,
      sparks: data,
    });
  }
  return bursts;
}

/** Times of the flashes (the bursts), for the flash limit. */
export const burstPeaks = (bursts: readonly Burst[]): number[] => bursts.map((b) => b.burstMs);

/**
 * Offset of spark `index` from its burst centre `tauMs` after the burst (cells), written into
 * `out`: velocity decays with the drag, gravity pulls z down. false when `tauMs` is outside the life.
 */
export function sparkAt(
  burst: Burst,
  index: number,
  tauMs: number,
  out: { x: number; y: number; z: number; age: number },
): boolean {
  if (tauMs < 0 || tauMs >= FIREWORKS.lifeMs) return false;
  const tau = tauMs / 1000;
  const k = FIREWORKS.drag;
  const reach = (1 - Math.exp(-k * tau)) / k; // ∫ e^{-k t} dt
  const speed = burst.sparks[index * 4 + 3] ?? 0;
  out.x = (burst.sparks[index * 4] ?? 0) * speed * reach;
  out.y = (burst.sparks[index * 4 + 1] ?? 0) * speed * reach;
  out.z = (burst.sparks[index * 4 + 2] ?? 0) * speed * reach - 0.5 * FIREWORKS.gravity * tau * tau;
  out.age = tauMs / FIREWORKS.lifeMs;
  return true;
}

/** Brightness of the burst's flash, 0..1: a fast rise and a soft decay. */
export function flashAt(sinceBurstMs: number): number {
  if (sinceBurstMs < 0 || sinceBurstMs >= FIREWORKS.flashMs) return 0;
  const t = sinceBurstMs / FIREWORKS.flashMs;
  return t < 0.25 ? t / 0.25 : (1 - (t - 0.25) / 0.75) ** 2;
}
