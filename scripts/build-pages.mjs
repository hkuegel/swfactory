// Builds every app for GitHub Pages into _site/<app>/ (story 018, ADR 0010): guest sign-in only
// (VITE_GUEST_ONLY=true), public base /swfactory/<app>/. Then checks exactly that artefact with
// `check-dist --guest-only --out _site`. Every directory in apps/ with a package.json is deployed,
// so a new app is published without a change here.
// Usage: node scripts/build-pages.mjs
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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
// command + arguments (story 021, finding L1).
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

const check = spawnSync(
  process.execPath,
  [join(ROOT, 'scripts', 'check-dist.mjs'), '--guest-only', '--out', SITE, '--base', PAGES_BASE],
  { cwd: ROOT, stdio: 'inherit' },
);
if (check.status !== 0) process.exit(1);

console.log(`build-pages: ok _site/ (${apps.join(', ')})`);
