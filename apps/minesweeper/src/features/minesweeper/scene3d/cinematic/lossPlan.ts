import { rng } from '../endPlan.ts';

/**
 * The extra effects of a lost game in the cinematic view (story 050, AC5), added to the explosion
 * of story 010: a shockwave that travels across the whole board and lifts the covered tiles as it
 * passes, and debris that is thrown out of the pit. Pure and three-free; closed-form in the time
 * since the click, so a late frame already shows the right picture.
 */

export const SHOCK = {
  /** Travel speed of the front, cells per second. */
  speed: 30,
  /** Half width of the lifted band, cells. */
  width: 2.2,
  /** Peak lift of a covered tile, cells (the tile top is at 0.15, a tile is 1 wide). */
  amplitude: 0.2,
  /** The lift falls off with the distance from the pit: 1 / (1 + decay · d). */
  decay: 0.04,
  /** The wave never runs longer than this (the loss effect ends at 2200 ms). */
  maxMs: 1600,
  /** Height of the visible ring above the board plane, cells. */
  ringZ: 0.25,
} as const;

/** Distance the front has travelled `elapsedMs` after the click. */
export const shockRadius = (elapsedMs: number): number => (SHOCK.speed * elapsedMs) / 1000;

/** When the last tile at `maxDistance` has been passed (capped). */
export function shockEndMs(maxDistance: number): number {
  return Math.min(SHOCK.maxMs, ((maxDistance + 3 * SHOCK.width) / SHOCK.speed) * 1000);
}

/** Lift of a covered tile at `distance` cells from the pit, `elapsedMs` after the click. */
export function shockLift(distance: number, elapsedMs: number): number {
  const offset = (distance - shockRadius(elapsedMs)) / SHOCK.width;
  if (offset < -3 || offset > 3) return 0;
  return (SHOCK.amplitude * Math.exp(-offset * offset)) / (1 + SHOCK.decay * distance);
}

export const DEBRIS = {
  count: 28,
  speedMin: 6,
  speedMax: 14,
  /** Elevation of the throw above the board, degrees. */
  elevationMinDeg: 35,
  elevationMaxDeg: 78,
  sizeMin: 0.14,
  sizeMax: 0.3,
  gravity: 26,
  spinMin: 2,
  spinMax: 9,
  startZ: 0.1,
  /** A piece is gone when it falls back to the covered tiles' height. */
  landZ: 0.15,
  maxMs: 1500,
  scaleOutMs: 140,
} as const;

export interface DebrisPiece {
  readonly dx: number;
  readonly dy: number;
  readonly vh: number;
  readonly vz: number;
  readonly size: number;
  readonly spin: number;
  readonly axis: readonly [number, number, number];
  readonly bornMs: number;
}

/** Pieces for a particle share (board size and quality level): never fewer than 8. */
export function planDebris(seed: number, share: number): DebrisPiece[] {
  const next = rng(seed ^ 912149);
  const count = Math.max(8, Math.round(DEBRIS.count * Math.min(1, share)));
  const pieces: DebrisPiece[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI + 0.5 * next();
    const elevation =
      ((DEBRIS.elevationMinDeg + (DEBRIS.elevationMaxDeg - DEBRIS.elevationMinDeg) * next()) *
        Math.PI) /
      180;
    const speed = DEBRIS.speedMin + (DEBRIS.speedMax - DEBRIS.speedMin) * next();
    const tilt = next() * 2 * Math.PI;
    pieces.push({
      dx: Math.cos(angle),
      dy: Math.sin(angle),
      vh: speed * Math.cos(elevation),
      vz: speed * Math.sin(elevation),
      size: DEBRIS.sizeMin + (DEBRIS.sizeMax - DEBRIS.sizeMin) * next(),
      spin: DEBRIS.spinMin + (DEBRIS.spinMax - DEBRIS.spinMin) * next(),
      axis: [Math.cos(tilt), Math.sin(tilt), 0.4],
      bornMs: 20 * next(),
    });
  }
  return pieces;
}

/**
 * Position of a piece relative to the pit `elapsedMs` after the click, scale 0..1 (it shrinks
 * away just before it lands) and spin angle; false when it has landed or time ran out.
 */
export function debrisAt(
  piece: DebrisPiece,
  elapsedMs: number,
  out: { x: number; y: number; z: number; scale: number; angle: number },
): boolean {
  const t = (elapsedMs - piece.bornMs) / 1000;
  if (t < 0 || elapsedMs >= DEBRIS.maxMs) return false;
  const z = DEBRIS.startZ + piece.vz * t - 0.5 * DEBRIS.gravity * t * t;
  if (z < DEBRIS.landZ && t > 0.05) return false;
  out.x = piece.dx * piece.vh * t;
  out.y = piece.dy * piece.vh * t;
  out.z = z;
  out.scale = 1;
  out.angle = piece.spin * t;
  // Scale out over the last part of the flight (the time until z drops under the landing height).
  const fall =
    (piece.vz +
      Math.sqrt(piece.vz * piece.vz + 2 * DEBRIS.gravity * (DEBRIS.startZ - DEBRIS.landZ))) /
    DEBRIS.gravity;
  const left = (fall - t) * 1000;
  if (left < DEBRIS.scaleOutMs) out.scale = Math.max(0, left / DEBRIS.scaleOutMs);
  return true;
}
