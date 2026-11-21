import { createAppViteConfig } from '@swfactory/platform/config/vite';

export default createAppViteConfig({
  // Story 009 / ADR 0005: pre-bundle three at dev-server start, so the first lazy import() of
  // the 3D scene never triggers a "new dependencies optimized, reloading" page reload (flaky e2e).
  optimizeDeps: {
    include: [
      'three',
      'three/addons/geometries/RoundedBoxGeometry.js',
      // Story 050: the cinematic view's lazy chunk.
      'three/addons/postprocessing/EffectComposer.js',
      'three/addons/postprocessing/RenderPass.js',
      'three/addons/postprocessing/UnrealBloomPass.js',
      'three/addons/postprocessing/OutputPass.js',
      'three/addons/postprocessing/ShaderPass.js',
      'three/addons/environments/RoomEnvironment.js',
    ],
  },
  build: {
    // The lazy 3D scene chunk is ~550 kB minified; its real budget is the gzip limit in
    // dist-check.json (lazyChunks.gzipMaxKb), so the default 500 kB warning is noise.
    chunkSizeWarningLimit: 600,
  },
});
