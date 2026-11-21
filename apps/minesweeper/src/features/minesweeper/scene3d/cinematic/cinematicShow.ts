import type { PointLight } from 'three';
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  IcosahedronGeometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NormalBlending,
  PlaneGeometry,
  Quaternion,
  RingGeometry,
  Vector3,
} from 'three';
import { effectScale, effectSeed, levelShare, rng } from '../endPlan.ts';
import { Batch, glowTexture, withInstanceAlpha } from '../endEffects.ts';
import type { EffectRunner } from '../effects.ts';
import { HIDDEN_TOP, REVEALED_TOP } from '../sceneLayout.ts';
import type { CellAnim } from '../timeline.ts';
import type { EffectFrame, SceneEffect, ScenePalette, SceneTransition } from '../types.ts';
import { REST_POSE } from './cameraPose.ts';
import {
  burstPeaks,
  FIREWORKS,
  FIREWORKS_END_MS,
  flashAt,
  planFireworks,
  sparkAt,
  type Burst,
} from './fireworksPlan.ts';
import { debrisAt, planDebris, SHOCK, shockEndMs, shockLift, shockRadius } from './lossPlan.ts';

/**
 * The end effects the cinematic view adds to story 010's explosion (story 050, AC5): on a loss a
 * shockwave with a ring of light, a flash of light on the board and flying debris; on a win
 * fireworks with a coloured light over the board. Everything is built at creation (count 0,
 * hidden) so the first game end compiles nothing, and every effect is a closed-form function of
 * the scene time. Nothing here is read by the game or the DOM.
 */

export interface ShowState {
  readonly shockwave: boolean;
  readonly fireworks: {
    readonly running: boolean;
    readonly bursts: number;
    readonly sparks: number;
  };
  readonly debris: number;
  readonly flashesLastSecond: number;
}

export interface CinematicShow {
  /** Starts the loss extras or the fireworks for the transition that ends a game. */
  start(transition: SceneTransition): void;
  /** Dust and flying earth where the ground is dug out, a flag planted or pulled (AC4). */
  dig(transition: SceneTransition): void;
  applyPalette(palette: ScenePalette): void;
  /** Hides every object; call after `renderer.compile` (which needs them visible). */
  rest(): void;
  /** Extra lift of a covered tile at (x, y) cells, the shockwave. */
  liftAt(x: number, y: number, now: number): number;
  boardMoving(now: number): boolean;
  state(now: number): ShowState;
  dispose(): void;
}

