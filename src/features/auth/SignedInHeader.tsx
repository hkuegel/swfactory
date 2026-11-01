import type { Ref } from 'react';
import styles from './SignedInHeader.module.css';

export interface SignedInHeaderProps {
  readonly displayName: string;
  readonly onSignOut: () => void;
  /** Focus target after a successful sign-in (UX §3). */
  readonly identityRef?: Ref<HTMLParagraphElement> | undefined;
}

export function SignedInHeader({ displayName, onSignOut, identityRef }: SignedInHeaderProps) {
  return (
    <header className={styles.header}>
      <p id="identity" ref={identityRef} tabIndex={-1} className={styles.identity}>
        Signed in as <span>{displayName}</span>
      </p>
      <button type="button" className={styles.signOut} onClick={onSignOut}>
        Sign out
      </button>
    </header>
  );
}
