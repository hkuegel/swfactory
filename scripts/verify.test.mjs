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

describe('story 027: the command runs the scoped step in the planned workspace only', () => {
  const ALL = ['apps/x', 'apps/y', 'packages/platform'];

  it('AC1: a scoped test step names the planned workspace, not the other app', () => {
    // Hand expectation: the app the plan names, and `--if-present` so a workspace without the script is
    // skipped instead of failing the run.
    const answer = plan(
      ['apps/x/src/tokens.css'],
      { head: 'abc', files: {} },
      'affected',
      ['x', 'y'],
      ALL,
    );
    expect(commandForStep('test', answer, ALL)).toEqual([
      'run',
      'test',
      '--if-present',
      '-w',
      'apps/x',
    ]);
    expect(commandForStep('test:e2e', answer, ALL)).toEqual([
      'run',
      'test:e2e',
      '--if-present',
      '-w',
      'apps/x',
    ]);
  });

  it('AC1: a step that reads the whole tree keeps the root command', () => {
    // Hand expectation: `eslint .` and prettier cannot be scoped by a path, so they are not scoped.
    const answer = plan(
      ['apps/x/src/tokens.css'],
      { head: 'abc', files: {} },
      'affected',
      ['x', 'y'],
      ALL,
    );
    expect(commandForStep('lint', answer, ALL)).toEqual(['run', 'lint']);
    expect(commandForStep('format:check', answer, ALL)).toEqual(['run', 'format:check']);
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
    expect(commandForStep('test', answer, ALL)).toEqual([
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

  it('AC3: planted violation - an empty scope names every workspace, never runs nowhere', () => {
    // Hand expectation: an empty list cannot mean "run nothing in no workspace"; the fallback names all
    // three, which is the same work the root script does today.
    expect(commandForStep('test', { workspaces: [] }, ALL)).toEqual([
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
    // Hand expectation: the full plan names all three workspaces, the same answer as before this story.
    const answer = plan(['apps/x/src/tokens.css'], undefined, 'full', ['x', 'y'], ALL);
    expect(answer.workspaces).toEqual(ALL);
  });
});
