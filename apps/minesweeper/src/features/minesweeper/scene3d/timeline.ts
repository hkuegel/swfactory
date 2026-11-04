import type { CellViewKind } from '../logic/cellView.ts';
import type { GamePhase } from '../logic/types.ts';
import { FX_LOSS, FX_WIN } from './effectParams.ts';
import { chainLengthMs, effectScale, mineChain } from './endPlan.ts';

/**
 * The animation timeline of the 3D board (story 009, AC2, AC4; UX §5). Pure and three-free:
 * it turns the difference between two board snapshots into per-cell animations and samples
 * their poses. Animations only change pixels; nothing here is ever read by game logic.
 */

export const FLIP_MS = 260; // AC2: 150–400 ms
export const PLANT_MS = 240; // AC2: ≤ 300 ms
export const UNPLANT_MS = 180;
export const WAVE_TOTAL_MS = 1000; // AC2: final ≤ 1.2 s after the click; 200 ms slack
export const WAVE_STEP_MAX_MS = 35;

/** Lift of a flipping tile in cell units (UX §5.1); decays across the wave, ×1.5 on the hit cell. */
export const FLIP_LIFT = 0.18;
const HIT_LIFT_FACTOR = 1.5;
const LIFT_DECAY = 0.4;
/** Quality level 2: the wave in this many distance bands instead of per cell. */
const WAVE_BANDS = 4;

export type CellKind = CellViewKind;
export type QualityLevel = 0 | 1 | 2;

export interface BoardSnapshot {
  readonly gameId: number;
  readonly phase: GamePhase;
  readonly kinds: readonly CellKind[];
  /** The mine revealed on a loss (story 010); null otherwise. */
  readonly explodedIndex: number | null;
}

/** Story 010, UX L11: a chain mine flips in this time (inside the 009 AC2 range 150–400 ms). */
export const CHAIN_FLIP_MS = FX_LOSS.chain.flipMs;

interface TimedAnim<K extends string> {
  readonly kind: K;
  readonly index: number;
  readonly start: number;
  readonly duration: number;
}

export type CellAnim =
  | {
      readonly kind: 'reveal';
      readonly index: number;
      readonly start: number;
      readonly duration: number;
      /** false at quality level 2: sink only. */
      readonly flip: boolean;
      /** Peak lift in cell units. */
      readonly lift: number;
    }
  | {
      readonly kind: 'plant' | 'unplant';
      readonly index: number;
      readonly start: number;
      readonly duration: number;
    }
  // Story 010 decorations: drawn on top of the cell's own pose.
  /** Exploded disc and ring, then the flat mine pop in (UX L10); scale 0 before. */
  | TimedAnim<'marker'>
  /** A wrong-flag slash draws on (UX L12). */
  | TimedAnim<'slash'>
  /** A planted flag hops (UX W6). */
  | TimedAnim<'hop'>
  | {
      /** A hidden tile hops when the shock ring passes (UX L9). */
      readonly kind: 'shudder';
      readonly index: number;
      readonly start: number;
      readonly duration: number;
      readonly amplitude: number;
    };

/** Animations that replace a cell's pose (one per cell) and decorations on top of it. */
export type PoseAnim = Extract<CellAnim, { kind: 'reveal' | 'plant' | 'unplant' }>;
export type DecorationAnim = Exclude<CellAnim, PoseAnim>;
export const isDecoration = (anim: CellAnim): anim is DecorationAnim =>
  anim.kind === 'marker' || anim.kind === 'slash' || anim.kind === 'hop' || anim.kind === 'shudder';

const isCovered = (kind: CellKind | undefined) => kind === 'hidden' || kind === 'flagged';
const isOpen = (kind: CellKind | undefined) => kind === 'empty' || kind === 'number';
const isEnded = (phase: GamePhase) => phase === 'won' || phase === 'lost';

/** Indices whose kind differs between two snapshots of the same game. */
export function changedCells(prev: BoardSnapshot | null, next: BoardSnapshot): Set<number> {
  const changed = new Set<number>();
  if (prev === null || prev.gameId !== next.gameId) return changed;
  next.kinds.forEach((kind, index) => {
    if (prev.kinds[index] !== kind) changed.add(index);
  });
  return changed;
}

export interface PlanOptions {
  readonly reducedMotion: boolean;
  readonly level: QualityLevel;
  /** Story 010: flags in the visible part hop on a win; null = every cell is visible. */
  readonly isVisible?: ((index: number) => boolean) | null | undefined;
}

