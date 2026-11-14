---
id: 035
title: The fund list funds the first and the last year of the phase
status: done
type: feature
app: laz
size: M
branch: feature/035-laz-funding-year-for-the-phase-boundary-years
supersedes: []
changes: [024/AC2, 025] # the missing-year measurement of 024 AC2 moves to a year outside the extended list; the writer's `fits` rule accepts a fund the committed file does not have as an addition (hak, 2026-11-14)
superseded-by:
---

# 035 – The fund list funds the first and the last year of the phase

## Original request

Hak, 2026-11-14, in the three requests for `laz`:

> "1. Bei Start 01.2028 möchte ich die erste Zahlung in 01.2028 erhalten. Ich sollte also den Fond 2027 dafür
> haben"

> "2. analog sollte für Ende 03.2036 3 Monate ausbezahlt werden , sprich in 2035 muss der ETF 3 monatsraten für
> 2035 finanzieren"

## User story

As the person who plans a payout phase, I want the fund list to contain the fund that funds the first year of
the phase and the fund that funds the last year, so that a phase of 01.2028 to 03.2036 shows a funding fund for
every year in it, and the last year shows the three months that are actually paid.

## Context

The rule hak names is already the rule of the app. A phase year is funded by the fund whose term ends in the
year before: the fund of 2027 is redeemed at the turn to 2028, so its money pays the amounts of 2028, and the
fund of 2035 is redeemed in December 2035, so its money pays the amounts of 2036 (story 024, Context point 4).
The amount of a phase year is the monthly payout times the months the phase has in that year, so a phase ending
in March 2036 shows three months for 2036.

What is missing is the data. The committed fund list covers 2028 to 2034, so 2028 has no funding fund and 2036
has none: the year table reports both as a year with no amount. The two funds exist at the source, and their
names and identifiers are read on 2026-11-14:

| Maturity year | ISIN (accumulating) | Product page id |
| ------------- | ------------------- | --------------- |
| 2027          | `IE000ZOI8OK5`      | 332475          |
| 2035          | `IE000O1FWAW6`      | 344489          |

The 2027 fund is the accumulating share class of the December 2027 term. Its stored response names a fixed
maturity of 15.12.2027, with shares held on that day redeemed the next day (16.12.2027); the 2035 fund names
02.12.2035, with shares held on that day redeemed on 03.12.2035. ADR 0012 puts the projection horizon at
31.12. of the fund's maturity year, which is later than both dates the source names. Hak did not answer
whether the app should use the source's date instead, so the rule stays as ADR 0012 has it for both funds:
the hand oracles are computed with 31.12.2027 and 31.12.2035, and the story's rule is unchanged.

A fund cannot be added by typing its numbers. The writer's values come from the source, so the two funds need
stored responses before the committed file can name them (story 025, ADR 0013).

## Acceptance criteria

- **AC1:** Given the stored fixture extended to 2027 and 2035, when the phase 01.2028 to 03.2036 is read, then
  2028 names the 2027 fund as its funding fund, 2036 names the 2035 fund, the month count of 2036 is 3, and the
  amount of 2036 is the monthly payout times 3 — no full year is invented for a year the phase does not have.
- **AC2:** Given the writer, when it runs in fixture mode, then its fund table covers the funding years of the
  phase boundaries, 2027 through 2035, and a fund whose stored response is missing names the fund and the field
  and writes nothing (story 025 unchanged). Measured as: the writer's fund table has the two new entries with
  the identifiers above, and a fixture run without a response for one of them writes nothing and names it.
