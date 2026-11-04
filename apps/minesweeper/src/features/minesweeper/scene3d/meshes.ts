import {
  BackSide,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  RepeatWrapping,
  RingGeometry,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
  type Material,
  type Texture,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  BASE_HEIGHT,
  BASE_RADIUS,
  CLOTH_HALO,
  CLOTH_HEIGHT,
  CLOTH_WIDTH,
  DIGIT_CAP_HEIGHT,
  DIGIT_HALO,
  EXPLODED_DISC,
  EXPLODED_RING_INNER,
  EXPLODED_RING_OUTER,
  FLOOR_TOP,
  FRAME_TOP,
  KEY_DIRECTION,
  MAX_CELLS,
  MINE_HALO,
  MINE_RADIUS,
  POLE_HALO,
  POLE_LENGTH,
  POLE_RADIUS,
  SLASH_HALO_THICKNESS,
  SLASH_LENGTH,
  SLASH_THICKNESS,
  SLASH_TILT_DEG,
  SPIKE_COUNT,
  SPIKE_LENGTH,
  SPIKE_RADIUS,
  TABLE_TOP,
  TILE_RADIUS,
  TILE_SEGMENTS,
  TILE_SIZE,
  TILE_THICKNESS,
} from './sceneLayout.ts';
import type { ScenePalette } from './types.ts';

/*
 * Mesh factories of the 3D board (story 009, UX §2–§4). Every geometry is built in cell units
 * (1 = one cell); the scene scales by the cell size in CSS px. Glyphs (digits, flags, mines,
 * slash) are unlit MeshBasicMaterial in token colours with a halo in the colour of the surface
 * under them, so the 007 contrast pairs hold under any light (UX §1).
 */

/** Concatenates geometries (positions and normals) into one non-indexed geometry. */
function merge(parts: readonly BufferGeometry[]): BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  for (const part of parts) {
    const flat = part.index === null ? part : part.toNonIndexed();
    const position = flat.getAttribute('position');
    const normal = flat.getAttribute('normal');
    for (let i = 0; i < position.count; i++) {
      positions.push(position.getX(i), position.getY(i), position.getZ(i));
      normals.push(normal.getX(i), normal.getY(i), normal.getZ(i));
    }
    if (flat !== part) flat.dispose();
    part.dispose();
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  return geometry;
}

/** A cylinder standing on z = 0 along +z. */
function zCylinder(radius: number, height: number, segments: number): BufferGeometry {
  return new CylinderGeometry(radius, radius, height, segments)
    .rotateX(Math.PI / 2)
    .translate(0, 0, height / 2);
}

/** Pole and base in the flag's frame: base on z = 0, pole along +z (the lean is per instance). */
function poleGeometry(halo: number): BufferGeometry {
  return merge([
    zCylinder(POLE_RADIUS + halo, POLE_LENGTH + 2 * halo, 8).translate(0, 0, -halo),
    zCylinder(BASE_RADIUS + halo, BASE_HEIGHT + 2 * halo, 20).translate(0, 0, -halo),
  ]);
}

