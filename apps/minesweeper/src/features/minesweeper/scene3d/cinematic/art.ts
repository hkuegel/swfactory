import {
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
  Matrix4,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';
import { rng } from '../endPlan.ts';
import {
  CLOTH_HEIGHT,
  CLOTH_WIDTH,
  MINE_RADIUS,
  POLE_LENGTH,
  POLE_RADIUS,
  SPIKE_COUNT,
  SPIKE_LENGTH,
  SPIKE_RADIUS,
  TILE_THICKNESS,
} from '../sceneLayout.ts';

/**
 * The procedural art of the cinematic diorama (story 050, round 3): grass-covered turf blocks, dug
 * earth, rusty mines, flags on sticks and the props around the field. Every shape is built from
 * numbers (no files); the colours are written into a `color` attribute from the palette by `paint`,
 * so a scheme switch only repaints. Units are cells, z up; a tile is centred on its own origin.
 */

type Vec = readonly [number, number, number];

/** What a vertex is made of; `colourOf` turns kind + tone + tint into a colour. */
export const KIND = {
  soil: 0,
  turf: 1,
  blade: 2,
  hole: 3,
  stone: 4,
  wood: 5,
  rust: 6,
  iron: 7,
  rivet: 8,
  cloth: 9,
  flower: 10,
  soot: 11,
  stem: 12,
} as const;

/** Colours the art needs, in the working (linear) space; filled by the diorama from the palette. */
export interface Tones {
  readonly grassDark: Color;
  readonly grass: Color;
  readonly tip: Color;
  readonly soilDeep: Color;
  readonly soil: Color;
  readonly clay: Color;
  readonly rust: Color;
  readonly iron: Color;
  readonly cloth: Color;
  readonly flowers: readonly Color[];
}

export const createTones = (): Tones => ({
  grassDark: new Color(),
  grass: new Color(),
  tip: new Color(),
  soilDeep: new Color(),
  soil: new Color(),
  clay: new Color(),
  rust: new Color(),
  iron: new Color(),
  cloth: new Color(),
  flowers: Array.from({ length: 5 }, () => new Color()),
});

const scratch = new Color();

function colourOf(kind: number, tone: number, tint: number, t: Tones, out: Color): Color {
  switch (kind) {
    case KIND.soil:
      return out.copy(t.soilDeep).lerp(t.soil, tone);
    case KIND.turf:
      return out.setRGB(1, 1, 1).multiplyScalar(0.85 + 0.3 * tone); // the texture carries the colour
    case KIND.blade:
      scratch.copy(t.grass).lerp(t.tip, 0.85 * tint);
      return out.copy(t.grassDark).lerp(scratch, 0.15 + 0.85 * tone);
    case KIND.hole:
      return out.setRGB(1, 1, 1).multiplyScalar(0.88 + 0.24 * tint); // the texture carries the colour
    case KIND.stone:
      return out.setRGB(0.3, 0.26, 0.22).multiplyScalar(0.5 + 0.8 * tone);
    case KIND.wood:
      return out.copy(t.clay).multiplyScalar(0.45 + 0.4 * tone);
    case KIND.rust:
      return out.copy(t.iron).lerp(scratch.copy(t.rust).multiplyScalar(1.6), 0.85 * tone);
    case KIND.iron:
      return out.copy(t.iron).multiplyScalar(0.8 + 0.8 * tone);
    case KIND.rivet:
      return out.copy(t.iron).multiplyScalar(2.4);
    case KIND.cloth:
      return out.copy(t.cloth).multiplyScalar(0.62 + 0.5 * tone);
    case KIND.flower:
      return out.copy(t.flowers[Math.min(4, Math.floor(tone * 5))] ?? t.cloth);
    case KIND.soot:
      return out.setRGB(0.05, 0.045, 0.04).multiplyScalar(0.7 + 0.6 * tone);
    default:
      return out.copy(t.grass).multiplyScalar(0.55);
  }
}

/** A built shape plus what `paint` needs to colour it again. */
export interface Built {
  readonly geometry: BufferGeometry;
  readonly kind: Uint8Array;
  readonly tone: Float32Array;
  readonly tint: Float32Array;
}

export function paint(built: Built, tones: Tones): void {
  const color = built.geometry.getAttribute('color');
  const out = new Color();
  for (let i = 0; i < color.count; i++) {
    colourOf(built.kind[i] ?? 0, built.tone[i] ?? 0, built.tint[i] ?? 0, tones, out);
    color.setXYZ(i, out.r, out.g, out.b);
  }
  color.needsUpdate = true;
}

const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit = (a: Vec): Vec => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** The white texel in the corner of the cell textures (textures.ts). */
const NEUTRAL_UV = [0.985, 0.985] as const;

/** Collects triangles with a kind, tone and tint per vertex. */
export class Mesher {
  private readonly position: number[] = [];
  private readonly normal: number[] = [];
  private readonly kinds: number[] = [];
  private readonly tones: number[] = [];
  private readonly tints: number[] = [];
  private readonly uvs: number[] = [];

  /** `uv`: where the cell textures are sampled; the default is their white corner texel. */
  vertex(
    p: Vec,
    n: Vec,
    kind: number,
    tone: number,
    tint: number,
    uv: readonly [number, number] = NEUTRAL_UV,
  ): void {
    this.uvs.push(uv[0], uv[1]);
    this.position.push(p[0], p[1], p[2]);
    this.normal.push(n[0], n[1], n[2]);
    this.kinds.push(kind);
    this.tones.push(tone);
    this.tints.push(tint);
  }

  /** A flat triangle, counter-clockwise seen from its normal's side. */
  tri(a: Vec, b: Vec, c: Vec, kind: number, tones: Vec, tint: number): void {
    const n = unit(cross(sub(b, a), sub(c, a)));
    this.vertex(a, n, kind, tones[0], tint);
    this.vertex(b, n, kind, tones[1], tint);
    this.vertex(c, n, kind, tones[2], tint);
  }

  /** A quad a, b, c, d (counter-clockwise) with a tone per corner. */
  quad(
    a: Vec,
    b: Vec,
    c: Vec,
    d: Vec,
    kind: number,
    tones: readonly [number, number, number, number],
    tint: number,
  ): void {
    this.tri(a, b, c, kind, [tones[0], tones[1], tones[2]], tint);
    this.tri(a, c, d, kind, [tones[0], tones[2], tones[3]], tint);
  }

  /** Adds a three.js geometry (indexed or not) through `matrix`, flat or smooth as it comes. */
  add(
    geometry: BufferGeometry,
    matrix: Matrix4,
    kind: number,
    tone: (p: Vector3, n: Vector3) => number,
    tint: number,
  ): void {
    const flat = geometry.index ? geometry.toNonIndexed() : geometry;
    const position = flat.getAttribute('position');
    const normal = flat.getAttribute('normal');
    const p = new Vector3();
    const n = new Vector3();
    for (let i = 0; i < position.count; i++) {
      p.fromBufferAttribute(position, i).applyMatrix4(matrix);
      n.fromBufferAttribute(normal, i).transformDirection(matrix);
      this.vertex([p.x, p.y, p.z], [n.x, n.y, n.z], kind, tone(p, n), tint);
    }
    if (flat !== geometry) flat.dispose();
    geometry.dispose();
  }

  build(): Built {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(this.position, 3));
    geometry.setAttribute('normal', new Float32BufferAttribute(this.normal, 3));
    geometry.setAttribute(
      'color',
      new Float32BufferAttribute(new Float32Array(this.position.length), 3),
    );
    geometry.setAttribute('uv', new Float32BufferAttribute(this.uvs, 2));
    return {
      geometry,
      kind: Uint8Array.from(this.kinds),
      tone: Float32Array.from(this.tones),
      tint: Float32Array.from(this.tints),
    };
  }
}

