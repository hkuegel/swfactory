---
id: 021
title: Factory checks pass on Windows
status: done
type: bug
app: platform
branch: fix/021-cross-platform-checks
supersedes: []
changes: [011]
superseded-by:
---

# 021 – Factory checks pass on Windows

## Original request

> ich will das swfactory von meinem github (hkuegel) auschecken und bearbeiten

The first `npm run verify` on hak's Windows machine failed (Prettier on all files,
then `check:structure` with a TypeError). hak approved fixing the Windows incompatibility
of the factory scripts and continuing the checks (see Decision log).

## User story

As a developer on Windows, I want `npm run verify` to run the same checks as on the
Ubuntu CI runner, so that local results match CI and real defects are not masked by
path-format crashes.

## Context

The factory was built and verified on Linux. Linux paths use `/`; Windows paths use `\`.
Four places assume `/` or a bare executable name, which breaks on Windows:

1. `scripts/check-structure.mjs` — story paths built with `join()` are split on `/`
   (lines 157 and 346), so the story-id regex sees the whole path and crashes.
2. `scripts/check-template.mjs` and `scripts/build-pages.mjs` — spawn the
   `node_modules/.bin` shims directly; on Windows the shims are `.cmd` files, and
   Node >= 23 refuses to spawn `.cmd` without a shell (`spawnSync` → `EINVAL`), so
   every spawn of these scripts fails on hak's machine (Node 24).
3. `packages/platform/src/test/tokenRules.ts` — `readCss()` keys CSS files by the raw
   `readdirSync` result; on Windows the keys contain `\`, so exact key lookups in
   `tokens.test.ts` return empty strings.
4. `packages/platform/config/vite.ts` — Vitest serves the shared setup file through a
   `/@fs/C:/…` URL when the project root is `templates/app`; the default
   `server.fs.allow` does not cover the repo root there, so both template suites fail
   with "Cannot find module". (The apps are npm workspaces, so their default allow
   already covers the repo root; only the skeleton is affected.)

## Acceptance criteria

- **AC1:** Given a Windows checkout, when `npm run check:structure` runs on a clean
  repo, then it prints the same ok summary as on Linux instead of crashing, and it
  still detects a planted violation (non-vacuous check).
- **AC2:** Given Windows, when `npm run check:template` runs on the passing skeleton,
  then it runs the skeleton's vitest and tsc and prints ok.
- **AC3:** Given Windows, when `npm test` runs, then the token tests pass with the
  same key semantics as on Linux (`src/…` keys, no path separators in them).
- **AC4:** Given Windows, when `npm run verify` runs, then every step is green; CI on
  Linux remains green (no behaviour change there).

## Out of scope

- Making CRLF line endings acceptable to Prettier — the repo stores LF and the local
  checkout is normalized to LF (`core.autocrlf=input`), which is the intended setup.
- e2e differences between Windows (SwiftShader/fonts) and the Ubuntu runner; local
  Windows e2e results are reported but do not redefine CI expectations.

## Open questions

- How to treat the two Windows-only pixel assertions (see Test report): accept them as an
  environment difference and keep CI the oracle, or loosen the harness tolerances so the same
  tests are green on both platforms. Needs hak's decision — an oracle may not be changed without it.
  _(answered: loosen the tolerances to the measured floor, see Decision log.)_
- None open. (Earlier: which git identity to use on this machine — answered, see Decision log.)

## Decision log

- 2026-11-12 — Q: May `check-structure.mjs` be fixed for Windows (story path split) —
  A: Yes, fix it and continue verifying (hak).
- 2026-11-12 — Q: Fix on `main` or a branch — A: Fix branch, by convention
  `fix/021-cross-platform-checks` (hak).
- 2026-11-12 — Q: May `check-template.mjs` also be made Windows-compatible —
  A: Yes, if the running verify fails there, as expected (hak).
- 2026-11-12 — Q: Story file for this fix — A: Yes, story 021 in the platform backlog
  (hak).
- 2026-11-12 — Q: Local e2e on Windows or CI only — A: Local on Windows is fine;
  differences to the Ubuntu runner are accepted (hak).
- 2026-11-12 — Finding during implementation: `check:template` still failed on
  Windows after the `.cmd` fix; `spawnSync` throws `EINVAL` for `.cmd` files without
  `shell: true` on Node >= 23. Scope extended to `build-pages.mjs`, which uses the
  same direct-spawn pattern. (orchestrator, in the story's design)
- 2026-11-12 — Tester: full verify green on Windows; local e2e green except two avd
  pixel assertions, measured and recorded in the Test report. Decision pending (hak).
- 2026-11-12 — Q: the two Windows-only pixel assertions — A: loosen the harness tolerances
  to the measured noise floor of both platforms (documented, non-vacuity kept); the oracle
  is not dropped (hak).
- 2026-11-12 — Q: gate 1 — A: story committed on `main`, the code stays on the fix branch (hak).
- 2026-11-12 — Q: reviewer pass now — A: yes, the full reviewer checklist (hak).
- 2026-11-12 — Q: git has no identity on this machine, which one to use — A: hak's identity,
  `haraldkuegel <harald.kuegel@firstwaters.com>` (the one in the existing history); set with
  `git config --local`, not globally (hak).
- 2026-11-12 — Tester after the harness change: full verify green and e2e 80/80 (avd) and
  110/110 (minesweeper) on Windows in one run.
- 2026-11-12 — Gate 2 (hak): all four retro proposals P1–P4 approved and applied to CLAUDE.md and
  `.claude/agents/`. Finding L1 (unquoted command path under `shell: true`, measured on Windows)
  fixed in this story. Commit: on the fix branch, no push (hak).

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_n.a. — no UI._

## Technical design

_architect: four small cross-platform fixes in test/factory code only; no product
behaviour changes:_

- `check-structure.mjs`: replace `story.split('/').pop()` with `basename(story)` in
  both rules (the paths come from `join()`, so they are platform-native).
- `check-template.mjs` and `build-pages.mjs`: run the `.cmd` shims through
  `shell: true` on `win32` (Node >= 23 rejects spawning `.cmd` without a shell).
  Argument lists contain no shell metacharacters or spaces, so quoting is safe.
- `tokenRules.ts` `readCss()`: normalize the readdir result to `/` keys so tests see
  the same keys on both platforms; reading with `join()` is already fine.
- `config/vite.ts`: add `server.fs.allow: [repoRoot]` — on Linux this is already the
  effective default, so CI behaviour is unchanged; on Windows it makes the setup file
  servable for `templates/app`.
- Minimal test set: no new test files. The checks themselves are the oracle (AC1, AC2);
  AC3 is covered by the existing token tests; AC4 by a full green `npm run verify`.
  AC1 is proven non-vacuous by planting a dead link once on Windows.

## Implementation notes

_developer: applied exactly the four fixes from the design, in one change
(cross-cutting, cannot be split into green steps per file). Local Prettier was run
once to normalize the working tree to LF, which produced no content diff in git._

_Follow-up on hak's decision (see Decision log): the two avd harness bounds were
loosened to the measured noise floor of both platforms — `RASTER_NOISE_FLOOR = 4` in
`e2e/avd.helpers.ts` (used by `expectSavingUnchanged`) and the end-blend filter in
`avd-chart-colours.spec.ts` AC4. Both are documented with their measurements, and both
stay non-vacuous (Test report)._

_Post follow-up at the merge of `main` (2026-11-12, the landing page story): the landing build added a
second direct `vite` spawn in `build-pages.mjs`; it inherits the same `.cmd` + `shell: true` handling,
because the L1 quoting needs the shell. Green on Windows after the merge._

## Test report

_tester:_

| AC  | Test(s)                                                                                                                        | Result                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| AC1 | `npm run check:structure` on Windows; non-vacuity: planted dead link in `docs/`                                                | ok — ok summary (21 stories); the planted link was reported, then removed |
| AC2 | `npm run check:template` on Windows (skeleton vitest + tsc)                                                                    | ok — `check-template: ok templates/app`                                   |
| AC3 | `npm test` on Windows: platform 154, avd 100, minesweeper 103 tests                                                            | ok — 358 passed, 0 failed                                                 |
| AC4 | full `npm run verify` on Windows (typecheck → lint → format → structure → template → tests → build → dist check → build:pages) | green                                                                     |

### e2e on Windows (local, beyond the ACs)

- After the harness bounds were loosened (see below): `apps/avd` 80 of 80, `apps/minesweeper`
  110 of 110, platform sign-in specs green; `npm run verify` green in the same run.
- Before that change the two avd tests failed only on Windows, both deterministic (reproduced twice):
  - `avd-reinvest.spec.ts` AC1 — `differingPixels` expects 0, got 2.
  - `avd-chart-colours.spec.ts` AC4 — the last run of the last bar is `other` instead of `canvas`.
- Measurements (throw-away probe, removed): the same chart captured four times in a row differs in
  **0** pixels at tolerance 0 — the raster is deterministic. After the reinvest toggle the chart is
  re-rendered: 2 pixels differ beyond tolerance 2 (max 3/255; 2480 pixels differ at tolerance 0),
  while its HTML is identical. In forced colours the last bar's centre column ends with a 3 px
  blend run `other` at rgb(45,45,45), which becomes the "last run" the assertion reads.
- Reading: no product defect — the DOM is identical, only the repaint's subpixel raster differs.
  Both tolerances (noise ≤ 1/255, anti-aliased runs < 3 px) were measured on the Ubuntu runner,
  where CI is green; Windows produces noise up to 3/255 and a 3 px edge blend.

### Non-vacuity of the loosened bounds (measured on Windows, throw-away probe, removed)

- `differingPixels`: recolouring one segment (the top segment of the last bar, 12 px, outside the
  palette) gives **1749** differing pixels at tolerance 2 — 435× the new floor of 4.
- `barRuns`: the same recoloured segment shows as `other:20` in the last bar, i.e. above the
  filter's 4 px limit, so the assertion still reads it; only genuine end blends are ignored.
- The two avd specs are green on Windows with the loosened bounds; on Linux the values stay
  0 and no end blend exists, so CI keeps the same oracles with more headroom.

## Review

_reviewer (checklist v2, read fresh):_ **APPROVED** — two low findings, nothing that blocks the commit.

| Item  | Result | Reason                                                                                                                                                                                                                                                                                                                                                                    |
| ----- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1    | pass   | AC1 `scripts/check-structure.mjs` `basename()` (both rules) — green run plus the planted dead link; AC2 `scripts/check-template.mjs` `.cmd` + `shell` — green run plus the planted failing test; AC3 `tokenRules.ts` `readCss()` key normalization — `tokens.test.ts` reads the key `src/zz-probe.css` during the hand probe; AC4 full `npm run verify` green on Windows. |
| C2    | n.a.   | no network call or pending state in the diff.                                                                                                                                                                                                                                                                                                                             |
| C3    | n.a.   | no hook or component logic changed.                                                                                                                                                                                                                                                                                                                                       |
| C4    | n.a.   | no render loop or imperative controller changed.                                                                                                                                                                                                                                                                                                                          |
| C5    | n.a.   | no reducer changed.                                                                                                                                                                                                                                                                                                                                                       |
| C6    | pass   | `run()` returns false when the spawn fails (status is null, not 0) and the check prints `FAILED` + exit 1; `build-pages.mjs` reports a non-zero status. Probed by hand, see S5.                                                                                                                                                                                           |
| S1    | pass   | no user input reaches a sink; the shell call takes fixed literal arguments (finding L1).                                                                                                                                                                                                                                                                                  |
| S2    | pass   | no secrets; `config/vite.ts` adds only a path.                                                                                                                                                                                                                                                                                                                            |
| S3    | n.a.   | `package.json` dependencies unchanged.                                                                                                                                                                                                                                                                                                                                    |
| S4    | n.a.   | no dev-only code added.                                                                                                                                                                                                                                                                                                                                                   |
| S5    | pass   | touched scripts exercised by `verify` and hand-run on Windows: planted failing test (vitest path) → `check-template: FAILED`; planted `Type 'string' is not assignable to type 'number'` (tsc path) → `check-template: FAILED`; planted colour literal → reported as `src/zz-probe.css: colour literal`; planted dead link → reported. All probes removed.                |
| T1    | pass   | `npm run verify` run by the reviewer on Windows: green.                                                                                                                                                                                                                                                                                                                   |
| T2    | pass   | no new test files; one test per AC, the changed assertions stay in the existing specs.                                                                                                                                                                                                                                                                                    |
| T3    | pass   | the loosened bounds stay non-vacuous: planted change = 1749 px against the floor of 4; a real recoloured segment reads as `other:20`, above the 4 px filter.                                                                                                                                                                                                              |
| T4    | pass   | no counted Tab sequences or coordinates of moving elements added; specs still named after ACs.                                                                                                                                                                                                                                                                            |
| T5    | pass   | the new branch logic is in the check scripts, which the story records as having no test (the checks are the oracle) plus the recorded hand probes.                                                                                                                                                                                                                        |
| K1    | pass   | matches the design; the harness deviation is recorded in Implementation notes. During review `RASTER_NOISE_FLOOR` was changed from an unused export to a module-local constant.                                                                                                                                                                                           |
| K2    | pass   | no `any`, no `!`, named exports.                                                                                                                                                                                                                                                                                                                                          |
| K3    | n.a.   | no CSS changed.                                                                                                                                                                                                                                                                                                                                                           |
| K4    | pass   | platform files stay generic (no app named); `check:structure` green.                                                                                                                                                                                                                                                                                                      |
| K6    | pass   | status `in-review` equals the index row.                                                                                                                                                                                                                                                                                                                                  |
| K7    | pass   | one entry per answer from hak, append only.                                                                                                                                                                                                                                                                                                                               |
| K8    | n.a.   | nothing user-visible for an app user; the root README makes no platform claim.                                                                                                                                                                                                                                                                                            |
| K9    | pass   | prettier green.                                                                                                                                                                                                                                                                                                                                                           |
| K10   | n.a.   | no workspace script or tsconfig changed.                                                                                                                                                                                                                                                                                                                                  |
| K11   | n.a.   | no env variable added.                                                                                                                                                                                                                                                                                                                                                    |
| A1–A4 | n.a.   | no control, colour, UI, animation or canvas code changed.                                                                                                                                                                                                                                                                                                                 |

**Findings**

- **L1 (low)** `scripts/check-template.mjs:20` — with `shell: true` the command path is passed unquoted, so a
  checkout under a path containing a space fails. Measured on Windows: unquoted `status 1`
  (`Der Befehl "…opencode/with" ist entweder falsch geschrieben`), the same path quoted → `status 0`.
  Hak's path has no space, so nothing fails today. **Fixed at gate 2** (hak's decision): the command is
  quoted when the shell is used, in `check-template.mjs` and `build-pages.mjs`; verify green after the fix.
- **L2 (low)** `shell: true` with arguments prints Node's `DEP0190` deprecation warning on every Windows run of
  `check:template` and `build:pages` (arguments are concatenated, not escaped). Harmless with fixed literal
  arguments, but it is permanent noise in the output.

## Explanation

The factory checks were written on Linux and assumed two things that are not true on Windows: that path
names use `/`, and that a command in `node_modules/.bin` can be started directly. Story paths come out
with `\`, so the story-id rule read a whole path instead of the file name; the `.bin` entries are `.cmd`
files, which Node 23 and newer refuse to start without a shell; the token test stored CSS files under
their raw Windows name, so `src/…` lookups found nothing; and the app skeleton setup file was not servable.
All fixed, so `npm run verify` is green on Windows, exactly as on Linux.

Two avd tests were green on Linux and red on Windows, both on pixel comparisons. Identical captures are
identical on both machines; but a re-render reaches 3/255 in two pixels on Windows, and in forced colours
a bar ending between pixels leaves a 3 px blend the test read as fill. Those numbers were measured on the
runner only. With hak's decision both bounds are now the floor of the two platforms (4 px; blends of at
most 4 px count as anti-aliasing), which keeps Windows green and Linux unchanged, and both still catch a
planted change.

The reviewer ran the checks themselves and probed their failure paths on Windows by planting one bad input
per check: a failing test, a type error, a colour literal, a dead link — all were reported, so no check is
vacuous. The unquoted command path found in review (a path with a space) was fixed in this story.

## Retrospective

**Why the bug got through**

- **The factory was built on one machine.** Every rule that compares paths or starts a `.bin` command was
  written against Linux behaviour, and the CI oracle was Linux only. Nothing in the Definition of Done asked
  for a green run on hak's machine, so the Windows gap stayed invisible until the first run there.
- **Measured numbers were treated as universal.** The pixel tolerances carry their measurement, but the
  measurement was taken on the runner only, and a machine with a different rasterisation reached that number
  legitimately. The harness had no way to say "this is the floor of this platform".
- **This fix:** four one-line-level changes, plus the two harness bounds, which are a decision about an
  oracle and therefore needed hak.

**Proposed changes**

- **P1 (CLAUDE.md, test rules):** "A pixel tolerance in a shared harness is the measured noise floor of every
  machine the tests run on (CI runner and hak's machine), stated with its measurement. A bound that is
  loosened must show a non-vacuity measurement in the Test report."
- **P2 (`.claude/agents/devops.md` / factory scripts):** "Scripts that run `node_modules/.bin` entries must
  handle Windows: the `.cmd` name and `shell: true` (Node >= 23 rejects `.cmd` without a shell), and the
  command path is quoted when a shell is used. Names derived from a path use `basename()`, never `split('/')`."
- **P3 (process, orchestrator):** "Before the first commit on a machine, ask hak for the git identity and set
  it in the repository (`git config --local`), not globally."
- **P4 (`.claude/agents/tester.md`):** "When a check or a harness bound is changed, run its failure path by
  hand once with a deliberately bad input, on the machine where the change is made."

**Outcome (gate 2):** approved by hak on 2026-11-12: P1–P4 applied (CLAUDE.md, `.claude/agents/`),
finding L1 fixed in this story, commit on the fix branch without push.

### Cost

| Role                        | Round | Model | Tokens       | Tool uses | Duration |
| --------------------------- | ----- | ----- | ------------ | --------- | -------- |
| product-owner               | 1     | n/a   | n/a          | n/a       | n/a      |
| architect                   | 1     | n/a   | n/a          | n/a       | n/a      |
| developer                   | 1     | n/a   | n/a          | n/a       | n/a      |
| tester                      | 1     | n/a   | n/a          | n/a       | n/a      |
| reviewer                    | 1     | n/a   | n/a          | n/a       | n/a      |
| **total**                   | —     | n/a   | n/a          | n/a       | n/a      |
| orchestrator (main session) | 1     | n/a   | not measured | n/a       | n/a      |

_All roles were carried by the orchestrator (single session) on Windows; usage was not measured per role._
