import { displayName } from '../features/auth/displayName.ts';
import { LoginView } from '../features/auth/LoginView.tsx';
import { SignedInHeader } from '../features/auth/SignedInHeader.tsx';
import { useAuth } from '../features/auth/useAuth.ts';
import { useAuthFocus } from '../features/auth/useAuthFocus.ts';
import { Minesweeper } from '../features/minesweeper/Minesweeper.tsx';
import styles from './App.module.css';

export function App() {
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
        <h1>Software Factory</h1>
        {signedIn ? (
          // Presentation only, not access control: nothing is protected (story 001).
          <Minesweeper />
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
