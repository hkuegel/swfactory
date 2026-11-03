import { TILT_DEG } from './geometry.ts';

/**
 * Scene sizes in cell units (1 = the DOM cell width; UX §2–§4). World: x right, y towards the far
 * row, z up; z = 0 is the overlay plane, halfway between the hidden and revealed tile tops.
 */

export const TILE_SIZE = 1.0;
export const TILE_THICKNESS = 0.45;
export const TILE_RADIUS = 0.09;
export const TILE_SEGMENTS = 4;
export const HIDDEN_TOP = 0.15;
export const REVEALED_TOP = -0.15;
export const HIDDEN_CENTRE = HIDDEN_TOP - TILE_THICKNESS / 2;
export const REVEALED_CENTRE = REVEALED_TOP - TILE_THICKNESS / 2;
/** Touch long press: the tile sinks by a third of the reveal sink. */
export const PRESSED_SINK = 0.1;

export const FRAME_TOP = 0.05;
export const FRAME_WIDTH = 0.14;
export const FLOOR_TOP = -0.62;
export const TABLE_TOP = -0.8;

/**
 * Direction towards the key light, from the far left (UX §3.1 azimuth). Elevation 47° instead of
 * the UX's 61°: at 61° the 2 px gap and the rounded edges swallow the cast shadow of a raised tile
 * (measured 3–7 % darker; AC1 needs 10 %); at 47° the shadow covers about the outer 0.11 cell of
 * the neighbour (15–16 % darker), still clear of the digit halo (0.16 cell from the edge). The key
 * intensity is normalised to the UX's top cosine (UX_TOP_COSINE), so the calibration holds.
 */
export const KEY_ELEVATION_DEG = 47;
const KEY_AZIMUTH = Math.atan2(0.38, -0.3);
export const KEY_DIRECTION = [
  Math.cos((KEY_ELEVATION_DEG * Math.PI) / 180) * Math.cos(KEY_AZIMUTH),
  Math.cos((KEY_ELEVATION_DEG * Math.PI) / 180) * Math.sin(KEY_AZIMUTH),
  Math.sin((KEY_ELEVATION_DEG * Math.PI) / 180),
] as const;
/** z of the UX's light direction (0.875, elevation 61°): the cosine its calibration assumed. */
export const UX_TOP_COSINE = 0.875;

/** Digit decals: cap height, halo dilation (of the glyph height), lift above the revealed top. */
export const DIGIT_CAP_HEIGHT = 0.6;
export const DIGIT_HALO = 0.07;
export const DECAL_LIFT = 0.01;

/** Flag (UX §4.2). */
export const FLAG_LEAN_DEG = 28;
export const FLAG_BASE_OFFSET = -0.3; // towards the near side
export const POLE_RADIUS = 0.035;
export const POLE_LENGTH = 0.75;
export const BASE_RADIUS = 0.15;
export const BASE_HEIGHT = 0.04;
export const CLOTH_WIDTH = 0.6;
export const CLOTH_HEIGHT = 0.46;
export const POLE_HALO = 0.03;
export const CLOTH_HALO = 0.04;

/** Mine (UX §4.3): body, spikes, centre height above the revealed top, halo. */
export const MINE_RADIUS = 0.24;
export const SPIKE_LENGTH = 0.16;
export const SPIKE_RADIUS = 0.045;
export const SPIKE_COUNT = 8;
export const MINE_HEIGHT = 0.3;
export const MINE_HALO = 0.05;

/** Exploded marker (UX §4.4). */
export const EXPLODED_DISC = 0.4;
export const EXPLODED_RING_INNER = 0.43;
export const EXPLODED_RING_OUTER = 0.5;

/** Wrong-flag slash (UX §4.5): parallel to the screen (rotated back by the tilt). */
export const SLASH_LENGTH = 1.0;
export const SLASH_THICKNESS = 0.09;
export const SLASH_HALO_THICKNESS = 0.18;
export const SLASH_HEIGHT = 0.45;
export const SLASH_TILT_DEG = TILT_DEG;

/** Instanced meshes hold up to the largest board (30 × 30). */
export const MAX_CELLS = 900;
