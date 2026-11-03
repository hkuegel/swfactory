/**
 * The one geometry source of the 3D view (story 009, ADR 0005): the CSS transform of the DOM
 * overlay and the three.js camera are built from the same numbers, so every cell's hit box lies
 * on its drawn tile. Pure and three-free (part of the main chunk).
 *
 * Coordinates: CSS px, origin at the grid's layout centre, x right, y down, z towards the viewer.
 * The CSS model is `perspective(P) rotateY(sway) rotateX(tilt)` with P = DEPTH · H.
 */

/** Tilt of the board away from the viewer (AC1: at most 35°). */
export const TILT_DEG = 25;
/** Perspective distance in grid heights (008's value, validated at 320 px). */
export const DEPTH = 5;
/** Idle sway: yaw amplitude and period (AC1: at most 3°, at least 10 s). */
export const SWAY_DEG = 2;
export const SWAY_PERIOD_MS = 14_000;
/** Device-pixel-ratio cap and backbuffer budget (AC3). */
export const DPR_CAP = 2;
export const PIXEL_BUDGET = 4_200_000;

/** Number of sway angles sampled for the margins (0.05° apart at 2°). */
const MARGIN_SAMPLES = 81;
/** CSS layout works in 1/64 px; margins are rounded outwards to it. */
const LAYOUT_UNIT = 1 / 64;

export type Vec3 = readonly [x: number, y: number, z: number];

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Sway yaw in degrees at a sway time (0 at t = 0, +SWAY_DEG a quarter period later). */
export function swayAt(timeMs: number): number {
  return SWAY_DEG * Math.sin((2 * Math.PI * timeMs) / SWAY_PERIOD_MS);
}

export function perspectiveOf(gridHeight: number): number {
  return DEPTH * gridHeight;
}

/** The overlay grid's inline CSS transform (transform-origin stays at its centre). */
export function overlayTransform(gridHeight: number, swayDeg: number): string {
  return `perspective(${perspectiveOf(gridHeight)}px) rotateY(${swayDeg}deg) rotateX(${TILT_DEG}deg)`;
}

/** R = Ry(sway) · Rx(tilt) applied to a point (CSS coordinates, as the CSS functions do). */
function rotate([x, y, z]: Vec3, swayDeg: number): Vec3 {
  const ct = Math.cos(rad(TILT_DEG));
  const st = Math.sin(rad(TILT_DEG));
  const cp = Math.cos(rad(swayDeg));
  const sp = Math.sin(rad(swayDeg));
  // rotateX: y' = y·cos − z·sin, z' = y·sin + z·cos
  const y1 = y * ct - z * st;
  const z1 = y * st + z * ct;
  // rotateY: x' = x·cos + z·sin, z' = −x·sin + z·cos
  return [x * cp + z1 * sp, y1, -x * sp + z1 * cp];
}

/** Where the CSS model draws a point: offset from the grid's layout centre in CSS px. */
export function projectCss(
  point: Vec3,
  gridHeight: number,
  swayDeg: number,
): { x: number; y: number } {
  const p = perspectiveOf(gridHeight);
  const [x, y, z] = rotate(point, swayDeg);
  const scale = p / (p - z);
  return { x: x * scale, y: y * scale };
}

/** Angle between the board normal and the line of sight at the board centre (AC1: ≤ 35°). */
export function combinedTiltDeg(swayDeg: number): number {
  return (Math.acos(Math.cos(rad(TILT_DEG)) * Math.cos(rad(swayDeg))) * 180) / Math.PI;
}

/** Inline margins of the overlay grid: they shrink its layout box to the projected board. */
export interface BoardMargins {
  /** Negative: the far edge is drawn lower than the layout top. */
  readonly top: number;
  /** Negative: the tilted board is shorter than its layout box. */
  readonly bottom: number;
  /** Positive and symmetric: the near row is wider than the grid; keeps the vanishing point centred. */
  readonly inline: number;
}

/**
 * Margins that hold the projected board for every sway angle, so the transformed bounds never
 * change while it sways (no flickering scrollbars, no clipped left column).
 */
