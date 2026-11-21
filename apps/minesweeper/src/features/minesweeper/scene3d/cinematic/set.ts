import {
  CanvasTexture,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
  type Texture,
} from 'three';
import { rng } from '../endPlan.ts';
import type { ScenePalette } from '../types.ts';
import { noise3 } from './art.ts';

/**
 * The backdrop and the earth cross-section of the cinematic diorama (story 050, round 3): a painted
 * sky with the low sun (or the moon, clouds and stars at night), hazy hills, and the layered earth
 * that shows on the sides of the block. Procedural canvases, no files. Coordinates are cells, z up;
 * the group goes under the scene's root, which is scaled by the cell size.
 */

const SKY_W = 1024;
const SKY_H = 256;
const STRATA_W = 512;
const STRATA_H = 256;
/** Height of the backdrop in cells; the lowest few show above the block. */
const WALL_HEIGHT = 18;
export const WALL_GAP = 1.6;

const hex = (c: Color) => `#${c.getHexString()}`;

function drawHill(
  context: CanvasRenderingContext2D,
  base: number,
  amplitude: number,
  scale: number,
  seed: number,
  colour: string,
) {
  context.fillStyle = colour;
  context.beginPath();
  context.moveTo(0, SKY_H);
  for (let x = 0; x <= SKY_W; x += 8) {
    const y =
      base -
      amplitude * (0.6 * noise3(x / scale, seed, 0) + 0.4 * noise3(x / (scale / 3), seed, 1));
    context.lineTo(x, y);
  }
  context.lineTo(SKY_W, SKY_H);
  context.closePath();
  context.fill();
}

function drawSky(canvas: HTMLCanvasElement, palette: ScenePalette, dark: boolean): void {
  const context = canvas.getContext('2d');
  if (!context) return;
  const { colours } = palette;
  const low = new Color(colours.dioSkyLow);
  const high = new Color(colours.dioSkyHigh);
  const sun = new Color(colours.dioSun);
  const next = rng(41);
  const horizon = SKY_H * 0.74;

  const sky = context.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, hex(high));
  sky.addColorStop(0.55, hex(high.clone().lerp(low, 0.35)));
  sky.addColorStop(1, hex(low));
  context.fillStyle = sky;
  context.fillRect(0, 0, SKY_W, SKY_H);

  // The sun hangs low over the far left (where the key light comes from); at night the moon.
  const sx = SKY_W * 0.3;
  const sy = horizon - SKY_H * (dark ? 0.1 : 0.12);
  const glow = context.createRadialGradient(sx, sy, 2, sx, sy, SKY_H * (dark ? 0.7 : 0.95));
  glow.addColorStop(0, `rgb(${sun.r * 255} ${sun.g * 255} ${sun.b * 255} / ${dark ? 70 : 95}%)`);
  glow.addColorStop(1, 'rgb(255 255 255 / 0%)');
  context.fillStyle = glow;
  context.fillRect(0, 0, SKY_W, SKY_H);
  if (dark) {
    for (let i = 0; i < 260; i++) {
      const y = next() * horizon * 0.95;
      const alpha = (0.25 + 0.6 * next()) * (1 - (y / horizon) * 0.5);
      context.fillStyle = `rgb(255 255 255 / ${Math.round(alpha * 100)}%)`;
      const size = next() < 0.08 ? 2.2 : 1.1;
      context.fillRect(next() * SKY_W, y, size, size);
    }
  }
  // Moon or sun disc.
  if (dark) {
    context.fillStyle = 'rgb(235 240 255 / 95%)';
    context.beginPath();
    context.arc(sx, sy, SKY_H * 0.05, 0, Math.PI * 2);
    context.fill();
  }

  // Clouds: soft blobs, lit from below by the low sun.
  for (let i = 0; i < 9; i++) {
    const cx = next() * SKY_W;
    const cy = horizon * (0.25 + 0.6 * next());
    const w = 70 + 120 * next();
    for (let k = 0; k < 6; k++) {
      const px = cx + (k - 2.5) * w * 0.22;
      const py = cy + (next() - 0.5) * 10;
      const r = w * (0.16 + 0.12 * next());
      const cloud = context.createRadialGradient(px, py, 1, px, py, r);
      const tone = dark ? '120 135 190' : '255 226 190';
      cloud.addColorStop(0, `rgb(${tone} / ${dark ? 22 : 55}%)`);
      cloud.addColorStop(1, `rgb(${tone} / 0%)`);
      context.fillStyle = cloud;
      context.fillRect(px - r, py - r, r * 2, r * 2);
    }
  }

  // Hills, far to near: hazier and lighter in the distance; the foot melts into the haze that
  // the fogged ground ends in, so the backdrop and the ground meet without a line.
  const far = low
    .clone()
    .lerp(high, 0.22)
    .multiplyScalar(dark ? 0.8 : 0.88);
  const mid = low
    .clone()
    .lerp(high, 0.1)
    .multiplyScalar(dark ? 0.55 : 0.62);
  const near = new Color(colours.dioGrass).multiplyScalar(dark ? 0.32 : 0.5).lerp(low, 0.25);
  drawHill(context, horizon + 6, 38, 170, 5, hex(far));
  drawHill(context, horizon + 20, 30, 110, 9, hex(mid));
  drawHill(context, horizon + 34, 22, 70, 13, hex(near));
  const haze = context.createLinearGradient(0, horizon + 26, 0, SKY_H);
  haze.addColorStop(0, 'rgb(255 255 255 / 0%)');
  haze.addColorStop(1, hex(low));
  context.fillStyle = haze;
  context.fillRect(0, horizon + 26, SKY_W, SKY_H - horizon - 26);
}

