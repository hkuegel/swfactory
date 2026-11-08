import type { Ref } from 'react';
import { Button } from '../components/Button.tsx';
import type { SignInNotice } from './authReducer.ts';
import { GoogleSignInButton } from './GoogleSignInButton.tsx';
import styles from './LoginView.module.css';
import { NoticeIcon } from './NoticeIcon.tsx';

export interface LoginViewProps {
  readonly inProgress: boolean;
  readonly notice: SignInNotice | null;
  readonly onSignIn: () => void;
  /**
   * Guest sign-in (story 004); the button renders only if set, and only in DEV or in the
   * guest-only deploy build (story 018).
   */
  readonly onSignInAsGuest?: (() => void) | undefined;
  readonly signInButtonRef?: Ref<HTMLButtonElement> | undefined;
}

export function LoginView({
  inProgress,
  notice,
  onSignIn,
  onSignInAsGuest,
  signInButtonRef,
}: LoginViewProps) {
  return (
    <div className={styles.login}>
      {/* Literal guards everywhere (story 018, ADR 0010): the guest-only deploy build drops
          every Google offer; the intro stays the card's first child in both builds. */}
      {import.meta.env.VITE_GUEST_ONLY !== 'true' && <p>Use your Google account to sign in.</p>}
      {import.meta.env.VITE_GUEST_ONLY === 'true' && (
        <p>This site offers guest access only. Nothing is stored; reloading signs you out.</p>
      )}
      <div className={styles.buttons}>
        {import.meta.env.VITE_GUEST_ONLY !== 'true' && (
          <GoogleSignInButton ref={signInButtonRef} disabled={inProgress} onClick={onSignIn} />
        )}
        {/* Literal guard so the label never reaches a standard production bundle (004/AC12). */}
        {(import.meta.env.DEV || import.meta.env.VITE_GUEST_ONLY === 'true') && onSignInAsGuest && (
          <Button
            // Guest-only: the only sign-in control, so focus lands here after sign-out.
            ref={import.meta.env.VITE_GUEST_ONLY === 'true' ? signInButtonRef : undefined}
            // Guest-only: the one real entry, filled and without the test-tool look (UX §2).
            variant={import.meta.env.VITE_GUEST_ONLY === 'true' ? 'primary' : 'secondary'}
            className={
              import.meta.env.VITE_GUEST_ONLY === 'true'
                ? styles.guest
                : `${styles.guest} ${styles.guestTool}`
            }
            disabled={inProgress}
            onClick={onSignInAsGuest}
          >
            Sign in as guest
          </Button>
        )}
      </div>
      {/* Mounted persistently so swapped messages are announced; no role on purpose (UX §6). */}
      <div aria-live="polite" className={styles.messages}>
        {inProgress && (
          <p className={`${styles.message} ${styles.info}`}>
            <span className={styles.spinner} aria-hidden="true" />
            Signing in with Google…
          </p>
        )}
        {!inProgress && notice === 'cancelled' && (
          <p className={`${styles.message} ${styles.info}`}>
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