// --- Value noise (deterministic) ----------------------------------------------------------------

function hash3(x: number, y: number, z: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Smooth value noise in [0, 1). */
export function noise3(x: number, y: number, z: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const fx = smooth(x - xi);
  const fy = smooth(y - yi);
  const fz = smooth(z - zi);
  const corner = (dx: number, dy: number, dz: number) => hash3(xi + dx, yi + dy, zi + dz);
  const lerpX = (dy: number, dz: number) => mix(corner(0, dy, dz), corner(1, dy, dz), fx);
  return mix(mix(lerpX(0, 0), lerpX(1, 0), fy), mix(lerpX(0, 1), lerpX(1, 1), fy), fz);
}

// --- The turf block: soil sides, a domed lawn, blades --------------------------------------------

const HALF = TILE_THICKNESS / 2;
/** The turf stands this much taller than the 3D tile, so a dug cell has a visible wall. */
const LIFT = 0.1;
const DOME_EDGE = 0.125 + LIFT;
const DOME_TOP = HALF + LIFT;
const GRID = 8;

const dome = (u: number, v: number) => {
  const r = Math.max(Math.abs(u), Math.abs(v)) * 2;
  return DOME_EDGE + (DOME_TOP - DOME_EDGE) * (1 - r ** 2.4);
};

/** Triangles over a (GRID x GRID) height field on [-0.5, 0.5]^2; normals from the grid. */
function heightfield(
  m: Mesher,
  n: number,
  height: (u: number, v: number, i: number, j: number) => number,
  kind: number,
  tone: (u: number, v: number) => number,
  next: () => number,
): void {
  const at = (i: number, j: number): Vec => {
    const u = -0.5 + i / n;
    const v = -0.5 + j / n;
    return [u, v, height(u, v, i, j)];
  };
  const grid = Array.from({ length: n + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => at(i, j)),
  );
  const point = (i: number, j: number): Vec => grid[i]?.[j] ?? [0, 0, 0];
  const normalAt = (i: number, j: number): Vec => {
    const dx = sub(point(Math.min(n, i + 1), j), point(Math.max(0, i - 1), j));
    const dy = sub(point(i, Math.min(n, j + 1)), point(i, Math.max(0, j - 1)));
    return unit(cross(dx, dy));
  };
  const put = (i: number, j: number) => {
    const p = point(i, j);
    m.vertex(p, normalAt(i, j), kind, tone(p[0], p[1]), next(), [
      0.02 + (p[0] + 0.5) * 0.86,
      0.02 + (p[1] + 0.5) * 0.86,
    ]);
  };
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      put(i, j);
      put(i + 1, j);
      put(i + 1, j + 1);
      put(i, j);
      put(i + 1, j + 1);
      put(i, j + 1);
    }
  }
}

