import { useEffect, useState } from 'react';
import { elapsedSeconds } from './logic/elapsedSeconds.ts';

/**
 * Polls faster than once a second: the value is computed from timestamps, so the display is
 * at most this late, never drifts and catches up at once after a throttled background tab.
 */
export const TICK_MS = 250;

/** Whole seconds of the current game (AC3 to AC5); re-renders only its caller on a tick. */
export function useElapsedSeconds(startedAt: number | null, endedAt: number | null): number {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (startedAt === null || endedAt !== null) return;
    const interval = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(interval);
  }, [startedAt, endedAt]);

  return elapsedSeconds(startedAt, endedAt, now);
}
