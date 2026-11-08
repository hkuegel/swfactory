---
id: 020
title: Minesweeper 3D loads in the production build (palette accepts shortened hex colours)
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: bug # feature | bug | chore
app: minesweeper # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<name>/docs/backlog)
branch: fix/020-minesweeper-3d-production-palette
supersedes: [] # stories this one fully replaces, e.g. [004]
changes: [] # no AC of 009 becomes false; 009/AC6 (load failure message) is the symptom, not a changed rule
superseded-by: # set on the OLD story when a newer one replaces it
---

# 020 – Minesweeper 3D loads in the production build (palette accepts shortened hex colours)

## Original request

> hak, 2026-11-08: "/fix Minesweeper 3D lädt im Produktions-Build nicht (GitHub Pages): CSS-Minifier kürzt #ffffff zu #fff, Palette akzeptiert nur 6-stellige Hex-Farben"

Before that, hak reported (verbatim):

> "die minesweeper app die auf github deployed ist, hat wieder das problem dass 3d nicht geladen werden kann"

## User story

As a player of the deployed Minesweeper, I want the 3D view to load in the production build, so that I can play in 3D on the live site as I can locally.

## Context

Observed by the orchestrator, 2026-11-08:

- On `https://hkuegel.github.io/swfactory/minesweeper/`, choosing the 3D view shows "3D could not be loaded. The board stays in 2D." (the load-failure message of [009/AC6](009-minesweeper-3d-visual-upgrade.md)). Reproduced locally with the identical deploy build (`npm run build:pages`, served under `/swfactory/minesweeper/`): the lazy 3D chunk loads (HTTP 200, module evaluates, exports `createBoardScene`), then scene creation throws.
- Cause: the production CSS minifier shortens `#ffffff` to `#fff`. The browser returns custom properties as authored in the CSS, so `--scene-fill-sky` and `--color-on-danger-solid` read `#fff`. The palette reader accepts only 6-digit hex colours and throws, which the app reports as "could not be loaded". The palette is read from CSS tokens as designed in [009](009-minesweeper-3d-visual-upgrade.md).
- Scope: every production build of the app since story 009, not only GitHub Pages. It went unnoticed because all e2e specs run against the dev server (no minification), and the Pages smoke test of [018](../../../../docs/backlog/018-deploy-github-pages.md) checks only sign-in, reload and sign-out, not 3D.
- Fix direction is left to the architect and developer; the criteria below state only the observable behaviour.

## Acceptance criteria

- **AC1:** Given a production build of Minesweeper (the standard build and the GitHub Pages deploy build, both minified), when I sign in and choose "3D", then the 3D board is shown and neither the message "3D could not be loaded. The board stays in 2D." nor an error appears. This is checked by an automated test against a production build, for example the Pages smoke test (`npm run test:pages`) choosing 3D for Minesweeper and waiting until the 3D view is ready, and the test fails if the failure message shows.
- **AC2:** Given a scene colour token that reaches the page in a shortened or differently written notation (at least `#rgb` and `#rrggbb`, upper or lower case), when the 3D scene is created, then it renders the same colours as for the authored 6-digit value (for example `#fff` equals `#ffffff`). Given a token value that is not a valid colour, then scene creation fails with a clear message that names the token, and there is no silent fallback colour.
- **AC3:** Given the dev server and the e2e mode (unminified), when I use the 3D view, then it behaves as before, and the ACs of [009](009-minesweeper-3d-visual-upgrade.md) and [010](010-minesweeper-3d-end-effects.md) still hold.
- **AC4:** Given the fix is merged and deployed, when hak opens the live site and chooses 3D, then the 3D view loads. (Manual check by hak; listed as such in the Test report.)

## Out of scope

- Any change to the look, colours or tokens of the 3D scene.
- Other apps and the 2D view.
- Running the whole e2e suite against a production build; only the 3D load check of AC1 is added.
- Changes to the GitHub Pages deployment itself ([018](../../../../docs/backlog/018-deploy-github-pages.md)), beyond the smoke test checking 3D.

## Open questions

None.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-08 — Story created from hak's `/fix` request. Orchestrator findings (cause, reproduction with the deploy build, why the tests missed it) recorded in Context. `changes:` left empty: no AC of 009 becomes false. Status ready: no open questions. (product-owner)

<!-- Sections below are filled in by later roles. Don't delete headings. -->