- **AC3:** Given a phase year whose funding fund is not in the list, when the year table is read, then the year
  is still reported with no amount (story 024 AC2's rule), and AC2 of 024 is measured on a year outside the
  extended list instead of on 2028 — the example phase inside the list now has a funding fund for its first
  year. Measured as the same rule with the changed measurement: a phase starting 01.2026 shows 2026 as a year
  with no amount.
- **AC4:** The committed data file gains the two funds only from a writer run in live mode; the fixture copy
  keeps its own values, and no number in either file is typed by hand (story 025, hak's rule of 2026-11-14).
  Measured as: the new rows in the committed file carry the identifiers the writer names, and the frozen
  comparison step includes both funds.

## Out of scope

- No invented values for a fund that cannot be read; the two new funds need real stored responses (story 025).
- No change to the projection rule of story 024 beyond the fund's own data. Hak decided at gate 2 that the
  horizon stays 31.12. of the maturity year for these two funds, as ADR 0012 has it for every fund.
- No fund table columns: that is story 036.
- No change to the default phase, which is the example phase of story 033; whether the default becomes
  01.2028 to 03.2036 is the open question below.

## Open questions

1. Answered 2026-11-14 (hak): yes, for every phase year, in his own words. The app already used it, so this
   was a confirmation, not a change.
2. Answered 2026-11-14 (hak): yes, the payments that are actually made in the year. The premise of this
   question was wrong — nothing in story 024 or ADR 0012 counts a partial year as a full year — so no rule had
   to be changed.
3. Answered 2026-11-14 (hak), first half: yes, the list extends to 2027 and 2035. Answered at gate 2, second
   half: 31.12. of the maturity year, as ADR 0012 has it for every fund. The dates the source names
   (15.12.2027, redeemed 16.12.2027; 02.12.2035, redeemed 03.12.2035) stay recorded in ADR 0012 and in Context,
   and the hand oracles as committed are the ones computed with 31.12.2027 and 31.12.2035, so the story can be
   rebuilt with the other reading by recomputing them.
4. Answered 2026-11-14 (hak): no, the default stays the example phase of story 033; 01.2028 to 03.2036 is
   measured as a named case.
5. Answered 2026-11-14 (hak): run the writer in live mode. Done on the branch on 2026-11-14, which is why the
   committed file has the two funds and its asOf is the run date.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be rebuilt without the chat.
Append only._

- 2026-11-14 — Q: what does the request ask for, since the app already funds a phase year with the fund of the
  year before? — A: the fund list is too short, so the phase's boundary years have no funding fund. The
  identifiers of the 2027 and 2035 funds are read from the source on 2026-11-14 and recorded in Context. The
  reading of the two requests as one rule is the orchestrator's reading, pending hak's confirmation (open
  question 1).
- 2026-11-14 — Decision (orchestrator): no fixture values are invented for the two funds. The story stays
  blocked until real stored responses exist (open question 5).
- 2026-11-14 — Q (open question 1): does the funding rule apply to every phase year, as hak's two examples
  read? — A (hak): yes, in his words: "Um das Jahr X zu finanzieren, brauche ich einen ETF der im (Dezember)
  des Jahres X-1 fällig wird." The app already builds the plan this way, so the rule is confirmed unchanged;
  what was missing is the data.
- 2026-11-14 — Q (open question 2): is the amount of a phase year the payments that are actually made in it?
  — A (hak): yes: "Wenn das Ende 03.X ist, brauchst du einen ETF der im Jahr X-1 fällig wird und 3
  Monatsauszahlungen finanziert." The premise of this question was wrong: no decision of story 024 counts a
  partial year as a full year — story 024 and ADR 0012 already count only the phase months, and the code does
  the same, so nothing had to be changed, only measured on the new data.
- 2026-11-14 — Q (open question 3, first half): does the fund list extend to 2027 and 2035, nine funds?
  — A (hak): yes, that is what the two requests ask for. The second half of the question (the 2035 horizon)
  is still open and recorded below.
- 2026-11-14 — Q (open question 4): should the default phase become 01.2028 to 03.2036? — A (hak): no, the
  default stays the example phase of story 033; 01.2028 to 03.2036 is measured as a named case.
- 2026-11-14 — Q (open question 5): how do the stored responses for the two funds come about? — A (hak): run
  the writer in live mode on the branch. The run of 2026-11-14 read all nine pages and wrote the committed
  file, so the seven existing values were refreshed by the same run and the file's asOf is 2026-11-14. Nothing
  in the committed file was typed.
- 2026-11-14 — Q: what values do the two new rows of the app's fixture copy carry? — A (hak): the hand values
  of the pattern the copy already uses (nav +2.000.000 micro-euro, ytm +50 basis points, maturity +100
  hundredths, shares +100.000 per year), not the values the stored pages print. The copy stays a hand fixture,
  so the app's oracles stay hand values (ADR 0013).
- 2026-11-14 — Gate 2 reading of the writer: a fund the committed file does not have is reported as kind
  `addition` and does not make the result unfit, so a `--full` run may write a grown table; a committed fund
  the run did not read still blocks the write. — A (hak): confirmed as read. Without this the writer could not
  add the two boundary funds at all, because a grown table would have read as an identity difference.
- 2026-11-14 — Decision (orchestrator, recorded for the rebuild): the 2035 fund's horizon stays 31.12.2035,
  as ADR 0012 has it for every fund, because hak did not answer the horizon question yet. ADR 0012 carries the
  amendment and the date the source names (02.12.2035, redeemed 03.12.2035), so the story can be rebuilt with
  the other reading by recomputing the hand oracles.
- 2026-11-14 — Q (open question 3, second half, the horizon, asked at gate 2): 31.12. of the maturity year, or
  the date the source names? — A (hak): keep 31.12. of the maturity year, as ADR 0012 has it for every fund.
  The dates the source names stay recorded in ADR 0012 and in Context; the oracles as committed are the ones
  computed with 31.12.2027 and 31.12.2035, so no number changed by this answer.
- 2026-11-14 — Gate 2: hak approved the record and the commit, and gave the go-ahead to commit and push story
  035, with P31 and the story 034 Decision-log record as separate commits. The merge is hak's.
- 2026-11-14 — Decision (orchestrator): story 024 AC2's missing-year measurement moves to a year outside the
  extended list (phase 01.2026 to 12.2026, which would need the December 2025 liquidation), because the
  example phase inside the list now has a funding fund for every year in it. The rule itself is unchanged.
- 2026-11-14 — Decision (orchestrator): the app's tests that read fund rows were re-measured with hand
  oracles recomputed by an independent script, not by the code under test (P16). The recomputation is the file
  `scratchpad-035/oracle.mjs` in the orchestrator's scratchpad; the numbers it printed are the oracles in
  `fund.test.ts`, `phase.test.ts`, `purchase.test.ts` and `e2e/laz.spec.ts`.

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_Not a UI story in the usual sense: no component, copy, state or accessibility behaviour changed. What
changes is which rows have a value._

The year table (`YearTable`, 024) shows one row per phase year, and for the phase 01.2028 to 03.2036 that is
now nine rows: 2028 names a funding fund instead of reporting a missing year, and 2036 shows the three months
the phase has in it. The caption still names the phase period, so a partial year reads in context (024, review
round 1, finding 3). The last line of the breakdown is still the money rule's value, taken from the shown
total, so the 2036 line is 359,11 € and not its own rounding, and the lines still add up to the shown total.

The no-funding callout (UX §2) is no longer reached by the example phase; it is reached by a phase outside the
extended list, which is where the missing-year row is now measured (AC3). No control, label, live region or
focus is added, so nothing changes for the keyboard. The fund table's own columns are story 036.

## Technical design

The rule is already there: `logic/phase.ts` funds a phase year with the fund whose year is one lower, and
`monthsInYear` counts the phase months that year has, so a phase ending 03.2036 counts three. What this story
adds is data and one rule in the writer's comparison.

- `scripts/write-fund-list.mjs`: `FUND_TABLE` gains the 2027 and the 2035 entry with the identifiers read from
  the source, in year order, nine entries.
- `scripts/fundListCompare.mjs`: a record the committed file does not have is reported as kind `addition`, and
  `fits` accepts additions; a committed fund the run did not read is still an `identity` difference, so the
  guard still refuses a partial table. The writer's message counts only identity differences.
- The app's logic (`fund.ts`, `phase.ts`, `projection.ts`, `purchase.ts`) is unchanged: the app reads the same
  file through the same import, and only the file and its fixture copy grow.

Why the oracles depend on these rules: the hand values are computed with the horizon of ADR 0012 (31.12. of
the maturity year), so the open half of question 3 moves every figure of this story. No test reads the
committed file, so the copy's hand values stay hand values (P16, ADR 0013); the tests that read fund rows
locate a row by its fund year now that the table has nine rows. ADR links: 0012 and 0013, both amended.

## Implementation notes

- The two stored responses (`scripts/fixtures/fund-list/332475.html`, `344489.html`) are the pages read on
  2026-11-14. The committed file was written by a live run on that date, so its asOf is 2026-11-14 and the
  seven existing funds were refreshed by the same run; nothing in it was typed.
- The app's fixture copy keeps its hand pattern: the two new rows continue the copy's own steps (nav
  +2.000.000 micro-euro, ytm +50 basis points, maturity +100 hundredths, shares +100.000 per year), which is
  what hak chose, so the app's oracles are hand values and the values the stored pages print are used only by
  the script tests.
- Story 024 AC2's missing-year measurement moved to the phase 01.2026 to 12.2026 in the logic test and in the
  e2e test, and the "after the list" case in `phase.test.ts` moved to 2037 to 2038, because the example phase
  inside the extended list has no missing year any more.
- Three assertions in `purchase.test.ts` read fund rows by position (`slice(0, 2)`, `[1]`); with nine rows the
  position is no longer the row, so they now find the row by its fund year. The hand figures of those cases
  are unchanged.
- `phase.test.ts` finding 8 asserted `Number.isInteger` of a value that had already been rounded, which is true
  by definition; the assertion now reads the value before rounding, on the hand case depot 1.000.300 Cent.
- Comment digits corrected before the commit: the ρ values carried from story 032 in `purchase.test.ts`
  disagreed with the independent recomputation (2028 written as 1,0404516, computed as 1,0404564). The asserted
  figures were right, the comment was not.
- ADR 0012 and ADR 0013 carry the amendment; the workflow comment and `apps/laz/README.md` name nine funds, and
  the CHANGELOG line is in this commit.

## Test report

| AC  | Test(s)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Result               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| AC1 | `apps/laz/src/features/plan/logic/fund.test.ts`: nine rows in year order, and the two boundary rows carry the hand values; `phase.test.ts` "035 AC1: the phase boundary years name the fund that funds them" (2028 funded by the 2027 fund with 12 months, 2036 funded by the 2035 fund with 3 months, its unrounded amount 35.914,379 Cent shown as 359,11 € by the money rule, monthly 119,71 €, total 11.851,75 €); `apps/laz/e2e/laz.spec.ts` "035 AC1": the same figures in the table and in the figure line, nine rows | pass                 |
| AC2 | `scripts/fundListParse.test.mjs`: the fund table names 2027 through 2035 with the identifiers and the product page ids; the two stored responses parse to the hand values read from the pages on 2026-11-14; a fixture run without a response for the 2035 fund names it and writes nothing                                                                                                                                                                                                                                  | pass                 |
| AC3 | `phase.test.ts` "033 AC1": a phase outside the extended list keeps every year with no funding fund and totals 0,00 € (2026), and 2037 to 2038 keeps 12 and 2 months; `e2e/laz.spec.ts` "024 AC2": the seven funded years of the example phase with the hand figures, and 2026 as a year with no amount with its dash                                                                                                                                                                                                         | pass                 |
| AC4 | no test reads the committed file (story 025, ADR 0013), so this AC is measured as the run: the live run of 2026-11-14 wrote nine rows carrying the identifiers the writer's table names, and the frozen comparison includes both boundary funds, which is the addition test in `fundListCompare.test.mjs`                                                                                                                                                                                                                    | observed             |
| —   | Mutation checks on copies, each reverted from a backup made before it: `fits` without the addition branch → the addition test red; the writer's partial-table guard removed → both AC2 writer tests red; `monthsInYear` always 12 for the last year → four tests red (the round trip, 033 AC1, 035 AC1, purchase AC2)                                                                                                                                                                                                        | each rule fails once |

Counts as printed: script vitest 74 passed (6 files), of which the two fund-list files 13 (7 + 6); laz vitest
29 passed (9 files); laz Playwright 12 tests, which is 53 in the run of that workspace because the platform
group (41) runs with it; the other two workspace groups 80 and 110 passed. The full runs on the content as it
will be committed are green — 12 steps, 77,6 s; one run failed once on a landing-pages test, the next two are
green (74,3 s, 75,5 s); the same test failed once more and the two runs after it are green, 76,5 s and 75,1 s.
Recorded as observed, not as a defect, on the reading hak accepted on 2026-11-14 (machine load, no defect
story).

Defects found: none. The rule was already the app's rule, so nothing in the app's logic could regress; what
was checked is that the data reaches the rule.

## Review

**Round 1, reviewer 2026-11-14. Verdict: APPROVED. Checklist version: 2**

Worked through in the main session by the orchestrator, which is worth naming: the code of this story was
written in the same session. `npm run verify` was run on the content as it will be committed, not on an
earlier report: green, 12 steps, 77,6 s. A re-run then failed on one landing-pages test
(`landing\e2e\pages\landing.pages.spec.ts:153`, hydrates without an error, the caps still hold, nothing is
stored) and was green on the next two runs, 74,3 s and 75,5 s; the same test failed once more and the two runs
after it are green, 76,5 s and 75,1 s. Reported as observed, on the reading hak accepted on 2026-11-14
(machine load, no defect story). The accepted round showed a different test each time; here the same test failed
twice, which is the same shape under load, and no rule of this story is involved. A duration named here cannot
be measured by the run that prints it, since this sentence names it; the run CI makes on the pushed content is
the check that can cover these words, and it is reported in the gate message, not in this section.

| Item | Result | Note                                                                                                                                                                                                                                                                                                                                                                             |
| ---- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1   | pass   | AC1: `phase.ts` `monthsInYear` and the funding-fund lookup, shown by `phase.test.ts` 035 AC1 and by the e2e test; AC2: `FUND_TABLE` in `write-fund-list.mjs` and the three tests in `fundListParse.test.mjs`; AC3: the same lookup for a year outside the list, `phase.test.ts` 033 AC1 and e2e 024 AC2; AC4: the writer run plus `fits`, whose addition branch has its own test |
| C2   | n.a.   | no network call or pending state in the diff; the writer's request path is unchanged                                                                                                                                                                                                                                                                                             |
| C3   | n.a.   | no hook or component logic changed                                                                                                                                                                                                                                                                                                                                               |
| C4   | n.a.   | no render loop or imperative controller changed                                                                                                                                                                                                                                                                                                                                  |
| C5   | n.a.   | no reducer changed; the writer takes its run date as an argument, never a clock read                                                                                                                                                                                                                                                                                             |
| C6   | pass   | every failure path of the writer ends in a message and exit 1: a fund that cannot be read names the fund and the field, and the "does not fit" message counts only the identity differences, which is the change of this story                                                                                                                                                   |
| S1   | n.a.   | no input or rendering code changed                                                                                                                                                                                                                                                                                                                                               |
| S2   | n.a.   | no config, env or auth code; the two stored responses hold no secret                                                                                                                                                                                                                                                                                                             |
| S3   | n.a.   | `package.json` dependencies unchanged                                                                                                                                                                                                                                                                                                                                            |
| S4   | n.a.   | no dev-only code added                                                                                                                                                                                                                                                                                                                                                           |
| S5   | pass   | the writer was run by hand: the live run of 2026-11-14, and its failure path probed with a deliberately bad input (a fixture run with one response missing, which must name the fund and write nothing)                                                                                                                                                                          |
| T1   | pass   | the full run above                                                                                                                                                                                                                                                                                                                                                               |
| T2   | pass   | one test per AC at the cheapest level; AC1 is also measured in the browser because the year table is where the reader sees it, and 024 AC2 is re-measured on a different year, not proven twice                                                                                                                                                                                  |
| T3   | pass   | no vacuous fixture: every figure is a hand value recomputed by an independent script (P16), and three rules were mutated to show the assertions can fail                                                                                                                                                                                                                         |
| T4   | pass   | tests named after ACs, no counted tab sequences, fund rows found by header and by fund year rather than by position                                                                                                                                                                                                                                                              |
| T5   | pass   | the new branch in `fits` has its own test                                                                                                                                                                                                                                                                                                                                        |
| K1   | pass   | matches the technical design, deviations in Implementation notes, no dead code or duplication                                                                                                                                                                                                                                                                                    |
| K2   | pass   | no `any`, no `!` without a comment, tests next to the code                                                                                                                                                                                                                                                                                                                       |
| K3   | n.a.   | no CSS changed                                                                                                                                                                                                                                                                                                                                                                   |
| K4   | pass   | the factory files name no app; `check:structure` green with 35 stories                                                                                                                                                                                                                                                                                                           |
| K6   | pass   | status `in-review` here and the index row the same                                                                                                                                                                                                                                                                                                                               |
| K7   | pass   | every answer from hak is in the Decision log, append only                                                                                                                                                                                                                                                                                                                        |
| K8   | pass   | CHANGELOG line, `apps/laz/README.md` and the workflow comment name nine funds                                                                                                                                                                                                                                                                                                    |
| K9   | pass   | prettier green on the touched files                                                                                                                                                                                                                                                                                                                                              |
| K10  | n.a.   | no workspace script or tsconfig changed                                                                                                                                                                                                                                                                                                                                          |
| K11  | n.a.   | no env variable added                                                                                                                                                                                                                                                                                                                                                            |
| A1   | n.a.   | no control, label or live region changed                                                                                                                                                                                                                                                                                                                                         |
| A2   | n.a.   | no colour or state cue changed                                                                                                                                                                                                                                                                                                                                                   |
| A3   | n.a.   | no live region or animation changed                                                                                                                                                                                                                                                                                                                                              |
| A4   | n.a.   | no render loop or canvas changed                                                                                                                                                                                                                                                                                                                                                 |

Findings:

1. `[minor]` `apps/laz/src/features/plan/logic/purchase.test.ts` (header comment) — the ρ digits carried from
   story 032 disagree with the independent recomputation, 1,0404516 for 2028 against 1,0404564. The asserted
   figures come from the recomputation and are right, the comment was not; corrected before the commit, since
   a hand value written in a comment must be the value the independent recomputation gives (P16).
2. `[nit]` AC4 cannot be tested: no test may read the committed file (story 025, ADR 0013), so its first half
   rests on the run that wrote it and on CI's frozen comparison step. Reported as observed, not as a test.
3. `[nit]` A `--full` run can now write a grown table, so the coverage of the fund list depends on the
   writer's table having the boundary entries; a page that fails to parse still writes nothing, so a fund
   cannot be added by guessing.

## Explanation

The fund list now covers the funding years of the phase's boundaries, 2027 through 2035, so the example phase
01.2028 to 03.2034 has a funding fund for its first year (the 2027 fund), and a phase that ends 03.2036 has
one for its last year (the 2035 fund). The rule is unchanged and your two answers confirm it in your own
words: a phase year is funded by the fund that matures in the year before, and a year shows only the months
the phase has in it, so 2036 shows three months and not an invented full year.

Nothing was typed into the committed data file: its nine funds come from a writer run in live mode on
2026-11-14, which is the only way that file can gain a fund, and the comparison now reports a fund the file
does not have as an addition, so a table that grows can be written. The oracles were recomputed by an
independent script, not by the code under test, and three rules were checked against a mutation.

The horizon stays 31.12. of the maturity year, as ADR 0012 has it, which is your answer at gate 2. The dates
the source names (15.12.2027, redeemed 16.12.2027; 02.12.2035, redeemed 03.12.2035) are recorded in
ADR 0012, so the numbers can be rebuilt with the other reading.

Checks green: 29 laz unit tests, 12 laz browser tests, 74 script tests, full run 12 steps. The look in the
browser after the merge is yours.

## Retrospective

- A hand value in a comment disagreed with the recomputation: `purchase.test.ts` carried ρ(2028) = 1,0404516
  from story 032, and the recomputation gives 1,0404564. The asserted figures were right, the comment was not.
  It was corrected before the commit, because a hand value stated in a test must be the value the independent
  recomputation gives (P16), and a comment that disagrees with its own oracle is where a later reader takes
  the wrong number from.
- A rewrite made an unfalsifiable assertion: finding 8 read `Number.isInteger` of a value that had already been
  rounded, which is true by definition. Running the tests caught it, and the assertion now reads the value
  before rounding.
- Three assertions read fund rows by position, which the two new rows broke. A test that reads a table by
  position assumes the table's size, so the rows are now found by their fund year.
- The premise of this story's open question 2 was wrong: story 024 and ADR 0012 never counted a partial year as
  a full year. A question that assumes a rule the story does not have is worth checking against the story
  before it is asked.
- P31 (a test title without an apostrophe in a `.mjs` file) was proposed by story 034 and accepted by hak on
  2026-11-14; it is applied to `tester.md` in its own commit, and no test of this story needed it.
- The one answer this story still needed, the horizon of the two boundary funds, was asked at gate 2 and given
  by hak: 31.12. of the maturity year, as ADR 0012 has it for every fund. It was recorded in the Decision log
  and in ADR 0012 before it was answered, so the story could have been rebuilt with the other reading by
  recomputing the oracles — and no committed number changed by the answer.

### Cost

| Role                        | Round | Model | Tokens                                                    | Tool uses                                                 | Duration                                           |
| --------------------------- | ----- | ----- | --------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------- |
| product-owner               | 1     | n/a   | not measured (gate 1 answered by hak in the main session) | not measured (gate 1 answered by hak in the main session) | not measured (no per-run counters in this harness) |
| architect                   | 1     | n/a   | not measured (no architect run, design by orchestrator)   | not measured (no architect run)                           | not measured (no architect run)                    |
| developer                   | 1     | n/a   | not measured (no per-run counters in this harness)        | not measured (no per-run counters in this harness)        | not measured (no per-run counters in this harness) |
| tester                      | 1     | n/a   | not measured (no per-run counters in this harness)        | not measured (no per-run counters in this harness)        | not measured (no per-run counters in this harness) |
| reviewer                    | 1     | n/a   | not measured (no per-run counters in this harness)        | not measured (no per-run counters in this harness)        | not measured (run at gate 2)                       |
| total (measured)            | -     | -     | n/a                                                       | n/a                                                       | n/a                                                |
| orchestrator (main session) | 1     | n/a   | not measured                                              | n/a                                                       | n/a                                                |
