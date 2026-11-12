// Structure and link guard (story 011, AC2, AC4). Part of `npm run verify`; exit 1 on any violation.
//   1. Factory files and the platform do not name an app (apps/<name>/), and the platform imports
//      nothing from an app. `.claude/agent-memory/**` is exempt (memories keep story numbers).
//   2. Every relative markdown link in the docs, READMEs, CHANGELOG and CLAUDE.md resolves.
//   3. Every story file of every backlog is listed exactly once in docs/backlog/README.md, and
//      story ids are unique across all backlogs, and the status in the index equals the
//      story's frontmatter `status:`.
//   4. A story with `status: done` and an id above 012 has the sections Review, Explanation and
//      Retrospective in this order, a non-empty Explanation of at most 15 lines of at most 120 characters, and a `### Cost`
//      table in the Retrospective (story 012).
// A common word as app name (e.g. "todo") causes false positives in rule 1: pick a distinctive
// name, or add an exemption below in the same change.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
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
  'landing',
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
  const id = /^(\d{3})-/.exec(basename(story))[1];
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

// --- Rule 4: record of a done story (cost table, explanation) -----------------------------------
const COST_HEADER = ['role', 'round', 'model', 'tokens', 'tool uses', 'duration'];
const MAX_EXPLANATION_LINES = 15;
const MAX_EXPLANATION_LINE_LENGTH = 120;

/** Cells of a markdown table row. */
const cellsOf = (row) =>
  row
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim());

