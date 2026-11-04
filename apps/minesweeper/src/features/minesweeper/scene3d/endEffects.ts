import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NormalBlending,
  PlaneGeometry,
  PointLight,
  Quaternion,
  SRGBColorSpace,
  Vector3,
  type Material,
  type WebGLRenderer,
} from 'three';
import { cellView } from '../logic/cellView.ts';
import type { GameState } from '../logic/types.ts';
import { EFFECT_LIMITS, FX_CAPACITY, FX_GENERAL, FX_LOSS, FX_WIN } from './effectParams.ts';
import type { EffectRunner } from './effects.ts';
import {
  bloomAt,
  confettiFade,
  createParticleState,
  effectScale,
  effectSeed,
  flashLightAt,
  levelShare,
  mineChain,
  particleAt,
  screenToScene,
  screenV,
  shakeAt,
  spawnConfetti,
  spawnExplosion,
  velocityAt,
  type ChainPuffSite,
  type MineStep,
  type Particle,
} from './endPlan.ts';
import { TILT_DEG } from './geometry.ts';
import type {
  EffectFrame,
  FxState,
  SceneEffect,
  ScenePalette,
  SceneTransition,
  TransitionHook,
} from './types.ts';

/**
 * The end effects of the 3D board (story 010, UX §3, §4): the explosion on a loss and the
 * confetti on a win. Lazy chunk (three). Every mesh, texture and the flash light are built once
 * at scene creation (count 0, hidden), so `renderer.compile` sees every program and the first
 * loss compiles nothing. Effects are closed-form functions of the scene time: the probe's clock,
 * a late frame or a jump give the same picture. Nothing here is read by the game or the DOM.
 */

export type EndFxState = Omit<FxState, 'running' | 'animating'>;

export interface EndEffects {
  readonly hook: TransitionHook;
  /** Hides every effect object; call after `renderer.compile` (which needs them visible). */
  rest(): void;
  applyPalette(palette: ScenePalette): void;
  /** Counts at the last frame (probe). */
  state(): EndFxState;
  dispose(): void;
}

const WHITE = new Color(1, 1, 1);
const NO_CHAIN: readonly MineStep[] = [];
const TILT = (TILT_DEG * Math.PI) / 180;
const GLOW_PX = 64;
/**
 * Relative luminance of the revealed top below which the bloom, fire and sparks blend additively
 * (dark scheme: they glow). On light surfaces additive light clips to white, so they are painted.
 */
const DARK_SURFACE = 0.2;

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const easeOut = (t: number) => 1 - (1 - t) ** 2;
const isEnded = (game: GameState) => game.phase === 'won' || game.phase === 'lost';

/** A white radial mask (alpha only); the material and instance colours tint it. */
function glowTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = GLOW_PX;
  canvas.height = GLOW_PX;
  const context = canvas.getContext('2d');
  if (context) {
    const image = context.createImageData(GLOW_PX, GLOW_PX);
    const half = GLOW_PX / 2;
    for (let y = 0; y < GLOW_PX; y++) {
      for (let x = 0; x < GLOW_PX; x++) {
        const r = Math.hypot(x + 0.5 - half, y + 0.5 - half) / half;
        const i = (y * GLOW_PX + x) * 4;
        image.data[i] = 255;
        image.data[i + 1] = 255;
        image.data[i + 2] = 255;
        image.data[i + 3] = 255 * clamp01(1 - r * r) ** 2; // full core, soft rim
      }
    }
    context.putImageData(image, 0, 0);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A flat ring whose radii are rewritten per frame (no allocation). */
function ringGeometry(segments: number): BufferGeometry {
  const geometry = new BufferGeometry();
  const position = new Float32BufferAttribute(new Float32Array(segments * 6), 3);
  geometry.setAttribute('position', position.setUsage(DynamicDrawUsage));
  const index: number[] = [];
  for (let i = 0; i < segments; i++) {
    const a = 2 * i;
    const b = (2 * i + 2) % (2 * segments);
    index.push(a, a + 1, b, a + 1, b + 1, b); // counter-clockwise seen from above (+z)
  }
  geometry.setIndex(index);
  return geometry;
}

function setRing(geometry: BufferGeometry, inner: number, outer: number): void {
  const position = geometry.getAttribute('position');
  const segments = position.count / 2;
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * 2 * Math.PI;
    const c = Math.cos(a);
    const s = Math.sin(a);
    position.setXYZ(2 * i, c * inner, s * inner, 0);
    position.setXYZ(2 * i + 1, c * outer, s * outer, 0);
  }
  position.needsUpdate = true;
}