/**
 * Animations for prev → next; [] under reduced motion, for a new game and for `prev` null (first
 * attach, switching to 3D: no replay, story 010 AC3). The end of a game plays the story 010
 * cell animations: on a loss the mine chain, the exploded marker, the wrong-flag slashes and the
 * tile shudder; on a win the normal reveal wave and flag planting plus the flag hop wave.
 */
export function planTransitions(
  prev: BoardSnapshot | null,
  next: BoardSnapshot,
  origin: number | null,
  cols: number,
  nowMs: number,
  options: PlanOptions,
): CellAnim[] {
  if (options.reducedMotion || prev === null || prev.gameId !== next.gameId) return [];
  const ends = isEnded(next.phase) && !isEnded(prev.phase);
  if (ends && next.phase === 'lost') return planLoss(prev, next, cols, nowMs, options);

  const anims = planChanges(prev, next, origin, cols, nowMs, options.level);
  if (ends && next.phase === 'won') anims.push(...planHops(next, origin, cols, nowMs, options));
  return anims;
}

const distanceIn = (cols: number, from: number) => {
  const fr = Math.floor(from / cols);
  const fc = from % cols;
  return (index: number) => Math.hypot(Math.floor(index / cols) - fr, (index % cols) - fc);
};

/** The reveal wave and flag plants of 009 (unchanged). */
function planChanges(
  prev: BoardSnapshot,
  next: BoardSnapshot,
  origin: number | null,
  cols: number,
  nowMs: number,
  level: QualityLevel,
): CellAnim[] {
  const anims: CellAnim[] = [];
  const revealed: number[] = [];
  next.kinds.forEach((kind, index) => {
    const before = prev.kinds[index];
    if (isCovered(before) && isOpen(kind)) revealed.push(index);
    else if (before === 'hidden' && kind === 'flagged') {
      anims.push({ kind: 'plant', index, start: nowMs, duration: PLANT_MS });
    } else if (before === 'flagged' && kind === 'hidden') {
      anims.push({ kind: 'unplant', index, start: nowMs, duration: UNPLANT_MS });
    }
  });
  if (revealed.length === 0) return anims;

  const at = (index: number) => ({ row: Math.floor(index / cols), col: index % cols });
  const centre =
    origin !== null
      ? at(origin)
      : {
          row: revealed.reduce((sum, i) => sum + at(i).row, 0) / revealed.length,
          col: revealed.reduce((sum, i) => sum + at(i).col, 0) / revealed.length,
        };
  const distance = (index: number) => {
    const { row, col } = at(index);
    return Math.hypot(row - centre.row, col - centre.col);
  };
  const maxDistance = Math.max(...revealed.map(distance));
  const step =
    maxDistance > 0 ? Math.min(WAVE_STEP_MAX_MS, (WAVE_TOTAL_MS - FLIP_MS) / maxDistance) : 0;
  const simple = level === 2;

  for (const index of revealed) {
    const d = distance(index);
    const delay = simple
      ? maxDistance > 0
        ? (Math.min(WAVE_BANDS - 1, Math.floor((d / maxDistance) * WAVE_BANDS)) /
            (WAVE_BANDS - 1)) *
          maxDistance *
          step
        : 0
      : d * step;
    const decay = maxDistance > 0 ? 1 - (LIFT_DECAY * d) / maxDistance : 1;
    const hit = index === origin ? HIT_LIFT_FACTOR : 1;
    anims.push({
      kind: 'reveal',
      index,
      start: nowMs + delay,
      duration: FLIP_MS,
      flip: !simple,
      lift: simple ? 0 : FLIP_LIFT * decay * hit,
    });
  }
  return anims;
}

