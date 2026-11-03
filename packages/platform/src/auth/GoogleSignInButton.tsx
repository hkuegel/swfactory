import type { Ref } from 'react';
import { GoogleLogo } from './GoogleLogo.tsx';
import styles from './GoogleSignInButton.module.css';

export interface GoogleSignInButtonProps {
  readonly disabled: boolean;
  readonly onClick: () => void;
  /** Lets the app move focus back to the button after cancel, error or sign-out. */
  readonly ref?: Ref<HTMLButtonElement> | undefined;
}

/** Custom "Sign in with Google" button following Google's branding guidelines (light theme). */
export function GoogleSignInButton({ disabled, onClick, ref }: GoogleSignInButtonProps) {
  return (
    <button ref={ref} type="button" className={styles.button} disabled={disabled} onClick={onClick}>
      <GoogleLogo className={styles.logo} />
      <span>Sign in with Google</span>
    </button>
  );
}
