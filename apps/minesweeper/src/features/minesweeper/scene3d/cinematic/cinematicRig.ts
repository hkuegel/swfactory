import {
  Color,
  DirectionalLight,
  Fog,
  HalfFloatType,
  MeshStandardMaterial,
  NeutralToneMapping,
  PMREMGenerator,
  PointLight,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderTarget,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { perspectiveOf } from '../geometry.ts';
import type { RigContext, SceneRig } from '../rig.ts';
import type { QualityLevel } from '../timeline.ts';
import type { GameState } from '../../logic/types.ts';
import type { RigState, TransitionHook } from '../types.ts';
import { createCameraDirector, type MoveAim } from './cameraDirector.ts';
import { poseStageLayout, poseTransform, poseWorldMatrix, type CameraPose } from './cameraPose.ts';
import { createCinematicShow } from './cinematicShow.ts';
import { createDiorama } from './diorama.ts';

/**
 * The cinematic view's rig (story 050): a camera that moves only on Start and at the end of a game
 * (the overlay follows it), a post-processing pipeline (multisampled HDR target, bloom, neutral tone
 * mapping, vignette), a low sun (or moon and lantern at night), haze, the diorama minefield of
 * diorama.ts and the end shows. Lazy chunk (three, three/addons).
 */

/** The reveal wave of this view ends within this time (AC4: each animation at most 600 ms). */
const WAVE_TOTAL_MS = 600;

/** Low evening sun from the far left: azimuth of the "3D" key light, elevation of its own. */
const SUN_ELEVATION_DEG = 24;
const SUN_AZIMUTH = Math.atan2(0.38, -0.3);
const SUN_DIRECTION = [
  Math.cos((SUN_ELEVATION_DEG * Math.PI) / 180) * Math.cos(SUN_AZIMUTH),
  Math.cos((SUN_ELEVATION_DEG * Math.PI) / 180) * Math.sin(SUN_AZIMUTH),
  Math.sin((SUN_ELEVATION_DEG * Math.PI) / 180),
] as const;

/** Light of the two moods (physical units are x pi): sun/moon, sky fill, shadow-side bounce. */
const MOOD = {
  day: { sun: 3.4, sky: 0.32, bounce: 0.7, exposure: 1 },
  night: { sun: 2.6, sky: 1.2, bounce: 0.8, exposure: 1.25 },
} as const;
const ENV_METAL = 0.35;
/** Flag cloth waves only on boards up to this many cells and above quality level 2 (AC8). */
const WIND_MAX_CELLS = 600;
const BLOOM = { strength: 0.5, radius: 0.55, threshold: 1.4 } as const;
const VIGNETTE = 0.35;
const MSAA_SAMPLES = 4;
/** Relative luminance of the revealed top below which the scene is the night scene. */
const DARK_SURFACE = 0.2;

const VIGNETTE_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    edge: { value: new Vector3() },
    strength: { value: VIGNETTE },
    glow: { value: new Vector3() },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  // After OutputPass: sRGB values. The edge colour is the well's, so the canvas melts into it.
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec3 edge;
    uniform float strength;
    uniform vec3 glow;
    varying vec2 vUv;
    void main() {
      vec4 colour = texture2D(tDiffuse, vUv);
      vec2 d = (vUv - 0.5) * 2.0;
      float v = smoothstep(0.6, 1.1, dot(d, d) * 0.5) * strength;
      // The low sun (the moon at night) washes the picture from the upper left.
      float g = smoothstep(1.35, 0.0, length(vUv - vec2(0.12, 0.95)));
      vec3 lit = colour.rgb + glow * g * g;
      gl_FragColor = vec4(mix(lit, edge, v), 1.0);
    }`,
};

const isEnded = (game: GameState) => game.phase === 'won' || game.phase === 'lost';

export function createCinematicRig(context: RigContext): SceneRig {
  const { renderer, scene, camera, meshes, effects, key, fill } = context;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1;

  // --- Look: reflections for the metal, the diorama, lights ------------------------------------
  const pmrem = new PMREMGenerator(renderer);
  const room = new Scene();
  const roomEnvironment = new RoomEnvironment();
  roomEnvironment.rotation.x = Math.PI / 2; // the room is y-up, the board's world z-up
  room.add(roomEnvironment);
  const environment = pmrem.fromScene(room, 0.04);
  pmrem.dispose();

  const diorama = createDiorama(meshes, effects, renderer);
  meshes.root.add(diorama.group);
  diorama.setEnvironment(environment.texture, ENV_METAL);

  // The earth the gaps of the field show; the diorama brings its own plinth, the table is hidden.
  const tray = meshes.tray.material;
  if (tray instanceof MeshStandardMaterial) tray.roughness = 1;
  meshes.table.visible = false;

  const bounce = new DirectionalLight();
  bounce.position.set(0.5, -1, 0.6).multiplyScalar(1000);
  scene.add(bounce);
  const fog = new Fog(new Color(), 1, 2);
  scene.fog = fog;
  const burstLight = new PointLight();
  burstLight.intensity = 0;
  burstLight.decay = 0; // no fall-off: `distance` is the reach, as for the explosion's light
  effects.root.add(burstLight);

  // --- Post-processing --------------------------------------------------------------------------
  const target = new WebGLRenderTarget(2, 2, { type: HalfFloatType, samples: MSAA_SAMPLES });
  const composer = new EffectComposer(renderer, target);
  const bloom = new UnrealBloomPass(
    new Vector2(2, 2),
    BLOOM.strength,
    BLOOM.radius,
    BLOOM.threshold,
  );
  const vignette = new ShaderPass(VIGNETTE_SHADER);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  composer.addPass(vignette);

  // --- Camera and moves ---------------------------------------------------------------------------
  const director = createCameraDirector();
  const pose = { yaw: 0, tilt: 0, dolly: 0, panX: 0, panY: 0 };
  let gridWidth = 1;
  let gridHeight = 1;
  const show = createCinematicShow(effects, burstLight);
  let setGeometry = '';
  // The cloth of the flags waves while a flag stands on a running game (never under reduced motion).
  let flagsUp = false;
  let calm = false;
  let ended = false;
  let lastNow = 0;
  let boardCells = 0;
  let level: QualityLevel = 0;
  const windOn = () => flagsUp && !calm && !ended && boardCells <= WIND_MAX_CELLS && level < 2;

  function aimAt(index: number, t: Parameters<TransitionHook>[0]): MoveAim {
    const [x, y] = t.board.cellCentre(index);
    const [x0, y0] = t.board.cellCentre(0); // the near-left corner of the screen: (-halfW, +halfH)
    return { x: x0 === 0 ? 0 : x / Math.abs(x0), y: y0 === 0 ? 0 : y / Math.abs(y0) };
  }

  const hook: TransitionHook = (t) => {
    flagsUp = t.next.flagCount > 0;
    ended = isEnded(t.next);
    calm = t.reducedMotion || !t.active;
    if (calm) return;
    show.dig(t);
    if (t.prev === null || t.prev.id !== t.next.id) {
      // Start (or a switch to this view with a game that has not begun): the fly-in.
      if (t.next.phase === 'ready') director.start('flyIn', t.now);
      return;
    }
    if (!isEnded(t.prev) && isEnded(t.next)) {
      if (t.next.phase === 'lost' && t.next.explodedIndex !== null) {
        director.start('dive', t.now, aimAt(t.next.explodedIndex, t));
      } else if (t.next.phase === 'won') {
        director.start('orbit', t.now);
      }
      show.start(t);
    }
    // A reveal, a flag or an unflag moves no camera: during play the camera stands still.
  };

  /** Wall, ring, block and fit follow the board's size (the base scene rebuilds the tray per board). */
  function fitSet() {
    const { tray: trayMesh } = meshes;
    const stamp = trayMesh.geometry.uuid;
    if (stamp === setGeometry) return;
    setGeometry = stamp;
    trayMesh.geometry.computeBoundingBox();
    const box = trayMesh.geometry.boundingBox;
    if (!box) return;
    diorama.fit(box.max.x - box.min.x, box.max.y - box.min.y);
  }

  const edge = new Color();
  const srgb = { r: 0, g: 0, b: 0 };
  let mood: (typeof MOOD)[keyof typeof MOOD] = MOOD.day;

  return {
    hook,
    waveTotalMs: WAVE_TOTAL_MS,
    keyDirection: SUN_DIRECTION,

    stageLayout(width, height, rim, cell) {
      gridWidth = width;
      gridHeight = height;
      const p = perspectiveOf(height);
      fog.near = p * 1.15 + height * 0.5;
      fog.far = fog.near + 1.5 * Math.max(width, height);
      diorama.setCell(cell);
      return poseStageLayout(width, height, rim, cell);
    },

    // The idle sway of the "3D" view is not used: the camera stands still during play.
    overlayTransform(_sway, now) {
      lastNow = now;
      director.poseAt(now, pose);
      return poseTransform(pose, gridWidth, gridHeight, 0);
    },

    cameraMatrix(_sway, now) {
      lastNow = now;
      director.poseAt(now, pose);
      return poseWorldMatrix(pose, gridWidth, gridHeight, 0);
    },

    setSize(width, height, pixelRatio) {
      composer.setPixelRatio(pixelRatio);
      composer.setSize(width, height);
    },

    setQuality(next: QualityLevel, cells: number) {
      // Level 2: the board first, the glow later (AC8: effects shrink before the board slows).
      level = next;
      boardCells = cells;
      bloom.enabled = next < 2;
      diorama.setQuality(next, cells);
    },

    setMotion(reduced, active) {
      calm = reduced || !active;
    },

    applyPalette(palette) {
      const { colours } = palette;
      const floor = new Color(colours.revealedTop);
      const dark = 0.2126 * floor.r + 0.7152 * floor.g + 0.0722 * floor.b < DARK_SURFACE;
      mood = dark ? MOOD.night : MOOD.day;
      diorama.applyPalette(palette, dark);
      show.applyPalette(palette);
      renderer.toneMappingExposure = mood.exposure;
      key.color.set(colours.dioSun);
      key.intensity = mood.sun * Math.PI;
      key.shadow.intensity = dark ? 0.8 : 0.7;
      fill.color.set(colours.dioAmbient);
      fill.groundColor.set(colours.dioSoil);
      fill.intensity = mood.sky * Math.PI;
      bounce.color.set(colours.dioAmbient);
      bounce.intensity = mood.bounce * Math.PI;
      fog.color.copy(diorama.horizon);
      if (tray instanceof MeshStandardMaterial) tray.color.set(colours.dioSoilDeep);
      renderer.setClearColor(diorama.zenith);
      edge.set(colours.slab).getRGB(srgb, SRGBColorSpace);
      VIGNETTE_SHADER.uniforms.edge.value.set(srgb.r, srgb.g, srgb.b);
      edge.set(colours.dioSun).getRGB(srgb, SRGBColorSpace);
      const wash = dark ? 0.06 : 0.16;
      VIGNETTE_SHADER.uniforms.glow.value.set(srgb.r * wash, srgb.g * wash, srgb.b * wash);
    },

    render() {
      fitSet();
      diorama.setWind(lastNow, windOn());
      composer.render(0);
    },

    moving: (now) => director.moving(now) || windOn(),
    boardMoving: (now) => show.boardMoving(now),
    liftAt: (x, y, now) => show.liftAt(x, y, now),

    finish() {
      director.cancel();
      show.rest(); // also resets the probe's burst count (O3)
    },

    warm() {
      composer.render(0);
      show.rest();
    },

    state(now): RigState {
      director.poseAt(now, pose);
      const shown: CameraPose = pose;
      return {
        cameraMove: director.kind(now) ?? 'none',
        cameraMoveMs: director.elapsed(now),
        pose: {
          yaw: shown.yaw,
          tilt: shown.tilt,
          dolly: shown.dolly,
          panX: shown.panX,
          panY: shown.panY,
        },
        bloom: bloom.enabled,
        ...show.state(now),
      };
    },

    dispose() {
      show.dispose();
      composer.dispose();
      bloom.dispose();
      target.dispose();
      environment.dispose();
      roomEnvironment.dispose();
      diorama.dispose();
      bounce.dispose();
      burstLight.dispose();
      scene.environment = null;
      scene.fog = null;
    },
  };
}
