import { describe, expect, it } from 'vitest';
import { plan, STEPS } from './affected-checks.mjs';
import { acceptsRecord } from './write-fund-list.mjs';
import {
  recordForRun,
  scopeText,
  changedSince,
  commandForStep,
  expandPaths,
  pathsOfStatus,
} from './verify.mjs';

// Story 026, fixture mode: stored input and the hand expectation (P16), no request and no repository
// read (P17). App names are placeholders (`x`, `y`). The runner is tested for the two things that can
// regress: the porcelain parse that had a defect, and the rule that a check never runs without the step
// that writes what it reads.

describe('the runner reads the changed paths by position, not by trimming', () => {
  it('the first porcelain line keeps its path', () => {
    // Hand expectation: two status characters, a space, the path; `.gitignore` is the first line here.
    expect(pathsOfStatus('?? .gitignore\n M docs/backlog/README.md')).toEqual([
      '.gitignore',
      'docs/backlog/README.md',
    ]);
  });

  it('a rename names the new path, an empty report names nothing', () => {
    expect(pathsOfStatus('R  scripts/old.mjs -> scripts/affected-checks.mjs')).toEqual([
      'scripts/affected-checks.mjs',
    ]);
    expect(pathsOfStatus('')).toEqual([]);
  });

  it('a wholly untracked directory is expanded to the files inside it (defect found on 2026-11-13)', () => {
    // Hand expectation: `?? scripts/fixtures/` is a directory, not a file, so the runner must hash the
    // files it contains instead of reading the directory as one.
    const list = (dir) =>
      dir === 'scripts/fixtures/' ? ['scripts/fixtures/b.html', 'scripts/fixtures/a.md'] : [];
    expect(expandPaths(['scripts/fixtures/', 'docs/a.md'], list)).toEqual([
      'docs/a.md',
      'scripts/fixtures/a.md',
      'scripts/fixtures/b.html',
    ]);
    // The expansion is what the mapping sees, so a new fixture directory still answers test:scripts.
    expect(
      plan(expandPaths(['scripts/fixtures/'], list), { head: 'abc', files: {} }, 'affected', [])
        .steps,
    ).toContain('test:scripts');
  });
});

describe('the runner never plans a check without the step that writes what it reads', () => {
  it('an app change includes build and build:pages because their checks read them', () => {
    const answer = plan(['apps/x/src/tokens.css'], { head: 'abc', files: {} }, 'affected', [
      'x',
      'y',
    ]);
    // Hand expectation: both producers are in the plan, so a check does not run against a stale tree.
    expect(answer.steps).toEqual([
      'build',
      'build:pages',
      'check:dist',
      'format:check',
      'lint',
      'test',
      'test:e2e',
      'test:pages',
      'typecheck',
    ]);
  });

  it('no record means the full plan, and a path in no group means the full plan', () => {
    const changed = ['docs/backlog/README.md', '.gitignore'];
    expect(plan(changed, undefined, 'affected', ['x', 'y']).mode).toBe('full');
    // Hand expectation: twelve steps, the number the mapping cannot answer with fewer.
    expect(plan(changed, { head: 'abc', files: {} }, 'affected', ['x', 'y']).steps.length).toBe(12);
  });

  it('an unchanged tree with a record plans nothing', () => {
    // Hand expectation: nothing changed since the recorded full run, so the plan is empty.
    expect(plan([], { head: 'abc', files: {} }, 'affected', ['x', 'y']).steps.length).toBe(0);
  });

  it('the caller that has no record hands the plan a null, and the plan still names every step', () => {
    // Hand expectation: the caller returns null when nothing is recorded (its documented answer), so the
    // full plan must accept it. The defect was `[...changedPaths]` on that null, which stops the run
    // before any check happens - found by a full run on a worktree with no record. Tested through the
    // caller, not only through the exported mapping.
    const current = { head: 'def', files: { 'scripts/verify.mjs': 'a1' } };
    expect(changedSince(undefined, current)).toBeNull();
    expect(plan(changedSince(undefined, current), undefined, 'full', ['x', 'y']).steps.length).toBe(
      12,
    );
  });
});

