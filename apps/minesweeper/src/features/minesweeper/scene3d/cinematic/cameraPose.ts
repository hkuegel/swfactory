import { perspectiveOf, type BoardMargins, type StageLayout, type Vec3 } from '../geometry.ts';

/**
 * The camera of the cinematic view (story 050, AC3). One pose gives the DOM overlay's CSS
 * transform and the three.js camera from the same numbers, exactly as geometry.ts does for the
 * "3D" view, so during a camera move every cell's hit box still lies on its drawn tile and a click
 * hits the cell under the pointer. Pure and three-free.
 *
 * CSS model: `perspective(P) translate3d(px, py, pz) rotateY(yaw) rotateX(tilt)`, P = DEPTH · H.
 * Coordinates: CSS px, origin at the grid's layout centre, x right, y down, z towards the viewer.
 */

export interface CameraPose {
  /** Yaw about the board's vertical axis, degrees (the idle sway is added to it). */
  readonly yaw: number;
  /** Tilt of the board away from the viewer, degrees. */
  readonly tilt: number;
  /** Dolly towards the viewer, in perspective distances P (negative: away). */
  readonly dolly: number;
  /** Pan in shares of the grid width and height (+ right, + down on screen). */
  readonly panX: number;
  readonly panY: number;
}

/** The pose the camera rests in. */
export const REST_POSE: CameraPose = { yaw: 0, tilt: 28, dolly: 0, panX: 0, panY: 0 };

/**
 * Every pose a move may reach (cameraDirector.test.ts checks the moves against it). The margins
 * of the overlay grid hold the projected board for all of them, so the transformed bounds never
 * leave the stage: no scrollbars appear and nothing is clipped while the camera moves.
 */
export const ENVELOPE = {
  yaw: 24,
  tiltMin: 16,
  tiltMax: 42,
  dollyMin: -0.25,
  dollyMax: 0.1,
  pan: 0.08,
} as const;

const LAYOUT_UNIT = 1 / 64;
const rad = (deg: number) => (deg * Math.PI) / 180;
const ceilUnit = (value: number) => Math.ceil(value / LAYOUT_UNIT) * LAYOUT_UNIT;

/** R = Ry(yaw) · Rx(tilt) applied to a point (CSS coordinates). */
function rotate([x, y, z]: Vec3, tilt: number, yaw: number): Vec3 {
  const ct = Math.cos(rad(tilt));
  const st = Math.sin(rad(tilt));
  const cp = Math.cos(rad(yaw));
  const sp = Math.sin(rad(yaw));
  const y1 = y * ct - z * st;
  const z1 = y * st + z * ct;
  return [x * cp + z1 * sp, y1, -x * sp + z1 * cp];
}

const fixed = (value: number) => value.toFixed(4);

/** The overlay grid's inline CSS transform (transform-origin stays at its centre). */
export function poseTransform(
  pose: CameraPose,
  gridWidth: number,
  gridHeight: number,
  swayDeg: number,
): string {
  const p = perspectiveOf(gridHeight);
  return (
    `perspective(${fixed(p)}px) ` +
    `translate3d(${fixed(pose.panX * gridWidth)}px, ${fixed(pose.panY * gridHeight)}px, ${fixed(pose.dolly * p)}px) ` +
    `rotateY(${fixed(pose.yaw + swayDeg)}deg) rotateX(${fixed(pose.tilt)}deg)`
  );
}

/** Where the CSS model draws a point: offset from the grid's layout centre in CSS px. */
export function projectPose(
  point: Vec3,
  pose: CameraPose,
  gridWidth: number,
  gridHeight: number,
  swayDeg: number,
): { x: number; y: number } {
  const p = perspectiveOf(gridHeight);
  const [x, y, z] = rotate(point, pose.tilt, pose.yaw + swayDeg);
  const zz = z + pose.dolly * p;
  const scale = p / (p - zz);
  return {
    x: (x + pose.panX * gridWidth) * scale,
    y: (y + pose.panY * gridHeight) * scale,
  };
}

/**
 * The camera's world matrix (column-major, as three's `Matrix4.fromArray`): the inverse of the CSS
 * model with the y flip of three (y up). World: x right, y towards the far row, z up, z = 0 the
 * overlay plane. With pan = dolly = 0 and tilt = TILT_DEG it equals geometry.cameraWorldMatrix.
 */
