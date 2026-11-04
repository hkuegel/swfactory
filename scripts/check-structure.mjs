// Structure and link guard (story 011, AC2, AC4). Part of `npm run verify`; exit 1 on any violation.
//   1. Factory files and the platform do not name an app (apps/<name>/), and the platform imports
//      nothing from an app. `.claude/agent-memory/**` is exempt (memories keep story numbers).
//   2. Every relative markdown link in the docs, READMEs, CHANGELOG and CLAUDE.md resolves.
//   3. Every story file of every backlog is listed exactly once in docs/backlog/README.md, and
//      story ids are unique across all backlogs, and the status in the index equals the
//      story's frontmatter `status:`.
// A common word as app name (e.g. "todo") causes false positives in rule 1: pick a distinctive
// name, or add an exemption below in the same change.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'coverage',
  'playwright-report',
  'test-results',
  '.vite',
  '.tmp',
  '.git',
]);
const TEXT_EXTENSIONS = /\.(md|mdx|ts|tsx|js|mjs|cjs|json|css|html|txt|yml|yaml)$/;
const problems = [];

const rel = (path) => relative(ROOT, path).split('\\').join('/');
const report = (path, line, message) =>
  problems.push(`${rel(path)}${line ? `:${line}` : ''}: ${message}`);

/** All files below `dir` (relative to the repo root), without the skipped directories. */
function walk(dir) {
  const path = join(ROOT, dir);
  if (!existsSync(path)) return [];
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path).flatMap((name) => {
    if (SKIP_DIRS.has(name)) return [];
    return walk(join(dir, name));
  });
}

const textFiles = (...dirs) => dirs.flatMap(walk).filter((f) => TEXT_EXTENSIONS.test(f));

const apps = existsSync(join(ROOT, 'apps'))
  ? readdirSync(join(ROOT, 'apps'), { withFileTypes: true })
      .filter((e) => e.isDirectory() && existsSync(join(ROOT, 'apps', e.name, 'package.json')))
      .map((e) => e.name)
      .sort()
  : [];