/** Story 010 AC1: chain, marker, slashes and shudder (UX §3, L9 to L12). */
function planLoss(
  prev: BoardSnapshot,
  next: BoardSnapshot,
  cols: number,
  nowMs: number,
  options: PlanOptions,
): CellAnim[] {
  const exploded = next.explodedIndex;
  if (exploded === null) return [];
  const { chain, marker, wrongFlags, shudder } = FX_LOSS;
  const anims: CellAnim[] = [];
  const mines = next.kinds.flatMap((kind, index) =>
    kind === 'mine' && isCovered(prev.kinds[index]) ? [index] : [],
  );
  const steps = mineChain(exploded, mines, cols, options.level);
  const simple = options.level === 2;
  for (const step of steps) {
    anims.push({
      kind: 'reveal',
      index: step.index,
      start: nowMs + chain.startMs + step.delayMs,
      duration: CHAIN_FLIP_MS,
      flip: !simple,
      lift: simple ? 0 : FLIP_LIFT,
    });
  }
  anims.push({
    kind: 'marker',
    index: exploded,
    start: nowMs,
    duration: marker.mineStartMs + marker.durationMs,
  });

  const distance = distanceIn(cols, exploded);
  const wrong = next.kinds
    .flatMap((kind, index) => (kind === 'flagWrong' ? [index] : []))
    .sort((a, b) => distance(a) - distance(b) || a - b);
  const slashStart = chain.startMs + chainLengthMs(steps.length) + wrongFlags.gapMs;
  const slashStep =
    wrong.length > 1 ? Math.min(chain.stepMs, wrongFlags.spreadMaxMs / (wrong.length - 1)) : 0;
  wrong.forEach((index, i) => {
    anims.push({
      kind: 'slash',
      index,
      start: nowMs + slashStart + i * slashStep,
      duration: wrongFlags.durationMs,
    });
  });

  if (effectScale(next.kinds.length, options.level).shudder) {
    next.kinds.forEach((kind, index) => {
      const d = distance(index);
      if (index === exploded || d > shudder.radius) return;
      if (kind !== 'hidden' && kind !== 'flagged' && kind !== 'mine') return;
      anims.push({
        kind: 'shudder',
        index,
        start: nowMs + (d / shudder.speed) * 1000,
        duration: shudder.durationMs,
        amplitude: shudder.height * (1 - d / shudder.radius),
      });
    });
  }
  return anims;
}

/** Story 010 AC2: planted flags in the visible part hop one after another (UX W6). */
function planHops(
  next: BoardSnapshot,
  origin: number | null,
  cols: number,
  nowMs: number,
  options: PlanOptions,
): CellAnim[] {
  if (!effectScale(next.kinds.length, options.level).hop) return [];
  const { hop } = FX_WIN;
  const distance = distanceIn(cols, origin ?? 0);
  const visible = options.isVisible ?? (() => true);
  const flags = next.kinds
    .flatMap((kind, index) => (kind === 'flagged' && visible(index) ? [index] : []))
    .sort((a, b) => distance(a) - distance(b) || a - b);
  const step = flags.length > 1 ? hop.spreadMs / (flags.length - 1) : 0;
  return flags.map((index, i) => ({
    kind: 'hop' as const,
    index,
    start: nowMs + hop.startMs + i * step,
    duration: hop.upMs + hop.downMs,
  }));
}

/**
 * The running animations after a state change: a cell that changed again drops its old
 * animation (retargeting at `now`, nothing queues), finished ones are removed, new ones added.
 */
export function retarget(
  running: readonly CellAnim[],
  planned: readonly CellAnim[],
  changed: ReadonlySet<number>,
  nowMs: number,
): CellAnim[] {
  return [
    ...running.filter((anim) => !changed.has(anim.index) && !hasEnded(anim, nowMs)),
    ...planned,
  ];
}

/** 0 = start pose, 1 = final pose; clamps; pure. */
export function progress(anim: CellAnim, nowMs: number): number {
  return Math.min(1, Math.max(0, (nowMs - anim.start) / anim.duration));
}

export function hasEnded(anim: CellAnim, nowMs: number): boolean {
  return nowMs >= anim.start + anim.duration;
}

/** The time the last animation ends (AC2 bound; AC4 "ends by itself"). */
export function endOf(anims: readonly CellAnim[]): number {
  return anims.reduce((end, anim) => Math.max(end, anim.start + anim.duration), -Infinity);
}

// Easing (UX §5)
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
export const easeInQuad = (t: number) => t * t;
export const easeInCubic = (t: number) => t * t * t;
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const easeOutBack = (t: number, overshoot: number) =>
  1 + (overshoot + 1) * (t - 1) ** 3 + overshoot * (t - 1) ** 2;

