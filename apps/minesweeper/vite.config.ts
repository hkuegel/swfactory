import { createAppViteConfig } from '@swfactory/platform/config/vite';

export default createAppViteConfig({
  // Story 009 / ADR 0005: pre-bundle three at dev-server start, so the first lazy import() of
  // the 3D scene never triggers a "new dependencies optimized, reloading" page reload (flaky e2e).
  optimizeDeps: {
    include: ['three', 'three/addons/geometries/RoundedBoxGeometry.js'],
  },
  build: {
    // The lazy 3D scene chunk is ~550 kB minified; its real budget is the gzip limit in
    // dist-check.json (lazyChunks.gzipMaxKb), so the default 500 kB warning is noise.
    chunkSizeWarningLimit: 600,
  },
});
