/**
 * Every number of the end effects (story 010, UX §5) in one place, next to the hard limits of
 * the acceptance criteria. Pure and three-free. Calibrating means editing this file and the
 * `--scene-fx-*` / `--scene-confetti-*` tokens, nothing else; endPlan.test.ts checks the params
 * against EFFECT_LIMITS for every board size and quality level.
 *
 * Units: ms, cells (1 = the DOM cell width), cells per second, turns per second.
 */

/** Hard limits. Never calibrated. */
export const EFFECT_LIMITS = {
  lossMaxMs: 2500, // AC1
  winMaxMs: 4000, // AC2
  shakeMaxMs: 400, // AC1
  flashesPerSecondMax: 3, // AC1, AC2 (WCAG 2.3.1 style)
  frameSlackMs: 200, // the plan ends this long before the AC limit: a late frame still lands inside it
  flashAreaMaxPx: 150, // UX L1: bloom diameter on screen
  shakeMaxPx: 5, // UX L3: peak push on screen
} as const;

/** G1, G2. (G3, the frame-gap jump, was dropped in review round 1: a hidden tab ends the effect through `visibilitychange`, and closed-form effects need no catch-up rule.) */
export const FX_GENERAL = {
  lossEndMs: 2200,
  winEndMs: 3600,
} as const;

/** L1–L12 */
export const FX_LOSS = {
  bloom: { durationMs: 280, growMs: 90, peakMs: 50, diameterFrom: 1, diameterTo: 4, z: 0.6 },
  light: { enabled: true, height: 0.8, reach: 6, peakMs: 40, durationMs: 400 },
  shake: { durationMs: 400, amplitude: 0.18, hz: 2.5 },
  ring: {
    durationMs: 450,
    radiusFrom: 0.4,
    radiusTo: 3.5,
    widthFrom: 0.4,
    widthTo: 0.08,
    opacity: 0.7,
    z: 0.2,
  },
  fire: {
    count: 16,
    bornMaxMs: 120,
    lifeMinMs: 400,
    lifeMaxMs: 650,
    sizeFrom: 1.0,
    sizeTo: 2.8,
    riseMin: 1.5,
    riseMax: 3,
    spread: 2.4, // horizontal start speed, cells/s
    z: 0.35,
    /** Alpha fades to 0 over the last part of the life. */
    fadeFrom: 0.45,
    /** Colour by age: core until `mid`, mid until `edge`, edge after. */
    mid: 0.3,
    edge: 0.65,
  },
  sparks: {
    count: 56,
    width: 0.06,
    length: 0.32,
    minWidthPx: 2,
    speedMin: 7,
    speedMax: 12,
    gravity: 18,
    lifeMinMs: 500,
    lifeMaxMs: 900,
    shrinkFrom: 0.7,
    z: 0.3,
  },
  shards: {
    count: 8,
    sizeMin: 0.22,
    sizeMax: 0.34,
    thickness: 0.35, // of the size
    speedMin: 5,
    speedMax: 8,
    angleMinDeg: 20,
    angleMaxDeg: 55,
    spinMin: 1,
    spinMax: 3,
    gravity: 20,
    maxLifeMs: 1200,
    scaleOutMs: 120,
    z: 0.1,
    /** They vanish when they fall back to the hidden tile tops. */
    landZ: 0.15,
  },
  smoke: {
    count: 10,
    bornMs: 250,
    bornSpreadMs: 150,
    lifeMinMs: 1000,
    lifeMaxMs: 1400,
    sizeFrom: 0.9,
    sizeTo: 2.6,
    rise: 0.8,
    endMs: 1700,
    z: 0.5,
    /** Alpha reaches its peak at this share of the life. */
    peakAt: 0.25,
  },
  shudder: { radius: 3, height: 0.1, speed: 8, durationMs: 260 },
  marker: { discStartMs: 300, mineStartMs: 350, durationMs: 200, from: 0.6, overshoot: 1.4 },
  chain: {
    startMs: 550,
    stepMs: 90,
    maxMs: 1000,
    flipMs: 200,
    bands: 4,
    puffsPerMine: 2,
    puffSizeFrom: 0.5,
    puffSizeTo: 1.0,
    puffLifeMs: 350,
    puffDelayMs: 60, // after the flip starts: the tile is off the pit
    puffMines: 40,
  },
  wrongFlags: { gapMs: 100, spreadMaxMs: 250, durationMs: 200, overshoot: 1.4 },
} as const;

/** W1–W6 */
export const FX_WIN = {
  cannons: {
    share: 0.35,
    inset: 0.5,
    fireMs: 120,
    angleDeg: 30, // inward from vertical
    angleSpread: 0.5, // ± share of the angle: 15° to 45°
    speedPerRow: 3.0,
    speedMin: 12,
    speedMax: 32,
    speedSpread: [0.7, 1.1], // share of the speed: pieces stop at different heights
    drag: 2,
  },
  rain: {
    share: 0.65,
    bornMinMs: 150,
    bornMaxMs: 1250,
    above: 1.5,
    side: 1,
    crossS: 2.2,
    fallMin: 4.5,
    fallMax: 14,
    drag: 2,
  },
  flutter: { amp: 0.5, hzMin: 0.7, hzMax: 1.3 },
  piece: {
    rect: [0.26, 0.16],
    dot: 0.16,
    ribbon: [0.4, 0.06],
    rectMinPx: [6, 4],
    dotMinPx: 4,
    ribbonMinPx: [9, 2],
    /** Shares of rectangles, dots, ribbons. */
    shapes: [0.45, 0.3, 0.25],
    spinMin: 0.6,
    spinMax: 1.2,
    tumbleMax: 0.4, // turns per second in the screen plane
    /** Height above the board plane: above flags and slashes, a little parallax. */
    heightMin: 1.0,
    heightMax: 4.0,
    /** Colour weights of --scene-confetti-1…6: gold (5) most often. */
    colourWeights: [0.15, 0.15, 0.15, 0.15, 0.25, 0.15],
  },
  count: { perCell: 3.5, min: 220, max: 420, bigBoardCells: 400, bigFactor: 0.7 },
  end: { below: 1.5, scaleOutFromMs: 3200, scaleOutToMs: 3500 },
  hop: { startMs: 1000, spreadMs: 1100, height: 0.22, upMs: 150, downMs: 150 },
} as const;

/** S1 (board size) and S2 (quality level) */
export const FX_SCALE = {
  bySize: [
    { maxCells: 256, particles: 1, shards: 8, shudder: true, chainPuffMines: 40 },
    { maxCells: 600, particles: 0.75, shards: 6, shudder: false, chainPuffMines: 20 },
    { maxCells: Infinity, particles: 0.5, shards: 4, shudder: false, chainPuffMines: 10 },
  ],
  byLevel: [
    { particles: 1, shards: Infinity, shudder: true, light: true, smoke: true, hop: true },
    { particles: 0.6, shards: Infinity, shudder: false, light: false, smoke: true, hop: true },
    { particles: 0.3, shards: 3, shudder: false, light: false, smoke: false, hop: false },
  ],
} as const;

/** Buffer capacities: the largest counts at scale 1 plus 20 %. */
export const FX_CAPACITY = {
  glow: Math.ceil(
    1.2 *
      (FX_LOSS.fire.count +
        FX_LOSS.sparks.count +
        FX_LOSS.smoke.count +
        FX_LOSS.chain.puffMines * FX_LOSS.chain.puffsPerMine),
  ),
  shards: Math.ceil(1.2 * FX_LOSS.shards.count),
  confetti: Math.ceil(1.2 * FX_WIN.count.max),
} as const;
