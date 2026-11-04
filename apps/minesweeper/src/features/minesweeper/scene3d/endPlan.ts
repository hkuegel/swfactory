import { EFFECT_LIMITS, FX_LOSS, FX_SCALE, FX_WIN } from './effectParams.ts';
import { TILT_DEG, type Vec3 } from './geometry.ts';
import type { QualityLevel } from './timeline.ts';
import type { CellWindow } from './types.ts';

/**
 * The pure plan of the end effects (story 010): seeds, budgets, the mine chain, the shake and
 * flash envelopes, the visible window and closed-form particle paths. three-free, so the AC
 * limits are unit-tested without a renderer. Every random number comes from `rng(seed)`.
 */

/** UX G4: one game always gives the same picture. */
export const effectSeed = (gameId: number, cellIndex: number): number => gameId * 31 + cellIndex;

/** mulberry32: deterministic numbers in [0, 1). Never Math.random, so stills and tests repeat. */
export function rng(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 1831565813) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rad = (deg: number) => (deg * Math.PI) / 180;

// --- Budget (UX S1 ∘ S2) -------------------------------------------------------------------

export interface EffectScale {
  readonly puffs: number;
  readonly sparks: number;
  /** Absolute number of shards (UX S1, S2 give counts, not factors). */
  readonly shards: number;
  readonly smoke: number;
  readonly confetti: number;
  /** How many chain mines get a puff. */
  readonly chainPuffMines: number;
  readonly shudder: boolean;
  readonly hop: boolean;
  readonly light: boolean;
}

/** Multipliers and switches for a board of `cells` cells at a quality level. */
export function effectScale(cells: number, level: QualityLevel): EffectScale {
  const size =
    FX_SCALE.bySize.find((row) => cells <= row.maxCells) ??
    FX_SCALE.bySize[FX_SCALE.bySize.length - 1];
  const byLevel = FX_SCALE.byLevel[level];
  if (!size) throw new Error('FX_SCALE.bySize is empty');
  const particles = size.particles * byLevel.particles;
  return {
    puffs: particles,
    sparks: particles,
    shards: Math.min(size.shards, byLevel.shards),
    smoke: byLevel.smoke ? particles : 0,
    confetti:
      (cells >= FX_WIN.count.bigBoardCells ? FX_WIN.count.bigFactor : 1) * byLevel.particles,
    chainPuffMines: byLevel.smoke ? size.chainPuffMines : 0,
    shudder: size.shudder && byLevel.shudder,
    hop: byLevel.hop,
    light: byLevel.light && FX_LOSS.light.enabled,
  };
}

/** Particle factor of a level relative to the level at spawn time (counts follow the governor). */
export function levelShare(spawnLevel: QualityLevel, level: QualityLevel): number {
  return Math.min(1, FX_SCALE.byLevel[level].particles / FX_SCALE.byLevel[spawnLevel].particles);
}

// --- Chain (UX L11) ------------------------------------------------------------------------

export interface MineStep {
  readonly index: number;
  /** After FX_LOSS.chain.startMs. */
  readonly delayMs: number;
  /** Distance to the exploded cell in cells. */
  readonly distance: number;
}

/** Length of the chain for n mines: step 90 ms, at most 1000 ms. */
export const chainLengthMs = (count: number): number =>
  Math.min(FX_LOSS.chain.maxMs, Math.max(0, count - 1) * FX_LOSS.chain.stepMs);

/** Nearest to the exploded cell first, ties by index; level 2: in 4 distance bands. */
export function mineChain(
  exploded: number,
  mines: readonly number[],
  cols: number,
  level: QualityLevel,
): MineStep[] {
  const er = Math.floor(exploded / cols);
  const ec = exploded % cols;
  const ordered = mines
    .filter((index) => index !== exploded)
    .map((index) => ({
      index,
      distance: Math.hypot(Math.floor(index / cols) - er, (index % cols) - ec),
    }))
    .sort((a, b) => a.distance - b.distance || a.index - b.index);
  const length = chainLengthMs(ordered.length);
  if (level === 2) {
    const { bands } = FX_LOSS.chain;
    const far = Math.max(0, ...ordered.map((m) => m.distance));
    return ordered.map((m) => {
      const band = far > 0 ? Math.min(bands - 1, Math.floor((m.distance / far) * bands)) : 0;
      return { ...m, delayMs: (band / (bands - 1)) * length };
    });
  }
  const last = Math.max(1, ordered.length - 1);
  return ordered.map((m, i) => ({ ...m, delayMs: (i * length) / last }));
}

// --- Envelopes ---------------------------------------------------------------------------