/** Pose of a revealing tile (UX §5.1). */
export interface RevealPose {
  /** Rotation about the tile's x axis, degrees (the far edge rises over the top). */
  readonly angleDeg: number;
  /** Extra centre height in cell units. */
  readonly lift: number;
  /** 0 = hidden level, 1 = revealed level (overshoots a little: the "thud"). */
  readonly sink: number;
  /** Past edge-on: revealed colour and material, glyph visible. */
  readonly swapped: boolean;
  /** Scale of the digit or glyph (0 before the swap). */
  readonly glyphScale: number;
}

export function revealPose(anim: Extract<CellAnim, { kind: 'reveal' }>, nowMs: number): RevealPose {
  const p = progress(anim, nowMs);
  const swapped = p >= 0.5;
  return {
    angleDeg: anim.flip ? 180 * easeInOutCubic(p) : 0,
    lift: anim.lift * Math.sin(Math.PI * p),
    sink: easeOutBack(clamp01((p - 0.35) / 0.65), 1.0),
    swapped,
    glyphScale: !swapped ? 0 : anim.flip ? 0.6 + 0.4 * easeOutBack((p - 0.5) / 0.5, 1.4) : 1,
  };
}

/** Pose of a flag (UX §5.3), in cell units. */
export interface FlagPose {
  /** Offset along the pole axis (positive = above its base position). */
  readonly drop: number;
  /** Extra height for the removal. */
  readonly rise: number;
  /** Uniform scale about the base. */
  readonly scale: number;
  /** Scale of the cloth along x, anchored at the pole. */
  readonly clothScale: number;
}

export const FLAG_AT_REST: FlagPose = { drop: 0, rise: 0, scale: 1, clothScale: 1 };

export function flagPose(
  anim: Extract<CellAnim, { kind: 'plant' | 'unplant' }>,
  nowMs: number,
): FlagPose {
  const p = progress(anim, nowMs);
  if (anim.kind === 'unplant') {
    return { drop: 0, rise: 0.35 * easeInQuad(p), scale: 1 - easeInCubic(p), clothScale: 1 };
  }
  return {
    drop:
      p < 0.6 ? 0.6 * (1 - easeInQuad(p / 0.6)) : -0.035 * Math.sin((Math.PI * (p - 0.6)) / 0.4),
    rise: 0,
    scale: 1,
    clothScale: p < 0.55 ? 0.2 : 0.2 + 0.8 * easeOutBack((p - 0.55) / 0.45, 1.6),
  };
}

// Story 010 decoration poses -----------------------------------------------------------------

const popIn = (elapsed: number, duration: number, from: number, overshoot: number) =>
  elapsed < 0
    ? 0
    : elapsed >= duration
      ? 1
      : from + (1 - from) * easeOutBack(elapsed / duration, overshoot);

/** Scales of the exploded disc and ring and of its flat mine (UX L10). */
export function markerPose(
  anim: Extract<CellAnim, { kind: 'marker' }>,
  nowMs: number,
): { readonly disc: number; readonly mine: number } {
  const { discStartMs, mineStartMs, durationMs, from, overshoot } = FX_LOSS.marker;
  const elapsed = nowMs - anim.start;
  return {
    disc: popIn(elapsed - discStartMs, durationMs, from, overshoot),
    mine: popIn(elapsed - mineStartMs, durationMs, from, overshoot),
  };
}

/** Length scale of a wrong-flag slash drawing on (UX L12): 0 before, overshoots, then 1. */
export function slashScale(anim: Extract<CellAnim, { kind: 'slash' }>, nowMs: number): number {
  const elapsed = nowMs - anim.start;
  return popIn(elapsed, anim.duration, 0, FX_LOSS.wrongFlags.overshoot);
}

/** Extra height of a tile hit by the shock ring (UX L9): fast up, slower back. */
export function shudderLift(anim: Extract<CellAnim, { kind: 'shudder' }>, nowMs: number): number {
  const p = (nowMs - anim.start) / anim.duration;
  if (p <= 0 || p >= 1) return 0;
  return anim.amplitude * Math.sin(Math.PI * (1 - (1 - p) ** 2));
}

/** Extra height of a hopping flag (UX W6): ease-out up, ease-in down. */
export function hopRise(anim: Extract<CellAnim, { kind: 'hop' }>, nowMs: number): number {
  const { height, upMs, downMs } = FX_WIN.hop;
  const t = nowMs - anim.start;
  if (t <= 0 || t >= upMs + downMs) return 0;
  if (t < upMs) return height * (1 - (1 - t / upMs) ** 2);
  return height * (1 - ((t - upMs) / downMs) ** 2);
}
