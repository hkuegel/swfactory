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
import { readPalette } from './scene3d/palette.ts';
import {
  SCENE3D_UNAVAILABLE,
  type BoardSceneController,
  type BoardSceneHandle,
} from './scene3d/types.ts';

/** AC6: covers the chunk import and the controller creation. */
export const SCENE_LOAD_TIMEOUT_MS = 10_000;

// Type only (erased): the value is reached through the dynamic import() below.
type SceneModule = { readonly createBoardScene: typeof createBoardScene };

/**
 * The lazy scene chunk (ADR 0005): the only reference to createBoardScene.ts, never imported
 * statically. Cached once loaded; a failure is not cached, so the next choice retries.
 */
let sceneModule: Promise<SceneModule> | null = null;

function loadSceneModule(): Promise<SceneModule> {
  sceneModule ??= import('./scene3d/createBoardScene.ts').catch((error: unknown) => {
    sceneModule = null;
    throw error;
  });
  return sceneModule;
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

/**
 * The 3D view (story 009): its state machine, the lazy load with a timeout and the scene
 * controller's lifetime. The controller survives games and 2D↔3D switches; it is disposed when
 * the context is lost and on unmount (sign-out), so a new mount starts in 2D (008/AC8).
 */
export function useBoard3d(): {
  readonly requested: BoardView;
  readonly status: View3dStatus;
  readonly notice: View3dNotice;
  /** Non-null iff the 3D board is shown. */
  readonly scene: BoardSceneHandle | null;
  readonly choose: (view: BoardView) => void;
} {
  const [state, dispatch] = useReducer(view3dReducer, undefined, () =>
    initialView3d(supports3dView()),
  );
  const [controller, setController] = useState<BoardSceneController | null>(null);

  const choose = useCallback(
    (view: BoardView) => dispatch({ type: 'choose', view, loaded: controller !== null }),
    [controller],
  );

  // Load attempt: import + create, bounded by the timeout; late results of a cancelled attempt
  // are dropped (the module stays cached for the next choice).
  const { status, attempt } = state;
  useEffect(() => {
    if (status !== 'loading') return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      dispatch({ type: 'loadFailed', attempt });
    }, SCENE_LOAD_TIMEOUT_MS);
    loadSceneModule().then(
      (module) => {
        if (cancelled) return;
        window.clearTimeout(timer);
        let created: BoardSceneController;
        try {
          created = module.createBoardScene({
            palette: readPalette(getVar),
            reducedMotion: motionNow().reducedMotion,
            onContextLost: () => {
              created.dispose();
              setController(null);
              dispatch({ type: 'lost' });
            },
          });
        } catch (error) {
          const unavailable = error instanceof Error && error.name === SCENE3D_UNAVAILABLE;
          dispatch(unavailable ? { type: 'unavailable' } : { type: 'loadFailed', attempt });
          return;
        }
        setController(created);
        dispatch({ type: 'ready', attempt });
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
  }, [status, attempt]);

  // Media queries pushed into the controller; disposal on unmount.
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

  return {
    requested: state.requested,
    status: state.status,
    notice: state.notice,
    scene: state.shown === '3d' ? controller : null,
    choose,
  };
}
