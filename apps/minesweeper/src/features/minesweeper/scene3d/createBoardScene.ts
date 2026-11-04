import {
  Camera,
  Color,
  DirectionalLight,
  Euler,
  HemisphereLight,
  Matrix4,
  NoToneMapping,
  PCFShadowMap,
  Quaternion,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
  InstancedMesh,
  type Texture,
} from 'three';
import { cellView, type CellView } from '../logic/cellView.ts';
import type { GameState } from '../logic/types.ts';
import { createEffectHost } from './effects.ts';
import { createEndEffects } from './endEffects.ts';
import { visibleWindow } from './endPlan.ts';
import { createEnvironment } from './environment.ts';
import {
  cameraFrustum,
  cameraWorldMatrix,
  overlayTransform,
  pixelRatio,
  stageLayout,
  swayAt,
  type StageLayout,
} from './geometry.ts';
import { createSceneMeshes, SLASH_ROTATION } from './meshes.ts';
import { createProbe } from './probe.ts';
import { createQualityGovernor } from './quality.ts';
import {
  DECAL_LIFT,
  FLAG_BASE_OFFSET,
  FLAG_LEAN_DEG,
  FRAME_WIDTH,
  HIDDEN_CENTRE,
  HIDDEN_TOP,
  KEY_DIRECTION,
  MAX_CELLS,
  UX_TOP_COSINE,
  MINE_HEIGHT,
  PRESSED_SINK,
  REVEALED_CENTRE,
  REVEALED_TOP,
  SLASH_HEIGHT,
  TILE_THICKNESS,
} from './sceneLayout.ts';
import {
  changedCells,
  FLAG_AT_REST,
  flagPose,
  hasEnded,
  hopRise,
  isDecoration,
  markerPose,
  planTransitions,
  retarget,
  revealPose,
  shudderLift,
  slashScale,
  type BoardSnapshot,
  type CellAnim,
  type DecorationAnim,
  type FlagPose,
  type PoseAnim,
} from './timeline.ts';
import {
  SCENE3D_UNAVAILABLE,
  type Board3dProbe,
  type BoardGeometry,
  type BoardSceneController,
  type CellWindow,
  type CreateBoardSceneOptions,
  type FxState,
  type ScenePalette,
  type TransitionHook,
} from './types.ts';

declare global {
  interface Window {
    /** Dev-only e2e probe (story 009); never in a production build (scripts/check-dist.mjs). */
    __board3dProbe?: Board3dProbe;
  }
}

/** Thrown when no WebGL2 context can be created; the hook compares `name` (SCENE3D_UNAVAILABLE). */
class Scene3dUnavailableError extends Error {
  override name = SCENE3D_UNAVAILABLE;
}

/** The loop renders at most 60 scene frames per second (frames are skipped on 120 Hz displays). */
const MIN_FRAME_MS = 1000 / 60 - 4;
const SHADOW_MAP = { full: 2048, reduced: 1024 } as const;
const SHADOW_BIAS = -0.0004;
const SHADOW_NORMAL_BIAS = 0.02; // cell units
const NO_SHAKE = { x: 0, y: 0 } as const;

const isCovered = (view: CellView) => view.kind === 'hidden' || view.kind === 'flagged';
const isEnded = (game: GameState | null) => game?.phase === 'won' || game?.phase === 'lost';

/**
 * The lazy entry of the 3D view (story 009, ADR 0005): the only target of `import()`. Builds the
 * renderer, lights and meshes once; boards attach and detach. Renders on demand: the sway and
 * running animations are the only loop. Nothing here changes or delays game state (AC2).
 */
export function createBoardScene(
  options: CreateBoardSceneOptions,
  hooks: readonly TransitionHook[] = [],
): BoardSceneController {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  } catch (error) {
    throw new Scene3dUnavailableError(error instanceof Error ? error.message : String(error));
  }
  try {
    return buildController(renderer, options, hooks);
  } catch (error) {
    // Mesh build, environment or shader compile failed: free the context before reporting.
    renderer.dispose();
    renderer.forceContextLoss();
    throw error;
  }
}