/** Relative luminance of the revealed top below which sparks blend additively (as story 010). */
const DARK_SURFACE = 0.2;
const WHITE = new Color(1, 1, 1);
const FACING = new Quaternion().setFromAxisAngle(
  new Vector3(1, 0, 0),
  (REST_POSE.tilt * Math.PI) / 180,
);
const GLOW_CAPACITY = 900;
const LOSS_EXTRAS_MS = 1600;
/** HDR gain of the ring and the sparks on a dark surface: the bloom turns it into light. */
const RING_GAIN = 2.4;
const SPARK_GAIN = 0.55;
const DUST_CAPACITY = 1000;
const CLOD_CAPACITY = 320;
/** Dust of a dug cell starts this long after its animation and ends with it (AC4: 600 ms). */
const DUST_DELAY_MS = 40;
const MOTES = { count: 54, min: 18, lifeMs: 3300 } as const;

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** `burstLight`: a point light the scene already holds (adding one later would recompile). */
export function createCinematicShow(host: EffectRunner, burstLight: PointLight): CinematicShow {
  const glow = glowTexture();
  const unlit = (options: ConstructorParameters<typeof MeshBasicMaterial>[0] = {}) =>
    new MeshBasicMaterial({ toneMapped: false, ...options });

  // Shock ring: a thin ring on the board, scaled to the radius of the front.
  const ringMaterial = unlit({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
    side: DoubleSide,
  });
  const ring = new Mesh(new RingGeometry(0.94, 1, 128), ringMaterial);
  ring.renderOrder = 19;
  ring.frustumCulled = false;

  // Debris: clods of earth, tufts of turf and stones, tinted per piece.
  const debrisMaterial = new MeshStandardMaterial({ roughness: 0.95, metalness: 0 });
  const debris = new Batch(new IcosahedronGeometry(0.5, 0), debrisMaterial, 64, false);
  // Dust of the digging (normal blending: it must show on the bright lawn too) and small clods.
  const dustMaterial = withInstanceAlpha(
    unlit({ map: glow, transparent: true, depthWrite: false }),
    'cinematic-dust',
  );
  const dust = new Batch(new PlaneGeometry(1, 1), dustMaterial, DUST_CAPACITY, true);
  dust.mesh.renderOrder = 21;
  const clodMaterial = new MeshStandardMaterial({ roughness: 1 });
  const clods = new Batch(new IcosahedronGeometry(0.5, 0), clodMaterial, CLOD_CAPACITY, false);

  // Sparks, rockets and flashes of the fireworks: one batch of glows.
  const sparkMaterial = withInstanceAlpha(
    unlit({ map: glow, transparent: true, depthWrite: false, blending: AdditiveBlending }),
    'cinematic-spark',
  );
  const sparks = new Batch(new PlaneGeometry(1, 1), sparkMaterial, GLOW_CAPACITY, true);
  sparks.mesh.renderOrder = 23;

  host.root.add(ring, debris.mesh, sparks.mesh, dust.mesh, clods.mesh);

  const colours = {
    flash: new Color(),
    confetti: Array.from({ length: 6 }, () => new Color()),
    dust: new Color(),
    pieces: Array.from({ length: 3 }, () => new Color()),
    mote: new Color(),
  };
  let additive = true;

  const matrix = new Matrix4();
  const position = new Vector3();
  const rotation = new Quaternion();
  const turn = new Quaternion();
  const scale = new Vector3();
  const colour = new Color();
  const axis = new Vector3();
  const zAxis = new Vector3(0, 0, 1);
  const offset = { x: 0, y: 0, z: 0, scale: 1, angle: 0, age: 0 };

  // Probe and shockwave state: plain fields, written by the effects.
  const ripple = { active: false, x: 0, y: 0, start: 0, end: 0 };
  let flashTimes: number[] = [];
  let probeBursts = 0;
  let probeFireworks = false;

  function billboard(x: number, y: number, z: number, size: number, angle = 0) {
    rotation.copy(FACING).multiply(turn.setFromAxisAngle(zAxis, angle));
    return matrix.compose(position.set(x, y, z), rotation, scale.set(size, size, 1));
  }

  // The dig manager: one effect for every dug cell, so two clicks within 600 ms share the batches.
  interface DigItem {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly start: number;
    readonly end: number;
    readonly size: number;
    readonly clods: number;
    readonly seed: number;
  }
  const digItems: DigItem[] = [];
  let digging = false;

  function hideAll() {
    ring.visible = false;
    debris.clear();
    sparks.clear();
    dust.clear();
    clods.clear();
    digItems.length = 0;
    digging = false;
    burstLight.intensity = 0;
    ripple.active = false;
    probeFireworks = false;
    probeBursts = 0;
    flashTimes = [];
  }
  ring.frustumCulled = false;

  // --- A lost game: shockwave, debris, flash of light ------------------------------------------

  function lossExtras(t: SceneTransition, exploded: number): SceneEffect {
    const { board, next, now: start, level: spawnLevel } = t;
    const [ox, oy] = board.cellCentre(exploded);
    const cells = board.rows * board.cols;
    const fxScale = effectScale(cells, spawnLevel);
    const pieces = planDebris(effectSeed(next.id, exploded), fxScale.sparks);
    let far = 0;
    for (const corner of [0, board.cols - 1, (board.rows - 1) * board.cols, cells - 1]) {
      const [cx, cy] = board.cellCentre(corner);
      far = Math.max(far, Math.hypot(cx - ox, cy - oy));
    }
    const end = shockEndMs(far);
    ripple.active = true;
    ripple.x = ox;
    ripple.y = oy;
    ripple.start = start;
    ripple.end = start + end;
    flashTimes.push(start);
    burstLight.position.set(ox, oy, 1.4);
    burstLight.distance = 14 * board.cellPx;
    burstLight.color.copy(colours.flash);

    return {
      update(now: number, frame: EffectFrame) {
        const elapsed = now - start;
        if (elapsed >= LOSS_EXTRAS_MS) return false;

        ring.visible = elapsed < end;
        if (ring.visible) {
          const p = elapsed / end;
          const radius = Math.max(0.2, shockRadius(elapsed));
          ring.position.set(ox, oy, SHOCK.ringZ);
          ring.scale.set(radius, radius, 1);
          ringMaterial.color.copy(colours.flash).multiplyScalar(additive ? RING_GAIN : 1);
          ringMaterial.opacity = (additive ? 0.85 : 0.5) * (1 - p) ** 1.5;
        }

        // One flash of light on the board, over in 450 ms.
        const flash = elapsed < 30 ? elapsed / 30 : Math.exp(-(elapsed - 30) / 140);
        burstLight.intensity =
          fxScale.light && frame.level === 0 && elapsed < 450 ? Math.PI * 1.5 * flash : 0;

        const share = levelShare(spawnLevel, frame.level);
        debris.begin();
        const count = Math.ceil(pieces.length * share);
        for (let i = 0; i < count; i++) {
          const piece = pieces[i];
          if (!piece || !debrisAt(piece, elapsed, offset)) continue;
          axis.set(piece.axis[0], piece.axis[1], piece.axis[2]).normalize();
          rotation.setFromAxisAngle(axis, offset.angle);
          matrix.compose(
            position.set(ox + offset.x, oy + offset.y, offset.z),
            rotation,
            scale.setScalar(piece.size * offset.scale),
          );
          debris.put(matrix, colours.pieces[i % 3] ?? WHITE);
        }
        debris.end();
        return true;
      },
      dispose() {
        ring.visible = false;
        debris.clear();
        burstLight.intensity = 0;
        ripple.active = false;
      },
    };
  }

  // --- A won game: fireworks --------------------------------------------------------------------

  function fireworks(t: SceneTransition): SceneEffect {
    const { board, next, now: start, level: spawnLevel } = t;
    const share = effectScale(board.rows * board.cols, spawnLevel).sparks;
    const bursts: Burst[] = planFireworks(
      effectSeed(next.id, t.origin ?? 0),
      board.visibleWindow(),
      share,
    );
    for (const at of burstPeaks(bursts)) flashTimes.push(start + at);
    probeFireworks = true;
    burstLight.distance = 18 * board.cellPx;
    // Motes (fireflies at night, pollen by day): they rise and drift slowly over the field and fade in
    // and out smoothly, so they add life without adding flashes.
    const window = board.visibleWindow();
    const motes = Math.max(MOTES.min, Math.round(MOTES.count * Math.min(1, share)));
    const mote = rng(effectSeed(next.id, 7));
    const moteData = Array.from({ length: motes }, () => ({
      x: window.left + (window.right - window.left) * mote(),
      y: window.bottom + (window.top - window.bottom) * mote(),
      phase: mote() * 6.28,
      rise: 0.5 + mote(),
      size: 0.12 + 0.1 * mote(),
      born: 400 * mote(),
    }));

    return {
      update(now: number, frame: EffectFrame) {
        const elapsed = now - start;
        if (elapsed >= FIREWORKS_END_MS) return false;
        const live = levelShare(spawnLevel, frame.level);
        const gain = additive ? SPARK_GAIN : 1;
        sparks.begin();
        for (const m of moteData) {
          const age = (elapsed - m.born) / (MOTES.lifeMs - 400);
          if (age <= 0 || age >= 1) continue;
          const fade = Math.sin(Math.PI * age) ** 1.4;
          colour.copy(colours.mote).multiplyScalar(additive ? 0.8 : 1);
          sparks.put(
            billboard(
              m.x + 0.35 * Math.sin(elapsed / 650 + m.phase),
              m.y + 0.2 * Math.cos(elapsed / 800 + m.phase * 1.3),
              HIDDEN_TOP + 0.3 + 3 * age * m.rise,
              m.size,
            ),
            colour,
            0.85 * fade,
          );
        }
        let launched = 0;
        let light = 0;
        let lightAt: Burst | null = null;
        for (const burst of bursts) {
          if (elapsed >= burst.burstMs) launched++;
          const palette = colours.confetti[burst.colour] ?? colours.flash;

          // Rocket: rises on the board's vertical axis with a short tail.
          if (elapsed >= burst.launchMs && elapsed < burst.burstMs) {
            const p = (elapsed - burst.launchMs) / FIREWORKS.riseMs;
            for (let tail = 0; tail < 4; tail++) {
              const q = clamp01(p - tail * 0.05);
              const rise = 1 - (1 - q) ** 2;
              const z = HIDDEN_TOP + (burst.z - HIDDEN_TOP) * rise;
              colour.copy(palette).multiplyScalar(gain * (1 - tail * 0.2));
              sparks.put(
                billboard(burst.x, burst.y, z, 0.34 - tail * 0.05),
                colour,
                0.9 - tail * 0.18,
              );
            }
          }

          const since = elapsed - burst.burstMs;
          const bright = flashAt(since);
          if (bright > light) {
            light = bright;
            lightAt = burst;
          }
          if (bright > 0) {
            colour.copy(palette).multiplyScalar(gain);
            sparks.put(
              billboard(burst.x, burst.y, burst.z, 1.3 * bright + 0.7),
              colour,
              0.06 * bright,
            );
          }

          // Sparks with a short trail.
          const total = Math.ceil((burst.sparks.length / 4) * live);
          for (let i = 0; i < total; i++) {
            if (!sparkAt(burst, i, since, offset)) break;
            const size = 0.3 * (1 - 0.6 * offset.age);
            const alpha = 1 - offset.age ** 2;
            colour.copy(palette).multiplyScalar(gain * (1.15 - 0.5 * offset.age));
            sparks.put(
              billboard(burst.x + offset.x, burst.y + offset.y, burst.z + offset.z, size),
              colour,
              alpha,
            );
            const px = offset.x;
            const py = offset.y;
            const pz = offset.z;
            if (sparkAt(burst, i, since - 70, offset)) {
              colour.multiplyScalar(0.6);
              sparks.put(
                billboard(
                  burst.x + (px + offset.x) / 2,
                  burst.y + (py + offset.y) / 2,
                  burst.z + (pz + offset.z) / 2,
                  size * 0.55,
                ),
                colour,
                alpha * 0.6,
              );
            }
          }
        }
        sparks.end();
        probeBursts = launched;
        // The light of the newest flash tints the board.
        if (lightAt && frame.level === 0 && share >= 0.5) {
          burstLight.position.set(lightAt.x, lightAt.y, lightAt.z * 0.6);
          burstLight.color.copy(colours.confetti[lightAt.colour] ?? colours.flash);
          burstLight.intensity = Math.PI * 0.25 * light;
        } else {
          burstLight.intensity = 0;
        }
        return true;
      },
      dispose() {
        sparks.clear();
        burstLight.intensity = 0;
        probeFireworks = false;
      },
    };
  }

  // --- Digging: dust and clods where the ground opens, a flag goes in or comes out ----------------

  const DUST_UP = 0.4;
  const hash = (n: number) => {
    const v = Math.sin(n * 12.9898) * 43758.5453;
    return v - Math.floor(v);
  };

  const digEffect: SceneEffect = {
    update(now: number, frame: EffectFrame) {
      let alive = false;
      dust.begin();
      clods.begin();
      const every = frame.level === 2 ? 2 : 1;
      for (let i = 0; i < digItems.length; i++) {
        const item = digItems[i];
        if (!item || now >= item.end) continue;
        alive = true;
        if (i % every !== 0) continue;
        const span = item.end - item.start - DUST_DELAY_MS;
        const p = clamp01((now - item.start - DUST_DELAY_MS) / span);
        if (now < item.start + DUST_DELAY_MS) continue;
        const rise = 1 - (1 - p) ** 2;
        const size = item.size * (0.5 + 1.1 * rise);
        dust.put(
          billboard(item.x, item.y, item.z + 0.08 + DUST_UP * rise, size),
          colours.dust,
          0.6 * (1 - p) ** 1.4,
        );
        for (let k = 0; k < item.clods; k++) {
          const a = (item.seed + k * 2.3) * 1.7;
          const speed = 0.8 + 1.6 * hash(item.seed * 3 + k);
          const t = ((now - item.start - DUST_DELAY_MS) / 1000) * (0.8 + 0.4 * hash(k + item.seed));
          const z = item.z + 0.04 + 3.4 * t - 0.5 * 26 * t * t;
          if (z < item.z && t > 0.02) continue;
          const out = clamp01((1 - p) * 4);
          const piece = 0.07 + 0.07 * hash(item.seed + k * 5);
          rotation.setFromAxisAngle(axis.set(Math.cos(a), Math.sin(a), 0.5).normalize(), t * 12);
          matrix.compose(
            position.set(item.x + Math.cos(a) * speed * t, item.y + Math.sin(a) * speed * t, z),
            rotation,
            scale.setScalar(piece * out),
          );
          clods.put(matrix, colours.pieces[(k + item.seed) % 3] ?? WHITE);
        }
      }
      dust.end();
      clods.end();
      if (!alive) {
        digItems.length = 0;
        digging = false;
      }
      return alive;
    },
    dispose() {
      dust.clear();
      clods.clear();
      digItems.length = 0;
      digging = false;
    },
  };

  function addDig(t: SceneTransition, anims: readonly CellAnim[]) {
    let clodBudget = 140;
    for (const anim of anims) {
      if (anim.kind !== 'reveal' && anim.kind !== 'plant' && anim.kind !== 'unplant') continue;
      if (digItems.length >= DUST_CAPACITY) break;
      const [x, y] = t.board.cellCentre(anim.index);
      const reveal = anim.kind === 'reveal';
      const wantClods = reveal && clodBudget > 0 && anim.duration > 0 ? 2 : 0;
      clodBudget -= wantClods;
      digItems.push({
        x,
        y,
        z: reveal ? REVEALED_TOP : HIDDEN_TOP,
        start: anim.start,
        end: anim.start + anim.duration,
        size: reveal ? 0.9 : 0.5,
        clods: wantClods,
        seed: anim.index + 1,
      });
    }
    if (digItems.length > 0 && !digging) {
      digging = true;
      host.add(digEffect);
    }
  }

  return {
    dig(t) {
      if (t.reducedMotion || !t.active || t.prev === null) return;
      addDig(t, t.anims);
    },

    start(t) {
      if (t.prev === null || t.reducedMotion || !t.active) return;
      const ended = t.next.phase === 'won' || t.next.phase === 'lost';
      const wasEnded = t.prev.phase === 'won' || t.prev.phase === 'lost';
      if (!ended || wasEnded || t.prev.id !== t.next.id) return;
      if (t.next.phase === 'lost' && t.next.explodedIndex !== null) {
        host.add(lossExtras(t, t.next.explodedIndex));
      } else if (t.next.phase === 'won') {
        host.add(fireworks(t));
      }
    },

    applyPalette(palette) {
      const c = palette.colours;
      colours.flash.set(c.fxFlash);
      (
        ['confetti1', 'confetti2', 'confetti3', 'confetti4', 'confetti5', 'confetti6'] as const
      ).forEach((key, i) => colours.confetti[i]?.set(c[key]));
      colours.pieces[0]?.set(c.dioSoil).multiplyScalar(1.4);
      colours.pieces[1]?.set(c.dioGrass).multiplyScalar(1.1);
      colours.pieces[2]?.set(c.dioClay);
      colours.dust.set(c.dioClay).lerp(colour.set(c.dioSkyLow), 0.35).multiplyScalar(1.15);
      colours.mote.set(c.dioLantern);
      const floor = colour.set(c.revealedTop);
      additive = 0.2126 * floor.r + 0.7152 * floor.g + 0.0722 * floor.b < DARK_SURFACE;
      const blending = additive ? AdditiveBlending : NormalBlending;
      sparkMaterial.blending = blending;
      ringMaterial.blending = blending;
      sparkMaterial.needsUpdate = true;
      ringMaterial.needsUpdate = true;
      if (!additive) colours.mote.setRGB(1, 0.93, 0.7);
    },

    rest: hideAll,

    liftAt(x, y, now) {
      if (!ripple.active || now >= ripple.end) return 0;
      return shockLift(Math.hypot(x - ripple.x, y - ripple.y), now - ripple.start);
    },

    boardMoving: (now) => ripple.active && now < ripple.end,

    state(now) {
      let recent = 0;
      for (const at of flashTimes) if (at <= now && at > now - 1000) recent++;
      return {
        shockwave: ripple.active && now < ripple.end,
        fireworks: {
          running: probeFireworks,
          bursts: probeBursts,
          sparks: probeFireworks ? sparks.count : 0,
        },
        debris: debris.count,
        flashesLastSecond: recent,
      };
    },

    dispose() {
      hideAll();
      host.root.remove(ring, debris.mesh, sparks.mesh, dust.mesh, clods.mesh);
      ring.geometry.dispose();
      ringMaterial.dispose();
      debris.mesh.geometry.dispose();
      debris.mesh.dispose();
      debrisMaterial.dispose();
      dust.mesh.geometry.dispose();
      dust.mesh.dispose();
      dustMaterial.dispose();
      clods.mesh.geometry.dispose();
      clods.mesh.dispose();
      clodMaterial.dispose();
      sparks.mesh.geometry.dispose();
      sparks.mesh.dispose();
      sparkMaterial.dispose();
      glow.dispose();
    },
  };
}