describe('story 029: the command runs a step in the affected workspaces, or in the whole tree', () => {
  const ALL = ['apps/x', 'apps/y', 'packages/platform'];
  // Hand data: a recorded run, so the mapping answers a scoped plan instead of the full one.
  const record = { head: 'abc', files: {} };
  // Hand data, written here and not read from the `package.json` files the runner reads: the scripts each
  // workspace defines in its own package.json. `test:scripts` is defined by no workspace.
  const SCRIPTS = {
    'apps/x': {
      typecheck: 'tsc --build',
      lint: 'eslint .',
      'format:check': 'prettier --check .',
      test: 'vitest run',
      'test:e2e': 'playwright test',
      build: 'vite build',
      'check:dist': 'node check-dist.mjs x',
    },
    'apps/y': {
      typecheck: 'tsc --build',
      lint: 'eslint .',
      'format:check': 'prettier --check .',
      test: 'vitest run',
      'test:e2e': 'playwright test',
      build: 'vite build',
      'check:dist': 'node check-dist.mjs y',
    },
    'packages/platform': {
      typecheck: 'tsc --build',
      lint: 'eslint .',
      'format:check': 'prettier --check .',
      test: 'vitest run',
    },
  };

  it('AC1: a step the workspace defines runs in the planned workspace, with --if-present', () => {
    // Hand expectation: the app the plan names, and `--if-present` so a workspace without the script is
    // skipped instead of failing the run.
    const answer = plan(
      ['apps/x/src/tokens.css'],
      { head: 'abc', files: {} },
      'affected',
      ['x', 'y'],
      ALL,
    );
    expect(commandForStep('test', answer, ALL, SCRIPTS)).toEqual([
      'run',
      'test',
      '--if-present',
      '-w',
      'apps/x',
    ]);
    expect(commandForStep('test:e2e', answer, ALL, SCRIPTS)).toEqual([
      'run',
      'test:e2e',
      '--if-present',
      '-w',
      'apps/x',
    ]);
    expect(commandForStep('lint', answer, ALL, SCRIPTS)).toEqual([
      'run',
      'lint',
      '--if-present',
      '-w',
      'apps/x',
    ]);
  });

  it("AC2: a step no workspace defines keeps the root command, and check:dist uses build's scope", () => {
    const answer = plan(
      ['apps/x/src/tokens.css'],
      { head: 'abc', files: {} },
      'affected',
      ['x', 'y'],
      ALL,
    );
    // Hand expectation: no entry in the hand map says a workspace defines `test:scripts`, so the root
    // command runs; `check:dist` is defined in `apps/x`, the workspace build ran in.
    expect(commandForStep('test:scripts', answer, ALL, SCRIPTS)).toEqual(['run', 'test:scripts']);
    expect(commandForStep('check:dist', answer, ALL, SCRIPTS)).toEqual([
      'run',
      'check:dist',
      '--if-present',
      '-w',
      'apps/x',
    ]);
  });

  it('AC2: a changed path in no workspace keeps the whole-tree command', () => {
    // Hand expectation: `docs/` belongs to no workspace, so a run that only visits workspaces cannot see
    // it; the root command runs, and a root file is never skipped.
    const answer = plan(
      ['docs/backlog/README.md'],
      { head: 'abc', files: {} },
      'affected',
      ['x', 'y'],
      ALL,
    );
    expect(commandForStep('format:check', answer, ALL, SCRIPTS)).toEqual(['run', 'format:check']);
    expect(commandForStep('check:structure', answer, ALL, SCRIPTS)).toEqual([
      'run',
      'check:structure',
    ]);
  });

  it('AC2: a platform change runs the platform workspace and every app workspace', () => {
    // Hand expectation: the platform's own tests are not lost, and every app that consumes it runs.
    const answer = plan(
      ['packages/platform/src/lib/date.ts'],
      { head: 'abc', files: {} },
      'affected',
      ['x', 'y'],
      ALL,
    );
    expect(commandForStep('test', answer, ALL, SCRIPTS)).toEqual([
      'run',
      'test',
      '--if-present',
      '-w',
      'apps/x',
      '-w',
      'apps/y',
      '-w',
      'packages/platform',
    ]);
  });

  it('AC3: planted violation - a full run and an empty scope are never executed as a scope', () => {
    // Hand expectation: an empty list cannot mean "run nothing in no workspace"; the whole-tree command
    // covers the same work as naming all three.
    expect(commandForStep('test', { workspaces: [] }, ALL, SCRIPTS)).toEqual(['run', 'test']);
    // Hand expectation: the full plan names all three workspaces and is not scoped, so a file in no
    // workspace cannot be missed by a full run.
    const answer = plan(['apps/x/src/tokens.css'], undefined, 'full', ['x', 'y'], ALL);
    expect(answer.workspaces).toEqual(ALL);
    expect(commandForStep('test', answer, ALL, SCRIPTS)).toEqual(['run', 'test']);
  });

  it('story 025, the CI round: the write gate accepts a record only for a full run', () => {
    // Hand expectation (hak, 2026-11-14): `--full` writes the whole table, `--frozen` compares and never
    // writes, so a frozen run can never put a record into the file.
    expect(acceptsRecord('full')).toBe(true);
    expect(acceptsRecord('frozen')).toBe(false);
  });

  it('story 025, the CI round: a data-file change is answered as a full run, so the structure gate runs', () => {
    // Hand expectation (hak, 2026-11-14): a committed data file is the writer's output, not source the
    // mapping can scope. With a recorded run the mapping would answer a scoped run for a file inside a
    // workspace, so the rule is that a data-file change is answered as a full run: every step, every
    // workspace, and `check:structure` read as the whole tree.
    const answer = plan(
      ['apps/x/src/features/plan/data/fund-list.json'],
      { head: 'abc', files: {} },
      'affected',
      ['x', 'y'],
      ALL,
    );
    expect(answer.mode).toBe('full');
    expect(answer.steps).toEqual([...STEPS].sort());
    expect(answer.steps.includes('check:structure')).toBe(true);
    expect(answer.workspaces).toEqual(ALL);
    expect(commandForStep('check:structure', answer, ALL, SCRIPTS)).toEqual([
      'run',
      'check:structure',
    ]);
  });

  it('story 025, the CI round: a full run plans every step when nothing changed', () => {
    // Hand expectation: the run that publishes to main is full even for an empty change list, so the
    // writer's commit can never be verified by a plan that skips the structure gate.
    const answer = plan([], { head: 'abc', files: {} }, 'full', ['x', 'y'], ALL);
    expect(answer.changed).toEqual([]);
    expect(answer.steps).toEqual([...STEPS].sort());
    expect(answer.steps.includes('check:structure')).toBe(true);
  });

  it('AC4: the record names the mode, the workspaces the run ran, and the steps that were scoped', () => {
    // Hand expectation: the same run that scoped four steps to one workspace must say so in the record, so a
    // coverage claim cannot be read as a whole-tree run. The answer was produced by the module, the expected
    // record is written here by hand.
    const current = { head: 'def', files: { 'apps/x/src/features/plan/logic/fund.ts': 'h1' } };
    const publish = plan(
      ['apps/x/src/features/plan/logic/fund.ts'],
      record,
      'publish',
      ['x', 'y'],
      ALL,
    );
    expect(recordForRun(publish, current, SCRIPTS)).toEqual({
      mode: 'publish',
      head: 'def',
      files: current.files,
      workspaces: ['apps/x'],
      scopedSteps: ['lint', 'test', 'test:e2e', 'typecheck'],
    });
    // Hand expectation: a full run covers the whole tree, so nothing was scoped and all workspaces are named.
    expect(recordForRun(plan([], record, 'full', ['x', 'y'], ALL), current, SCRIPTS)).toEqual({
      mode: 'full',
      head: 'def',
      files: current.files,
      workspaces: ALL,
      scopedSteps: [],
    });
    // Hand expectation (story 026 AC2, unchanged): an affected run never writes the record.
    expect(
      recordForRun(
        plan(['docs/backlog/README.md'], record, 'affected', ['x', 'y'], ALL),
        current,
        SCRIPTS,
      ),
    ).toBeNull();
  });

  it('AC4: the report names the scope of each step from the same answer the command is built from', () => {
    const publish = plan(
      ['apps/x/src/features/plan/logic/fund.ts'],
      record,
      'publish',
      ['x', 'y'],
      ALL,
    );
    // Hand expectation: the scoped step names the workspace, the whole-tree step names the whole tree.
    expect(scopeText(publish, 'test:e2e', SCRIPTS)).toBe(' in apps/x');
    expect(scopeText(publish, 'check:dist', SCRIPTS)).toBe(' whole tree');
    // The two cannot disagree: the command for the same step uses the same scope.
    expect(commandForStep('test:e2e', publish, ALL, SCRIPTS)).toEqual([
      'run',
      'test:e2e',
      '--if-present',
      '-w',
      'apps/x',
    ]);
    // Hand expectation: `test:scripts` is not a workspace script, so the root command runs for it.
    expect(commandForStep('test:scripts', publish, ALL, SCRIPTS)).toEqual(['run', 'test:scripts']);
    expect(scopeText(publish, 'test:scripts', SCRIPTS)).toBe(' whole tree');
  });

  it('AC1: a publishing plan for a change outside every workspace keeps the whole-tree command for its steps', () => {
    const publish = plan(['docs/backlog/README.md'], record, 'publish', ['x', 'y'], ALL);
    // Hand expectation: eight whole-tree steps, none scoped, because a run that visits workspaces cannot see
    // the file that made the plan.
    for (const step of publish.steps) {
      expect(commandForStep(step, publish, ALL, SCRIPTS), `step ${step}`).toEqual(['run', step]);
    }
  });
});
