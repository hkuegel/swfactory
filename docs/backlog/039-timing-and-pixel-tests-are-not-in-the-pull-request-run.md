---
id: 039
title: Frame-timing and pixel tests are not in the pull-request run
status: done
type: feature
app: platform
size: S
branch: feature/037-process-time-optimisation-batch
supersedes: []
changes: []
superseded-by:
---

# 039 – Frame-timing and pixel tests are not in the pull-request run

## Original request

> mach mal ein paar Vorschläge wie wir die Zeit die du für die Entwicklung brauchst, weiter optimieren können.
> Wir sollten meiner Meinung nach versuchen, unnötige, und zu oft ausgeführte Tasks, zu vermeiden.
> Ausserdem sollte der product owner entscheidungsfreudiger sein, und mehr Fragen selbstständig beantworten.
> Ist ein brainstorming: denke nach und mache Vorschläge

Proposal 4 of that brainstorm, approved by hak on 2026-11-14 as P34: move the timing and canvas groups out of the
per-commit run, because they are the only groups that produce flakes, and run them on the publishing run and the
nightly run.

> stimme allen Verbesserungen zu. mache stories draus und setze sie direkt um

## User story

As the person who runs a check on one commit, I want the tests that compare frames or rendered pixels to be left
out of the run for a pull request and kept in the run that publishes and in the nightly run, so that a commit round
does not pay for the flakiest group and the coverage is still there where a publish happens.

## Context

Two flakes in ten runs (stories 035 and 036): `apps/minesweeper/e2e/minesweeper-3d-effects.spec.ts:827` and
`landing/e2e/pages/landing.pages.spec.ts:153`. Both are frame or pixel comparisons, which is what machine load
moves; hak's standing reading is that this instability gets no defect story (story 034, open question 1). The
browser step is 81 s of the 88 s full run on this machine. Six spec files compare rendered pixels or frame timing
and hold 58 tests: the two minesweeper 3D specs, the minesweeper redesign spec, the avd chart-colours spec, the avd
tax-refund spec and the landing pages spec.

The filter is Playwright's, so a test that is filtered out is not a test that passed: the run must say how many
tests the filter removed. A publishing run and a run started from the UI are not filtered; the nightly run reads
the whole tree.

## Acceptance criteria

- **AC1:** Given the flag for the excluded tag is set, the e2e config answers `grepInvert` for the timing tag, for
  the app config and for the published-pages config; given the flag is not set, the config filters nothing.
  Measured as the config object built from data.
- **AC2:** Every e2e test that compares rendered pixels or frame timing carries the timing tag; `check:structure`
  fails a test with such a comparison that has no tag (rule 7). Measured with hand fixture text: one tagged pixel
  test passes, the same test without the tag fails, a test that only reads the DOM needs no tag.
- **AC3:** The CI checks step names the flag for a pull-request run only; a publishing run, a run started from the
  UI and the nightly run run the tagged tests. Measured as the expressions in the workflow, read by hand
  (story 034, AC5), and the run reports the number of tests the filter removed.

## Out of scope

- No duration is asserted in a test; the saving is reported.
- The tagged tests are not weakened: a tagged test still compares pixels or frames, it only runs in a different
  run.
- The residual risk is stated rather than closed: a pull-request run that filters the visual tests cannot show a
  visual regression; the publishing run and the nightly run can.

## Open questions

None.

## Decision log

- 2026-11-14 — Q: is the brainstorm approved? — A: hak approves all proposals and asks for stories and direct
  implementation; this story is P34 of the numbering that started with P27 (hak)
- 2026-11-15 — D: the filter is a tag on the test, not a list of spec files — reason: a test that only reads the
  DOM or counts state is not the test machine load moves, so the tag sits on the test that compares pixels or
  frames and a whole spec file is not excluded
- 2026-11-15 — D: the nightly run is added to the workflow triggers as a schedule on `main` at 03:00 UTC —
  reason: the proposal says the tagged tests run on the publishing run and the nightly run, and a scheduled run
  does not deploy because the deploy step is conditioned on `push` and `workflow_dispatch`
- 2026-11-15 — D: rule 7 reads the assertion, not the line a pixel was read on, and `expect.poll(` counts as an
  assertion — reason: the test machine load can move is the one whose assertion compares the pixels or frames it
  read, so a test that only waits for animations, resolves a colour or reads the DOM is not at risk and is not
  filtered out. The read counts when it is inside the assertion or when the variable the read wrote is asserted,
  because the assertion compares the pixels, not the line they were read on. Two defects were found while the rule
  was read against the tree: an apostrophe inside a comment was read as the start of a string, which swallowed the
  bracket that closes the test call (`apps/avd/e2e/avd-chart-colours.spec.ts:145`), and a helper whose name ends in
  `pixels` was missed because the rule named one spelling of the read.

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_Not a UI story: the change is the e2e config, the workflow and the test titles._

## Technical design

`createAppPlaywrightConfig` and the pages config take the tag to exclude as data (`skipTag`), and the app config
files pass what the environment names. Playwright's `grep` matches the test title with its tags, so `grepInvert`
with the timing tag removes exactly the tagged tests. `check-structure` gains rule 7 for `**/e2e/**` specs: a test
whose body compares rendered pixels or frame timing must carry the tag; the rule function takes the text as data
(P16) so a test passes its own fixtures. The workflow sets the flag in the checks step for `pull_request`; the
schedule trigger is added at the top of the workflow.

