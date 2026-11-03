// Fails if an app's production bundle contains dev-only code (story 004 AC12, story 011 AC6).
// Usage: node scripts/check-dist.mjs [app ...]   (default: every directory in apps/ with a package.json)
// Forbidden strings come from packages/platform/dist-check.json (shared by every app) and from
// apps/<app>/dist-check.json (optional): { "forbidden": [...], "lazyChunks": [...] }.
// Plain Node instead of grep so it behaves the same on macOS and ubuntu CI.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PLATFORM_CONFIG = join(ROOT, 'packages', 'platform', 'dist-check.json');

/** Every problem is collected per app; the process exits 1 if any app has one. */
class CheckError extends Error {}

function fail(message) {
  throw new CheckError(message);
}

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((s) => typeof s === 'string' && s.length > 0);
}

/**
 * Reads and validates a dist-check.json; a missing file is `{}` only when `optional`.
 * `requireForbidden`: the list must have at least one entry (the platform's, shared by every app).
 */
function readConfig(path, optional, requireForbidden = false) {
  if (!existsSync(path)) {
    if (optional) return { forbidden: [], lazyChunks: [] };
    fail(`${path} not found`);
  }
  let config;
  try {
    config = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`${path} is not valid JSON: ${error.message}`);
  }
  const { forbidden = [], lazyChunks = [] } = config;
  if (!isStringArray(forbidden)) fail(`${path}: "forbidden" must be an array of non-empty strings`);
  if (requireForbidden && forbidden.length === 0) {
    fail(`${path}: "forbidden" must list at least one string (an empty list silences the check)`);
  }
  if (!Array.isArray(lazyChunks)) fail(`${path}: "lazyChunks" must be an array`);
  for (const chunk of lazyChunks) {
    const ok =
      chunk !== null &&
      typeof chunk === 'object' &&
      typeof chunk.marker === 'string' &&
      chunk.marker.length > 0 &&
      typeof chunk.entry === 'string' &&
      chunk.entry.length > 0 &&
      typeof chunk.gzipMaxKb === 'number' &&
      chunk.gzipMaxKb > 0;
    if (!ok) fail(`${path}: each lazyChunks entry needs marker, entry (strings) and gzipMaxKb`);
  }
  return { forbidden, lazyChunks };
}

function defaultApps() {
  const appsDir = join(ROOT, 'apps');
  if (!existsSync(appsDir)) return [];
  return readdirSync(appsDir)
    .filter((name) => existsSync(join(appsDir, name, 'package.json')))
    .sort();
}

/** Checks one app; returns the "ok" summary or throws a CheckError. */
function checkApp(app, platformForbidden) {
  const appDir = join(ROOT, 'apps', app);
  if (!existsSync(join(appDir, 'package.json')))
    fail(`apps/${app} is not an app (no package.json)`);
  const own = readConfig(join(appDir, 'dist-check.json'), true);
  const forbidden = [...new Set([...platformForbidden, ...own.forbidden])];

  const dist = join(appDir, 'dist');
  let files;
  try {
    files = listFiles(dist);
  } catch {
    return fail(`apps/${app}/dist not found; run the build first.`);
  }
  // Guard against a trivially passing check on an empty or wrong build output.
  if (!files.some((f) => f.endsWith('.js')) || !files.some((f) => f.endsWith('index.html'))) {
    fail(`apps/${app}/dist has no index.html and JS bundle; nothing meaningful to check.`);
  }

  const contents = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]));
  const rel = (f) => f.slice(ROOT.length);

  const hits = files.flatMap((file) =>
    forbidden.filter((s) => contents.get(file).includes(s)).map((s) => `${rel(file)}: "${s}"`),
  );
  if (hits.length > 0) {
    fail(`dev-only code found in the production bundle of ${app}:\n  ${hits.join('\n  ')}`);
  }

  // The entry chunk: index.html's module script and modulepreloads.
  const html = contents.get(join(dist, 'index.html'));
  const entryFiles = new Set(
    [
      ...html.matchAll(/<script\b[^>]*\btype="module"[^>]*\bsrc="([^"]+)"/g),
      ...html.matchAll(/<link\b[^>]*\brel="modulepreload"[^>]*\bhref="([^"]+)"/g),
    ].map((m) => join(dist, (m[1] ?? '').replace(/^(\.\/|\/)/, ''))),
  );

  const notes = [];
  for (const { marker, entry, gzipMaxKb } of own.lazyChunks) {
    // The marker must not be in the entry chunk (the code must be lazy-loaded only).
    const entryHits = [...entryFiles].filter((f) => contents.get(f)?.includes(marker));
    if (entryHits.length > 0) {
      fail(
        `"${marker}" found in the entry chunk of ${app} (must be lazy-loaded only):\n  ${entryHits.map(rel).join('\n  ')}`,
      );
    }
    // The lazy chunk must exist once its entry exists in the source (no vacuous pass) and stay
    // within the gzip budget.
    const chunks = files.filter(
      (f) => f.endsWith('.js') && !entryFiles.has(f) && contents.get(f).includes(marker),
    );
    if (chunks.length === 0) {
      if (existsSync(join(appDir, entry))) {
        fail(
          `${app}: ${entry} exists but no lazy chunk with "${marker}" was built; the check would be vacuous.`,
        );
      }
      notes.push(`no "${marker}" chunk yet`);
      continue;
    }
    const sizes = chunks.map((f) => ({ f, gzip: gzipSync(contents.get(f)).length }));
    const over = sizes.filter((s) => s.gzip > gzipMaxKb * 1024);
    if (over.length > 0) {
      fail(
        `lazy chunk of ${app} over the ${gzipMaxKb} kB gzip budget:\n  ${over
          .map((s) => `${rel(s.f)}: ${(s.gzip / 1024).toFixed(1)} kB gzip`)
          .join('\n  ')}`,
      );
    }
    notes.push(...sizes.map((s) => `lazy chunk ${(s.gzip / 1024).toFixed(1)} kB gzip`));
  }

  const extra = notes.length > 0 ? `, ${notes.join(', ')}` : '';
  return `check-dist: ok ${app} (${files.length} files, no dev-only strings${extra})`;
}

let platformForbidden;
try {
  platformForbidden = readConfig(PLATFORM_CONFIG, false, true).forbidden;
} catch (error) {
  console.error(`check-dist: ${error.message}`);
  process.exit(1);
}

const requested = process.argv.slice(2);
const apps = requested.length > 0 ? requested : defaultApps();
if (apps.length === 0) {
  console.error('check-dist: no apps found in apps/.');
  process.exit(1);
}

let failed = false;
for (const app of apps) {
  try {
    console.log(checkApp(app, platformForbidden));
  } catch (error) {
    if (!(error instanceof CheckError)) throw error;
    failed = true;
    console.error(`check-dist: ${error.message}`);
  }
}
process.exit(failed ? 1 : 0);
