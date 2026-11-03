// Creates apps/<name> from the skeleton in templates/app (story 011, AC3, AC7).
//   node scripts/new-app.mjs <name> [--title "<Title>"]   new app; refuses an existing directory
//   node scripts/new-app.mjs <name> --reset               /rebuild: replace src/, e2e/ and public/
//                                                          of an existing app by the skeleton's
//                                                          versions; everything else stays
// The skeleton's placeholders are __NAME__ (slug) and __TITLE__ (page title). They only occur
// inside string literals, JSON values, HTML text or code spans, so the template stays valid
// TS/JSON/Markdown and passes lint and prettier unchanged.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TEMPLATE = join(ROOT, 'templates', 'app');
const NAME_PATTERN = /^[a-z][a-z0-9-]*$/;
// Names that would collide with repo directories or match every sentence of the factory files
// (scripts/check-structure.mjs forbids app names there, as whole words).
const RESERVED = new Set([
  'app',
  'apps',
  'platform',
  'package',
  'packages',
  'template',
  'templates',
]);
// The title ends up in TS/JSX string literals, JSON and HTML text: keep it free of characters
// that would need escaping in any of them.
const TITLE_PATTERN = /^[^"'`\\<>&${}\u0000-\u001f]{1,60}$/u;

function usage(message) {
  if (message) console.error(`new-app: ${message}`);
  console.error('usage: node scripts/new-app.mjs <name> [--title "<Title>"] [--reset]');
  process.exit(1);
}

function parseArgs(argv) {
  const args = { name: undefined, title: undefined, reset: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--reset') args.reset = true;
    else if (arg === '--title') {
      args.title = argv[++i];
      if (args.title === undefined) usage('--title needs a value');
    } else if (arg.startsWith('--')) usage(`unknown option ${arg}`);
    else if (args.name === undefined) args.name = arg;
    else usage(`unexpected argument ${arg}`);
  }
  return args;
}

/** "my-cool-app" -> "My Cool App" */
function titleFromName(name) {
  return name
    .split('-')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

function listFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

/** Copies one directory (or file) of the skeleton to the app, filling the placeholders. */
function copyFilled(relative, appDir, name, title) {
  const source = join(TEMPLATE, relative);
  const files = statSync(source).isDirectory() ? listFiles(source) : [source];
  for (const file of files) {
    const target = join(appDir, file.slice(TEMPLATE.length + 1));
    mkdirSync(dirname(target), { recursive: true });
    const text = readFileSync(file, 'utf8')
      .split('__NAME__')
      .join(name)
      .split('__TITLE__')
      .join(title);
    writeFileSync(target, text);
  }
  return files.length;
}

const { name, title: titleArg, reset } = parseArgs(process.argv.slice(2));
if (name === undefined) usage('missing app name');
if (!NAME_PATTERN.test(name)) usage(`"${name}" is not a valid name (lowercase letters, digits, -)`);
if (RESERVED.has(name)) usage(`"${name}" is a reserved name`);
if (!existsSync(TEMPLATE)) usage('templates/app not found');

const appDir = join(ROOT, 'apps', name);

if (reset) {
  if (!existsSync(join(appDir, 'index.html')))
    usage(`apps/${name} does not exist (nothing to reset)`);
  // The title of an existing app is the one in its index.html.
  const html = readFileSync(join(appDir, 'index.html'), 'utf8');
  const title = titleArg ?? /<title>([^<]+)<\/title>/.exec(html)?.[1];
  if (title === undefined || !TITLE_PATTERN.test(title))
    usage('cannot read a valid title from index.html');
  let count = 0;
  for (const dir of ['src', 'e2e', 'public']) {
    rmSync(join(appDir, dir), { recursive: true, force: true });
    count += copyFilled(dir, appDir, name, title);
  }
  console.log(
    `new-app: reset apps/${name}/{src,e2e,public} to the skeleton (${count} files, title "${title}").`,
  );
  console.log('new-app: kept package.json, configs, dist-check.json, docs/ and index.html.');
  process.exit(0);
}

const title = titleArg ?? titleFromName(name);
if (!TITLE_PATTERN.test(title))
  usage('the title may not contain quotes, backslashes, <, >, &, $, { or }');
if (existsSync(appDir)) usage(`apps/${name} already exists`);

const count = copyFilled('.', appDir, name, title);
console.log(`new-app: created apps/${name} (${count} files, title "${title}").`);
console.log('next: npm install');
console.log(`      npm run verify -w apps/${name}`);
console.log(`      npm run test:e2e -w apps/${name}`);
console.log(
  '      npm run check:structure   (the name must not be a common word in the factory files)',
);
