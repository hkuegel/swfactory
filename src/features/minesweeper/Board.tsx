import { useCallback, useLayoutEffect, useRef, type CSSProperties } from 'react';
import styles from './Board.module.css';
import { Cell } from './Cell.tsx';
import { cellView } from './logic/cellView.ts';
import { toIndex } from './logic/grid.ts';
import type { GameState } from './logic/types.ts';
import type { BoardSceneHandle } from './scene3d/types.ts';
import { useBoardInput } from './useBoardInput.ts';

export interface BoardProps {
  readonly game: GameState;
  /** Non-null iff the 3D board is shown (story 009). The markup is the same in both views. */
  readonly scene: BoardSceneHandle | null;
  readonly onReveal: (index: number) => void;
  readonly onToggleFlag: (index: number) => void;
}

/** The game board as an ARIA grid with one tab stop. Give it `key={game.id}`. */
export function Board({ game, scene, onReveal, onToggleFlag }: BoardProps) {
  const { rows, cols } = game.config;
  const ended = game.phase === 'won' || game.phase === 'lost';
  const isFlaggable = useCallback(
    (index: number) => !ended && game.cells[index] !== 'revealed',
    [ended, game.cells],
  );
  // The cell revealed by input is where the 3D reveal wave starts (story 009, AC2).
  const originRef = useRef<number | null>(null);
  const handleReveal = useCallback(
    (index: number) => {
      originRef.current = index;
      onReveal(index);
    },
    [onReveal],
  );
  const { gridRef, activeIndex, pressedIndex, handlers } = useBoardInput({
    rows,
    cols,
    isFlaggable,
    onReveal: handleReveal,
    onToggleFlag,
  });
  // Never put transform or margin here: in 3D the scene owns them inline (ADR 0005).
  const gridStyle: CSSProperties & { '--cols': number; '--rows': number } = {
    '--cols': cols,
    '--rows': rows,
  };

  // Keep the scene in step before paint, so no frame shows a board without its picture.
  const hostRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const host = hostRef.current;
    const grid = gridRef.current;
    if (!scene || !host || !grid) return;
    scene.attach(host, grid);
    return () => scene.detach();
  }, [scene, gridRef]);
  useLayoutEffect(() => {
    if (!scene) return;
    scene.update(game, originRef.current);
    originRef.current = null;
  }, [scene, game]);
  useLayoutEffect(() => {
    scene?.setPressed(pressedIndex);
  }, [scene, pressedIndex]);

  return (
    <div className={styles.scroller} data-view={scene ? '3d' : '2d'}>
      {/* Present in both views, so a switch never remounts the grid (008/AC2). */}
      <div className={styles.stage}>
        {scene && <div ref={hostRef} className={styles.canvasHost} aria-hidden="true" />}
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
    </div>
  );
}
