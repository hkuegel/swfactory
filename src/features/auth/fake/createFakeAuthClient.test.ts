import { afterEach, describe, expect, it } from 'vitest';
import { createFakeAuthClient } from './createFakeAuthClient.ts';

afterEach(() => {
  delete window.__fakeGoogle;
});

describe('createFakeAuthClient', () => {
  it('AC3: signIn stays pending until the control settles it', async () => {
    const fake = createFakeAuthClient();
    let settled = false;
    const result = fake.signIn().then((r) => {
      settled = true;
      return r;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    fake.control.settleSignIn('cancelled');
    await expect(result).resolves.toEqual({ kind: 'cancelled' });
  });

  it('AC2: success returns the default account', async () => {
    const fake = createFakeAuthClient();
    const result = fake.signIn();
    fake.control.settleSignIn('success');
    await expect(result).resolves.toEqual({
      kind: 'success',
      user: { id: 'fake-ada', email: 'ada@example.com', name: 'Ada Lovelace' },
    });
  });

  it('AC11: an account without a name yields name null', async () => {
    const fake = createFakeAuthClient();
    fake.control.setAccount({ sub: 's', email: 'noname@example.com' });
    const result = fake.signIn();
    fake.control.settleSignIn('success');
    await expect(result).resolves.toEqual({
      kind: 'success',
      user: { id: 's', email: 'noname@example.com', name: null },
    });
  });

  it('AC11: a blank name yields name null', async () => {
    const fake = createFakeAuthClient();
    fake.control.setAccount({ sub: 's', email: 'blank@example.com', name: '  ' });
    const result = fake.signIn();
    fake.control.settleSignIn('success');
    await expect(result).resolves.toMatchObject({ user: { name: null } });
  });

  it('AC5: error resolves with an error result', async () => {
    const fake = createFakeAuthClient();
    const result = fake.signIn();
    fake.control.settleSignIn('error');
    await expect(result).resolves.toEqual({ kind: 'error', reason: 'unknown' });
  });

  it('returns the same promise while an attempt is pending', () => {
    const fake = createFakeAuthClient();
    expect(fake.signIn()).toBe(fake.signIn());
  });

  it('ignores settleSignIn when no attempt is pending', async () => {
    const fake = createFakeAuthClient();
    fake.control.settleSignIn('success');
    const result = fake.signIn();
    fake.control.settleSignIn('cancelled');
    await expect(result).resolves.toEqual({ kind: 'cancelled' });
  });

  it('exposes the control on window only with exposeControl', () => {
    createFakeAuthClient();
    expect(window.__fakeGoogle).toBeUndefined();
    const fake = createFakeAuthClient({ exposeControl: true });
    expect(window.__fakeGoogle).toBe(fake.control);
  });
});
