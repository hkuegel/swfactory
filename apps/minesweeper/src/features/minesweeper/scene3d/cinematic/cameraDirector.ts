import { REST_POSE, type CameraPose } from './cameraPose.ts';

/**
 * The camera moves of the cinematic view (story 050, AC3): pure functions of the scene time.
 * During play the camera stands still (round 3): moves exist only for the fly-in on Start and the
 * two ends of a game. A move is a pose offset from the rest pose that starts and ends at zero and lasts a fixed time;
 * it ends on its own. A move that starts while another runs blends from the current offset, so the
 * picture never jumps. Time comes from the render loop's clock, never from game state.
 */

export type MoveKind = 'flyIn' | 'dive' | 'orbit';

/** Pose minus rest pose. */
export interface PoseOffset {
  yaw: number;
  tilt: number;
  dolly: number;
  panX: number;
  panY: number;
}

export const MOVE_MS = {
  /** AC3: at most 2 s. */
  flyIn: 1600,
  dive: 2400,
  orbit: 3400,
} as const;

/** A new move blends from the offset of the old one over this time. */
export const BLEND_MS = 160;

/** Start offset of the fly-in: far, high, turned. */
const FLY_IN_FROM: PoseOffset = { yaw: 16, tilt: 12, dolly: -0.22, panX: 0, panY: -0.04 };
/** Dive towards the exploded mine. */
const DIVE = { pan: 0.07, dolly: 0.1, tilt: -9, yaw: 10 } as const;
/**
 * Orbit over the won board: swings round the board's vertical axis and a rise. The yaw travels at
 * least 90° in total (story 050, O2) inside the ENVELOPE yaw, so the margins hold, and ends at rest.
 */
const ORBIT = { yaw: 22, tilt: 7, dolly: 0.05 } as const;

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (t: number) => t * t * (3 - 2 * t);
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
/** 0 → 1 → 0 with a soft start and end. */
const bell = (t: number) => Math.sin(Math.PI * clamp01(t)) ** 2;
/** Rises to 1 by 0.4, holds until 0.6, falls to 0 at 1. */
const dwell = (t: number) => (t < 0.4 ? smooth(t / 0.4) : t < 0.6 ? 1 : smooth((1 - t) / 0.4));

/** Where the move aims, in shares of the board from its centre: -1 … 1; y is up on screen. */
export interface MoveAim {
  readonly x: number;
  readonly y: number;
}

const ZERO: MoveAim = { x: 0, y: 0 };

/** Writes the offset of a move at progress t (0..1) into `out`. */
export function moveOffset(kind: MoveKind, t: number, aim: MoveAim, out: PoseOffset): PoseOffset {
  const p = clamp01(t);
  switch (kind) {
    case 'flyIn': {
      const k = 1 - easeOutCubic(p);
      out.yaw = FLY_IN_FROM.yaw * k;
      out.tilt = FLY_IN_FROM.tilt * k;
      out.dolly = FLY_IN_FROM.dolly * k;
      out.panX = FLY_IN_FROM.panX * k;
      out.panY = FLY_IN_FROM.panY * k;
      return out;
    }
    case 'dive': {
      const k = dwell(p);
      out.yaw = aim.x * DIVE.yaw * k;
      out.tilt = DIVE.tilt * k;
      out.dolly = DIVE.dolly * k;
      out.panX = -aim.x * DIVE.pan * k;
      out.panY = aim.y * DIVE.pan * k;
      return out;
    }
    case 'orbit': {
      const swing = Math.sin(3 * Math.PI * p); // one and a half swings: out, back, out, home
      const rise = bell(p);
      out.yaw = ORBIT.yaw * swing * Math.sin(Math.PI * p) ** 0.5;
      out.tilt = ORBIT.tilt * rise;
      out.dolly = ORBIT.dolly * rise;
      out.panX = 0;
      out.panY = 0;
      return out;
    }
  }
}

export interface CameraDirector {
  /** Starts a move at scene time `now`, blending from the current offset. */
  start(kind: MoveKind, now: number, aim?: MoveAim): void;
  /** Cancels the running move at once (a new game, reduced motion). */
  cancel(): void;
  /** Writes the current offset (all zero when no move runs). */
  offsetAt(now: number, out: PoseOffset): PoseOffset;
  /** Absolute pose at `now` (rest + offset), into `out`. */
  poseAt(now: number, out: { -readonly [K in keyof CameraPose]: CameraPose[K] }): CameraPose;
  moving(now: number): boolean;
  /** Kind of the running move, or null. */
  kind(now: number): MoveKind | null;
  /** Milliseconds since the running move started (0 when none). */
  elapsed(now: number): number;
}

export function createCameraDirector(): CameraDirector {
  let active: { kind: MoveKind; start: number; aim: MoveAim } | null = null;
  const from: PoseOffset = { yaw: 0, tilt: 0, dolly: 0, panX: 0, panY: 0 };
  const target: PoseOffset = { yaw: 0, tilt: 0, dolly: 0, panX: 0, panY: 0 };

  const running = (now: number) => active !== null && now < active.start + MOVE_MS[active.kind];

  function offsetAt(now: number, out: PoseOffset): PoseOffset {
    if (!active || !running(now)) {
      out.yaw = 0;
      out.tilt = 0;
      out.dolly = 0;
      out.panX = 0;
      out.panY = 0;
      return out;
    }
    const elapsed = Math.max(0, now - active.start);
    moveOffset(active.kind, elapsed / MOVE_MS[active.kind], active.aim, target);
    const w = smooth(clamp01(elapsed / BLEND_MS));
    out.yaw = from.yaw * (1 - w) + target.yaw * w;
    out.tilt = from.tilt * (1 - w) + target.tilt * w;
    out.dolly = from.dolly * (1 - w) + target.dolly * w;
    out.panX = from.panX * (1 - w) + target.panX * w;
    out.panY = from.panY * (1 - w) + target.panY * w;
    return out;
  }

  const scratch: PoseOffset = { yaw: 0, tilt: 0, dolly: 0, panX: 0, panY: 0 };

  return {
    start(kind, now, aim = ZERO) {
      offsetAt(now, from); // continue from where the camera is
      active = { kind, start: now, aim };
    },
    cancel() {
      active = null;
    },
    offsetAt,
    poseAt(now, out) {
      offsetAt(now, scratch);
      out.yaw = REST_POSE.yaw + scratch.yaw;
      out.tilt = REST_POSE.tilt + scratch.tilt;
      out.dolly = REST_POSE.dolly + scratch.dolly;
      out.panX = REST_POSE.panX + scratch.panX;
      out.panY = REST_POSE.panY + scratch.panY;
      return out;
    },
    moving: running,
    kind: (now) => (active && running(now) ? active.kind : null),
    elapsed: (now) => (active && running(now) ? now - active.start : 0),
  };
}
