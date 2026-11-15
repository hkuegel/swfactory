---
id: 042
title: A green step reports its closing block, a failing step reports everything
status: done
type: feature
app: platform
size: S
branch: feature/037-process-time-optimisation-batch
supersedes: []
changes: []
superseded-by:
---

# 042 – A green step reports its closing block, a failing step reports everything

## Original request

> mach mal ein paar Vorschläge wie wir die Zeit die du für die Entwicklung brauchst, weiter optimieren können.
> Wir sollten meiner Meinung nach versuchen, unnötige, und zu oft ausgeführte Tasks, zu vermeiden.
> Ausserdem sollte der product owner entscheidungsfreudiger sein, und mehr Fragen selbstständig beantworten.
> Ist ein brainstorming: denke nach und mache Vorschläge

Proposal 9 of that brainstorm, approved by hak on 2026-11-14 as P37: read the closing block of a green group
instead of its whole log.

> stimme allen Verbesserungen zu. mache stories draus und setze sie direkt um

## User story

As the person who reads a run, I want a green step to report the lines that name its scope and its counts, and a
failing step to report everything, so that a green run is read in a few lines and nothing that failed is hidden.

## Context

The runner collects each step's output so parallel steps do not interleave, and prints the whole output for a
failing step only. A green e2e step prints one line per test: 109 lines for the group that is not the platform and
the laz workspace. The tester's rule is to report test counts per workspace and per Playwright project exactly as
printed, so the lines that must survive are the scope lines (the workspace header, the project run line) and the
closing block with the counts. Everything a green step printed besides those is the list of test names, which the
report does not need.

## Acceptance criteria

- **AC1:** Given a green step, then the runner prints the lines that name a scope — a workspace header beginning
  with `>` and a Playwright run line beginning with `Running` — and the closing block that carries the counts, and
  no line that only names a test. Measured with hand fixture text.
- **AC2:** Given a failing step, then the runner prints its whole output; and a green step whose output has no
  count line prints its whole output, so nothing is hidden by the shortening. Measured with hand fixture text.

## Out of scope

- No change to what a step runs; only what is printed.
- The screenshot and defect reporting rules of the tester are unchanged.

## Open questions

None.

## Decision log

- 2026-11-14 — Q: is the brainstorm approved? — A: hak approves all proposals and asks for stories and direct
  implementation; this story is P37 of the numbering that started with P27 (hak)
- 2026-11-15 — D: the closing block is defined by what the tester reports, not by a line count — reason: the
  tester must quote the counts per workspace and per Playwright project, so the lines that survive are the scope
  lines and the count lines; a rule that printed the last N lines would drop the per-workspace counts

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_Not a UI story: the change is the runner's print for a step._

## Technical design

One exported function in `scripts/verify.mjs`, `reportOfStep(code, out)`, that answers the text to print; `main`
prints what it answers. A test passes the two fixture outputs (a green e2e output with test names, scope lines and
counts; a failing output) and a hand expectation (P16).

## Implementation notes

- `reportOfStep(code, out)` in `scripts/verify.mjs` answers the text to print for a step, and `main` prints what it
  answers: for a failing step the whole output, for a green step the scope lines and the closing block, in the
  order they appear in the output.
- A count line needs a digit before `passed`, `failed` or `flaky` (`isCountLine`), so a test title or a console
  warning that only says "failed" is not a count line, and a green step whose output has no count line prints
  everything (AC2).
- The scope lines are the workspace headers beginning with `>` and the Playwright run line beginning with
  `Running`. The order is kept because the report reads the counts per workspace and per project, in the order the
  run printed them.

## Test report

| AC  | Test(s)                                                                                                                                                                                                                | Result   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| AC1 | `scripts/verify.test.mjs`: the green fixture answers the scope lines and the closing block, in the order they appear                                                                                                   | green    |
| AC2 | same file: a failing fixture answers its whole output; a green fixture with no count line answers its whole output; a line that only names a test is not a count line even when its title says "failed"                | green    |
| —   | observed in the full run of 2026-11-15, with the rule in effect: the four Playwright groups printed 16 lines between them (a workspace header, the command line, the `Running` line, the count line), and no test name | observed |

The same four groups hold 268 tests, so the run that prints the counts does not print 268 test names. What the run
of 2026-11-15 printed for the groups is quoted in story 039's report: avd 80, laz 54, minesweeper 110, pages 24,
which are the counts the closing block carries.

No step failed in that run, so the failing branch is measured by the fixture only. The run cannot measure its own
print: a rule that shortens the output it prints cannot be shown by the same run it shortens, so the fixture is the
measurement here (P16), and the observed lines are the run that already had the rule.

## Review

Verdict: APPROVED (round 1, checklist v2).

- C1 pass: AC1 is `reportOfStep` (its scope-line and count-line branches) shown by the green fixture; AC2 is the
  failing branch, the no-count-line branch and `isCountLine`, shown by the three fixtures named above. S5 pass (the
  rule was read by hand against the run output of 2026-11-15). T1 pass. T2 pass: one test per AC at the script
  level. T3 pass. T4 n.a. (no e2e spec changed). T5 pass. C2 to C6, S1 to S4, K2, K3, K10, K11, A1 to A4 n.a.: no
  app code, no CSS, no network call, no env variable. K4 pass, K6, K7, K8, K9 pass.
- `[minor]` finding 1 — the test names are gone from a green step's output, so a green run cannot show which test
  took the time; the runner still names the step's duration and the counts. For a failing step nothing is hidden,
  which is what AC2 says. Kept.
- `[minor]` finding 2 — `reportOfStep` reads a line beginning with `>` as a scope line, so a `>` line that is not a
  workspace header (for example a shell prompt inside a step's output) is printed. It only adds a line to the
  report, never removes one. Kept.

## Explanation

A green step now prints the lines that carry what the report needs: the workspace and project it ran in, and the
counts it ended with. A failing step prints everything, so a failure cannot be shortened away. This is what makes a
green run readable in a few lines instead of a page of test names, and it keeps the tester's rule intact: the
counts per workspace and per Playwright project are still printed exactly as the run printed them, so the report
quotes them from the run rather than from a count the report made up.

## Retrospective

- P37 — a green step prints its scope lines and its closing block, a failing step prints everything — applies to
  CLAUDE.md and .claude/agents/tester.md (approved)
- P37 — a run cannot measure the text it prints itself, so this story's measurement is a fixture plus the run that
  already had the rule (record only)