## Implementation notes

- `createAppPlaywrightConfig` and the published-pages config take the tag to exclude as data (`skipTag`) and
  answer `grepInvert` only when it is set; the app configs and the pages config pass what the environment names.
  Playwright's `grep` matches the title with its tags, so `grepInvert` removes exactly the tagged tests.
- Rule 7 in `scripts/check-structure.mjs` reads the text only (P16): the assertion is what counts, `expect.poll(`
  is an assertion, a read counts through the variable it wrote, comments are skipped, and any helper whose name
  ends in `pixels(` is a read. `callArgs` skips comment runs so an apostrophe in a comment cannot swallow the
  bracket that closes the `test(` call.
- The CI checks step sets `E2E_SKIP_TAG` for `pull_request` only, and the workflow gained the schedule trigger on
  `main` at 03:00 UTC; the deploy step is conditioned on `push` and `workflow_dispatch`, so the nightly run does
  not deploy.

## Test report

| AC  | Test(s)                                                                                                                                                                                                                                                                                                                                                                                                                                           | Result                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| AC1 | `packages/platform/config/playwright.test.ts`: a set `skipTag` answers `grepInvert` with that tag, an unset `skipTag` answers no filter, for the app config and for the pages config                                                                                                                                                                                                                                                              | green                 |
| AC2 | `scripts/check-structure.test.mjs` (29 tests): the tagged fixture passes; the same text without the tag reports; a test that only reads the DOM needs no tag; a comparison in a helper outside a test is not a test; an assertion on the variable the read wrote counts; `expect.poll(` counts; a comparison written in a comment does not count; an apostrophe in a comment is not a string; a unit test file with the same text is out of scope | green                 |
| AC2 | `check:structure` on the tree: 17 e2e specs scanned, no untagged pixel or frame assertion, and the rule reads each fixture as its own line                                                                                                                                                                                                                                                                                                        | green                 |
| AC3 | `.github/workflows/ci.yml` read by hand: the flag is named for `pull_request` only; `push`, `workflow_dispatch` and the schedule run the tagged tests                                                                                                                                                                                                                                                                                             | green (read, not run) |
| —   | the filter measured with `--list`, no browser: avd 80 → 75, laz 54 → 54, minesweeper 110 → 92, pages 24 → 21. A run for a pull request keeps 242 tests of 268, so 26 are filtered out                                                                                                                                                                                                                                                             | observed              |
| —   | 23 tagged tests in 8 spec files; five were tagged in this round because the rule read them as assertions: `avd-chart-colours.spec.ts` AC4, `avd-reinvest.spec.ts` AC4, `avd.spec.ts` AC5, `minesweeper-3d-scene.spec.ts` AC1 and AC2                                                                                                                                                                                                              | observed              |

The number the run prints is not the number of tags: three tagged calls sit in a `describe` that runs for both
colour schemes, so the minesweeper group filters 18 tests from 15 tagged calls. The laz group answers nothing,
because no laz test compares pixels in an assertion.

Mutation passes, scope `scripts/check-structure.test.mjs`: the tag check, the read-variable path, the comment
skipping in `stripComments`, and the e2e-scope guard each moved its own assertion in 1,1 s to 1,2 s; the file was
restored and verified by hash.

## Review

Verdict: APPROVED (round 1, checklist v2).

- C1 pass: AC1 is `skipTag` in `packages/platform/config/playwright.ts` and `playwright.pages.ts`, shown by the
  config test; AC2 is `checkTimingTag` (rule 7), shown by its fixtures and by the green scan of the tree; AC3 is
  the expression in the workflow's checks step and the trigger block at the top of the file.
- T4 pass: no test was weakened, only tagged; a tagged test still compares pixels or frames. T3 pass. T2 pass:
  one test per AC, at the config level for AC1 and the script level for AC2. S5 pass (the rule was read by hand
  over the tree and over its fixtures). T1 pass. C2 to C6, S1 to S4, K2, K3, K10, K11, A1 to A4 n.a.: no app
  code, no CSS, no network call, no env variable beyond the flag the workflow sets for its own step. K4 pass,
  K6, K7, K8, K9 pass.
- `[minor]` finding 1 — the rule's first version read only the line a pixel was read on, which missed the five
  tests that compare pixels through the variable the read wrote, and read an apostrophe in a comment as the start
  of a string. Both are covered by fixtures now; the definition is recorded in the Decision log of 2026-11-15.
- Accepted residual risk (stated in the story, not closed): a pull-request run that filters the visual tests
  cannot show a visual regression. The publishing run, a run started from the UI and the nightly run can.

## Explanation

The tests that compare rendered pixels or frame timing now carry the tag `@timing`. A run for a pull request
filters them out, so the commit round does not pay for the group that machine load moves; the run that publishes,
a run started from the UI and the nightly run at 03:00 UTC still run them, so a visual regression is caught where
a publish happens. A filtered test is not a test that passed: the run names how many tests the filter removed, and
the structure check refuses a pixel or frame assertion that has no tag, so the filter cannot be widened by
forgetting to tag a test.

## Retrospective

- P34 — frame-timing and pixel tests carry the tag and are filtered out of the pull-request run — applies to
  CLAUDE.md and .claude/agents/tester.md (approved)
- P34 — a rule that reads text can be broken by a character it mistakes for syntax, which is a defect fixed in
  the parser and not a rule change (record only)
