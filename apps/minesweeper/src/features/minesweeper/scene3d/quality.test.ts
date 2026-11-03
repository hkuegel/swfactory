import { describe, expect, it } from 'vitest';
import {
  createQualityGovernor,
  QUALITY_WINDOW,
  STEP_UP_AFTER_MS,
  type QualityGovernor,
} from './quality.ts';

/** Feeds `count` frames of `frameMs` each; returns the scene time after the last one. */
function feed(governor: QualityGovernor, frameMs: number, count: number, from = 0): number {
  let now = from;
  for (let i = 0; i < count; i++) {
    now += frameMs;
    governor.feed(frameMs, now);
  }
  return now;
}

const slowDown = (governor: QualityGovernor, from = 0) => feed(governor, 30, QUALITY_WINDOW, from);

describe('quality governor', () => {
  it('AC3: steps down on slow frames, one level per full window, and clamps at 2', () => {
    const governor = createQualityGovernor();
    feed(governor, 30, QUALITY_WINDOW - 1);
    expect(governor.level).toBe(0);
    let now = slowDown(governor);
    expect(governor.level).toBe(1);
    now = slowDown(governor, now);
    expect(governor.level).toBe(2);
    slowDown(governor, now);
    expect(governor.level).toBe(2);
  });

  it('AC3: steps up after 2 s of on-time frames, also on a 60 Hz display, never below 0', () => {
    const governor = createQualityGovernor();
    let now = slowDown(governor);
    // 1 s of 60 Hz frames is not enough; frames that are late (but not slow) reset the clock.
    now = feed(governor, 16.7, 60, now);
    expect(governor.level).toBe(1);
    now = feed(governor, 19.5, QUALITY_WINDOW, now);
    now = feed(governor, 16.7, 100, now);
    expect(governor.level).toBe(1);
    now = feed(governor, 16.7, 100, now);
    expect(governor.level).toBe(0);
    feed(governor, 8.3, 1000, now);
    expect(governor.level).toBe(0);
  });

  it('AC3: after stepping up and down again, the next step up waits twice as long', () => {
    const governor = createQualityGovernor();
    let now = slowDown(governor);
    now = feed(governor, 16.7, Math.ceil((STEP_UP_AFTER_MS + 600) / 16.7), now);
    expect(governor.level).toBe(0);
    now = slowDown(governor, now);
    expect(governor.level).toBe(1);
    now = feed(governor, 16.7, Math.ceil((STEP_UP_AFTER_MS + 600) / 16.7), now);
    expect(governor.level).toBe(1);
    feed(governor, 16.7, Math.ceil(STEP_UP_AFTER_MS / 16.7), now);
    expect(governor.level).toBe(0);
  });
});
