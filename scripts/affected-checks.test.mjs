import { describe, expect, it } from 'vitest';
import {
  STEPS,
  affectedPlan,
  appsIn,
  checkLevels,
  groupsOf,
  levelsOf,
  plan,
} from './affected-checks.mjs';

// Story 026, fixture mode: the change lists and the expected answers are written by hand here, so the
// oracle is not the table the module reads (P16). No request, no repository read (P17); the mode is
// named in every call. App names are placeholders (`x`, `y`), because factory files must not name an
// app. Only the mapping and the level graph are asserted, never a duration.

/** The full run, written out by hand in alphabetical order. */
const HAND_FULL = [
  'build',
  'build:pages',
  'check:dist',
  'check:structure',
  'check:template',
  'format:check',
  'lint',
  'test',
  'test:e2e',
  'test:pages',
  'test:scripts',
  'typecheck',
];

const HAND = {
  // AC1, the five input groups. Prettier reads the whole tree, so it is in every answer for a file it
  // formats; `build` and `build:pages` are in an answer when a check reads what they write (AC5).
  markdown: {
    paths: ['docs/backlog/026-process-slimming.md'],
    steps: ['check:structure', 'format:check'],
  },
  appSource: {
    paths: ['apps/x/src/features/plan/logic/fund.ts'],
    steps: ['build', 'check:dist', 'format:check', 'lint', 'test', 'test:e2e', 'typecheck'],
  },
  platformSource: {
    paths: ['packages/platform/src/lib/date.ts'],
    steps: ['build', 'check:dist', 'format:check', 'lint', 'test', 'test:e2e', 'typecheck'],
  },
  token: {
    paths: ['apps/x/src/tokens.css'],
    steps: [
      'build',
      'build:pages',
      'check:dist',
      'format:check',
      'lint',
      'test',
      'test:e2e',
      'test:pages',
      'typecheck',
    ],
  },
  tooling: { paths: ['scripts/affected-checks.mjs'], steps: HAND_FULL },
};

describe('AC1: the mapping answers with the checks that can see the change', () => {
  for (const [name, fixture] of Object.entries(HAND)) {
    it(`AC1: ${name}`, () => {
      const answer = affectedPlan(fixture.paths, ['x', 'y']);
      expect(answer.mode, name).toBe('affected');
      expect(answer.steps, name).toEqual(fixture.steps);
    });
  }

  it('AC1: the app named by the path is the app the run covers, the platform covers every app', () => {
    // Hand expectation: one app for an app path, both apps for a platform path.
    expect(appsIn(['apps/x/src/tokens.css'], ['x', 'y'])).toEqual(['x']);
    expect(appsIn(['packages/platform/src/lib/date.ts'], ['x', 'y'])).toEqual(['x', 'y']);
  });

  it('AC1: a template markdown file is read by the format check and by the structure check', () => {
    // Hand expectation: the path belongs to two groups, so both checks run.
    expect(groupsOf('docs/templates/story.md')).toEqual(['markdown']);
    expect(groupsOf('templates/app/package.json')).toEqual(['template']);
    const answer = affectedPlan(['docs/templates/story.md'], ['x', 'y']);
    expect(answer.steps).toEqual(['check:structure', 'format:check']);
    // Hand expectation: `check-structure` scans `templates/`, so a template file that is not markdown
    // runs the structure check as well, not only the template check.
    expect(affectedPlan(['templates/app/package.json'], ['x', 'y']).steps).toEqual([
      'check:structure',
      'check:template',
      'format:check',
    ]);
  });

  it('AC1: planted violation - a path the mapping cannot group is a full run, never an empty plan', () => {
    // Hand expectation: the mapping may not answer "nothing can see this change".
    expect(groupsOf('.gitignore')).toEqual([]);
    expect(affectedPlan(['docs/backlog/README.md', '.gitignore'], ['x', 'y']).steps).toEqual(
      HAND_FULL,
    );
  });
});

describe('AC2: nothing recorded means every check runs', () => {
  it('AC2: no recorded full run, so a markdown-only change still runs every check', () => {
    const answer = plan(HAND.markdown.paths, undefined, 'affected', ['x', 'y']);
    expect(answer.mode).toBe('full');
    expect(answer.steps).toEqual(HAND_FULL);
  });

  it('AC2: a recorded full run lets the mapping skip what cannot see the change', () => {
    const answer = plan(HAND.markdown.paths, { head: 'abc', files: {} }, 'affected', ['x', 'y']);
    expect(answer.mode).toBe('affected');
    expect(answer.steps).toEqual(HAND.markdown.steps);
  });
});

describe('AC3: planted violation - skip cannot mean skip everything', () => {
  it('AC3: a helper that only an e2e spec reads still needs the e2e run', () => {
    const answer = affectedPlan(['apps/x/e2e/x.helpers.ts'], ['x', 'y']);
    expect(answer.steps).toContain('test:e2e');
  });

  it('AC3: the same answer for a markdown-only change does not include the e2e run', () => {
    const answer = affectedPlan(['docs/backlog/README.md'], ['x', 'y']);
    expect(answer.steps).not.toContain('test:e2e');
    expect(answer.steps).toEqual(HAND.markdown.steps);
  });

  it('AC3: a planted violation that reads a helper through a platform path reaches every app', () => {
    expect(affectedPlan(['packages/platform/e2e/fixtures.ts'], ['x', 'y']).apps).toEqual([
      'x',
      'y',
    ]);
  });
});

describe('AC4: the mode is named, a publishing run is always full', () => {
  it('AC4: a recorded run plus mode full stays full, so the publish run cannot lose its checks', () => {
    const answer = plan(HAND.markdown.paths, { head: 'abc', files: {} }, 'full', ['x', 'y']);
    expect(answer.mode).toBe('full');
    expect(answer.steps).toEqual(HAND_FULL);
    // Hand expectation: the steps that produce and test the published site are in the full plan.
    expect(answer.steps).toContain('build:pages');
    expect(answer.steps).toContain('test:pages');
  });
});

describe('AC5: levels - a step is never in the level of a step it needs', () => {
  it('AC5: check:dist runs after build, the chain is at most three levels', () => {
    const level = levelsOf([...STEPS]);
    // Hand expectation: build and build:pages have no dependency, their checks read what they write.
    expect(level.get('build')).toBe(0);
    expect(level.get('check:dist')).toBe(1);
    expect(level.get('build:pages')).toBe(0);
    expect(level.get('test:pages')).toBe(1);
    expect(Math.max(...level.values()) + 1).toBeLessThanOrEqual(3);
  });

  it('AC5: planted violation - a dependent step in the level of its dependency, or without it', () => {
    // Hand expectation: the runner rejects build and check:dist in the same level, rejects check:dist
    // when build is not in the plan at all, and accepts the same two steps one level apart.
    expect(checkLevels({ build: 0, 'check:dist': 0 })).toEqual(['check:dist']);
    expect(checkLevels({ 'check:dist': 1 })).toEqual(['check:dist']);
    expect(checkLevels({ build: 0, 'check:dist': 1 })).toEqual([]);
  });

  it('AC5: the mapping never plans a check without the step that writes what it reads', () => {
    const answer = affectedPlan(['apps/x/src/tokens.css'], ['x', 'y']);
    const assignment = Object.fromEntries(
      answer.steps.map((step) => [step, levelsOf(answer.steps).get(step)]),
    );
    expect(checkLevels(assignment)).toEqual([]);
    expect(answer.steps).toContain('build');
    expect(answer.steps).toContain('build:pages');
  });
});