- 2026-11-08 — Gate: hak approved all retro proposals, commit, merge and deploy ("Alle, committen, mergen + deployen"). AC4 (live site loads 3D) is checked after the deploy.

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

## Implementation notes

- `scene3d/palette.ts`: `readPalette` accepts `#rgb` and `#rrggbb` (any case) and normalises to lower-case 6 digits; other values still throw a message naming the token (now "3- or 6-digit hex colour"). No fallback colour.
- Config wiring (cross-role, given by the orchestrator): `packages/platform/config/playwright.pages.ts` has a second project `app-pages` (`testDir: ../../../apps`, `testMatch: */e2e/pages/*.pages.spec.ts`, no app name); `createAppPlaywrightConfig` ignores `**/pages/**` in the app's `chromium` project, so the dev e2e run skips the app-owned pages spec.
- No design deviations. `npm run test:pages` now runs 3 tests incl. `minesweeper-3d.pages.spec.ts`, which passes.
- Fixed in round 1 (review nit 1): `createAppPlaywrightConfig` `chromium` project now uses `testIgnore: '**/e2e/pages/**'` instead of `'**/pages/**'`, so a checkout under a directory named `pages` no longer skips every spec; the platform project's `testIgnore` (same bug) is anchored the same way.

## Test report

_tester: AC → test mapping, results, defects found._

| AC  | Test(s)                                                                                                                                                                                                                                             | Result                         |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| AC1 | `apps/minesweeper/e2e/pages/minesweeper-3d.pages.spec.ts` "AC1: minesweeper production build loads the 3D view" (project `app-pages`, `npm run test:pages`, 3 passed)                                                                               | PASS                           |
| AC2 | `scene3d/palette.test.ts` "AC2: the 3-digit notation gives the same colour as the 6-digit one", "AC2: upper-case 3-digit expands per digit, upper-case 6-digit is lower-cased", "AC2: invalid value %j throws a message naming the token" (6 cases) | PASS                           |
| AC3 | `npm run verify` green; `npm run test:e2e`: avd 80 passed, minesweeper 110 passed, no flaky/retry in the log                                                                                                                                        | PASS                           |
| AC4 | Manual check by hak on the live site                                                                                                                                                                                                                | open - needs the branch pushed |
| CI  | CI run on GitHub                                                                                                                                                                                                                                    | open - needs the branch pushed |

### Verification (tester, after the fix)

- Tests added in this round: 0 (the reproduction tests are the regression tests; mixed-case 3-digit is covered by the `ABC` case).
- `npm run test:pages`: 3 passed; the 3D spec runs in project `app-pages`. `npm run test:e2e -w apps/minesweeper --list` contains no `pages.spec` (not run against the dev server).
- Mutation (HEX regex back to 6 digits only): 2 unit cases fail and the pages spec fails (canvas count); fix restored, diff against the fix identical.
- Vitest: platform 154 passed, avd 100 passed, minesweeper 103 passed (5 passed is the template skeleton check).
- Checked, OK: invalid values (4/5 digits, `red`, empty, `rgb()`, non-hex) throw naming the token; no fallback colour.

### Reproduction (tester, before the fix)

Two failing tests, written without a fix; 2 unit cases and 1 e2e test fail, the rest pass.

- **AC2 (unit)** `apps/minesweeper/src/features/minesweeper/scene3d/palette.test.ts`:
  - FAIL "AC2: the 3-digit notation gives the same colour as the 6-digit one": `--scene-fill-sky must be a 6-digit hex colour, got "#fff"` (thrown at `palette.ts` `readPalette`, HEX regex).
  - FAIL "AC2: upper-case 3-digit expands per digit, upper-case 6-digit is lower-cased": same error for `--color-on-danger-solid` with the upper-case 3-digit value.
  - PASS (guards, must stay green): invalid values (4 and 5 digits, `red`, empty, `rgb(...)`, non-hex digits) throw a message naming the token. Colour literals are built from digits in the test because `src/tokens.test.ts` forbids hex literals anywhere in `scene3d/`, tests included.
