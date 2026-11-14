---
id: 036
title: The fund table shows the fund name, the ISIN and the current course
status: done
type: feature
app: laz
size: M
branch: feature/036-laz-fund-table-name-isin-and-course-columns
supersedes: []
changes: [024/AC5, 032/AC3]
superseded-by:
---

# 036 – The fund table shows the fund name, the ISIN and the current course

## Original request

Hak, 2026-11-14, the third of his three requests for `laz`:

> "3. Bei den Fonds sollte noch name /isin und aktueller Kurs rein"

## User story

As the person who compares the plan with my depot, I want each row of the fund table to show the fund's name,
its ISIN, and the current course, so that I can see which fund a row is and read its value against what I hold.

## Context

The fund table has six columns: Jahr, NAV in Euro, YTM in Prozent, Hochrechnung je Anteil, Anteile jetzt kaufen,
Kaufpreis heute. The name and the ISIN are in the data file for every fund and are read by the writer, but the
app never shows them: a row is identified only by its maturity year.

"Aktueller Kurs" is the value the NAV column already shows. The source publishes the net asset value per share
with the date it was read, and the app labels that figure with the asOf date (story 024 AC5); that is the
current course. A separate exchange price is not part of what the source publishes for these funds, so it
cannot be stored in the data file and cannot be shown without inventing it (story 025). Whether hak means the
NAV column under a different name, or a market price the source does not give, is the open question.

The row's accessible name is the year today (`th scope="row"`), and the figures in the row are described by the
projection label (story 024 AC5, story 032 AC3). If the name becomes a column, the way a row is named and the
way the tests read it change together, so this story owns that change.

## Acceptance criteria

- **AC1:** Given the fund table, when a row is read, then it shows the fund's name and its ISIN exactly as the
  data file stores them, with no formatting invented, and the columns are in one order for the whole table:
  Jahr, Fondsname, ISIN, then the existing columns. Measured as the table header naming these columns and the
  cells of one hand row equal to the values in the fixture copy.
- **AC2:** Given a row, when it is read by an assistive technology, then the row header stays the fund's year
  (story 024 AC5, unchanged), the name and the ISIN are read as cells of that row, and the projection label
  still describes the figures, so a row can be told apart by more than its year. Measured as the row header of
  one row, the name and ISIN cells of that row, and the described-by relation of its figures, in the same words
  story 024 AC5 and story 032 AC3 use. Restated at gate 1: the row header does not move to the name column, by
  hak's answer of 2026-11-14, so the tests that read a row by its fund year keep their oracles.
- **AC3:** Given the current course, when it is shown, then the value shown is the net asset value per share the
  source published for that fund with its asOf date, and no price the source does not publish is shown; the
  column that shows it names what it is. Measured as the column copy, the asOf label, and one hand value taken
  from the fixture copy.
- **AC4:** Given a fund the writer cannot read, when the file is written, then the fund is named with the field
  that is missing and nothing is written, so a row with an empty name or an empty ISIN cannot exist in the
  committed file (story 025 unchanged). Measured as the writer refusing a fund with an empty name or ISIN — the
  rule is not weakened by adding columns that read those fields.

## Out of scope

- No market price, no chart, no history: the app shows the values the data file has (story 024, story 025).
- No change to the calculation: name and ISIN are display only, as `avgMaturityHundredths` and
  `sharesOutstanding` already are.
- No change to the writer's fields: it already reads name and ISIN.
- The fund name column does not become a filter or a link to the source page; that is a separate decision.

## Open questions

1. Answered 2026-11-14 at gate 1 (hak): the column is named `Kurs` — his words, "nenne es Kurs wenn es der
   aktuelle Kurs ist". The value it shows is the net asset value per share the source publishes with its asOf
   date, because the source publishes no separate market price for these funds; a market price cannot be stored
   or shown without inventing it (story 025). If he wants the unit in the column, that is still his call.
