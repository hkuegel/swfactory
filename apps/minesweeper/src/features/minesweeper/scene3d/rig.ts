import type { Camera, DirectionalLight, HemisphereLight, Scene, WebGLRenderer } from 'three';
import type { EffectRunner } from './effects.ts';
import type { StageLayout } from './geometry.ts';
import type { SceneMeshes } from './meshes.ts';
import type { QualityLevel } from './timeline.ts';
import type { RigState, ScenePalette, TransitionHook } from './types.ts';

/**
 * The seams the cinematic view (story 050) plugs into the board scene of createBoardScene.ts:
 * a different camera (a pose that moves, with the overlay following it), a post-processing
 * pipeline, a set around the board and its own transition hook. The "3D" view passes no rig and
 * runs exactly the code it ran before. Types only: the module that builds a rig is a lazy chunk.
 */

export interface RigContext {
  readonly renderer: WebGLRenderer;
  readonly scene: Scene;
  readonly camera: Camera;
  readonly meshes: SceneMeshes;
  readonly effects: EffectRunner;
  readonly key: DirectionalLight;
  readonly fill: HemisphereLight;
}

export interface SceneRig {
  /** Camera moves and end effects; runs after the board's own transition hooks. */
  readonly hook: TransitionHook;
  /** Longest reveal wave of this view in ms (AC4: at most 600). */
  readonly waveTotalMs: number;
  /** Direction towards the key light (unit or not), z up: the low sun or the moon. */
  readonly keyDirection: readonly [x: number, y: number, z: number];
  /**
   * The stage box for a grid of this size (`cell` = the cell width in CSS px); remembers the grid
   * size for the camera.
   */
  stageLayout(gridWidth: number, gridHeight: number, rim: number, cell: number): StageLayout;
  /** The overlay grid's inline transform at scene time `now` (idle sway in degrees). */
  overlayTransform(swayDeg: number, now: number): string;
  /** The camera's world matrix (column-major) at scene time `now`. */
  cameraMatrix(swayDeg: number, now: number): number[];
  /** The canvas size in CSS px and its pixel ratio changed. */
  setSize(width: number, height: number, pixelRatio: number): void;
  /** Quality step of the governor and the board's cell count. */
  setQuality(level: QualityLevel, cells: number): void;
  /** The motion settings changed (reduced motion, forced colours): idle motion of the rig stops. */
  setMotion(reducedMotion: boolean, active: boolean): void;
  applyPalette(palette: ScenePalette): void;
  /** One frame: replaces `renderer.render(scene, camera)`. */
  render(): void;
  /** A camera move runs: the loop must keep going. */
  moving(now: number): boolean;
  /** Tiles move without a cell animation (the shockwave): instances must be rewritten. */
  boardMoving(now: number): boolean;
  /** Extra lift of a covered tile at (x, y) in cells (the shockwave). */
  liftAt(x: number, y: number, now: number): number;
  /** Ends every move and effect of the rig at once (a new game, a hidden tab, reduced motion). */
  finish(): void;
  /** Compiles what the first frame needs (post-processing passes). */
  warm(): void;
  /** Dev-only probe state of the last frame. */
  state(now: number): RigState;
  dispose(): void;
}

export type SceneRigFactory = (context: RigContext) => SceneRig;
