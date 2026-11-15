import { describe, expect, it } from 'vitest';
import { checkCandidate, checkRestore, checkScope, runPass } from './check-mutations.mjs';

// Story 038 (P33): the candidates, the file contents and the answers of the runner are written by hand here,
// so the oracle is not the code under test (P16). No repository read and no live command (P17): the files are
// a hand map, the runner is a fake that records which candidate called it, and the mode is named in every
// call. Durations are reported, never asserted - the seconds are the hand values the fake runner was given,
// and the test asserts that the pass reports them, not that any run took a certain time.

const HAND = {
  'scripts/a.mjs': 'const answer = check(); const total = 0;\n',
  'scripts/b.mjs': 'const flag = on;\n',
};

// Hand oracle: the sha256 of the two hand contents, written from the contents themselves and not read back
// from the hash function of the code under test.
const HAND_HASH_A = '31d1e93fe57e8abcce33da5ef14be8653db4f1af43b4c4a4758b98657a9aadd7';
const HAND_HASH_B = '924183ff525d631cd5caf5aa2dcdeae63f330b97556cd2d6c9e988ade3e35cfd';
// Hand oracle for the content the accepted candidate writes, so the hash comparison is checked in both
// directions: a content that differs from the backup by one character must not pass.
const HAND_HASH_MUTATED_A = '7663aef37291c5b53a307685ef88dfc9671ad03ec451c0cd88bd84ad09a6bb94';

const HAND_COMMAND =
  'npx vitest run --config vitest.scripts.config.ts scripts/check-mutations.test.mjs';

/**
 * The files and the runner as data. `answers` is the answer the fake runner gives to each call, in the order
 * of the calls, so the test sees which candidate ran the command.
 */
async function pass(candidates, answers, command = HAND_COMMAND) {
  const store = { ...HAND };
  const calls = [];
  const run = (called) => {
    calls.push(called);
    return Promise.resolve(
      answers[calls.length - 1] ?? { code: 0, out: 'no assertion named', seconds: 0.1 },
    );
  };
  const answer = await runPass({
    candidates,
    command,
    read: (file) => store[file],
    write: (file, text) => {
      store[file] = text;
    },
    run,
  });
  return { answer, store, calls };
}

const CANDIDATES = {
  acceptedA: {
    file: 'scripts/a.mjs',
    find: 'check()',
    replace: 'check(0)',
    expects: 'AC1: the answer is read from the hand table',
  },
  ambiguousA: {
    file: 'scripts/a.mjs',
    find: 'const',
    replace: 'let',
    expects: 'AC1: planted violation, the find occurs twice',
  },
  noOpB: {
    file: 'scripts/b.mjs',
    find: 'flag = off',
    replace: 'flag = off',
    expects: 'AC1: planted violation, the replacement is identical',
  },
  acceptedB: {
    file: 'scripts/b.mjs',
    find: 'flag = on',
    replace: 'flag = off',
    expects: 'AC2: the flag is read from the hand table',
  },
};

describe('story 038 AC1: the candidate check takes its input as data', () => {
  it('AC1: a candidate that occurs once and differs is applied once and its command runs once', async () => {
    // Hand expectation: one occurrence in the hand content, so this candidate can move a result.
    expect(checkCandidate(CANDIDATES.acceptedA, HAND['scripts/a.mjs'])).toEqual({
      ok: true,
      problem: null,
      occurrences: 1,
    });

    const { answer, store, calls } = await pass(
      [CANDIDATES.acceptedA],
      [{ code: 1, out: 'FAIL AC1: the answer is read from the hand table', seconds: 1.1 }],
    );
    // Hand expectation: the run names the assertion the tester expects, so the result moved. The file is put
    // back from the backup before the answer is returned.
    expect(answer.reports).toEqual([
      {
        file: 'scripts/a.mjs',
        expects: 'AC1: the answer is read from the hand table',
        status: 'moved',
        problem: null,
        occurrences: 1,
        seconds: 1.1,
      },
    ]);
    expect(store['scripts/a.mjs']).toBe(HAND['scripts/a.mjs']);
    expect(calls.length).toBe(1);
  });

  it('AC1: planted violation - a candidate whose find occurs twice is refused as ambiguous and its command never ran', async () => {
    // Hand expectation: two occurrences in the hand content, so one location is not a location.
    expect(checkCandidate(CANDIDATES.ambiguousA, HAND['scripts/a.mjs'])).toEqual({
      ok: false,
      problem: 'ambiguous',
      occurrences: 2,
    });
    // Hand expectation: a find that occurs nowhere is the same refusal (AC1 names both cases).
    expect(
      checkCandidate({ file: 'scripts/b.mjs', find: 'zz', replace: 'y' }, HAND['scripts/b.mjs']),
    ).toEqual({ ok: false, problem: 'ambiguous', occurrences: 0 });

    const { answer, calls, store } = await pass(
      [CANDIDATES.acceptedA, CANDIDATES.ambiguousA],
      [{ code: 1, out: 'FAIL AC1: the answer is read from the hand table', seconds: 1.1 }],
    );
    // Hand expectation: only the accepted candidate ran the command, and the refused one is named.
    expect(calls.length).toBe(1);
    expect(answer.reports).toEqual([
      {
        file: 'scripts/a.mjs',
        expects: 'AC1: the answer is read from the hand table',
        status: 'moved',
        problem: null,
        occurrences: 1,
        seconds: 1.1,
      },
      {
        file: 'scripts/a.mjs',
        expects: 'AC1: planted violation, the find occurs twice',
        status: 'refused',
        problem: 'ambiguous',
        occurrences: 2,
        seconds: 0,
      },
    ]);
    // The file is not touched by a refused candidate; it is put back as it was read.
    expect(store['scripts/a.mjs']).toBe(HAND['scripts/a.mjs']);
    expect(answer.restored).toEqual([
      { file: 'scripts/a.mjs', ok: true, hash: HAND_HASH_A, backupHash: HAND_HASH_A },
    ]);
  });

  it('AC1: planted violation - a candidate identical to its replacement is refused as no-op and its command never ran', async () => {
    // Hand expectation: the replacement is the same text, so nothing can move.
    expect(checkCandidate(CANDIDATES.noOpB, HAND['scripts/b.mjs'])).toEqual({
      ok: false,
      problem: 'no-op',
      occurrences: 0,
    });

    const { answer, calls, store } = await pass(
      [CANDIDATES.acceptedB, CANDIDATES.noOpB],
      [{ code: 0, out: 'Test Files 1 passed', seconds: 0.9 }],
    );
    // Hand expectation: one command for two candidates, and the refused candidate names itself.
    expect(calls.length).toBe(1);
    expect(answer.reports).toEqual([
      {
        file: 'scripts/b.mjs',
        expects: 'AC2: the flag is read from the hand table',
        status: 'not moved',
        problem: null,
        occurrences: 1,
        seconds: 0.9,
      },
      {
        file: 'scripts/b.mjs',
        expects: 'AC1: planted violation, the replacement is identical',
        status: 'refused',
        problem: 'no-op',
        occurrences: 0,
        seconds: 0,
      },
    ]);
    expect(store['scripts/b.mjs']).toBe(HAND['scripts/b.mjs']);
  });
});