const DIAGONAL: readonly [x: number, y: number] = [Math.SQRT1_2, Math.SQRT1_2];

/**
 * UX L3: one decaying push along `direction` (a unit vector in screen axes), in cells. Writes
 * `out` (the render loop passes a scratch object; no allocation per frame) and returns it.
 */
export function shakeAt(
  elapsedMs: number,
  direction: readonly [x: number, y: number] = DIAGONAL,
  out: { x: number; y: number } = { x: 0, y: 0 },
): { x: number; y: number } {
  const { durationMs, amplitude, hz } = FX_LOSS.shake;
  const s =
    elapsedMs >= 0 && elapsedMs < durationMs
      ? amplitude * (1 - elapsedMs / durationMs) * Math.sin((2 * Math.PI * hz * elapsedMs) / 1000)
      : 0;
  out.x = direction[0] * s;
  out.y = direction[1] * s;
  return out;
}

/**
 * UX L1: bloom diameter (cells, capped on screen) and alpha (0..1 of the peak alpha token).
 * Writes `out` and returns it.
 */
export function bloomAt(
  elapsedMs: number,
  cellPx: number,
  out: { diameter: number; alpha: number } = { diameter: 0, alpha: 0 },
): { diameter: number; alpha: number } {
  const { durationMs, growMs, peakMs, diameterFrom, diameterTo } = FX_LOSS.bloom;
  if (!(elapsedMs >= 0 && elapsedMs < durationMs)) {
    out.diameter = 0;
    out.alpha = 0;
    return out;
  }
  const grow = 1 - (1 - Math.min(1, elapsedMs / growMs)) ** 2;
  out.diameter = Math.min(
    lerp(diameterFrom, diameterTo, grow),
    EFFECT_LIMITS.flashAreaMaxPx / Math.max(1, cellPx),
  );
  const alpha =
    elapsedMs < peakMs ? elapsedMs / peakMs : 1 - (elapsedMs - peakMs) / (durationMs - peakMs);
  out.alpha = clamp(alpha, 0, 1);
  return out;
}

/** UX L2: flash light envelope 0..1. */
export function flashLightAt(elapsedMs: number): number {
  const { peakMs, durationMs } = FX_LOSS.light;
  if (!(elapsedMs >= 0 && elapsedMs < durationMs)) return 0;
  return elapsedMs < peakMs ? elapsedMs / peakMs : 1 - (elapsedMs - peakMs) / (durationMs - peakMs);
}

/** Most pulses whose peak lies in any window [t, t + 1000). */
export function maxFlashesPerSecond(peaksMs: readonly number[]): number {
  const sorted = [...peaksMs].sort((a, b) => a - b);
  let best = 0;
  sorted.forEach((start, i) => {
    const inside = sorted.slice(i).filter((t) => t < start + 1000).length;
    best = Math.max(best, inside);
  });
  return best;
}

/** One pulse: the bloom (the flash light shares it). */
export const LOSS_FLASH_PEAKS: readonly number[] = [FX_LOSS.bloom.peakMs];
/** No flash on a win. */
export const WIN_FLASH_PEAKS: readonly number[] = [];

// --- Visible window (UX §12) ---------------------------------------------------------------

export interface WindowMeasure {
  readonly rows: number;
  readonly cols: number;
  /** Cell pitch in cells (1 + gap / cell). */
  readonly step: number;
  readonly cellPx: number;
  /** Table rim around the board, px. */
  readonly rimPx: number;
  /** The grid's layout centre in canvas px (the projection of the board centre). */
  readonly centreX: number;
  readonly centreY: number;
  /** The part of the canvas the player can see, canvas px. */
  readonly view: {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
  };
}

/**
 * The visible part of the board in scene cells, clamped to the board plus its rim. Perspective
 * is ignored (a screen height of h px is h / cos(tilt) board cells), which is close enough for
 * placing confetti and choosing the flags that hop.
 */
export function visibleWindow(m: WindowMeasure): CellWindow {
  const halfW = (m.cols * m.step) / 2 + m.rimPx / m.cellPx;
  const halfH = (m.rows * m.step) / 2 + m.rimPx / m.cellPx;
  const cos = Math.cos(rad(TILT_DEG));
  const x = (px: number) => clamp((px - m.centreX) / m.cellPx, -halfW, halfW);
  const y = (py: number) => clamp((m.centreY - py) / m.cellPx / cos, -halfH, halfH);
  return {
    left: x(m.view.left),
    right: Math.max(x(m.view.left), x(m.view.right)),
    bottom: y(m.view.bottom),
    top: Math.max(y(m.view.bottom), y(m.view.top)),
  };
}