/** The four soil walls of a block from `bottom` to `top`, darker at the bottom. */
function walls(m: Mesher, kind: number, bottom: number, top: number, tint: number): void {
  const corners: Vec[] = [
    [-0.5, -0.5, 0],
    [0.5, -0.5, 0],
    [0.5, 0.5, 0],
    [-0.5, 0.5, 0],
  ];
  for (let i = 0; i < 4; i++) {
    const a = corners[i] ?? [0, 0, 0];
    const b = corners[(i + 1) % 4] ?? [0, 0, 0];
    m.quad(
      [a[0], a[1], bottom],
      [b[0], b[1], bottom],
      [b[0], b[1], top],
      [a[0], a[1], top],
      kind,
      [0, 0, 1, 1],
      tint,
    );
  }
}

/**
 * A turf block: soil sides, a domed lawn, and `blades` blades of grass (some in clumps, short at the
 * edges so the step to a dug cell stays small and a digit next to it is never hidden). 1 x 1 cell.
 */
export function turfBlock(blades: number, seed: number): Built {
  const next = rng(seed);
  const m = new Mesher();
  walls(m, KIND.soil, -HALF, DOME_EDGE, 0.5);
  heightfield(
    m,
    GRID,
    (u, v) => dome(u, v) + 0.006 * (next() - 0.5),
    KIND.turf,
    () => next(),
    next,
  );
  const clumps = Array.from({ length: 4 }, () => [(next() - 0.5) * 0.7, (next() - 0.5) * 0.7]);
  for (let i = 0; i < blades; i++) {
    let x: number;
    let y: number;
    const clump = clumps[i % 4];
    if (i % 5 < 2 && clump) {
      x = (clump[0] ?? 0) + (next() + next() - 1) * 0.1;
      y = (clump[1] ?? 0) + (next() + next() - 1) * 0.1;
    } else {
      x = (next() - 0.5) * 0.94;
      y = (next() - 0.5) * 0.94;
    }
    x = Math.max(-0.47, Math.min(0.47, x));
    y = Math.max(-0.47, Math.min(0.47, y));
    const edge = Math.max(Math.abs(x), Math.abs(y)) * 2;
    const height = (0.09 + 0.2 * next()) * (1 - 0.85 * edge * edge);
    const width = 0.04 + 0.03 * next();
    const facing = next() * Math.PI;
    const lean = next() * Math.PI * 2;
    const reach = (0.03 + 0.1 * next()) * (0.6 + 0.4 * (1 - edge));
    const z0 = dome(x, y) - 0.012;
    const wx = (Math.cos(facing) * width) / 2;
    const wy = (Math.sin(facing) * width) / 2;
    const lx = Math.cos(lean) * reach;
    const ly = Math.sin(lean) * reach;
    const tint = next();
    const left: Vec = [x - wx, y - wy, z0];
    const right: Vec = [x + wx, y + wy, z0];
    const midLeft: Vec = [x - wx * 0.7 + lx * 0.3, y - wy * 0.7 + ly * 0.3, z0 + height * 0.5];
    const midRight: Vec = [x + wx * 0.7 + lx * 0.3, y + wy * 0.7 + ly * 0.3, z0 + height * 0.5];
    const tip: Vec = [x + lx, y + ly, z0 + height];
    m.tri(left, right, midRight, KIND.blade, [0, 0, 0.55], tint);
    m.tri(left, midRight, midLeft, KIND.blade, [0, 0.55, 0.55], tint);
    m.tri(midLeft, midRight, tip, KIND.blade, [0.55, 0.55, 1], tint);
  }
  return m.build();
}

