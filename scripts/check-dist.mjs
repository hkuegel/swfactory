// Fails if an app's production bundle contains dev-only code (story 004 AC12, story 011 AC6) or,
// in the guest-only deploy build, Google sign-in code (story 018, ADR 0010).
// Usage: node scripts/check-dist.mjs [--guest-only] [--out <dir>] [--base <prefix>] [app ...]
//   (default apps: every directory in apps/ with a package.json)
// Mode: `standard` (default) or `guestOnly` (--guest-only); the caller states it, the check never
// reads VITE_GUEST_ONLY, and the rules are symmetric (a build checked in the wrong mode fails).
// Where: without --out `apps/<app>/dist`; with --out `<dir>/<app>`, and then every top-level entry
// of <dir> must be a checked app (the uploaded artefact is checked completely).
// Base: URL prefix of the build (default `/`); with --out an app lives under `<base><app>/`.
// Config: packages/platform/dist-check.json (shared by every app) and apps/<app>/dist-check.json
// (optional): { forbidden, lazyChunks, standard: { forbidden, required }, guestOnly: { ... } }.
// Plain Node instead of grep so it behaves the same on macOS and ubuntu CI.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PLATFORM_CONFIG = join(ROOT, 'packages', 'platform', 'dist-check.json');
const MODES = ['standard', 'guestOnly'];
const TOP_KEYS = ['forbidden', 'lazyChunks', ...MODES];

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
 * Reads and validates a dist-check.json; a missing file is empty only when `optional`.
 * `isPlatform`: the lists that every app relies on must not be empty (an empty list silences
 * the check).
 */
function readConfig(path, optional, isPlatform = false) {
  const none = { forbidden: [], required: [] };
  const empty = { forbidden: [], lazyChunks: [], standard: none, guestOnly: none };
  if (!existsSync(path)) {
    if (optional) return empty;
    fail(`${path} not found`);
  }
  let config;
  try {
    config = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`${path} is not valid JSON: ${error.message}`);
  }
  if (config === null || typeof config !== 'object' || Array.isArray(config)) {
    fail(`${path}: must be a JSON object`);
  }
  const unknown = Object.keys(config).filter((k) => !TOP_KEYS.includes(k));
  if (unknown.length > 0) {
    fail(
      `${path}: unknown key(s) ${unknown.map((k) => `"${k}"`).join(', ')} (allowed: ${TOP_KEYS.join(', ')})`,
    );
  }
  const { forbidden = [], lazyChunks = [] } = config;
  if (!isStringArray(forbidden)) fail(`${path}: "forbidden" must be an array of non-empty strings`);
  if (isPlatform && forbidden.length === 0) {
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
  const result = { forbidden, lazyChunks };
  for (const mode of MODES) {
    const section = config[mode] ?? {};
    if (section === null || typeof section !== 'object' || Array.isArray(section)) {
      fail(`${path}: "${mode}" must be an object`);
    }
    const badKey = Object.keys(section).find((k) => k !== 'forbidden' && k !== 'required');
    if (badKey) fail(`${path}: unknown key "${mode}.${badKey}" (allowed: forbidden, required)`);
    for (const key of ['forbidden', 'required']) {
      const list = section[key] ?? [];
      if (!isStringArray(list))
        fail(`${path}: "${mode}.${key}" must be an array of non-empty strings`);
    }
    result[mode] = { forbidden: section.forbidden ?? [], required: section.required ?? [] };
  }
  if (isPlatform) {
    if (result.standard.forbidden.length === 0) {
      fail(`${path}: "standard.forbidden" must list at least one string`);
    }
    if (result.guestOnly.required.length === 0) {
      fail(`${path}: "guestOnly.required" must list at least one string`);
    }
  }
  return result;
}

function defaultApps() {
  const appsDir = join(ROOT, 'apps');
  if (!existsSync(appsDir)) return [];
  return readdirSync(appsDir)
    .filter((name) => existsSync(join(appsDir, name, 'package.json')))
    .sort();
}

/** Asset URLs that index.html loads: module scripts, modulepreloads and stylesheets. */
function entryUrls(html) {
  const urls = [];
  for (const [tag, name] of [...html.matchAll(/<(script|link)\b[^>]*>/g)].map((m) => [
    m[0],
    m[1],
  ])) {
    const attr = (a) => tag.match(new RegExp(`\\b${a}="([^"]*)"`))?.[1];
    if (name === 'script' && attr('type') === 'module' && attr('src')) urls.push(attr('src'));
    if (name === 'link' && attr('href') && ['modulepreload', 'stylesheet'].includes(attr('rel'))) {
      urls.push(attr('href'));
    }
  }
  return urls;
}

