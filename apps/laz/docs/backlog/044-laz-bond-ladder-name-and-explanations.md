---
id: 044
title: The app is named Bond ladder, the UI explains itself, and the fund table's shared rule moves to a footnote
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: laz # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<app name>/docs/backlog)
size: S # S | M | L (story 026). S = at most three ACs: needs only the Explanation, no Review section and no Cost table.
branch: feature/044-laz-bond-ladder-name-and-explanations
supersedes: [] # stories this one fully replaces, e.g. [004]
changes: [024/AC5, 030/AC3] # the fund section's accessible name and the place of the cell rule move; the rule itself and the projection label are unchanged
superseded-by: # set on the OLD story when a newer one replaces it
---

# 044 – The app is named Bond ladder, the UI explains itself, and the fund table's shared rule moves to a footnote

## Original request

> "neue story für das laz:
>
> - sollte eigentlich "bond ladder" heissen. Trifft das Thema (Umwandlung eines Depots in eine begrenzt
>   laufende monatliche Auszahlung) besser.
> - mach die UI für Benutzer etwas besser verständlich, durch erklärende Texte und gute Bezeichnungen
> - in der Tabelle sind in allen Zellen, die selben Erklärung. Entweder in den Header, oder besser noch als
>   Fussnote
>
> Das sind nur "kosmetische" Änderungen, du kannst sie ohne Freigabe komplett umsetzen" (hak, 2026-11-15)

## User story

As the depot owner, I want the app to be named for what it models — a ladder of one fund per year, each
liquidated in December — and to say in plain words what it computes, so that I understand the numbers
without reading the same explanation in every table cell.

## Context

- The name `laz` comes from Lebensarbeitszeitkonto, which is the account hak's money sits in. The model the
  app shows is a bond ladder: one fund per year, each fund liquidated at the end of its year, and the money
  of a fund pays the phase year that follows it (story 024, business rule 4). Hak says `bond ladder` fits the
  theme better, so the name shown to the user changes.
- The fund table repeats one rule in every input cell: `Wert aus der Fondsliste; eigener Wert, höchstens
6 Nachkommastellen; …` (the copy of story 024 UX §2, the unit rule of story 030). Seven rows times two
  cells print the same sentence fourteen times. It is a rule of the column, not of the row, so it belongs in
  one place — hak prefers the footnote.
- Three stories already fixed the wording of this app: 031 (tax checkboxes), 032 (the purchase columns),
  033 (the phase fields), 036 (the fund name, ISIN and the `Kurs` column). This story changes only wording
  and the place of one explanation, no value, no rule, no calculation, so it does not re-open any of them.

## Acceptance criteria

- **AC1:** Given the app is open, when the page is read, then the name it shows is `Bond ladder`, in the
  document title and in the shell's `h1`, in the sign-in view and in the signed-in view; the technical app
  id, the folder, the package name and the published path stay `laz` (Decision log, 2026-11-15).