/** The cloth triangle in the pole's xz-plane, pointing right from the top of the pole. */
function clothGeometry(halo: number): BufferGeometry {
  const top = POLE_LENGTH;
  const xs = [0, 0, CLOTH_WIDTH];
  const zs = [top, top - CLOTH_HEIGHT, top - CLOTH_HEIGHT / 2];
  // A halo grows every edge outwards: scale about the incentre by (r + halo) / r.
  const corner = (i: number) => new Vector3(xs[i] ?? 0, 0, zs[i] ?? 0);
  const opposite = [0, 1, 2].map((i) => corner((i + 1) % 3).distanceTo(corner((i + 2) % 3)));
  const perimeter = opposite.reduce((sum, length) => sum + length, 0);
  const inradius = (CLOTH_WIDTH * CLOTH_HEIGHT) / perimeter; // 2 · area / perimeter
  const incentre = [0, 1, 2]
    .map((i) => corner(i).multiplyScalar((opposite[i] ?? 0) / perimeter))
    .reduce((sum, v) => sum.add(v), new Vector3());
  const scale = (inradius + halo) / inradius;
  // A halo sits just behind the cloth (+y is away from the viewer in the flag's frame).
  const back = halo > 0 ? 0.006 : 0;
  const positions = [0, 1, 2].flatMap((i) => {
    const p = corner(i).sub(incentre).multiplyScalar(scale).add(incentre);
    return [p.x, back, p.z];
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute([0, -1, 0, 0, -1, 0, 0, -1, 0], 3));
  return geometry;
}

/** Mine body plus 8 spikes around its centre (z = 0 is the centre): four level, four tilted up between them. */
function mineGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [new SphereGeometry(MINE_RADIUS, 20, 14)];
  const up = new Vector3(0, 1, 0);
  const sink = 0.04; // the cone base starts inside the sphere
  for (let i = 0; i < SPIKE_COUNT; i++) {
    const angle = (i * Math.PI * 2) / SPIKE_COUNT;
    const elevation = i % 2 === 0 ? 0 : Math.PI / 4;
    const direction = new Vector3(
      Math.cos(angle) * Math.cos(elevation),
      Math.sin(angle) * Math.cos(elevation),
      Math.sin(elevation),
    );
    const cone = new ConeGeometry(SPIKE_RADIUS, SPIKE_LENGTH + sink, 8);
    cone.translate(0, MINE_RADIUS + (SPIKE_LENGTH + sink) / 2 - sink, 0);
    cone.applyQuaternion(new Quaternion().setFromUnitVectors(up, direction));
    parts.push(cone);
  }
  return merge(parts);
}

/** Bakes the mine's shading into vertex colours by n · L of the fixed key direction (UX §4.3). */
function bakeMineColours(geometry: BufferGeometry, lit: string, shade: string): void {
  const normal = geometry.getAttribute('normal');
  const light = new Vector3(...KEY_DIRECTION).normalize();
  const a = new Color(shade);
  const b = new Color(lit);
  // Rewrite the existing attribute on a scheme switch, so no GPU buffer is orphaned.
  const existing = geometry.getAttribute('color');
  const colours =
    existing instanceof Float32BufferAttribute
      ? existing
      : new Float32BufferAttribute(new Float32Array(normal.count * 3), 3);
  const n = new Vector3();
  const c = new Color();
  for (let i = 0; i < normal.count; i++) {
    n.set(normal.getX(i), normal.getY(i), normal.getZ(i));
    const t = Math.min(1, Math.max(0, (n.dot(light) + 1) / 2));
    c.copy(a).lerp(b, t * t * (3 - 2 * t));
    colours.setXYZ(i, c.r, c.g, c.b);
  }
  if (colours === existing) colours.needsUpdate = true;
  else geometry.setAttribute('color', colours);
}

/**
 * A flat bar along x; the instance turns it diagonal (lower left to upper right) and parallel to
 * the screen (SLASH_ROTATION), so a scale along x draws it on (story 010).
 */
function slashGeometry(length: number, thickness: number, back: number): BufferGeometry {
  return new PlaneGeometry(length, thickness).translate(0, 0, -back);
}

/** Rotation of a slash instance: 45° in its plane, then rotated back by the tilt. */
export const SLASH_ROTATION = new Quaternion()
  .setFromAxisAngle(new Vector3(1, 0, 0), (SLASH_TILT_DEG * Math.PI) / 180)
  .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI / 4));

