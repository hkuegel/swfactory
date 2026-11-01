// Fails if the production bundle in dist/ contains dev-only code (story 004, AC12).
// Plain Node instead of grep so it behaves the same on macOS and ubuntu CI.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const FORBIDDEN = ['Sign in as guest', '__fakeGoogle'];

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

console.log(`check-dist: ok (${files.length} files, no dev-only strings)`);