// --- A dug-out cell: dark earth, a crumbly lip, a few pebbles ---------------------------------------

export function dugEarth(seed: number): Built {
  const next = rng(seed);
  const m = new Mesher();
  walls(m, KIND.soil, -HALF, HALF, 0.55);
  const lip = (u: number, v: number) => {
    const edge = Math.max(Math.abs(u), Math.abs(v));
    const t = Math.min(1, Math.max(0, (edge - 0.4) / 0.09));
    return smooth(t);
  };
  const crumbs = (u: number, v: number) =>
    0.5 * noise3(u * 5, v * 5, 2) +
    0.3 * noise3(u * 14, v * 14, 4) +
    0.2 * noise3(u * 33, v * 33, 6);
  heightfield(
    m,
    8,
    (u, v) =>
      HALF +
      0.004 * (noise3(u * 12, v * 12, 3) - 0.5) +
      lip(u, v) * (0.02 + 0.045 * noise3(u * 9, v * 9, 7)),
    KIND.hole,
    // Darker towards the walls of the hole (the light that never gets down there), crumbly inside.
    (u, v) => {
      const edge = Math.max(Math.abs(u), Math.abs(v)) * 2;
      return (
        (0.12 + 0.88 * crumbs(u, v)) *
        (1 - 0.7 * smooth(Math.min(1, Math.max(0, (edge - 0.45) / 0.55))))
      );
    },
    next,
  );
  return m.build();
}

// --- A rusty mine ----------------------------------------------------------------------------------

/** How far the mine is sunk into its hole: its centre is lowered by this, cells. */
export const MINE_SINK = 0.2;