/** Everything after the renderer exists; createBoardScene disposes the renderer if this throws. */
function buildController(
  renderer: WebGLRenderer,
  options: CreateBoardSceneOptions,
  hooks: readonly TransitionHook[],
): BoardSceneController {
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const canvas = renderer.domElement;
  canvas.style.display = 'block';

  const fontFamily = getComputedStyle(document.body).fontFamily || 'sans-serif';
  const meshes = createSceneMeshes(renderer.capabilities.getMaxAnisotropy());
  const effects = createEffectHost();
  meshes.root.add(effects.root); // effects work in cell units too
  // Story 010: built before the compile below, so the first game end compiles nothing.
  const endEffects = createEndEffects(effects, renderer);
  const allHooks: readonly TransitionHook[] = [endEffects.hook, ...hooks];

  const scene = new Scene();
  scene.add(meshes.root);
  const key = new DirectionalLight();
  key.castShadow = true;
  key.shadow.mapSize.set(SHADOW_MAP.full, SHADOW_MAP.full);
  key.shadow.bias = SHADOW_BIAS;
  const fill = new HemisphereLight();
  fill.position.set(0, 0, 1); // the sky is +z
  scene.add(key, key.target, fill);

  let environment: Texture | null = null;

  const sizeOf = new Vector2();
  const camera = new Camera();
  camera.matrixAutoUpdate = false;

  // State
  let palette: ScenePalette = options.palette;
  let reducedMotion = options.reducedMotion;
  let active = true;
  let disposed = false;
  let contextLost = false;
  let host: HTMLElement | null = null;
  let grid: HTMLElement | null = null;
  let stage: HTMLElement | null = null;
  let observer: ResizeObserver | null = null;
  let game: GameState | null = null;
  let snapshot: BoardSnapshot | null = null;
  let anims: CellAnim[] = [];
  let pressed: number | null = null;
  let layout: (StageLayout & { readonly cell: number; readonly gap: number }) | null = null;
  let boardKey = '';
  const quality = createQualityGovernor();
  let dirty = true;
  let wasMoving = false;
  let animatedFrames = 0;
  let frames = 0;
  // Frame loop
  let rafId = 0;
  let needsRender = false;
  let lastRenderTs = -Infinity;
  let lastCallbackTs: number | null = null;
  // Clock: real time, or the probe's manual clock. The sway has its own epoch so that the probe
  // can start it at phase 0.
  let paused = false;
  let manualNow = 0;
  let swayEpoch = performance.now();
  let swayHeld = false;

  const sceneNow = () => (paused ? manualNow : performance.now());
  const swayOn = () => !reducedMotion && active && !swayHeld;
  const currentSway = (now: number) => (swayOn() ? swayAt(now - swayEpoch) : 0);
  /** Cells move: instances and the shadow map need rewriting. */
  const boardMoving = (now: number) => anims.some((anim) => !hasEnded(anim, now));
  /** Anything moves: the loop must run (effects-only frames skip instances and shadows). */
  const animating = (now: number) => boardMoving(now) || effects.running;

  function applyPalette(next: ScenePalette) {
    palette = next;
    const { colours, look } = next;
    meshes.applyPalette(next, fontFamily);
    environment?.dispose();
    environment = createEnvironment(renderer, next);
    meshes.setEnvironment(environment, look.envIntensity);
    key.color.set(colours.keyLight);
    // Physical light units (r155+): × π. Normalised to the UX's top cosine, so an up-facing
    // matte surface keeps its calibrated factor at the elevation used here.
    key.intensity = (look.keyIntensity * Math.PI * UX_TOP_COSINE) / KEY_DIRECTION[2];
    key.shadow.intensity = look.shadowStrength;
    fill.color.set(colours.fillSky);
    fill.groundColor.set(colours.fillGround);
    fill.intensity = look.fillIntensity * Math.PI;
    renderer.setClearColor(new Color(colours.table));
    endEffects.applyPalette(next);
    dirty = true;
    renderer.shadowMap.needsUpdate = true;
  }
  applyPalette(palette);

  /** Measures the grid and stage and sets margins, canvas size, camera frustum, light. */
  function measure() {
    if (!grid || !stage || !game) return;
    const { rows, cols } = game.config;
    const gridStyle = getComputedStyle(grid);
    const width = parseFloat(gridStyle.width);
    const height = parseFloat(gridStyle.height);
    const gap = parseFloat(gridStyle.rowGap) || 0;
    const rim = parseFloat(getComputedStyle(stage).paddingLeft) || 0;
    if (!(width > 0 && height > 0)) return;
    const cell = (width - (cols - 1) * gap) / cols;
    const next = stageLayout(width, height, rim);
    const { top, bottom, inline } = next.margins;
    const margin = `${top}px ${inline}px ${bottom}px`;
    if (grid.style.margin !== margin) grid.style.margin = margin;

    const dpr = pixelRatio(
      quality.level >= 1 ? 1 : window.devicePixelRatio,
      next.width,
      next.height,
    );
    // Resizing clears the canvas: only when something changed.
    const size = renderer.getSize(sizeOf);
    if (renderer.getPixelRatio() !== dpr || size.x !== next.width || size.y !== next.height) {
      renderer.setPixelRatio(dpr);
      renderer.setSize(next.width, next.height);
    }
    const f = cameraFrustum(next, width);
    camera.projectionMatrix.makePerspective(f.left, f.right, f.top, f.bottom, f.near, f.far);
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

    // Tray frame: at most the rim minus 1 px, so it never leaves the canvas (UX §2).
    const frame = Math.max(0, Math.min(FRAME_WIDTH * cell, rim - 1)) / cell;
    const sizeKey = `${rows}x${cols}:${(width / cell).toFixed(4)}:${frame.toFixed(4)}`;
    if (sizeKey !== boardKey) {
      boardKey = sizeKey;
      meshes.setBoardSize(width / cell, height / cell, frame);
    }
    meshes.root.scale.setScalar(cell);

    // Key light: fixed direction, shadow camera fitted around the board (world units = CSS px).
    const reach = Math.hypot(width, height) / 2 + 2 * cell;
    const distance = 3 * reach;
    key.position
      .set(...KEY_DIRECTION)
      .normalize()
      .multiplyScalar(distance);
    key.target.position.set(0, 0, 0);
    const shadowCamera = key.shadow.camera;
    shadowCamera.left = -reach;
    shadowCamera.right = reach;
    shadowCamera.top = reach;
    shadowCamera.bottom = -reach;
    shadowCamera.near = distance - 2 * reach;
    shadowCamera.far = distance + 2 * reach;
    shadowCamera.updateProjectionMatrix();
    key.shadow.normalBias = SHADOW_NORMAL_BIAS * cell;
    key.shadow.radius = Math.min(6, Math.max(2, 93 / Math.max(rows, cols)));

    layout = { ...next, cell, gap };
    // The overlay transform belongs with the margins: also when no frame follows (forced
    // colours, scene inactive) and before the first frame of a re-attached board.
    writeOverlay(sceneNow());
    dirty = true;
    renderer.shadowMap.needsUpdate = true;
  }

  function setShadowMapSize(size: number) {
    if (key.shadow.mapSize.x === size) return;
    key.shadow.mapSize.set(size, size);
    key.shadow.map?.dispose();
    key.shadow.map = null;
    renderer.shadowMap.needsUpdate = true;
  }

  /** The grid's inline transform for the sway at `now` (phase 0 when inactive or reduced motion). */
  function writeOverlay(now: number): number {
    const sway = currentSway(now);
    if (grid && layout) {
      const transform = overlayTransform(layout.gridHeight, sway);
      if (grid.style.transform !== transform) grid.style.transform = transform;
    }
    return sway;
  }

  const shakeMatrix = new Matrix4();
  /** Sway, plus the shake of story 010 as a translation in camera space (the world stays). */
  function updateCamera(
    sway: number,
    shake: { readonly x: number; readonly y: number } = NO_SHAKE,
  ) {
    if (!layout) return;
    camera.matrix.fromArray(cameraWorldMatrix(layout.gridHeight, sway));
    if (shake.x !== 0 || shake.y !== 0) {
      camera.matrix.multiply(
        shakeMatrix.makeTranslation(shake.x * layout.cell, shake.y * layout.cell, 0),
      );
    }
    camera.matrixWorld.copy(camera.matrix);
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    camera.matrixWorldNeedsUpdate = true;
  }

  // Instance writing (cell units; meshes.root is scaled by the cell size)
  const matrix = new Matrix4();
  const local = new Matrix4();
  const position = new Vector3();
  const rotation = new Quaternion();
  const scale = new Vector3();
  const euler = new Euler();
  const colour = new Color();
  const lean = new Quaternion().setFromEuler(new Euler((-FLAG_LEAN_DEG * Math.PI) / 180, 0, 0));
  const poleAxis = new Vector3(0, 0, 1).applyQuaternion(lean);
  const counts = new Map<InstancedMesh, number>();
  const running = new Map<number, PoseAnim>();
  const decorations = new Map<number, DecorationAnim>();
  const instancedMeshes: InstancedMesh[] = [];
  meshes.root.traverse((object) => {
    // The board's own meshes only: the effect batches (story 010) manage their counts.
    if (object instanceof InstancedMesh && object.parent !== effects.root) {
      instancedMeshes.push(object);
    }
  });
  const identity = new Quaternion();

  function put(mesh: InstancedMesh, m: Matrix4, tint?: string) {
    const slot = counts.get(mesh) ?? 0;
    if (slot >= MAX_CELLS) return;
    mesh.setMatrixAt(slot, m);
    if (tint !== undefined) mesh.setColorAt(slot, colour.set(tint));
    counts.set(mesh, slot + 1);
  }

  function compose(x: number, y: number, z: number, q: Quaternion, s: number) {
    return matrix.compose(position.set(x, y, z), q, scale.set(s, s, s));
  }

  function putFlag(x: number, y: number, top: number, pose: FlagPose, halo: string, hop = 0) {
    if (pose.scale <= 0.001) return;
    position
      .set(x, y + FLAG_BASE_OFFSET, top + pose.rise + hop)
      .addScaledVector(poleAxis, pose.drop);
    matrix.compose(position, lean, scale.set(pose.scale, pose.scale, pose.scale));
    put(meshes.poles, matrix);
    put(meshes.poleHalos, matrix, halo);
    local.makeScale(Math.max(0.001, pose.clothScale), 1, 1);
    matrix.multiply(local);
    put(meshes.cloths, matrix);
    put(meshes.clothHalos, matrix, halo);
  }

  /** A slash at (x, y), scaled along its length (story 010: it draws on). */
  function slashAt(x: number, y: number, length: number) {
    return matrix.compose(
      position.set(x, y, REVEALED_TOP + SLASH_HEIGHT),
      SLASH_ROTATION,
      scale.set(length, 1, 1),
    );
  }

  function writeInstances(now: number) {
    counts.clear();
    if (game && layout) {
      const { rows, cols } = game.config;
      const step = 1 + layout.gap / layout.cell;
      const halfW = ((cols - 1) * step) / 2;
      const halfH = ((rows - 1) * step) / 2;
      const ended = isEnded(game);
      running.clear();
      decorations.clear();
      for (const anim of anims) {
        if (hasEnded(anim, now)) continue;
        if (isDecoration(anim)) decorations.set(anim.index, anim);
        else running.set(anim.index, anim);
      }
      const { colours } = palette;

      for (let index = 0; index < rows * cols; index++) {
        const x = (index % cols) * step - halfW;
        const y = halfH - Math.floor(index / cols) * step;
        const view = cellView(game, index);
        const anim = running.get(index);
        const decoration = decorations.get(index);
        const sink = index === pressed && isCovered(view) && !ended ? PRESSED_SINK : 0;
        const shudder = decoration?.kind === 'shudder' ? shudderLift(decoration, now) : 0;

        if (view.kind === 'hidden' || view.kind === 'flagged') {
          const lift = shudder - sink;
          put(meshes.hiddenTiles, compose(x, y, HIDDEN_CENTRE + lift, identity, 1));
          if (view.kind === 'flagged') {
            const pose = anim?.kind === 'plant' ? flagPose(anim, now) : FLAG_AT_REST;
            const hop = decoration?.kind === 'hop' ? hopRise(decoration, now) : 0;
            putFlag(x, y, HIDDEN_TOP + lift, pose, colours.tileTop, hop);
          } else if (anim?.kind === 'unplant') {
            putFlag(x, y, HIDDEN_TOP + lift, flagPose(anim, now), colours.tileTop);
          }
          continue;
        }

        const top = view.kind === 'mineExploded' ? colours.explodedTop : colours.revealedTop;
        if (anim?.kind === 'reveal') {
          const pose = revealPose(anim, now);
          const z =
            HIDDEN_CENTRE + (REVEALED_CENTRE - HIDDEN_CENTRE) * pose.sink + pose.lift + shudder;
          rotation.setFromEuler(euler.set((pose.angleDeg * Math.PI) / 180, 0, 0));
          const tile = compose(x, y, z, rotation, 1);
          if (pose.swapped) put(meshes.revealedTiles, tile, top);
          else put(meshes.hiddenTiles, tile);
          if (view.kind === 'number' && pose.glyphScale > 0) {
            // The face that ends on top is the one that started at the bottom.
            const turn = anim.flip ? pose.angleDeg - 180 : 0;
            rotation.setFromEuler(euler.set((turn * Math.PI) / 180, 0, 0));
            matrix.compose(position.set(x, y, z), rotation, scale.set(1, 1, 1));
            local.compose(
              position.set(0, 0, TILE_THICKNESS / 2 + DECAL_LIFT),
              identity,
              scale.set(pose.glyphScale, pose.glyphScale, pose.glyphScale),
            );
            const digit = meshes.digits[view.count - 1];
            if (digit) put(digit, matrix.multiply(local));
          }
          if (view.kind === 'mine' && pose.glyphScale > 0) {
            // Story 010: a chain mine appears with the flip (as a digit does).
            const turn = anim.flip ? pose.angleDeg - 180 : 0;
            rotation.setFromEuler(euler.set((turn * Math.PI) / 180, 0, 0));
            matrix.compose(position.set(x, y, z), rotation, scale.set(1, 1, 1));
            local.compose(
              position.set(0, 0, TILE_THICKNESS / 2 + MINE_HEIGHT),
              identity,
              scale.set(pose.glyphScale, pose.glyphScale, pose.glyphScale),
            );
            matrix.multiply(local);
            put(meshes.mines, matrix);
            put(meshes.mineHalos, matrix);
          }
          continue;
        }

        put(meshes.revealedTiles, compose(x, y, REVEALED_CENTRE, identity, 1), top);
        switch (view.kind) {
          case 'number': {
            const digit = meshes.digits[view.count - 1];
            if (digit) put(digit, compose(x, y, REVEALED_TOP + DECAL_LIFT, identity, 1));
            break;
          }
          case 'mine':
            put(meshes.mines, compose(x, y, REVEALED_TOP + MINE_HEIGHT, identity, 1));
            put(meshes.mineHalos, matrix);
            break;
          case 'mineExploded': {
            // Story 010: the marker pops in out of the fire (scale 0 before).
            const marker =
              decoration?.kind === 'marker' ? markerPose(decoration, now) : { disc: 1, mine: 1 };
            if (marker.disc > 0.001) {
              put(
                meshes.explodedMarks,
                compose(x, y, REVEALED_TOP + DECAL_LIFT, identity, marker.disc),
              );
            }
            if (marker.mine > 0.001) {
              put(
                meshes.explodedMines,
                compose(x, y, REVEALED_TOP + MINE_HEIGHT, identity, marker.mine),
              );
            }
            break;
          }
          case 'flagWrong': {
            putFlag(x, y, REVEALED_TOP, FLAG_AT_REST, colours.revealedTop);
            const length = decoration?.kind === 'slash' ? slashScale(decoration, now) : 1;
            if (length > 0.001) {
              put(meshes.slashHalos, slashAt(x, y, length));
              put(meshes.slashes, matrix);
            }
            break;
          }
          case 'empty':
            break;
        }
      }
    }
    for (const mesh of instancedMeshes) {
      const count = counts.get(mesh) ?? 0;
      mesh.count = count;
      if (count === 0) continue; // count 0 draws nothing: nothing to upload
      // Upload only the used part of the 900-instance buffers.
      mesh.instanceMatrix.clearUpdateRanges();
      mesh.instanceMatrix.addUpdateRange(0, count * 16);
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) {
        mesh.instanceColor.clearUpdateRanges();
        mesh.instanceColor.addUpdateRange(0, count * 3);
        mesh.instanceColor.needsUpdate = true;
      }
    }
    dirty = false;
  }

  function renderFrame(now: number) {
    if (!grid || !layout || !active || disposed || contextLost) return;
    needsRender = false;
    // Effects first: they add the shake the camera needs (story 010).
    effects.update(now, quality.level);
    const sway = writeOverlay(now);
    updateCamera(sway, effects.shake);
    const moving = boardMoving(now);
    if (dirty || moving || wasMoving) {
      const staticChange = dirty && !moving;
      writeInstances(now);
      animatedFrames = moving ? animatedFrames + 1 : 0;
      const shadow =
        staticChange ||
        (!moving && wasMoving) ||
        (moving && (quality.level === 0 || (quality.level === 1 && animatedFrames % 2 === 0)));
      if (shadow) renderer.shadowMap.needsUpdate = true;
    }
    wasMoving = moving;
    if (anims.length > 0 && !moving) anims = [];
    else if (anims.length > 0) anims = anims.filter((anim) => !hasEnded(anim, now));
    renderer.render(scene, camera);
    frames++;
  }

  const endAnimating = () => effects.running || (isEnded(game) && anims.length > 0);

  /**
   * UX G3, §7: a hidden tab ends a running end effect, so it never replays on return. There is
   * no frame-gap rule: effects are closed-form in the scene time, so a late frame already shows
   * the right picture and they end at lossEndMs / winEndMs by themselves (review round 1).
   */
  const onVisibility = () => {
    if (document.hidden && endAnimating()) {
      finishEffects();
      requestRender();
    }
  };

  /** Ends every end effect and cell animation at once: the static final board (UX §7). */
  function finishEffects() {
    effects.clear();
    anims = [];
    dirty = true;
    renderer.shadowMap.needsUpdate = true;
  }

  const wantsLoop = (now: number) =>
    grid !== null && active && !paused && !disposed && !contextLost && (swayOn() || animating(now));

  function onFrame(ts: number) {
    rafId = 0;
    if (!grid || !active || disposed || contextLost || paused) return;
    const now = sceneNow();
    if (lastCallbackTs !== null) {
      const before = quality.level;
      if (quality.feed(ts - lastCallbackTs, now) !== before) {
        setShadowMapSize(quality.level === 2 ? SHADOW_MAP.reduced : SHADOW_MAP.full);
        measure(); // DPR 1 from level 1
      }
    }
    lastCallbackTs = ts;
    if (needsRender || ts - lastRenderTs >= MIN_FRAME_MS) {
      renderFrame(now);
      lastRenderTs = ts;
    }
    if (wantsLoop(sceneNow())) rafId = requestAnimationFrame(onFrame);
    else lastCallbackTs = null;
  }

  function requestRender() {
    if (!grid || !active || disposed || contextLost) return;
    needsRender = true;
    if (paused) renderFrame(sceneNow());
    else if (rafId === 0) rafId = requestAnimationFrame(onFrame);
  }

  function stopLoop() {
    if (rafId !== 0) cancelAnimationFrame(rafId);
    rafId = 0;
    lastCallbackTs = null;
  }

  const onContextLost = () => {
    contextLost = true;
    stopLoop();
    options.onContextLost();
  };
  canvas.addEventListener('webglcontextlost', onContextLost);

  // Compile every program now, so the first board frame does not hitch.
  renderer.compile(scene, camera);
  endEffects.rest();
  // After everything that can throw: a failed build must not leave a document listener behind.
  document.addEventListener('visibilitychange', onVisibility);

  /** Board geometry for the transition hooks (story 010); the visible window is read once, on demand. */
  function boardGeometry(
    next: GameState,
  ): BoardGeometry & { readonly isVisible: (index: number) => boolean } {
    const { rows, cols } = next.config;
    const cellPx = layout?.cell ?? 1;
    const step = layout ? 1 + layout.gap / layout.cell : 1;
    const cellCentre = (index: number) =>
      [
        (index % cols) * step - ((cols - 1) * step) / 2,
        ((rows - 1) * step) / 2 - Math.floor(index / cols) * step,
      ] as const;
    let window: CellWindow | null = null;
    const readWindow = (): CellWindow => {
      const whole = { left: -Infinity, right: Infinity, bottom: -Infinity, top: Infinity };
      if (!layout || !stage) return whole;
      const box = canvas.getBoundingClientRect();
      const scroller = stage.parentElement ?? stage;
      const outer = scroller.getBoundingClientRect();
      const left = Math.max(box.left, outer.left + scroller.clientLeft, 0);
      const top = Math.max(box.top, outer.top + scroller.clientTop, 0);
      const right = Math.min(
        box.right,
        outer.left + scroller.clientLeft + scroller.clientWidth,
        innerWidth,
      );
      const bottom = Math.min(
        box.bottom,
        outer.top + scroller.clientTop + scroller.clientHeight,
        innerHeight,
      );
      // Canvas CSS px equal stage px (the canvas is sized to the stage layout).
      return visibleWindow({
        rows,
        cols,
        step,
        cellPx,
        rimPx: parseFloat(getComputedStyle(stage).paddingLeft) || 0,
        centreX: layout.centreX,
        centreY: layout.centreY,
        view: {
          left: left - box.left,
          top: top - box.top,
          right: right - box.left,
          bottom: bottom - box.top,
        },
      });
    };
    const visible = () => (window ??= readWindow());
    return {
      rows,
      cols,
      cellPx,
      cellCentre,
      visibleWindow: visible,
      isVisible(index) {
        const [x, y] = cellCentre(index);
        const w = visible();
        return x >= w.left && x <= w.right && y >= w.bottom && y <= w.top;
      },
    };
  }

  function topOf(index: number): number {
    if (!game) return HIDDEN_TOP;
    return isCovered(cellView(game, index)) ? HIDDEN_TOP : REVEALED_TOP;
  }

  function readRenderer(): string {
    const gl = renderer.getContext();
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    return String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
  }

  const probeInternals = {
    pause() {
      stopLoop();
      paused = true;
      manualNow = performance.now();
      swayEpoch = manualNow;
      requestRender();
    },
    holdSway(hold: boolean) {
      if (swayHeld && !hold) swayEpoch = sceneNow(); // released: the sway restarts at phase 0
      swayHeld = hold;
      requestRender();
    },
    advance(ms: number) {
      manualNow += ms;
      if (paused) renderFrame(manualNow);
    },
    project(index: number, [dx, dy, dz]: readonly [number, number, number]) {
      if (!game || !layout) return { x: NaN, y: NaN };
      const { rows, cols } = game.config;
      const step = 1 + layout.gap / layout.cell;
      updateCamera(currentSway(sceneNow()));
      const point = new Vector3(
        (index % cols) * step - ((cols - 1) * step) / 2 + dx,
        ((rows - 1) * step) / 2 - Math.floor(index / cols) * step + dy,
        topOf(index) + dz,
      )
        .multiplyScalar(layout.cell)
        .project(camera);
      const rect = canvas.getBoundingClientRect();
      return {
        x: rect.left + ((point.x + 1) / 2) * rect.width,
        y: rect.top + ((1 - point.y) / 2) * rect.height,
      };
    },
    pixels(points: readonly { x: number; y: number }[]): [number, number, number][] {
      renderFrame(sceneNow());
      const gl = renderer.getContext();
      const rect = canvas.getBoundingClientRect();
      const buffer = new Uint8Array(4);
      return points.map(({ x, y }) => {
        const px = Math.floor(((x - rect.left) * canvas.width) / rect.width);
        const py = canvas.height - 1 - Math.floor(((y - rect.top) * canvas.height) / rect.height);
        gl.readPixels(px, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
        return [buffer[0] ?? 0, buffer[1] ?? 0, buffer[2] ?? 0];
      });
    },
    frames: () => frames,
    level: () => quality.level,
    renderer: readRenderer,
    fxState(): FxState {
      const now = sceneNow();
      return {
        running: effects.running,
        animating: anims.filter((anim) => !hasEnded(anim, now)).length,
        ...endEffects.state(),
      };
    },
    luminance(rect?: { x: number; y: number; width: number; height: number }): number {
      renderFrame(sceneNow());
      const gl = renderer.getContext();
      const box = canvas.getBoundingClientRect();
      const sx = canvas.width / box.width;
      const sy = canvas.height / box.height;
      const clampX = (v: number) => Math.min(canvas.width, Math.max(0, Math.round(v)));
      const clampY = (v: number) => Math.min(canvas.height, Math.max(0, Math.round(v)));
      const x0 = rect ? clampX((rect.x - box.left) * sx) : 0;
      const x1 = rect ? clampX((rect.x + rect.width - box.left) * sx) : canvas.width;
      const top = rect ? clampY((rect.y - box.top) * sy) : 0;
      const bottom = rect ? clampY((rect.y + rect.height - box.top) * sy) : canvas.height;
      const width = x1 - x0;
      const height = bottom - top;
      if (width <= 0 || height <= 0) return NaN;
      const buffer = new Uint8Array(width * height * 4);
      gl.readPixels(x0, canvas.height - bottom, width, height, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
      // sRGB byte → linear; built here so it is dropped with the probe in production.
      const LINEAR = Array.from({ length: 256 }, (_, i) => {
        const c = i / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      let sum = 0;
      for (let i = 0; i < buffer.length; i += 4) {
        sum +=
          0.2126 * (LINEAR[buffer[i] ?? 0] ?? 0) +
          0.7152 * (LINEAR[buffer[i + 1] ?? 0] ?? 0) +
          0.0722 * (LINEAR[buffer[i + 2] ?? 0] ?? 0);
      }
      return sum / (width * height);
    },
  };
  let probe: Board3dProbe | null = null;
  if (import.meta.env.DEV && import.meta.env.MODE === 'e2e') {
    probe = createProbe(probeInternals);
    window.__board3dProbe = probe;
  }

  const controller: BoardSceneController = {
    attach(nextHost, nextGrid) {
      if (disposed) return;
      host = nextHost;
      grid = nextGrid;
      stage = nextHost.parentElement ?? nextHost;
      host.appendChild(canvas);
      // The next update() is the first state of this board: nothing to animate from.
      game = null;
      snapshot = null;
      anims = [];
      observer = new ResizeObserver(() => {
        measure();
        requestRender();
      });
      observer.observe(nextGrid);
      observer.observe(stage);
    },

    detach() {
      stopLoop();
      observer?.disconnect();
      observer = null;
      canvas.remove();
      if (grid) {
        grid.style.transform = '';
        grid.style.margin = '';
      }
      finishEffects();
      host = null;
      grid = null;
      stage = null;
      game = null;
      snapshot = null;
      anims = [];
      pressed = null;
      layout = null;
    },

    update(nextGame, origin) {
      if (disposed) return;
      const prevGame = game;
      const next: BoardSnapshot = {
        gameId: nextGame.id,
        phase: nextGame.phase,
        kinds: nextGame.cells.map((_, index) => cellView(nextGame, index).kind),
        explodedIndex: nextGame.explodedIndex,
      };
      const now = sceneNow();
      const newGame = prevGame === null || prevGame.id !== nextGame.id;
      if (newGame) finishEffects();
      const board = boardGeometry(nextGame);
      const ends = !newGame && !isEnded(prevGame) && isEnded(nextGame);
      const planned = planTransitions(snapshot, next, origin, nextGame.config.cols, now, {
        reducedMotion: reducedMotion || !active,
        level: quality.level,
        isVisible: ends && nextGame.phase === 'won' ? board.isVisible : null,
      });
      anims = retarget(anims, planned, changedCells(snapshot, next), now);
      for (const hook of allHooks) {
        try {
          hook(
            {
              prev: prevGame,
              next: nextGame,
              origin,
              reducedMotion,
              active,
              now,
              level: quality.level,
              board,
            },
            effects,
          );
        } catch (error) {
          // Decoration only: the board stays static (story 010, UX §7).
          console.error('3D end effect could not start', error);
        }
      }
      game = nextGame;
      snapshot = next;
      if (newGame || prevGame.config !== nextGame.config) measure();
      dirty = true;
      requestRender();
    },

    setPressed(index) {
      if (pressed === index) return;
      pressed = index;
      dirty = true;
      requestRender();
    },

    setPalette(next) {
      finishEffects(); // UX §7: no re-colouring of live particles
      applyPalette(next);
      requestRender();
    },

    setMotion(motion) {
      reducedMotion = motion.reducedMotion;
      if (reducedMotion || !motion.active) finishEffects();
      active = motion.active;
      if (!active) stopLoop();
      writeOverlay(sceneNow());
      dirty = true;
      requestRender();
    },

    dispose() {
      if (disposed) return;
      canvas.removeEventListener('webglcontextlost', onContextLost);
      document.removeEventListener('visibilitychange', onVisibility);
      controller.detach();
      disposed = true;
      effects.clear();
      endEffects.dispose();
      meshes.dispose();
      environment?.dispose();
      renderer.dispose();
      if (!contextLost) renderer.forceContextLoss();
      if (import.meta.env.DEV && import.meta.env.MODE === 'e2e') {
        if (window.__board3dProbe === probe) delete window.__board3dProbe;
      }
    },
  };
  return controller;
}