/** Layers of earth for the sides of the block: topsoil, clay with a wavy edge, stones, roots. */
function drawStrata(canvas: HTMLCanvasElement, palette: ScenePalette): void {
  const context = canvas.getContext('2d');
  if (!context) return;
  const { colours } = palette;
  const deep = new Color(colours.dioSoilDeep);
  const soil = new Color(colours.dioSoil);
  const clay = new Color(colours.dioClay);
  const rock = deep.clone().lerp(clay, 0.35).multiplyScalar(0.8);
  const next = rng(77);
  context.fillStyle = hex(rock);
  context.fillRect(0, 0, STRATA_W, STRATA_H);
  const band = (from: number, to: number, colour: Color, seed: number) => {
    context.fillStyle = hex(colour);
    context.beginPath();
    context.moveTo(0, 0);
    for (let x = 0; x <= STRATA_W; x += 4) {
      context.lineTo(x, STRATA_H * from + 10 * (noise3(x / 38, seed, 0) - 0.5) * 2);
    }
    for (let x = STRATA_W; x >= 0; x -= 4) {
      context.lineTo(x, STRATA_H * to + 14 * (noise3(x / 30, seed + 4, 0) - 0.5) * 2);
    }
    context.closePath();
    context.fill();
  };
  band(0, 0.58, clay, 3);
  band(0, 0.24, soil.clone().lerp(deep, 0.35), 6);
  // Specks and pebbles in every layer.
  for (let i = 0; i < 700; i++) {
    const y = next() * STRATA_H;
    const light = next() < 0.5;
    context.fillStyle = light ? 'rgb(255 255 255 / 9%)' : 'rgb(0 0 0 / 16%)';
    context.fillRect(next() * STRATA_W, y, 1 + next() * 2.4, 1 + next() * 1.6);
  }
  for (let i = 0; i < 46; i++) {
    const x = next() * STRATA_W;
    const y = STRATA_H * (0.3 + 0.7 * next());
    const rx = 3 + 7 * next();
    context.fillStyle = `rgb(${110 + 60 * next()} ${100 + 50 * next()} ${90 + 40 * next()} / 85%)`;
    context.beginPath();
    context.ellipse(x, y, rx, rx * 0.65, next() * 3, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = 'rgb(0 0 0 / 22%)';
    context.beginPath();
    context.ellipse(x + 1, y + 1.5, rx * 0.9, rx * 0.5, 0, 0, Math.PI);
    context.fill();
  }
  // Roots hanging from the grass.
  context.strokeStyle = 'rgb(70 48 28 / 80%)';
  for (let i = 0; i < 26; i++) {
    let x = next() * STRATA_W;
    let y = 0;
    context.lineWidth = 0.8 + next() * 1.4;
    context.beginPath();
    context.moveTo(x, y);
    const length = 20 + 55 * next();
    for (let s = 0; s < 6; s++) {
      x += (next() - 0.5) * 9;
      y += length / 6;
      context.lineTo(x, y);
    }
    context.stroke();
  }
  // Grass on top edge: a dark seam so the turf above reads as the lid of the block.
  const seam = context.createLinearGradient(0, 0, 0, 16);
  seam.addColorStop(0, 'rgb(0 0 0 / 45%)');
  seam.addColorStop(1, 'rgb(0 0 0 / 0%)');
  context.fillStyle = seam;
  context.fillRect(0, 0, STRATA_W, 16);
}

export interface Backdrop {
  /** The wall; goes under the scene's root. */
  readonly group: Group;
  /** The layers of earth for the block's sides. */
  readonly strata: Texture;
  /** Colour of the far end of the world (the fog colour). */
  readonly horizon: Color;
  applyPalette(palette: ScenePalette, dark: boolean): void;
  /** Places the wall `gap` cells behind the far edge of the block of half extents (ex, ey). */
  fit(halfX: number, halfY: number, floorZ: number): void;
  dispose(): void;
}

export function createBackdrop(maxAnisotropy: number): Backdrop {
  const group = new Group();

  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = SKY_W;
  skyCanvas.height = SKY_H;
  const sky = new CanvasTexture(skyCanvas);
  sky.colorSpace = SRGBColorSpace;
  const wallMaterial = new MeshBasicMaterial({ map: sky, fog: false });
  const wall = new Mesh(new PlaneGeometry(1, 1), wallMaterial);
  // Faces the camera (-y); the plane's normal +z turned by +90 degrees about x.
  wall.quaternion.setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
  wall.frustumCulled = false;
  group.add(wall);

  const strataCanvas = document.createElement('canvas');
  strataCanvas.width = STRATA_W;
  strataCanvas.height = STRATA_H;
  const strata = new CanvasTexture(strataCanvas);
  strata.colorSpace = SRGBColorSpace;
  strata.wrapS = RepeatWrapping;
  strata.anisotropy = maxAnisotropy;

  const horizon = new Color();

  return {
    group,
    strata,
    horizon,
    applyPalette(palette, dark) {
      drawSky(skyCanvas, palette, dark);
      sky.needsUpdate = true;
      drawStrata(strataCanvas, palette);
      strata.needsUpdate = true;
      horizon.set(palette.colours.dioSkyLow);
    },
    fit(halfX, halfY, floorZ) {
      wall.scale.set(halfX * 2 * 2.8, WALL_HEIGHT, 1);
      wall.position.set(0, halfY + WALL_GAP, floorZ + WALL_HEIGHT / 2);
    },
    dispose() {
      sky.dispose();
      strata.dispose();
      wall.geometry.dispose();
      wallMaterial.dispose();
    },
  };
}