export function rustyMine(): Built {
  const m = new Mesher();
  const identity = new Matrix4();
  const body = new SphereGeometry(MINE_RADIUS, 28, 18);
  const position = body.getAttribute('position');
  const normal = body.getAttribute('normal');
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const pit = noise3(x * 22, y * 22, z * 22) - 0.5;
    const k = 1 + (0.05 * pit) / MINE_RADIUS;
    position.setXYZ(i, x * k, y * k, z * k);
  }
  normal.needsUpdate = true;
  m.add(
    body,
    identity,
    KIND.rust,
    (p) => 0.1 + 0.9 * noise3(p.x * 9 + 2, p.y * 9, p.z * 9) ** 2.2,
    0,
  );
  // Belt around the equator with rivets.
  m.add(
    new TorusGeometry(MINE_RADIUS * 1.0, 0.03, 8, 40),
    identity,
    KIND.iron,
    (p) => 0.25 + 0.3 * noise3(p.x * 20, p.y * 20, 0),
    0,
  );
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    m.add(
      new SphereGeometry(0.019, 6, 4),
      new Matrix4().makeTranslation(
        Math.cos(a) * MINE_RADIUS * 1.04,
        Math.sin(a) * MINE_RADIUS * 1.04,
        0,
      ),
      KIND.rivet,
      () => 0.5,
      0,
    );
  }
  // Horns: four level, four tilted up between them, each with a round cap.
  const up = new Vector3(0, 1, 0);
  const sink = 0.04;
  for (let i = 0; i < SPIKE_COUNT; i++) {
    const angle = (i * Math.PI * 2) / SPIKE_COUNT;
    const elevation = i % 2 === 0 ? 0 : Math.PI / 4;
    const direction = new Vector3(
      Math.cos(angle) * Math.cos(elevation),
      Math.sin(angle) * Math.cos(elevation),
      Math.sin(elevation),
    );
    const turn = new Matrix4().makeRotationFromQuaternion(
      new Quaternion().setFromUnitVectors(up, direction),
    );
    const horn = new ConeGeometry(SPIKE_RADIUS, SPIKE_LENGTH + sink, 10);
    horn.translate(0, MINE_RADIUS + (SPIKE_LENGTH + sink) / 2 - sink, 0);
    m.add(horn, turn, KIND.rust, (p) => 0.1 + 0.6 * noise3(p.x * 14, p.y * 14, p.z * 14) ** 1.6, 0);
    const cap = new SphereGeometry(SPIKE_RADIUS * 0.8, 8, 6);
    cap.translate(0, MINE_RADIUS + SPIKE_LENGTH, 0);
    m.add(cap, turn, KIND.iron, () => 0.6, 0);
  }
  const built = m.build();
  built.geometry.translate(0, 0, -MINE_SINK);
  return built;
}

// --- The scorched lip of a crater -------------------------------------------------------------------

/** A ragged ring of burnt clods around the pit of the mine that went off; lies on the tile top. */
export function craterLip(): Built {
  const next = rng(91);
  const m = new Mesher();
  const steps = 22;
  const ring = (i: number, radius: number, z: number): Vec => {
    const a = (i / steps) * Math.PI * 2;
    return [Math.cos(a) * radius, Math.sin(a) * radius, z];
  };
  for (let i = 0; i < steps; i++) {
    const wobble = 0.03 * (next() - 0.5);
    const lift = 0.03 + 0.05 * next();
    const inner = 0.3 + wobble;
    const outer = 0.5 - 0.02 * next();
    const mid = 0.4 + wobble;
    const tint = next();
    m.quad(
      ring(i, inner, 0),
      ring(i, mid, lift),
      ring(i + 1, mid, lift),
      ring(i + 1, inner, 0),
      KIND.soot,
      [0.2, 1, 1, 0.2],
      tint,
    );
    m.quad(
      ring(i, mid, lift),
      ring(i, outer, 0),
      ring(i + 1, outer, 0),
      ring(i + 1, mid, lift),
      KIND.soot,
      [1, 0.3, 0.3, 1],
      tint,
    );
  }
  return m.build();
}

// --- A flag: a stick with a ball on top, and a pennant that can wave --------------------------------

export function flagStick(): Built {
  const m = new Mesher();
  const stick = new CylinderGeometry(POLE_RADIUS * 0.8, POLE_RADIUS, POLE_LENGTH + 0.12, 8)
    .rotateX(Math.PI / 2)
    .translate(0, 0, (POLE_LENGTH + 0.12) / 2 - 0.12);
  m.add(stick, new Matrix4(), KIND.wood, (p) => 0.55 + 0.35 * noise3(p.z * 30, 1, 1), 0);
  m.add(
    new SphereGeometry(POLE_RADIUS * 1.5, 10, 8),
    new Matrix4().makeTranslation(0, 0, POLE_LENGTH + 0.01),
    KIND.wood,
    () => 0.9,
    0,
  );
  return m.build();
}

const CLOTH_COLS = 10;
const CLOTH_ROWS = 4;

/** A pennant in the pole's xz plane, hung from the top of the stick, tapering to the right. */
export function pennant(): Built {
  const m = new Mesher();
  const top = POLE_LENGTH - 0.03;
  const width = CLOTH_WIDTH * 1.25;
  const height = CLOTH_HEIGHT * 1.1;
  const at = (i: number, j: number): Vec => {
    const u = i / CLOTH_COLS;
    const h = height * (1 - 0.42 * u);
    return [u * width + POLE_RADIUS, 0, top - (j / CLOTH_ROWS) * h];
  };
  const tone = (i: number, j: number) => 0.62 + 0.28 * Math.sin(i * 1.3 + j * 0.4) - 0.1 * (j / 4);
  for (let i = 0; i < CLOTH_COLS; i++) {
    for (let j = 0; j < CLOTH_ROWS; j++) {
      m.quad(
        at(i, j),
        at(i, j + 1),
        at(i + 1, j + 1),
        at(i + 1, j),
        KIND.cloth,
        [tone(i, j), tone(i, j + 1), tone(i + 1, j + 1), tone(i + 1, j)],
        0,
      );
    }
  }
  return m.build();
}

