import {
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  SphereGeometry,
  SRGBColorSpace,
  type IUniform,
  type Material,
  type Texture,
  type WebGLRenderer,
} from 'three';
import type { EffectRunner } from '../effects.ts';
import type { SceneMeshes } from '../meshes.ts';
import { HIDDEN_CENTRE, HIDDEN_TOP } from '../sceneLayout.ts';
import { rng } from '../endPlan.ts';
import type { ScenePalette } from '../types.ts';
import {
  addFlower,
  addLanternPost,
  addRock,
  craterLip,
  createTones,
  dugEarth,
  flagStick,
  Mesher,
  paint,
  pennant,
  rustyMine,
  turfBlock,
  type Built,
} from './art.ts';
import { createBackdrop, WALL_GAP } from './set.ts';
import { createCellTextures } from './textures.ts';

/**
 * The diorama of the cinematic view (story 050, round 3): it swaps the meshes of the board scene for
 * a minefield. Covered cells are turf blocks with grass, opened cells are dug-out earth, mines are
 * rusty iron, flags are cloth on a stick, and around the field lie a lawn ring, the cross-section of
 * the earth, rocks, wildflowers and a lantern. Everything stays inside the existing seams: the
 * instanced meshes keep their instance matrices, only geometry and material change.
 */

/** Spacing of the lawn ring's turf blocks and how many rings there are, in cells. */
const RING = { step: 1.05, count: 2 } as const;
const RING_CAPACITY = 420;
/** Top of the earth block (the turf blocks' bottoms) and its bottom, in cells. */
const BLOCK_TOP = HIDDEN_CENTRE - 0.225;
const BLOCK_BOTTOM = -3.4;
const STRATA_REPEAT_CELLS = 8;
const LANTERN_K = 3;

type ShaderParts = {
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, IUniform>;
};

const VARY = /* glsl */ `
varying float vHash;
float tileHash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
vec2 quarter(vec2 v, float k) {
  return k < 0.5 ? v : k < 1.5 ? vec2(-v.y, v.x) : k < 2.5 ? -v : vec2(v.y, -v.x);
}
float tileTurn() { return floor(tileHash(instanceMatrix[3].yx + 3.7) * 4.0); }
`;
/** The cell texture turns with the cell (the white corner texel the other parts point at stays). */
const TURN_UV = `#include <uv_vertex>
#ifdef USE_MAP
vMapUv = uv.x > 0.95 ? uv : quarter(uv - 0.5, tileTurn()) + 0.5;
#endif`;

/** Turf: every cell turns by a quarter turn, differs in brightness and in the height of its grass. */
function patchTurf(shader: ShaderParts): void {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>\n${VARY}`)
    .replace('#include <uv_vertex>', TURN_UV)
    .replace(
      '#include <beginnormal_vertex>',
      '#include <beginnormal_vertex>\nobjectNormal.xy = quarter(objectNormal.xy, tileTurn());',
    )
    .replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      float h = tileHash(instanceMatrix[3].xy);
      transformed.xy = quarter(transformed.xy, tileTurn());
      transformed.z += max(0.0, position.z - 0.23) * (h - 0.5) * 0.7;
      vHash = h;`,
    );
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying float vHash;')
    .replace(
      '#include <color_fragment>',
      '#include <color_fragment>\ndiffuseColor.rgb *= 0.86 + 0.28 * vHash;',
    )
    .replace(
      '#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * 0.05;',
    );
}

/** Dug earth: ignores the tint of the 3D scene's tiles, shows a crater where that tint says "exploded". */
function patchHole(crater: IUniform<Color>) {
  return (shader: ShaderParts): void => {
    shader.uniforms.uCrater = crater;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>\n${VARY}\nvarying float vCrater;\nuniform vec3 uCrater;`,
      )
      .replace('#include <uv_vertex>', TURN_UV)
      .replace(
        '#include <color_vertex>',
        `#include <color_vertex>
        vCrater = 1.0 - step(0.03, distance(instanceColor, uCrater));
        vColor.rgb = color.rgb;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        transformed.xy = quarter(transformed.xy, tileTurn());
        transformed.z -= vCrater * 0.12 * (1.0 - smoothstep(0.0, 0.46, length(transformed.xy))) * step(0.0, position.z);
        vHash = tileHash(instanceMatrix[3].xy);`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying float vHash;\nvarying float vCrater;',
      )
      .replace(
        '#include <color_fragment>',
        '#include <color_fragment>\ndiffuseColor.rgb *= (0.88 + 0.24 * vHash) * mix(1.0, 0.28, vCrater);',
      );
  };
}

/** Cloth: a travelling wave from the pole to the free end, scaled by `uAmp` (0 = still). */
function patchCloth(time: IUniform<number>, amp: IUniform<number>) {
  return (shader: ShaderParts): void => {
    shader.uniforms.uTime = time;
    shader.uniforms.uAmp = amp;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uAmp;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float seed = instanceMatrix[3].x * 0.9 + instanceMatrix[3].y * 0.6;
        float w = position.x / 0.7;
        transformed.y += uAmp * w * (0.06 * sin(position.x * 11.0 - uTime * 5.2 + seed) + 0.025 * sin(position.x * 23.0 - uTime * 9.0 + seed * 1.7));
        transformed.z -= uAmp * w * 0.018 * (1.0 + sin(position.x * 8.0 - uTime * 4.0 + seed));`,
      );
  };
}

