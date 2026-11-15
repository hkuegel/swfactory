#!/usr/bin/env node
// Structure and link guard (story 011, AC2, AC4; story 026 adds the size rules). Part of `npm run
// verify`; exit 1 on any violation.
//   1. Factory files and the platform do not name an app (apps/<name>/), and the platform imports
//      nothing from an app. `.claude/agent-memory/**` is exempt (memories keep story numbers).
//   2. Every relative markdown link in the docs, READMEs, CHANGELOG and CLAUDE.md resolves.
//   3. Every story file of every backlog is listed exactly once in docs/backlog/README.md, and
//      story ids are unique across all backlogs, and the status in the index equals the
//      story's frontmatter `status:`.
//   4. A story with `status: done` and an id above 012 has the sections Review, Explanation and
//      Retrospective in this order, a non-empty Explanation of at most 15 lines of at most 120
//      characters, and a `### Cost` table in the Retrospective (story 012).
//   5. Story 026 (size): a story from 026 on declares `size: S | M | L`. `size: S` means at most
//      three ACs and needs no Review section and no Cost table, only the Explanation. A Cost table of
//      a `size: M` or `size: L` story may not say `n/a` in every row: a row is measured or says
//      `not measured` with the reason. Both rules read only the story text, and apply from 026 on, so
//      the record of an earlier story is not rewritten.
//   6. (story 026, R4) the checks a change can affect: `scripts/verify.mjs`.
//   7. Story 039: a test in an e2e spec that compares rendered pixels or frame timing carries the tag
//      `@timing` in its own options.
//   8. Story 040, from story 040 on: an Open questions line names the kind that is hak's, every
//      Decision-log line says whose it is, and a `status: ready` story has no open question.
//   9. Story 041, from story 041 on: a proposal line in the Retrospective names the file it changes or
//      says it is a record only, and a `PNN` is not used in two stories' records (P27).
//   10. Story 043: at most one story across all backlogs is in flight (designed, in-progress, in-test,
//      in-review).
// Every rule takes its input as data, so a test passes its own fixture text (P16) and reads no
// repository (P17); the scan calls them with the files it walks once.
// A common word as app name (e.g. "todo") causes false positives in rule 1: pick a distinctive
// name, or add an exemption below in the same change.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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

// One walk of the tree, shared by every rule (P17), and one read per file.
const walked = walk('.').filter((f) => TEXT_EXTENSIONS.test(f));
const readOf = new Map();
const textOf = (file) => {
  if (!readOf.has(file)) readOf.set(file, readFileSync(file, 'utf8'));
  return readOf.get(file);
};
const inDirs = (...dirs) =>
  walked.filter((f) => dirs.some((d) => rel(f) === d || rel(f).startsWith(`${d}/`)));

function appsHere() {
  const dir = join(ROOT, 'apps');
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(ROOT, 'apps', e.name, 'package.json')))
    .map((e) => e.name)
    .sort();
}

// --- Rules 4 and 5: the record of a story (cost table, explanation, size) ------------------------
const COST_HEADER = ['role', 'round', 'model', 'tokens', 'tool uses', 'duration'];
const MAX_EXPLANATION_LINES = 15;
const MAX_EXPLANATION_LINE_LENGTH = 120;
const FIRST_SIZE_STORY = 26; // the story that introduced `size:` and the measured-cost rule
const MAX_AC_OF_S = 3;
const SIZES = ['S', 'M', 'L'];

/** Frontmatter `size:`; a story before the rule is read as M, so its record is not rewritten. */
export function sizeOf(raw) {
  const size = /^size:\s*([SML])\b/m.exec(raw)?.[1];
  return size === undefined ? 'M' : size;
}

/** Counted AC markers of a story, the number a `size: S` story may not exceed. */
export function acCount(raw) {
  return (raw.match(/^- \*\*AC\d+:/gm) ?? []).length;
}

/** Cells of a markdown table row. */
const cellsOf = (row) =>
  row
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim());

