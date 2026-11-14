#!/usr/bin/env node
// Story 026: which checks can see a change. Two named modes, `--mode=affected` (the mapping) and
// `--mode=full`; a run is full when nothing was recorded or when it publishes to `main`.
//
// The mapping never names an app (factory files and the platform are app-agnostic): an app comes
// from the changed path `apps/<name>/...`, or from the whole `apps/` directory when the platform
// changes. Every function takes its input as data, so a test passes its own change list and a hand
// expectation instead of re-running the same table (P16); no request and no repository read here (P17).
//
// A path can be in more than one group (a markdown file inside `templates/` is read by both the
// format check and the structure check), and a path in no group is answered with the full run: the
// mapping must not say "nothing can see this change", which is the vacuity AC3 was written against.
// A check is never planned without the step it reads its input from (AC5).
//
// Step names are the npm scripts the runner calls, so there is one table, not a name-to-command map.

/** The checks of the pipeline. */
export const STEPS = Object.freeze([
  'typecheck',
  'lint',
  'format:check',
  'check:structure',
  'check:template',
  'test',
  'test:scripts',
  'build',
  'check:dist',
  'build:pages',
  'test:pages',
  'test:e2e',
]);

/** The real dependencies: each check reads what its dependency writes (AC5). */
export const NEEDS = Object.freeze({
  'check:dist': Object.freeze(['build']),
  'test:pages': Object.freeze(['build:pages']),
});

/** Prettier's own scope (the extensions `check-structure` reads too). */
const FORMATTED = /\.(md|mdx|ts|tsx|js|mjs|cjs|json|css|html|txt|yml|yaml)$/;

/** Tooling: a change here can move any check, so the run is full. */
function isTooling(path) {
  return (
    path.startsWith('scripts/') ||
    path === 'package.json' ||
    path === 'package-lock.json' ||
    path.startsWith('.github/') ||
    path.startsWith('eslint') ||
    path.startsWith('tsconfig') ||
    path.startsWith('vitest.') ||
    path.startsWith('.prettier') ||
    path === '.nvmrc'
  );
}

/**
 * A committed data file is the output of a writer script, not source the mapping can scope: the run that
 * changes it can move a hand oracle and the built page at once, so the run is full and `check:structure`
 * is planned for it (story 025, hak's rule for the writer's commit, 2026-11-14). Read app-agnostic, as
 * every mapping rule is.
 */
function isDataFile(path) {
  return path.endsWith('.json') && path.includes('/data/');
}

/** The groups a path belongs to; empty means the mapping cannot say what would see it (full run). */
export function groupsOf(path) {
  if (isTooling(path) || isDataFile(path)) return ['tooling'];
  const groups = [];
  if (path.endsWith('.md')) groups.push('markdown');
  if (path.startsWith('templates/')) groups.push('template');
  if (path.startsWith('landing/')) groups.push('landing');
  if (path.endsWith('tokens.css') || path.includes('/styles/')) groups.push('token');
  if (path.startsWith('apps/')) groups.push('app');
  if (path.startsWith('packages/')) groups.push('platform');
  return groups;
}

/** A step is never in the same level as a step it needs. */
export function levelsOf(steps) {
  const level = new Map();
  const rank = (step) => {
    if (level.has(step)) return level.get(step);
    const needs = NEEDS[step] ?? [];
    const value = needs.length === 0 ? 0 : Math.max(...needs.map((need) => rank(need))) + 1;
    level.set(step, value);
    return value;
  };
  for (const step of steps) rank(step);
  return level;
}

/** Hand-check of an assignment: a step may not sit at or before the level of a step it needs (AC5). */
export function checkLevels(assignment) {
  const offending = [];
  for (const [step, level] of Object.entries(assignment)) {
    for (const need of NEEDS[step] ?? []) {
      if (assignment[need] === undefined || level <= assignment[need]) offending.push(step);
    }
  }
  return offending.sort();
}

/** The apps a change can reach, read from the paths, never from a hard-coded list. */
export function appsIn(changedPaths, allApps) {
  const found = new Set();
  for (const path of changedPaths) {
    const match = /^apps\/([^/]+)\//.exec(path);
    if (match?.[1] !== undefined) found.add(match[1]);
  }
  // Platform code is used by every app (ADR 0006).
  if (changedPaths.some((path) => groupsOf(path).includes('platform'))) {
    for (const app of allApps) found.add(app);
  }
  return [...found].sort();
}

