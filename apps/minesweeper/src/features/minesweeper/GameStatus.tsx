import styles from './GameStatus.module.css';
import { elapsedSeconds } from './logic/elapsedSeconds.ts';
import type { GamePhase } from './logic/types.ts';
import { MessageIcon } from './MessageIcon.tsx';
import { Timer } from './Timer.tsx';

export interface GameStatusProps {
  readonly remainingMines: number;
  readonly phase: GamePhase;
  readonly startedAt: number | null;
  readonly endedAt: number | null;
}

/** Same value the frozen timer shows: both derive from `endedAt`, not from a later tick. */
function finishedText(startedAt: number | null, endedAt: number | null): string {
  const seconds = elapsedSeconds(startedAt, endedAt, 0);
  return `Finished in ${seconds} ${seconds === 1 ? 'second' : 'seconds'}.`;
}

/** Counter (AC7), timer (006) and the result message (AC9, AC10); counter and result are live regions. */
export function GameStatus({ remainingMines, phase, startedAt, endedAt }: GameStatusProps) {
  return (
    <div className={styles.status}>
      <div className={styles.row}>
        <p className={styles.counter} aria-live="polite" aria-atomic="true">
          Mines left: <span>{remainingMines}</span>
        </p>
        <Timer startedAt={startedAt} endedAt={endedAt} />
      </div>
      {/* Persistent wrapper so the result is announced; no role on purpose (UX §5). */}
      <div aria-live="polite">
        {phase === 'won' && (
          <p className={`${styles.result} ${styles.won}`}>
            <MessageIcon kind="won" className={styles.icon} />
            You won! Every safe cell is revealed.
            <span className={styles.visuallyHidden}> {finishedText(startedAt, endedAt)}</span>
          </p>
        )}
        {phase === 'lost' && (
          <p className={`${styles.result} ${styles.lost}`}>
            <MessageIcon kind="lost" className={styles.icon} />
            You lost. You revealed a mine.
            <span className={styles.visuallyHidden}> {finishedText(startedAt, endedAt)}</span>
          </p>
        )}
      </div>
    </div>
  );
}
