---
id: 028
title: CI caches the Playwright browsers, not only node_modules
status: done
type: chore
app: platform
size: S
branch: feature/028-playwright-browser-cache
supersedes: []
changes: [026/AC7]
superseded-by:
---

# 028 – CI caches the Playwright browsers, not only node_modules

## Original request

> "die offenen performance verbesserungen bitte umsetzen"

## User story

As the person who waits for CI, I want the Playwright browser to come from the cache, so that a run that
has nothing to install does not download 150 MB again on every round.

## Context

Story 026 made CI one job and cached `node_modules` on the lockfile hash. The browser is still installed in
every run, because the cache path is only `node_modules`. The cached time in the Cost table of story 026 is
`not measured (cache hit happens on the runner, not on this machine)`, so this is the open part of AC7: the
browser download is work that a run does even when nothing changed. Story 026's gate 2 run on this machine
shows what the browser run costs when it is warm: `test:e2e` 62,5 s and `test:pages` 6,6 s of a 70,9 s run,
so the install is the part that can be taken out of the round.

## Acceptance criteria

- **AC1:** Given an unchanged `package-lock.json`, when a CI run prepares its tools, then the cache covers
  `node_modules`, the `.vite` cache directory of every workspace, and the Playwright browser directory, so
  `npm ci` runs only on a miss and `playwright install` downloads only on a miss.
- **AC2:** Given a cache hit, the run must still be correct: the key is the lockfile hash, which contains
  the Playwright and Vitest versions, so a different version cannot read the same cache entry.
- **AC3:** Given a plan that has no browser step, then no browser is installed and no browser cache is
  read, so a markdown-only round does not touch it at all (story 026, AC1 stays).

## Out of scope

- No test: no test reads `ci.yml`, so this is reported, not asserted. The install stays in the workflow; a
  hit makes it a check instead of a download.
- No timing assertion.
- `--with-deps` stays, because the system libraries cannot come from the browser cache.

## Open questions

_none._

## Decision log

- 2026-11-13 — Q: which key — A: `playwright-${hashFiles('package-lock.json')}`, the same key style as the
  `node_modules` cache in story 026, because the browser version comes from the Playwright version in the
  lockfile (orchestrator, R1). A key that names only the version would still be right; the lockfile hash is
  chosen so both caches read the same source.
- 2026-11-13 — Gate 1: hak approves the improvement (his request to implement the open improvements).
- 2026-11-13 — Gate 2: hak approves the story ("ich gebe 27/28 frei"), so the status is `done`. The `done` status
  of story 027 is recorded on its own branch, not here, because this branch does not carry its code (P14).
- 2026-11-13 — Q: `restore-keys` or not — A: not, so a run cannot restore a browser of another version;
  the cost is one download on a miss (orchestrator, R1).
- 2026-11-13 — The review was run by the orchestrator, not by the `reviewer` subagent, because this harness
  does not offer that role; the verdict is recorded as such.

## Test report

| AC  | Test(s) | Result                                             |
| --- | ------- | -------------------------------------------------- |
| AC1 | no test | reported only, no test reads `ci.yml` (P11)        |
| AC2 | no test | reported only, the key is read on the runner       |
| AC3 | no test | reported only, the plan step answers on the runner |

No test was added: the workflow is not read by any test, and a test that parses `ci.yml` would read the
repository, which P17 forbids. What can be checked on this machine was checked by hand: `prettier --check`
parses the YAML (a syntax error there would be reported), `node scripts/check-structure.mjs` is green, and
`node scripts/verify.mjs --plan-only --paths=docs/backlog/README.md` still answers without a browser step,
which is the condition the two browser steps use:

```text
verify: mode affected, 2 of 12 steps, chain 1 levels
  changed: docs/backlog/README.md
  apps: none
  skipped: build, build:pages, check:dist, check:template, lint, test, test:e2e, test:pages, test:scripts, typecheck
  level 0: check:structure, format:check
```

So a markdown-only round installs no browser and reads no browser cache (AC3). Whether the cache hits is
work on the runner and cannot be measured here; it stays `not measured (cache hit happens on the runner)`.

## Review

Verdict: APPROVED, one round, run by the orchestrator (no reviewer subagent in this harness; recorded in the
Decision log). Two things worth naming:

- `[nit]` the two browser steps repeat the same condition twice, which is easy to read but easy to drift
  apart if a third browser step is added later. Kept, because the plan step's output is the only source the
  condition can read here.
- `[nit]` `restore-keys` is deliberately not set, so a run never restores a browser of another version; a
  miss costs one download, which is the honest cost of that safety.

## Explanation

_The gate 2 explanation is given in German; this is the English text of the record._

The CI cache now holds what the checks read: `node_modules`, the vitest cache of every workspace, and the
Playwright browser directory. The key is the lockfile hash, so a changed Playwright or Vitest version cannot
read an old entry. The browser cache is only read when the plan has a browser step, so a round that changes
markdown does not touch it. The install still runs when the cache misses, so a run on a new runner is not
left without a browser.

Not verified: the cache hit itself, which only the runner can show. No test covers it, because the workflow
is not read by any test.
