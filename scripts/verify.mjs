#!/usr/bin/env node
// Story 026: the runner. It asks the mapping which checks can see the change, runs that plan in
// levels, and reports the levels and the durations. Three named modes (P17): `--mode=affected` uses the
// mapping, `--mode=full` runs everything, `--mode=publish` runs the whole-tree checks whole tree and the
// workspace checks in the workspaces the change can reach (story 034, hak's rule B). Without a recorded run
// every check runs (AC2): a check is skipped only when its inputs are unchanged since a recorded run, never
// because a pattern calls it unimportant. Durations are reported, never asserted (story 026, Out of scope).
//
// Options:
//   --mode=affected|full|publish   the named mode (default: affected when a run is recorded, else full)
//   --paths=a,b            the changed paths, instead of reading them from git (dry run of a mapping)
//   --base=<ref>           a commit that stands for the last full run (the CI pull-request base: every
//                          run that publishes to main is a full run, so main is the record in CI)
//   --plan-only            print the plan and the levels, run nothing
//   --format=github-output with --plan-only, three lines for a CI step output: mode, base, steps
//   --no-record            do not write the record (CI writes nothing in the repository)
//   --record-file=<path>   where the record of the last full run lives (default .tmp/last-full-run.json)

import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { STEPS, checkLevels, levelsOf, plan, runsPerWorkspace } from './affected-checks.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const WIN = process.platform === 'win32';
const argv = process.argv.slice(2);
const option = (name, def) => {
  const arg = argv.find((a) => a.startsWith(`--${name}=`));
  return arg === undefined ? def : arg.slice(`--${name}=`.length);
};
const flag = (name) => argv.includes(`--${name}`);

function git(args) {
  // git is a binary, not a .cmd shim, so no shell is needed here (story 022). The output is not
  // trimmed: `status --porcelain` is read by character position, and the two status characters are
  // followed by a space that a trim would remove from the first line.
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  return result.status === 0 ? result.stdout.replace(/\r?\n$/, '') : null;
}

const sha256 = (text) => createHash('sha256').update(text).digest('hex');

/** Content hash of a path; a deleted file hashes as the word `deleted`. */
function hashOf(path) {
  const file = join(ROOT, path);
  return existsSync(file) ? sha256(readFileSync(file)) : 'deleted';
}

/** The apps of the repository, read as directories with a package.json, never as a hard-coded list. */
function appsHere() {
  const dir = join(ROOT, 'apps');
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(
      (entry) => entry.isDirectory() && existsSync(join(ROOT, 'apps', entry.name, 'package.json')),
    )
    .map((entry) => entry.name)
    .sort();
}

/** The paths git reports as changed, read by position: two status characters, a space, the path. */
export function pathsOfStatus(text) {
  return (
    text
      .split('\n')
      .filter((line) => line !== '')
      // A renamed file is written as `old -> new`; the new path is the one whose content changed.
      .map((line) => {
        const parts = line.slice(3).split(' -> ');
        return parts[parts.length - 1];
      })
      .sort()
  );
}

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '_site',
  'coverage',
  'playwright-report',
  'test-results',
  '.vite',
  '.tmp',
  '.git',
]);

/** The files below a directory, so a wholly untracked directory is read as the files inside it. */
function filesHere(dir) {
  const base = dir.replace(/\/$/, '');
  return readdirSync(join(ROOT, base), { withFileTypes: true })
    .filter((entry) => !SKIP_DIRS.has(entry.name))
    .flatMap((entry) => {
      const child = `${base}/${entry.name}`;
      return entry.isDirectory() ? filesHere(child) : [child];
    })
    .sort();
}

/**
 * `git status --porcelain` writes a directory whose files are all untracked as one line ending with `/`.
 * The plan needs the files, not the directory name, so such an entry is expanded before it is hashed.
 */
export function expandPaths(paths, list) {
  return paths.flatMap((path) => (path.endsWith('/') ? list(path) : [path])).sort();
}

/** A snapshot is the commit plus the content hashes of the paths git reports as changed. */
function snapshot() {
  const head = git(['rev-parse', 'HEAD']);
  const files = {};
  const paths = expandPaths(pathsOfStatus(git(['status', '--porcelain']) ?? ''), filesHere);
  for (const path of paths) {
    files[path] = hashOf(path);
  }
  return { head, files };
}

function readRecord(file) {
  if (!existsSync(file)) return undefined;
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    console.log(`verify: the record ${file} is unreadable, so this run is a full run`);
    return undefined;
  }
}

/** Paths changed since the recorded run (AC2); null when nothing is recorded. */
export function changedSince(record, current) {
  if (record === undefined) return null;
  const paths = new Set();
  for (const path of (git(['diff', '--name-only', `${record.head}..${current.head}`]) ?? '')
    .split('\n')
    .filter((l) => l !== '')) {
    paths.add(path);
  }
  for (const [path, hash] of Object.entries(current.files)) {
    if (record.files[path] !== hash) paths.add(path);
  }
  return [...paths].sort();
}