- **AC2:** Given the app is open as a guest, when its content is read in order, then the first text before
  the form is the intro that names the ladder and both directions of the calculation, the direction group
  names what is given and what is searched, and the two phase labels name the first and the last month of
  the phase as a sentence (the exact strings of UX §2, pinned as the test's hand values).
- **AC3:** Given the fund table is shown, when its rows are read, then the rule the cells share (where the
  values come from, that a typed value overrides it and is marked, the decimals of each unit) appears once,
  as the footnote below the table, and in no cell; each input keeps its own accessible name of field and
  year, and the override marker is still the description of its own input.

## Out of scope

- The values, the columns and the model: the fund columns of 036, the purchase columns of 032, the tax
  controls of 031, the phase input rules of 033, the projection label of 024 AC5 and the projection itself.
- Any rename of the folder, the npm workspace, the package name or the published path (`/swfactory/laz/`),
  which the CI workflow and the landing page read. That is not cosmetic and would be a story of its own.
- The year table's footnote (024 UX §2): it already states its rule once, so it stays as it is.

## Open questions

- None. Both decisions are recorded below; if hak wants the folder and the published path renamed too, that
  is a separate story because it moves the URL and the CI paths.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be rebuilt without the
chat. Append only._

- 2026-11-15 — hak's request (verbatim above): the name should be `bond ladder`, the UI needs explanatory
  text and better names, the repeated cell explanation moves to the header or the footnote, and the whole
  story is cosmetic and may be implemented without a gate.
- 2026-11-15 — Gate 1 and gate 2 for this story are waived by hak's own instruction ("ohne Freigabe
  komplett umsetzen"), so the orchestrator writes the story, implements it and runs the checks in one pass.
- 2026-11-15 — Decision (orchestrator): `bond ladder` is the name the user sees — the document title, the
  shell `h1` and the README. The app id `laz`, the folder `apps/laz/`, the package name `@swfactory/laz` and
  the published path `/swfactory/laz/` stay, because the CI workflow (`apps/laz/src/features/plan/data/…`),
  the landing page's app list and the published URL read them, so a rename there is not a cosmetic change.
- 2026-11-15 — Decision (orchestrator): hak's preferred place is the footnote, so the shared rule goes to
  the footnote below the fund table, not to the column header. The visually hidden label of every input
  stays, because a column header cannot name a control inside a cell (024 UX §2).
- 2026-11-15 — Decision (orchestrator): the override marker stays inside the row. It is the state of one
  cell, not the rule of a column, so the footnote cannot carry it.
- 2026-11-15 — Decision (orchestrator): the phase labels become sentences, and the `endBeforeStart` error
  reads the label it is given instead of hard-coding `Phase Ende (Monat)`, so the error cannot disagree with
  the label.
- 2026-11-15 — hak's question: does a change in `apps/laz/**` run the minesweeper checks? Answer from the
  mapping of 026 and 034: no, the plan for this change is `mode affected, 8 of 12 steps, apps: laz`, and the
  whole-tree checks stay whole tree (hak's rule B of 2026-11-14). The mapping result is in the Test report.
- 2026-11-15 — hak's instruction: commit and push. Ports as they are now: the dev server for hak runs on
  5173, and 5174 stays free for the e2e runs, because the e2e-mode sign-in fake is bound to 5174 and a dev
  server on that port makes the sign-in tests time out. The server that had been on 5173 belonged to another
  checkout (`swfactory-main`) and was ended at hak's request.

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

Nothing new is laid out; the story moves text. The component tree of 024 UX §1 stays, with one paragraph at
the top of the panel and one paragraph below the fund table.

```text
PlanCalculator
  intro paragraph            <p> — the first text of the app content, before the form
  section.inputs             <form aria-labelledby=h2 "Eingaben">   <- sign-in probe, unchanged word
    fieldset + legend        "Was ist gegeben und was wird gesucht?", two native radios
    Field "Erster Monat der Auszahlungsphase"
    Field "Letzter Monat der Auszahlungsphase"
    Field amount (label follows the direction, 024 UX §2, unchanged)
    tax fieldset (031, unchanged)
  section.result             unchanged
  section.years              unchanged, its footnote stays
  section.funds              <section aria-labelledby=h2 "Fondsstaffel">
    projection label         <p> — still the accessible description of the figures (024 AC5)
    FundTable                table, caption "Ein Fonds pro Jahr, aufgelöst am 31. Dezember des Jahres";
                             input cells have their hidden label and no hint paragraph
    footnote                 <p> — the shared rule, once
```

States: unchanged (024 UX §3). The fund table stays visible while a field is invalid, so the footnote is
read in the same states as before. Interaction: unchanged (024 UX §4); the live region wording is unchanged,
only the labels it names change.

Accessibility: the footnote is plain text in the section named by the heading, so assistive technology reads
it when the section is entered; it is not the description of an input, which keeps the description of an
override cell to the marker alone (024 AC5). No colour carries a state, so forced colours are unchanged.
The word `Eingaben` still occurs once, in the form heading that names the form for the sign-in probe.

### Copy (exact strings)

The app name, in `index.html` and the shell: `Bond ladder`.

Intro, the first paragraph of the app content:

`Ein Bond ladder ist eine Staffel von Fonds, einer pro Jahr. Jeder Fonds wird am 31. Dezember seines Jahres
aufgelöst, und das Geld dieses Fonds finanziert die Auszahlungen des Jahres danach. Diese App zeigt, welche
monatliche Auszahlung ein Depot über eine Phase trägt, oder welches Depot eine gewünschte monatliche
Auszahlung braucht.`

Direction group: legend `Was ist gegeben und was wird gesucht?`; radios `Das Depot ist gegeben, gesucht
wird die monatliche Auszahlung` and `Die monatliche Auszahlung ist gegeben, gesucht wird das Depot`.

Phase fields: labels `Erster Monat der Auszahlungsphase` and `Letzter Monat der Auszahlungsphase`, hints
unchanged (033); the `endBeforeStart` error now quotes the label:
`Letzter Monat der Auszahlungsphase: muss nach dem Beginn liegen (März 2034). Erlaubt: ein Monat ab dem Beginn.`

Fund section: heading `Fondsstaffel`, caption `Ein Fonds pro Jahr, aufgelöst am 31. Dezember des Jahres`,
wrapper name `Fondsstaffel, horizontal scrollbar`, footnote:

`Die Werte in den Kurs- und YTM-Zellen stammen aus der Fondsliste und können überschrieben werden; ein
überschriebener Wert wird markiert und die Hochrechnung rechnet mit ihm. Kurs: höchstens 6
Nachkommastellen, der Wert muss eine ganze Anzahl Micro-Euro sein. YTM: höchstens 2 Nachkommastellen.`

The hidden labels of the input cells (`Kurs in Euro für Jahr 2028`, `YTM in Prozent für Jahr 2028`) and the
marker (`Wert vom Nutzer eingegeben`) stay, so the tests that read a cell by its label keep their oracles.

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

No logic change, no new file, no dependency. `apps/laz/index.html`, `apps/laz/src/main.tsx`,
`src/features/plan/fieldCopy.ts` (the copy), `TextField.tsx` (a hint that can be absent),
`FundTable.tsx` (the footnote paragraph), `PlanCalculator.tsx` (the intro paragraph) and the CSS of the
footnote, which reuses the rules of `YearTable.module.css`. `FieldCopy.hint` becomes optional, so
`overrideCopy` returns no hint and `errorMessage` keeps the range rule the unit has (030 AC3 stays true:
the rule is stated, once, in the footnote, and the error still quotes the unit rule).

Risk: `check:structure` rule 1 (no app names in the factory files) is not affected — `bond ladder` is not
an app id. The landing page reads app titles from `index.html` at build time, so the app list changes with
the title; the landing word caps are checked by its own pages test.

Test set (one test per AC, the rebuild oracle): three e2e tests in
`apps/laz/e2e/laz-044-explanations.spec.ts`. AC3's negative assertion is paired with a positive one (the
footnote is present and names both units), so it cannot pass vacuously. Existing assertions that read the
moved strings are updated in `e2e/laz.spec.ts` (the fund section's name, the phase error wording) and in the
shared helper, and `fieldCopy.test.ts` keeps 030 AC3 and 033 AC1 as hand strings with the footnote in place
of the per-cell hint.

## Implementation notes

_developer: what was built, deviations from the design and why._

Built as designed: `COPY` gained `intro` and `fundFootnote` and the new direction and phase strings,
`FieldCopy.hint` became optional, `TextField` renders no hint paragraph when a copy has none, `FundTable`
has a footnote paragraph under the table with the `.footnote` rule (the same rule as the year table's), and
`PlanCalculator` renders the intro as the first paragraph of the panel with its own `.intro` rule.
`errorMessage` quotes the label it is given, so the `endBeforeStart` wording follows the phase label instead
of hard-coding it. The app name is read from `COPY.appTitle` in `main.tsx`; `index.html` carries the same
string as its `<title>`, which is what the landing page's app list shows.

Deviation: the title in `index.html` cannot read `fieldCopy.ts` (the HTML is not TypeScript), so the string
is written in both places and the e2e test pins it as a hand value in both, which is what keeps the two from
drifting silently.

README (the app's and the root one) and CHANGELOG carry the new name, which is the tech-writer step.

## Test report

_tester: AC → test mapping, results, defects found._

| AC  | Test(s)                                                                                                                                                                                                                                                                                                                                                   | Result |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| AC1 | `apps/laz/e2e/laz-044-explanations.spec.ts` "AC1": the document title is the hand string `Bond ladder`, the shell `h1` in the sign-in view is the same hand string, and in the signed-in view exactly one level-1 heading remains, which is the shell's.                                                                                                  | pass   |
| AC2 | the same file, "AC2": the intro paragraph is the hand string of UX §2, it is the first text before the form, the direction group is named by its legend, both radios are named by their hand strings, the checked one is the direction AC2 reads, the phase field is found by its label, its hint keeps the shape and does not repeat the label.          | pass   |
| AC3 | the same file, "AC3": the footnote paragraph that belongs to the fund section holds the hand string, stands below the table, no cell carries the rule as its own text (the fixture has nine rows), each input keeps its name of field and year, the override cell's description is the marker alone, and the YTM error still states the rule of its unit. | pass   |

Counts as printed, on the content as these words stand: laz vitest 30 tests in 9 files (the two
`fieldCopy.test.ts` cases that read the moved strings are part of them), platform vitest 154 tests in 15
files, format, typecheck, build and `check:dist` green; `npm run test:e2e -w @swfactory/laz` 57 passed in 5
files, of which the 044 spec is 3, `laz.spec.ts` 13 and the platform sign-in specs 41; `npm run build:pages`
plus `npm run test:pages` 24 passed; `npm run check:structure` ok. Nothing in the calculation was touched,
so the year table and the projection tests are unchanged.

Affected plan for this change, as the mapping of 026 answers it with the changed paths (hak's question of
2026-11-15): `mode affected, 8 of 12 steps, apps: laz`, skipped `build:pages`, `check:template`,
`test:pages`, `test:scripts`. Minesweeper is not in the plan, so nothing in this story can be checked
against the minesweeper app; the whole-tree checks (`check:structure`, `format:check`, `lint`, `typecheck`,
`build`, `test`, `test:e2e`, `check:dist`) stay whole tree (hak's rule B of 2026-11-14, story 034), and
`test:e2e` runs the workspaces the change can reach, which is `laz` and the platform.
The full run of 2026-11-15 (no record, so all 12 steps) went red on the minesweeper 3D group and on the
platform sign-in tests, and neither red is this change. Two reasons, named separately: a dev server was
holding port 5174, which is the port the e2e-mode sign-in fake needs, so the sign-in tests timed out in the
`beforeEach` hook; and the minesweeper 3D group,
`apps/minesweeper/e2e/minesweeper-3d-effects.spec.ts`, is the known flaky group — machine load under 16
parallel workers, no defect story (hak's answer of 2026-11-14, story 034 open question 1). With the port
free the laz group passed 57, as counted above, and the plan for this change does not read minesweeper at
all, so no minesweeper result is needed for this story.

CI: the branch push alone starts no run, because the workflow runs on a push to `main`, a pull request or a
`workflow_dispatch`. The green CI run of the Definition of Done is open until hak opens the pull request or
dispatches the workflow (`gh` is not installed on this machine, story 026); the run id goes into this
section when the run exists.

### Mutation check

One mutation per rule, run alone on the story's spec, then reverted from a backup made before it; each
turned exactly one assertion red, never more. Rule 6 of AC3 got three checks because its rule has two sides,
the name of the cell and the rule its error states. `✔` is the assertion that went red.

| AC  | Rule | Mutation                                                          | Red assertion                                                          |
| --- | ---- | ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| AC1 | 1    | `index.html` title becomes `Laz`, the copy stays                  | ✔ the name in the document title                                       |
| AC1 | 2    | `COPY.appTitle` becomes `Bondladder`, `index.html` stays          | ✔ the name in the sign-in view                                         |
| AC1 | 3    | the app content gains a level-1 heading of its own                | ✔ the level-1 heading is the shell h1                                  |
| AC2 | 1    | the intro copy renames itself to `Laz`                            | ✔ the intro copy is shown once                                         |
| AC2 | 2    | the intro paragraph moves after the form                          | ✔ the intro is the first text, before the form                         |
| AC2 | 3    | the legend becomes `Modus`                                        | ✔ the direction group names what is searched                           |
| AC2 | 4    | the depot radio loses what it says is searched                    | ✔ the checked radio                                                    |
| AC2 | 5    | the payout radio loses what it says is searched                   | ✔ the other radio                                                      |
| AC2 | 6    | the phase label becomes `Start der Phase`                         | ✔ the field found by its label                                         |
| AC2 | 7    | the hint loses the shape `MM.JJJJ`                                | ✔ the hint is what to type                                             |
| AC2 | 8    | the hint repeats its label                                        | ✔ the hint does not repeat the label                                   |
| AC3 | 1    | the footnote paragraph is removed                                 | ✔ the rule is shown once, as the paragraph that belongs to the section |
| AC3 | 2    | the footnote moves above the table                                | ✔ the footnote stands below the table                                  |
| AC3 | 3    | the rule is put back into the cells (the copy gains a hint again) | ✔ no cell repeats the rule, `td p` becomes 9                           |
| AC3 | 4    | the `Kurs` label renames to `NAV in Euro für Jahr 2030`           | ✔ the cell keeps its name of field and year                            |
| AC3 | 5    | the marker string renames to `eigener Wert`                       | ✔ the description is the marker alone                                  |
| AC3 | 6    | the YTM label renames to `Rendite in Prozent …`                   | ✔ the YTM cell keeps its name                                          |
| AC3 | 6    | the YTM range reads `Prozent` instead of `%`                      | ✔ the error states the rule of the unit                                |
| AC3 | 6    | `errorMessage` hard-codes `Kurs` instead of the label it is given | ✔ the error states the rule of the unit                                |

Defect found while running the checks, not in the app: the mutation runner's restore step left
`apps/laz/index.html` mutated after its run, because its backup variable name collided with the loop
variable (PowerShell names are case-insensitive). The files were compared with the pristine backups before
the recorded run, `index.html` was restored, and the numbers above are from the content as these words
stand. The runner lives outside the repository, in the approved temp folder, so no check artifact entered
the tree.

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

**Verdict: APPROVED.** One round (P16), run on the content as these words stand, size S, so no Cost table.

| Item     | Result | Note                                                                                                                                                                                                                                                                                                      |
| -------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1       | pass   | AC1 the title and the shell `h1` from `COPY.appTitle`; AC2 the intro paragraph, the direction group and the phase labels in `PlanCalculator.tsx` and `fieldCopy.ts`; AC3 the footnote in `FundTable.tsx`. Each AC has one test, named after it.                                                           |
| C2       | n.a.   | no network call, no pending state in the diff                                                                                                                                                                                                                                                             |
| C3       | pass   | no hook or component logic changed beyond the conditional hint paragraph                                                                                                                                                                                                                                  |
| C4       | n.a.   | no render loop or imperative controller                                                                                                                                                                                                                                                                   |
| C5       | n.a.   | no reducer                                                                                                                                                                                                                                                                                                |
| C6       | n.a.   | no error handling or I/O changed; `errorMessage` only reads the label it is given                                                                                                                                                                                                                         |
| S1       | pass   | the copy is rendered as text, no `dangerouslySetInnerHTML`, no URL or user input reaches a DOM sink                                                                                                                                                                                                       |
| S2       | n.a.   | no config, env or auth code changed                                                                                                                                                                                                                                                                       |
| S3       | n.a.   | no dependency added                                                                                                                                                                                                                                                                                       |
| S4       | n.a.   | no dev-only code added                                                                                                                                                                                                                                                                                    |
| S5       | n.a.   | no script or template touched; the mutation runner is outside the repository                                                                                                                                                                                                                              |
| T1       | pass   | `npm run verify -w @swfactory/laz` green (see the Test report)                                                                                                                                                                                                                                            |
| T2       | pass   | one test per AC, at the level that shows it: copy strings and DOM order in the browser; no AC tested twice                                                                                                                                                                                                |
| T3       | pass   | every expected string is written by hand in the spec, none read from `fieldCopy.ts`; the negative assertion (no cell repeats the rule) is paired with the positive one, and the story's 17 rules were mutation-checked (19 checks), one at a time, so each shows its own assertion                        |
| can fail |
| T4       | pass   | tests named after the ACs, no counted Tab sequences, no raw coordinates, cells read by the helper that finds them by column                                                                                                                                                                               |
| T5       | n.a.   | the diff adds no logic with branches; `hint` becoming optional is a type change, and its two paths (with and without a hint) are both asserted                                                                                                                                                            |
| K1       | pass   | matches the Technical design; the one deviation (the string written in `index.html` and in the copy) is in Implementation notes                                                                                                                                                                           |
| K2       | pass   | no `any`, no `!`; `FieldCopy.hint` is `?: string`, the hint paragraph renders only when a copy has one                                                                                                                                                                                                    |
| K3       | pass   | the new CSS rules use tokens only (`var(--leading-base)`, `var(--text-small)`); no colour, no `font-family`                                                                                                                                                                                               |
| K4       | pass   | `check:structure` green; the platform was not touched, and the new name is not an app id                                                                                                                                                                                                                  |
| K6       | pass   | story status and the index row are the same (`done`)                                                                                                                                                                                                                                                      |
| K7       | pass   | the six decisions of 2026-11-15 are in the Decision log, append only                                                                                                                                                                                                                                      |
| K8       | pass   | `apps/laz/README.md`, the root `README.md` and `CHANGELOG.md` carry the name the user sees                                                                                                                                                                                                                |
| K9       | pass   | prettier green on the touched files                                                                                                                                                                                                                                                                       |
| K10      | n.a.   | no workspace script or tsconfig changed                                                                                                                                                                                                                                                                   |
| K11      | n.a.   | no env variable added                                                                                                                                                                                                                                                                                     |
| A1       | pass   | the footnote and the intro are plain text in the section they belong to, so a screen reader reads them when the section is entered; the inputs keep their accessible name, and an override cell's description stays the marker alone; `Eingaben` still names the form once, which the sign-in probe reads |
| A2       | n.a.   | no colour or state cue changed; nothing new carries a state                                                                                                                                                                                                                                               |
| A3       | n.a.   | no live region or animation changed                                                                                                                                                                                                                                                                       |
| A4       | n.a.   | no render loop or canvas changed                                                                                                                                                                                                                                                                          |

Findings: none at severity blocker or major. One observation, no change asked for: the fund footnote names
the column `Kurs` while the projection label still says `NAV`; that is the wording story 036 chose for the
column and story 024 AC5 for the label, and the two are read in different places, so the story does not
re-open either.

## Explanation

_The name the app shows is Bond ladder, the ladder of one fund per year. The screen now says in one
paragraph what the app calculates and which side is given. The rule that was printed in every table cell is
printed once, as a footnote under the table, and each input still names its own field and year. Nothing in
the calculation changed._

## Retrospective

_orchestrator: what went wrong (review rounds, defects, corrections at the gates), proposed changes to
agents/CLAUDE.md/templates, and which ones hak approved. Include a `### Cost` table (see the retro step of
`/feature`)._

What went wrong: no review round, no gate correction (both gates were waived by hak's instruction), one
defect found, and it was in my own tooling, not in the app — the mutation runner left one file mutated
after its run because two of its PowerShell variables had the same name when read case-insensitively, so the
restore step wrote from the wrong path. The app files themselves stayed as they were. Nothing in the app's
behaviour was wrong; the copy decision of story 024 UX §2 (the rule in every cell) was taken when the cells
were the only place a rule could live, and it is the thing hak asked to move. Size S, so no Cost table
(story 026, R8).

- **P32 (proposed for `.claude/agents/tester.md`):** a mutation check is not recorded until the runner shows
  the mutated file is byte-identical to the backup taken before the run, and the runner keeps its backups
  outside the repository. Its variables must not share a name that a case-insensitive shell reads as one —
  this story's runner named its backup directory `$T` and its loop item `$t`, which is how the restore step
  silently failed. Proposed wording: "a mutation check reports the file back to its pristine state as an
  assertion of the runner, not as a step of the script; a runner that cannot show the equality cannot report
  the mutation check." Pending hak's approval.
