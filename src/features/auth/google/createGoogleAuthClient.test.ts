import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SignInResult } from '../types.ts';
import {
  createGoogleAuthClient,
  GOOGLE_SCOPE,
  USERINFO_TIMEOUT_MS,
  USERINFO_URL,
  type FetchFn,
} from './createGoogleAuthClient.ts';
import type { GisOAuth2, GisTokenClientConfig } from './gisTypes.ts';

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function setup(fetchImpl?: FetchFn) {
  let config: GisTokenClientConfig | undefined;
  const requestAccessToken = vi.fn();
  const initTokenClient = vi.fn((c: GisTokenClientConfig) => {
    config = c;
    return { requestAccessToken };
  });
  const oauth2: GisOAuth2 = { initTokenClient };
  const fetchFn = vi.fn<FetchFn>(
    fetchImpl ?? (() => Promise.resolve(jsonResponse({ sub: '1', email: 'jane@example.com' }))),
  );
  const client = createGoogleAuthClient({
    clientId: 'client-123',
    loadScript: () => Promise.resolve(oauth2),
    fetchFn,
  });
  await flush();
  const gis = (): GisTokenClientConfig => {
    if (!config) throw new Error('initTokenClient was not called');
    return config;
  };
  return { client, requestAccessToken, initTokenClient, fetchFn, gis };
}

async function signInWithToken(fetchImpl: FetchFn): Promise<SignInResult> {
  const { client, gis } = await setup(fetchImpl);
  const result = client.signIn();
  gis().callback({ access_token: 'token-abc' });
  return result;
}

afterEach(() => {
  vi.useRealTimers();
});

/** A userinfo request that never answers on its own and only rejects when aborted. */
const stalledUntilAborted: FetchFn = (_input, init) =>
  new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => {
      reject(new DOMException('The operation was aborted.', 'AbortError'));
    });
  });

