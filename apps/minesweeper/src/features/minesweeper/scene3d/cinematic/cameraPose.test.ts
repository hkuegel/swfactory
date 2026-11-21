import { Camera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { cameraFrustum, SWAY_DEG, type Vec3 } from '../geometry.ts';
import { rng } from '../endPlan.ts';
import {
  ENVELOPE,
  poseMargins,
  poseStageLayout,
  poseWorldMatrix,
  projectPose,
  REST_POSE,
  type CameraPose,
} from './cameraPose.ts';

const GAP = 2;
const size = (cells: number, cell: number) => cells * cell + (cells - 1) * GAP;
/** [rows, cols] */
const BOARDS: readonly (readonly [number, number])[] = [
  [5, 5],
  [9, 9],
  [16, 30],
  [30, 30],
];

/** Projects a world point (y towards the far row) with a three.js camera built from a pose. */
function projectWithCamera(
  world: Vec3,
  width: number,
  height: number,
  rim: number,
  pose: CameraPose,
  sway: number,
) {
  const layout = poseStageLayout(width, height, rim);
  const f = cameraFrustum(layout, width);
  const camera = new Camera();
  camera.matrixWorld.fromArray(poseWorldMatrix(pose, width, height, sway));
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
  camera.projectionMatrix.makePerspective(f.left, f.right, f.top, f.bottom, f.near, f.far);
  const ndc = new Vector3(...world).project(camera);
  return {
    x: ((ndc.x + 1) / 2) * layout.width - layout.centreX,
    y: ((1 - ndc.y) / 2) * layout.height - layout.centreY,
  };
}

/** A random pose inside the envelope (yaw includes the sway, which is passed separately). */
function randomPose(next: () => number): CameraPose {
  const range = (min: number, max: number) => min + (max - min) * next();
  return {
    yaw: range(-ENVELOPE.yaw + SWAY_DEG, ENVELOPE.yaw - SWAY_DEG),
    tilt: range(ENVELOPE.tiltMin, ENVELOPE.tiltMax),
    dolly: range(ENVELOPE.dollyMin, ENVELOPE.dollyMax),
    panX: range(-ENVELOPE.pan, ENVELOPE.pan),
    panY: range(-ENVELOPE.pan, ENVELOPE.pan),
  };
}

describe('cinematic camera pose', () => {
  it('AC3: the camera projects every point where the CSS overlay transform puts it, in any pose', () => {
    const next = rng(31);
    for (const [rows, cols] of BOARDS) {
      const width = size(cols, 32);
      const height = size(rows, 32);
      for (let i = 0; i < 60; i++) {
        const pose = i === 0 ? REST_POSE : randomPose(next);
        const sway = (next() * 2 - 1) * SWAY_DEG;
        const x = (next() - 0.5) * width;
        const y = (next() - 0.5) * height;
        const z = (next() - 0.5) * 32;
        const css = projectPose([x, y, z], pose, width, height, sway);
        const camera = projectWithCamera([x, -y, z], width, height, 16, pose, sway);
        expect(Math.abs(camera.x - css.x)).toBeLessThan(1e-6);
        expect(Math.abs(camera.y - css.y)).toBeLessThan(1e-6);
      }
    }
  });

  it('AC3: the margins hold the projected board for every pose, so no move scrolls or clips it', () => {
    const next = rng(32);
    for (const [rows, cols] of BOARDS) {
      const width = size(cols, 32);
      const height = size(rows, 32);
      const { top, bottom, inline } = poseMargins(width, height);
      for (let i = 0; i < 400; i++) {
        const pose = randomPose(next);
        const sway = (next() * 2 - 1) * SWAY_DEG;
        for (const [sx, sy] of [
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ] as const) {
          const p = projectPose(
            [(sx * width) / 2, (sy * height) / 2, 0],
            pose,
            width,
            height,
            sway,
          );
          expect(p.y).toBeGreaterThanOrEqual(-height / 2 - top - 0.01);
          expect(p.y).toBeLessThanOrEqual(height / 2 + bottom + 0.01);
          expect(Math.abs(p.x)).toBeLessThanOrEqual(width / 2 + inline + 0.01);
        }
      }
    }
  });

  it('AC3: the stage reserves room above the board for the wall, and its centre is the grid centre', () => {
    const layout = poseStageLayout(300, 300, 16);
    const base = poseMargins(300, 300);
    expect(layout.margins.top).toBeGreaterThan(base.top);
    expect(layout.centreY).toBe(16 + layout.margins.top + 150);
    expect(layout.height).toBe(32 + 300 + layout.margins.top + layout.margins.bottom);
  });

  it('AC2: with a cell size the stage also holds the diorama: room at the sides and below', () => {
    const plain = poseStageLayout(300, 300, 16);
    const grown = poseStageLayout(300, 300, 16, 32);
    expect(grown.margins.inline - plain.margins.inline).toBeGreaterThanOrEqual(3 * 32);
    expect(grown.margins.bottom - plain.margins.bottom).toBeGreaterThanOrEqual(5 * 32);
    expect(grown.margins.top).toBe(plain.margins.top);
    expect(grown.centreX).toBe(16 + grown.margins.inline + 150);
  });
});