/**
 * Story 034: the record content for a run that can be read as a coverage claim. It names the mode of the run,
 * the workspaces it ran, and the steps that ran in those workspaces. A run that did not cover the whole tree
 * cannot write a record, so `affected` answers null; `full` and `publish` write, and only a green run reaches
 * this write (the caller's gate). `scopedSteps` is what the runner observed, given as data.
 */
export function recordForRun(answer, current, scriptsByWorkspace) {
  if (answer.mode !== 'full' && answer.mode !== 'publish') return null;
  return {
    mode: answer.mode,
    head: current.head,
    files: current.files,
    workspaces: [...(answer.workspaces ?? [])].sort(),
    scopedSteps: answer.steps
      .filter((step) => runsPerWorkspace(answer, step, scriptsByWorkspace))
      .sort(),
  };
}

/** Story 034: the scope the report prints for one step, read from the same answer the command is built from,
 *  so the report and the command cannot disagree about where a step ran. */
export function scopeText(answer, step, scriptsByWorkspace) {
  return runsPerWorkspace(answer, step, scriptsByWorkspace)
    ? ` in ${(answer.workspaces ?? []).join(', ')}`
    : ' whole tree';
}

/** The workspaces of the repository, read from package.json's `workspaces` field, never a hard-coded
 *  list (story 027). A `*` entry is expanded as a directory that has its own package.json. */
export function workspacesHere() {
  const entries = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).workspaces ?? [];
  const found = [];
  for (const entry of entries) {
    if (!entry.endsWith('/*')) {
      found.push(entry);
      continue;
    }
    const base = entry.slice(0, -2);
    const dir = join(ROOT, base);
    if (!existsSync(dir)) continue;
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      if (item.isDirectory() && existsSync(join(ROOT, base, item.name, 'package.json'))) {
        found.push(`${base}/${item.name}`);
      }
    }
  }
  return found.sort();
}

/**
 * Story 029: the command for one step. A step that a workspace can run alone runs in the workspaces the plan
 * names - the affected workspaces, or the workspaces a publishing run reaches (story 034); a step that reads
 * the whole tree at once, or a change that touches a file outside every workspace, keeps the root command. An
 * empty scope is never executed as an empty scope: it runs in every workspace (story 027, AC2).
 */
export function commandForStep(step, answer, allWorkspaces, scriptsByWorkspace = {}) {
  const scope = answer.workspaces?.length ? answer.workspaces : allWorkspaces;
  if (!runsPerWorkspace(answer, step, scriptsByWorkspace)) {
    return ['run', step];
  }
  return ['run', step, '--if-present', ...scope.flatMap((workspace) => ['-w', workspace])];
}

/** The scripts each workspace defines in its own `package.json`, read as data for one run. */
function scriptsByWorkspaceHere(workspaces) {
  const found = {};
  for (const workspace of workspaces) {
    const file = join(ROOT, workspace, 'package.json');
    if (!existsSync(file)) continue;
    try {
      found[workspace] = JSON.parse(readFileSync(file, 'utf8')).scripts ?? {};
    } catch {
      found[workspace] = {};
    }
  }
  return found;
}

/** One npm script as a child process; its output is collected so parallel steps do not interleave. */
function runStep(step, args) {
  return new Promise((resolve) => {
    const started = Date.now();
    // On Windows npm is a .cmd shim and needs a shell (story 022). With a shell the command is one
    // string; it is not quoted here because `npm`, the step names and the workspace paths contain no
    // space — quoting the program name makes cmd.exe resolve the shim from the working directory and
    // every step fails.
    const command = WIN ? `npm ${args.join(' ')}` : null;
    const child =
      command === null
        ? spawn('npm', args, { cwd: ROOT })
        : spawn(command, { cwd: ROOT, shell: true });
    let out = '';
    child.stdout.on('data', (chunk) => (out += chunk));
    child.stderr.on('data', (chunk) => (out += chunk));
    // A spawn that fails before it closes must still resolve, with a failure code.
    child.on('error', (error) =>
      resolve({
        step,
        code: 1,
        seconds: (Date.now() - started) / 1000,
        out: String(error.message),
      }),
    );
    child.on('close', (code) =>
      resolve({ step, code, seconds: (Date.now() - started) / 1000, out: out.trim() }),
    );
  });
}

const shown = (seconds) => `${seconds.toFixed(1)} s`;

function levelsByIdent(answer) {
  const levels = levelsOf(answer.steps);
  const byLevel = new Map();
  for (const step of answer.steps)
    byLevel.set(levels.get(step), [...(byLevel.get(levels.get(step)) ?? []), step].sort());
  return { levels, byLevel: new Map([...byLevel].sort((a, b) => a[0] - b[0])) };
}

