import type { AuthUser, SignInResult } from './types.ts';

export type SignInNotice = 'cancelled' | 'error';

export type AuthState =
  | { readonly status: 'signedOut'; readonly notice: SignInNotice | null }
  | { readonly status: 'signingIn' }
  | { readonly status: 'signedIn'; readonly user: AuthUser };

export type AuthAction =
  | { readonly type: 'signInStarted' }
  | { readonly type: 'signInSettled'; readonly result: SignInResult }
  | { readonly type: 'signedOut' };

export const initialAuthState: AuthState = { status: 'signedOut', notice: null };

function settledState(result: SignInResult): AuthState {
  switch (result.kind) {
    case 'success':
      return { status: 'signedIn', user: result.user };
    case 'cancelled':
      return { status: 'signedOut', notice: 'cancelled' };
    case 'error':
      return { status: 'signedOut', notice: 'error' };
  }
}

/**
 * Pure auth state machine. Actions that don't apply to the current state return the same
 * state object, so stale or late events are ignored.
 */
export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'signInStarted':
      return state.status === 'signedOut' ? { status: 'signingIn' } : state;
    case 'signInSettled':
      return state.status === 'signingIn' ? settledState(action.result) : state;
    case 'signedOut':
      return state.status === 'signedIn' ? { status: 'signedOut', notice: null } : state;
  }
}
