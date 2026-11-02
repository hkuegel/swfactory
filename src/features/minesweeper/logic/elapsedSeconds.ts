/**
 * Whole seconds of a game (AC3, AC4), derived from timestamps so a throttled tab is right
 * when it returns. Not capped. `now` is ignored once the game has ended.
 */
export function elapsedSeconds(
  startedAt: number | null,
  endedAt: number | null,
  now: number,
): number {
  if (startedAt === null) return 0;
  return Math.max(0, Math.floor(((endedAt ?? now) - startedAt) / 1000));
}
