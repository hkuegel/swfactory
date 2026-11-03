import { seededRandom } from '@swfactory/platform/lib/seededRandom';
import { neighbours } from './grid.ts';
import { adjacentCounts, placeMines } from './placeMines.ts';
import type { CellState, GameAction, GameConfig, GameState } from './types.ts';

function checkFixedMines(fixedMines: readonly number[], config: GameConfig): void {
  const total = config.rows * config.cols;
  const unique = new Set(fixedMines);
  const valid =
    fixedMines.length === config.mines &&
    unique.size === fixedMines.length &&
    fixedMines.every((i) => Number.isInteger(i) && i >= 0 && i < total);
  if (!valid) {
    // Test-only input (e2e/unit), so fail fast instead of guessing.
    throw new Error(`gameReducer: invalid fixedMines for a ${config.rows}×${config.cols} board`);
  }
}

function startState(
  previous: GameState | null,
  action: Extract<GameAction, { type: 'start' }>,
): GameState {
  const { config, seed, fixedMines } = action;
  if (fixedMines) checkFixedMines(fixedMines, config);
  return {
    id: (previous?.id ?? 0) + 1,
    config,
    phase: 'ready',
    seed,
    fixedMines: fixedMines ?? null,
    mines: null,
    adjacent: null,
    cells: new Array<CellState>(config.rows * config.cols).fill('hidden'),
    revealedCount: 0,
    flagCount: 0,
    explodedIndex: null,
    startedAt: null,
    endedAt: null,
  };
}

function minesFor(state: GameState, firstIndex: number): boolean[] {
  const { config, fixedMines } = state;
  if (fixedMines) {
    const mines = new Array<boolean>(config.rows * config.cols).fill(false);
    fixedMines.forEach((i) => (mines[i] = true));
    return mines;
  }
  return placeMines(config, firstIndex, seededRandom(state.seed));
}

function reveal(state: GameState, index: number, now: number): GameState {
  if (state.phase === 'won' || state.phase === 'lost' || state.cells[index] !== 'hidden') {
    return state;
  }
  const { rows, cols, mines: mineCount } = state.config;
  let { mines, adjacent } = state;
  if (!mines || !adjacent) {
    mines = minesFor(state, index);
    adjacent = adjacentCounts(mines, rows, cols);
  }

  // Only a reveal can leave `ready`, so the first one starts the timer; flags never do (AC3).
  const startedAt = state.startedAt ?? now;

  if (mines[index]) {
    return {
      ...state,
      mines,
      adjacent,
      phase: 'lost',
      explodedIndex: index,
      startedAt,
      endedAt: now,
    };
  }

  // Iterative flood fill (AC5): no recursion, O(cells). Only zero-count cells expand, so
  // mines are never reached; flagged cells are skipped.
  const cells = [...state.cells];
  let revealedCount = state.revealedCount;
  const stack = [index];
  for (let j = stack.pop(); j !== undefined; j = stack.pop()) {
    if (cells[j] !== 'hidden') continue;
    cells[j] = 'revealed';
    revealedCount++;
    if (adjacent[j] === 0) {
      for (const n of neighbours(j, rows, cols)) {
        if (cells[n] === 'hidden') stack.push(n);
      }
    }
  }

  if (revealedCount === rows * cols - mineCount) {
    const minesOnly = mines;
    return {
      ...state,
      mines,
      adjacent,
      phase: 'won',
      cells: cells.map((cell, i) => (minesOnly[i] ? 'flagged' : cell)),
      revealedCount,
      flagCount: mineCount,
      startedAt,
      endedAt: now,
    };
  }
  return { ...state, mines, adjacent, phase: 'playing', cells, revealedCount, startedAt };
}

function toggleFlag(state: GameState, index: number): GameState {
  if (state.phase === 'won' || state.phase === 'lost') return state;
  const cell = state.cells[index];
  if (cell !== 'hidden' && cell !== 'flagged') return state;
  const cells = [...state.cells];
  cells[index] = cell === 'hidden' ? 'flagged' : 'hidden';
  return { ...state, cells, flagCount: state.flagCount + (cell === 'hidden' ? 1 : -1) };
}

/**
 * Pure game state machine. Must stay deterministic (StrictMode calls reducers twice): the
 * random seed comes in with `start`. Actions that don't apply return the same state object.
 */
export function gameReducer(state: GameState | null, action: GameAction): GameState | null {
  switch (action.type) {
    case 'start':
      return startState(state, action);
    case 'reveal':
      return state && reveal(state, action.index, action.now);
    case 'toggleFlag':
      return state && toggleFlag(state, action.index);
  }
}