/** Markdown text without fenced code blocks and inline code (links in code are not links). */
function stripCode(text) {
  return text
    .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, (block) => block.replace(/[^\n]/g, ' '))
    .replace(/`[^`\n]*`/g, (span) => ' '.repeat(span.length));
}

/** Rule 4 and 5 problems of one story as `[line, message]` pairs, read from the story text only. */
export function checkStoryRecord(raw, size = 'M', id = 0) {
  const out = [];
  const lineAt = (offset) => raw.slice(0, offset).split('\n').length;
  const stripped = stripCode(raw); // same length as `raw`: offsets are shared
  const heading = (name) => new RegExp(`^## ${name}[ \\t]*$`, 'm').exec(stripped);
  const [review, explanation, retro] = ['Review', 'Explanation', 'Retrospective'].map(heading);
  // AC8: a `size: S` story needs only the Explanation - no Review, no Cost table, no UX section.
  const missing =
    size === 'S'
      ? !explanation
      : !review ||
        !explanation ||
        !retro ||
        !(review.index < explanation.index) ||
        !(explanation.index < retro.index);
  if (missing) {
    out.push([
      0,
      size === 'S'
        ? 'missing section: a size S story needs "## Explanation"'
        : 'missing or misplaced section: need "## Review", "## Explanation", "## Retrospective" in this order',
    ]);
    return out;
  }
  const body = (from, to) => raw.slice(from.index + from[0].length, to ? to.index : raw.length);
  const nextHeading = (from) => {
    const rest = stripped.slice(from.index + from[0].length);
    const next = /^## /m.exec(rest);
    return next ? { index: from.index + from[0].length + next.index } : undefined;
  };
  const explanationLines = body(explanation, size === 'S' ? nextHeading(explanation) : retro)
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

  if (size === 'S') return out; // AC8: no Cost table required

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
  const VALUE = /^(\d+|n\/a|not measured( \([^)]*\))?)$/;
  const DURATION = /^(\d+:\d{2}(:\d{2})?|n\/a|not measured( \([^)]*\))?)$/;
  for (const [i, c] of runs) {
    if (c.length !== 6 || c.some((cell) => cell === '')) {
      out.push([lineOfRow(i), 'cost row needs six non-empty cells']);
    } else if (!(VALUE.test(c[3]) && VALUE.test(c[4]) && DURATION.test(c[5]))) {
      out.push([
        lineOfRow(i),
        'cost row: Tokens and Tool uses are integers, Duration is m:ss, or n/a, or "not measured" with the reason',
      ]);
    }
  }
  // AC9: the Cost table carries data, not ceremony. From story 026 on a table may not be plain n/a in
  // every row; a row that is not measured says so with the reason. An earlier story keeps its record.
  const plainNa = (cell) => cell === 'n/a';
  if (
    id >= FIRST_SIZE_STORY &&
    runs.length > 0 &&
    runs.every(([, c]) => [3, 4, 5].every((index) => plainNa(c[index] ?? '')))
  ) {
    out.push([
      lineOfRow(tableStart),
      'cost table: every row says n/a; a row must be measured or say "not measured" with the reason (AC9)',
    ]);
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

/** Rule 5 problems of the size declaration, as `[line, message]` pairs. */
export function checkStorySize(raw, id) {
  if (id < FIRST_SIZE_STORY) return [];
  const out = [];
  const size = /^size:\s*([SML])\b/m.exec(raw)?.[1];
  if (size === undefined) {
    out.push([0, `frontmatter needs "size: ${SIZES.join(' | ')}" (story 026)`]);
    return out;
  }
  const count = acCount(raw);
  if (size === 'S' && count > MAX_AC_OF_S) {
    out.push([0, `size S story has ${count} ACs (at most ${MAX_AC_OF_S}, story 026)`]);
  }
  return out;
}

// --- Rules 7 to 10: the four rules of the brainstorm (stories 039, 040, 041, 043) ----------------
const QUESTION_KINDS = ['word', 'data', 'source', 'look', 'irreversible']; // rule 8 (story 040)
const FIRST_RECORD_LINE_STORY = 40; // rule 8 does not rewrite the record of an earlier story
const FIRST_PROPOSAL_STORY = 41; // rule 9 (story 041), the numbering that started with P27
const IN_FLIGHT = new Set(['designed', 'in-progress', 'in-test', 'in-review']); // rule 10 (story 043)
// A read of the rendering: any helper whose name ends in "pixels" (innerPixels, cellPixels), a frame,
// the animation list, or a snapshot. Rule 7 needs the read, not one fixed spelling of it.
const PIXEL_OR_FRAME =
  /(?<![A-Za-z0-9_$])[A-Za-z0-9_$]*[Pp]ixels\(|frameAfter\(|getAnimations\(\)|toMatchSnapshot\(/;
const ASSERTION = /\bexpect(\.poll)?\(/; // expect.poll is an assertion too: it is the poll that load can move
const TIMING_TAG = /\btags?:\s*(?:\[[^\]]*\]|['"]@timing['"])/;

/** Line the character at `offset` is on (1-based). */
const lineOf = (raw, offset) => raw.slice(0, offset).split('\n').length;

/** Index just after the quoted run that starts at `i`; -1 when the quote is not closed. */
function endOfString(raw, i) {
  const quote = raw[i];
  for (let j = i + 1; j < raw.length; j++) {
    if (raw[j] === '\\') j++;
    else if (raw[j] === quote) return j + 1;
  }
  return -1;
}

/** Index just after the comment that starts at `i`; -1 when the comment does not end. */
function endOfComment(raw, i) {
  if (raw[i + 1] === '/') return raw.indexOf('\n', i) < 0 ? raw.length : raw.indexOf('\n', i);
  const end = raw.indexOf('*/', i + 2);
  return end < 0 ? raw.length : end + 2;
}

/** Comment runs replaced by spaces, the length is kept so the line numbers are shared. */
function stripComments(text) {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' || char === "'" || char === '`') {
      const next = endOfString(text, i);
      if (next < 0) {
        out += text.slice(i);
        break;
      }
      out += text.slice(i, next);
      i = next - 1;
    } else if (char === '/' && (text[i + 1] === '/' || text[i + 1] === '*')) {
      const next = endOfComment(text, i);
      out += ' '.repeat(next - i);
      i = next - 1;
    } else out += char;
  }
  return out;
}

/** Index of the `;` that ends the statement whose expression starts at `i`, else the end of the text. */
function statementEnd(text, i) {
  let depth = 0;
  for (let j = i; j < text.length; j++) {
    const char = text[j];
    if (char === '"' || char === "'" || char === '`') {
      const next = endOfString(text, j);
      if (next < 0) return text.length;
      j = next - 1;
    } else if ('([{'.includes(char)) depth++;
    else if (')]}'.includes(char)) depth--;
    else if (char === ';' && depth === 0) return j;
  }
  return text.length;
}

/** Variables whose assignment expression reads the rendering, so an assertion on them compares pixels. */
function readVariables(text) {
  const out = [];
  for (const m of text.matchAll(/(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*/g)) {
    const end = statementEnd(text, m.index + m[0].length);
    if (PIXEL_OR_FRAME.test(text.slice(m.index, end))) out.push(m[1]);
  }
  return out;
}

/**
 * Arguments of the call whose `(` is at `open`, split at the top level. A comment is skipped: an
 * apostrophe in a comment is not a string, and reading it as one would swallow the brackets that
 * close the call (story 039, found on `apps/avd/e2e/avd-chart-colours.spec.ts:145`).
 */
function callArgs(raw, open) {
  const args = [];
  let start = open + 1;
  let depth = 0;
  for (let i = open; i < raw.length; i++) {
    const char = raw[i];
    if (char === '/' && (raw[i + 1] === '/' || raw[i + 1] === '*')) {
      const next = endOfComment(raw, i);
      if (next < 0) return args;
      i = next - 1;
    } else if (char === '"' || char === "'" || char === '`') {
      const next = endOfString(raw, i);
      if (next < 0) return args;
      i = next - 1;
    } else if ('([{'.includes(char)) depth++;
    else if (')]}'.includes(char)) {
      depth--;
      if (depth === 0) return [...args, raw.slice(start, i)];
    } else if (char === ',' && depth === 1) {
      args.push(raw.slice(start, i));
      start = i + 1;
    }
  }
  return args;
}

/** Lines of a story section as `[line, text]` pairs, from its `## name` heading to the next heading. */
function sectionLines(raw, name) {
  const stripped = stripCode(raw); // same length as raw, so the line numbers are shared
  const heading = new RegExp(`^## ${name}[ \\t]*$`, 'im').exec(stripped);
  if (!heading) return [];
  const rest = stripped.slice(heading.index + heading[0].length);
  const end = /^## /m.exec(rest);
  const first = lineOf(stripped, heading.index);
  return (end ? rest.slice(0, end.index) : rest).split('\n').map((text, i) => [first + i, text]);
}

/**
 * Rule 7 (story 039), read from the text only (P16): a `test(` call that compares rendered pixels or frame
 * timing **in an assertion** must name `tag: '@timing'` in its own options. The rule is a file rule, so it has
 * no story number of its own — the path decides its scope. A comparison in a helper outside a test is not a
 * test, and a test that only reads the DOM, resolves a colour or waits for animations to end needs no tag:
 * the tag names the assertion machine load can move, and a test that is not at risk is not filtered out. The
 * read counts when it is inside the assertion or when the variable it wrote is asserted, because a machine
 * under load moves the pixels the assertion compares, not the line the pixels were read on.
 */
export function checkTimingTag(path, raw) {
  const out = [];
  const p = path.split('\\').join('/');
  if (!p.includes('/e2e/') || !p.endsWith('.spec.ts')) return out;
  for (const match of raw.matchAll(/\btest\(/g)) {
    const open = match.index + match[0].length - 1;
    const args = callArgs(raw, open);
    // Playwright takes test(title, options, body): the options are the object before the body.
    const options = (args[1] ?? '').trim().startsWith('{') ? args[1] : '';
    const body = stripComments(args.slice(options ? 2 : 1).join(','));
    if (body === '') continue; // a title with no body is not a test the runner can filter
    const read = readVariables(body);
    const asserted = body
      .split('\n')
      .some(
        (line) =>
          ASSERTION.test(line) &&
          (PIXEL_OR_FRAME.test(line) ||
            read.some((name) => new RegExp(`\\b${name}\\b`).test(line))),
      );
    if (asserted && !TIMING_TAG.test(options)) {
      out.push([
        lineOf(raw, match.index),
        "compares pixels or frame timing in an assertion without tag: '@timing' in its own options (rule 7)",
      ]);
    }
  }
  return out;
}

const DECISION_DATE = /^- \d{4}-\d{2}-\d{2} — /; // the record shape: a decision line starts with its date
// A decision line says whose it is: it ends with "(hak)" for an answer, or names "reason:" for a default.
// A record of a story below 040 is not read at all, so an accepted record is not rewritten (P9).
const DECISION_OWNER = /\(hak\)$|— reason: /;
const KIND_LINE = new RegExp(`\\bhak:[^\n]*\\b(${QUESTION_KINDS.join('|')})\\b`);

/** Bullets of a section as `[line, text]` pairs; a wrapped bullet is one line. */
function bulletsOf(raw, name) {
  const out = [];
  let bullet = null;
  for (const [line, text] of sectionLines(raw, name)) {
    const row = text.trim();
    if (row.startsWith('- ')) {
      if (bullet) out.push(bullet);
      bullet = [line, row];
    } else if (bullet && row !== '') {
      bullet[1] += ` ${row}`;
    }
  }
  if (bullet) out.push(bullet);
  return out;
}

/**
 * Rule 8 (story 040), read from the story text only (P16): an open question names the kind that is
 * hak's, a decision line says whose it is, and a `ready` story has no open question. An open question
 * that blocks work is a `draft` story (product-owner rule 7), so "None." and a line that is not a bullet
 * are not open questions.
 */
export function checkStoryRecordLines(raw, id) {
  if (id < FIRST_RECORD_LINE_STORY) return [];
  const out = [];
  const status = /^status:\s*([a-z-]+)/m.exec(raw)?.[1];
  for (const [line, row] of bulletsOf(raw, 'Open questions')) {
    if (!KIND_LINE.test(row)) {
      out.push([
        line,
        `open question names no kind (rule 8): need "hak:" + ${QUESTION_KINDS.join('|')}`,
      ]);
    }
    if (status === 'ready') out.push([line, 'a ready story has no open question (rule 8)']);
  }
  for (const [line, row] of bulletsOf(raw, 'Decision log')) {
    if (!(DECISION_DATE.test(row) && DECISION_OWNER.test(row))) {
      out.push([line, 'decision line says whose it is not (rule 8): need "(hak)" or "reason:"']);
    }
  }
  return out;
}

const PROPOSAL_LINE = /^- P\d+ — .+ — applies to .+ \((approved|pending)\)$/;
const RECORD_ONLY_LINE = /^- P\d+ .+\(record only\)$/;
const PROPOSAL_NUMBER = /^- (P\d+)/;

/**
 * Rule 9 AC1 (story 041), read from the story text only (P16): a proposal line names the file or story
 * it changes, or says it is a record only.
 */
export function checkProposalLines(raw, id) {
  if (id < FIRST_PROPOSAL_STORY) return [];
  const out = [];
  for (const [line, row] of bulletsOf(raw, 'Retrospective')) {
    if (!PROPOSAL_NUMBER.test(row)) continue; // a retro bullet that is not a proposal
    if (!(PROPOSAL_LINE.test(row) || RECORD_ONLY_LINE.test(row))) {
      out.push([
        line,
        'proposal names nothing it changes (rule 9): need "applies to <file>" or "(record only)"',
      ]);
    }
  }
  return out;
}

/**
 * Rule 9 AC2 (story 041, P27): a P number used in one story's record is not used in another story's.
 * It takes the stories as data, so a test passes its own fixtures (P16) and the scan calls it with the
 * story files it already reads for rule 3 — no second walk of the tree. A story below 041 is not read.
 */
export function checkProposalNumbers(stories) {
  const out = [];
  const first = new Map(); // P number -> the story that first used it
  for (const [path, raw] of stories) {
    if (parseInt(/^(\d{3})-/.exec(basename(path))?.[1] ?? '0', 10) < FIRST_PROPOSAL_STORY) {
      continue;
    }
    for (const [line, text] of sectionLines(raw, 'Retrospective')) {
      const row = text.trim();
      const number = PROPOSAL_NUMBER.exec(row)?.[1];
      if (number === undefined) continue;
      const seen = first.get(number);
      if (seen === undefined) first.set(number, [path, line]);
      else if (seen[0] !== path) {
        out.push([
          path,
          line,
          `proposal ${number} is already used by ${basename(seen[0])} (rule 9, P27)`,
        ]);
      }
    }
  }
  return out;
}

/**
 * Rule 10 (story 043): at most one story across all backlogs is in flight. The list of
 * `[storyPath, status]` is data, so a test passes its own fixtures (P16); the scan calls it with the
 * story files it already reads for rule 3. `blocked`, `ready`, `done`, `draft` and `superseded` are not
 * in flight: they name a state, not work that is happening.
 */
export function checkInFlight(statuses) {
  const flight = statuses.filter(([, status]) => IN_FLIGHT.has(status));
  if (flight.length < 2) return [];
  const names = flight.map(([path, status]) => `${basename(path)} (${status})`).join(', ');
  return [[flight[0][0], 0, `more than one story is in flight (rule 10): ${names}`]];
}

// --- The scan of the repository (rules 1, 2, 3, 7, 8, 9, 10) -------------------------------------
function scanAll() {
  const apps = appsHere();

  // Rule 1: no app names in the factory files and the platform.
  const FACTORY = [
    'CLAUDE.md',
    '.claude/agents',
    '.claude/skills',
    'docs/templates',
    'templates',
    'packages/platform',
    'landing',
  ];
  const factoryFiles = inDirs(...FACTORY);
  for (const name of apps) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const word = new RegExp(`(?<![A-Za-z0-9])${escaped}(?![A-Za-z0-9])`, 'i');
    for (const file of factoryFiles) {
      textOf(file)
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
  for (const file of inDirs('packages/platform').filter((f) => /\.(ts|tsx|mjs|js)$/.test(f))) {
    textOf(file)
      .split('\n')
      .forEach((text, index) => {
        const from = /(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/.exec(text)?.[1];
        if (
          from &&
          (/^@swfactory\/(?!platform(?:\/|$))/.test(from) || /(?:^|\/)apps\//.test(from))
        ) {
          report(file, index + 1, `imports "${from}" from an app (the platform must not)`);
        }
      });
  }

  // Rule 2: relative markdown links resolve.
  const markdownFiles = [
    ...inDirs('docs', 'README.md', 'CHANGELOG.md', 'CLAUDE.md', 'templates'),
    ...apps.flatMap((app) => inDirs(`apps/${app}/docs`, `apps/${app}/README.md`)),
    ...inDirs('packages/platform/README.md'),
  ].filter((f, i, all) => f.endsWith('.md') && all.indexOf(f) === i);

  for (const file of markdownFiles) {
    const text = stripCode(textOf(file));
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

  // Rule 7 (story 039): the e2e specs the walk already found, read through the rule function.
  const specs = walked.filter((f) => rel(f).includes('/e2e/') && rel(f).endsWith('.spec.ts'));
  for (const file of specs) {
    for (const [line, message] of checkTimingTag(rel(file), textOf(file))) {
      report(file, line, message);
    }
  }

  // Rule 3: every story is listed once in the root backlog README; ids are unique.
  const stories = walked.filter((f) =>
    /^(docs|apps\/[^/]+\/docs)\/backlog\/\d{3}-.+\.md$/.test(rel(f)),
  );
  const indexPath = join(ROOT, 'docs', 'backlog', 'README.md');
  const listed = new Map(); // absolute story path -> number of links in the index
  if (existsSync(indexPath)) {
    const indexText = stripCode(textOf(indexPath));
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
    for (const row of textOf(indexPath).split('\n')) {
      const link = /\]\(\s*<?([^)\s>#]+\.md)/.exec(row)?.[1];
      const cells = row.split('|').map((c) => c.trim());
      if (link && row.trim().startsWith('|')) {
        indexStatus.set(resolve(dirname(indexPath), decodeURI(link)), cells[cells.length - 2]);
      }
    }
  }
  const ids = new Map();
  const storyTexts = []; // the story files rule 9 AC2 and rule 10 read from, as data (P16)
  const storyStatus = [];
  for (const story of stories) {
    const id = /^(\d{3})-/.exec(basename(story))[1];
    const number = parseInt(id, 10);
    ids.set(id, [...(ids.get(id) ?? []), rel(story)]);
    const count = listed.get(story) ?? 0;
    if (count !== 1) {
      report(indexPath, 0, `story ${rel(story)} is listed ${count} times (must be exactly once)`);
    }
    const raw = textOf(story);
    storyTexts.push([rel(story), raw]);
    const fmStatus = /^status:\s*([a-z-]+)/m.exec(raw)?.[1];
    storyStatus.push([rel(story), fmStatus]);
    const idxStatus = indexStatus.get(story);
    if (idxStatus !== undefined && fmStatus !== idxStatus) {
      report(
        indexPath,
        0,
        `story ${rel(story)}: index status "${idxStatus}" differs from frontmatter "${fmStatus}"`,
      );
    }
    const frontmatterId = /^id:\s*(\d+)/m.exec(raw)?.[1];
    if (frontmatterId !== undefined && frontmatterId.padStart(3, '0') !== id) {
      report(story, 0, `frontmatter id ${frontmatterId} does not match the file name`);
    }

    // Rules 4 and 5.
    for (const [line, message] of checkStorySize(raw, number)) report(story, line, message);
    if (fmStatus === 'done' && number > 12) {
      for (const [line, message] of checkStoryRecord(raw, sizeOf(raw), number)) {
        report(story, line, message);
      }
    }
    // Rules 8 and 9.
    for (const [line, message] of checkStoryRecordLines(raw, number)) {
      report(story, line, message);
    }
    for (const [line, message] of checkProposalLines(raw, number)) report(story, line, message);
  }
  for (const [id, files] of ids) {
    if (files.length > 1)
      problems.push(`story id ${id} is used more than once: ${files.join(', ')}`);
  }
  // Rule 9 AC2 and rule 10, read from the story texts the scan already has: no second walk.
  for (const [path, line, message] of checkProposalNumbers(storyTexts)) {
    report(join(ROOT, path), line, message);
  }
  for (const [path, line, message] of checkInFlight(storyStatus)) {
    report(join(ROOT, path), line, message);
  }

  if (problems.length > 0) {
    console.error(`check-structure: ${problems.length} problem(s):`);
    problems.forEach((p) => console.error(`  ${p}`));
    process.exit(1);
  }
  console.log(
    `check-structure: ok (${apps.length} app(s): ${apps.join(', ')}; ${stories.length} stories; ` +
      `${markdownFiles.length} markdown files, ${factoryFiles.length} factory files scanned; ` +
      `${specs.length} e2e specs, ${storyStatus.length} story statuses checked for rule 10)`,
  );
}

// A test imports the rule functions without reading the repository (P17), so the scan runs only when
// this file is executed.
if (process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url) {
  scanAll();
}
