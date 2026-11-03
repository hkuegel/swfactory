import type { Board3dProbe } from './types.ts';

/** What the dev-only e2e probe needs from the scene controller (story 009). No side effects. */
export interface ProbeInternals {
  pause(): void;
  holdSway(hold: boolean): void;
  advance(ms: number): void;
  project(index: number, offset: readonly [number, number, number]): { x: number; y: number };
  pixels(points: readonly { x: number; y: number }[]): [number, number, number][];
  frames(): number;
  level(): number;
  renderer(): string;
}

/** Builds the probe object; installed only under the literal e2e guard in createBoardScene.ts. */
export function createProbe(internals: ProbeInternals): Board3dProbe {
  return {
    pause: () => internals.pause(),
    holdSway: (hold) => internals.holdSway(hold),
    advance: (ms) => internals.advance(ms),
    project: (index, offset = [0, 0, 0]) => internals.project(index, offset),
    pixels: (points) => internals.pixels(points),
    get frames() {
      return internals.frames();
    },
    get level() {
      return internals.level();
    },
    get renderer() {
      return internals.renderer();
    },
  };
}