const TILT_COS = Math.cos(rad(TILT_DEG));
const TILT_TAN = Math.tan(rad(TILT_DEG));

/**
 * A point at `height` above the board plane that appears at screen-plane position (u, v).
 * Writes `out` (scene cells; no allocation per frame) and returns it.
 */
export function screenToScene(
  u: number,
  v: number,
  height: number,
  out: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
): { x: number; y: number; z: number } {
  out.x = u;
  out.y = v / TILT_COS - height * TILT_TAN;
  out.z = height;
  return out;
}

/** Screen-plane up coordinate of a board point (orthographic approximation). */
export const screenV = (y: number, height = 0): number =>
  y * Math.cos(rad(TILT_DEG)) + height * Math.sin(rad(TILT_DEG));

// --- Particles -------------------------------------------------------------------------------

/**
 * One particle: a closed-form path, p(t) = p0 + vt·t + (v0 − vt)(1 − e^{−k t})/k + ½ a t²
 * (k → 0: p0 + v0 t + ½ a t²), plus a sideways flutter on axis 0 and a spin. Units: cells,
 * seconds; `born` and `life` in ms after the click.
 */
export interface Particle {
  born: number;
  life: number;
  p0: Vec3;
  v0: Vec3;
  terminal: Vec3;
  drag: number;
  accel: Vec3;
  spin: number; // turns per second
  phase: number; // radians
  /** Direction of the spin axis in the board plane, radians (shards). */
  twist: number;
  flutter: { amp: number; hz: number; phase: number };
  size: number;
  colour: number;
}

export interface ParticleState {
  alive: boolean;
  x: number;
  y: number;
  z: number;
  /** Spin angle in radians. */
  angle: number;
  /** 0 at birth, 1 at the end of life. */
  age: number;
  /** Seconds since birth. */
  t: number;
}

export const createParticleState = (): ParticleState => ({
  alive: false,
  x: 0,
  y: 0,
  z: 0,
  angle: 0,
  age: 0,
  t: 0,
});

function axis(p: Particle, i: 0 | 1 | 2, t: number): number {
  const v0 = p.v0[i];
  const a = p.accel[i];
  if (p.drag <= 1e-9) return p.p0[i] + v0 * t + 0.5 * a * t * t;
  const vt = p.terminal[i];
  return p.p0[i] + vt * t + ((v0 - vt) * (1 - Math.exp(-p.drag * t))) / p.drag + 0.5 * a * t * t;
}

/** Velocity on one axis (for streak orientation). */
export function velocityAt(p: Particle, i: 0 | 1 | 2, elapsedMs: number): number {
  const t = Math.max(0, (elapsedMs - p.born) / 1000);
  if (p.drag <= 1e-9) return p.v0[i] + p.accel[i] * t;
  return p.terminal[i] + (p.v0[i] - p.terminal[i]) * Math.exp(-p.drag * t) + p.accel[i] * t;
}

/** Allocation-free: writes `out`; returns whether the particle is alive at `elapsedMs`. */
export function particleAt(p: Particle, elapsedMs: number, out: ParticleState): boolean {
  const local = elapsedMs - p.born;
  out.alive = local >= 0 && local < p.life;
  if (!out.alive) return false;
  const t = local / 1000;
  const { amp, hz, phase } = p.flutter;
  out.t = t;
  out.age = local / p.life;
  out.x = axis(p, 0, t) + (amp > 0 ? amp * Math.sin(2 * Math.PI * hz * t + phase) : 0);
  out.y = axis(p, 1, t);
  out.z = axis(p, 2, t);
  out.angle = p.phase + 2 * Math.PI * p.spin * t;
  return true;
}

// --- Spawners ------------------------------------------------------------------------------

const ZERO: Vec3 = [0, 0, 0];
const NO_FLUTTER = { amp: 0, hz: 0, phase: 0 };

export interface ExplosionParticles {
  readonly fire: Particle[];
  readonly sparks: Particle[];
  readonly shards: Particle[];
  readonly smoke: Particle[];
  readonly puffs: Particle[];
}

/** Puff positions of the chain: [x, y, start ms] of the first chain mines. */
export type ChainPuffSite = readonly [x: number, y: number, startMs: number];

