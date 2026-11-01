import { createDeferred, type Deferred } from '../../../lib/createDeferred.ts';
import type { AuthClient, SignInResult } from '../types.ts';
import type {
  GisClientConfigError,
  GisOAuth2,
  GisTokenClient,
  GisTokenResponse,
} from './gisTypes.ts';
import { loadGisScript } from './loadGisScript.ts';
import { parseUserInfo } from './parseUserInfo.ts';

export const GOOGLE_SCOPE = 'openid email profile';
export const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
/** Upper bound for the non-interactive userinfo call (the popup itself has no timeout). */
export const USERINFO_TIMEOUT_MS = 10_000;

export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

export interface GoogleAuthClientOptions {
  readonly clientId: string;
  readonly loadScript?: () => Promise<GisOAuth2>;
  readonly fetchFn?: FetchFn;
}

const UNAVAILABLE: SignInResult = { kind: 'error', reason: 'unavailable' };
const UNKNOWN: SignInResult = { kind: 'error', reason: 'unknown' };

function mapClientError(error: GisClientConfigError): SignInResult {
  switch (error.type) {
    case 'popup_closed':
      return { kind: 'cancelled' };
    case 'popup_failed_to_open':
      return { kind: 'error', reason: 'popup_blocked' };
    default:
      return UNKNOWN;
  }
}

async function requestUser(
  fetchFn: FetchFn,
  accessToken: string,
  signal: AbortSignal,
): Promise<SignInResult> {
  let response: Response;
  try {
    response = await fetchFn(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal,
    });
  } catch {
    return UNAVAILABLE;
  }
  if (!response.ok) return UNAVAILABLE;
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    // An aborted body read is a network failure, not a malformed profile.
    return signal.aborted ? UNAVAILABLE : UNKNOWN;
  }
  const user = parseUserInfo(body);
  return user ? { kind: 'success', user } : UNKNOWN;
}

/**
 * Userinfo call bounded by USERINFO_TIMEOUT_MS, so a stalled request still ends the attempt
 * (AC3/AC5). The timeout aborts the request and body read, and the race settles even if a
 * fetch implementation ignores the signal.
 */
async function fetchUser(fetchFn: FetchFn, accessToken: string): Promise<SignInResult> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<SignInResult>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve(UNAVAILABLE);
    }, USERINFO_TIMEOUT_MS);
  });
  try {
    return await Promise.race([requestUser(fetchFn, accessToken, controller.signal), timedOut]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * AuthClient over the GIS OAuth 2.0 token client (ADR 0002). The script is preloaded on
 * creation so that signIn() can open the popup synchronously inside the click handler.
 * The access token is used once for the userinfo call and never stored.
 */
export function createGoogleAuthClient({
  clientId,
  loadScript = loadGisScript,
  // Wrapped so `fetch` is never called with a foreign `this` (Illegal invocation).
  fetchFn = (input, init) => fetch(input, init),
}: GoogleAuthClientOptions): AuthClient {
  let tokenClient: GisTokenClient | null = null;
  let loadFailed = false;
  // At most one interactive attempt; the GIS callbacks are fixed at init and settle it.
  let pending: Deferred<SignInResult> | null = null;
  // Set once a token is accepted for the pending attempt; later GIS callbacks for it are ignored.
  let tokenAccepted = false;

  function settle(result: SignInResult, attempt: Deferred<SignInResult> | null = pending): void {
    if (!attempt || attempt !== pending) return;
    pending = null;
    attempt.resolve(result);
  }

  function onToken(response: GisTokenResponse): void {
    if (!pending || tokenAccepted) return;
    if (response.error) {
      settle(
        response.error === 'access_denied' ? { kind: 'error', reason: 'access_denied' } : UNKNOWN,
      );
      return;
    }
    if (!response.access_token) {
      settle(UNKNOWN);
      return;
    }
    tokenAccepted = true;
    const attempt = pending;
    void fetchUser(fetchFn, response.access_token).then((result) => settle(result, attempt));
  }

  function onError(error: GisClientConfigError): void {
    // A token was already accepted: the userinfo call decides the outcome, not a late
    // popup_closed (which would otherwise turn a success into "cancelled").
    if (tokenAccepted) return;
    settle(mapClientError(error));
  }

  function startLoad(): void {
    loadFailed = false;
    loadScript().then(
      (oauth2) => {
        try {
          tokenClient = oauth2.initTokenClient({
            client_id: clientId,
            scope: GOOGLE_SCOPE,
            callback: onToken,
            error_callback: onError,
          });
        } catch {
          loadFailed = true;
        }
      },
      () => {
        loadFailed = true;
      },
    );
  }

  startLoad();

  return {
    signIn() {
      if (pending) return pending.promise;
      if (!tokenClient) {
        // Not ready (still loading or failed). Never await here: the popup needs the gesture.
        if (loadFailed) startLoad();
        return Promise.resolve(UNAVAILABLE);
      }
      const attempt = createDeferred<SignInResult>();
      pending = attempt;
      tokenAccepted = false;
      try {
        tokenClient.requestAccessToken({ prompt: 'select_account' });
      } catch {
        settle(UNKNOWN);
      }
      return attempt.promise;
    },
    signOut() {
      // Nothing to clear: the access token is never kept, and nothing restores a session
      // (AC10). The grant is not revoked, which would force consent on every sign-in.
    },
  };
}
