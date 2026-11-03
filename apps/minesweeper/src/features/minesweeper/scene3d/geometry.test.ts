/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Camera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import {
  boardMargins,
  cameraFrustum,
  cameraWorldMatrix,
  combinedTiltDeg,
  DPR_CAP,
  pixelRatio,
  PIXEL_BUDGET,
  projectCss,
  stageLayout,
  SWAY_DEG,
  SWAY_PERIOD_MS,
  swayAt,
  TILT_DEG,
  type Vec3,
} from './geometry.ts';

const GAP = 2;
const size = (cells: number, cell: number) => cells * cell + (cells - 1) * GAP;

/** [rows, cols] */
const BOARDS: readonly (readonly [number, number])[] = [
  [5, 5],
  [9, 9],
  [16, 30],
  [30, 5],
  [5, 30],
  [30, 30],
];

/** Deterministic pseudo-random numbers in [0, 1) (mulberry32). */
function random(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 1831565813) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Projects a world point (y towards the far row) with a three.js camera built from geometry.ts. */
function projectWithCamera(world: Vec3, width: number, height: number, rim: number, sway: number) {
  const layout = stageLayout(width, height, rim);
  const f = cameraFrustum(layout, width);
  const camera = new Camera();
  camera.matrixWorld.fromArray(cameraWorldMatrix(height, sway));
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
  camera.projectionMatrix.makePerspective(f.left, f.right, f.top, f.bottom, f.near, f.far);
  const ndc = new Vector3(...world).project(camera);
  return {
    x: ((ndc.x + 1) / 2) * layout.width - layout.centreX,
    y: ((1 - ndc.y) / 2) * layout.height - layout.centreY,
  };
}

describe('scene geometry', () => {
  it('AC5: the camera projects every board point where the CSS overlay transform puts it', () => {
    const next = random(9);
    for (const [rows, cols] of BOARDS) {
      const width = size(cols, 32);
      const height = size(rows, 32);
      for (const sway of [-SWAY_DEG, 0, SWAY_DEG]) {
        for (let i = 0; i < 50; i++) {
          const x = (next() - 0.5) * width;
          const y = (next() - 0.5) * height;
          const z = (next() - 0.5) * 32; // tile tops, floor and objects lie off the plane
          const css = projectCss([x, y, z], height, sway);
          const camera = projectWithCamera([x, -y, z], width, height, 16, sway);
          expect(Math.abs(camera.x - css.x)).toBeLessThan(1e-6);
          expect(Math.abs(camera.y - css.y)).toBeLessThan(1e-6);
        }
      }
    }
  });

  it('AC1: the margins hold the projected board at every sway angle and are symmetric inline', () => {
    for (const [rows, cols] of BOARDS) {
      const width = size(cols, 32);
      const height = size(rows, 32);
      const { top, bottom, inline } = boardMargins(width, height);
      expect(top).toBeLessThan(0);
      expect(bottom).toBeLessThan(0);
      expect(inline).toBeGreaterThan(0);
      for (let i = 0; i <= 400; i++) {
        const sway = -SWAY_DEG + (2 * SWAY_DEG * i) / 400;
        for (const [sx, sy] of [
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ] as const) {
          const p = projectCss([(sx * width) / 2, (sy * height) / 2, 0], height, sway);
          expect(p.y).toBeGreaterThanOrEqual(-height / 2 - top - 0.01);
          expect(p.y).toBeLessThanOrEqual(height / 2 + bottom + 0.01);
          expect(Math.abs(p.x)).toBeLessThanOrEqual(width / 2 + inline + 0.01);
        }
      }
    }
  });

  it('AC1: tilt at most 35°, sway at most 3° with a period of at least 10 s, combined at most 35°', () => {
    expect(TILT_DEG).toBeLessThanOrEqual(35);
    expect(SWAY_DEG).toBeLessThanOrEqual(3);
    expect(SWAY_PERIOD_MS).toBeGreaterThanOrEqual(10_000);
    for (let t = 0; t < SWAY_PERIOD_MS; t += 100) {
      expect(Math.abs(swayAt(t))).toBeLessThanOrEqual(SWAY_DEG);
      expect(combinedTiltDeg(swayAt(t))).toBeLessThanOrEqual(35);
    }
    expect(swayAt(SWAY_PERIOD_MS / 4)).toBeCloseTo(SWAY_DEG, 10);
    expect(swayAt((3 * SWAY_PERIOD_MS) / 4)).toBeCloseTo(-SWAY_DEG, 10);
  });

  it('AC1: at the 3D cell floor the far edge of the far row stays at least 24 px wide over the sway range', () => {
    // The phone floor is a token (--board3d-cell-min); read it so the two cannot drift.
    const tokens = readFileSync(join(import.meta.dirname, '../../../tokens.css'), 'utf8');
    const floor = Number(/--board3d-cell-min:\s*([\d.]+)px/.exec(tokens)?.[1]);
    expect(floor).toBeGreaterThan(0);
    for (const [rows, cols] of BOARDS) {
      const width = size(cols, floor);
      const height = size(rows, floor);
      let narrowest = Infinity;
      for (let i = 0; i <= 40; i++) {
        const sway = -SWAY_DEG + (2 * SWAY_DEG * i) / 40;
        for (let col = 0; col < cols; col++) {
          // The far edge itself: the narrowest line of the far row on screen.
          const left = -width / 2 + col * (floor + GAP);
          const a = projectCss([left, -height / 2, 0], height, sway);
          const b = projectCss([left + floor, -height / 2, 0], height, sway);
          narrowest = Math.min(narrowest, Math.hypot(b.x - a.x, b.y - a.y));
        }
      }
      expect(narrowest, `${rows} x ${cols}`).toBeGreaterThanOrEqual(24);
    }
  });

  it('AC3: the device pixel ratio is capped at 2 and by the backbuffer budget', () => {
    expect(pixelRatio(3, 800, 600)).toBe(DPR_CAP);
    expect(pixelRatio(1, 800, 600)).toBe(1);
    const big = pixelRatio(2, 1100, 1000);
    expect(big).toBeLessThan(2);
    expect(1100 * big * 1000 * big).toBeLessThanOrEqual(PIXEL_BUDGET + 1);
  });
});
