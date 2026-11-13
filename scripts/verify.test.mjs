import { describe, expect, it } from 'vitest';
import { plan } from './affected-checks.mjs';
import { pathsOfStatus } from './verify.mjs';

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
