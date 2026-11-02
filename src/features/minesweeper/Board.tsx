import { useCallback, type CSSProperties } from 'react';
import styles from './Board.module.css';
import { Cell } from './Cell.tsx';
import type { BoardView } from './logic/boardView.ts';
import { cellView } from './logic/cellView.ts';
import { toIndex } from './logic/grid.ts';
import type { GameState } from './logic/types.ts';
import { useBoardInput } from './useBoardInput.ts';

export interface BoardProps {
  readonly game: GameState;
  /** Presentation only (story 008): the markup is the same in both views. */
  readonly view: BoardView;
  readonly onReveal: (index: number) => void;
  readonly onToggleFlag: (index: number) => void;
}

/** The game board as an ARIA grid with one tab stop. Give it `key={game.id}`. */
export function Board({ game, view, onReveal, onToggleFlag }: BoardProps) {
  const { rows, cols } = game.config;
  const ended = game.phase === 'won' || game.phase === 'lost';
  const isFlaggable = useCallback(
    (index: number) => !ended && game.cells[index] !== 'revealed',
    [ended, game.cells],
  );
  const { gridRef, activeIndex, pressedIndex, handlers } = useBoardInput({
    rows,
    cols,
    isFlaggable,
    onReveal,
    onToggleFlag,
  });
  const gridStyle: CSSProperties & { '--cols': number; '--rows': number } = {
    '--cols': cols,
    '--rows': rows,
  };

  return (
    <div className={styles.scroller} data-view={view}>
      <div
        ref={gridRef}
        role="grid"
        aria-label="Minesweeper board"
        aria-rowcount={rows}
        aria-colcount={cols}
        aria-readonly={ended ? true : undefined}
        className={styles.grid}
        style={gridStyle}
        {...handlers}
      >
        {Array.from({ length: rows }, (_, row) => (
          <div role="row" className={styles.row} key={row}>
            {Array.from({ length: cols }, (_, col) => {
              const index = toIndex(row, col, cols);
              const cell = cellView(game, index);
              return (
                <Cell
                  key={col}
                  index={index}
                  row={row}
                  col={col}
                  kind={cell.kind}
                  count={cell.kind === 'number' ? cell.count : 0}
                  isActive={index === activeIndex}
                  isPressed={index === pressedIndex}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
