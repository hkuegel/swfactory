import { useEffect, useRef } from 'react';
import type { AuthState } from './authReducer.ts';

/**
 * Focus moves on auth transitions (UX §3): signingIn → signedIn focuses the identity;
 * signingIn/signedIn → signedOut focuses the sign-in button. Page load moves nothing.
 */
export function useAuthFocus(status: AuthState['status']) {
  const identityRef = useRef<HTMLParagraphElement>(null);
  const signInButtonRef = useRef<HTMLButtonElement>(null);
  const previousStatusRef = useRef(status);

  useEffect(() => {
    const previous = previousStatusRef.current;
    previousStatusRef.current = status;
    if (previous === 'signingIn' && status === 'signedIn') {
      identityRef.current?.focus();
    } else if (previous !== 'signedOut' && status === 'signedOut') {
      signInButtonRef.current?.focus();
    }
  }, [status]);

  return { identityRef, signInButtonRef };
}