/** Checks one app; returns the "ok" summary or throws a CheckError. */
function checkApp(app, platform, options) {
  const { mode, out, base } = options;
  const appDir = join(ROOT, 'apps', app);
  if (!existsSync(join(appDir, 'package.json')))
    fail(`apps/${app} is not an app (no package.json)`);
  const own = readConfig(join(appDir, 'dist-check.json'), true);
  const forbidden = [
    ...new Set([
      ...platform.forbidden,
      ...own.forbidden,
      ...platform[mode].forbidden,
      ...own[mode].forbidden,
    ]),
  ];
  const required = [...new Set([...platform[mode].required, ...own[mode].required])];

  const dist = out ? join(out, app) : join(appDir, 'dist');
  const rel = (f) => (f.startsWith(ROOT) ? f.slice(ROOT.length) : f);
  let files;
  try {
    files = listFiles(dist);
  } catch {
    return fail(`${rel(dist)} not found; run the build first.`);
  }
  // Guard against a trivially passing check on an empty or wrong build output.
  if (!files.some((f) => f.endsWith('.js')) || !files.some((f) => f.endsWith('index.html'))) {
    fail(`${rel(dist)} has no index.html and JS bundle; nothing meaningful to check.`);
  }

  const contents = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]));

  const hits = files.flatMap((file) =>
    forbidden.filter((s) => contents.get(file).includes(s)).map((s) => `${rel(file)}: "${s}"`),
  );
  if (hits.length > 0) {
    fail(`code that must not be in the ${mode} build of ${app}:\n  ${hits.join('\n  ')}`);
  }
  const missing = required.filter((s) => !files.some((f) => contents.get(f).includes(s)));
  if (missing.length > 0) {
    fail(
      `${app}: string(s) required in the ${mode} build not found in any file: ${missing.map((s) => `"${s}"`).join(', ')}`,
    );
  }

  // The entry chunk: index.html's module scripts, modulepreloads and stylesheets. Each URL must
  // lie under the base and name an existing file; else a subpath deploy would 404 (and the lazy
  // chunk checks below would resolve the wrong files and pass vacuously).
  const prefix = out ? `${base}${app}/` : base;
  const html = contents.get(join(dist, 'index.html'));
  const urls = entryUrls(html);
  if (!urls.some((u) => /\.m?js(\?|#|$)/.test(u))) {
    fail(`${app}: index.html loads no module script; nothing meaningful to check.`);
  }
  const entryFiles = new Set();
  for (const url of urls) {
    const path = url.startsWith(prefix)
      ? join(dist, url.slice(prefix.length).split(/[?#]/)[0])
      : '';
    const inside = path !== '' && (path + sep).startsWith(dist + sep);
    if (!inside || !contents.has(path)) {
      fail(
        `${app}: entry asset "${url}" is outside the base "${prefix}" or missing from the build`,
      );
    }
    entryFiles.add(path);
  }

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
  return `check-dist: ok ${app} (${mode}, ${files.length} files${extra})`;
}

function usage(message) {
  console.error(`check-dist: ${message}`);
  console.error(
    'usage: node scripts/check-dist.mjs [--guest-only] [--out <dir>] [--base <prefix>] [app ...]',
  );
  process.exit(2);
}

// --- command line
let mode = 'standard';
let out;
let base = '/';
const requested = [];
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === '--guest-only') mode = 'guestOnly';
  else if (arg === '--out' || arg === '--base') {
    const value = argv[++i];
    if (value === undefined || value.startsWith('--')) usage(`${arg} needs a value`);
    if (arg === '--out') out = resolve(process.cwd(), value);
    else base = value;
  } else if (arg.startsWith('--')) usage(`unknown option ${arg}`);
  else requested.push(arg);
}
if (!base.startsWith('/') || !base.endsWith('/'))
  usage(`--base must start and end with "/", got "${base}"`);

let platform;
try {
  platform = readConfig(PLATFORM_CONFIG, false, true);
} catch (error) {
  console.error(`check-dist: ${error.message}`);
  process.exit(1);
}

const apps = requested.length > 0 ? requested : defaultApps();
if (apps.length === 0) {
  console.error('check-dist: no apps found in apps/.');
  process.exit(1);
}

let failed = false;
if (out) {
  // Every file of the artefact is checked: the directory exists and holds nothing but checked apps.
  if (!existsSync(out) || !statSync(out).isDirectory()) {
    console.error(`check-dist: --out ${relative(ROOT, out) || out} is not a directory`);
    process.exit(1);
  }
  for (const entry of readdirSync(out)) {
    const isApp = apps.includes(entry) && statSync(join(out, entry)).isDirectory();
    if (!isApp) {
      failed = true;
      console.error(`check-dist: unchecked entry "${entry}" in ${relative(ROOT, out) || out}`);
    }
  }
}
for (const app of apps) {
  try {
    console.log(checkApp(app, platform, { mode, out, base }));
  } catch (error) {
    if (!(error instanceof CheckError)) throw error;
    failed = true;
    console.error(`check-dist: ${error.message}`);
  }
}
process.exit(failed ? 1 : 0);