/** Rule 4 problems of one done story as `[line, message]` pairs. */
function checkStoryRecord(raw) {
  const out = [];
  const lineAt = (offset) => raw.slice(0, offset).split('\n').length;
  const stripped = stripCode(raw); // same length as `raw`: offsets are shared
  const heading = (name) => new RegExp(`^## ${name}[ \\t]*$`, 'm').exec(stripped);
  const [review, explanation, retro] = ['Review', 'Explanation', 'Retrospective'].map(heading);
  if (
    !review ||
    !explanation ||
    !retro ||
    !(review.index < explanation.index) ||
    !(explanation.index < retro.index)
  ) {
    out.push([
      0,
      'missing or misplaced section: need "## Review", "## Explanation", "## Retrospective" in this order',
    ]);
    return out;
  }
  const body = (from, to) => raw.slice(from.index + from[0].length, to ? to.index : raw.length);
  const nextHeading = (from) => {
    const rest = stripped.slice(from.index + from[0].length);
    const next = /^## /m.exec(rest);
    return next ? { index: from.index + from[0].length + next.index } : undefined;
  };
  const explanationLines = body(explanation, retro)
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '' && !/^_orchestrator:.*_$/.test(l));
  const explanationLine = lineAt(explanation.index);
  if (explanationLines.length === 0) out.push([explanationLine, 'empty Explanation section']);
  if (explanationLines.length > MAX_EXPLANATION_LINES) {
    out.push([
      explanationLine,
      `Explanation longer than ${MAX_EXPLANATION_LINES} lines (${explanationLines.length})`,
    ]);
  }

  for (const line of explanationLines) {
    if (line.length > MAX_EXPLANATION_LINE_LENGTH) {
      out.push([
        explanationLine,
        `Explanation line longer than ${MAX_EXPLANATION_LINE_LENGTH} characters (${line.length}): "${line.slice(0, 30)}…"`,
      ]);
    }
  }

  const retroBody = body(retro, nextHeading(retro));
  const retroStart = retro.index + retro[0].length;
  const lines = retroBody.split('\n');
  // Structure is found in the code-stripped text (same line indices), so a fenced example is ignored.
  const strippedLines = stripped
    .slice(retroStart, nextHeading(retro)?.index ?? raw.length)
    .split('\n');
  const costAt = strippedLines.findIndex((l) => l.trim() === '### Cost');
  if (costAt < 0) {
    out.push([lineAt(retro.index), 'Retrospective has no "### Cost" heading']);
    return out;
  }
  const lineOfRow = (i) => lineAt(retroStart) + i;
  const tableStart = strippedLines.findIndex((l, i) => i > costAt && l.trim().startsWith('|'));
  if (tableStart < 0) {
    out.push([lineOfRow(costAt), 'no cost table after "### Cost"']);
    return out;
  }
  const rows = [];
  for (let i = tableStart; i < lines.length && strippedLines[i].trim().startsWith('|'); i++) {
    rows.push([i, cellsOf(lines[i])]);
  }
  const header = rows[0][1].map((c) => c.toLowerCase());
  if (header.join('|') !== COST_HEADER.join('|')) {
    out.push([lineOfRow(tableStart), `cost table header must be: ${COST_HEADER.join(' | ')}`]);
    return out;
  }
  const data = rows.slice(2); // skip header and separator
  const label = (c) => (c[0] ?? '').replace(/[*_]/g, '').trim();
  // Labels are plain text (story 022, finding L4): three readers count these rows — this check,
  // landing/src/lib/figures.ts and the pages oracle in landing/e2e/landing.helpers.ts, which does not
  // strip emphasis. Only a plain label makes them agree.
  for (const [i, c] of data) {
    if (/[*_]/.test(c[0] ?? '')) {
      out.push([lineOfRow(i), 'cost row label must be plain text (no markdown emphasis)']);
    }
  }
  const isTotal = ([, c]) => /^total/i.test(label(c));
  const isOrchestrator = ([, c]) => /^orchestrator \(main session\)/i.test(label(c));
  const runs = data.filter((r) => !isTotal(r) && !isOrchestrator(r));
  const totals = data.filter(isTotal);
  const orchestrators = data.filter(isOrchestrator);
  if (runs.length === 0) out.push([lineOfRow(tableStart), 'cost table has no agent run row']);
  for (const [i, c] of runs) {
    if (c.length !== 6 || c.some((cell) => cell === '')) {
      out.push([lineOfRow(i), 'cost row needs six non-empty cells']);
    } else if (!(
      /^(\d+|n\/a)$/.test(c[3]) &&
      /^(\d+|n\/a)$/.test(c[4]) &&
      /^(\d+:\d{2}(:\d{2})?|n\/a)$/.test(c[5])
    )) {
      out.push([
        lineOfRow(i),
        'cost row: Tokens and Tool uses are integers, Duration is m:ss, or n/a',
      ]);
    }
  }
  if (totals.length !== 1) {
    out.push([
      lineOfRow(tableStart),
      `cost table needs exactly one row labelled "total (measured)" (found ${totals.length})`,
    ]);
  } else {
    const toSeconds = (cell) =>
      /^\d+(:\d{2}){1,2}$/.test(cell)
        ? cell.split(':').reduce((s, part) => s * 60 + parseInt(part, 10), 0)
        : undefined;
    const toNumber = (cell) => (/^\d+$/.test(cell) ? parseInt(cell, 10) : undefined);
    const columns = [
      [3, 'Tokens', toNumber],
      [4, 'Tool uses', toNumber],
      [5, 'Duration', toSeconds],
    ];
    for (const [index, name, parse] of columns) {
      const values = runs.map(([, c]) => parse(c[index] ?? '')).filter((v) => v !== undefined);
      const sum = values.reduce((s, v) => s + v, 0);
      const cell = totals[0][1][index] ?? '';
      // The cell is the figure alone (Tokens may continue with a note after a space).
      const figure = index === 3 ? (/^(\S+)(\s|$)/.exec(cell)?.[1] ?? '') : cell;
      const ok = values.length === 0 ? figure === 'n/a' : parse(figure) === sum;
      if (!ok) {
        out.push([
          lineOfRow(totals[0][0]),
          `total ${name} "${cell}" is not the sum of the run rows (${values.length === 0 ? 'n/a' : sum})`,
        ]);
      }
    }
    if (orchestrators.length === 1 && orchestrators[0][0] < totals[0][0]) {
      out.push([lineOfRow(orchestrators[0][0]), 'orchestrator row must come after the total row']);
    }
  }
  if (orchestrators.length !== 1) {
    out.push([
      lineOfRow(tableStart),
      `cost table needs exactly one row labelled "orchestrator (main session)" (found ${orchestrators.length})`,
    ]);
  } else {
    const cell = orchestrators[0][1][3] ?? '';
    if (!(cell === 'not measured' || cell.startsWith('estimate'))) {
      out.push([
        lineOfRow(orchestrators[0][0]),
        'orchestrator Tokens must be "not measured" or start with "estimate"',
      ]);
    }
  }
  return out;
}

for (const story of stories) {
  const raw = readFileSync(story, 'utf8');
  const status = /^status:\s*([a-z-]+)/m.exec(raw)?.[1];
  const id = parseInt(/^(\d{3})-/.exec(basename(story))[1], 10);
  if (status !== 'done' || id <= 12) continue;
  for (const [line, message] of checkStoryRecord(raw)) report(story, line, message);
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
