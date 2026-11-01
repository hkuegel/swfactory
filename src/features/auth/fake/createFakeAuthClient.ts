import { createDeferred, type Deferred } from '../../../lib/createDeferred.ts';
import type { AuthClient, AuthUser, SignInResult } from '../types.ts';

export interface FakeAccount {
  readonly sub: string;
  readonly email: string;
  readonly name?: string;
}

export interface FakeGoogleControl {
  /** Account returned by the next successful sign-in. Default: Ada Lovelace <ada@example.com>. */
  setAccount(account: FakeAccount): void;
  /** Settles the pending interactive sign-in; until then signIn() stays pending (AC3 observable). */
  settleSignIn(outcome: 'success' | 'cancelled' | 'error'): void;
}

export interface FakeAuthClient extends AuthClient {
  readonly control: FakeGoogleControl;
}

export interface FakeAuthClientOptions {
  /** Publish the control as `window.__fakeGoogle` (e2e dev mode only, see ADR 0003). */
  readonly exposeControl?: boolean;
}

declare global {
  interface Window {
    /** Present only when the Vite dev server runs in mode `e2e`. Never in production builds. */
    __fakeGoogle?: FakeGoogleControl;
  }
}

const DEFAULT_ACCOUNT: FakeAccount = {
  sub: 'fake-ada',
  email: 'ada@example.com',
  name: 'Ada Lovelace',
};

function toUser(account: FakeAccount): AuthUser {
  const name = account.name?.trim();
  return { provider: 'google', id: account.sub, email: account.email, name: name ? name : null };
}

/**
 * Deterministic in-memory AuthClient for component tests and e2e. Nothing persists across
 * page loads. Must stay free of top-level side effects so production builds tree-shake it.
 */
export function createFakeAuthClient(options: FakeAuthClientOptions = {}): FakeAuthClient {
  let account = DEFAULT_ACCOUNT;
  let pending: Deferred<SignInResult> | null = null;

  const control: FakeGoogleControl = {
    setAccount(next) {
      account = next;
    },
    settleSignIn(outcome) {
      if (!pending) return;
      const { resolve } = pending;
      pending = null;
      if (outcome === 'success') resolve({ kind: 'success', user: toUser(account) });
      else if (outcome === 'cancelled') resolve({ kind: 'cancelled' });
      else resolve({ kind: 'error', reason: 'unknown' });
    },
  };

  if (options.exposeControl) {
    window.__fakeGoogle = control;
  }

  return {
    control,
    signIn() {
      if (pending) return pending.promise;
      pending = createDeferred<SignInResult>();
      return pending.promise;
    },
    signOut() {
      // Nothing to forget: the fake keeps no session.
    },
  };
}
