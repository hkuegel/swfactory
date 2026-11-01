export interface Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
}

/** A promise plus its resolve function (like `Promise.withResolvers`, which is ES2024). */
export function createDeferred<T>(): Deferred<T> {
  let resolve: ((value: T) => void) | undefined;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  if (!resolve) throw new Error('Promise executor did not run synchronously');
  return { promise, resolve };
}
