import { describe, expect, it } from 'vitest';
import { FX_GENERAL, FX_WIN } from './effectParams.ts';
import {
  CHAIN_FLIP_MS,
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
  explodedIndex: number | null = null,
): BoardSnapshot {
  return { gameId, phase, kinds, explodedIndex };
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

  it('AC4: reduced motion, a new game and no previous board are static (story 010 AC3, AC4: also at the end of a game)', () => {
    const prev = snapshot(hidden(25));
    const opened = hidden(25).map((k, i): CellKind => (i < 5 ? 'empty' : k));
    const reduced = { ...MOTION, reducedMotion: true };
    expect(planTransitions(prev, snapshot(opened), 0, 5, NOW, reduced)).toEqual([]);
    expect(planTransitions(prev, snapshot(opened, 'playing', 2), 0, 5, NOW, MOTION)).toEqual([]);
    expect(planTransitions(null, snapshot(opened), 0, 5, NOW, MOTION)).toEqual([]);
    for (const phase of ['won', 'lost'] as const) {
      const ended = snapshot(opened, phase, 1, phase === 'lost' ? 0 : null);
      expect(planTransitions(prev, ended, 0, 5, NOW, reduced)).toEqual([]);
      expect(planTransitions(null, ended, 0, 5, NOW, MOTION)).toEqual([]);
    }
  });

  // 9 x 9: mines at 0, 2, 4, 40, 44, 80; 22 flagged mine, 30 wrong flag; 40 explodes.
  const lossBoards = () => {
    const before = hidden(81).map((k, i): CellKind => (i === 22 || i === 30 ? 'flagged' : k));
    const after = before.map((k, i): CellKind => {
      if (i === 40) return 'mineExploded';
      if (i === 30) return 'flagWrong';
      return [0, 2, 4, 44, 80].includes(i) ? 'mine' : k;
    });
    return { prev: snapshot(before), next: snapshot(after, 'lost', 1, 40) };
  };

  it('story 010 AC1: a loss flips every other mine after the bang, nearest first, pops the marker and draws the slashes, all before the effect end', () => {
    const { prev, next } = lossBoards();
    const anims = planTransitions(prev, next, 40, 9, NOW, MOTION);
    const reveals = anims.filter((a) => a.kind === 'reveal');
    expect(reveals.map((a) => a.index).sort((a, b) => a - b)).toEqual([0, 2, 4, 44, 80]);
    expect(reveals.every((a) => a.duration === CHAIN_FLIP_MS)).toBe(true);
    const startOf = (index: number) => reveals.find((a) => a.index === index)?.start ?? NaN;
    expect(startOf(44)).toBeLessThan(startOf(80)); // 4 cells away before 4.5
    expect(startOf(44)).toBeGreaterThan(NOW); // after the bang
    expect(anims.filter((a) => a.kind === 'marker').map((a) => a.index)).toEqual([40]);
    expect(anims.filter((a) => a.kind === 'slash').map((a) => a.index)).toEqual([30]);
    expect(anims.some((a) => a.index === 40 && a.kind === 'reveal')).toBe(false);
    expect(anims.filter((a) => a.kind === 'shudder').length).toBeGreaterThan(0);
    expect(endOf(anims) - NOW).toBeLessThanOrEqual(FX_GENERAL.lossEndMs);
  });

  it('story 010 AC1/AC3: level 2 chain sinks without flipping, has no shudder; a loss seen later is static', () => {
    const { prev, next } = lossBoards();
    const simple = planTransitions(prev, next, 40, 9, NOW, { ...MOTION, level: 2 });
    const reveals = simple.filter((a) => a.kind === 'reveal');
    expect(reveals.length).toBe(5);
    expect(reveals.every((a) => !a.flip)).toBe(true);
    expect(simple.some((a) => a.kind === 'shudder')).toBe(false);
    expect(planTransitions(next, next, null, 9, NOW, MOTION)).toEqual([]);
  });

  it('story 010 AC2: a win plays the reveal wave and the plants, then the visible flags hop one after another', () => {
    const prev = snapshot(
      hidden(25).map((k, i): CellKind => (i === 3 ? 'flagged' : i < 12 ? k : 'empty')),
    );
    const won = snapshot(
      prev.kinds.map((_, i): CellKind => (i === 3 || i === 7 ? 'flagged' : 'empty')),
      'won',
    );
    const visible = (index: number) => index !== 7;
    const anims = planTransitions(prev, won, 0, 5, NOW, { ...MOTION, isVisible: visible });
    expect(anims.some((a) => a.kind === 'reveal' && a.index === 0)).toBe(true);
    expect(anims.filter((a) => a.kind === 'plant').map((a) => a.index)).toEqual([7]);
    const hops = anims.filter((a) => a.kind === 'hop');
    expect(hops.map((a) => a.index)).toEqual([3]); // 7 is outside the visible part
    expect(hops[0]?.start).toBe(NOW + FX_WIN.hop.startMs);
    expect(endOf(anims) - NOW).toBeLessThanOrEqual(FX_GENERAL.winEndMs);
    expect(
      planTransitions(prev, won, 0, 5, NOW, { ...MOTION, level: 2 }).some((a) => a.kind === 'hop'),
    ).toBe(false);
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
