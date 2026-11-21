import { CanvasTexture, Color, SRGBColorSpace } from 'three';
import { rng } from '../endPlan.ts';
import type { ScenePalette } from '../types.ts';

/**
 * The surface textures of the diorama's cells (story 050, round 3): short strokes of grass for the
 * turf and crumbly earth with clods, pebbles and cracks for the dug cells. Painted once per palette
 * on a canvas, no files. Both fill one cell (uv 0..1); the top-right corner texel stays white, so the
 * walls and blades of the same mesh can point there and keep their vertex colours untouched.
 */

const SIZE = 256;

export interface CellTextures {
  readonly turf: CanvasTexture;
  readonly earth: CanvasTexture;
  paint(palette: ScenePalette): void;
  dispose(): void;
}

const style = (c: Color) => c.getStyle();
/** `rgb(r,g,b)` with an alpha (0..1) in the legacy comma syntax that getStyle() writes. */
const withAlpha = (c: Color, alpha: number) =>
  c.getStyle().replace('rgb(', 'rgba(').replace(')', `,${alpha})`);

/** The cell's four edges get darker: the seams between turf blocks and the walls of a hole. */
function edgeShade(context: CanvasRenderingContext2D, width: number, strength: number) {
  for (const [x0, y0, x1, y1] of [
    [0, 0, width, 0],
    [SIZE, 0, SIZE - width, 0],
    [0, 0, 0, width],
    [0, SIZE, 0, SIZE - width],
  ] as const) {
    const gradient = context.createLinearGradient(x0, y0, x1, y1);
    gradient.addColorStop(0, `rgb(0 0 0 / ${Math.round(strength * 100)}%)`);
    gradient.addColorStop(1, 'rgb(0 0 0 / 0%)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, SIZE, SIZE);
  }
}

/** The white texel the other parts of the mesh sample. */
function neutral(context: CanvasRenderingContext2D) {
  context.fillStyle = 'rgb(255 255 255)';
  context.fillRect(SIZE - 16, 0, 16, 16);
}

function drawTurf(canvas: HTMLCanvasElement, palette: ScenePalette) {
  const context = canvas.getContext('2d');
  if (!context) return;
  const next = rng(17);
  const grass = new Color(palette.colours.dioGrass);
  const tip = new Color(palette.colours.dioGrassTip);
  const base = grass.clone().multiplyScalar(0.62);
  context.fillStyle = style(base);
  context.fillRect(0, 0, SIZE, SIZE);
  // Soft mottling: clumps that are darker and sunnier patches.
  for (let i = 0; i < 46; i++) {
    const x = next() * SIZE;
    const y = next() * SIZE;
    const r = 16 + 34 * next();
    const patch = context.createRadialGradient(x, y, 1, x, y, r);
    const sunny = next() < 0.45;
    patch.addColorStop(0, sunny ? 'rgb(255 240 150 / 16%)' : 'rgb(0 20 0 / 22%)');
    patch.addColorStop(1, 'rgb(0 0 0 / 0%)');
    context.fillStyle = patch;
    context.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  // Blades seen from above: short strokes, dark at the root, light at the tip.
  const stroke = new Color();
  context.lineCap = 'round';
  for (let i = 0; i < 2100; i++) {
    const x = next() * SIZE;
    const y = next() * SIZE;
    const a = next() * Math.PI * 2;
    const length = 5 + 13 * next();
    const lift = next();
    stroke
      .copy(base)
      .lerp(grass, 0.4 + 0.6 * next())
      .lerp(tip, lift * lift * 0.9);
    context.strokeStyle = style(stroke);
    context.lineWidth = 1.1 + 1.5 * next();
    context.beginPath();
    context.moveTo(x, y);
    context.quadraticCurveTo(
      x + Math.cos(a) * length * 0.5 + (next() - 0.5) * 4,
      y + Math.sin(a) * length * 0.5 + (next() - 0.5) * 4,
      x + Math.cos(a) * length,
      y + Math.sin(a) * length,
    );
    context.stroke();
  }
  // Dark gaps between the clumps.
  for (let i = 0; i < 380; i++) {
    context.fillStyle = 'rgb(8 22 4 / 30%)';
    context.fillRect(next() * SIZE, next() * SIZE, 1 + 2 * next(), 1 + 2 * next());
  }
  edgeShade(context, 20, 0.5);
  neutral(context);
}

function drawEarth(canvas: HTMLCanvasElement, palette: ScenePalette) {
  const context = canvas.getContext('2d');
  if (!context) return;
  const next = rng(29);
  const soil = new Color(palette.colours.dioSoil);
  const deep = new Color(palette.colours.dioSoilDeep);
  const base = soil.clone().lerp(deep, 0.45);
  context.fillStyle = style(base);
  context.fillRect(0, 0, SIZE, SIZE);
  const tone = new Color();
  for (let i = 0; i < 7000; i++) {
    tone.copy(deep).lerp(soil, next() * 1.15);
    context.fillStyle = withAlpha(tone, (40 + 55 * next()) / 100);
    const s = 1 + 3 * next() * next();
    context.fillRect(next() * SIZE, next() * SIZE, s, s);
  }
  // Clods: lit from the upper left, dark underneath.
  for (let i = 0; i < 90; i++) {
    const x = next() * SIZE;
    const y = next() * SIZE;
    const r = 3 + 8 * next() * next() + 2;
    const clod = context.createRadialGradient(x - r * 0.3, y - r * 0.35, 0.5, x, y, r);
    tone.copy(soil).lerp(deep, 0.2 + 0.4 * next());
    clod.addColorStop(0, style(tone.clone().multiplyScalar(1.5)));
    clod.addColorStop(0.6, style(tone));
    clod.addColorStop(1, style(deep.clone().multiplyScalar(0.55)));
    context.fillStyle = clod;
    context.beginPath();
    context.ellipse(x, y, r, r * (0.7 + 0.3 * next()), next() * 3, 0, Math.PI * 2);
    context.fill();
  }
  // Pebbles: grey-beige with a highlight.
  for (let i = 0; i < 16; i++) {
    const x = next() * SIZE;
    const y = next() * SIZE;
    const r = 2.5 + 4 * next();
    const pebble = context.createRadialGradient(x - r * 0.35, y - r * 0.4, 0.4, x, y, r);
    pebble.addColorStop(0, 'rgb(205 192 172)');
    pebble.addColorStop(0.55, 'rgb(142 128 112)');
    pebble.addColorStop(1, 'rgb(62 52 44)');
    context.fillStyle = pebble;
    context.beginPath();
    context.ellipse(x, y, r, r * 0.75, next() * 3, 0, Math.PI * 2);
    context.fill();
  }
  // Cracks and a root or two.
  context.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    let x = next() * SIZE;
    let y = next() * SIZE;
    context.strokeStyle = 'rgb(20 12 6 / 55%)';
    context.lineWidth = 0.8 + next();
    context.beginPath();
    context.moveTo(x, y);
    for (let s = 0; s < 5; s++) {
      x += (next() - 0.5) * 26;
      y += (next() - 0.5) * 26;
      context.lineTo(x, y);
    }
    context.stroke();
  }
  context.strokeStyle = 'rgb(150 110 70 / 60%)';
  for (let i = 0; i < 3; i++) {
    let x = next() * SIZE;
    let y = next() * SIZE;
    context.lineWidth = 1.2 + next();
    context.beginPath();
    context.moveTo(x, y);
    for (let s = 0; s < 6; s++) {
      x += 8 + next() * 14;
      y += (next() - 0.5) * 18;
      context.lineTo(x, y);
    }
    context.stroke();
  }
  edgeShade(context, 52, 0.62);
  neutral(context);
}

export function createCellTextures(maxAnisotropy: number): CellTextures {
  const make = () => {
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = maxAnisotropy;
    return { canvas, texture };
  };
  const turf = make();
  const earth = make();
  return {
    turf: turf.texture,
    earth: earth.texture,
    paint(palette) {
      drawTurf(turf.canvas, palette);
      drawEarth(earth.canvas, palette);
      turf.texture.needsUpdate = true;
      earth.texture.needsUpdate = true;
    },
    dispose() {
      turf.texture.dispose();
      earth.texture.dispose();
    },
  };
}
