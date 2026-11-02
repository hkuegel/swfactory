import type { GameState } from './types.ts';

export type CellView =
  | { readonly kind: 'hidden' }
  | { readonly kind: 'flagged' }
  | { readonly kind: 'number'; readonly count: number } // 1..8
  | { readonly kind: 'empty' }
  | { readonly kind: 'mine' } // lost: unflagged mine shown
  | { readonly kind: 'mineExploded' } // lost: the mine I revealed
  | { readonly kind: 'flagWrong' }; // lost: flag on a cell without a mine

export type CellViewKind = CellView['kind'];

/**
 * What one cell shows, incl. the end-state view after a loss (AC9). A flagged mine stays
 * 'flagged' after a loss; after a win all mines are already 'flagged' in `cells` (AC10).
 */
export function cellView(state: GameState, index: number): CellView {
  const cell = state.cells[index];
  const isMine = state.mines?.[index] === true;

  if (state.phase === 'lost') {
    if (index === state.explodedIndex) return { kind: 'mineExploded' };
    if (cell === 'flagged') return isMine ? { kind: 'flagged' } : { kind: 'flagWrong' };
    if (isMine) return { kind: 'mine' };
  }
  if (cell === 'flagged') return { kind: 'flagged' };
  if (cell === 'revealed') {
    const count = state.adjacent?.[index] ?? 0;
    return count === 0 ? { kind: 'empty' } : { kind: 'number', count };
  }
  return { kind: 'hidden' };
}
