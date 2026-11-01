import { describe, expect, it } from 'vitest';
import { createDeferred } from './createDeferred.ts';

describe('createDeferred', () => {
  it('resolves the promise with the given value', async () => {
    const deferred = createDeferred<number>();
    deferred.resolve(42);
    await expect(deferred.promise).resolves.toBe(42);
  });
});