2. Answered 2026-11-14 at gate 1 (hak): the row header stays the fund's year, so AC2 is restated as above and
   the tests that read rows by fund year keep their oracles; the name and the ISIN are cells, not the header.
3. Answered 2026-11-14 at gate 1 (hak): the order in AC1 — Jahr, Fondsname, ISIN, then the existing columns.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be rebuilt without the chat.
Append only._

- 2026-11-14 — Decision (orchestrator): the current course is read as the net asset value the source publishes
  with its asOf date, because the source publishes no separate price for these funds; the reading is recorded as
  an open question rather than as a decision, since hak's word "Kurs" can mean the market price.
- 2026-11-14 — Decision (orchestrator): the story owns the row-name change, because a new name column changes
  the accessible name of a row and the tests that read rows by year.
- 2026-11-14 — Q (open question 1, asked at gate 1): plain `Kurs`, or `Kurs in Euro`? — A (hak): plain `Kurs`,
  his own word. So AC3 measures the column copy as `Kurs`, and the value stays the net asset value per share the
  source publishes with its asOf date.
- 2026-11-14 — Q (open questions 2 and 3, asked at gate 1): does the name column become the row header, and
  which column order? — A (hak): the row header stays the year, so AC2 is restated, and the order is Jahr,
  Fondsname, ISIN, then the existing columns. Gate 1 is answered in full, so the story can be implemented.
- 2026-11-14 — Q (the reading of `Kurs`, confirmed at gate 2): is it the net asset value per share the source
  publishes with its asOf date, or a market price? — A (hak): as implemented, the net asset value with its asOf
  date. A market price would have to come from somewhere the app does not read, which would mean inventing it
  (story 025), so AC3 stands as written.
- 2026-11-14 — Q (finding 1, asked at gate 2): the defect is older than this story — where should its record
  live? — A (hak): it stays fixed inside story 036, which is the story that made it measurable; no separate defect
  story is opened, and the fix stays in the app's own CSS, not in the platform or in a factory rule.
- 2026-11-14 — Gate 2: hak approved the record, the four retro proposals, and the commit, and gave the go-ahead to
  commit and push. The merge is hak's, and CI sees the pushed content through the merge, on his reading of
  2026-11-14 ("leave it to the merge").

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

The fund table keeps its shape (story 024 UX §1): the region `Fondsplan`, its caption `Fondsliste nach Jahr`, the
wrapper that scrolls, the table. The header names eight columns in one order for the whole table: `Jahr`,
`Fondsname`, `ISIN`, `Kurs`, `YTM in Prozent`, `Hochrechnung je Anteil in Euro`, `Anteile jetzt kaufen`,
`Kaufpreis heute in Euro`. A row is the fund year as its row header, then the two new cells, then the figure cells
with the override inputs. No state is added: the name and the ISIN are values the data file holds for every fund, so
a row cannot be in a loading or an empty state of its own, and a fund whose response is missing never reaches the
file (story 025 AC2), which is why the table can show these two as facts. The states of the input cells are
unchanged, and there is no new interaction: the cells show text, they are not controls.

Copy: `Fondsname`, `ISIN` and `Kurs`. Hak named the course column plain `Kurs` (2026-11-14), so the header names
what it is without a unit, and the unit stays where a reader hears it — in the visually hidden label of the input
inside that column, `Kurs in Euro für Jahr {year}`, because a column header cannot name a control inside a cell
(story 024 UX §2). Nothing is formatted for a name or an ISIN: the strings are what the data file stores. The value
the `Kurs` column shows is the net asset value per share the source published with its asOf date, which the
projection label already states as a projection and not as a published market value (story 024 AC5).

Accessibility: the row's accessible name stays the fund year, by hak's answer at gate 1, so the row model of
story 024 AC5 is not moved; the name and the ISIN are read as cells of the row, so a row can be told apart by more
than its year. The projection label still describes the figures of the row and not the two new cells, because those
are not amounts.