/**
 * Story 029: whether the runner can run one step in the affected workspaces only. Three conditions, all
 * read as data: the run is an affected run, the workspace defines the script in its own `package.json`
 * (a step the repository does not define per workspace, like `test:scripts`, cannot be scoped), and every
 * changed path lies inside a workspace - a file that belongs to no workspace (`docs/`, a root file) is not
 * seen by a run that only visits workspaces. A full run is never scoped: a full run checks the whole tree,
 * so a file outside the planned workspaces cannot be missed. Story 027 scoped the test steps with the same
 * rule; this generalises it to every step a workspace can run alone.
 */
export function runsPerWorkspace(answer, step, scriptsByWorkspace) {
  if (answer.mode !== 'affected') return false;
  const workspaces = answer.workspaces ?? [];
  const changed = answer.changed ?? [];
  if (workspaces.length === 0 || changed.length === 0) return false;
  const inside = changed.every((path) =>
    workspaces.some((workspace) => path === workspace || path.startsWith(`${workspace}/`)),
  );
  if (!inside) return false;
  // A workspace that does not define the script is skipped by `--if-present`; a step no workspace defines
  // (`test:scripts`, `check:structure`) has no per-workspace command at all, so the root command runs.
  return workspaces.some((workspace) => scriptsByWorkspace[workspace]?.[step] !== undefined);
}

/**
 * The workspaces a change can reach, read from the path prefix `apps/<name>/` or `packages/<name>/`. A
 * path the mapping cannot put in a workspace answers with all of them: a scope that runs nothing is not
 * a scope (story 026, AC3).
 */
export function workspacesOf(changedPaths, allWorkspaces) {
  const found = new Set();
  for (const path of changedPaths) {
    const match = /^(apps|packages)\/[^/]+\//.exec(path);
    if (match === null) continue;
    const workspace = path.slice(0, match[0].length - 1);
    found.add(workspace);
    // The platform is consumed as source by every app (ADR 0006), so a platform change reaches every app
    // workspace too; the platform's own tests must not be lost by the scoping.
    if (groupsOf(path).includes('platform')) {
      for (const workspace of allWorkspaces) {
        if (workspace.startsWith('apps/')) found.add(workspace);
      }
    }
  }
  return found.size === 0 ? [...allWorkspaces].sort() : [...found].sort();
}

/** AC1: the checks that can see the change. */
export function affectedPlan(changedPaths, allApps, allWorkspaces = []) {
  const groups = new Set(changedPaths.flatMap(groupsOf));
  const ungrouped = changedPaths.some((path) => groupsOf(path).length === 0);
  if (groups.has('tooling') || ungrouped) {
    return {
      mode: 'affected',
      changed: [...changedPaths],
      steps: [...STEPS].sort(),
      apps: [...allApps].sort(),
      workspaces: [...allWorkspaces].sort(),
    };
  }

  const steps = new Set();
  if (groups.has('markdown')) {
    steps.add('check:structure');
  }
  if (groups.has('template')) {
    // `check:structure` scans `templates/` (rule 1), so a template change can regress it too.
    steps.add('check:template');
    steps.add('check:structure');
  }
  if (groups.has('landing')) {
    steps.add('build:pages');
    steps.add('test:pages');
  }
  if (groups.has('app') || groups.has('platform') || groups.has('token')) {
    steps.add('typecheck');
    steps.add('lint');
    steps.add('test');
    steps.add('check:dist');
    steps.add('test:e2e');
    // A token decides a colour, so the pixel comparison of the published page must run too.
    if (groups.has('token')) steps.add('test:pages');
  }
  // Prettier reads the whole tree, so any file in its scope can regress it.
  if (changedPaths.some((path) => FORMATTED.test(path))) steps.add('format:check');

  // AC5: a check is never planned without the step that writes what it reads.
  for (const step of [...steps]) for (const need of NEEDS[step] ?? []) steps.add(need);

  return {
    mode: 'affected',
    changed: [...changedPaths],
    steps: [...steps].sort(),
    apps: appsIn(changedPaths, allApps),
    workspaces: workspacesOf(changedPaths, allWorkspaces),
  };
}

/**
 * AC2: with no recorded full run every check runs. A check is skipped only when its inputs did not
 * change since a recorded full run, never because a pattern calls it unimportant.
 */
export function plan(changedPaths, record, mode, allApps, allWorkspaces = []) {
  // A data-file change is a full run before the record is read, so a recorded run can never make it skip a
  // workspace (story 025, hak's rule of 2026-11-14).
  if (mode === 'full' || record === undefined || record === null || changedPaths.some(isDataFile)) {
    return {
      mode: 'full',
      changed: [...changedPaths],
      steps: [...STEPS].sort(),
      apps: [...allApps].sort(),
      workspaces: [...allWorkspaces].sort(),
    };
  }
  return affectedPlan(changedPaths, allApps, allWorkspaces);
}