function printPlan(answer, byLevel, stream = process.stdout, scriptsByWorkspace = {}) {
  const lines = [
    `verify: mode ${answer.mode}, ${answer.steps.length} of ${STEPS.length} steps, ` +
      `chain ${Math.max(...byLevel.keys()) + 1} levels`,
  ];
  if (answer.mode !== 'full') {
    lines.push(`  changed: ${answer.changed.length === 0 ? 'nothing' : answer.changed.join(', ')}`);
    lines.push(`  apps: ${answer.apps.length === 0 ? 'none' : answer.apps.join(', ')}`);
    const skipped = STEPS.filter((step) => !answer.steps.includes(step)).sort();
    lines.push(`  skipped: ${skipped.length === 0 ? 'nothing' : skipped.join(', ')}`);
  }
  // Story 029 and story 034: the plan shows which steps run in which workspaces, so a run that covers one
  // workspace is not read as a full run. A step that cannot be scoped is not named here.
  const scoped = answer.steps.filter((step) => runsPerWorkspace(answer, step, scriptsByWorkspace));
  if (scoped.length > 0) {
    lines.push(`  workspaces: ${answer.workspaces.join(', ')} (${scoped.join(', ')})`);
  }
  for (const [level, steps] of byLevel) lines.push(`  level ${level}: ${steps.join(', ')}`);
  stream.write(`${lines.join('\n')}\n`);
}

async function main() {
  const recordFile = option('record-file', join(ROOT, '.tmp', 'last-full-run.json'));
  const current = snapshot();
  const base = option('base');
  const record =
    readRecord(recordFile) ?? (base === undefined ? undefined : { head: base, files: {} });
  const changed =
    option('paths') === undefined
      ? changedSince(record, current)
      : option('paths')
          .split(',')
          .filter((p) => p !== '');
  const mode = option('mode', record === undefined ? 'full' : 'affected');

  const allWorkspaces = workspacesHere();
  const scriptsByWorkspace = scriptsByWorkspaceHere(allWorkspaces);
  const answer = plan(changed, record, mode, appsHere(), allWorkspaces);
  const { levels, byLevel } = levelsByIdent(answer);

  if (answer.steps.length === 0) {
    // Cannot happen with the mapping (an ungrouped path is a full run), but an empty plan must not
    // print a chain of -Infinity levels.
    console.log('verify: nothing changed since the recorded full run, nothing to run');
    return 0;
  }

  // AC5 guard: the assignment the runner uses must be the one the level check accepts.
  const assignment = Object.fromEntries(answer.steps.map((step) => [step, levels.get(step)]));
  const offending = checkLevels(assignment);
  if (offending.length > 0) {
    console.error(`verify: level assignment wrong for ${offending.join(', ')}`);
    return 1;
  }

  const machine = option('format') === 'github-output';
  printPlan(answer, byLevel, machine ? process.stderr : process.stdout, scriptsByWorkspace);
  if (machine) {
    // The three lines a CI step output reads; the human plan above went to stderr.
    console.log(`mode=${answer.mode}`);
    console.log(`base=${option('base', current.head)}`);
    console.log(`steps=${answer.steps.join(',')}`);
    return 0;
  }
  if (flag('plan-only')) return 0;
  if (answer.mode === 'affected' && answer.changed.length === 0) {
    console.log('verify: nothing changed since the recorded full run, nothing to run');
    return 0;
  }

  const start = Date.now();
  const results = [];
  for (const [level, steps] of byLevel) {
    const done = await Promise.all(
      steps.map((step) =>
        runStep(step, commandForStep(step, answer, allWorkspaces, scriptsByWorkspace)),
      ),
    );
    for (const r of done) {
      results.push(r);
      // Story 029 and story 034: the scope is printed, so a run that covers one workspace is not read as a
      // full run.
      console.log(
        `  level ${level} ${r.step}: ${r.code === 0 ? 'ok' : `FAILED (${r.code})`} ${shown(r.seconds)}${scopeText(answer, r.step, scriptsByWorkspace)}`,
      );
      if (r.code !== 0 && r.out !== '') console.log(r.out);
    }
  }

  const failed = results.filter((r) => r.code !== 0);
  if (failed.length > 0) {
    console.error(`verify: ${failed.length} step(s) failed`);
    return 1;
  }

  // Only a successful run that covers the whole tree records (AC2), and only when the caller allows a
  // write. A publishing run records as well, because the next run compares against it, and its record names
  // the workspaces it ran (story 034).
  const recordToWrite = recordForRun(answer, current, scriptsByWorkspace);
  if (recordToWrite !== null && !flag('no-record')) {
    mkdirSync(join(ROOT, '.tmp'), { recursive: true });
    writeFileSync(recordFile, `${JSON.stringify(recordToWrite, null, 2)}\n`);
    console.log(`verify: ${answer.mode} run recorded in ${recordFile.replace(ROOT, '')}`);
  }
  console.log(
    `verify: ok, ${results.length} step(s), ${shown((Date.now() - start) / 1000)} wall clock`,
  );
  return 0;
}

// A test imports the parser without running the pipeline (P17), so main runs only when the file is
// executed as a script.
if (process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().then((code) => process.exit(code));
}
