import { createContext } from 'react';
import type { AuthState } from './authReducer.ts';

export interface AuthContextValue {
  readonly state: AuthState;
  /** Call directly from the click handler, with no await before it (popup needs the gesture). */
  readonly signIn: () => void;
  /** Present only in DEV builds (story 004). Signs in as the guest synchronously. */
  readonly signInAsGuest?: (() => void) | undefined;
  readonly signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
