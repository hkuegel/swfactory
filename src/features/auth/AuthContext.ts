import { createContext } from 'react';
import type { AuthState } from './authReducer.ts';

export interface AuthContextValue {
  readonly state: AuthState;
  /** Call directly from the click handler, with no await before it (popup needs the gesture). */
  readonly signIn: () => void;
  readonly signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
