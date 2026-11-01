import { displayName } from '../features/auth/displayName.ts';
import { LoginView } from '../features/auth/LoginView.tsx';
import { SignedInHeader } from '../features/auth/SignedInHeader.tsx';
import { useAuth } from '../features/auth/useAuth.ts';
import { useAuthFocus } from '../features/auth/useAuthFocus.ts';
import { Counter } from '../features/counter/Counter.tsx';
import styles from './App.module.css';

export function App() {
  const { state, signIn, signOut } = useAuth();
  const { identityRef, signInButtonRef } = useAuthFocus(state.status);

  return (
    <>
      {state.status === 'signedIn' && (
        <SignedInHeader
          identityRef={identityRef}
          displayName={displayName(state.user)}
          onSignOut={signOut}
        />
      )}
      <main className={styles.main}>
        <h1>Software Factory</h1>
        {state.status === 'signedIn' ? (
          // Presentation only, not access control: nothing is protected yet (story 001).
          <>
            <p>Your app starts here. Run /feature to build the first story.</p>
            <Counter />
          </>
        ) : (
          <LoginView
            signInButtonRef={signInButtonRef}
            inProgress={state.status === 'signingIn'}
            notice={state.status === 'signedOut' ? state.notice : null}
            onSignIn={signIn}
          />
        )}
      </main>
    </>
  );
}