Look: the two cells read left, like the row header, since they name the fund instead of being a figure, and a long
name stays inside its column (`overflow-wrap: anywhere`). Only the wrapper scrolls (UX §5); with the two columns the
table's minimum width grew to 760 px, because the name is the widest value in the table.

## Technical design

No new file, no data change, no calculation change: `name` and `isin` are display only, as `avgMaturityHundredths`
and `sharesOutstanding` already are (ADR 0013). The `Fund` type already carries both fields, so the data flow is
unchanged — the data file through `logic/fund.ts` into the table's props — and no test reads the committed file
(P16, ADR 0013): the app tests read the fixture copy.

- `apps/laz/src/features/plan/fieldCopy.ts`: `COPY` gains `nameColumn` and `isinColumn`, and `navColumn` reads
  `Kurs`; the label of the input in that column becomes `Kurs in Euro für Jahr {year}`.
- `apps/laz/src/features/plan/FundTable.tsx`: two column headers, two cells with the strings as the data file stores
  them, no formatting.
- `apps/laz/src/features/plan/FundTable.module.css`: `.identity` for the two cells (left alignment, wrapping), the
  minimum width of the table, and the cell as the containing block for the visually hidden label inside it, so the
  scroller clips it (the fix of finding 1).
- `apps/laz/e2e/laz.helpers.ts`: the label text of the course input, and the fixture row now carries `name` and
  `isin` so the test can cross-check its hand strings against the same copy the app is built with.
- `scripts/fundListParse.mjs`: the identity fields are checked with the same rule as the four values — one missing
  field names the fund and the field and returns no record, so a row with an empty name or ISIN cannot be written
  (AC4).

Risks: the copy strings are oracles shared between the UI and the tests, so the test writes them by hand (P16); the
name is the widest value in the table, so a narrow viewport measures the wrapper, not the columns, and the two
platform tests that check "no horizontal scrolling" read the document, not the table — that is where finding 1
comes from; the writer's new branch needs its own test (T5). ADR links: 0013 (the fields of the committed file),
0012 unchanged.

## Implementation notes

- The two new cells print `fund.name` and `fund.isin` with no formatting, which is what AC1 asks for; the `.identity`
  class exists only for the alignment and the wrapping.
- The hand value for the `Kurs` cell of fixture row 2030 is `42`, not `42,00`: the micro-euro format prints the
  decimals a value has, and that is what lets a cell round-trip through the same parser (story 025). A hand oracle
  has to be the string the format can produce.
- AC2 was restated at gate 1 after hak's answer, in the AC text itself, so the story can be rebuilt without the
  chat: the row header stays the year, and the tests that read a row by its fund year keep their oracles.
- The narrow-viewport fix is in this story's CSS, not in the platform: the platform tests were green before the
  story and red with it, so the cause is the story's own table, and the platform test itself is correct — it
  measured something the story had broken (see finding 1).
- The diagnostic that found the cause was a temporary spec file and is deleted before the run this report names.

## Test report

| AC  | Test(s)                                                                                                                                                                                                                                                                                                                                                                                  | Result               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| AC1 | `apps/laz/src/features/plan/fieldCopy.test.ts` "036 AC1, AC3": the three column strings, written by hand; `apps/laz/e2e/laz.spec.ts` "036 AC1, AC2, AC3": the eight column headers in the order of AC1, and the cells of the hand row 2030 equal the hand strings, cross-checked against the fixture copy the app is built with (P16)                                                    | pass                 |
| AC2 | the same e2e test: `th scope="row"` of that row is `2030`, the name and the ISIN are read as cells of the row, the projection cell still carries the projection label as its accessible description, and the two new cells do not — the label describes amounts, not names                                                                                                               | pass                 |
| AC3 | `fieldCopy.test.ts`: the column copy names no price the source does not publish, and the input label keeps the unit; the e2e test: the cell of the hand row shows `42` (hand value 42.000.000 micro-euro), the asOf label names the date and states that no published market value exists                                                                                                | pass                 |
| AC4 | `scripts/fundListParse.test.mjs` "AC4 of story 036": an empty ISIN and an empty name each name the fund and the field; through the caller a fixture run writes nothing and its message reads `fund 2028 (): isin — value missing`, so the rule of story 025 AC2 is not weakened by columns that read those fields                                                                        | pass                 |
| —   | Mutation checks on copies, each reverted from a backup made before it: `parseFundResponse` without the identity branch → the AC4 test red; `FundTable.tsx` with the name cell emptied → the 036 e2e test red; `fieldCopy.ts` with `navColumn` back to `NAV in Euro` → the copy test red; `FundTable.module.css` without the cell as containing block → the two narrow-viewport tests red | each rule fails once |

