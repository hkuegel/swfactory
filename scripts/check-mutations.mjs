#!/usr/bin/env node
// Story 038 (P33, hak 2026-11-14): the mutation check in one call. Each candidate is applied at the narrowest
// scope the tester names and run once, so four rules cost four narrow runs instead of four full runs. The rule
// functions take their input as data, so a test passes its own candidates, its own files and a fake runner
// instead of touching the tree (P16); no request and no repository read here (P17), and the mode is named in
// every call.
//
// AC1: a candidate that cannot change one location is refused, and its command never runs. AC2: every file the
// pass wrote is put back from the backup taken before the first change to it, verified by content hash, and a
// pass that stops at a failed command still restores what it wrote. The restore is a write from the backup,
// never `git checkout`, `git restore` or `git stash` (recorded tester rule). AC3: the command must name one
// test file, never `verify` and never `--mode=full`. Durations are reported, never asserted.
//
// A command that fails is the proof the tester wants when its output names the assertion the candidate expects;
// a command that fails without naming it cannot be attributed to one candidate, so the pass stops there and
// restores every file it wrote.
//
// Options:
//   --candidates=<path>  the candidate list as json, each { file, find, replace, expects }
//   --command=<command>  the narrowest scope, e.g. npx vitest run --config vitest.scripts.config.ts
//                        scripts/check-structure.test.mjs

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const argv = process.argv.slice(2);
const option = (name, def) => {
  const arg = argv.find((a) => a.startsWith(`--${name}=`));
  return arg === undefined ? def : arg.slice(`--${name}=`.length);
};

const sha256 = (text) => createHash('sha256').update(text).digest('hex');

/**
 * AC1: one candidate against the content of its file. A candidate that cannot change one location cannot move
 * a result: an identical replacement is `no-op`, and a `find` that occurs nowhere or more than once is
 * `ambiguous`. A blank `find` matches everywhere, so it is refused as ambiguous too.
 */
export function checkCandidate(candidate, content) {
  if (candidate.find === candidate.replace) return { ok: false, problem: 'no-op', occurrences: 0 };
  if (candidate.find === '') return { ok: false, problem: 'ambiguous', occurrences: 0 };
  const occurrences = content.split(candidate.find).length - 1;
  if (occurrences !== 1) return { ok: false, problem: 'ambiguous', occurrences };
  return { ok: true, problem: null, occurrences };
}

/** AC2: content against the hash of the backup taken before the first change to that file. */
export function checkRestore(backupHash, content) {
  const hash = sha256(content);
  return { ok: hash === backupHash, hash, backupHash };
}

/** AC3: the narrowest scope the tester is given: one test file, never `verify`, never a full run. */
export function checkScope(command) {
  if (/(?:^|\s)verify\b/.test(command))
    return { ok: false, problem: 'names verify', testFile: null };
  if (command.includes('--mode=full'))
    return { ok: false, problem: 'names the full run', testFile: null };
  const files = command.match(/\S+\.test\.(mjs|ts|tsx)/g) ?? [];
  if (files.length !== 1)
    return { ok: false, problem: 'names no single test file', testFile: null };
  return { ok: true, problem: null, testFile: files[0] };
}

/**
 * The pass as data: `read` and `write` are the files, `run` is the command and its answer. The order of the
 * candidates is the order of the report. A refused candidate never runs the command; a file is backed up
 * before its first change, and every file that was written is restored from that backup before the answer is
 * returned, so a pass that stops in the middle still answers with every file (AC2).
 */
export async function runPass({ candidates, command, read, write, run }) {
  const scope = checkScope(command);
  if (!scope.ok) return { scope, reports: [], restored: [], stopped: null };

  const backups = new Map(); // file -> the content read before its first change, with its hash
  const reports = [];
  const restored = [];
  let stopped = null;

  for (const candidate of candidates) {
    const content = read(candidate.file);
    const check = checkCandidate(candidate, content);
    if (!check.ok) {
      reports.push({
        file: candidate.file,
        expects: candidate.expects,
        status: 'refused',
        problem: check.problem,
        occurrences: check.occurrences,
        seconds: 0,
      });
      continue;
    }
    if (!backups.has(candidate.file))
      backups.set(candidate.file, { content, hash: sha256(content) });
    write(candidate.file, content.replace(candidate.find, candidate.replace));

    const result = await run(command);
    const moved = result.out.includes(candidate.expects);
    const failed = result.code !== 0 && !moved;
    reports.push({
      file: candidate.file,
      expects: candidate.expects,
      status: moved ? 'moved' : failed ? 'failed' : 'not moved',
      problem: failed ? 'the command failed without naming the assertion' : null,
      occurrences: check.occurrences,
      seconds: result.seconds,
    });
    if (failed) {
      stopped = candidate.expects;
      break;
    }
  }

  // AC2, in both paths: the files the pass wrote are put back and checked against the backup hash.
  for (const [file, backup] of backups) {
    write(file, backup.content);
    restored.push({ file, ...checkRestore(backup.hash, read(file)) });
  }

  return { scope, reports, restored, stopped };
}

const shown = (seconds) => `${seconds.toFixed(1)} s`;

function lineOf(entry) {
  const where = `${entry.file} (${entry.expects})`;
  if (entry.status === 'refused') return `  ${where}: ${entry.problem} - the command was not run`;
  return `  ${where}: ${entry.status} ${shown(entry.seconds)}`;
}

async function main() {
  const candidatesPath = option('candidates');
  const command = option('command');
  if (candidatesPath === undefined || command === undefined) {
    console.error('check-mutations: need --candidates=<json> and --command=<test command>');
    return 1;
  }

  const scope = checkScope(command);
  if (!scope.ok) {
    console.error(`check-mutations: scope refused: ${scope.problem} (${command})`);
    return 1;
  }

  const candidates = JSON.parse(readFileSync(candidatesPath, 'utf8'));
  const read = (file) => readFileSync(join(ROOT, file), 'utf8');
  const write = (file, text) => writeFileSync(join(ROOT, file), text);
  // On Windows the scope is a command string, so it needs a shell (story 022).
  const run = (cmd) => {
    const started = Date.now();
    const result = spawnSync(cmd, { cwd: ROOT, encoding: 'utf8', shell: true });
    return {
      code: result.status ?? 1,
      out: `${result.stdout ?? ''}${result.stderr ?? ''}`,
      seconds: (Date.now() - started) / 1000,
    };
  };

  const answer = await runPass({ candidates, command, read, write, run });
  console.log(`check-mutations: scope ${answer.scope.testFile}, ${candidates.length} candidate(s)`);
  for (const entry of answer.reports) console.log(lineOf(entry));
  if (answer.stopped !== null) console.error(`check-mutations: stopped at ${answer.stopped}`);

  const unrestored = answer.restored.filter((entry) => !entry.ok);
  for (const entry of answer.restored) {
    if (entry.ok) console.log(`restored ${entry.file} ${entry.hash}`);
    else
      console.error(
        `not restored ${entry.file}: ${entry.hash} is not the backup ${entry.backupHash}`,
      );
  }
  if (unrestored.length > 0) return 1;
  return answer.stopped === null ? 0 : 1;
}

// A test imports the rule functions without reading the repository (P17), so the pass runs only when this
// file is executed directly (story 026).
if (process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().then((code) => process.exit(code));
}