export function poseWorldMatrix(
  pose: CameraPose,
  gridWidth: number,
  gridHeight: number,
  swayDeg: number,
): number[] {
  const yaw = pose.yaw + swayDeg;
  const basis = [
    rotate([1, 0, 0], pose.tilt, yaw),
    rotate([0, 1, 0], pose.tilt, yaw),
    rotate([0, 0, 1], pose.tilt, yaw),
  ];
  const s = [1, -1, 1];
  // Rᵀ[i][j] = (R·e_i)[j]
  const rt = (i: number, j: number) => basis[i]?.[j] ?? 0;
  const a = (i: number, j: number) => (s[i] ?? 1) * rt(i, j) * (s[j] ?? 1);
  const p = perspectiveOf(gridHeight);
  // The eye sits at (0, 0, P) of the transformed frame; in model space: Rᵀ · ((0, 0, P) − t).
  const v: Vec3 = [-pose.panX * gridWidth, -pose.panY * gridHeight, p - pose.dolly * p];
  const w = (i: number) => rt(i, 0) * v[0] + rt(i, 1) * v[1] + rt(i, 2) * v[2];
  // prettier-ignore
  return [
    a(0, 0), a(1, 0), a(2, 0), 0,
    a(0, 1), a(1, 1), a(2, 1), 0,
    a(0, 2), a(1, 2), a(2, 2), 0,
    (s[0] ?? 1) * w(0), (s[1] ?? 1) * w(1), (s[2] ?? 1) * w(2), 1,
  ];
}

/** Height of the extra stage above the board, CSS px. */
export const setTop = (gridHeight: number): number =>
  Math.min(SET_TOP_MAX_PX, Math.max(SET_TOP_MIN_PX, SET_TOP_SHARE * gridHeight));

const sampled = (min: number, max: number): number[] => [min, (min + max) / 2, max];

/**
 * Margins that hold the projected board for every pose of the envelope (the corners of the pose
 * box and its middle), so the overlay's transformed bounds never change while the camera moves.
 */
export function poseMargins(gridWidth: number, gridHeight: number): BoardMargins {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const E = ENVELOPE;
  for (const yaw of sampled(-E.yaw, E.yaw)) {
    for (const tilt of sampled(E.tiltMin, E.tiltMax)) {
      for (const dolly of sampled(E.dollyMin, E.dollyMax)) {
        for (const panX of sampled(-E.pan, E.pan)) {
          for (const panY of sampled(-E.pan, E.pan)) {
            const pose: CameraPose = { yaw, tilt, dolly, panX, panY };
            for (const sx of [-1, 1]) {
              for (const sy of [-1, 1]) {
                const { x, y } = projectPose(
                  [(sx * gridWidth) / 2, (sy * gridHeight) / 2, 0],
                  pose,
                  gridWidth,
                  gridHeight,
                  0,
                );
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
              }
            }
          }
        }
      }
    }
  }
  return {
    top: ceilUnit(-(minY + gridHeight / 2)),
    bottom: ceilUnit(maxY - gridHeight / 2),
    inline: ceilUnit(Math.max(0, maxX - gridWidth / 2, -(minX + gridWidth / 2))),
  };
}

/** Extra stage above the board (share of the grid height, within px bounds): the wall shows there. */
export const SET_TOP_SHARE = 0.4;
export const SET_TOP_MIN_PX = 100;
export const SET_TOP_MAX_PX = 200;

/**
 * Room the diorama needs around the board, in cells (round 3): its lawn ring and cross-section
 * reach beyond the tray, so the stage grows by these shares of the cell size on the sides and below.
 */
export const DIORAMA_ROOM = { sideCells: 3, bottomCells: 5.2 } as const;

/**
 * The stage (canvas) box around the overlay: rim + envelope margins + grid, all CSS px. With a
 * `cell` width (px) it also holds the diorama's lawn and earth block (the board scene passes it).
 */
export function poseStageLayout(
  gridWidth: number,
  gridHeight: number,
  rim: number,
  cell = 0,
): StageLayout {
  const envelope = poseMargins(gridWidth, gridHeight);
  const margins = {
    inline: envelope.inline + ceilUnit(cell * DIORAMA_ROOM.sideCells),
    top: envelope.top + ceilUnit(setTop(gridHeight)),
    bottom: envelope.bottom + ceilUnit(cell * DIORAMA_ROOM.bottomCells),
  };
  return {
    width: 2 * rim + gridWidth + 2 * margins.inline,
    height: 2 * rim + gridHeight + margins.top + margins.bottom,
    centreX: rim + margins.inline + gridWidth / 2,
    centreY: rim + margins.top + gridHeight / 2,
    gridHeight,
    margins,
  };
}