/** Explosion particles around `origin` (scene cells), counts from `scale`. */
export function spawnExplosion(
  seed: number,
  origin: readonly [x: number, y: number],
  scale: EffectScale,
  chainSites: readonly ChainPuffSite[] = [],
): ExplosionParticles {
  const random = rng(seed);
  const between = (a: number, b: number) => lerp(a, b, random());
  const angle = () => random() * 2 * Math.PI;
  const [ox, oy] = origin;
  const count = (base: number, factor: number) => Math.round(base * factor);

  const { fire: F, sparks: S, shards: D, smoke: M, chain: C } = FX_LOSS;
  const fire = Array.from({ length: count(F.count, scale.puffs) }, (): Particle => {
    const a = angle();
    const speed = between(0.2, 1) * F.spread;
    return {
      born: between(0, F.bornMaxMs),
      life: between(F.lifeMinMs, F.lifeMaxMs),
      p0: [ox + between(-0.2, 0.2), oy + between(-0.2, 0.2), F.z],
      v0: [Math.cos(a) * speed, Math.sin(a) * speed, between(F.riseMin, F.riseMax)],
      terminal: [0, 0, between(F.riseMin, F.riseMax) * 0.5],
      drag: 2.5,
      accel: ZERO,
      spin: between(-0.5, 0.5),
      phase: angle(),
      flutter: NO_FLUTTER,
      twist: 0,
      size: between(0.8, 1.2),
      colour: 0,
    };
  });
  const sparks = Array.from({ length: count(S.count, scale.sparks) }, (): Particle => {
    const a = angle();
    const up = rad(between(25, 70)); // elevation
    const speed = between(S.speedMin, S.speedMax);
    return {
      born: between(0, 60),
      life: between(S.lifeMinMs, S.lifeMaxMs),
      p0: [ox, oy, S.z],
      v0: [
        Math.cos(a) * Math.cos(up) * speed,
        Math.sin(a) * Math.cos(up) * speed,
        Math.sin(up) * speed,
      ],
      terminal: ZERO,
      drag: 0,
      accel: [0, 0, -S.gravity],
      spin: 0,
      phase: 0,
      flutter: NO_FLUTTER,
      twist: 0,
      size: between(0.8, 1.2),
      colour: random(),
    };
  });
  const shards = Array.from({ length: Math.min(D.count, scale.shards) }, (): Particle => {
    const a = angle();
    const off = rad(between(D.angleMinDeg, D.angleMaxDeg)); // off vertical
    const speed = between(D.speedMin, D.speedMax);
    const vz = Math.cos(off) * speed;
    const drop = D.z - D.landZ;
    // Vanish when it falls back onto the tile tops (closed form), at the latest at maxLifeMs.
    const land = ((vz + Math.sqrt(vz * vz + 2 * D.gravity * Math.max(0, drop))) / D.gravity) * 1000;
    return {
      born: 0,
      life: Math.min(D.maxLifeMs, land),
      p0: [ox + between(-0.25, 0.25), oy + between(-0.25, 0.25), D.z],
      v0: [Math.cos(a) * Math.sin(off) * speed, Math.sin(a) * Math.sin(off) * speed, vz],
      terminal: ZERO,
      drag: 0,
      accel: [0, 0, -D.gravity],
      spin: between(D.spinMin, D.spinMax) * (random() < 0.5 ? -1 : 1),
      phase: angle(),
      flutter: NO_FLUTTER,
      size: between(D.sizeMin, D.sizeMax),
      twist: angle(),
      colour: 0,
    };
  });
  const smoke = Array.from({ length: count(M.count, scale.smoke) }, (): Particle => {
    const born = M.bornMs + between(0, M.bornSpreadMs);
    const a = angle();
    return {
      born,
      life: Math.min(between(M.lifeMinMs, M.lifeMaxMs), M.endMs - born),
      p0: [ox + between(-0.3, 0.3), oy + between(-0.3, 0.3), M.z],
      v0: [Math.cos(a) * 0.3, Math.sin(a) * 0.3, M.rise * between(0.8, 1.25)],
      terminal: [Math.cos(a) * 0.15, Math.sin(a) * 0.15, M.rise],
      drag: 1,
      accel: ZERO,
      spin: between(-0.15, 0.15),
      phase: angle(),
      flutter: NO_FLUTTER,
      twist: 0,
      size: between(0.85, 1.15),
      colour: 0,
    };
  });
  const puffs = chainSites.slice(0, scale.chainPuffMines).flatMap(([x, y, start]) =>
    Array.from({ length: C.puffsPerMine }, (): Particle => {
      const a = angle();
      return {
        born: start + C.puffDelayMs + between(0, 40),
        life: C.puffLifeMs,
        p0: [x + between(-0.15, 0.15), y + between(-0.15, 0.15), 0.1],
        v0: [Math.cos(a) * 0.6, Math.sin(a) * 0.6, between(0.8, 1.4)],
        terminal: [0, 0, 0.4],
        drag: 3,
        accel: ZERO,
        spin: between(-0.3, 0.3),
        phase: angle(),
        flutter: NO_FLUTTER,
        twist: 0,
        size: between(0.85, 1.15),
        colour: 0,
      };
    }),
  );
  return { fire, sparks, shards, smoke, puffs };
}

