import { useCallback, type CSSProperties } from 'react';
import styles from './Board.module.css';
import { Cell } from './Cell.tsx';
import { cellView } from './logic/cellView.ts';
import { toIndex } from './logic/grid.ts';
import type { GameState } from './logic/types.ts';
import { useBoardInput } from './useBoardInput.ts';

export interface BoardProps {
  readonly game: GameState;
  readonly onReveal: (index: number) => void;
  readonly onToggleFlag: (index: number) => void;
}

/** The game board as an ARIA grid with one tab stop. Give it `key={game.id}`. */
export function Board({ game, onReveal, onToggleFlag }: BoardProps) {
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
  const gridStyle: CSSProperties & { '--cols': number } = { '--cols': cols };

  return (
    <div className={styles.scroller}>
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
              const view = cellView(game, index);
              return (
                <Cell
                  key={col}
                  index={index}
                  row={row}
                  col={col}
                  kind={view.kind}
                  count={view.kind === 'number' ? view.count : 0}
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
