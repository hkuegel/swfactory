import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../auth/AuthProvider.tsx';
import { createAuthClient } from '../auth/createAuthClient.ts';
import {
  createGoogleAuthClient,
  USERINFO_TIMEOUT_MS,
  type FetchFn,
} from '../auth/google/createGoogleAuthClient.ts';
import type { GisOAuth2, GisTokenClientConfig } from '../auth/google/gisTypes.ts';
import { AppShell } from './AppShell.tsx';

// Integration: the real AppShell + AuthProvider + the real Google adapter, with a stubbed GIS
// script and userinfo fetch. Complements the fake-based tests in AppShell.test.tsx.

const CANCELLED = 'Google sign-in was cancelled. You can try again.';
const FAILED = 'Google sign-in failed. Please try again.';

const flush = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
const signInButton = () => screen.getByRole('button', { name: 'Sign in with Google' });

async function renderWithGoogle(fetchFn: FetchFn) {
  let config: GisTokenClientConfig | undefined;
  const requestAccessToken = vi.fn();
  const oauth2: GisOAuth2 = {
    initTokenClient: (c) => {
      config = c;
      return { requestAccessToken };
    },
  };
  const client = createGoogleAuthClient({
    clientId: 'client-123',
    loadScript: () => Promise.resolve(oauth2),
    fetchFn,
  });
  const view = render(
    <AuthProvider client={client}>
      <AppShell title="Software Factory">
        <p>Content</p>
      </AppShell>
    </AuthProvider>,
  );
  await flush();
  const gis = (): GisTokenClientConfig => {
    if (!config) throw new Error('initTokenClient was not called');
    return config;
  };
  return { ...view, gis, requestAccessToken, user: userEvent.setup() };
}

function userinfo(body: unknown, status = 200): FetchFn {
  return () => Promise.resolve(new Response(JSON.stringify(body), { status }));
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('AppShell with the Google adapter', () => {
  it('AC2: a token plus userinfo with a name shows the name', async () => {
    const { user, gis, requestAccessToken } = await renderWithGoogle(
      userinfo({ sub: '1', email: 'jane@example.com', name: 'Jane Doe' }),
    );
    await user.click(signInButton());
    expect(requestAccessToken).toHaveBeenCalledTimes(1);
    expect(signInButton()).toBeDisabled();
    await act(async () => gis().callback({ access_token: 'tok' }));
    expect(screen.getByRole('banner')).toHaveTextContent('Signed in as Jane Doe');
    expect(screen.getByText(/Signed in as/)).toHaveFocus();
  });

  it('AC11: userinfo without a name shows the email', async () => {
    const { user, gis } = await renderWithGoogle(userinfo({ sub: '1', email: 'jane@example.com' }));
    await user.click(signInButton());
    await act(async () => gis().callback({ access_token: 'tok' }));
    expect(screen.getByRole('banner')).toHaveTextContent('Signed in as jane@example.com');
  });

  it('AC4: closing the Google popup shows the cancelled message', async () => {
    const { user, gis } = await renderWithGoogle(userinfo({}));
    await user.click(signInButton());
    await act(async () => gis().error_callback?.({ type: 'popup_closed' }));
    expect(screen.getByText(CANCELLED)).toBeInTheDocument();
    expect(signInButton()).toBeEnabled();
    expect(signInButton()).toHaveFocus();
  });

  it('AC5: a blocked popup shows the error alert', async () => {
    const { user, gis } = await renderWithGoogle(userinfo({}));
    await user.click(signInButton());
    await act(async () => gis().error_callback?.({ type: 'popup_failed_to_open' }));
    expect(screen.getByRole('alert')).toHaveTextContent(FAILED);
    expect(signInButton()).toBeEnabled();
  });

  it('AC5: access_denied from Google shows the error alert', async () => {
    const { user, gis } = await renderWithGoogle(userinfo({}));
    await user.click(signInButton());
    await act(async () => gis().callback({ error: 'access_denied' }));
    expect(screen.getByRole('alert')).toHaveTextContent(FAILED);
  });

  it('AC5: a failing userinfo request shows the error alert', async () => {
    const { user, gis } = await renderWithGoogle(() => Promise.reject(new TypeError('offline')));
    await user.click(signInButton());
    await act(async () => gis().callback({ access_token: 'tok' }));
    expect(screen.getByRole('alert')).toHaveTextContent(FAILED);
    expect(signInButton()).toBeEnabled();
  });

  it('AC5: a userinfo request that never answers ends in the error alert and re-enables the button', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { user, gis } = await renderWithGoogle(() => new Promise<Response>(() => undefined));
    await user.click(signInButton());
    vi.useFakeTimers();
    await act(async () => gis().callback({ access_token: 'tok' }));
    expect(signInButton()).toBeDisabled();
    expect(screen.getByText('Signing in with Google…')).toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(USERINFO_TIMEOUT_MS));
    expect(screen.getByRole('alert')).toHaveTextContent(FAILED);
    expect(signInButton()).toBeEnabled();
    expect(signInButton()).toHaveFocus();
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();
  });

  it('AC5: a profile without email is an error, not a signed-in state', async () => {
    const { user, gis } = await renderWithGoogle(userinfo({ sub: '1', name: 'No Mail' }));
    await user.click(signInButton());
    await act(async () => gis().callback({ access_token: 'tok' }));
    expect(screen.getByRole('alert')).toHaveTextContent(FAILED);
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();
  });

  it('AC6: after a cancel, a retry that succeeds shows no message', async () => {
    const { user, gis, requestAccessToken } = await renderWithGoogle(
      userinfo({ sub: '1', email: 'jane@example.com', name: 'Jane' }),
    );
    await user.click(signInButton());
    await act(async () => gis().error_callback?.({ type: 'popup_closed' }));
    await user.click(signInButton());
    expect(requestAccessToken).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(CANCELLED)).not.toBeInTheDocument();
    await act(async () => gis().callback({ access_token: 'tok' }));
    expect(screen.getByRole('banner')).toHaveTextContent('Signed in as Jane');
    expect(screen.queryByText(CANCELLED)).not.toBeInTheDocument();
  });

  it('AC3: a double click opens only one Google popup', async () => {
    const { user, requestAccessToken } = await renderWithGoogle(userinfo({}));
    await user.dblClick(signInButton());
    expect(requestAccessToken).toHaveBeenCalledTimes(1);
  });

  it('AC10: signing out and signing in again needs a new Google round trip', async () => {
    const { user, gis, requestAccessToken } = await renderWithGoogle(
      userinfo({ sub: '1', email: 'jane@example.com', name: 'Jane' }),
    );
    await user.click(signInButton());
    await act(async () => gis().callback({ access_token: 'tok' }));
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();
    expect(requestAccessToken).toHaveBeenCalledTimes(1);
    await flush();
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();
    await user.click(signInButton());
    expect(requestAccessToken).toHaveBeenCalledTimes(2);
  });

  it('AC5: without VITE_GOOGLE_CLIENT_ID the login screen renders and a click shows the error', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(
      <AuthProvider client={createAuthClient()}>
        <AppShell title="Software Factory">
          <p>Content</p>
        </AppShell>
      </AuthProvider>,
    );
    expect(signInButton()).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('VITE_GOOGLE_CLIENT_ID'));

    await user.click(signInButton());
    expect(await screen.findByRole('alert')).toHaveTextContent(FAILED);
    expect(signInButton()).toBeEnabled();
    expect(signInButton()).toHaveFocus();
  });
});
