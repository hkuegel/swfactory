import styles from './GameStatus.module.css';
import type { GamePhase } from './logic/types.ts';
import { MessageIcon } from './MessageIcon.tsx';

export interface GameStatusProps {
  readonly remainingMines: number;
  readonly phase: GamePhase;
}

/** Remaining-mines counter (AC7) and the result message (AC9, AC10), both live regions. */
export function GameStatus({ remainingMines, phase }: GameStatusProps) {
  return (
    <div className={styles.status}>
      <p className={styles.counter} aria-live="polite" aria-atomic="true">
        Mines left: <span>{remainingMines}</span>
      </p>
      {/* Persistent wrapper so the result is announced; no role on purpose (UX §5). */}
      <div aria-live="polite">
        {phase === 'won' && (
          <p className={`${styles.result} ${styles.won}`}>
            <MessageIcon kind="won" className={styles.icon} />
            You won! Every safe cell is revealed.
          </p>
        )}
        {phase === 'lost' && (
          <p className={`${styles.result} ${styles.lost}`}>
            <MessageIcon kind="lost" className={styles.icon} />
            You lost. You revealed a mine.
          </p>
        )}
      </div>
    </div>
  );
}