Counts as printed: script vitest 75 passed (6 files), of which `fundListParse.test.mjs` 7; laz vitest 30 passed
(9 files), of which `fieldCopy.test.ts` 6; laz Playwright 13 tests, which is 54 in the run of that workspace
because the platform group (41) runs with it; the other two workspace groups 80 and 110 — the third printed
109 passed and 1 flaky, the minesweeper 3D effects test at `apps\minesweeper\e2e\minesweeper-3d-effects.spec.ts:827`,
which passed on its retry and is recorded as observed on the reading hak accepted on 2026-11-14 (machine load under
16 parallel workers, no defect story). The full run on the content as these words stand is green, 12 steps,
80,0 s wall clock; a duration named in a report cannot be measured by the run that prints it, so 80,0 s is the run
that covered the content before this sentence existed, and the run that covers the content as these words stand is
reported in the gate message — the run CI makes on the pushed content is the check that can cover them, which is
hak's reading of 2026-11-14 ("leave it to the merge").

Defects found: one, and it is fixed in this story (finding 1 in the Review). Before the fix the two platform
narrow-viewport tests were red with this change and green on the baseline, so the failure was reproducible and not
machine load: `documentElement.scrollWidth` was 382 at a 320 px viewport with the story and 320 without it. Overriding
the table's minimum width and the scroller's `overflow-x` from the browser did not change 382, which is what showed
that the cause was not those rules but the content of the cells.

## Review

**Round 1, reviewer 2026-11-14. Verdict: APPROVED. Checklist version: 2**

Worked through in the main session by the orchestrator, which is worth naming: the code of this story was written in
the same session, and the review was made after the change, not before it.

