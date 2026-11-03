import type { BoardView } from './boardView.ts';

/** The 3D view's lifecycle (story 009, AC6). Pure; `useBoard3d` drives it. */
export type View3dStatus = 'idle' | 'loading' | 'unavailable';
export type View3dNotice = 'loadFailed' | 'lost' | null;

export interface View3dState {
  /** The radio's checked value (what the player asked for). */
  readonly requested: BoardView;
  /** What the board shows. '3d' only after the scene was created. */
  readonly shown: BoardView;
  readonly status: View3dStatus;
  readonly notice: View3dNotice;
  /** Incremented per load attempt; late results of older attempts are ignored. */
  readonly attempt: number;
}

export type View3dAction =
  | { readonly type: 'choose'; readonly view: BoardView; readonly loaded: boolean }
  | { readonly type: 'ready'; readonly attempt: number }
  | { readonly type: 'loadFailed'; readonly attempt: number } // import error or timeout
  | { readonly type: 'unavailable' } // no WebGL2 context
  | { readonly type: 'lost' };

/** Copy of UX §10: each string is both the visible text and the announcement. */
export const VIEW3D_TEXT = {
  loading: 'Loading 3D…',
  ready: '3D view ready.',
  loadFailed: '3D could not be loaded. The board stays in 2D.',
  lost: 'The 3D view stopped. Your game continues in 2D.',
  unavailable: '3D is not available in this browser.',
} as const;

export function initialView3d(available: boolean): View3dState {
  return {
    requested: '2d',
    shown: '2d',
    status: available ? 'idle' : 'unavailable',
    notice: null,
    attempt: 0,
  };
}

export function view3dReducer(state: View3dState, action: View3dAction): View3dState {
  switch (action.type) {
    case 'choose': {
      if (action.view === '2d') {
        return {
          ...state,
          requested: '2d',
          shown: '2d',
          status: state.status === 'loading' ? 'idle' : state.status,
          notice: null,
        };
      }
      if (state.status === 'unavailable') return state;
      if (action.loaded) {
        return { ...state, requested: '3d', shown: '3d', status: 'idle', notice: null };
      }
      if (state.status === 'loading') return { ...state, requested: '3d', notice: null };
      return {
        ...state,
        requested: '3d',
        status: 'loading',
        notice: null,
        attempt: state.attempt + 1,
      };
    }
    case 'ready':
      if (
        action.attempt !== state.attempt ||
        state.status !== 'loading' ||
        state.requested !== '3d'
      ) {
        return state;
      }
      return { ...state, shown: '3d', status: 'idle' };
    case 'loadFailed':
      if (action.attempt !== state.attempt || state.status !== 'loading') return state;
      return { ...state, requested: '2d', shown: '2d', status: 'idle', notice: 'loadFailed' };
    case 'unavailable':
      return {
        ...state,
        requested: '2d',
        shown: '2d',
        status: 'unavailable',
        notice: 'loadFailed',
      };
    case 'lost':
      // A context lost while 2D is shown (controller kept for a quick switch back) is silent.
      if (state.shown !== '3d') return state;
      return { ...state, requested: '2d', shown: '2d', notice: 'lost' };
  }
}

/** What the view state looks like to the announcer (UX §11). */
export interface View3dSeen {
  readonly status: View3dStatus;
  readonly notice: View3dNotice;
  readonly ready: boolean; // a scene is shown
}

/**
 * The live-region text for a transition of the view state, or null (UX §11): into loading,
 * loading → shown, a new notice. An instant switch says nothing (the radio announces itself).
 */
export function view3dAnnouncement(prev: View3dSeen, next: View3dSeen): string | null {
  if (next.notice !== null && next.notice !== prev.notice) return VIEW3D_TEXT[next.notice];
  if (next.status === 'loading' && prev.status !== 'loading') return VIEW3D_TEXT.loading;
  if (prev.status === 'loading' && next.status === 'idle' && next.ready) return VIEW3D_TEXT.ready;
  return null;
}
