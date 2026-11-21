import { describe, expect, it } from 'vitest';
import { SWAY_DEG } from '../geometry.ts';
import {
  BLEND_MS,
  createCameraDirector,
  MOVE_MS,
  moveOffset,
  type MoveAim,
  type MoveKind,
  type PoseOffset,
} from './cameraDirector.ts';
import { ENVELOPE, REST_POSE } from './cameraPose.ts';

const KINDS: readonly MoveKind[] = ['flyIn', 'dive', 'orbit'];
const AIMS: readonly MoveAim[] = [
  { x: 0, y: 0 },
  { x: 1, y: 1 },
  { x: -1, y: 1 },
  { x: 1, y: -1 },
  { x: -1, y: -1 },
];
const blank = (): PoseOffset => ({ yaw: 0, tilt: 0, dolly: 0, panX: 0, panY: 0 });

describe('camera director', () => {
  it('AC3: the fly-in lasts at most 2 s and every move ends within 4 s', () => {
    expect(MOVE_MS.flyIn).toBeLessThanOrEqual(2000);
    for (const kind of KINDS) expect(MOVE_MS[kind]).toBeLessThanOrEqual(4000);
  });

  it('AC3: every move starts and ends on the rest pose and ends on its own', () => {
    for (const kind of KINDS) {
      for (const aim of AIMS) {
        const end = moveOffset(kind, 1, aim, blank());
        for (const value of Object.values(end)) expect(Math.abs(value)).toBeLessThan(1e-9);
      }
    }
    // The fly-in starts away from rest, the others start at rest.
    expect(moveOffset('flyIn', 0, AIMS[0] as MoveAim, blank()).dolly).toBeLessThan(-0.1);
    for (const kind of ['dive', 'orbit'] as const) {
      const start = moveOffset(kind, 0, AIMS[1] as MoveAim, blank());
      for (const value of Object.values(start)) expect(Math.abs(value)).toBeLessThan(1e-9);
    }
    const director = createCameraDirector();
    director.start('orbit', 1000);
    expect(director.moving(1000 + MOVE_MS.orbit - 1)).toBe(true);
    expect(director.moving(1000 + MOVE_MS.orbit)).toBe(false);
    expect(director.kind(1000 + MOVE_MS.orbit)).toBeNull();
  });

  it('AC3: the win orbit sweeps at least 90 degrees of yaw in total and returns to rest', () => {
    const out = blank();
    let sweep = 0;
    let previous = 0;
    for (let i = 0; i <= 1000; i++) {
      moveOffset('orbit', i / 1000, AIMS[0] as MoveAim, out);
      sweep += Math.abs(out.yaw - previous);
      previous = out.yaw;
    }
    expect(sweep).toBeGreaterThanOrEqual(90);
    expect(Math.abs(out.yaw)).toBeLessThan(1e-9);
    expect(MOVE_MS.orbit).toBeLessThanOrEqual(4000);
  });

  it('AC3: every pose of every move, also blended, stays inside the envelope the overlay is sized for', () => {
    const out = blank();
    for (const kind of KINDS) {
      for (const aim of AIMS) {
        for (let i = 0; i <= 100; i++) {
          moveOffset(kind, i / 100, aim, out);
          expect(Math.abs(out.yaw) + SWAY_DEG).toBeLessThanOrEqual(ENVELOPE.yaw);
          expect(REST_POSE.tilt + out.tilt).toBeGreaterThanOrEqual(ENVELOPE.tiltMin);
          expect(REST_POSE.tilt + out.tilt).toBeLessThanOrEqual(ENVELOPE.tiltMax);
          expect(out.dolly).toBeGreaterThanOrEqual(ENVELOPE.dollyMin);
          expect(out.dolly).toBeLessThanOrEqual(ENVELOPE.dollyMax);
          expect(Math.abs(out.panX)).toBeLessThanOrEqual(ENVELOPE.pan);
          expect(Math.abs(out.panY)).toBeLessThanOrEqual(ENVELOPE.pan);
        }
      }
    }
  });

  it('AC3: a move that starts during another blends from where the camera is, without a jump', () => {
    const director = createCameraDirector();
    director.start('flyIn', 0);
    const mid = director.offsetAt(500, blank());
    expect(Math.abs(mid.dolly)).toBeGreaterThan(0.01);
    director.start('dive', 500, { x: 1, y: 0 });
    const first = director.offsetAt(500, blank());
    expect(first.dolly).toBeCloseTo(mid.dolly, 9);
    expect(first.yaw).toBeCloseTo(mid.yaw, 9);
    // After the blend the dive alone decides (it holds near the mine, then returns to rest).
    const late = director.offsetAt(500 + BLEND_MS + MOVE_MS.dive / 2, blank());
    expect(late.dolly).toBeGreaterThan(0.02);
    director.cancel();
    expect(director.moving(600)).toBe(false);
    expect(director.poseAt(600, { ...REST_POSE })).toEqual(REST_POSE);
  });

  it('AC3: the dive goes to the exploded mine and there is no move for a reveal', () => {
    const right = moveOffset('dive', 0.5, { x: 1, y: 0 }, blank());
    const left = moveOffset('dive', 0.5, { x: -1, y: 0 }, blank());
    expect(right.panX).toBeLessThan(0); // the board moves left: the right-hand mine comes in
    expect(left.panX).toBeGreaterThan(0);
    const far = moveOffset('dive', 0.5, { x: 0, y: 1 }, blank());
    expect(far.panY).toBeGreaterThan(0); // a far cell is above the centre: the board moves down
    expect(far.dolly).toBeGreaterThan(0.05); // and the camera comes closer
    // Round 3: during play the camera stands still, so a move only exists for these three.
    expect(Object.keys(MOVE_MS).sort()).toEqual(['dive', 'flyIn', 'orbit']);
  });
});
