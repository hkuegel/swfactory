// Fails if the production bundle in dist/ contains dev-only code (story 004, AC12).
// Plain Node instead of grep so it behaves the same on macOS and ubuntu CI.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = 'dist';
const FORBIDDEN = ['Sign in as guest', '__fakeGoogle', '__minesweeperMines', '__board3dProbe'];

// Story 009 / ADR 0005: three.js lives only in a lazy chunk, loaded when "3D" is first chosen.
// `THREE.WebGLRenderer` is a literal in three's build; it marks the chunk that contains three.
const THREE_MARKER = 'THREE.WebGLRenderer';
const SCENE_CHUNK_GZIP_MAX = 180 * 1024; // gate-1 budget of story 009
// Once the lazy scene entry exists in the source, the scene chunk is mandatory in dist/ (so the
// checks below can't pass vacuously). Before that (story 009 not implemented yet) they are skipped.
const SCENE_ENTRY = 'src/features/minesweeper/scene3d/createBoardScene.ts';

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

let files;
try {
  files = listFiles(DIST);
} catch {
  console.error(`check-dist: ${DIST}/ not found; run "vite build" first.`);
  process.exit(1);
}

// Guard against a trivially passing check on an empty or wrong build output.
if (!files.some((f) => f.endsWith('.js')) || !files.some((f) => f.endsWith('index.html'))) {
  console.error(
    `check-dist: ${DIST}/ has no index.html and JS bundle; nothing meaningful to check.`,
  );
  process.exit(1);
}

const hits = files.flatMap((file) => {
  const content = readFileSync(file, 'utf8');
  return FORBIDDEN.filter((s) => content.includes(s)).map((s) => `${file}: "${s}"`);
});

if (hits.length > 0) {
  console.error('check-dist: dev-only code found in the production bundle:');
  hits.forEach((h) => console.error(`  ${h}`));
  process.exit(1);
}

// three must not be in the entry chunk (index.html's module script and modulepreloads).
const html = readFileSync(join(DIST, 'index.html'), 'utf8');
const entryFiles = new Set(
  [
    ...html.matchAll(/<script\b[^>]*\btype="module"[^>]*\bsrc="([^"]+)"/g),
    ...html.matchAll(/<link\b[^>]*\brel="modulepreload"[^>]*\bhref="([^"]+)"/g),
  ].map((m) => join(DIST, (m[1] ?? '').replace(/^(\.\/|\/)/, ''))),
);
const entryHits = [...entryFiles].filter(
  (f) => existsSync(f) && readFileSync(f, 'utf8').includes(THREE_MARKER),
);
if (entryHits.length > 0) {
  console.error('check-dist: three.js found in the entry chunk (must be lazy-loaded only):');
  entryHits.forEach((h) => console.error(`  ${h}`));
  process.exit(1);
}

// Lazy scene chunk: must exist (once 009 is implemented) and stay within the gzip budget.
const sceneChunks = files.filter(
  (f) => f.endsWith('.js') && !entryFiles.has(f) && readFileSync(f, 'utf8').includes(THREE_MARKER),
);
let sceneNote = 'no scene chunk yet';
if (sceneChunks.length === 0) {
  if (existsSync(SCENE_ENTRY)) {
    console.error(
      `check-dist: ${SCENE_ENTRY} exists but no lazy chunk with three was built; check is vacuous.`,
    );
    process.exit(1);
  }
} else {
  const sizes = sceneChunks.map((f) => ({ f, gzip: gzipSync(readFileSync(f)).length }));
  const over = sizes.filter((s) => s.gzip > SCENE_CHUNK_GZIP_MAX);
  if (over.length > 0) {
    console.error(
      `check-dist: scene chunk over the ${SCENE_CHUNK_GZIP_MAX / 1024} kB gzip budget:`,
    );
    over.forEach((s) => console.error(`  ${s.f}: ${(s.gzip / 1024).toFixed(1)} kB gzip`));
    process.exit(1);
  }
  sceneNote = sizes.map((s) => `scene chunk ${(s.gzip / 1024).toFixed(1)} kB gzip`).join(', ');
}

console.log(`check-dist: ok (${files.length} files, no dev-only strings, ${sceneNote})`);