| Item | Result | Note                                                                                                                                                                                                                                                                                                                                     |
| ---- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1   | pass   | AC1: the copy strings in `fieldCopy.ts` and the cells in `FundTable.tsx`, shown by the copy test and the e2e test; AC2: the row header stays the year, and the described-by relation of the figures; AC3: the `Kurs` copy and the hand value of fixture row 2030; AC4: the identity branch in `parseFundResponse`, shown by its own test |
| C2   | n.a.   | no network call or pending state in the diff; the writer's request path is unchanged                                                                                                                                                                                                                                                     |
| C3   | n.a.   | no hook, state or effect logic changed; the component change is render only                                                                                                                                                                                                                                                              |
| C4   | n.a.   | no render loop or imperative controller changed                                                                                                                                                                                                                                                                                          |
| C5   | n.a.   | no reducer changed; the writer still takes its run date as an argument                                                                                                                                                                                                                                                                   |
| C6   | pass   | the new failure path ends in the writer's message and a refused write, the same shape as the existing field checks; nothing is swallowed                                                                                                                                                                                                 |
| S1   | pass   | the data file's strings reach the DOM as React text, escaped; no `dangerouslySetInnerHTML`, no URL sink                                                                                                                                                                                                                                  |
| S2   | n.a.   | no config, env or auth code changed                                                                                                                                                                                                                                                                                                      |
| S3   | n.a.   | `package.json` dependencies unchanged                                                                                                                                                                                                                                                                                                    |
| S4   | n.a.   | no dev-only code added; the fixture copy rule of story 025 is unchanged                                                                                                                                                                                                                                                                  |
| S5   | pass   | the writer was exercised by its tests, and the new branch was probed with a deliberately bad input (an empty ISIN, which must make it fail)                                                                                                                                                                                              |
| T1   | pass   | `npm run verify` run by the reviewer is green — see the Test report and the gate message                                                                                                                                                                                                                                                 |
| T2   | pass   | one test per AC at the cheapest level: the copy strings at unit level, the cells and the row header in the browser, AC4 at the script level; the e2e test does not re-prove story 024 AC5, it checks that the label does not now describe the name cells                                                                                 |
| T3   | pass   | no vacuous fixture: the hand strings and the hand value are written in the test, not read from the module under test, and four rules were mutated to show the assertions can fail                                                                                                                                                        |
| T4   | pass   | the test is named after its ACs and reads rows by header and by column header, not by position; no counted Tab sequences                                                                                                                                                                                                                 |
| T5   | pass   | the new branch in `parseFundResponse` has its own test (T3's mutation check makes it red when the branch is removed)                                                                                                                                                                                                                     |
| K1   | pass   | matches the technical design; the deviations (the hand value `42`, the CSS rule) are in Implementation notes; no dead code                                                                                                                                                                                                               |
| K2   | pass   | no `any`, no `!`; the helper's row type gained the two fields it reads                                                                                                                                                                                                                                                                   |
| K3   | pass   | tokens only in the new rule; no colour, no `font-family`; the new rule is a containing block, not a colour or size literal                                                                                                                                                                                                               |
| K4   | pass   | `check-structure` green; the platform test was not changed — the fix is in the app's own CSS                                                                                                                                                                                                                                             |
| K6   | pass   | status `in-review` at the review and the index row the same; `done` after hak's gate 2 approval of 2026-11-14                                                                                                                                                                                                                            |
| K7   | pass   | the three gate 1 answers and the three gate 2 answers are in the Decision log, append only                                                                                                                                                                                                                                               |
| K8   | pass   | `apps/laz/README.md` and the CHANGELOG line name the columns, which is user-visible                                                                                                                                                                                                                                                      |
| K9   | pass   | prettier green on the touched files                                                                                                                                                                                                                                                                                                      |
| K10  | n.a.   | no workspace script or tsconfig changed                                                                                                                                                                                                                                                                                                  |
| K11  | n.a.   | no env variable added                                                                                                                                                                                                                                                                                                                    |
| A1   | pass   | the label text of one input changed (`Kurs in Euro für Jahr {year}`); the new cells are cells with a column header, so they have an accessible name through the header, and nothing about focus or keyboard order changed                                                                                                                |
| A2   | n.a.   | no colour or state cue changed; the two cells read as text in the existing palette                                                                                                                                                                                                                                                       |
| A3   | n.a.   | no live region or animation changed                                                                                                                                                                                                                                                                                                      |
| A4   | n.a.   | no render loop or canvas changed                                                                                                                                                                                                                                                                                                         |

Findings:

1. `[minor]` `apps/laz/src/features/plan/FundTable.module.css` — the visually hidden label inside an input cell is
   absolutely positioned, and a table cell is not a containing block by default, so its containing block is the
   initial containing block: the fund scroller does not clip it, and at a 320 px viewport the label reaches past the
   viewport and the document scrolls, which is against UX §5 ("only the wrapper scrolls"). Story 036 did not create
   this — its two new columns moved the input cells past 320 px, which is what made an existing latent defect
   measurable. The platform tests were green before the story only because of column-width luck. Fixed here by making
   the cell the containing block for the label inside it; the label's appearance and its accessible relation are
   unchanged.
2. `[nit]` `apps/laz/e2e/laz.spec.ts` — the hand value of the `Kurs` cell had to be written as `42`, because the
   micro-euro format prints only the decimals a value has. A hand oracle that states `42,00` would be a string the
   code can never produce, so this is recorded in Implementation notes rather than as a defect.

Hak's answers at gate 2 on 2026-11-14: finding 1 stays fixed inside this story, which is the story that made it
measurable, and no separate defect story is opened; the reading of `Kurs` as the net asset value with its asOf date is
confirmed as implemented. His approval of the record, of the four retro proposals and of the commit is in the Decision
log.

## Explanation

The fund table now names the fund each row is: `Fondsname` and `ISIN` as the data file stores them, in the order you
chose (Jahr, Fondsname, ISIN, then the existing columns), and the course column is `Kurs` — your word. The value it
shows is the net asset value per share the source published with its asOf date, since the source publishes no
separate market price for these funds; the projection label still says so. The row header stayed the year, as you
answered, so nothing about how a screen reader names a row moved.

One thing the tests found on the way, which you should know about: at a 320 px viewport the page scrolled
horizontally, against the rule that only the table's wrapper scrolls. The cause was not the two columns themselves
but a visually hidden label inside an input cell, which is positioned against the page rather than against its cell,
so the wrapper did not clip it. Your change made an existing latent defect measurable, and the fix is one line in the
fund table's own CSS: the cell is now the containing block for the label inside it.

Nothing here invents a value: the app shows what the data file holds, the writer still refuses a fund whose name or
ISIN it cannot read, and the tests read the fixture copy, not the committed file. Your answers at gate 2 confirmed
the reading of `Kurs` and that the record of the narrow-viewport defect stays in this story, so no defect story was
opened. The run before these words is green, 12 steps, 79,1 s; the check that can cover them is the run CI makes at
the merge, which is reported in the gate message, not here.

## Retrospective

- A rule stated as "only the wrapper scrolls" is not enough for content that is positioned against the page instead
  of against its own cell: an absolutely positioned element inside a scroll container escapes the container unless
  the container is its containing block. The tests measured this; nothing in the code said it.
- A test that is green because of column-width luck is not a guard. The narrow-viewport tests were green before this
  story for the same reason they are green now only after a fix — the content happened to fit. A failure that looks
  unrelated to the story can be the story's own defect, and this one was: the baseline was checked against the same
  tests, red with the change and green without it, which is what made it a defect and not machine load.
- A hand value must be the string the formatter can produce. The `Kurs` cell shows `42`, not `42,00`, because the
  micro-euro format prints the decimals a value has; an oracle written as `42,00` states a string the code can
  never print.
- Restating an AC after hak's answer, in the AC text itself, is what keeps the story rebuildable: AC2 of this story
  was written for a row header hak did not want, and the restatement is in the story, not only in the chat.
- Hak approved these four proposals at gate 2 on 2026-11-14. No checklist item changes and no role file changes, so
  nothing is applied beyond the record.

### Cost

| Role                        | Round | Model | Tokens                                                    | Tool uses                                                 | Duration                                           |
| --------------------------- | ----- | ----- | --------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------- |
| product-owner               | 1     | n/a   | not measured (gate 1 answered by hak in the main session) | not measured (gate 1 answered by hak in the main session) | not measured (no per-run counters in this harness) |
| architect                   | 1     | n/a   | not measured (no architect run, design by orchestrator)   | not measured (no architect run)                           | not measured (no architect run)                    |
| developer                   | 1     | n/a   | not measured (no per-run counters in this harness)        | not measured (no per-run counters in this harness)        | not measured (no per-run counters in this harness) |
| tester                      | 1     | n/a   | not measured (no per-run counters in this harness)        | not measured (no per-run counters in this harness)        | not measured (no per-run counters in this harness) |
| reviewer                    | 1     | n/a   | not measured (no per-run counters in this harness)        | not measured (no per-run counters in this harness)        | not measured (review in the main session, gate 2)  |
| total (measured)            | -     | -     | n/a                                                       | n/a                                                       | n/a                                                |
| orchestrator (main session) | 1     | n/a   | not measured                                              | n/a                                                       | n/a                                                |