export function boardMargins(gridWidth: number, gridHeight: number): BoardMargins {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < MARGIN_SAMPLES; i++) {
    const sway = -SWAY_DEG + (2 * SWAY_DEG * i) / (MARGIN_SAMPLES - 1);
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        const { x, y } = projectCss(
          [(sx * gridWidth) / 2, (sy * gridHeight) / 2, 0],
          gridHeight,
          sway,
        );
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  const ceilUnit = (value: number) => Math.ceil(value / LAYOUT_UNIT) * LAYOUT_UNIT;
  return {
    top: ceilUnit(-(minY + gridHeight / 2)),
    bottom: ceilUnit(maxY - gridHeight / 2),
    inline: ceilUnit(Math.max(0, maxX - gridWidth / 2, -(minX + gridWidth / 2))),
  };
}

/** The stage (canvas) box around the overlay: rim + margins + grid, all CSS px. */
export interface StageLayout {
  readonly width: number;
  readonly height: number;
  /** The grid's layout centre in stage (canvas) coordinates: the camera's principal point. */
  readonly centreX: number;
  readonly centreY: number;
  readonly gridHeight: number;
  readonly margins: BoardMargins;
}

export function stageLayout(gridWidth: number, gridHeight: number, rim: number): StageLayout {
  const margins = boardMargins(gridWidth, gridHeight);
  return {
    width: 2 * rim + gridWidth + 2 * margins.inline,
    height: 2 * rim + gridHeight + margins.top + margins.bottom,
    centreX: rim + margins.inline + gridWidth / 2,
    centreY: rim + margins.top + gridHeight / 2,
    gridHeight,
    margins,
  };
}

/**
 * The camera's world matrix (column-major, as three's `Matrix4.fromArray`), the inverse of the
 * CSS model: `S · (Ry(sway) · Rx(tilt))⁻¹ · S · T(0, 0, P)` with S = diag(1, −1, 1), because
 * three is y-up. World: x right, y towards the far row, z up out of the board; z = 0 is the
 * overlay plane. The camera moves and the world stays, so the shadow map survives the sway.
 */
export function cameraWorldMatrix(gridHeight: number, swayDeg: number): number[] {
  const ex = rotate([1, 0, 0], swayDeg);
  const ey = rotate([0, 1, 0], swayDeg);
  const ez = rotate([0, 0, 1], swayDeg);
  // Rᵀ[i][j] = R[j][i] = (R·e_i)[j]
  const basis = [ex, ey, ez];
  const rt = (i: number, j: number) => basis[i]?.[j] ?? 0;
  const s = [1, -1, 1];
  const a = (i: number, j: number) => (s[i] ?? 1) * rt(i, j) * (s[j] ?? 1);
  const p = perspectiveOf(gridHeight);
  // Column-major: index = column · 4 + row.
  // prettier-ignore
  return [
    a(0, 0), a(1, 0), a(2, 0), 0,
    a(0, 1), a(1, 1), a(2, 1), 0,
    a(0, 2), a(1, 2), a(2, 2), 0,
    a(0, 2) * p, a(1, 2) * p, a(2, 2) * p, 1,
  ];
}

/** Off-centre perspective frustum (three's `makePerspective`) for a stage layout. */
export interface Frustum {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  readonly near: number;
  readonly far: number;
}

export function cameraFrustum(layout: StageLayout, gridWidth: number): Frustum {
  const p = perspectiveOf(layout.gridHeight);
  const near = p / 10;
  const far = 2 * p + 2 * Math.max(gridWidth, layout.gridHeight);
  const k = near / p; // the focal length in CSS px is P
  return {
    left: -layout.centreX * k,
    right: (layout.width - layout.centreX) * k,
    top: layout.centreY * k,
    bottom: -(layout.height - layout.centreY) * k,
    near,
    far,
  };
}

/** Device pixel ratio under the cap and the backbuffer budget (AC3). */
export function pixelRatio(
  deviceRatio: number,
  cssWidth: number,
  cssHeight: number,
  cap = DPR_CAP,
): number {
  const area = Math.max(1, cssWidth * cssHeight);
  return Math.max(0.5, Math.min(deviceRatio, cap, Math.sqrt(PIXEL_BUDGET / area)));
}
