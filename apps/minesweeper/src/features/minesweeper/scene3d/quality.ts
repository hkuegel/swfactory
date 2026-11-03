import type { QualityLevel } from './timeline.ts';

/**
 * Frame-time governor (story 009, AC3): effects shrink before the board slows down.
 * Level 1 = DPR 1 and shadows every 2nd animated frame; level 2 = sink only, the wave in bands,
 * a smaller shadow map updated at the end of an animation. Never changes game state or the AC2
 * bounds. Fed with rAF deltas; allocation-free per frame (it runs in the only continuous loop).
 */

/** Frames in the median window. */
export const QUALITY_WINDOW = 30;
/** Median frame time above this steps one level down. */
export const SLOW_FRAME_MS = 20;
/**
 * "On time": the median is within this factor of the display's own interval, estimated as the
 * shortest frame in the window (rAF deltas never go below it). Works at 60 Hz (16.7 ms) as well
 * as at 120 Hz; a fixed threshold below 16.7 ms could never be reached on a 60 Hz display.
 */
export const ON_TIME_FACTOR = 1.15;
/** On time for this long steps one level up; doubled after every step down that follows a step up. */
export const STEP_UP_AFTER_MS = 2000;
export const STEP_UP_MAX_MS = 32_000;

export interface QualityGovernor {
  readonly level: QualityLevel;
  /** Feeds one frame time (ms between two consecutive loop frames) at scene time `nowMs`. */
  feed(frameMs: number, nowMs: number): QualityLevel;
}

export function createQualityGovernor(): QualityGovernor {
  const samples = new Float64Array(QUALITY_WINDOW);
  const sorted = new Float64Array(QUALITY_WINDOW);
  let filled = 0;
  let next = 0;
  let level: QualityLevel = 0;
  let fastSince: number | null = null;
  let upDelay = STEP_UP_AFTER_MS;
  let cameUp = false;

  const restart = () => {
    filled = 0;
    fastSince = null;
  };

  return {
    get level() {
      return level;
    },
    feed(frameMs, nowMs) {
      samples[next] = frameMs;
      next = (next + 1) % QUALITY_WINDOW;
      filled = Math.min(filled + 1, QUALITY_WINDOW);
      if (filled < QUALITY_WINDOW) return level;
      sorted.set(samples);
      sorted.sort();
      const half = QUALITY_WINDOW / 2;
      const median = ((sorted[half - 1] ?? 0) + (sorted[half] ?? 0)) / 2;
      const interval = sorted[0] ?? 0;
      if (median > SLOW_FRAME_MS) {
        if (level < 2) {
          level = level === 0 ? 1 : 2;
          if (cameUp) upDelay = Math.min(STEP_UP_MAX_MS, upDelay * 2); // oscillating: back off
          restart();
        }
        fastSince = null;
      } else if (median <= interval * ON_TIME_FACTOR) {
        fastSince ??= nowMs;
        if (level > 0 && nowMs - fastSince >= upDelay) {
          level = level === 2 ? 1 : 0;
          cameUp = true;
          restart();
        }
      } else {
        fastSince = null;
      }
      return level;
    },
  };
}
