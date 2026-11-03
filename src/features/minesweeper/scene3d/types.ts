// Types of the 3D scene (story 009, ADR 0005). Main-chunk code imports them with `import type`;
// the only value export is SCENE3D_UNAVAILABLE. three-free.
import type { GameState } from '../logic/types.ts';

/** What Board needs. Non-null only while the 3D scene is ready and shown. */
export interface BoardSceneHandle {
  /** Moves the canvas into `host` and starts driving `grid`'s inline transform and margins. */
  attach(host: HTMLElement, grid: HTMLElement): void;
  /** Removes the canvas, clears the inline transform/margins, stops the loop. */
  detach(): void;
  /** New game state; `origin` = index of the last revealed-by-input cell (wave start) or null. */
  update(game: GameState, origin: number | null): void;
  /** Touch long-press feedback (`useBoardInput.pressedIndex`). */
  setPressed(index: number | null): void;
}

export interface SceneMotion {
  readonly reducedMotion: boolean;
  /** false: no rendering at all (forced colours). */
  readonly active: boolean;
}

export interface BoardSceneController extends BoardSceneHandle {
  setPalette(palette: ScenePalette): void;
  /** reducedMotion: no sway, no animations. active false: no rendering at all (forced colours). */
  setMotion(motion: SceneMotion): void;
  /** Removes the context-lost listener first, then disposes GPU resources. Idempotent. */
  dispose(): void;
}

export interface CreateBoardSceneOptions {
  readonly palette: ScenePalette;
  readonly reducedMotion: boolean;
  readonly onContextLost: () => void;
}

/**
 * `error.name` of what createBoardScene throws when no WebGL2 context can be created (→ "unavailable").
 * The class itself lives in createBoardScene.ts; the hook compares the name, because importing the
 * class value would pull the lazy module into the main chunk.
 */
export const SCENE3D_UNAVAILABLE = 'Scene3dUnavailableError';

/** Everything the scene reads from tokens.css (UX §3.2): colours and unitless look numbers. */
export interface ScenePalette {
  readonly colours: Readonly<Record<SceneColour, string>>; // '#rrggbb'
  readonly look: SceneLook;
}

/** Unitless, scheme-dependent numbers (`parseFloat` of `--scene-*` tokens; UX §3.2, §14.1). */
export interface SceneLook {
  readonly keyIntensity: number; // --scene-key-intensity (× π in r187 physical units)
  readonly fillIntensity: number; // --scene-fill-intensity (× π)
  readonly shadowStrength: number; // --scene-shadow-strength → light.shadow.intensity
  readonly gloss: number; // --scene-gloss → clearcoat of hidden tiles
  readonly envIntensity: number; // --scene-env-intensity → hidden tiles only
}

export type SceneColour =
  | 'table' // --scene-table
  | 'slab' // --scene-slab
  | 'tileTop' // --scene-tile-top
  | 'revealedTop' // --scene-revealed-top (equals --cell-revealed-fill)
  | 'explodedTop' // --color-danger-bg
  | 'keyLight' // --scene-key
  | 'fillSky' // --scene-fill-sky
  | 'fillGround' // --scene-fill-ground
  | 'flag' // --color-danger-solid
  | 'pole' // --color-text
  | 'mineLit' // --scene-mine-lit
  | 'mineShade' // --scene-mine-shade
  | 'exploded' // --color-danger-solid (disc and ring)
  | 'explodedGlyph' // --color-on-danger-solid
  | 'slash' // --color-text
  | 'n1'
  | 'n2'
  | 'n3'
  | 'n4'
  | 'n5'
  | 'n6'
  | 'n7'
  | 'n8';

/** Seam for story 010. */
export interface SceneEffect {
  /** Advances the effect; returns false when it has ended (it is then disposed). */
  update(nowMs: number): boolean;
  dispose(): void;
}

export interface EffectHost {
  /** Root group the effect adds its objects to (three's Object3D; typed `unknown` here to keep three out of main-chunk types). */
  readonly root: unknown;
  add(effect: SceneEffect): void;
  /** Ends every effect at once (new game, 010 AC1/AC2). */
  clear(): void;
}

export interface SceneTransition {
  readonly prev: GameState | null;
  readonly next: GameState;
  readonly origin: number | null;
  readonly reducedMotion: boolean;
}

export type TransitionHook = (transition: SceneTransition, effects: EffectHost) => void;

/**
 * Dev-only e2e probe (`window.__board3dProbe`, installed only when
 * `import.meta.env.DEV && import.meta.env.MODE === 'e2e'`): scene time, sway and pixel reads.
 */
export interface Board3dProbe {
  /** Manual scene clock from now on: no frame loop; each render request renders synchronously at the frozen time. Sway phase restarts at 0. */
  pause(): void;
  /** true: the sway stays at phase 0 while time advances (for animation checks). */
  holdSway(hold: boolean): void;
  /** Moves the scene clock forward and renders one frame synchronously. */
  advance(ms: number): void;
  /** Viewport CSS px of a point given in cell units relative to the centre of the cell's top face (dz up). */
  project(
    index: number,
    offset?: readonly [dx: number, dy: number, dz: number],
  ): { x: number; y: number };
  /** Renders a frame at the current time and reads RGB at viewport CSS px points (DPR-corrected, y-flipped). */
  pixels(points: readonly { x: number; y: number }[]): [r: number, g: number, b: number][];
  /** Scene frames rendered since creation (fps script). */
  readonly frames: number;
  /** Current quality level (fps script). */
  readonly level: number;
  /** The WebGL renderer string (fps script: must be a GPU, not SwiftShader). */
  readonly renderer: string;
}
