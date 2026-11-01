import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAuthClient } from './createAuthClient.ts';
import type { AuthClient } from './types.ts';

const googleClient: AuthClient = {
  signIn: () => Promise.resolve({ kind: 'cancelled' }),
  signOut: () => undefined,
};

const { createGoogleAuthClient } = vi.hoisted(() => ({
  createGoogleAuthClient: vi.fn(),
}));

vi.mock('./google/createGoogleAuthClient.ts', () => ({ createGoogleAuthClient }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  createGoogleAuthClient.mockReset();
  delete window.__fakeGoogle;
});

describe('createAuthClient', () => {
  it('AC5: without a client ID, sign-in resolves as error/not_configured and logs why', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const client = createAuthClient();
    await expect(client.signIn()).resolves.toEqual({ kind: 'error', reason: 'not_configured' });
    expect(() => client.signOut()).not.toThrow();
    expect(error).toHaveBeenCalledWith(expect.stringContaining('VITE_GOOGLE_CLIENT_ID'));
    expect(createGoogleAuthClient).not.toHaveBeenCalled();
  });

  it('AC5: treats a whitespace-only client ID as missing', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '   ');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(createAuthClient().signIn()).resolves.toMatchObject({ reason: 'not_configured' });
  });

  it('uses the Google client with the trimmed client ID', () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', ' abc.apps.googleusercontent.com ');
    createGoogleAuthClient.mockReturnValue(googleClient);
    expect(createAuthClient()).toBe(googleClient);
    expect(createGoogleAuthClient).toHaveBeenCalledWith({
      clientId: 'abc.apps.googleusercontent.com',
    });
  });

  it('uses the fake and exposes window.__fakeGoogle only in dev mode "e2e"', () => {
    vi.stubEnv('MODE', 'e2e');
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'abc');
    const client = createAuthClient();
    expect(createGoogleAuthClient).not.toHaveBeenCalled();
    expect(window.__fakeGoogle).toBeDefined();
    expect(client).not.toBe(googleClient);
  });

  it('never uses the fake in a production build, even in mode "e2e"', () => {
    vi.stubEnv('MODE', 'e2e');
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'abc');
    createGoogleAuthClient.mockReturnValue(googleClient);
    expect(createAuthClient()).toBe(googleClient);
    expect(window.__fakeGoogle).toBeUndefined();
  });
});
