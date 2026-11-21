import { useCallback, useEffect, useReducer, useState } from 'react';
import type { BoardView } from './logic/boardView.ts';
import { supports3dView } from './logic/boardView.ts';
import {
  initialView3d,
  view3dReducer,
  type View3dNotice,
  type View3dStatus,
} from './logic/view3d.ts';
import type { createBoardScene } from './scene3d/createBoardScene.ts';
import type { createCinematicScene } from './scene3d/cinematic/createCinematicScene.ts';
import { readPalette } from './scene3d/palette.ts';
import {
  SCENE3D_UNAVAILABLE,
  type BoardSceneController,
  type BoardSceneHandle,
  type CreateBoardSceneOptions,
} from './scene3d/types.ts';

/** AC6: covers the chunk import and the controller creation. */
export const SCENE_LOAD_TIMEOUT_MS = 10_000;

/** The views that have a scene (story 050: "3D" and "Cinematic"). */
type SceneKind = Exclude<BoardView, '2d'>;
type SceneFactory = (options: CreateBoardSceneOptions) => BoardSceneController;

// Types only (erased): the values are reached through the dynamic import() calls below.
type SceneModule = { readonly createBoardScene: typeof createBoardScene };
type CinematicModule = { readonly createCinematicScene: typeof createCinematicScene };

/**
 * The lazy scene chunks (ADR 0005): the only references to createBoardScene.ts and
 * createCinematicScene.ts, never imported statically. Cached once loaded; a failure is not
 * cached, so the next choice retries. The cinematic chunk adds the post-processing code on top
 * of the shared three chunk, so "3D" never pays for it.
 */
let sceneModule: Promise<SceneModule> | null = null;
let cinematicModule: Promise<CinematicModule> | null = null;

function loadFactory(kind: SceneKind): Promise<SceneFactory> {
  if (kind === 'cinematic') {
    cinematicModule ??= import('./scene3d/cinematic/createCinematicScene.ts').catch(
      (error: unknown) => {
        cinematicModule = null;
        throw error;
      },
    );
    return cinematicModule.then((module) => module.createCinematicScene);
  }
  sceneModule ??= import('./scene3d/createBoardScene.ts').catch((error: unknown) => {
    sceneModule = null;
    throw error;
  });
  return sceneModule.then((module) => (options) => module.createBoardScene(options));
}

const getVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const DARK = '(prefers-color-scheme: dark)';
const FORCED_COLORS = '(forced-colors: active)';

function motionNow() {
  return {
    reducedMotion: window.matchMedia(REDUCED_MOTION).matches,
    active: !window.matchMedia(FORCED_COLORS).matches,
  };
}

/** Media queries pushed into a controller; disposal when it goes away or on unmount. */
function useControllerLifecycle(controller: BoardSceneController | null) {
  useEffect(() => {
    if (!controller) return;
    const queries = [REDUCED_MOTION, DARK, FORCED_COLORS].map((q) => window.matchMedia(q));
    const onMotion = () => controller.setMotion(motionNow());
    const onScheme = () => controller.setPalette(readPalette(getVar));
    onMotion();
    const [reduced, dark, forced] = queries;
    reduced?.addEventListener('change', onMotion);
    forced?.addEventListener('change', onMotion);
    dark?.addEventListener('change', onScheme);
    return () => {
      reduced?.removeEventListener('change', onMotion);
      forced?.removeEventListener('change', onMotion);
      dark?.removeEventListener('change', onScheme);
      controller.dispose();
    };
  }, [controller]);
}

/**
 * The 3D views (stories 009, 050): their state machine, the lazy load with a timeout and the scene
 * controllers' lifetime. A controller survives games and view switches; it is disposed when its
 * context is lost and on unmount (sign-out), so a new mount starts in 2D (008/AC8).
 */
export function useBoard3d(): {
  readonly requested: BoardView;
  readonly status: View3dStatus;
  readonly notice: View3dNotice;
  /** Non-null iff a 3D board ("3D" or "Cinematic") is shown. */
  readonly scene: BoardSceneHandle | null;
  readonly choose: (view: BoardView) => void;
} {
  const [state, dispatch] = useReducer(view3dReducer, undefined, () =>
    initialView3d(supports3dView()),
  );
  const [scene3d, setScene3d] = useState<BoardSceneController | null>(null);
  const [cinematic, setCinematic] = useState<BoardSceneController | null>(null);

  const choose = useCallback(
    (view: BoardView) => {
      const loaded = view === '3d' ? scene3d !== null : view === 'cinematic' && cinematic !== null;
      dispatch({ type: 'choose', view, loaded });
    },
    [scene3d, cinematic],
  );

  // Load attempt: import + create, bounded by the timeout; late results of a cancelled attempt
  // are dropped (the module stays cached for the next choice).
  const { status, attempt, requested } = state;
  useEffect(() => {
    if (status !== 'loading' || requested === '2d') return;
    const kind: SceneKind = requested;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      dispatch({ type: 'loadFailed', attempt });
    }, SCENE_LOAD_TIMEOUT_MS);
    loadFactory(kind).then(
      (factory) => {
        if (cancelled) return;
        window.clearTimeout(timer);
        let created: BoardSceneController;
        try {
          created = factory({
            palette: readPalette(getVar),
            reducedMotion: motionNow().reducedMotion,
            onContextLost: () => {
              created.dispose();
              (kind === '3d' ? setScene3d : setCinematic)(null);
              dispatch({ type: 'lost', view: kind });
            },
          });
        } catch (error) {
          const unavailable = error instanceof Error && error.name === SCENE3D_UNAVAILABLE;
          dispatch(unavailable ? { type: 'unavailable' } : { type: 'loadFailed', attempt });
          return;
        }
        (kind === '3d' ? setScene3d : setCinematic)(created);
        dispatch({ type: 'ready', attempt, view: kind });
      },
      () => {
        if (cancelled) return;
        window.clearTimeout(timer);
        dispatch({ type: 'loadFailed', attempt });
      },
    );
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [status, attempt, requested]);

  useControllerLifecycle(scene3d);
  useControllerLifecycle(cinematic);

  return {
    requested: state.requested,
    status: state.status,
    notice: state.notice,
    scene: state.shown === '3d' ? scene3d : state.shown === 'cinematic' ? cinematic : null,
    choose,
  };
}
