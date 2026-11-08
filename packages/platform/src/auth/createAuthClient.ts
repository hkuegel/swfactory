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
 * The guest-only deploy build (story 018, ADR 0010) returns before any Google code, so it loads
 * no Google script, makes no Google request and logs no missing-client-ID error.
 */
export function createAuthClient(): AuthClient {
  // Literal guard (not a shared constant) so the deploy build drops the Google client.
  if (import.meta.env.VITE_GUEST_ONLY === 'true') return notConfiguredClient;
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
