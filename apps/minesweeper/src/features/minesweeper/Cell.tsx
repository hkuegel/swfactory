import { memo } from 'react';
import styles from './Board.module.css';
import type { CellViewKind } from './logic/cellView.ts';

export interface CellProps {
  readonly index: number;
  readonly row: number;
  readonly col: number;
  readonly kind: CellViewKind;
  /** Neighbour mine count; only used for kind 'number'. */
  readonly count: number;
  /** The roving tab stop of the board. */
  readonly isActive: boolean;
  /** Touch long press in progress (pressed overlay). */
  readonly isPressed: boolean;
}

const STATE_NAMES: Record<Exclude<CellViewKind, 'number'>, string> = {
  hidden: 'hidden',
  flagged: 'flagged',
  empty: 'empty',
  mine: 'mine',
  mineExploded: 'exploded mine',
  flagWrong: 'wrong flag, no mine here',
};

function stateName(kind: CellViewKind, count: number): string {
  if (kind !== 'number') return STATE_NAMES[kind];
  return count === 1 ? '1 mine nearby' : `${count} mines nearby`;
}

function glyph(kind: CellViewKind, count: number) {
  switch (kind) {
    case 'number':
      return <span aria-hidden="true">{count}</span>;
    case 'flagged':
    case 'flagWrong':
      return (
        <svg className={styles.glyph} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect className={styles.pole} x="7" y="3" width="2" height="16" />
          <rect className={styles.pole} x="4" y="18" width="10" height="3" />
          <polygon className={styles.flag} points="9,3 20,7.5 9,12" />
          {kind === 'flagWrong' && (
            <line className={styles.slash} x1="3" y1="21" x2="21" y2="3" strokeWidth="2.5" />
          )}
        </svg>
      );
    case 'mine':
    case 'mineExploded':
      return (
        <svg className={styles.glyph} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          {/* Decorative disc behind the exploded mine: a shape cue besides the red tint. */}
          {kind === 'mineExploded' && <circle className={styles.mineDisc} cx="12" cy="12" r="11" />}
          <g className={styles.mineGlyph} strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="3" x2="12" y2="21" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
            <line x1="5.6" y1="18.4" x2="18.4" y2="5.6" />
            <circle cx="12" cy="12" r="6" />
          </g>
        </svg>
      );
    case 'hidden':
    case 'empty':
      return null;
  }
}

/** One board cell (`role="gridcell"`); input is handled by the grid via `data-index`. */
export const Cell = memo(function Cell({
  index,
  row,
  col,
  kind,
  count,
  isActive,
  isPressed,
}: CellProps) {
  const className = [
    styles.cell,
    styles[kind],
    kind === 'number' ? styles[`n${count}`] : undefined,
    isPressed ? styles.pressed : undefined,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      role="gridcell"
      className={className}
      data-index={index}
      tabIndex={isActive ? 0 : -1}
      aria-label={`Row ${row + 1}, column ${col + 1}, ${stateName(kind, count)}`}
    >
      {glyph(kind, count)}
    </div>
  );
});