// --- Rule 1: no app names in the factory files and the platform ---------------------------------
const FACTORY = [
  'CLAUDE.md',
  '.claude/agents',
  '.claude/skills',
  'docs/templates',
  'templates',
  'packages/platform',
];
const factoryFiles = textFiles(...FACTORY);
for (const name of apps) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const word = new RegExp(`(?<![A-Za-z0-9])${escaped}(?![A-Za-z0-9])`, 'i');
  for (const file of factoryFiles) {
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((text, index) => {
        if (word.test(text)) {
          report(
            file,
            index + 1,
            `names the app "${name}" (factory files and the platform are app-agnostic)`,
          );
        }
      });
  }
}
// The platform imports nothing from an app (by package name or by path).
for (const file of textFiles('packages/platform').filter((f) => /\.(ts|tsx|mjs|js)$/.test(f))) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((text, index) => {
      const from = /(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/.exec(text)?.[1];
      if (from && (/^@swfactory\/(?!platform(?:\/|$))/.test(from) || /(?:^|\/)apps\//.test(from))) {
        report(file, index + 1, `imports "${from}" from an app (the platform must not)`);
      }
    });
}

// --- Rule 2: relative markdown links resolve ---------------------------------------------------
const markdownFiles = [
  ...textFiles('docs', 'README.md', 'CHANGELOG.md', 'CLAUDE.md', 'templates'),
  ...apps.flatMap((app) => textFiles(join('apps', app, 'docs'), join('apps', app, 'README.md'))),
  ...textFiles('packages/platform/README.md'),
].filter((f, i, all) => f.endsWith('.md') && all.indexOf(f) === i);

/** Markdown text without fenced code blocks and inline code (links in code are not links). */
function stripCode(text) {
  return text
    .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, (block) => block.replace(/[^\n]/g, ' '))
    .replace(/`[^`\n]*`/g, (span) => ' '.repeat(span.length));
}

for (const file of markdownFiles) {
  const text = stripCode(readFileSync(file, 'utf8'));
  const targets = [
    ...text.matchAll(/!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g),
    ...text.matchAll(/^\s*\[[^\]]+\]:\s*<?(\S+?)>?\s*$/gm),
  ];
  for (const match of targets) {
    const target = match[1];
    if (/^([a-z][a-z0-9+.-]*:|#|\/\/)/i.test(target)) continue; // URL, mailto, anchor
    const path = decodeURI(target.split('#')[0].split('?')[0]);
    if (path === '') continue;
    const line = text.slice(0, match.index).split('\n').length;
    if (!existsSync(resolve(dirname(file), path))) report(file, line, `dead link "${target}"`);
  }
}

// --- Rule 3: every story is listed once in the root backlog README; ids are unique -------------
const backlogDirs = ['docs/backlog', ...apps.map((app) => `apps/${app}/docs/backlog`)];
const stories = backlogDirs.flatMap((dir) =>
  existsSync(join(ROOT, dir))
    ? readdirSync(join(ROOT, dir))
        .filter((name) => /^\d{3}-.+\.md$/.test(name))
        .map((name) => join(ROOT, dir, name))
    : [],
);
const indexPath = join(ROOT, 'docs', 'backlog', 'README.md');
const listed = new Map(); // absolute story path -> number of links in the index
if (existsSync(indexPath)) {
  const indexText = stripCode(readFileSync(indexPath, 'utf8'));
  for (const match of indexText.matchAll(/\]\(\s*<?([^)\s>#]+\.md)(?:#[^)\s]*)?>?\s*\)/g)) {
    const target = resolve(dirname(indexPath), decodeURI(match[1]));
    listed.set(target, (listed.get(target) ?? 0) + 1);
  }
} else {
  report(indexPath, 0, 'backlog index not found');
}
// Status per story as written in the index table (last cell of the row that links the story).
const indexStatus = new Map();
if (existsSync(indexPath)) {
  for (const row of readFileSync(indexPath, 'utf8').split('\n')) {
    const link = /\]\(\s*<?([^)\s>#]+\.md)/.exec(row)?.[1];
    const cells = row.split('|').map((c) => c.trim());
    if (link && row.trim().startsWith('|')) {
      indexStatus.set(resolve(dirname(indexPath), decodeURI(link)), cells[cells.length - 2]);
    }
  }
}
const ids = new Map();
for (const story of stories) {
  const id = /^(\d{3})-/.exec(story.split('/').pop())[1];
  ids.set(id, [...(ids.get(id) ?? []), rel(story)]);
  const count = listed.get(story) ?? 0;
  if (count !== 1) {
    report(indexPath, 0, `story ${rel(story)} is listed ${count} times (must be exactly once)`);
  }
  const fmStatus = /^status:\s*([a-z-]+)/m.exec(readFileSync(story, 'utf8'))?.[1];
  const idxStatus = indexStatus.get(story);
  if (idxStatus !== undefined && fmStatus !== idxStatus) {
    report(
      indexPath,
      0,
      `story ${rel(story)}: index status "${idxStatus}" differs from frontmatter "${fmStatus}"`,
    );
  }
  const frontmatterId = /^id:\s*(\d+)/m.exec(readFileSync(story, 'utf8'))?.[1];
  if (frontmatterId !== undefined && frontmatterId.padStart(3, '0') !== id) {
    report(story, 0, `frontmatter id ${frontmatterId} does not match the file name`);
  }
}
for (const [id, files] of ids) {
  if (files.length > 1) problems.push(`story id ${id} is used more than once: ${files.join(', ')}`);
}

if (problems.length > 0) {
  console.error(`check-structure: ${problems.length} problem(s):`);
  problems.forEach((p) => console.error(`  ${p}`));
  process.exit(1);
}
console.log(
  `check-structure: ok (${apps.length} app(s): ${apps.join(', ')}; ${stories.length} stories; ` +
    `${markdownFiles.length} markdown files, ${factoryFiles.length} factory files scanned)`,
);
