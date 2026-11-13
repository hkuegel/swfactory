#!/usr/bin/env node
// Story 026: the runner. It asks the mapping which checks can see the change, runs that plan in
// levels, and reports the levels and the durations. Two named modes (P17): `--mode=affected` uses the
// mapping, `--mode=full` runs everything. Without a recorded full run every check runs (AC2): a check
// is skipped only when its inputs are unchanged since a recorded full run, never because a pattern
// calls it unimportant. Durations are reported, never asserted (story 026, Out of scope).
//
// Options:
//   --mode=affected|full   the named mode (default: affected when a full run is recorded, else full)
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
import { STEPS, WORKSPACE_STEPS, checkLevels, levelsOf, plan } from './affected-checks.mjs';

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

/** A snapshot is the commit plus the content hashes of the paths git reports as changed. */
function snapshot() {
  const head = git(['rev-parse', 'HEAD']);
  const files = {};
  for (const path of pathsOfStatus(git(['status', '--porcelain']) ?? '')) {
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

/** Paths changed since the recorded full run (AC2); null when nothing is recorded. */
function changedSince(record, current) {
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
 * Story 027: the command for one step. A workspace step runs in the planned workspaces only, so an
 * app-only change does not start another app's suite; a step that reads the whole tree keeps the root
 * command. An empty scope is never executed as an empty scope: it runs in every workspace.
 */
export function commandForStep(step, answer, allWorkspaces) {
  if (!WORKSPACE_STEPS.includes(step)) return ['run', step];
  // An empty scope is never executed as an empty scope: it names every workspace, the same rule as the
  // empty plan in story 026, AC3.
  const scope = answer.workspaces?.length ? answer.workspaces : allWorkspaces;
  return ['run', step, '--if-present', ...scope.flatMap((workspace) => ['-w', workspace])];
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

function printPlan(answer, byLevel, stream = process.stdout) {
  const lines = [
    `verify: mode ${answer.mode}, ${answer.steps.length} of ${STEPS.length} steps, ` +
      `chain ${Math.max(...byLevel.keys()) + 1} levels`,
  ];
  if (answer.mode === 'affected') {
    lines.push(`  changed: ${answer.changed.length === 0 ? 'nothing' : answer.changed.join(', ')}`);
    lines.push(`  apps: ${answer.apps.length === 0 ? 'none' : answer.apps.join(', ')}`);
    const skipped = STEPS.filter((step) => !answer.steps.includes(step)).sort();
    lines.push(`  skipped: ${skipped.length === 0 ? 'nothing' : skipped.join(', ')}`);
  }
  if (answer.steps.some((step) => WORKSPACE_STEPS.includes(step))) {
    // Story 027: the workspaces the scoped steps run in, so an empty scope is visible in the plan.
    lines.push(`  workspaces: ${answer.workspaces.join(', ')}`);
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
  const answer = plan(changed, record, mode, appsHere(), allWorkspaces);
  answer.changed = changed ?? [];
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
  printPlan(answer, byLevel, machine ? process.stderr : process.stdout);
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
      steps.map((step) => runStep(step, commandForStep(step, answer, allWorkspaces))),
    );
    for (const r of done) {
      results.push(r);
      // Story 027: the scope is printed, so a run that covers one workspace is not read as a full run.
      const scope =
        WORKSPACE_STEPS.includes(r.step) && answer.workspaces.length > 0
          ? ` in ${answer.workspaces.join(', ')}`
          : '';
      console.log(
        `  level ${level} ${r.step}: ${r.code === 0 ? 'ok' : `FAILED (${r.code})`} ${shown(r.seconds)}${scope}`,
      );
      if (r.code !== 0 && r.out !== '') console.log(r.out);
    }
  }

  const failed = results.filter((r) => r.code !== 0);
  if (failed.length > 0) {
    console.error(`verify: ${failed.length} step(s) failed`);
    return 1;
  }

  // Only a successful full run records (AC2), and only when the caller allows a write.
  if (answer.mode === 'full' && !flag('no-record')) {
    mkdirSync(join(ROOT, '.tmp'), { recursive: true });
    writeFileSync(
      recordFile,
      `${JSON.stringify({ mode: 'full', head: current.head, files: current.files }, null, 2)}\n`,
    );
    console.log(`verify: full run recorded in ${recordFile.replace(ROOT, '')}`);
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
