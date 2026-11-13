import { defineConfig } from 'vitest/config';

// Story 026: the tests of the factory scripts. `scripts/` is not an npm workspace, so the workspace
// `test` script never sees it; this config names its own include and the node environment.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['scripts/**/*.test.mjs'],
  },
});