/** Per-instance alpha for the glow meshes (three's InstancedMesh has colour only). */
function withInstanceAlpha(material: MeshBasicMaterial, key: string): MeshBasicMaterial {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nattribute float instanceAlpha;\nvarying float vInstanceAlpha;',
      )
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvInstanceAlpha = instanceAlpha;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vInstanceAlpha;')
      .replace(
        '#include <color_fragment>',
        '#include <color_fragment>\ndiffuseColor.a *= vInstanceAlpha;',
      );
  };
  material.customProgramCacheKey = () => key;
  return material;
}

/** An instanced mesh with per-instance colour (and alpha) that the effects fill per frame. */
class Batch {
  readonly mesh: InstancedMesh;
  readonly alpha: InstancedBufferAttribute | null;
  count = 0;

  constructor(geometry: BufferGeometry, material: Material, capacity: number, alpha: boolean) {
    this.alpha = alpha
      ? new InstancedBufferAttribute(new Float32Array(capacity), 1).setUsage(DynamicDrawUsage)
      : null;
    if (this.alpha) geometry.setAttribute('instanceAlpha', this.alpha);
    this.mesh = new InstancedMesh(geometry, material, capacity);
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    this.mesh.setColorAt(0, new Color(1, 1, 1)); // creates the colour buffer before the compile
    this.mesh.instanceColor?.setUsage(DynamicDrawUsage);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
  }

  begin() {
    this.count = 0;
  }

  put(matrix: Matrix4, colour: Color, alpha = 1) {
    if (this.count >= this.mesh.instanceMatrix.count) return; // budget: never overflows
    this.mesh.setMatrixAt(this.count, matrix);
    this.mesh.setColorAt(this.count, colour);
    this.alpha?.setX(this.count, alpha);
    this.count++;
  }

  end() {
    const { mesh, count } = this;
    mesh.count = count;
    mesh.visible = count > 0;
    if (count === 0) return;
    mesh.instanceMatrix.clearUpdateRanges();
    mesh.instanceMatrix.addUpdateRange(0, count * 16);
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.clearUpdateRanges();
      mesh.instanceColor.addUpdateRange(0, count * 3);
      mesh.instanceColor.needsUpdate = true;
    }
    if (this.alpha) {
      this.alpha.clearUpdateRanges();
      this.alpha.addUpdateRange(0, count);
      this.alpha.needsUpdate = true;
    }
  }

  clear() {
    this.begin();
    this.end();
  }
}

