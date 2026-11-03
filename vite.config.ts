import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // Story 009 / ADR 0005: pre-bundle three at dev-server start, so the first lazy import() of
  // the 3D scene never triggers a "new dependencies optimized, reloading" page reload (flaky e2e).
  optimizeDeps: {
    include: ['three', 'three/addons/geometries/RoundedBoxGeometry.js'],
  },
  build: {
    // The lazy 3D scene chunk is ~550 kB minified; its real budget is the gzip limit in
    // scripts/check-dist.mjs (SCENE_CHUNK_GZIP_MAX), so the default 500 kB warning is noise.
    chunkSizeWarningLimit: 600,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
});
