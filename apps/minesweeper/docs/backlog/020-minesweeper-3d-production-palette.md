---
id: 020
title: Minesweeper 3D loads in the production build (palette accepts shortened hex colours)
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
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

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

## Implementation notes

_developer: what was built, deviations from the design and why._

## Test report

_tester: AC → test mapping, results, defects found._

| AC  | Test(s) | Result |
| --- | ------- | ------ |

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

## Explanation

_orchestrator: plain-language explanation shown at gate 2, at most 15 lines of at most 120 characters. No code, no file names._

## Retrospective

_orchestrator: what went wrong (review rounds, defects, corrections at the gates),
proposed changes to agents/CLAUDE.md/templates, and which ones hak approved. Include a
`### Cost` table (see the retro step of `/feature`)._