describe('story 038 AC2: every file the pass wrote is checked against the hash of its backup', () => {
  it('AC2: the accepted candidate wrote its file and the answer reports it restored to the backup hash', async () => {
    const { answer, store } = await pass(
      [CANDIDATES.acceptedA],
      [{ code: 0, out: 'no assertion named', seconds: 0.5 }],
    );
    // Hand expectation: the hash of the hand content, and the content in the store is the hand content.
    expect(checkRestore(HAND_HASH_A, HAND['scripts/a.mjs'])).toEqual({
      ok: true,
      hash: HAND_HASH_A,
      backupHash: HAND_HASH_A,
    });
    expect(answer.restored).toEqual([
      { file: 'scripts/a.mjs', ok: true, hash: HAND_HASH_A, backupHash: HAND_HASH_A },
    ]);
    expect(store['scripts/a.mjs']).toBe(HAND['scripts/a.mjs']);
  });

  it('AC2: planted violation - content that differs from the backup by one character is not the backup', () => {
    // Hand expectation: the mutated content hashes to a different hand value, so the check fails.
    expect(checkRestore(HAND_HASH_A, 'const answer = check(0); const total = 0;\n')).toEqual({
      ok: false,
      hash: HAND_HASH_MUTATED_A,
      backupHash: HAND_HASH_A,
    });
  });

  it('AC2: planted violation - a run that stops at a failed command still answers with every file restored', async () => {
    const { answer, store } = await pass(
      [CANDIDATES.acceptedA, CANDIDATES.ambiguousA, CANDIDATES.noOpB, CANDIDATES.acceptedB],
      [
        { code: 0, out: 'Test Files 1 passed', seconds: 0.4 },
        // The second candidate that ran: the command failed without naming the assertion, so the pass stops.
        { code: 1, out: 'vitest could not read the config', seconds: 0.3 },
      ],
    );
    // Hand expectation, the hash list: both files the pass wrote are back at the content of their backup,
    // in the order they were first written. The refused candidates never wrote a file and never ran.
    expect(answer.stopped).toBe('AC2: the flag is read from the hand table');
    expect(answer.restored).toEqual([
      { file: 'scripts/a.mjs', ok: true, hash: HAND_HASH_A, backupHash: HAND_HASH_A },
      { file: 'scripts/b.mjs', ok: true, hash: HAND_HASH_B, backupHash: HAND_HASH_B },
    ]);
    expect(store['scripts/a.mjs']).toBe(HAND['scripts/a.mjs']);
    expect(store['scripts/b.mjs']).toBe(HAND['scripts/b.mjs']);
  });
});

describe('story 038 AC3: the scope is the narrowest the tester is given', () => {
  it('AC3: a command that names one test file is accepted as the scope', () => {
    // Hand expectation: the config file is not a test file, so the command names exactly one.
    expect(checkScope(HAND_COMMAND)).toEqual({
      ok: true,
      problem: null,
      testFile: 'scripts/check-mutations.test.mjs',
    });
  });

  it('AC3: planted violation - a command naming verify or the full mode is refused and nothing runs', async () => {
    // Hand expectation: the runner and the full run are not a scope, so the pass runs nothing.
    expect(checkScope('npm run verify')).toEqual({
      ok: false,
      problem: 'names verify',
      testFile: null,
    });
    expect(checkScope(`${HAND_COMMAND} --mode=full`)).toEqual({
      ok: false,
      problem: 'names the full run',
      testFile: null,
    });

    const calls = [];
    const answer = await runPass({
      candidates: [CANDIDATES.acceptedA],
      command: 'npm run verify --mode=full',
      read: (file) => HAND[file],
      write: () => {
        throw new Error('a refused scope must not write a file');
      },
      run: () => {
        calls.push('called');
        return Promise.resolve({ code: 0, out: '', seconds: 0 });
      },
    });
    expect(answer.reports).toEqual([]);
    expect(answer.restored).toEqual([]);
    expect(calls.length).toBe(0);
  });
});
