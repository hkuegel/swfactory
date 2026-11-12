import { createAppViteConfig } from '@swfactory/platform/config/vite';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { loadLandingData } from './build/landingData.ts';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const VIRTUAL_ID = 'virtual:landing-data';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

/** Serves `virtual:landing-data` (apps, figures) computed from the repository at build time. */
function landingData(): Plugin {
  return {
    name: 'landing-data',
    resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : undefined),
    load: (id) =>
      id === RESOLVED_ID
        ? `export default ${JSON.stringify(loadLandingData(repoRoot))};`
        : undefined,
  };
}

export default createAppViteConfig({
  plugins: [landingData()],
  build: {
    // Keep in sync with ROOT_ASSETS in scripts/check-dist.mjs and LANDING_ASSETS_DIR in
    // packages/platform/config/pages.ts. emptyOutDir false: the page is built into the _site that
    // already holds the apps (ADR 0011).
    assetsDir: '_landing',
    emptyOutDir: false,
  },
});
