import { describe, expect, it } from 'vitest';
import { authReducer, initialAuthState, type AuthState } from './authReducer.ts';
import type { AuthUser } from './types.ts';

const user: AuthUser = { id: 'sub-1', email: 'jane@example.com', name: 'Jane Doe' };
const signingIn: AuthState = { status: 'signingIn' };
const signedIn: AuthState = { status: 'signedIn', user };

describe('authReducer', () => {
  it('AC1: starts signed out without a notice', () => {
    expect(initialAuthState).toEqual({ status: 'signedOut', notice: null });
  });

  it('AC3: signInStarted moves from signed out to signing in', () => {
    expect(authReducer(initialAuthState, { type: 'signInStarted' })).toEqual({
      status: 'signingIn',
    });
  });

  it.each(['cancelled', 'error'] as const)(
    'AC6: signInStarted clears a previous %s notice',
    (notice) => {
      expect(authReducer({ status: 'signedOut', notice }, { type: 'signInStarted' })).toEqual({
        status: 'signingIn',
      });
    },
  );

  it('AC2: a successful result moves to signed in with the user', () => {
    expect(
      authReducer(signingIn, { type: 'signInSettled', result: { kind: 'success', user } }),
    ).toEqual({ status: 'signedIn', user });
  });

  it('AC4: a cancelled result moves to signed out with the cancelled notice', () => {
    expect(
      authReducer(signingIn, { type: 'signInSettled', result: { kind: 'cancelled' } }),
    ).toEqual({ status: 'signedOut', notice: 'cancelled' });
  });

  it('AC5: an error result moves to signed out with the error notice', () => {
    expect(
      authReducer(signingIn, {
        type: 'signInSettled',
        result: { kind: 'error', reason: 'access_denied' },
      }),
    ).toEqual({ status: 'signedOut', notice: 'error' });
  });

  it('AC9: signedOut moves from signed in to signed out without a notice', () => {
    expect(authReducer(signedIn, { type: 'signedOut' })).toEqual({
      status: 'signedOut',
      notice: null,
    });
  });

  describe('ignored actions return the same state object', () => {
    const signedOutWithNotice: AuthState = { status: 'signedOut', notice: 'error' };

    it.each([
      ['signInStarted while signing in', signingIn, { type: 'signInStarted' }],
      ['signInStarted while signed in', signedIn, { type: 'signInStarted' }],
      [
        'signInSettled while signed out',
        signedOutWithNotice,
        { type: 'signInSettled', result: { kind: 'cancelled' } },
      ],
      [
        'signInSettled while signed in',
        signedIn,
        { type: 'signInSettled', result: { kind: 'cancelled' } },
      ],
      ['signedOut while signed out', signedOutWithNotice, { type: 'signedOut' }],
      ['signedOut while signing in', signingIn, { type: 'signedOut' }],
    ] as const)('%s', (_label, state, action) => {
      expect(authReducer(state, action)).toBe(state);
    });
  });
});
