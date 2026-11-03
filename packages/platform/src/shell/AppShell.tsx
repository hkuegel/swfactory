import { displayName } from '../auth/displayName.ts';
import { LoginView } from '../auth/LoginView.tsx';
import { SignedInHeader } from '../auth/SignedInHeader.tsx';
import { useAuth } from '../auth/useAuth.ts';
import { useAuthFocus } from '../auth/useAuthFocus.ts';
import type { ReactNode } from 'react';
import styles from './AppShell.module.css';

export interface AppShellProps {
  /** The page's one h1, in the login view and the signed-in view. */
  readonly title: string;
  /** The app; rendered only when signed in. */
  readonly children: ReactNode;
}

export function AppShell({ title, children }: AppShellProps) {
  const { state, signIn, signInAsGuest, signOut } = useAuth();
  const { identityRef, signInButtonRef } = useAuthFocus(state.status);
  const signedIn = state.status === 'signedIn';

  return (
    <>
      {state.status === 'signedIn' && (
        <SignedInHeader
          identityRef={identityRef}
          displayName={displayName(state.user)}
          onSignOut={signOut}
        />
      )}
      <main className={signedIn ? `${styles.main} ${styles.wide}` : styles.main}>
        <h1>{title}</h1>
        {signedIn ? (
          // Presentation only, not access control: nothing is protected (story 001).
          children
        ) : (
          <LoginView
            signInButtonRef={signInButtonRef}
            inProgress={state.status === 'signingIn'}
            notice={state.status === 'signedOut' ? state.notice : null}
            onSignIn={signIn}
            onSignInAsGuest={signInAsGuest}
          />
        )}
      </main>
    </>
  );
}