- **AC1 (production build)** `apps/minesweeper/e2e/pages/minesweeper-3d.pages.spec.ts`: guest sign-in, Start, choose 3D, wait for the View group to stop being busy, then the failure message must be absent, a canvas must be in the board and `data-view="3d"`. Run through `npm run test:pages` (via a temporary copy in `packages/platform/e2e/pages/`, removed afterwards) it FAILS: `getByText('3D could not be loaded. The board stays in 2D.')` expected count 0, received 2 (visible text plus live region). The two existing smoke tests pass.
- **Config change needed (not done, tester may not edit configs):** the pages config has `testDir: '../e2e/pages'` (platform only), so the app-owned spec is not picked up yet. Devops/developer must (1) add a second Playwright project or `testDir` in `packages/platform/config/playwright.pages.ts` that also runs apps' `e2e/pages/*.pages.spec.ts` (generic glob over `apps/*/e2e/pages`, no app name), and (2) add `testIgnore: '**/pages/**'` to the app project in `createAppPlaywrightConfig` (`packages/platform/config/playwright.ts`, `./e2e` is recursive and would run it against the dev server, where it passes vacuously). The spec sets the SwiftShader launch args itself.

CI on GitHub (DoD): run 42507634249 on the branch at 899ed7d — verify, pages (3 passed, incl. the 3D check on the published build), e2e (avd 80 passed, minesweeper 110 passed, no flaky) all green; deploy skipped (not main). The earlier run 42507326509 was cancelled by it (same concurrency group); its pages job had already passed.

## Review

**Round 1, reviewer 2026-11-08. Verdict: APPROVED. Checklist version: 2**

CI run of the branch: 42507326509 (workflow_dispatch). At review time `verify` and `pages` were green, `e2e` still running; the orchestrator adds the final result.

| Item | Result | Note                                                                                                                                                                     |
| ---- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C1   | pass   | AC1: `minesweeper-3d.pages.spec.ts` plus `app-pages` project; AC2: `palette.ts` HEX/`normaliseHex` plus `palette.test.ts`; AC3: dev code path unchanged; AC4 manual      |
| C2   | n.a.   | no network call or pending state in the diff (the spec's waits have explicit timeouts)                                                                                   |
| C3   | n.a.   | no hook or component logic changed                                                                                                                                       |
| C4   | n.a.   | no render loop or controller changed                                                                                                                                     |
| C5   | n.a.   | no reducer changed                                                                                                                                                       |
| C6   | pass   | invalid token still throws naming the token, no fallback; checked regex and messages                                                                                     |
| S1   | n.a.   | no input or rendering code changed (palette values only reach three.js colours)                                                                                          |
| S2   | n.a.   | no config, env or auth code changed (Playwright configs hold no secrets)                                                                                                 |
| S3   | n.a.   | `package.json` dependencies unchanged                                                                                                                                    |
| S4   | n.a.   | no dev-only code added                                                                                                                                                   |
| S5   | n.a.   | no root `scripts/`, template or app script touched                                                                                                                       |
| T1   | pass   | `npm run verify` run by me: green; `npm run test:pages` run by me: 3 passed incl. `app-pages`                                                                            |
| T2   | pass   | one e2e test for AC1, three unit tests for the branching parser; no AC at two levels                                                                                     |
| T3   | pass   | 3-digit case asserts `#ffffff` (per-digit expansion `ABC` to `aabbcc`); invalid values asserted via token name; spec asserts canvas count, data-view, no alert/pageerror |
| T4   | pass   | spec uses roles and the ancestor `data-view`, no coordinates or Tab counts; no shared helper exists for pages specs (guest sign-in is 2 lines)                           |
| T5   | pass   | new parsing branch covered by `palette.test.ts`                                                                                                                          |
| K1   | pass   | no design section (bug); Implementation notes list the cross-role config wiring; no dead code                                                                            |
| K2   | pass   | no `any`/`!`; named exports; test next to code                                                                                                                           |
| K3   | n.a.   | no CSS changed                                                                                                                                                           |
| K4   | pass   | platform config uses the generic glob `*/e2e/pages/*.pages.spec.ts`, no app name                                                                                         |
| K6   | pass   | story `in-review` equals the index row `in-review`                                                                                                                       |
| K7   | n.a.   | no new decision by hak in this story beyond the request                                                                                                                  |
| K8   | n.a.   | CHANGELOG is written by the tech-writer after this review (checked before gate 2)                                                                                        |
| K9   | pass   | covered by `npm run verify` (prettier incl. markdown)                                                                                                                    |
| K10  | n.a.   | no workspace script or tsconfig changed                                                                                                                                  |
| K11  | n.a.   | no env variable added                                                                                                                                                    |
| A1   | n.a.   | no control, focus, label or live region changed                                                                                                                          |
| A2   | n.a.   | no UI or colour changed (same colours, only more notations accepted)                                                                                                     |
| A3   | n.a.   | no UI, animation or announcement changed                                                                                                                                 |
| A4   | n.a.   | no render loop or canvas changed                                                                                                                                         |

Findings:

1. `[nit] packages/platform/config/playwright.ts:57 - testIgnore '**/pages/**' is matched against the absolute test path, so a checkout under a directory named "pages" would skip every chromium spec - anchor it, e.g. '**/e2e/pages/**'.`
2. `[nit] apps/minesweeper/e2e/pages/minesweeper-3d.pages.spec.ts:40 - getByRole('alert') count 0 and the LOAD_FAILED text check overlap with the canvas/data-view assertions - harmless, keep.`

## Explanation

On the published site, choosing the 3D view of Minesweeper showed "3D could not be loaded".
The 3D scene reads its colours from the page's design tokens and accepted only six-digit colour codes.
When the site is built for publishing, the style minifier writes white as a three-digit code.
So scene creation stopped at the first such colour; every published build since the 3D upgrade had this.
The scene now accepts both the short and the long colour code and treats them as the same colour.
Any other value still stops the scene with a clear message naming the token; there is no silent fallback.
A new check opens the published build, switches to 3D and requires the 3D board to appear.
Apps can now add such checks for the published build next to their own tests; the platform names no app.
After review: the rules that keep these checks out of the normal test run match only the right folder.
Locally all tests are green; deliberately reintroducing the old rule makes both new tests fail.
Risk: other code that reads style values at run time could meet the same minifier effect.
Not verified yet: the live site after the merge (hak's check).

## Retrospective

**Why the bug got through**

- Story 009 read the scene palette from CSS tokens with a strict six-digit check. Every e2e test ran against the dev
  server, which does not minify CSS, so no test ever saw the minified token values. Story 018 added a smoke test of
  the published build, but it only covered sign-in, reload and sign-out. Root cause: no rule that code depending on
  the built output (minified CSS, chunks, base path) is checked once on a production build.

**Proposed changes**

- **P1 (CLAUDE.md, Styling or test rules):** "Code that reads CSS values at run time accepts every notation a
  minifier may produce (e.g. a three-digit colour), and an app with such code checks it on the published build in
  its own `apps/<name>/e2e/pages/*.pages.spec.ts`."
- **P2 (CLAUDE.md, Code layout and Commands):** "Apps add checks for the published build in
  `apps/<name>/e2e/pages/*.pages.spec.ts`; `npm run test:pages` runs them. Playwright `testIgnore`/`testMatch` globs
  are matched against absolute paths and are anchored (e.g. `**/e2e/pages/**`)."
- **P3 (`.claude/agents/architect.md`):** "When a feature depends on the built output (minified CSS values, lazy
  chunks, base path), the minimal test set names one check on the published build."

**Outcome (gate, 2026-11-08):** hak approved all proposals. P1 and P2 applied to CLAUDE.md, P3 to `.claude/agents/architect.md` (devops).

Agent memory diffs were checked; nothing looks wrong.

### Cost

| Role                        | Round | Model  | Tokens       | Tool uses | Duration |
| --------------------------- | ----- | ------ | ------------ | --------- | -------- |
| product-owner               | 1     | sonnet | 77659        | 11        | 0:38     |
| tester                      | 1     | sonnet | 53269        | 20        | 2:06     |
| developer                   | 1     | sonnet | 39864        | 11        | 3:19     |
| tester                      | 2     | sonnet | 41542        | 8         | 2:58     |
| reviewer                    | 1     | sonnet | 41797        | 6         | 1:08     |
| tech-writer                 | 1     | haiku  | 32547        | 10        | 0:26     |
| developer                   | 2     | haiku  | 31500        | 7         | 0:35     |
| developer                   | 3     | haiku  | n/a          | 10        | 1:01     |
| devops                      | 1     | haiku  | 37194        | 13        | 0:45     |
| total (measured)            |       |        | 355372       | 96        | 12:56    |
| orchestrator (main session) |       | opus   | not measured | n/a       | n/a      |
