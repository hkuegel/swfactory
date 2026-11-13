import { describe, expect, it } from 'vitest';
import { plan } from './affected-checks.mjs';
import { commandForStep, pathsOfStatus } from './verify.mjs';

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
    expect(plan([], { head: 'abc', files: {} }, 'affected', ['x', 'y']).steps).toEqual([]);
  });
});

describe('story 029: the command runs a step in the affected workspaces, or in the whole tree', () => {
  const ALL = ['apps/x', 'apps/y', 'packages/platform'];
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
});
