import { existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Public base path of the GitHub Pages site. Keep in sync with PAGES_BASE in scripts/build-pages.mjs. */
export const PAGES_BASE = '/swfactory/';

/** Port of the strict static server of the pages tests (5173 dev, 5174 e2e). */
export const PAGES_PORT = 5175;

/**
 * Directory of the landing page's assets in `_site` (story 021, ADR 0011); not an app. Keep in sync
 * with ROOT_ASSETS in scripts/check-dist.mjs and `assetsDir` in landing/vite.config.ts.
 */
export const LANDING_ASSETS_DIR = '_landing';

/** Output of `npm run build:pages` (repo root `_site`): one directory per app plus the landing page. */
export const SITE_DIR = fileURLToPath(new URL('../../../_site', import.meta.url));

/**
 * The apps in `_site` (the landing assets are no app); throws when there are none, so a test over
 * them can't pass vacuously.
 */
export function listSiteApps(): string[] {
  const apps = existsSync(SITE_DIR)
    ? readdirSync(SITE_DIR)
        .filter(
          (name) => name !== LANDING_ASSETS_DIR && statSync(`${SITE_DIR}/${name}`).isDirectory(),
        )
        .sort()
    : [];
  if (apps.length === 0) {
    throw new Error(`listSiteApps: no apps in ${SITE_DIR}; run "npm run build:pages" first`);
  }
  return apps;
}
