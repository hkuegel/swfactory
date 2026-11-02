import { useElapsedSeconds } from './useElapsedSeconds.ts';
import styles from './Timer.module.css';

export interface TimerProps {
  readonly startedAt: number | null;
  readonly endedAt: number | null;
}

/**
 * Elapsed seconds (AC3 to AC5). Its own component so the per-tick re-render stays out of the
 * board. Deliberately no live region and no role: a tick per second must not be announced.
 */
export function Timer({ startedAt, endedAt }: TimerProps) {
  const seconds = useElapsedSeconds(startedAt, endedAt);
  return (
    <p className={styles.timer}>
      Time: <span>{seconds}</span>
    </p>
  );
}
