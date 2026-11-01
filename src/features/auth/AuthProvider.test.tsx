import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthProvider.tsx';
import { createFakeAuthClient, type FakeAuthClient } from './fake/createFakeAuthClient.ts';
import type { AuthClient } from './types.ts';
import { useAuth } from './useAuth.ts';

function Probe() {
  const { state, signIn, signOut } = useAuth();
  const text =
    state.status === 'signedIn'
      ? `signedIn:${state.user.email}`
      : state.status === 'signedOut'
        ? `signedOut:${state.notice ?? 'none'}`
        : 'signingIn';
  return (
    <>
      <output>{text}</output>
      <button type="button" onClick={signIn}>
        sign in
      </button>
      <button type="button" onClick={signOut}>
        sign out
      </button>
    </>
  );
}

function renderWith(client: AuthClient) {
  render(
    <AuthProvider client={client}>
      <Probe />
    </AuthProvider>,
  );
  return { user: userEvent.setup(), status: () => screen.getByRole('status').textContent };
}

async function settle(fake: FakeAuthClient, outcome: 'success' | 'cancelled' | 'error') {
  await act(async () => {
    fake.control.settleSignIn(outcome);
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AuthProvider', () => {
  it('AC1: starts signed out without a notice', () => {
    const { status } = renderWith(createFakeAuthClient());
    expect(status()).toBe('signedOut:none');
  });

  it('AC3: is signing in while the client attempt is pending', async () => {
    const { user, status } = renderWith(createFakeAuthClient());
    await user.click(screen.getByRole('button', { name: 'sign in' }));
    expect(status()).toBe('signingIn');
  });

  it('AC2: is signed in with the user after a successful attempt', async () => {
    const fake = createFakeAuthClient();
    const { user, status } = renderWith(fake);
    await user.click(screen.getByRole('button', { name: 'sign in' }));
    await settle(fake, 'success');
    expect(status()).toBe('signedIn:ada@example.com');
  });

  it('AC4: is signed out with the cancelled notice after a cancelled attempt', async () => {
    const fake = createFakeAuthClient();
    const { user, status } = renderWith(fake);
    await user.click(screen.getByRole('button', { name: 'sign in' }));
    await settle(fake, 'cancelled');
    expect(status()).toBe('signedOut:cancelled');
  });

  it('AC5: is signed out with the error notice after a failed attempt', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fake = createFakeAuthClient();
    const { user, status } = renderWith(fake);
    await user.click(screen.getByRole('button', { name: 'sign in' }));
    await settle(fake, 'error');
    expect(status()).toBe('signedOut:error');
  });

  it('AC5: logs only the error reason in dev', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fake = createFakeAuthClient();
    const { user } = renderWith(fake);
    await user.click(screen.getByRole('button', { name: 'sign in' }));
    await settle(fake, 'error');
    expect(warn).toHaveBeenCalledWith('Sign-in failed: unknown');
  });

  it('AC6: a successful retry after an error leaves no notice', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fake = createFakeAuthClient();
    const { user, status } = renderWith(fake);
    await user.click(screen.getByRole('button', { name: 'sign in' }));
    await settle(fake, 'error');
    await user.click(screen.getByRole('button', { name: 'sign in' }));
    expect(status()).toBe('signingIn');
    await settle(fake, 'success');
    expect(status()).toBe('signedIn:ada@example.com');
  });

  it('AC9: sign out returns to signed out without a notice and tells the client', async () => {
    const fake = createFakeAuthClient();
    const clientSignOut = vi.spyOn(fake, 'signOut');
    const { user, status } = renderWith(fake);
    await user.click(screen.getByRole('button', { name: 'sign in' }));
    await settle(fake, 'success');
    await user.click(screen.getByRole('button', { name: 'sign out' }));
    expect(status()).toBe('signedOut:none');
    expect(clientSignOut).toHaveBeenCalledTimes(1);
  });

  it('ignores sign out while not signed in', async () => {
    const fake = createFakeAuthClient();
    const clientSignOut = vi.spyOn(fake, 'signOut');
    const { user, status } = renderWith(fake);
    await user.click(screen.getByRole('button', { name: 'sign out' }));
    expect(status()).toBe('signedOut:none');
    expect(clientSignOut).not.toHaveBeenCalled();
  });

  it('AC3: a double click starts only one attempt', async () => {
    const fake = createFakeAuthClient();
    const clientSignIn = vi.spyOn(fake, 'signIn');
    const { user } = renderWith(fake);
    await user.dblClick(screen.getByRole('button', { name: 'sign in' }));
    expect(clientSignIn).toHaveBeenCalledTimes(1);
  });

  it('does not start an attempt while signed in', async () => {
    const fake = createFakeAuthClient();
    const { user, status } = renderWith(fake);
    await user.click(screen.getByRole('button', { name: 'sign in' }));
    await settle(fake, 'success');
    const clientSignIn = vi.spyOn(fake, 'signIn');
    await user.click(screen.getByRole('button', { name: 'sign in' }));
    expect(clientSignIn).not.toHaveBeenCalled();
    expect(status()).toBe('signedIn:ada@example.com');
  });

  it('calls the client synchronously inside the click handler (popup needs the gesture)', () => {
    const fake = createFakeAuthClient();
    const clientSignIn = vi.spyOn(fake, 'signIn');
    renderWith(fake);
    act(() => {
      screen.getByRole('button', { name: 'sign in' }).click();
      expect(clientSignIn).toHaveBeenCalledTimes(1);
    });
  });

  it('AC5: shows the error notice if a client rejects despite the contract', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const client: AuthClient = {
      signIn: () => Promise.reject(new Error('boom')),
      signOut: () => undefined,
    };
    const { user, status } = renderWith(client);
    await user.click(screen.getByRole('button', { name: 'sign in' }));
    expect(status()).toBe('signedOut:error');
  });
});

describe('useAuth', () => {
  it('throws outside AuthProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Probe />)).toThrow('useAuth must be used inside <AuthProvider>');
  });
});
