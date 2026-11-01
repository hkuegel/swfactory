import { useCallback, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { AuthContext, type AuthContextValue } from './AuthContext.ts';
import { authReducer, initialAuthState } from './authReducer.ts';
import type { AuthClient, SignInResult } from './types.ts';

export interface AuthProviderProps {
  readonly client: AuthClient;
  readonly children: ReactNode;
}

const UNEXPECTED_FAILURE: SignInResult = { kind: 'error', reason: 'unknown' };

export function AuthProvider({ client, children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  // Read by the stable callbacks below, so they don't change on every transition.
  const stateRef = useRef(state);
  // Blocks a second sign-in synchronously (before the re-render disables the button).
  const inFlightRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const signIn = useCallback(() => {
    if (inFlightRef.current || stateRef.current.status !== 'signedOut') return;
    inFlightRef.current = true;
    dispatch({ type: 'signInStarted' });
    // Synchronous call: the client opens Google's popup, which needs the click gesture.
    client
      .signIn()
      // The AuthClient contract says signIn never rejects; guard anyway so the UI can't hang.
      .catch(() => UNEXPECTED_FAILURE)
      .then((result) => {
        inFlightRef.current = false;
        if (import.meta.env.DEV && result.kind === 'error') {
          console.warn(`Sign-in failed: ${result.reason}`);
        }
        dispatch({ type: 'signInSettled', result });
      });
  }, [client]);

  const signOut = useCallback(() => {
    if (stateRef.current.status !== 'signedIn') return;
    client.signOut();
    dispatch({ type: 'signedOut' });
  }, [client]);

  const value = useMemo<AuthContextValue>(
    () => ({ state, signIn, signOut }),
    [state, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
