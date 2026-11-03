import { describe, expect, it } from 'vitest';
import {
  changedCells,
  endOf,
  FLIP_MS,
  planTransitions,
  PLANT_MS,
  retarget,
  revealPose,
  UNPLANT_MS,
  type BoardSnapshot,
  type CellAnim,
  type CellKind,
} from './timeline.ts';

const NOW = 1000;
const MOTION = { reducedMotion: false, level: 0 } as const;

function snapshot(
  kinds: readonly CellKind[],
  phase: BoardSnapshot['phase'] = 'playing',
  gameId = 1,
) {
  return { gameId, phase, kinds };
}

/** A rows × cols board, all hidden. */
const hidden = (cells: number): CellKind[] => Array.from({ length: cells }, () => 'hidden');

describe('animation timeline', () => {
  it('AC2: a single reveal flips within 150–400 ms', () => {
    const prev = snapshot(hidden(81));
    const next = snapshot(hidden(81).map((k, i) => (i === 40 ? 'number' : k)));
    const anims = planTransitions(prev, next, 40, 9, NOW, MOTION);
    expect(anims).toHaveLength(1);
    expect(anims[0]).toMatchObject({ kind: 'reveal', index: 40, start: NOW });
    expect(FLIP_MS).toBeGreaterThanOrEqual(150);
    expect(endOf(anims) - NOW).toBeLessThanOrEqual(400);
  });

  it('AC2: a cascade starts at the origin, delays grow with distance, a 30 x 30 cascade ends within 1.2 s', () => {
    const cols = 30;
    const prev = snapshot(hidden(900));
    const next = snapshot(hidden(900).map((): CellKind => 'empty'));
    const anims = planTransitions(prev, next, 0, cols, NOW, MOTION);
    expect(anims).toHaveLength(900);
    const startOf = (index: number) => anims.find((a) => a.index === index)?.start ?? NaN;
    expect(startOf(0)).toBe(NOW);
    expect(startOf(1)).toBeGreaterThan(startOf(0));
    expect(startOf(2)).toBeGreaterThan(startOf(1));
    expect(startOf(899)).toBeGreaterThan(startOf(450));
    expect(endOf(anims) - NOW).toBeLessThanOrEqual(1200);
  });

  it('AC2: planting and removing a flag take at most 300 ms', () => {
    const prev = snapshot(hidden(25).map((k, i) => (i === 3 ? 'flagged' : k)));
    const next = snapshot(hidden(25).map((k, i) => (i === 7 ? 'flagged' : k)));
    const anims = planTransitions(prev, next, null, 5, NOW, MOTION);
    expect(anims.map((a) => [a.kind, a.index])).toEqual([
      ['unplant', 3],
      ['plant', 7],
    ]);
    expect(Math.max(PLANT_MS, UNPLANT_MS)).toBeLessThanOrEqual(300);
    expect(endOf(anims) - NOW).toBeLessThanOrEqual(300);
  });

  it('AC4: reduced motion, a new game, no previous board and the end of a game are static', () => {
    const prev = snapshot(hidden(25));
    const opened = hidden(25).map((k, i): CellKind => (i < 5 ? 'empty' : k));
    expect(
      planTransitions(prev, snapshot(opened), 0, 5, NOW, { ...MOTION, reducedMotion: true }),
    ).toEqual([]);
    expect(planTransitions(prev, snapshot(opened, 'playing', 2), 0, 5, NOW, MOTION)).toEqual([]);
    expect(planTransitions(null, snapshot(opened), 0, 5, NOW, MOTION)).toEqual([]);
    expect(planTransitions(prev, snapshot(opened, 'won'), 0, 5, NOW, MOTION)).toEqual([]);
    expect(planTransitions(prev, snapshot(opened, 'lost'), 0, 5, NOW, MOTION)).toEqual([]);
  });

  it('AC2: a change during a running animation retargets at now, nothing queues', () => {
    const empty = snapshot(hidden(25));
    const flagged = snapshot(hidden(25).map((k, i) => (i === 7 ? 'flagged' : k)));
    const plant = planTransitions(empty, flagged, null, 5, NOW, MOTION);
    const later = NOW + 50; // the plant is still running
    const unplant = planTransitions(flagged, empty, null, 5, later, MOTION);
    const running = retarget(plant, unplant, changedCells(flagged, empty), later);
    expect(running).toEqual<CellAnim[]>([
      { kind: 'unplant', index: 7, start: later, duration: UNPLANT_MS },
    ]);
  });

  it('AC3: quality level 2 sinks without flipping and keeps the same end bound', () => {
    const prev = snapshot(hidden(900));
    const next = snapshot(hidden(900).map((): CellKind => 'empty'));
    const simple = planTransitions(prev, next, 435, 30, NOW, { ...MOTION, level: 2 });
    const full = planTransitions(prev, next, 435, 30, NOW, MOTION);
    expect(endOf(simple)).toBeLessThanOrEqual(endOf(full));
    expect(new Set(simple.map((a) => a.start)).size).toBeLessThanOrEqual(4);
    const first = simple[0];
    if (first?.kind !== 'reveal') throw new Error('expected a reveal');
    expect(revealPose(first, first.start + FLIP_MS / 2).angleDeg).toBe(0);
  });
});