describe('createGoogleAuthClient', () => {
  it('initialises the token client with the client ID and minimal scope', async () => {
    const { initTokenClient, gis } = await setup();
    expect(initTokenClient).toHaveBeenCalledTimes(1);
    expect(gis().client_id).toBe('client-123');
    expect(gis().scope).toBe(GOOGLE_SCOPE);
    expect(GOOGLE_SCOPE).toBe('openid email profile');
  });

  it('AC3: signIn opens the popup synchronously and stays pending until Google answers', async () => {
    const { client, requestAccessToken, gis } = await setup();
    let settled = false;
    const result = client.signIn().then((r) => {
      settled = true;
      return r;
    });
    // Synchronous: called before any await, so the browser keeps the click gesture.
    expect(requestAccessToken).toHaveBeenCalledTimes(1);
    expect(requestAccessToken).toHaveBeenCalledWith({ prompt: 'select_account' });
    await flush();
    expect(settled).toBe(false);
    gis().error_callback?.({ type: 'popup_closed' });
    await result;
  });

  it('returns the same promise while an attempt is pending', async () => {
    const { client, requestAccessToken } = await setup();
    expect(client.signIn()).toBe(client.signIn());
    expect(requestAccessToken).toHaveBeenCalledTimes(1);
  });

  it('AC4: popup_closed resolves as cancelled', async () => {
    const { client, gis } = await setup();
    const result = client.signIn();
    gis().error_callback?.({ type: 'popup_closed' });
    await expect(result).resolves.toEqual({ kind: 'cancelled' });
  });

  it.each([
    ['popup_failed_to_open', 'popup_blocked'],
    ['unknown', 'unknown'],
    ['something_new', 'unknown'],
  ])('AC5: error_callback %s resolves as error/%s', async (type, reason) => {
    const { client, gis } = await setup();
    const result = client.signIn();
    gis().error_callback?.({ type });
    await expect(result).resolves.toEqual({ kind: 'error', reason });
  });

  it.each([
    ['access_denied', 'access_denied'],
    ['invalid_request', 'unknown'],
  ])('AC5: token callback error %s resolves as error/%s', async (error, reason) => {
    const { client, gis, fetchFn } = await setup();
    const result = client.signIn();
    gis().callback({ error });
    await expect(result).resolves.toEqual({ kind: 'error', reason });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('AC5: a token response without access token resolves as error/unknown', async () => {
    const { client, gis } = await setup();
    const result = client.signIn();
    gis().callback({});
    await expect(result).resolves.toEqual({ kind: 'error', reason: 'unknown' });
  });

  it('AC2: fetches userinfo with the access token and resolves with the user', async () => {
    const { client, gis, fetchFn } = await setup(() =>
      Promise.resolve(jsonResponse({ sub: '42', email: 'jane@example.com', name: 'Jane Doe' })),
    );
    const result = client.signIn();
    gis().callback({ access_token: 'token-abc' });
    await expect(result).resolves.toEqual({
      kind: 'success',
      user: { provider: 'google', id: '42', email: 'jane@example.com', name: 'Jane Doe' },
    });
    expect(fetchFn).toHaveBeenCalledWith(USERINFO_URL, {
      headers: { Authorization: 'Bearer token-abc' },
      signal: expect.any(AbortSignal),
    });
  });

  it('AC11: userinfo without a name resolves with name null', async () => {
    await expect(
      signInWithToken(() => Promise.resolve(jsonResponse({ sub: '42', email: 'j@example.com' }))),
    ).resolves.toEqual({
      kind: 'success',
      user: { provider: 'google', id: '42', email: 'j@example.com', name: null },
    });
  });

  it('AC5: a failed userinfo request resolves as error/unavailable', async () => {
    await expect(signInWithToken(() => Promise.reject(new TypeError('network')))).resolves.toEqual({
      kind: 'error',
      reason: 'unavailable',
    });
  });

  it('AC5: a non-ok userinfo response resolves as error/unavailable', async () => {
    await expect(
      signInWithToken(() => Promise.resolve(jsonResponse({ error: 'x' }, 401))),
    ).resolves.toEqual({ kind: 'error', reason: 'unavailable' });
  });

  it('AC5: userinfo without email resolves as error/unknown', async () => {
    await expect(
      signInWithToken(() => Promise.resolve(jsonResponse({ sub: '42', name: 'Jane' }))),
    ).resolves.toEqual({ kind: 'error', reason: 'unknown' });
  });

  it('AC5: a userinfo body that is not JSON resolves as error/unknown', async () => {
    await expect(
      signInWithToken(() => Promise.resolve(new Response('<html>', { status: 200 }))),
    ).resolves.toEqual({ kind: 'error', reason: 'unknown' });
  });

  it('AC5: requestAccessToken throwing resolves as error/unknown', async () => {
    const { client, requestAccessToken } = await setup();
    requestAccessToken.mockImplementation(() => {
      throw new Error('boom');
    });
    await expect(client.signIn()).resolves.toEqual({ kind: 'error', reason: 'unknown' });
  });

  it('ignores GIS callbacks when no attempt is pending', async () => {
    const { client, gis, fetchFn } = await setup();
    gis().callback({ access_token: 'late' });
    gis().error_callback?.({ type: 'popup_closed' });
    expect(fetchFn).not.toHaveBeenCalled();
    const result = client.signIn();
    gis().error_callback?.({ type: 'popup_failed_to_open' });
    await expect(result).resolves.toEqual({ kind: 'error', reason: 'popup_blocked' });
  });

  it('allows a new attempt after the previous one settled (AC6)', async () => {
    const { client, gis, requestAccessToken } = await setup();
    const first = client.signIn();
    gis().error_callback?.({ type: 'popup_closed' });
    await first;
    const second = client.signIn();
    expect(second).not.toBe(first);
    expect(requestAccessToken).toHaveBeenCalledTimes(2);
    gis().callback({ access_token: 't' });
    await expect(second).resolves.toMatchObject({ kind: 'success' });
  });

  it('AC5: resolves as error/unavailable while the script is still loading', async () => {
    const client = createGoogleAuthClient({
      clientId: 'c',
      loadScript: () => new Promise<GisOAuth2>(() => undefined),
      fetchFn: vi.fn<FetchFn>(),
    });
    await expect(client.signIn()).resolves.toEqual({ kind: 'error', reason: 'unavailable' });
  });

  it('AC5: resolves as error/unavailable when the script failed and retries loading', async () => {
    const requestAccessToken = vi.fn();
    const oauth2: GisOAuth2 = { initTokenClient: () => ({ requestAccessToken }) };
    const loadScript = vi
      .fn<() => Promise<GisOAuth2>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(oauth2);
    const client = createGoogleAuthClient({ clientId: 'c', loadScript, fetchFn: vi.fn<FetchFn>() });
    await flush();

    await expect(client.signIn()).resolves.toEqual({ kind: 'error', reason: 'unavailable' });
    expect(loadScript).toHaveBeenCalledTimes(2);
    await flush();

    void client.signIn();
    expect(requestAccessToken).toHaveBeenCalledTimes(1);
  });

  it('AC5: resolves as error/unavailable when initTokenClient throws', async () => {
    const oauth2: GisOAuth2 = {
      initTokenClient: () => {
        throw new Error('bad client id');
      },
    };
    const client = createGoogleAuthClient({
      clientId: 'c',
      loadScript: () => Promise.resolve(oauth2),
      fetchFn: vi.fn<FetchFn>(),
    });
    await flush();
    await expect(client.signIn()).resolves.toEqual({ kind: 'error', reason: 'unavailable' });
  });

  it('AC9/AC10: signOut never throws and does not call Google', async () => {
    const { client, requestAccessToken, fetchFn } = await setup();
    expect(() => client.signOut()).not.toThrow();
    expect(requestAccessToken).not.toHaveBeenCalled();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  describe('userinfo timeout', () => {
    it('AC3/AC5: a stalled userinfo request is aborted and resolves as error/unavailable', async () => {
      const { client, gis, fetchFn } = await setup(stalledUntilAborted);
      vi.useFakeTimers();
      let settled = false;
      const result = client.signIn().then((r) => {
        settled = true;
        return r;
      });
      gis().callback({ access_token: 'token-abc' });

      await vi.advanceTimersByTimeAsync(USERINFO_TIMEOUT_MS - 1);
      expect(settled).toBe(false);

      await vi.advanceTimersByTimeAsync(1);
      await expect(result).resolves.toEqual({ kind: 'error', reason: 'unavailable' });
      const signal = fetchFn.mock.calls[0]?.[1]?.signal;
      expect(signal?.aborted).toBe(true);
    });

    it('AC5: ends the attempt even if the fetch implementation ignores the signal', async () => {
      const { client, gis } = await setup(() => new Promise<Response>(() => undefined));
      vi.useFakeTimers();
      const result = client.signIn();
      gis().callback({ access_token: 'token-abc' });
      await vi.advanceTimersByTimeAsync(USERINFO_TIMEOUT_MS);
      await expect(result).resolves.toEqual({ kind: 'error', reason: 'unavailable' });
    });

    it('AC5: a userinfo body that never finishes resolves as error/unavailable', async () => {
      const { client, gis } = await setup(() =>
        Promise.resolve(new Response(new ReadableStream({ start: () => undefined }))),
      );
      vi.useFakeTimers();
      const result = client.signIn();
      gis().callback({ access_token: 'token-abc' });
      await vi.advanceTimersByTimeAsync(USERINFO_TIMEOUT_MS);
      await expect(result).resolves.toEqual({ kind: 'error', reason: 'unavailable' });
    });

    it('clears the timer when userinfo answers in time', async () => {
      const { client, gis } = await setup();
      vi.useFakeTimers();
      const result = client.signIn();
      gis().callback({ access_token: 'token-abc' });
      await expect(result).resolves.toMatchObject({ kind: 'success' });
      expect(vi.getTimerCount()).toBe(0);
    });

    it('allows a new attempt after a timed-out one (AC6)', async () => {
      const { client, gis, requestAccessToken } = await setup(stalledUntilAborted);
      vi.useFakeTimers();
      const first = client.signIn();
      gis().callback({ access_token: 'token-abc' });
      await vi.advanceTimersByTimeAsync(USERINFO_TIMEOUT_MS);
      await first;
      const second = client.signIn();
      expect(second).not.toBe(first);
      expect(requestAccessToken).toHaveBeenCalledTimes(2);
      gis().error_callback?.({ type: 'popup_closed' });
      await expect(second).resolves.toEqual({ kind: 'cancelled' });
    });
  });

  describe('userinfo timeout: edge cases', () => {
    it('AC2: an answer just before the timeout still signs in', async () => {
      let answer: (r: Response) => void = () => undefined;
      const { client, gis } = await setup(
        () =>
          new Promise<Response>((resolve) => {
            answer = resolve;
          }),
      );
      vi.useFakeTimers();
      const result = client.signIn();
      gis().callback({ access_token: 'token-abc' });
      await vi.advanceTimersByTimeAsync(USERINFO_TIMEOUT_MS - 1);
      answer(jsonResponse({ sub: '1', email: 'jane@example.com', name: 'Jane' }));
      await expect(result).resolves.toMatchObject({ kind: 'success' });
      await vi.advanceTimersByTimeAsync(USERINFO_TIMEOUT_MS);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('AC6: a late answer of a timed-out request does not settle the next attempt', async () => {
      const answers: Array<(r: Response) => void> = [];
      const { client, gis } = await setup(
        () =>
          new Promise<Response>((resolve) => {
            answers.push(resolve);
          }),
      );
      vi.useFakeTimers();
      const first = client.signIn();
      gis().callback({ access_token: 'token-1' });
      await vi.advanceTimersByTimeAsync(USERINFO_TIMEOUT_MS);
      await expect(first).resolves.toEqual({ kind: 'error', reason: 'unavailable' });

      let secondSettled = false;
      const second = client.signIn().then((r) => {
        secondSettled = true;
        return r;
      });
      // The first request finally answers while the second attempt is waiting for its popup.
      answers[0]?.(jsonResponse({ sub: 'old', email: 'old@example.com', name: 'Old' }));
      await vi.advanceTimersByTimeAsync(0);
      expect(secondSettled).toBe(false);

      gis().error_callback?.({ type: 'popup_closed' });
      await expect(second).resolves.toEqual({ kind: 'cancelled' });
    });

    it('a popup_closed after a timed-out token is ignored until the next attempt starts', async () => {
      const { client, gis } = await setup(stalledUntilAborted);
      vi.useFakeTimers();
      const first = client.signIn();
      gis().callback({ access_token: 'token-1' });
      await vi.advanceTimersByTimeAsync(USERINFO_TIMEOUT_MS);
      await expect(first).resolves.toEqual({ kind: 'error', reason: 'unavailable' });
      expect(() => gis().error_callback?.({ type: 'popup_closed' })).not.toThrow();
      const second = client.signIn();
      gis().error_callback?.({ type: 'popup_failed_to_open' });
      await expect(second).resolves.toEqual({ kind: 'error', reason: 'popup_blocked' });
    });
  });

  describe('late GIS callbacks after a token was accepted', () => {
    it('AC2: popup_closed while userinfo is in flight does not turn success into cancelled', async () => {
      let answer: (r: Response) => void = () => undefined;
      const { client, gis } = await setup(
        () =>
          new Promise<Response>((resolve) => {
            answer = resolve;
          }),
      );
      const result = client.signIn();
      gis().callback({ access_token: 'token-abc' });
      gis().error_callback?.({ type: 'popup_closed' });
      answer(jsonResponse({ sub: '42', email: 'jane@example.com', name: 'Jane Doe' }));
      await expect(result).resolves.toEqual({
        kind: 'success',
        user: { provider: 'google', id: '42', email: 'jane@example.com', name: 'Jane Doe' },
      });
    });

    it('ignores a second token callback for the same attempt', async () => {
      const { client, gis, fetchFn } = await setup();
      const result = client.signIn();
      gis().callback({ access_token: 'token-abc' });
      gis().callback({ error: 'access_denied' });
      await expect(result).resolves.toMatchObject({ kind: 'success' });
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('a new attempt after a successful one reacts to popup_closed again (AC4)', async () => {
      const { client, gis } = await setup();
      const first = client.signIn();
      gis().callback({ access_token: 'token-abc' });
      await first;
      const second = client.signIn();
      gis().error_callback?.({ type: 'popup_closed' });
      await expect(second).resolves.toEqual({ kind: 'cancelled' });
    });
  });
});