const SHAPES = [0, 1, 2] as const; // rectangle, dot, ribbon
export type ConfettiShape = (typeof SHAPES)[number];

/** A confetti piece: path in screen-plane coordinates (u right, v up, z = height above the board). */
export interface ConfettiPiece extends Particle {
  readonly shape: ConfettiShape;
  /** Width and height in cells (before the minimum pixel size). */
  readonly w: number;
  readonly h: number;
  /** In-plane tumble, turns per second. */
  readonly tumble: number;
}

/** Number of pieces for a visible window (UX W4), before the scale. */
export function confettiCount(window: CellWindow): number {
  const cos = Math.cos(rad(TILT_DEG));
  const cells =
    Math.max(0, window.right - window.left) * Math.max(0, window.top - window.bottom) * cos;
  const { perCell, min, max } = FX_WIN.count;
  return clamp(Math.round(perCell * cells), min, max);
}

function pick(weights: readonly number[], r: number): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i] ?? 0;
    if (r < sum) return i;
  }
  return weights.length - 1;
}

/** Confetti over the visible window (UX §4): two cannons and the rain, in random order. */
export function spawnConfetti(
  seed: number,
  window: CellWindow,
  scale: EffectScale,
): ConfettiPiece[] {
  const random = rng(seed);
  const between = (a: number, b: number) => lerp(a, b, random());
  const { cannons: K, rain: R, flutter: Fl, piece: P, end: E } = FX_WIN;
  const bottom = screenV(window.bottom);
  const top = screenV(window.top);
  const rows = Math.max(1, top - bottom);
  const n = Math.round(confettiCount(window) * scale.confetti);
  const cannonSpeed = clamp(K.speedPerRow * rows, K.speedMin, K.speedMax);
  const fall = clamp((rows + 2) / R.crossS, R.fallMin, R.fallMax);

  return Array.from({ length: n }, (): ConfettiPiece => {
    const shape = SHAPES[pick(P.shapes, random())] ?? 0;
    const [w, h] = shape === 0 ? P.rect : shape === 1 ? [P.dot, P.dot] : P.ribbon;
    const flutter = {
      amp: Fl.amp * between(0.5, 1),
      hz: between(Fl.hzMin, Fl.hzMax),
      phase: random() * 2 * Math.PI,
    };
    const height = between(P.heightMin, P.heightMax);
    const common = {
      shape,
      w,
      h,
      spin: between(P.spinMin, P.spinMax) * (random() < 0.5 ? -1 : 1),
      phase: random() * 2 * Math.PI,
      tumble: between(-P.tumbleMax, P.tumbleMax),
      size: 1,
      colour: pick(P.colourWeights, random()),
      accel: ZERO,
      twist: 0,
    };
    if (random() < K.share) {
      const left = random() < 0.5;
      const inward = rad(K.angleDeg * between(1 - K.angleSpread, 1 + K.angleSpread));
      const speed = cannonSpeed * between(K.speedSpread[0], K.speedSpread[1]);
      const born = between(0, K.fireMs);
      return {
        ...common,
        born,
        life: E.scaleOutToMs - born,
        p0: [left ? window.left + K.inset : window.right - K.inset, bottom + K.inset, height],
        v0: [(left ? 1 : -1) * Math.sin(inward) * speed, Math.cos(inward) * speed, 0],
        terminal: [0, -fall * between(0.8, 1.1), 0],
        drag: K.drag,
        // Less flutter than the rain: the shot itself carries the sideways motion.
        flutter: { ...flutter, amp: flutter.amp * 0.6 },
      };
    }
    const born = between(R.bornMinMs, R.bornMaxMs);
    const v = -fall * between(0.8, 1.1);
    return {
      ...common,
      born,
      life: E.scaleOutToMs - born,
      p0: [between(window.left - R.side, window.right + R.side), top + R.above, height],
      v0: [0, v, 0],
      terminal: [0, v, 0],
      drag: R.drag,
      flutter,
    };
  });
}

/** UX W5: scale of every piece by the absolute time after the click (scale-out before the end). */
export function confettiFade(elapsedMs: number): number {
  const { scaleOutFromMs, scaleOutToMs } = FX_WIN.end;
  return 1 - clamp((elapsedMs - scaleOutFromMs) / (scaleOutToMs - scaleOutFromMs), 0, 1);
}
