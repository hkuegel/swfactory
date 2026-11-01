import type { Ref } from 'react';
import type { SignInNotice } from './authReducer.ts';
import { GoogleSignInButton } from './GoogleSignInButton.tsx';
import styles from './LoginView.module.css';
import { NoticeIcon } from './NoticeIcon.tsx';

export interface LoginViewProps {
  readonly inProgress: boolean;
  readonly notice: SignInNotice | null;
  readonly onSignIn: () => void;
  readonly signInButtonRef?: Ref<HTMLButtonElement> | undefined;
}

export function LoginView({ inProgress, notice, onSignIn, signInButtonRef }: LoginViewProps) {
  return (
    <div className={styles.login}>
      <p>Use your Google account to sign in.</p>
      <GoogleSignInButton ref={signInButtonRef} disabled={inProgress} onClick={onSignIn} />
      {/* Mounted persistently so swapped messages are announced; no role on purpose (UX §6). */}
      <div aria-live="polite" className={styles.messages}>
        {inProgress && (
          <p className={styles.message}>
            <span className={styles.spinner} aria-hidden="true" />
            Signing in with Google…
          </p>
        )}
        {!inProgress && notice === 'cancelled' && (
          <p className={styles.message}>
            <NoticeIcon kind="info" className={styles.icon} />
            Google sign-in was cancelled. You can try again.
          </p>
        )}
        {!inProgress && notice === 'error' && (
          <p role="alert" className={`${styles.message} ${styles.error}`}>
            <NoticeIcon kind="error" className={styles.icon} />
            Google sign-in failed. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
