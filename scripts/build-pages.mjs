// Builds every app for GitHub Pages into _site/<app>/ (story 018, ADR 0010): guest sign-in only
// (VITE_GUEST_ONLY=true), public base /swfactory/<app>/. Then checks exactly that artefact with
// `check-dist --guest-only --out _site`. Then the landing page (story 021, ADR 0011) is built into
// the site root: _site/index.html + _site/_landing/. Every directory in apps/ with a package.json is deployed,
// so a new app is published without a change here.
// Usage: node scripts/build-pages.mjs
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
// Keep in sync with PAGES_BASE in packages/platform/config/pages.ts (a mismatch 404s every pages test).
const PAGES_BASE = '/swfactory/';
const SITE = join(ROOT, '_site');

const appsDir = join(ROOT, 'apps');
const apps = existsSync(appsDir)
  ? readdirSync(appsDir)
      .filter((name) => existsSync(join(appsDir, name, 'package.json')))
      .sort()
  : [];
if (apps.length === 0) {
  console.error('build-pages: no apps found in apps/.');
  process.exit(1);
}

// A stale _site must never be uploaded.
rmSync(SITE, { recursive: true, force: true });

const win = process.platform === 'win32';
const vitePath = join(ROOT, 'node_modules', '.bin', win ? 'vite.cmd' : 'vite');
// With a shell the command must be quoted: an unquoted path with a space reads as
// command + arguments (story 022, finding L1).
const vite = win ? `"${vitePath}"` : vitePath;
for (const app of apps) {
  const result = spawnSync(
    vite,
    ['build', '--base', `${PAGES_BASE}${app}/`, '--outDir', join(SITE, app), '--emptyOutDir'],
    {
      cwd: join(appsDir, app),
      env: { ...process.env, VITE_GUEST_ONLY: 'true' },
      stdio: 'inherit',
      // Node >= 23 refuses to spawn .cmd shims without a shell (EINVAL on Windows).
      shell: process.platform === 'win32',
    },
  );
  if (result.status !== 0) {
    console.error(`build-pages: build of ${app} failed`);
    process.exit(1);
  }
}

// Landing page: an SSR bundle (rendered here) and the client build, both with the same base (else
// the rendered app links would not carry it). The client build keeps the app directories
// (`emptyOutDir: false` in landing/vite.config.ts; `assetsDir` there is `_landing`).
const landingDir = join(ROOT, 'landing');
const landingBuilds = [
  ['build', '--ssr', 'src/entry-server.tsx', '--base', PAGES_BASE, '--outDir', 'dist/server'],
  ['build', '--base', PAGES_BASE, '--outDir', SITE],
];
rmSync(join(landingDir, 'dist'), { recursive: true, force: true });
for (const args of landingBuilds) {
  // Same as the app builds above: on Windows the .cmd shim needs a shell (story 022).
  const result = spawnSync(vite, args, { cwd: landingDir, stdio: 'inherit', shell: win });
  if (result.status !== 0) {
    console.error('build-pages: build of the landing page failed');
    process.exit(1);
  }
}
const serverEntry = join(landingDir, 'dist', 'server', 'entry-server.js');
if (!existsSync(serverEntry)) {
  console.error(`build-pages: ${serverEntry} not found after the landing SSR build`);
  process.exit(1);
}
const { render } = await import(pathToFileURL(serverEntry).href);
const markup = render();
const OUTLET = '<!--ssr-outlet-->';
const indexFile = join(SITE, 'index.html');
const template = existsSync(indexFile) ? readFileSync(indexFile, 'utf8') : '';
if (typeof markup !== 'string' || markup.trim() === '') {
  console.error('build-pages: the landing page rendered no markup');
  process.exit(1);
}
if (!template.includes(OUTLET)) {
  console.error(`build-pages: ${OUTLET} not found in _site/index.html`);
  process.exit(1);
}
// A replacer function: the markup may contain "$&" and the like.
writeFileSync(
  indexFile,
  template.replace(OUTLET, () => markup),
);

const check = spawnSync(
  process.execPath,
  [join(ROOT, 'scripts', 'check-dist.mjs'), '--guest-only', '--out', SITE, '--base', PAGES_BASE],
  { cwd: ROOT, stdio: 'inherit' },
);
if (check.status !== 0) process.exit(1);

console.log(`build-pages: ok _site/ (landing page, ${apps.join(', ')})`);