/** Deterministic pseudo-random numbers in [0, 1) (mulberry32), so screenshots are reproducible. */
function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 1831565813) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rgbBytes(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

const SPECKLE_SIZE = 256;
const SPECKLE_AMPLITUDE = 0.04; // ±4 % luminance, zero mean (UX §3.3)

/** Stone speckle in the table colour; its mean equals the token so the seam to the scroller stays invisible. */
function drawSpeckle(canvas: HTMLCanvasElement, hex: string): void {
  const context = canvas.getContext('2d');
  if (!context) return;
  const image = context.createImageData(SPECKLE_SIZE, SPECKLE_SIZE);
  const [r, g, b] = rgbBytes(hex);
  const next = seeded(7);
  for (let i = 0; i < SPECKLE_SIZE * SPECKLE_SIZE; i++) {
    // Sum of two uniforms: zero mean, softer than plain noise.
    const k = 1 + SPECKLE_AMPLITUDE * (next() + next() - 1);
    image.data[i * 4] = r * k;
    image.data[i * 4 + 1] = g * k;
    image.data[i * 4 + 2] = b * k;
    image.data[i * 4 + 3] = 255;
  }
  context.putImageData(image, 0, 0);
}

const GLYPH_PX = 128;

/** Digits 1–8 in their token colours, each over a halo in the revealed-top colour (UX §4.1). */
function drawDigits(canvas: HTMLCanvasElement, palette: ScenePalette, fontFamily: string): void {
  const context = canvas.getContext('2d');
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = `700 100px ${fontFamily}`;
  const capAt100 = context.measureText('8').actualBoundingBoxAscent || 72;
  const cap = DIGIT_CAP_HEIGHT * GLYPH_PX;
  context.font = `700 ${(100 * cap) / capAt100}px ${fontFamily}`;
  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';
  context.lineJoin = 'round';
  context.lineWidth = 2 * DIGIT_HALO * cap;
  const keys = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8'] as const;
  keys.forEach((key, i) => {
    const x = GLYPH_PX * i + GLYPH_PX / 2;
    const y = GLYPH_PX / 2 + cap / 2;
    context.strokeStyle = palette.colours.revealedTop;
    context.strokeText(String(i + 1), x, y);
    context.fillStyle = palette.colours[key];
    context.fillText(String(i + 1), x, y);
  });
}

function instanced(geometry: BufferGeometry, material: Material, colours: boolean): InstancedMesh {
  const mesh = new InstancedMesh(geometry, material, MAX_CELLS);
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  if (colours) {
    // Creates the instance colour buffer now, so the compiled program already has it.
    mesh.setColorAt(0, new Color(1, 1, 1));
    mesh.instanceColor?.setUsage(DynamicDrawUsage);
  }
  mesh.count = 0;
  mesh.frustumCulled = false; // instances move; the bounding sphere would go stale
  return mesh;
}

/** Everything drawn on the table; the scene positions instances per frame. */
export interface SceneMeshes {
  readonly root: Group;
  readonly table: Mesh;
  readonly tray: Mesh;
  readonly hiddenTiles: InstancedMesh;
  readonly revealedTiles: InstancedMesh;
  readonly digits: readonly InstancedMesh[];
  readonly poles: InstancedMesh;
  readonly poleHalos: InstancedMesh;
  readonly cloths: InstancedMesh;
  readonly clothHalos: InstancedMesh;
  readonly mines: InstancedMesh;
  readonly mineHalos: InstancedMesh;
  readonly explodedMarks: InstancedMesh;
  readonly explodedMines: InstancedMesh;
  readonly slashes: InstancedMesh;
  readonly slashHalos: InstancedMesh;
  /** Hidden tiles: glossy (UX §3.3). */
  readonly hiddenMaterial: MeshPhysicalMaterial;
  /** Rebuilds the table and tray for a board of cols × rows cells (incl. gaps), frame width in cells. */
  setBoardSize(width: number, height: number, frame: number): void;
  applyPalette(palette: ScenePalette, fontFamily: string): void;
  setEnvironment(texture: Texture | null, intensity: number): void;
  dispose(): void;
}

export function createSceneMeshes(maxAnisotropy: number): SceneMeshes {
  const root = new Group();

  const tableCanvas = document.createElement('canvas');
  tableCanvas.width = SPECKLE_SIZE;
  tableCanvas.height = SPECKLE_SIZE;
  const tableTexture = new CanvasTexture(tableCanvas);
  tableTexture.colorSpace = SRGBColorSpace;
  tableTexture.wrapS = RepeatWrapping;
  tableTexture.wrapT = RepeatWrapping;
  tableTexture.anisotropy = maxAnisotropy;
  const tableMaterial = new MeshStandardMaterial({ map: tableTexture, roughness: 1, metalness: 0 });
  const table = new Mesh(new PlaneGeometry(1, 1), tableMaterial);
  table.receiveShadow = true;

  const slabMaterial = new MeshStandardMaterial({ roughness: 0.85, metalness: 0 });
  const tray = new Mesh(new BufferGeometry(), slabMaterial);
  tray.castShadow = true;
  tray.receiveShadow = true;

  const tile = new RoundedBoxGeometry(
    TILE_SIZE,
    TILE_SIZE,
    TILE_THICKNESS,
    TILE_SEGMENTS,
    TILE_RADIUS,
  );
  const hiddenMaterial = new MeshPhysicalMaterial({
    roughness: 0.42,
    metalness: 0,
    clearcoatRoughness: 0.18,
  });
  const revealedMaterial = new MeshStandardMaterial({ roughness: 0.85, metalness: 0 });
  const hiddenTiles = instanced(tile, hiddenMaterial, false);
  const revealedTiles = instanced(tile, revealedMaterial, true);
  for (const mesh of [hiddenTiles, revealedTiles]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }

  const unlit = (options: ConstructorParameters<typeof MeshBasicMaterial>[0] = {}) =>
    new MeshBasicMaterial({ toneMapped: false, ...options });

  const digitCanvas = document.createElement('canvas');
  digitCanvas.width = GLYPH_PX * 8;
  digitCanvas.height = GLYPH_PX;
  const digitTexture = new CanvasTexture(digitCanvas);
  digitTexture.colorSpace = SRGBColorSpace;
  digitTexture.premultiplyAlpha = true;
  digitTexture.anisotropy = maxAnisotropy;
  const digitMaterial = unlit({
    map: digitTexture,
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: false,
  });
  const digits = Array.from({ length: 8 }, (_, i) => {
    const geometry = new PlaneGeometry(1, 1);
    const uv = geometry.getAttribute('uv');
    for (let v = 0; v < uv.count; v++) uv.setX(v, (i + uv.getX(v)) / 8);
    return instanced(geometry, digitMaterial, false);
  });

  const poleMaterial = unlit();
  const clothMaterial = unlit({ side: DoubleSide });
  const poleHaloMaterial = unlit({ side: BackSide });
  const clothHaloMaterial = unlit({ side: DoubleSide });
  const poles = instanced(poleGeometry(0), poleMaterial, false);
  const cloths = instanced(clothGeometry(0), clothMaterial, false);
  const poleHalos = instanced(poleGeometry(POLE_HALO), poleHaloMaterial, true);
  const clothHalos = instanced(clothGeometry(CLOTH_HALO), clothHaloMaterial, true);
  poles.castShadow = true;
  cloths.castShadow = true;

  const mine = mineGeometry();
  const mineMaterial = unlit({ vertexColors: true });
  const mines = instanced(mine, mineMaterial, false);
  mines.castShadow = true;
  // Halo: the mine grown by MINE_HALO at its tips, drawn from the inside (an outline behind it).
  const grow = (MINE_RADIUS + SPIKE_LENGTH + MINE_HALO) / (MINE_RADIUS + SPIKE_LENGTH);
  const mineHaloMaterial = unlit({ side: BackSide });
  const mineHalos = instanced(mine.clone().scale(grow, grow, grow), mineHaloMaterial, false);
  const explodedMarkMaterial = unlit();
  const explodedMarks = instanced(
    merge([
      new CircleGeometry(EXPLODED_DISC, 40),
      new RingGeometry(EXPLODED_RING_INNER, EXPLODED_RING_OUTER, 48),
    ]),
    explodedMarkMaterial,
    false,
  );
  const explodedMineMaterial = unlit();
  const explodedMines = instanced(mine.clone(), explodedMineMaterial, false);
  explodedMines.castShadow = true;

  // The slash is drawn on top: nothing in front of it can hide it (it floats above the tiles).
  const slashMaterial = unlit({ depthTest: false });
  const slashHaloMaterial = unlit({ depthTest: false });
  const slashes = instanced(slashGeometry(SLASH_LENGTH, SLASH_THICKNESS, 0), slashMaterial, false);
  const slashHalos = instanced(
    slashGeometry(
      SLASH_LENGTH + SLASH_HALO_THICKNESS - SLASH_THICKNESS,
      SLASH_HALO_THICKNESS,
      0.01,
    ),
    slashHaloMaterial,
    false,
  );
  slashHalos.renderOrder = 10;
  slashes.renderOrder = 11;

  root.add(
    table,
    tray,
    hiddenTiles,
    revealedTiles,
    ...digits,
    poleHalos,
    poles,
    clothHalos,
    cloths,
    mineHalos,
    mines,
    explodedMarks,
    explodedMines,
    slashHalos,
    slashes,
  );

  return {
    root,
    table,
    tray,
    hiddenTiles,
    revealedTiles,
    digits,
    poles,
    poleHalos,
    cloths,
    clothHalos,
    mines,
    mineHalos,
    explodedMarks,
    explodedMines,
    slashes,
    slashHalos,
    hiddenMaterial,

    setBoardSize(width, height, frame) {
      // Tray: a slab on the table (floor of the gaps) and a frame around the field (UX §2).
      const floorHeight = FLOOR_TOP - TABLE_TOP;
      const frameHeight = FRAME_TOP - TABLE_TOP;
      const outerW = width + 2 * frame;
      const outerH = height + 2 * frame;
      const radius = Math.min(TILE_RADIUS, frame / 2);
      const bar = (w: number, h: number, x: number, y: number) =>
        new RoundedBoxGeometry(w, h, frameHeight, 4, radius).translate(
          x,
          y,
          TABLE_TOP + frameHeight / 2,
        );
      const parts = [
        new RoundedBoxGeometry(outerW, outerH, floorHeight, 4, TILE_RADIUS).translate(
          0,
          0,
          TABLE_TOP + floorHeight / 2,
        ),
      ];
      if (frame > 0) {
        parts.push(
          bar(frame, outerH, -(width + frame) / 2, 0),
          bar(frame, outerH, (width + frame) / 2, 0),
          bar(width, frame, 0, -(height + frame) / 2),
          bar(width, frame, 0, (height + frame) / 2),
        );
      }
      tray.geometry.dispose();
      tray.geometry = merge(parts);

      // Table: far larger than any canvas; the viewport clips it.
      const size = 4 * Math.max(width, height) + 40;
      table.geometry.dispose();
      table.geometry = new PlaneGeometry(size, size).translate(0, 0, TABLE_TOP);
      tableTexture.repeat.set(size / 12, size / 12);
    },

    applyPalette(palette, fontFamily) {
      const { colours, look } = palette;
      drawSpeckle(tableCanvas, colours.table);
      tableTexture.needsUpdate = true;
      slabMaterial.color.set(colours.slab);
      hiddenMaterial.color.set(colours.tileTop);
      hiddenMaterial.clearcoat = look.gloss;
      drawDigits(digitCanvas, palette, fontFamily);
      digitTexture.needsUpdate = true;
      poleMaterial.color.set(colours.pole);
      clothMaterial.color.set(colours.flag);
      bakeMineColours(mine, colours.mineLit, colours.mineShade);
      mineHaloMaterial.color.set(colours.revealedTop);
      explodedMarkMaterial.color.set(colours.exploded);
      explodedMineMaterial.color.set(colours.explodedGlyph);
      slashMaterial.color.set(colours.slash);
      slashHaloMaterial.color.set(colours.revealedTop);
    },

    setEnvironment(texture, intensity) {
      hiddenMaterial.envMap = texture;
      hiddenMaterial.envMapIntensity = intensity;
      hiddenMaterial.needsUpdate = true;
    },

    dispose() {
      const materials = new Set<Material>();
      root.traverse((object) => {
        if (object instanceof Mesh) {
          object.geometry.dispose();
          const material: Material | Material[] = object.material;
          (Array.isArray(material) ? material : [material]).forEach((m) => materials.add(m));
        }
        if (object instanceof InstancedMesh) object.dispose();
      });
      materials.forEach((material) => material.dispose());
      tableTexture.dispose();
      digitTexture.dispose();
      mine.dispose();
    },
  };
}