// --- Props around the field ---------------------------------------------------------------------------

/** A rock: a noisy icosphere, flattened, `size` cells wide. */
export function addRock(m: Mesher, x: number, y: number, z: number, size: number, seed: number) {
  const rock = new IcosahedronGeometry(1, 2);
  const position = rock.getAttribute('position');
  for (let i = 0; i < position.count; i++) {
    const px = position.getX(i);
    const py = position.getY(i);
    const pz = position.getZ(i);
    const k = 0.8 + 0.4 * noise3(px * 1.7 + seed, py * 1.7, pz * 1.7);
    position.setXYZ(i, px * k, py * k, pz * k * 0.7);
  }
  rock.computeVertexNormals();
  m.add(
    rock,
    new Matrix4()
      .makeTranslation(x, y, z + size * 0.15)
      .multiply(new Matrix4().makeScale(size, size, size)),
    KIND.stone,
    (p) => 0.25 + 0.7 * noise3(p.x * 6 + seed, p.y * 6, p.z * 6),
    0,
  );
}

/** A wildflower: a thin stem and a coloured head; `colour` 0..1 picks from the five. */
export function addFlower(m: Mesher, x: number, y: number, z: number, colour: number) {
  const stem = new CylinderGeometry(0.008, 0.01, 0.2, 5).rotateX(Math.PI / 2).translate(0, 0, 0.1);
  m.add(stem, new Matrix4().makeTranslation(x, y, z), KIND.stem, () => 0.5, 0);
  m.add(
    new SphereGeometry(0.042, 8, 6),
    new Matrix4().makeTranslation(x, y, z + 0.21).multiply(new Matrix4().makeScale(1, 1, 0.6)),
    KIND.flower,
    () => colour,
    0,
  );
}

/** A post with a lantern: wooden post, roof, and a cage; the glow is a separate mesh. */
export function addLanternPost(m: Mesher, x: number, y: number, z: number) {
  const post = new CylinderGeometry(0.05, 0.065, 1.4, 8).rotateX(Math.PI / 2).translate(0, 0, 0.7);
  m.add(
    post,
    new Matrix4().makeTranslation(x, y, z),
    KIND.wood,
    (p) => 0.5 + 0.3 * noise3(p.z * 20, 2, 2),
    0,
  );
  const arm = new CylinderGeometry(0.03, 0.03, 0.34, 6)
    .rotateZ(Math.PI / 2)
    .translate(0.17, 0, 1.36);
  m.add(arm, new Matrix4().makeTranslation(x, y, z), KIND.wood, () => 0.5, 0);
  // Cage and roof of the lantern, hung at the end of the arm.
  const cx = x + 0.36;
  const cz = z + 1.12;
  const roof = new ConeGeometry(0.15, 0.12, 4).rotateX(Math.PI / 2).rotateZ(Math.PI / 4);
  m.add(roof, new Matrix4().makeTranslation(cx, y, cz + 0.2), KIND.iron, () => 0.3, 0);
  const foot = new CylinderGeometry(0.1, 0.07, 0.04, 4).rotateX(Math.PI / 2).rotateZ(Math.PI / 4);
  m.add(foot, new Matrix4().makeTranslation(cx, y, cz - 0.17), KIND.iron, () => 0.3, 0);
  for (const [dx, dy] of [
    [-0.075, -0.075],
    [0.075, -0.075],
    [0.075, 0.075],
    [-0.075, 0.075],
  ] as const) {
    const bar = new CylinderGeometry(0.01, 0.01, 0.36, 4).rotateX(Math.PI / 2);
    m.add(bar, new Matrix4().makeTranslation(cx + dx, y + dy, cz + 0.02), KIND.iron, () => 0.35, 0);
  }
}