export function createEndEffects(host: EffectRunner, renderer: WebGLRenderer): EndEffects {
  const glow = glowTexture();
  const unlit = (options: ConstructorParameters<typeof MeshBasicMaterial>[0] = {}) =>
    new MeshBasicMaterial({ toneMapped: false, ...options });

  // Bloom (L1): one screen-facing billboard, always on top (blending by scheme, applyPalette).
  const bloomMaterial = unlit({
    map: glow,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const bloom = new Mesh(new PlaneGeometry(1, 1), bloomMaterial);
  bloom.renderOrder = 30;

  // Shock ring (L4): flat on the board.
  const ringMaterial = unlit({ transparent: true, depthTest: false, depthWrite: false });
  const ring = new Mesh(ringGeometry(64), ringMaterial);
  ring.renderOrder = 20;

  // Smoke and chain puffs (normal blending: dark smoke on light tiles), fire and sparks.
  const smokeMaterial = withInstanceAlpha(
    unlit({ map: glow, transparent: true, depthWrite: false }),
    'fx-smoke',
  );
  const smoke = new Batch(new PlaneGeometry(1, 1), smokeMaterial, FX_CAPACITY.glow, true);
  smoke.mesh.renderOrder = 21;
  const fireMaterial = withInstanceAlpha(
    unlit({ map: glow, transparent: true, depthWrite: false }),
    'fx-fire',
  );
  const fire = new Batch(new PlaneGeometry(1, 1), fireMaterial, FX_CAPACITY.glow, true);
  fire.mesh.renderOrder = 22;

  // Shards (L7): lit pieces of tile.
  const shardMaterial = new MeshStandardMaterial({ roughness: 0.45, metalness: 0 });
  const shards = new Batch(
    new BoxGeometry(1, 1, FX_LOSS.shards.thickness),
    shardMaterial,
    FX_CAPACITY.shards,
    false,
  );

  // Confetti (W3): rectangles, dots, ribbons; unlit, the same colour on both sides.
  const confettiMaterial = unlit({ side: DoubleSide });
  const confetti = [
    new Batch(new PlaneGeometry(1, 1), confettiMaterial, FX_CAPACITY.confetti, false),
    new Batch(new CircleGeometry(0.5, 12), confettiMaterial, FX_CAPACITY.confetti, false),
    new Batch(new PlaneGeometry(1, 1), confettiMaterial, FX_CAPACITY.confetti, false),
  ] as const;

  // Flash light (L2): always in the scene (adding it at the click would recompile every lit
  // material), intensity 0 at rest.
  const light = new PointLight(0, 0, 0, 0);

  const batches = [smoke, fire, shards, ...confetti];
  host.root.add(bloom, ring, light, ...batches.map((batch) => batch.mesh));
  renderer.initTexture(glow);

  // Palette
  const colours = {
    flash: new Color(),
    core: new Color(),
    mid: new Color(),
    edge: new Color(),
    smoke: new Color(),
    confetti: Array.from({ length: 6 }, () => new Color()),
  };
  let look = { flashAlpha: 0, smokeAlpha: 0, light: 0 };

  // Scratch objects (no allocation per frame)
  const matrix = new Matrix4();
  const position = new Vector3();
  const rotation = new Quaternion();
  const turn = new Quaternion();
  const scale = new Vector3();
  const colour = new Color();
  const xAxis = new Vector3(1, 0, 0);
  const zAxis = new Vector3(0, 0, 1);
  const axis = new Vector3();
  const facing = new Quaternion().setFromAxisAngle(xAxis, TILT); // screen-parallel (as the slash)
  const state = createParticleState();
  const flashAt = { diameter: 0, alpha: 0 };
  const push = { x: 0, y: 0 };
  const at = { x: 0, y: 0, z: 0 };
  // What the dev probe reads (fxState); plain assignments per frame, the object is built in state().
  let probeChain: readonly MineStep[] = NO_CHAIN;
  let probeElapsed = 0;
  let probeShake = 0;

  /** A screen-facing quad at (x, y, z), turned by `angle` in the screen plane. */
  function billboard(x: number, y: number, z: number, angle: number, w: number, h: number) {
    rotation.copy(facing).multiply(turn.setFromAxisAngle(zAxis, angle));
    return matrix.compose(position.set(x, y, z), rotation, scale.set(w, h, 1));
  }

  function hideAll() {
    bloom.visible = false;
    ring.visible = false;
    light.intensity = 0;
    batches.forEach((batch) => batch.clear());
    probeChain = NO_CHAIN;
    probeElapsed = 0;
    probeShake = 0;
  }
  // Visible until the scene's compile pass (renderer.compile walks visible objects only), then
  // the scene calls `rest()`.
  bloom.frustumCulled = false; // their geometry and position change per frame
  ring.frustumCulled = false;

  // --- Explosion (AC1) -------------------------------------------------------------------

  function explosion(t: SceneTransition, exploded: number): SceneEffect {
    const { board, next, now: start, level: spawnLevel } = t;
    const cells = board.rows * board.cols;
    const fxScale = effectScale(cells, spawnLevel);
    const mines: number[] = [];
    for (let i = 0; i < cells; i++) if (cellView(next, i).kind === 'mine') mines.push(i);
    const chain = mineChain(exploded, mines, board.cols, spawnLevel);
    const sites: ChainPuffSite[] = chain.map((step) => {
      const [x, y] = board.cellCentre(step.index);
      return [x, y, FX_LOSS.chain.startMs + step.delayMs];
    });
    const origin = board.cellCentre(exploded);
    const [ox, oy] = origin;
    const particles = spawnExplosion(effectSeed(next.id, exploded), origin, fxScale, sites);
    const cellPx = board.cellPx;
    // Push the view away from the mine (screen axes); straight up-right from the centre.
    const sv = screenV(oy);
    const length = Math.hypot(ox, sv);
    const direction: [number, number] =
      length > 0.5 ? [ox / length, sv / length] : [Math.SQRT1_2, Math.SQRT1_2];
    const shakeCap = Math.min(1, EFFECT_LIMITS.shakeMaxPx / (FX_LOSS.shake.amplitude * cellPx));
    const sparkWidth = Math.max(FX_LOSS.sparks.width, FX_LOSS.sparks.minWidthPx / cellPx);
    light.position.set(ox, oy, FX_LOSS.light.height);
    light.distance = FX_LOSS.light.reach * cellPx;
    const visible = (list: readonly Particle[], share: number) =>
      Math.min(list.length, Math.ceil(list.length * share));
    const M = FX_LOSS.smoke;
    const C = FX_LOSS.chain;
    const putSmoke = (
      list: readonly Particle[],
      from: number,
      to: number,
      elapsed: number,
      share: number,
    ) => {
      const count = visible(list, share);
      for (let i = 0; i < count; i++) {
        const p = list[i];
        if (!p || !particleAt(p, elapsed, state)) continue;
        const size = p.size * (from + (to - from) * easeOut(state.age));
        const envelope =
          state.age < M.peakAt ? state.age / M.peakAt : 1 - (state.age - M.peakAt) / (1 - M.peakAt);
        smoke.put(
          billboard(state.x, state.y, state.z, state.angle, size, size),
          colours.smoke,
          look.smokeAlpha * clamp01(envelope),
        );
      }
    };

    return {
      update(now: number, frame: EffectFrame) {
        const elapsed = now - start;
        if (elapsed >= FX_GENERAL.lossEndMs) return false;
        const share = levelShare(spawnLevel, frame.level);

        const flash = bloomAt(elapsed, cellPx, flashAt);
        bloom.visible = flash.alpha > 0;
        if (bloom.visible) {
          bloom.position.set(ox, oy, FX_LOSS.bloom.z);
          bloom.quaternion.copy(facing);
          bloom.scale.set(flash.diameter, flash.diameter, 1);
          bloomMaterial.opacity = flash.alpha * look.flashAlpha;
        }
        light.intensity =
          fxScale.light && frame.level === 0 ? look.light * Math.PI * flashLightAt(elapsed) : 0;

        shakeAt(elapsed, direction, push);
        frame.shake.x += push.x * shakeCap;
        frame.shake.y += push.y * shakeCap;

        const R = FX_LOSS.ring;
        ring.visible = elapsed < R.durationMs;
        if (ring.visible) {
          const p = elapsed / R.durationMs;
          const radius = R.radiusFrom + (R.radiusTo - R.radiusFrom) * easeOut(p);
          const width = R.widthFrom + (R.widthTo - R.widthFrom) * p;
          setRing(ring.geometry, Math.max(0, radius - width / 2), radius + width / 2);
          ring.position.set(ox, oy, R.z);
          ringMaterial.opacity = R.opacity * (1 - p);
        }

        // Smoke and chain puffs
        smoke.begin();
        putSmoke(particles.smoke, M.sizeFrom, M.sizeTo, elapsed, share);
        putSmoke(particles.puffs, C.puffSizeFrom, C.puffSizeTo, elapsed, share);
        smoke.end();

        // Fire puffs, then sparks on top
        const F = FX_LOSS.fire;
        const S = FX_LOSS.sparks;
        fire.begin();
        const fireCount = visible(particles.fire, share);
        for (let i = 0; i < fireCount; i++) {
          const p = particles.fire[i];
          if (!p || !particleAt(p, elapsed, state)) continue;
          const size = p.size * (F.sizeFrom + (F.sizeTo - F.sizeFrom) * easeOut(state.age));
          const age = state.age;
          if (age < F.mid) colour.copy(colours.core).lerp(colours.mid, age / F.mid);
          else if (age < F.edge)
            colour.copy(colours.mid).lerp(colours.edge, (age - F.mid) / (F.edge - F.mid));
          else colour.copy(colours.edge);
          const alpha = age < F.fadeFrom ? 1 : 1 - (age - F.fadeFrom) / (1 - F.fadeFrom);
          fire.put(billboard(state.x, state.y, state.z, state.angle, size, size), colour, alpha);
        }
        const sparkCount = visible(particles.sparks, share);
        for (let i = 0; i < sparkCount; i++) {
          const p = particles.sparks[i];
          if (!p || !particleAt(p, elapsed, state)) continue;
          const vu = velocityAt(p, 0, elapsed);
          const vv =
            velocityAt(p, 1, elapsed) * Math.cos(TILT) + velocityAt(p, 2, elapsed) * Math.sin(TILT);
          const shrink =
            state.age < S.shrinkFrom ? 1 : 1 - (state.age - S.shrinkFrom) / (1 - S.shrinkFrom);
          colour.copy(colours.core).lerp(colours.mid, state.age);
          fire.put(
            billboard(
              state.x,
              state.y,
              state.z,
              Math.atan2(vv, vu),
              S.length * p.size * shrink,
              sparkWidth * shrink,
            ),
            colour,
          );
        }
        fire.end();

        // Shards
        const D = FX_LOSS.shards;
        shards.begin();
        const shardCount = visible(particles.shards, share);
        for (let i = 0; i < shardCount; i++) {
          const p = particles.shards[i];
          if (!p || !particleAt(p, elapsed, state)) continue;
          const out = clamp01((p.life - (elapsed - p.born)) / D.scaleOutMs);
          axis.set(Math.cos(p.twist), Math.sin(p.twist), 0.4).normalize();
          rotation.setFromAxisAngle(axis, state.angle);
          matrix.compose(
            position.set(state.x, state.y, state.z),
            rotation,
            scale.setScalar(p.size * out),
          );
          shards.put(matrix, WHITE); // tinted by the material colour
        }
        shards.end();

        probeChain = chain;
        probeElapsed = elapsed;
        probeShake = Math.hypot(push.x, push.y) * shakeCap;
        return true;
      },
      dispose: hideAll,
    };
  }

  // --- Confetti (AC2) ----------------------------------------------------------------------

  function celebration(t: SceneTransition): SceneEffect {
    const { board, next, now: start, level: spawnLevel } = t;
    const window = board.visibleWindow();
    const pieces = spawnConfetti(
      effectSeed(next.id, t.origin ?? 0),
      window,
      effectScale(board.rows * board.cols, spawnLevel),
    );
    const floor = screenV(window.bottom) - FX_WIN.end.below;
    const cellPx = board.cellPx;
    const P = FX_WIN.piece;
    const minSize = [
      [Math.max(P.rect[0], P.rectMinPx[0] / cellPx), Math.max(P.rect[1], P.rectMinPx[1] / cellPx)],
      [Math.max(P.dot, P.dotMinPx / cellPx), Math.max(P.dot, P.dotMinPx / cellPx)],
      [
        Math.max(P.ribbon[0], P.ribbonMinPx[0] / cellPx),
        Math.max(P.ribbon[1], P.ribbonMinPx[1] / cellPx),
      ],
    ] as const;

    return {
      update(now: number, frame: EffectFrame) {
        const elapsed = now - start;
        if (elapsed >= FX_GENERAL.winEndMs) return false;
        const count = Math.ceil(pieces.length * levelShare(spawnLevel, frame.level));
        const fade = confettiFade(elapsed);
        for (let b = 0; b < confetti.length; b++) confetti[b]?.begin();
        for (let i = 0; i < count && fade > 0; i++) {
          const p = pieces[i];
          if (!p || !particleAt(p, elapsed, state) || state.y < floor) continue;
          screenToScene(state.x, state.y, state.z, at);
          const size = minSize[p.shape];
          const w = size[0];
          const h = size[1];
          rotation
            .copy(facing)
            .multiply(turn.setFromAxisAngle(zAxis, p.phase + 2 * Math.PI * p.tumble * state.t))
            .multiply(turn.setFromAxisAngle(xAxis, state.angle)); // spin about the long axis
          matrix.compose(
            position.set(at.x, at.y, at.z),
            rotation,
            scale.set(w * fade, h * fade, 1),
          );
          confetti[p.shape].put(matrix, colours.confetti[p.colour] ?? colour);
        }
        for (let b = 0; b < confetti.length; b++) confetti[b]?.end();
        probeChain = NO_CHAIN;
        probeShake = 0;
        return true;
      },
      dispose: hideAll,
    };
  }

  const hook: TransitionHook = (t, effects) => {
    if (t.reducedMotion || !t.active || t.prev === null) return;
    if (t.prev.id !== t.next.id || isEnded(t.prev) || !isEnded(t.next)) return;
    if (t.next.phase === 'lost' && t.next.explodedIndex !== null) {
      effects.add(explosion(t, t.next.explodedIndex));
    } else if (t.next.phase === 'won') {
      effects.add(celebration(t));
    }
  };

  return {
    hook,
    rest: hideAll,
    applyPalette(palette) {
      const c = palette.colours;
      colours.flash.set(c.fxFlash);
      colours.core.set(c.fxFireCore);
      colours.mid.set(c.fxFireMid);
      colours.edge.set(c.fxFireEdge);
      colours.smoke.set(c.fxSmoke);
      const keys = [
        'confetti1',
        'confetti2',
        'confetti3',
        'confetti4',
        'confetti5',
        'confetti6',
      ] as const;
      keys.forEach((key, i) => colours.confetti[i]?.set(c[key]));
      bloomMaterial.color.copy(colours.flash);
      ringMaterial.color.copy(colours.smoke);
      shardMaterial.color.set(c.tileTop);
      light.color.copy(colours.flash);
      look = {
        flashAlpha: palette.look.fxFlashAlpha,
        smokeAlpha: palette.look.fxSmokeAlpha,
        light: palette.look.fxLightIntensity,
      };
      // Additive fire only shows on dark surfaces; on light ones it would clip to white.
      const floor = colour.set(c.revealedTop);
      const luminance = 0.2126 * floor.r + 0.7152 * floor.g + 0.0722 * floor.b; // linear
      const blending = luminance < DARK_SURFACE ? AdditiveBlending : NormalBlending;
      fireMaterial.blending = blending;
      bloomMaterial.blending = blending;
    },
    state() {
      // Probe only (dev): built on demand from the last frame, nothing of it runs per frame.
      let minesPending = 0;
      for (const step of probeChain) {
        if (FX_LOSS.chain.startMs + step.delayMs > probeElapsed) minesPending++;
      }
      return {
        particles:
          batches.reduce((sum, batch) => sum + batch.count, 0) +
          (bloom.visible ? 1 : 0) +
          (ring.visible ? 1 : 0),
        shake: probeShake,
        flash: bloom.visible ? bloomMaterial.opacity : 0,
        minesPending,
      };
    },
    dispose() {
      hideAll();
      host.root.remove(bloom, ring, light, ...batches.map((batch) => batch.mesh));
      const materials = new Set<Material>([
        bloomMaterial,
        ringMaterial,
        smokeMaterial,
        fireMaterial,
        shardMaterial,
        confettiMaterial,
      ]);
      [bloom, ring].forEach((mesh) => mesh.geometry.dispose());
      batches.forEach((batch) => {
        batch.mesh.geometry.dispose();
        batch.mesh.dispose();
      });
      materials.forEach((material) => material.dispose());
      glow.dispose();
      light.dispose();
    },
  };
}