export interface Diorama {
  /** Block, props and backdrop; goes under the scene's root. */
  readonly group: Group;
  /** The plinth's z in cells (the table mesh is moved there). */
  readonly floorZ: number;
  readonly horizon: Color;
  /** Sky tones for the clear colour (zenith). */
  readonly zenith: Color;
  /** Places the ring, the block and the props around a tray of this size (cells). */
  fit(trayWidth: number, trayHeight: number): void;
  /** Fewer blades on big boards and slow frames. */
  setQuality(level: 0 | 1 | 2, cells: number): void;
  applyPalette(palette: ScenePalette, dark: boolean): void;
  /** The reflections of the rusty metal. */
  setEnvironment(texture: Texture, intensity: number): void;
  /** The cell width in CSS px: the lantern's light scales with it. */
  setCell(cell: number): void;
  /** Cloth wave at scene time `nowMs`; `on` false = still cloth. */
  setWind(nowMs: number, on: boolean): void;
  dispose(): void;
}

export function createDiorama(
  meshes: SceneMeshes,
  effects: EffectRunner,
  renderer: WebGLRenderer,
): Diorama {
  const tones = createTones();
  const turfs = [turfBlock(36, 1), turfBlock(18, 2), turfBlock(8, 3)] as const;
  const earth = dugEarth(5);
  const mine = rustyMine();
  const burnt = rustyMine();
  const lip = craterLip();
  const stick = flagStick();
  const cloth = pennant();
  let props: Built | null = null;
  const everything = (): Built[] => [
    ...turfs,
    earth,
    mine,
    burnt,
    lip,
    stick,
    cloth,
    ...(props ? [props] : []),
  ];

  const crater: IUniform<Color> = { value: new Color() };
  const time: IUniform<number> = { value: 0 };
  const amp: IUniform<number> = { value: 0 };

  const textures = createCellTextures(renderer.capabilities.getMaxAnisotropy());
  const turfMaterial = new MeshStandardMaterial({
    vertexColors: true,
    map: textures.turf,
    roughness: 0.8,
    side: DoubleSide,
  });
  turfMaterial.onBeforeCompile = patchTurf;
  turfMaterial.customProgramCacheKey = () => 'dio-turf';
  const holeMaterial = new MeshStandardMaterial({
    vertexColors: true,
    map: textures.earth,
    roughness: 0.95,
  });
  holeMaterial.onBeforeCompile = patchHole(crater);
  holeMaterial.customProgramCacheKey = () => 'dio-hole';
  const mineMaterial = new MeshStandardMaterial({
    vertexColors: true,
    metalness: 0.3,
    roughness: 0.5,
  });
  const burntMaterial = new MeshStandardMaterial({
    vertexColors: true,
    color: new Color(0.5, 0.45, 0.42),
    emissive: new Color(0.7, 0.14, 0),
    metalness: 0.3,
    roughness: 0.75,
  });
  const stickMaterial = new MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
  const clothMaterial = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.72,
    side: DoubleSide,
  });
  clothMaterial.onBeforeCompile = patchCloth(time, amp);
  clothMaterial.customProgramCacheKey = () => 'dio-cloth';
  const lipMaterial = new MeshStandardMaterial({ vertexColors: true, roughness: 1 });
  const propsMaterial = new MeshStandardMaterial({ vertexColors: true, roughness: 0.88 });
  const blockMaterial = new MeshStandardMaterial({ roughness: 1 });
  const lawnMaterial = new MeshStandardMaterial({ roughness: 1 });

  // The board scene's own meshes get the diorama's shapes (and their old ones are freed).
  const swap = (mesh: Mesh, geometry: BufferGeometry, material: Material) => {
    const old = { geometry: mesh.geometry, material: mesh.material };
    mesh.geometry = geometry;
    mesh.material = material;
    old.geometry.dispose();
    (Array.isArray(old.material) ? old.material : [old.material]).forEach((m) => m.dispose());
  };
  swap(meshes.hiddenTiles, turfs[0].geometry, turfMaterial);
  swap(meshes.revealedTiles, earth.geometry, holeMaterial);
  swap(meshes.mines, mine.geometry, mineMaterial);
  swap(meshes.explodedMines, burnt.geometry, burntMaterial);
  swap(meshes.explodedMarks, lip.geometry, lipMaterial);
  swap(meshes.poles, stick.geometry, stickMaterial);
  swap(meshes.cloths, cloth.geometry, clothMaterial);
  for (const halo of [meshes.mineHalos, meshes.poleHalos, meshes.clothHalos]) halo.visible = false;
  meshes.hiddenMaterial.dispose();

  const group = new Group();
  const blockSides = new Mesh(new BufferGeometry(), blockMaterial);
  const blockTop = new Mesh(new BufferGeometry(), lawnMaterial);
  blockTop.receiveShadow = true;
  blockSides.receiveShadow = true;
  blockSides.frustumCulled = false;
  blockTop.frustumCulled = false;
  // The plinth: a dark floor with a pool of light around the block (a radial gradient), unlit.
  const poolCanvas = document.createElement('canvas');
  poolCanvas.width = 256;
  poolCanvas.height = 256;
  const poolTexture = new CanvasTexture(poolCanvas);
  poolTexture.colorSpace = SRGBColorSpace;
  const plinthMaterial = new MeshBasicMaterial({ map: poolTexture });
  const plinth = new Mesh(new PlaneGeometry(1, 1), plinthMaterial);
  plinth.position.z = BLOCK_BOTTOM;
  plinth.frustumCulled = false;
  group.add(plinth);

  function paintPool(palette: ScenePalette, dark: boolean) {
    const context = poolCanvas.getContext('2d');
    if (!context) return;
    const edge = new Color(palette.colours.slab).multiplyScalar(dark ? 0.55 : 0.8);
    const pool = new Color(dark ? palette.colours.dioAmbient : palette.colours.dioSkyLow)
      .multiplyScalar(dark ? 0.55 : 0.62)
      .lerp(edge, 0.25);
    const gradient = context.createRadialGradient(128, 128, 4, 128, 128, 128);
    gradient.addColorStop(0, pool.getStyle());
    gradient.addColorStop(0.5, pool.clone().lerp(edge, 0.55).getStyle());
    gradient.addColorStop(1, edge.getStyle());
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    poolTexture.needsUpdate = true;
  }

  const propsMesh = new Mesh(new BufferGeometry(), propsMaterial);
  propsMesh.castShadow = true;
  propsMesh.receiveShadow = true;
  propsMesh.frustumCulled = false;
  group.add(blockSides, blockTop, propsMesh);

  // The lawn ring: more turf blocks around the field, static, under the effect root (the board
  // scene rewrites the count of every other instanced mesh under the root).
  const ring = new InstancedMesh(turfs[0].geometry, turfMaterial, RING_CAPACITY);
  ring.instanceMatrix.setUsage(DynamicDrawUsage);
  ring.castShadow = true;
  ring.receiveShadow = true;
  ring.frustumCulled = false;
  ring.count = 0;
  effects.root.add(ring);

  // The lantern: a warm light and a glowing cage; bright at night, a lit candle by day.
  const lantern = new PointLight();
  lantern.decay = 1;
  lantern.intensity = 0;
  const glowMaterial = new MeshBasicMaterial({ toneMapped: false });
  const glow = new Mesh(new SphereGeometry(0.075, 10, 8), glowMaterial);
  glow.frustumCulled = false;
  group.add(glow);
  effects.root.add(lantern);
  let lanternOn = false;
  let cell = 30;
  let tray = { width: 0, height: 0 };
  let variant = 0;

  const backdrop = createBackdrop(renderer.capabilities.getMaxAnisotropy());
  group.add(backdrop.group);
  const lanternColour = new Color();
  const glowColour = new Color();
  const zenith = new Color();

  function strip(
    position: number[],
    normal: number[],
    uv: number[],
    a: readonly [number, number, number],
    b: readonly [number, number, number],
    length: number,
    out: readonly [number, number, number],
  ) {
    const corners = [
      [a, 0, 0],
      [b, length, 0],
      [b, length, 1],
      [a, 0, 1],
    ] as const;
    for (const index of [0, 1, 2, 0, 2, 3]) {
      const [p, u, v] = corners[index] ?? corners[0];
      position.push(p[0], p[1], BLOCK_BOTTOM + v * (BLOCK_TOP - BLOCK_BOTTOM));
      normal.push(...out);
      uv.push(u / STRATA_REPEAT_CELLS, v);
    }
  }

  function buildBlock(hx: number, hy: number, ex: number, ey: number) {
    const position: number[] = [];
    const normal: number[] = [];
    const uv: number[] = [];
    strip(position, normal, uv, [-ex, -ey, 0], [ex, -ey, 0], 2 * ex, [0, -1, 0]);
    strip(position, normal, uv, [ex, ey, 0], [-ex, ey, 0], 2 * ex, [0, 1, 0]);
    strip(position, normal, uv, [-ex, ey, 0], [-ex, -ey, 0], 2 * ey, [-1, 0, 0]);
    strip(position, normal, uv, [ex, -ey, 0], [ex, ey, 0], 2 * ey, [1, 0, 0]);
    const sides = new BufferGeometry();
    sides.setAttribute('position', new Float32BufferAttribute(position, 3));
    sides.setAttribute('normal', new Float32BufferAttribute(normal, 3));
    sides.setAttribute('uv', new Float32BufferAttribute(uv, 2));
    blockSides.geometry.dispose();
    blockSides.geometry = sides;

    // The top of the block between the tray and the outer edge (the field's gaps are the tray's).
    const top: number[] = [];
    const rect = (x0: number, y0: number, x1: number, y1: number) => {
      for (const [x, y] of [
        [x0, y0],
        [x1, y0],
        [x1, y1],
        [x0, y0],
        [x1, y1],
        [x0, y1],
      ] as const)
        top.push(x, y, BLOCK_TOP + 0.01);
    };
    rect(-ex, hy, ex, ey);
    rect(-ex, -ey, ex, -hy);
    rect(-ex, -hy, -hx, hy);
    rect(hx, -hy, ex, hy);
    const lid = new BufferGeometry();
    lid.setAttribute('position', new Float32BufferAttribute(top, 3));
    lid.setAttribute(
      'normal',
      new Float32BufferAttribute(
        top.map((_, i) => (i % 3 === 2 ? 1 : 0)),
        3,
      ),
    );
    blockTop.geometry.dispose();
    blockTop.geometry = lid;
  }

  function placeRing(hx: number, hy: number) {
    const matrix = new Matrix4();
    let count = 0;
    const put = (x: number, y: number) => {
      if (count >= RING_CAPACITY) return;
      ring.setMatrixAt(count++, matrix.makeTranslation(x, y, HIDDEN_CENTRE));
    };
    for (let k = 0; k < RING.count; k++) {
      const rx = hx + (k + 0.5) * RING.step;
      const ry = hy + (k + 0.5) * RING.step;
      const nx = Math.max(1, Math.round((2 * rx) / RING.step));
      const ny = Math.max(1, Math.round((2 * ry) / RING.step));
      for (let i = 0; i < nx; i++) {
        const x = -rx + ((i + 0.5) * 2 * rx) / nx;
        put(x, ry);
        put(x, -ry);
      }
      for (let j = 1; j < ny - 1; j++) {
        const y = -ry + ((j + 0.5) * 2 * ry) / ny;
        put(rx, y);
        put(-rx, y);
      }
    }
    ring.count = count;
    ring.instanceMatrix.needsUpdate = true;
  }

  function placeProps(hx: number, hy: number, ex: number, ey: number) {
    const next = rng(63);
    const m = new Mesher();
    const onRing = (): readonly [number, number] => {
      // A point on the lawn ring, away from the outer edge and from the tray.
      const side = next();
      const band = hx + 0.4 + next() * (ex - hx - 0.8);
      const bandY = hy + 0.4 + next() * (ey - hy - 0.8);
      if (side < 0.5) return [(next() - 0.5) * 2 * (ex - 0.5), (next() < 0.5 ? 1 : -1) * bandY];
      return [(next() < 0.5 ? 1 : -1) * band, (next() - 0.5) * 2 * (ey - 0.5)];
    };
    const top = HIDDEN_TOP + 0.05;
    for (let i = 0; i < 6; i++) {
      const [x, y] = onRing();
      addRock(m, x, y, top - 0.02, 0.16 + 0.2 * next(), i * 3.1);
    }
    for (let i = 0; i < 34; i++) {
      const [x, y] = onRing();
      addFlower(m, x, y, top - 0.02, next());
    }
    const lx = -(hx + 1.15);
    const ly = -(hy + 1.1);
    addLanternPost(m, lx, ly, top - 0.02);
    glow.position.set(lx + 0.36, ly, top - 0.02 + 1.12);
    lantern.position.copy(glow.position);
    const built = m.build();
    props?.geometry.dispose();
    props = built;
    propsMesh.geometry = built.geometry;
  }

  function lanternLight() {
    lantern.intensity = lanternOn ? LANTERN_K * cell * Math.PI : 0.18 * cell * Math.PI;
    lantern.color.copy(lanternColour);
  }

  return {
    group,
    floorZ: BLOCK_BOTTOM,
    horizon: backdrop.horizon,
    zenith,

    fit(trayWidth, trayHeight) {
      if (trayWidth === tray.width && trayHeight === tray.height) return;
      tray = { width: trayWidth, height: trayHeight };
      const hx = trayWidth / 2;
      const hy = trayHeight / 2;
      const reach = RING.count * RING.step + 0.02;
      const ex = hx + reach;
      const ey = hy + reach;
      buildBlock(hx, hy, ex, ey);
      placeRing(hx, hy);
      placeProps(hx, hy, ex, ey);
      paint(props ?? turfs[0], tones);
      backdrop.fit(ex, ey, BLOCK_BOTTOM);
      // The plinth ends at the backdrop, so the sky shows above it, never the floor behind the wall.
      const front = ey * 2.3;
      const back = ey + WALL_GAP + 0.1;
      plinth.scale.set(ex * 2 * 2.3, front + back, 1);
      plinth.position.y = (back - front) / 2;
    },

    setQuality(level, cells) {
      const wanted = level === 2 ? 2 : cells > 600 ? 2 : cells > 400 || level === 1 ? 1 : 0;
      if (wanted === variant) return;
      variant = wanted;
      const next = turfs[wanted].geometry;
      meshes.hiddenTiles.geometry = next;
      ring.geometry = next;
    },

    applyPalette(palette, dark) {
      const c = palette.colours;
      tones.grass.set(c.dioGrass);
      tones.grassDark.copy(tones.grass).multiplyScalar(0.42);
      tones.tip.set(c.dioGrassTip);
      tones.soilDeep.set(c.dioSoilDeep);
      tones.soil.set(c.dioSoil);
      tones.clay.set(c.dioClay);
      tones.rust.set(c.dioRust);
      tones.iron.setRGB(0.1, 0.085, 0.075).lerp(tones.rust, 0.12);
      tones.cloth.set(c.flag);
      ['confetti3', 'confetti5', 'confetti6', 'confetti4'].forEach((key, i) => {
        const colour = c[key as 'confetti3'];
        tones.flowers[i]?.set(colour);
      });
      tones.flowers[4]?.setRGB(1, 0.93, 0.8);
      for (const built of everything()) paint(built, tones);
      textures.paint(palette);
      crater.value.set(c.explodedTop);
      lawnMaterial.color.set(c.dioSoilDeep);
      blockMaterial.map = backdrop.strata;
      blockMaterial.needsUpdate = true;
      backdrop.applyPalette(palette, dark);
      paintPool(palette, dark);
      zenith.set(c.dioSkyHigh);
      // Flags and mines must read on both lawns: a little glow of their own, more at night.
      clothMaterial.emissive.copy(tones.cloth).multiplyScalar(dark ? 0.7 : 0.12);
      mineMaterial.emissive.copy(tones.rust).multiplyScalar(dark ? 0.35 : 0.12);
      lanternOn = dark;
      lanternColour.set(c.dioLantern);
      glowColour.copy(lanternColour).multiplyScalar(dark ? 5 : 0.9);
      glowMaterial.color.copy(glowColour);
      lanternLight();
    },

    setEnvironment(texture, intensity) {
      mineMaterial.envMap = texture;
      mineMaterial.envMapIntensity = intensity;
      mineMaterial.needsUpdate = true;
    },

    setCell(next) {
      if (next === cell) return;
      cell = next;
      lanternLight();
    },

    setWind(nowMs, on) {
      time.value = nowMs / 1000;
      amp.value = on ? 1 : 0;
    },

    dispose() {
      for (const built of everything()) built.geometry.dispose();
      [
        turfMaterial,
        holeMaterial,
        mineMaterial,
        burntMaterial,
        stickMaterial,
        clothMaterial,
        lipMaterial,
        propsMaterial,
        blockMaterial,
        lawnMaterial,
        glowMaterial,
        plinthMaterial,
      ].forEach((material) => material.dispose());
      blockSides.geometry.dispose();
      blockTop.geometry.dispose();
      glow.geometry.dispose();
      ring.dispose();
      lantern.dispose();
      backdrop.dispose();
      textures.dispose();
      poolTexture.dispose();
      plinth.geometry.dispose();
      effects.root.remove(ring, lantern);
    },
  };
}
