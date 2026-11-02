import { describe, expect, it } from 'vitest';
import { seededRandom } from '../../../lib/seededRandom.ts';
import { neighbours, toIndex } from './grid.ts';
import { adjacentCounts, placeMines } from './placeMines.ts';

const mineIndices = (mines: readonly boolean[]) =>
  mines.flatMap((isMine, i) => (isMine ? [i] : []));

describe('placeMines', () => {
  it.each([
    ['centre', toIndex(4, 4, 9)],
    ['edge', toIndex(0, 4, 9)],
    ['corner', toIndex(8, 8, 9)],
  ])('AC5: places the exact count and never in the 3 × 3 zone (%s)', (_, safe) => {
    for (let seed = 0; seed < 20; seed++) {
      const mines = placeMines({ rows: 9, cols: 9, mines: 30 }, safe, seededRandom(seed));
      expect(mines).toHaveLength(81);
      expect(mineIndices(mines)).toHaveLength(30);
      for (const i of [safe, ...neighbours(safe, 9, 9)]) expect(mines[i]).toBe(false);
    }
  });

  it('AC5: the same seed gives the same layout', () => {
    const config = { rows: 16, cols: 30, mines: 99 };
    const a = placeMines(config, 0, seededRandom(42));
    const b = placeMines(config, 0, seededRandom(42));
    const c = placeMines(config, 0, seededRandom(43));
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it('AC5: maximum density fills every cell outside the zone', () => {
    const safe = toIndex(2, 2, 5);
    const mines = placeMines({ rows: 5, cols: 5, mines: 16 }, safe, seededRandom(7));
    const zone = new Set([safe, ...neighbours(safe, 5, 5)]);
    mines.forEach((isMine, i) => expect(isMine).toBe(!zone.has(i)));
  });

  it('AC4: counts the mines among the 8 neighbours', () => {
    // Mines at (0,0) and (1,1) on 5 × 5.
    const mines = new Array<boolean>(25).fill(false);
    mines[toIndex(0, 0, 5)] = true;
    mines[toIndex(1, 1, 5)] = true;
    const counts = adjacentCounts(mines, 5, 5);
    expect(counts[toIndex(0, 1, 5)]).toBe(2);
    expect(counts[toIndex(2, 2, 5)]).toBe(1);
    expect(counts[toIndex(4, 4, 5)]).toBe(0);
  });
});
