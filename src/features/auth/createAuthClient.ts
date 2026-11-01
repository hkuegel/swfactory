import { createFakeAuthClient } from './fake/createFakeAuthClient.ts';
import { createGoogleAuthClient } from './google/createGoogleAuthClient.ts';
import type { AuthClient } from './types.ts';

const notConfiguredClient: AuthClient = {
  signIn: () => Promise.resolve({ kind: 'error', reason: 'not_configured' }),
  signOut: () => undefined,
};

/**
 * Picks the AuthClient for this page load (ADR 0003). Call once, outside React.
 * The fake branch is statically false in `vite build` (DEV is false), so it is tree-shaken.
 */
export function createAuthClient(): AuthClient {
  if (import.meta.env.DEV && import.meta.env.MODE === 'e2e') {
    return createFakeAuthClient({ exposeControl: true });
  }
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    console.error(
      'VITE_GOOGLE_CLIENT_ID is not set: Google sign-in will fail. Copy .env.example to .env.local and set it (see README).',
    );
    return notConfiguredClient;
  }
  return createGoogleAuthClient({ clientId });
}
