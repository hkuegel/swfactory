import { describe, expect, it } from 'vitest';
import { cellView } from './cellView.ts';
import { gameReducer } from './gameReducer.ts';
import { toIndex } from './grid.ts';
import type { GameAction, GameState } from './types.ts';

const ROWS = 5;
const COLS = 5;
const at = (row: number, col: number) => toIndex(row, col, COLS);

/**
 * 5 × 5 layout with mines at (3,3), (3,4), (4,3). (4,4) is safe but enclosed by mines, so a
 * flood fill from the top left reveals 21 cells and the game goes on.
 */
const MINES = [at(3, 3), at(3, 4), at(4, 3)];

function run(state: GameState | null, ...actions: GameAction[]): GameState {
  const result = actions.reduce(gameReducer, state);
  if (!result) throw new Error('no game');
  return result;
}

function startFixed(mines: readonly number[] = MINES): GameState {
  return run(null, {
    type: 'start',
    config: { rows: ROWS, cols: COLS, mines: mines.length },
    seed: 1,
    fixedMines: mines,
  });
}

const reveal = (index: number, now = 0): GameAction => ({ type: 'reveal', index, now });
const flag = (index: number): GameAction => ({ type: 'toggleFlag', index });

describe('gameReducer', () => {
  it('AC2: start creates a fresh board with all cells hidden, also over a running game', () => {
    const first = startFixed();
    expect(first).toMatchObject({ id: 1, phase: 'ready', revealedCount: 0, flagCount: 0 });
    expect(first.cells).toHaveLength(25);
    expect(first.cells.every((c) => c === 'hidden')).toBe(true);

    const played = run(first, reveal(at(0, 0)), flag(at(4, 4)));
    const next = run(played, {
      type: 'start',
      config: { rows: 6, cols: 7, mines: 5 },
      seed: 2,
    });
    expect(next).toMatchObject({ id: 2, phase: 'ready', revealedCount: 0, flagCount: 0 });
    expect(next.cells).toHaveLength(42);
    expect(next.cells.every((c) => c === 'hidden')).toBe(true);
    expect(next.mines).toBeNull();
  });

  it('AC4: reveals a numbered cell alone; revealing it again changes nothing', () => {
    const state = run(startFixed(), reveal(at(2, 3)));
    expect(cellView(state, at(2, 3))).toEqual({ kind: 'number', count: 2 });
    expect(state.revealedCount).toBe(1);
    expect(state.phase).toBe('playing');
    expect(gameReducer(state, reveal(at(2, 3)))).toBe(state);
  });

  it('AC5: flood fill opens zeros and their numbered border, but not flagged cells', () => {
    const state = run(startFixed(), reveal(at(0, 0)));
    expect(cellView(state, at(0, 0))).toEqual({ kind: 'empty' });
    expect(cellView(state, at(2, 2))).toEqual({ kind: 'number', count: 1 });
    expect(cellView(state, at(4, 4))).toEqual({ kind: 'hidden' });
    expect(state.revealedCount).toBe(21);
    expect(state.phase).toBe('playing');

    const flagged = run(startFixed(), flag(at(1, 1)), reveal(at(0, 0)));
    expect(flagged.cells[at(1, 1)]).toBe('flagged');
    expect(flagged.revealedCount).toBe(20);
  });

  it('AC5: the first reveal with random placement is always empty', () => {
    for (let seed = 0; seed < 50; seed++) {
      const corner = seed % 2 === 0;
      const index = corner ? 0 : toIndex(8, 4, 9);
      const state = run(
        null,
        { type: 'start', config: { rows: 9, cols: 9, mines: 72 }, seed },
        reveal(index),
      );
      expect(state.phase).not.toBe('lost');
      expect(cellView(state, index)).toEqual({ kind: 'empty' });
    }
  });

  it('AC6: flags and unflags hidden cells; flagged cells cannot be revealed, revealed cannot be flagged', () => {
    const flagged = run(startFixed(), flag(at(4, 4)));
    expect(cellView(flagged, at(4, 4))).toEqual({ kind: 'flagged' });
    expect(gameReducer(flagged, reveal(at(4, 4)))).toBe(flagged);
    expect(cellView(run(flagged, flag(at(4, 4))), at(4, 4))).toEqual({ kind: 'hidden' });

    const revealed = run(startFixed(), reveal(at(2, 3)));
    expect(gameReducer(revealed, flag(at(2, 3)))).toBe(revealed);
  });

  it('AC7: flagCount follows every flag placed or removed and can exceed the mines', () => {
    let state = run(startFixed(), flag(at(0, 0)), flag(at(0, 1)));
    expect(state.flagCount).toBe(2);
    state = run(state, flag(at(0, 1)));
    expect(state.flagCount).toBe(1);
    state = run(state, flag(at(1, 0)), flag(at(1, 1)), flag(at(1, 2)));
    expect(state.config.mines - state.flagCount).toBe(-1);
  });

  it('AC9: revealing a mine loses, shows the end-state view and freezes the board', () => {
    const state = run(
      startFixed(),
      reveal(at(2, 2)),
      flag(at(0, 4)), // wrong flag
      flag(at(3, 4)), // correct flag
      reveal(at(3, 3)),
    );
    expect(state.phase).toBe('lost');
    expect(state.explodedIndex).toBe(at(3, 3));
    expect(cellView(state, at(3, 3))).toEqual({ kind: 'mineExploded' });
    expect(cellView(state, at(4, 3))).toEqual({ kind: 'mine' });
    expect(cellView(state, at(3, 4))).toEqual({ kind: 'flagged' });
    expect(cellView(state, at(0, 4))).toEqual({ kind: 'flagWrong' });
    expect(cellView(state, at(2, 2))).toEqual({ kind: 'number', count: 1 });
    expect(cellView(state, at(4, 4))).toEqual({ kind: 'hidden' });

    expect(gameReducer(state, reveal(at(0, 0)))).toBe(state);
    expect(gameReducer(state, flag(at(4, 4)))).toBe(state);
  });

  it('AC10: revealing every safe cell wins, flags all mines and freezes the board', () => {
    const state = run(startFixed(), flag(at(3, 4)), reveal(at(0, 0)), reveal(at(4, 4)));
    expect(state.phase).toBe('won');
    expect(MINES.every((i) => state.cells[i] === 'flagged')).toBe(true);
    expect(state.flagCount).toBe(3);
    expect(state.config.mines - state.flagCount).toBe(0);

    expect(gameReducer(state, reveal(at(0, 4)))).toBe(state);
    expect(gameReducer(state, flag(at(0, 0)))).toBe(state);
  });

  it('AC10: a single reveal wins a 30 × 30 board with 1 mine (worst-case flood, no recursion)', () => {
    const state = run(
      null,
      { type: 'start', config: { rows: 30, cols: 30, mines: 1 }, seed: 123 },
      reveal(0),
    );
    expect(state.phase).toBe('won');
    expect(state.revealedCount).toBe(899);
  });

  it('AC3/AC4/AC5: startedAt is set by the first reveal, endedAt by the one that ends the game', () => {
    const ready = run(startFixed(), flag(at(4, 4)));
    expect(ready).toMatchObject({ startedAt: null, endedAt: null });

    const playing = run(ready, reveal(at(2, 3), 1000), flag(at(0, 4)), reveal(at(2, 2), 5000));
    expect(playing).toMatchObject({ phase: 'playing', startedAt: 1000, endedAt: null });

    const lost = run(playing, reveal(at(3, 3), 7000));
    expect(lost).toMatchObject({ phase: 'lost', startedAt: 1000, endedAt: 7000 });

    const won = run(startFixed(), reveal(at(0, 0), 2000), reveal(at(4, 4), 9000));
    expect(won).toMatchObject({ phase: 'won', startedAt: 2000, endedAt: 9000 });

    const wonAtOnce = run(
      null,
      { type: 'start', config: { rows: 30, cols: 30, mines: 1 }, seed: 123 },
      reveal(0, 4000),
    );
    expect(wonAtOnce).toMatchObject({ phase: 'won', startedAt: 4000, endedAt: 4000 });

    const restarted = run(lost, { type: 'start', config: lost.config, seed: 2 });
    expect(restarted).toMatchObject({ phase: 'ready', startedAt: null, endedAt: null });
  });

  it.each([
    ['wrong count', [at(0, 0)]],
    ['duplicate', [at(0, 0), at(0, 0), at(1, 1)]],
    ['out of range', [at(0, 0), at(1, 1), 25]],
  ])('start throws on invalid fixedMines (%s)', (_, fixedMines) => {
    expect(() =>
      gameReducer(null, {
        type: 'start',
        config: { rows: ROWS, cols: COLS, mines: 3 },
        seed: 1,
        fixedMines,
      }),
    ).toThrow(/fixedMines/);
  });
});
