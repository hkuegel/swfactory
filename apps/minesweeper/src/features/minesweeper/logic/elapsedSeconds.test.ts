import { describe, expect, it } from 'vitest';
import { elapsedSeconds } from './elapsedSeconds.ts';

describe('elapsedSeconds', () => {
  it.each<[string, number | null, number | null, number, number]>([
    ['AC3: no reveal yet', null, null, 50_000, 0],
    ['AC3: just started', 1000, null, 1000, 0],
    ['AC3: 999 ms is still 0', 1000, null, 1999, 0],
    ['AC3: 1000 ms is 1', 1000, null, 2000, 1],
    ['AC3: 61 s', 1000, null, 62_000, 61],
    ['AC3: no upper limit', 0, null, 100_000_000, 100_000],
    ['AC4: ended game ignores now', 1000, 4500, 99_000, 3],
    ['AC4: ended on the first reveal', 1000, 1000, 99_000, 0],
    ['AC3: now before start is clamped to 0', 5000, null, 1000, 0],
  ])('%s', (_, startedAt, endedAt, now, expected) => {
    expect(elapsedSeconds(startedAt, endedAt, now)).toBe(expected);
  });
});
