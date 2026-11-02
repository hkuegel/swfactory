import { neighbours } from './grid.ts';
import type { GameConfig } from './types.ts';

/**
 * Places `config.mines` mines at random, never on `safeIndex` or its neighbours (AC5).
 * Partial Fisher–Yates over the candidates; `mines <= rows * cols - 9` guarantees enough.
 */
export function placeMines(config: GameConfig, safeIndex: number, random: () => number): boolean[] {
  const total = config.rows * config.cols;
  const safe = new Set([safeIndex, ...neighbours(safeIndex, config.rows, config.cols)]);
  const candidates: number[] = [];
  for (let i = 0; i < total; i++) {
    if (!safe.has(i)) candidates.push(i);
  }
  if (config.mines > candidates.length) {
    throw new Error(`placeMines: ${config.mines} mines do not fit outside the safe zone`);
  }

  const mines = new Array<boolean>(total).fill(false);
  for (let k = 0; k < config.mines; k++) {
    const pick = k + Math.floor(random() * (candidates.length - k));
    // Both indices are < candidates.length, checked above.
    const chosen = candidates[pick] ?? 0;
    candidates[pick] = candidates[k] ?? 0;
    candidates[k] = chosen;
    mines[chosen] = true;
  }
  return mines;
}

/** Number of mines among the 8 neighbours of every cell. */
export function adjacentCounts(mines: readonly boolean[], rows: number, cols: number): number[] {
  return mines.map(
    (_, index) => neighbours(index, rows, cols).filter((n) => mines[n] === true).length,
  );
}
