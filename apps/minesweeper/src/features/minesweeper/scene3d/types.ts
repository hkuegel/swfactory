// Types of the 3D scene (story 009, ADR 0005). Main-chunk code imports them with `import type`;
// the only value export is SCENE3D_UNAVAILABLE. three-free.
import type { GameState } from '../logic/types.ts';
import type { QualityLevel } from './timeline.ts';

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
  readonly fxFlashAlpha: number; // --scene-fx-flash-alpha: peak opacity of the loss bloom (story 010)
  readonly fxSmokeAlpha: number; // --scene-fx-smoke-alpha: peak opacity of the smoke
  readonly fxLightIntensity: number; // --scene-fx-light-intensity: flash point light (× π); 0 = none
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
  | 'n8'
  // Story 010 end effects
  | 'fxFlash' // --scene-fx-flash
  | 'fxFireCore' // --scene-fx-fire-core
  | 'fxFireMid' // --scene-fx-fire-mid
  | 'fxFireEdge' // --scene-fx-fire-edge
  | 'fxSmoke' // --scene-fx-smoke
  | 'confetti1' // --scene-confetti-1 … 6
  | 'confetti2'
  | 'confetti3'
  | 'confetti4'
  | 'confetti5'
  | 'confetti6';

/** Per-frame context the effect host gives every effect (story 010). */
export interface EffectFrame {
  /** Governor level of this frame: counts follow it mid-effect. */
  readonly level: QualityLevel;
  /** Out-parameter, zeroed by the host before each round: effects add their camera push (cells, screen axes). */
  readonly shake: { x: number; y: number };
}

/** Seam of story 009, used by story 010. */
export interface SceneEffect {
  /** Advances the effect; returns false when it has ended (it is then disposed). Allocation-free. */
  update(nowMs: number, frame: EffectFrame): boolean;
  /** Releases its slots in the shared meshes (count back to 0). */
  dispose(): void;
}

export interface EffectHost {
  /** Root group the effect adds its objects to (three's Object3D; typed `unknown` here to keep three out of main-chunk types). */
  readonly root: unknown;
  add(effect: SceneEffect): void;
  /** Ends every effect at once (new game, 010 AC1/AC2). */
  clear(): void;
}

/** Board part the player can see, in scene cells (x right, y towards the far row). */
export interface CellWindow {
  readonly left: number;
  readonly right: number;
  /** Near side. */
  readonly bottom: number;
  /** Far side. */
  readonly top: number;
}

export interface BoardGeometry {
  readonly rows: number;
  readonly cols: number;
  /** The DOM cell width in CSS px (1 scene unit). */
  readonly cellPx: number;
  /** Scene position of a cell's centre (the formula of writeInstances). */
  cellCentre(index: number): readonly [x: number, y: number];
  /** The scroller's visible part (UX §12), clamped to the board plus rim. Reads the DOM: call on demand. */
  visibleWindow(): CellWindow;
}

export interface SceneTransition {
  /** null after every attach(): no effect may start (story 010 AC3). */
  readonly prev: GameState | null;
  readonly next: GameState;
  readonly origin: number | null;
  readonly reducedMotion: boolean;
  /** false: canvas hidden (forced colours), nothing may start. */
  readonly active: boolean;
  /** Scene clock at update(): effect time 0. */
  readonly now: number;
  /** Governor level at the click. */
  readonly level: QualityLevel;
  readonly board: BoardGeometry;
}

export type TransitionHook = (transition: SceneTransition, effects: EffectHost) => void;

/** Dev-only probe view of the end effects (story 010). */
export interface FxState {
  /** Any end effect alive. */
  readonly running: boolean;
  /** Running cell animations (reveal, chain, marker, slash, shudder, hop). */
  readonly animating: number;
  /** Instances drawn by the effect meshes at the last frame. */
  readonly particles: number;
  /** |camera push| at the last frame, cells. */
  readonly shake: number;
  /** Bloom opacity at the last frame, 0..1. */
  readonly flash: number;
  /** Chain mines not yet flipped at the last frame. */
  readonly minesPending: number;
}

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
  /** End effects at the last frame (story 010). */
  readonly fxState: FxState;
  /** Renders a frame and returns the mean relative luminance 0..1 of the canvas or a viewport-px rect. */
  luminance(rect?: { x: number; y: number; width: number; height: number }): number;
}
