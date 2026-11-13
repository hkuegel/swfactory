---
id: 024
title: Lebensarbeitszeitkonto iBonds payout phase, both directions (projection)
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: laz # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<name>/docs/backlog)
branch: feature/024-laz-ibonds-phase-plan
supersedes: []
changes: [] # no existing story's behaviour changes; related stories are referenced, not modified
superseded-by:
---

# 024 – Lebensarbeitszeitkonto iBonds payout phase, both directions (projection)

## Original request

> "Name: laz
> Beschreibung: Ich habe ein Lebensarbeitszeitkonto (in Eur). Das Geld auf dem Konto möchte ich dazu verwenden mir die Freistellungsphase vor der Rente zu finanzieren. Dazu wird das Geld in zero coupons (ishares iBonds, gibt es pro Jahr mit Auszahlung im Dezember) angelegt. Das Programm sollte berechnen was die maximale Auszahlung mit gegebenen Depotbetrag ist, bzw. wieviel Geld ich für eine bestimmte monatliche AUszahlung brauche."

## User story

As the owner of a Lebensarbeitszeitkonto, I want to see both the maximum monthly payout my
depot can fund over a payout phase of a length I choose, and the depot a target monthly
payout would need, so that I can plan how the months before my retirement are financed by
the iBonds funds that are liquidated each December.

## Context

- First story of the new app `laz` (title in the app shell: "Lebensarbeitszeitkonto", app
  name `laz`). Personal planning tool for hak, requested 2026-11-13. Assumption: UI in
  German with German number format, like the `avd` stories.
- Story number verified 2026-11-13: the highest number over all backlogs is 022
  ([022](../../../../docs/backlog/022-cross-platform-checks.md)); the next number 023 is
  already taken by the in-flight branch `feature/023-landing-page-refinement` (see the
  Decision log of 022), so this story is 024.
- Related stories (no behaviour of theirs changes, so `changes` is empty): calculator
  pattern and hand oracles of [013](../../../avd/docs/backlog/013-avd-saving-phase-zulagen.md)
  and [014](../../../avd/docs/backlog/014-avd-tax-refund.md); guest sign-in
  [004](../../../../docs/backlog/004-guest-login.md); deployment on GitHub Pages
  [018](../../../../docs/backlog/018-deploy-github-pages.md).

### Business rules confirmed by hak (2026-11-13, see Decision log)

1. **Both directions**, checked against each other: given depot → maximum monthly payout;
   target monthly payout → required depot.
2. **Length of the payout phase is a parameter** (his example: 1.1.2028 – 31.3.2034).
3. **Tax is a parameter**: on/off plus a rate.
4. **Hold to maturity**: a fund with maturity December 2028 is liquidated in December 2028
   ("werden (automatisch) Dec 2028 aufgelöst, mit dem Betrag wird 2029 finanziert"), so the
   money of a fund is available only from its liquidation month, and the months of a year
   are funded by the December liquidation of the year before.
5. **Market data come from a data file in the repo**, not from a runtime fetch; the fund
   list is fixed in the repo and is not recomputed per call ("das muss aber nicht jedesmal
   neu berechnet werden"). Values per fund: NAV, weighted average YTM, weighted average
   maturity, shares outstanding, with an asOf date. A manual override of a value in the UI is
   allowed as a second path. Story 024 supplies the data file the app reads, with committed
   fixture values that the tests compute against; refreshing the file with a script is a
   separate devops story and is not part of this story.
6. **Access**: guest sign-in, no storage write, no runtime network request.
7. **Payout per share is a projection** from YTM and NAV ("Hochrechnung aus YTM und NAV"),
   not a published value, and the UI must label it as a projection.

### Measured facts (2026-11-13, with their caveats)

- BlackRock publishes no official public developer API for iShares fund data (their own
  FAQ).
- Their product-data endpoint answers for a UCITS fund with `component=holdings` (HTTP 200,
  fields include Par Value, Price, Maturity, Market Value per bond), but the response carried
  no `access-control-allow-origin` header; the probe ran in a context not subject to page
  CORS, so it does **not** prove that a browser app on GitHub Pages may read it. No AC of
  this story depends on a browser being able to fetch it.
- The final distribution equals the fund NAV at liquidation, after liabilities — a future
  payout per share is not a published market figure. BlackRock's own "Estimated Net
  Acquisition Yield" calculator states its results are illustrative only. Hence the UI label
  in AC5, and no AC asserts a published per-share payout.

The projection convention (compounding frequency, day-count, which fund years a phase month
uses when a phase year is partly covered) is the architect's design choice; the ACs state
only the boundaries that hold under any convention (AC1), not the design values.

## Acceptance criteria

- **AC1:** Given a fund in the fixed fund list with its data-file values (NAV, weighted
  average YTM, asOf), when the projected payout per share for that fund is shown, then it
  follows the projection rule in Context, measured at the boundaries that hold under any
  convention: with YTM 0 % the projected payout per share equals the NAV exactly, and when
  asOf equals the maturity it also equals the NAV; for the same NAV and asOf, YTM 0 %, 2 %,
  4 % give a projection that never decreases.
- **AC2:** Given the phase 1.1.2028 – 31.3.2034 and the fund list, when the phase months are
  funded, then a fund's money is not spendable before its liquidation month (a fund
  liquidated in December 2028 funds no month before December 2028, and its amount finances
  2029), and each phase year is funded by the December liquidation of the year before;
  measured on this phase: 2028 has no funding year and is reported as missing with no
  amount invented for it, 2029–2034 are funded by the funds liquidated in December
  2028–2033, and the phase total counts only the years that have a funding fund.
- **AC3:** Given the same fund list, phase length and tax parameter, when the maximum
  monthly payout computed from a depot is fed back as the target monthly payout, then the
  required depot differs from the original depot by at most one cent, the rounding unit of
  the shown amounts (0,01 EUR); measured as a round trip on three cases: depot 0, a
  mid-size depot, and the largest depot covered by the fund list.
- **AC4:** Given the tax parameter is off and then on with rate r, when the same inputs are
  used, then the taxed per-share payout equals NAV + (1 − r) × (pre-tax projection − NAV),
  measured at r = 0 % (the result equals the pre-tax result exactly), r = 100 % (the result
  equals the NAV, no gain remains) and r = 25 % on a fund whose pre-tax projection is
  4,00 EUR above its NAV (taxed payout = NAV + 3,00 EUR); turning tax off again gives the
  same numbers as before.
- **AC5:** Given a result is shown, when a payout-per-share figure is displayed, then the
  text next to that figure states that it is a projection from YTM and NAV, not a published
  market value, and states the asOf date; measured as: that label text is present and
  programmatically associated with the figure, and the asOf shown equals the asOf in the
  data file; a value the user overrides manually is marked as a user-entered override.
- **AC6:** Given the app is open as a guest (004), when the calculation runs, then the app
  makes no network request of its own (only its own bundle and static files, including the
  repo data file, are loaded), and it writes nothing to localStorage, sessionStorage,
  IndexedDB or cookies; measured by the browser network log and the storage inspection
  during one guest session, and results change only when an input changes (018 still holds).

## Out of scope

- Any runtime fetch of market data, and any recomputation of the fund list per call; the
  data-file writer is a separate devops story (Context item 5), not part of this story.
- Saving or loading the user's inputs, export, print, scenarios, historical accounting of
  actual purchases, per-position lots.
- Tax rules beyond one on/off switch and one rate (Teilfreistellung, Vorabpauschale,
  Sparerpauschbetrag); hak answered that the tax base is the gain only, taxed at
  liquidation, with no Teilfreistellung.
- Fund selection or buy/sell recommendations, and any investment or tax advice.
- Multi-currency and non-EUR fund families beyond the EUR Corporate UCITS iBonds family hak
  chose (Open question 1).

## Open questions

1. Fund family and currency per year, answered 2026-11-13: EUR Corporate UCITS iBonds, one
   fund per maturity year, and the fund list is fixed in the repo (hak). **Still open:** the
   ISINs of hak's actual positions, which the fixed fund list needs before it can name his
   holdings; the tests run against the committed fixture values meanwhile.
2. Tax base — answered 2026-11-13: only the gain, taxed at liquidation, no Teilfreistellung
   (hak).
3. What the app shows when a phase year has no funding fund — answered 2026-11-13: a line in
   the year overview with no amount (hak). AC2 asserts only that the year is reported as
   missing; the wording itself is a UX choice, not a test.
4. Rounding rule — answered 2026-11-13: amounts shown to 2 decimal places, i.e. one cent
   (hak); AC3 now states one cent instead of pointing here.
5. Data-file writer — answered 2026-11-13: no, a separate devops story (hak); see Context
   item 5.

## Decision log

_Append only._

- 2026-11-13 — Q: which directions? — A: both, checked against each other (hak).
- 2026-11-13 — Q: is the payout phase fixed? — A: it is a parameter; example 1.1.2028 –
  31.3.2034 (hak).
- 2026-11-13 — Q: tax? — A: a parameter, on/off plus a rate (hak).
- 2026-11-13 — Q: is the fund sold before maturity? — A: hold to maturity; a fund with
  maturity Dec 2028 "werden (automatisch) Dec 2028 aufgelöst, mit dem Betrag wird 2029
  finanziert", so a fund's money is available only from its liquidation month and a phase
  year is funded by the December liquidation of the year before (hak).
- 2026-11-13 — Q: live market data or a data file? — A: a data file in the repo written by a
  script (devops), no runtime fetch; the fund list is fixed in the repo, "das muss aber nicht
  jedesmal neu berechnet werden"; values NAV, weighted average YTM, weighted average
  maturity, shares outstanding, with asOf; manual override of a value in the UI allowed as a
  second path (hak).
- 2026-11-13 — Q: access? — A: guest sign-in, no storage write, no runtime network request
  (hak).
- 2026-11-13 — Q: is the payout per share a published value? — A: no, it is a projection,
  "Hochrechnung aus YTM und NAV", and the UI must label it as a projection (hak).
- 2026-11-13 — Measured: no official public developer API for iShares fund data (BlackRock's
  own FAQ).
- 2026-11-13 — Measured: the product-data endpoint answers for a UCITS fund with
  `component=holdings` (HTTP 200, fields include Par Value, Price, Maturity, Market Value per
  bond) but carried no `access-control-allow-origin` header; the probe ran in a context not
  subject to page CORS, so it does not prove a browser app on GitHub Pages may read it. Caveat
  kept; no AC depends on a browser fetch (hak).
- 2026-11-13 — Measured: the final distribution equals the fund NAV at liquidation, after
  liabilities, so a future payout per share is not a published market figure; BlackRock's own
  "Estimated Net Acquisition Yield" calculator states its results are illustrative only.
- 2026-11-13 — Q: story number (orchestrator said 024) — A: verified 024; highest number in
  the backlogs is 022 and 023 is already used by branch
  `feature/023-landing-page-refinement` (product-owner).
- 2026-11-13 — Q: fund family and currency per year — A: EUR Corporate UCITS iBonds, one
  fund per maturity year, and the fund list is fixed in the repo (hak). The ISINs of hak's
  actual positions are still open and stay an open question (Open question 1).
- 2026-11-13 — Q: tax base — A: only the gain, taxed at liquidation; no Teilfreistellung
  (hak).
- 2026-11-13 — Q: rounding rule — A: amounts shown to 2 decimal places, i.e. one cent (hak);
  AC3 now states the rounding unit as one cent instead of referring to an open question.
- 2026-11-13 — Q: what does the app show when a phase year has no funding fund — A: a line in
  the year overview with no amount (hak); AC2 asserts only that the year is reported as
  missing, the wording is a UX choice and not a test.
- 2026-11-13 — Q: is the data-file writer part of 024 — A: no, it is a separate devops story
  (hak); story 024 supplies the data file the app reads, with committed fixture values the
  tests compute against, and refreshing it with a script is not part of this story (recorded
  in Context item 5).

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

German UI, German number format (`181,41 €`), German dates (`31.12.2026`). Neutral tone, no "du"/"Sie". Everything is synchronous: no loading state. No new colour token — every colour below is an existing platform token, so `apps/laz/src/tokens.css` stays empty and `tokens.test.ts` is unchanged. The shell's `h1` is the app title; this feature adds only `h2` and below. Nothing animates, so `prefers-reduced-motion` changes nothing (see section 5).

### 1. Layout / component tree

Single column inside the shell panel, DOM order = tab order (panel edge to edge below 600 px).

```text
PlanCalculator                        fragment inside the shell panel
  section.inputs                    <form aria-labelledby=h2 "Eingaben" noValidate>   <- sign-in probe
    Radiogroup "Rechenrichtung"     <fieldset><legend>, two native radios
    Field "Phase Beginn (Monat)"    <label>, input, hint <p>, error <p> (only while invalid)
    Field "Phase Ende (Monat)"      same pattern
    Field amount (label follows the direction, section 2)
    Checkbox "Steuer auf den Gewinn anwenden"
    Field "Steuersatz in Prozent"   same pattern (read only while the checkbox is checked)
  section.result                    <section aria-labelledby=h2 "Ergebnis">
    live region                     <p aria-live="polite"> visually hidden, mounted empty (section 4)
    empty / invalid / success: see section 3
    success: <dl> answer figure + "Summe der finanzierten Jahre"
  section.years                     <section aria-labelledby=h2 "Jahresübersicht">
    scroller                        <div role="region" aria-label="Jahresübersicht, horizontal scrollbar" tabindex=0>
      YearTable                     <table> caption with the phase period, thead, one row per phase year
      footnote <p> (section 2)
    removed while any field is invalid
  section.funds                     <section aria-labelledby=h2 "Fondsplan">
    projection label                <p id=hinweis> (AC5, section 2)
    FundTable                       <table> caption, thead, one row per fund year; NAV and YTM cells are inputs
```

- Shared components: only `Button` exists in `packages/platform/src/components/`, and this view needs no button (no submit; the answer follows every keystroke). Field/hint/error, checkbox, visually hidden label and the focusable table scroller reuse the `avd` `saving` patterns (`TextField`, `CheckboxOption`, `YearTable`).
- Landmarks: the form's accessible name is the visible `h2` "Eingaben" (`aria-labelledby`), which is the `playwright.config.ts` probe `{ role: 'form', name: 'Eingaben' }`. The word "Eingaben" occurs nowhere else in this design; "Ergebnis", "Jahresübersicht" and "Fondsplan" are also used nowhere else.
- The direction picks which single amount field exists; there is never a second, unused amount field and no field is ever disabled.

### 2. Copy (exact texts)

Labels (no label is a substring of another; tests should use `getByLabel(label, { exact: true })`):

- Radiogroup legend `Rechenrichtung`; radios `Depot gegeben, Auszahlung gesucht` (preselected) and `Auszahlung gegeben, Depot gesucht`.
- `Phase Beginn (Monat)` — hint `Erster Monat der Auszahlungsphase; Format TT.MM.JJJJ, zum Beispiel 01.01.2028.`
- `Phase Ende (Monat)` — hint `Letzter Monat der Auszahlungsphase; Format TT.MM.JJJJ, zum Beispiel 31.03.2034; muss nach dem Beginn liegen.`
- Amount field, direction 1: `Depot am Anfang der Phase (EUR)` — hint `0 bis 200.000,00 €, höchstens 2 Nachkommastellen.`
- Amount field, direction 2: `Monatliche Auszahlung als Ziel (EUR)` — hint `0,00 € oder mehr pro Monat, höchstens 2 Nachkommastellen.`
- Checkbox `Steuer auf den Gewinn anwenden`; field `Steuersatz in Prozent` — hint `0 bis 50 %, höchstens 2 Nachkommastellen; wird nur benutzt, wenn die Steuer angehakt ist.`
- Override inputs inside a row get their own visually hidden label: `NAV in Euro für Jahr {year}` and `YTM in Prozent für Jahr {year}` (a column header does not name a control inside a cell).

Required fields: `Phase Beginn (Monat)`, `Phase Ende (Monat)`, the amount field of the chosen direction, and `Steuersatz in Prozent` only while the tax checkbox is checked.

Year table column headers: `Jahr`, `Monate`, `Finanzierung durch Fonds`, `Betrag für das Jahr` (row header = the year). Fund table column headers: `Jahr`, `NAV in Euro`, `YTM in Prozent`, `Hochrechnung je Anteil in Euro`.

Wrapper accessible names of the two focusable table wrappers (`aria-label` on `div role="region" tabindex="0"`): `Jahresübersicht, horizontal scrollbar` and `Fondsplan, horizontal scrollbar`. These are accessible names, not visible text, so no visible copy changes.

Result figures (`dt`): `Maximale monatliche Auszahlung` (direction 1) or `Benötigtes Depot für die Phase` (direction 2), plus `Summe der finanzierten Jahre` in both directions. Values via `formatEuro`, e.g. `181,41 €`, `11.428,52 €`.

Projection label (AC5), one paragraph in the Fondsplan section, referenced through `aria-describedby` by every figure of the `Hochrechnung je Anteil in Euro` column (that makes it the figure's accessible description):

`Diese Beträge sind eine Hochrechnung aus YTM und NAV und kein veröffentlichter Marktwert. Stand der Daten: 31.12.2026.`

`{asOf}` is `formatDate` (`de-DE`), so the shown date equals the asOf in the data file; the label names the unit in the column header, not in the label itself.

Missing-year line (open question 3), in the funding cell, with no amount in the amount cell:

- funding cell: `kein Fonds für dieses Jahr`
- amount cell: `–` (a dash only, no euro figure)
- footnote under the year table: `Jedes Phase-Jahr wird durch die Auflösung des Fonds im Dezember des Vorjahres finanziert. Ein Jahr ohne Fonds wird ohne Betrag gezeigt und zählt nicht in der Summe.`

Example rows (fixture list, phase 01.01.2028 – 31.03.2034): `2028 | 12 | kein Fonds für dieses Jahr | –`, `2029 | 12 | Fonds 2028 (Auflösung Dezember 2028) | 2.176,86 €`, `2034 | 3 | Fonds 2033 (Auflösung Dezember 2033) | 544,22 €`.

Override marker (AC5), exact: `Wert vom Nutzer eingegeben`. It appears in the row only when the parsed value differs from the value in the data file; its id is added to that input's `aria-describedby` (beside the hint), so assistive technology reads the marker as part of the field's description. The row's projection figure uses the override.

Error texts follow the `avd` pattern (exact label + allowed range): `empty` → `{Label}: Wert fehlt. Erlaubt: {R}.`, `format` → `{Label}: keine gültige Zahl. Erlaubt: {R}.`, dates → `{Label}: kein gültiges Datum. Erlaubt: {R}.`, `range` → `{Label}: Wert außerhalb des erlaubten Bereichs. Erlaubt: {R}.`, `endBeforeStart` → `Phase Ende (Monat): muss nach dem Beginn liegen ({start}). Erlaubt: ein Monat ab dem Beginn.`

Result-area strings:

- empty, before the first edit: `Noch kein Ergebnis: bitte Phase und Betrag ausfüllen.`
- invalid, after the first edit: `Kein Ergebnis möglich. Bitte die markierten Felder korrigieren.`
- no phase year has a funding fund: `Kein Ergebnis möglich: die Phase hat kein Jahr mit einem Fonds.`

Substring notes for the tester: `NAV` and `YTM` occur both as column headers and inside the projection label; `Fonds` occurs in the `Fondsplan` heading, in a column header, in the footnote and in the missing-year line; `Auszahlung`, `Depot` and `Phase` occur in several labels, figures and the footnote. Tests must use the full line text, `exact: true`, or role/columnheader lookups; only "Eingaben" is a unique single word.

### 3. States

- Loading: none, everything is synchronous.
- Empty (first render, nothing filled): all fields empty, direction = first radio, tax off. The result area shows the empty string of section 2; no field error is shown before the first edit. The Fondsplan section is already visible with the data-file values and their projections (tax off), so the projection label and the asOf are visible in this state.
- Success: result figures, year table rows (missing years shown as the line above), Fondsplan rows.
- Invalid input: each invalid field shows its own error below the hint; the Jahresübersicht section is removed and the result area shows the no-result callout; the Fondsplan stays and its inputs show their own errors. Fixing the last error restores everything.
- Phase year without a funding fund: a success state, not an error; the row shows `kein Fonds für dieses Jahr` and `–`, and only years with a fund count in `Summe der finanzierten Jahre`.
- Field disabled: never; the tax rate field stays enabled and is simply not read while the checkbox is unchecked.

### 4. Interactions

- Typing stores the raw text unchanged (no reformatting, no caret jump); validity, figures, year table, projections and the marker recompute on every keystroke. There is no submit button; `onSubmit` still calls `preventDefault()` so Enter never reloads the page.
- Focus never moves automatically; focus stays in the field being edited. Removing the year table cannot move focus, because focus is in the form.
- Tab order: radiogroup (arrow keys select, no roving tabindex needed), phase start, phase end, amount field, tax checkbox, rate, then the year-table scroller (focusable because it scrolls, only while a result exists), then the Fondsplan label paragraph and its inputs row by row.
- Live region: one `<p aria-live="polite" class="visually-hidden">` inside `Ergebnis`, mounted empty on the first render and in every state. Its text is empty until the first edit (the initial render is not announced), then it is debounced 700 ms as in `avd`; the visible figures are not delayed. Wording:
  - direction 1: `Maximale monatliche Auszahlung: {x}. Summe der finanzierten Jahre: {y}.`
  - direction 2: `Benötigtes Depot für die Phase: {x}. Summe der finanzierten Jahre: {y}.`
  - invalid: `Kein Ergebnis: {first invalid label} ist ungültig.`
    The sum part makes the string differ in both directions, so the region always has something new to announce. An override is an edit and announces through the same region. The radios announce themselves, so they need no region of their own.
- No chart (no AC needs one), no tabs, no saved scenarios.

### 5. Accessibility

- Every input has a real `<label>`; the two override inputs in a table row use their own visually hidden label (section 2). Errors are the field's description through `aria-describedby`, with `aria-invalid`; no `role="alert"`.
- Projection figures carry the projection label as their accessible description through `aria-describedby` (AC5); override inputs carry the marker the same way.
- Tables are real `table`s with `caption`, `th scope="col"` and `th scope="row"`; the year table caption names the phase period so the missing year can be read in context.
- Contrast (hand computed, tester re-checks with a tool): text `--color-text` on `--color-surface` 17.16 light / 14.10 dark; override marker text `--color-text` on `--color-surface-subtle` 15.06 / 12.43 with its 4 px bar `--color-edge` 3.90 / 4.72; danger callout `--color-danger` on `--color-danger-bg` 5.88 / 9.27; focus `--color-focus` 7.00 / 9.75.
- Focus indicator: 2 px `--color-focus` outline, offset 2 px; an invalid field keeps its 2 px `--color-danger` border under it.
- `prefers-reduced-motion`: nothing in this design animates, so the media block has no effect here.
- Forced colours: the missing-year state, the override state and the invalid state are carried by text, not by colour; the marker's decorative bar becomes a 1 px CanvasText border (a background tint counts as no border), and the invalid field keeps a 1 px CanvasText border plus its icon.
- Below 600 px: the panel is edge to edge, fields stack full width with the label above the input, the result `dl` shows one figure per line, and both tables scroll inside their own focusable wrapper so the page never scrolls sideways. No other change.

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

All new code is inside `apps/laz/`; the platform is unchanged. The feature slice
`apps/laz/src/features/plan/` follows the `avd` calculator pattern (pure logic in `logic/`,
thin components, tests colocated, no framework, no state library). No async, no network call,
no storage write, no new dependency (so `check:dist` needs no new string and `C2`/`C6` are
`n.a.` for this diff; the guest-only build rule of ADR 0010 already covers the sign-in).

### Fund list and the phase model

Fixed in the repo, one fund per maturity year **2028–2034** (hak's phase example
1.1.2028 – 31.3.2034). **No fund for 2027 is added**: AC2 measures the example phase's 2028 as a
year with no funding fund, which is only possible if the list starts at 2028. The rule generalises:
a phase year is funded by the fund whose maturity year is `year − 1`; if that fund is not in the
list, the year is a missing year with no amount (open question 3).

Fund list (fixture values, one file-level `asOf` of 2026-12-31 — ADR 0013, so the hand oracle needs
no calendar arithmetic; the developer copies these into the data file):

```json
{
  "asOf": "2026-12-31",
  "funds": [
    { "year": 2028, "navCents": 3800, "ytmBp": 200 },
    { "year": 2029, "navCents": 4000, "ytmBp": 250 },
    { "year": 2030, "navCents": 4200, "ytmBp": 300 },
    { "year": 2031, "navCents": 4400, "ytmBp": 350 },
    { "year": 2032, "navCents": 4600, "ytmBp": 400 },
    { "year": 2033, "navCents": 4800, "ytmBp": 450 },
    { "year": 2034, "navCents": 5000, "ytmBp": 500 }
  ]
}
```

(plus `isin`, `name`, `avgMaturity`, `sharesOutstanding` per fund; `avgMaturity` and
`sharesOutstanding` are shown as fund information and never enter the calculation — the projection
horizon is the fund's liquidation date, 31 December of its maturity year, see ADR 0012.)

For this list and the example phase (tax off): day counts from asOf to liquidation are 731, 1096,
1461, 1826, 2192, 2557, 2922; payout per share 39,5373 / 43,0785 / 47,2752 / 52,2631 / 58,2172 /
65,3371 / 73,8925 EUR; funded phase years 2029–2034 with months 12, 12, 12, 12, 12, 3 (2028 has
no funding fund) → phase factor **F = 55,125236**, so depot 10.000,00 EUR → 181,41 EUR per month,
phase total 11.428,52 EUR, per year 2.176,86 EUR (2034: 544,22 EUR). With tax on at 25 % the same
phase gives F = 56,844419 → 175,92 EUR per month.

### Convention (ADR 0012)

- Payout per share (pre-tax) = `navCents · (1 + ytm)^(d/365)`, `d` = actual calendar days from
  `asOf` — the file-level `FundList.asOf`, the same single date the projection label shows (ADR 0013)
  — to the fund's liquidation date (annual compounding, ACT/365 day count, no monthly or simple
  interest). `d = 0` and `ytm = 0` give exactly the NAV (AC1's boundaries hold by construction).
- Tax on the gain only, at liquidation: `payout = NAV + (1 − r)·(projection − NAV)`, base
  `max(0, gain)` (AC4; a negative projection gain is not taxed, which the AC4 formula keeps for
  the positive gains the fixture has). Tax is one on/off parameter plus one rate in basis points.
- Phase = whole calendar months, inclusive; a phase year counts only its phase months (a partly
  covered year: the months inside the phase, e.g. 3 for 1.1–31.3.2034); no money moves between
  phase years (each funding fund covers exactly the year it funds), so the plan has no carryover.
- Both directions are one closed form inverted (the "one oracle"): `F = Σ_funded years m_y / ρ′_y`
  with `ρ′ = 1 + (1 − r)·(ρ − 1)` the per-euro payout factor, `P = D / F` and `D = P · F`.
  Unrounded inside, one rounding at display (CLAUDE.md money rule); the last year of the
  year breakdown is derived as total − the others, not rounded separately.

### New files (all `apps/laz/`)

- `src/features/plan/data/fund-list.json` — the committed data file (ADR 0013), fixture values
  above; the app reads it through a build-time import, never a fetch.
- `src/features/plan/logic/fund.ts` — the `Fund` and `FundList` types, the typed import of the data
  file, `liquidationDate(fund)` = `31.12.` of its maturity year. `Fund` carries no `asOf`: the date is
  read once from `FundList.asOf`, so one label covers every row (ADR 0013).
- `src/features/plan/logic/projection.ts` — pure: `dayCount(asOf, liquidation)`,
  `payoutFactor(fund, tax)` and `payoutPerShareCents(fund, tax)` (the AC1/AC4 rule, testable with
  explicit inputs).
- `src/features/plan/logic/phase.ts` — pure: `phaseFactor(funds, phase, tax)`,
  `payoutFromDepotCents` / `depotFromPayoutCents` (the same `F`, inverted), `yearRows` with the
  funding fund or `null` for a missing year.
- `src/features/plan/logic/parseInputs.ts` — raw text → integer cents, basis points and the phase
  months; `FieldError` kinds `empty` / `format` / `range` / `endBeforeStart` (same shape as avd's).
  **Dates are typed in the German format** (`TT.MM.JJJJ`, per UX), not `type="date"`: the parser
  accepts `^(\d{1,2})\.(\d{1,2})\.(\d{4})$`, rejects a month outside 1–12 and a day that is not a
  real day of that month (so `31.13.2028` and `29.2.2027` are `format` errors, `29.2.2028` is
  valid), and normalises the accepted date to the phase month `YYYY-MM` from `Date.UTC` parts. A
  `type="date"` field was rejected because its displayed format and its value are browser-locale
  dependent and empty for partial input, which would make UX's error wording unreachable.
  **Ranges** (UX's `{R}` texts must read exactly these): depot 0,00 – 200.000,00 €; monthly target
  0,00 – 10.000,00 € per month (the bound is needed for UX's error wording and for safe integers;
  the largest monthly payout the fund list can give from the maximum depot is 3.628,10 €, so the
  round-trip case of AC3 stays inside it); tax rate 0 – 50 %; phase months 1.1.2027 – 31.12.2034
  (the lower bound only so that a phase before the list is expressible and reports missing years).
  All fields are `inputMode="text"`/`"decimal"` text inputs, none is ever disabled; the rate field
  is parsed **only while the tax checkbox is checked** (`parseInputs(raw, taxOn)`), so an unparsed
  rate while unchecked produces no error and `Tax.rateBp` is 0 in the derived result (see Data flow
  and the parsing test set).
- `src/features/plan/logic/format.ts` — `formatEuro` (2 dp), `formatDate` (`TT.MM.JJJJ` from the file's
  ISO date parts), `formatMonth` (a phase month as its German month name and year, `Januar 2028`, with
  **no day** — round-1 finding 3, so the caption and the `endBeforeStart` error name the months the user
  typed instead of inventing the first day), `fundValueText` (a fund cell shows the data-file value as
  text that round-trips through the same parser); all `de-DE`, formatters built once at module level.
  No `formatPercent` and no `formatWholeEuro` export (round-1 finding 5): the copy hard-codes its ranges
  and percent values are only typed by the user, so nothing formats them.
- `src/features/plan/PlanCalculator.tsx` — state owner; `PhaseForm.tsx`, `FundTable.tsx`,
  `YearTable.tsx`, `ResultSummary.tsx` (figures + the projection label + live region),
  `fieldCopy.ts` (UX copy), CSS Modules per component.
- `src/main.tsx` renders `PlanCalculator`; `src/Content.tsx` and `Content.test.tsx` are deleted.
- `playwright.config.ts` — `signedInContent` becomes `{ role: 'form', name: 'Eingaben' }`
  (the platform sign-in specs run unchanged against the app; the name must occur nowhere else).
- `tsconfig.app.json` — add `resolveJsonModule` (the JSON data import); the only tooling change.
- `src/tokens.css` — only if UX needs app tokens; no colour is needed by this design, so the
  existing `tokens.test.ts` rules are enough. No `dist-check.json` change (no dev-only code).
- `e2e/laz.spec.ts` — the AC tests below. No existing spec walks `parentElement` / `locator('..')`
  from markup this design moves; the only spec affected is the platform's sign-in probe through
  `playwright.config.ts`.

### Types

```ts
// fund.ts
export interface FundList {
  /** ISO calendar date YYYY-MM-DD, one date for the whole file (ADR 0013), read by the projection;
      rendered as TT.MM.JJJJ through formatDate. Not a per-fund field. */
  readonly asOf: string;
  readonly funds: readonly Fund[];
}
export interface Fund {
  readonly year: number; // maturity year, the fund list key: 2028..2034
  readonly isin: string;
  readonly name: string;
  readonly navCents: number;
  /** weighted average YTM, basis points (1 % = 100) */
  readonly ytmBp: number;
  /** display only, not read by the calculation */
  readonly avgMaturity: string;
  readonly sharesOutstanding: number;
}

// projection.ts
export interface Tax {
  readonly on: boolean;
  readonly rateBp: number; // 0..5000
}
/** ρ = (1 + ytm)^(d/365), the pre-tax payout per euro invested; exact 1 for ytm 0 or d 0. */
export function payoutFactor(fund: Fund, tax: Tax): number;
/** payout per share in cents (unrounded): navCents · ρ′, ρ′ = 1 + (1 − r)·(ρ − 1). */
export function payoutPerShareCents(fund: Fund, tax: Tax): number;

// phase.ts
export interface Phase {
  /** whole calendar months, inclusive, as 'YYYY-MM' (normalised by the parser from TT.MM.JJJJ) */
  readonly startMonth: string;
  readonly endMonth: string;
}
export interface YearRow {
  readonly year: number;
  /** phase months in this year (1..12) */
  readonly months: number;
  /** funding fund (maturity year − 1), or null when the year is reported as missing */
  readonly fundingFund: Fund | null;
  /** unrounded: months · monthlyCents */
  readonly yearAmountCents: number;
}
export interface Plan {
  readonly years: readonly YearRow[];
  /** only years with a funding fund count */
  readonly fundedYears: readonly YearRow[];
  readonly phaseFactor: number;
  /** unrounded floats in cents; rounded once when shown */
  readonly monthlyCents: number;
  readonly depotCents: number;
  readonly totalCents: number;
}

// components: the plan is derived and read-only; the fund list is a module import, not a prop
interface YearTableProps {
  readonly plan: Plan;
}
interface FundTableProps {
  readonly fundList: readonly Fund[];
  /** fund year → the projection shown for it, in cents (override value when present) */
  readonly projections: ReadonlyMap<number, number>;
  /** raw texts as typed, never reformatted; parsed values are derived, not stored */
  readonly overrides: ReadonlyMap<number, Partial<Record<'nav' | 'ytm', string>>>;
  /** UX owns the label/`aria-describedby` wiring; the component only reports the typed text */
  readonly onOverrideChange: (field: 'nav' | 'ytm', year: number, raw: string) => void;
}
```

### Data flow and state ownership

`PlanCalculator` holds only the raw field texts, the direction (`depot` or `payout`), the tax
checkbox, the `edited` flag (avd's pattern) and the override texts, keyed by fund year:
`overrides: Map<number, Partial<Record<'nav' | 'ytm', string>>>`. **The override state lives here,
in `PlanCalculator`**, because the calculation needs it and `FundTable` must stay presentational:
`FundTable` receives `overrides` plus `onOverrideChange(field, year, raw)` and stores nothing; the
handler writes into `PlanCalculator`'s state (a small `useCallback` updater), and parsed values and
the "Wert vom Nutzer eingegeben" marker are derived in the same `useMemo`, never stored (C3). The
override text is parsed by `parseInputs` with the same rules as the amount fields (`'abc'` or a
value out of range in a row shows that row's error and keeps the last valid parsed value for the
calculation only after the field becomes valid again; an empty override cell falls back to the data
file value and shows no marker). Everything else is derived in one `useMemo`: `parseInputs` →
`Tax` (with `rateBp` 0 and no `empty` error while the checkbox is off) + `Phase` → `phaseFactor` →
`payoutFromDepotCents` or `depotFromPayoutCents` → `yearRows` → components. No debounce is needed
(all synchronous); the live region carries the answer figure.

Error handling: no I/O, no async, so no timeouts (`C2` `n.a.`); the only failure is invalid input
(`parseInputs` → per-field error, result area replaced by the error callout). `phaseFactor` is
total for every parsed input: it returns 0 when no phase year has a funding fund, and the UI shows
"no result possible" rather than a division by zero — the developer keeps that branch.

### Risks and mitigations

1. **Round trip at the display boundary**: `F` is about 55, so feeding the _shown_ cent value back
   amplifies the rounding (181,41 EUR back gives 10.000,27 EUR, 27 cents). AC3's one-cent claim
   holds on the unrounded model values; the test must feed the internal value, not the displayed
   text. Stated in the test set so the tester does not measure the wrong thing.
2. **Day count, time zone and the German date input**: compute `d` from `Date.UTC(y, m − 1, d)`
   only; `new Date('...')` is local time and can shift `d` by one day, which is already a cent. The
   parser must validate the day against the month (`29.2.2027` is not a date), and the tester's
   hand oracles are recomputed in the scratchpad (memory rule), listing the spans 365 and 731 days.
   `formatDate` must render the asOf from the file's ISO date, never a hand-typed string, so AC5's
   "the shown asOf equals the data file's asOf" cannot be satisfied by a copy.
3. **Wrong projection horizon**: `avgMaturity` is data, not the horizon; the horizon is 31 December
   of the fund's maturity year (hak's rule). If a tester uses `avgMaturity` the oracles differ.
4. **Negative gain**: base `max(0, gain)` keeps AC4 true for the fixture's positive gains; the
   override path can make a gain negative, so the developer keeps the `max(0, …)` branch (unit case).
5. **AC6 measurement**: the e2e runs on the dev server, whose requests are the app's own files;
   the data file is bundled (no fetch), so every request URL must be same-origin. The guest sign-in
   fake writes nothing; the storage probe must run after a full interaction, not only on load.
6. **P11**: no test asserts padding, radius or equal column heights; the e2e tests assert the label
   text, its accessibility association, the asOf string and the missing-year line.

### Implementation plan

1. `logic/fund.ts` + `data/fund-list.json` (fixture values above), `tsconfig.app.json`
   `resolveJsonModule`.
2. `logic/projection.ts` (the convention of ADR 0012) + test; `logic/phase.ts` (the closed form,
   round trip first) + test; `logic/parseInputs.ts` + test; `logic/format.ts`.
3. Components: `PhaseForm`, `FundTable` (projection label + asOf + override marker), `YearTable`
   (missing year line), `ResultSummary` (figures, live region), `PlanCalculator`, CSS Modules.
4. `main.tsx` renders `PlanCalculator`, `Content.*` deleted, `playwright.config.ts` probe.
5. `e2e/laz.spec.ts`; `npm run verify -w apps/laz` and `npm run test:e2e -w apps/laz` green.

### Minimal test set (7 tests: 4 unit, 3 e2e; one test per AC, parsing branches per T5)

Hand oracles for the projection (unit, explicit inputs, so no calendar arithmetic needed):

- AC1 (`projection.test.ts`): `asOf` 2026-12-31, liquidation 2030-12-31 (`d` = 1461), NAV 40,00 EUR:
  YTM 0 % → exactly 40,00 EUR; 2 % → 43,2996 → `43,30 EUR`; 4 % → 46,7994 → `46,80 EUR`; strict
  increase 40,00 < 43,30 < 46,80; `asOf` = liquidation (`d` = 0) → exactly 40,00 EUR.
- AC4 (`projection.test.ts`, one test): hand case `d` = 365, NAV 10,00 EUR, YTM 40,00 % →
  pre-tax 14,00 EUR (gain 4,00 EUR): `r = 0 %` → 14,00 EUR (equals the pre-tax result exactly),
  `r = 100 %` → 10,00 EUR (NAV, no gain), `r = 25 %` → 13,00 EUR (NAV + 3,00 EUR), tax off again →
  14,00 EUR. Plus the fixture row 2030: 47,2752 → 45,9564 → `45,96 EUR`; and the negative-gain
  branch (`max(0, gain)`) with an override.
- AC3 (`phase.test.ts`, unit): round trip on the three depots 0,00 EUR, 10.000,00 EUR and the
  largest the list covers, 200.000,00 EUR, on the **unrounded** internal values:
  10.000,00 → 181,4051 EUR/month → back 10.000,00 (0 cents); 200.000,00 → 362810,2393 cents →
  `3628,10 EUR` → back 200.000,00 (0 cents); asserted within one cent at the model level, plus one
  check that the shown figure equals the internal value rounded once.
- AC2 (`e2e/laz.spec.ts`, the visible behaviour): example phase, tax off, depot 10.000,00 EUR →
  2028 shown as missing with no amount, 2029–2034 each naming the funding fund (liquidated
  December 2028–2033), 2034 shown with 3 months, total 11.428,52 EUR over the 6 funded years;
  plus the N = 1 case the design rules need: phase 1.1.2030 – 31.1.2030 (first and last year are
  the same year, one month) funded by the fund liquidated December 2029.
- AC5 (`e2e/laz.spec.ts`): the projection label text is present, is the figure's accessible
  description (`toHaveAccessibleDescription`), names YTM and NAV and shows the asOf equal to the
  data file's asOf (`31.12.2026`); an overridden value carries the user-override marker and the
  figure changes.
- AC6 (`e2e/laz.spec.ts`): during one guest session every request URL is same-origin (the app's
  own bundle and static files, no data request), `localStorage`/`sessionStorage`/`IndexedDB` stay
  empty and no cookie is set, and a result changes only after an input change.
- Parsing branches (`parseInputs.test.ts`, T5, no AC): near misses — `''`, `'  '`, `'abc'`,
  `'1e2'`, `'0x1A'`, `'Infinity'`, `'NaN'`, `'12abc'`, `'1.234,56'`, `'9,999'`, `'+5'`, `'5 5'`,
  `'150 €'`, `'5,'`, `',5'`, `'-0'`, U+2212, dot as decimal separator, `endMonth` before
  `startMonth`, both range bounds for depot (0 / 200.000,00 / above) and rate (0 % / 50 % / above),
  both range bounds for the monthly target (0,00 / 10.000,00 / above, since the field now has an
  upper bound); German dates as real branches: `1.1.2028` and `01.01.2028` accepted,
  `' 31.3.2034 '` accepted, `31.13.2028` and `29.2.2027` rejected as `format` (month/day outside
  the calendar), `29.2.2028` accepted (leap year), `1.1.2028` and `31.12.2034` as the range bounds,
  `31.12.2026` before the phase range rejected; and the conditional-required branch: rate text
  `'abc'` with the tax checkbox **off** produces no error and `rateBp = 0` (the result equals the
  pre-tax result), the same text with the checkbox **on** produces `format`, and an empty rate with
  the checkbox on produces `empty`. Test count stays 7 (4 unit + 3 e2e); these are cases inside the
  existing parsing test, not new tests. No test asserts a design value (P11).

No component tests. Existing `src/tokens.test.ts` runs unchanged unless UX adds app tokens.

### Alignment with UX

UX owns labels, hints, error wording, the missing-year sentence (open question 3), the copy of the
projection label, layout and focus. Fixed by this design: the projection label must be the
figure's accessible description (AC5), the asOf is shown as a German date, the fund table and the
year table are `table`s looked up by column header, the live region is the answer figure, no field
is disabled, and the form's accessible name is the sign-in probe. German copy and German number
format throughout (like the `avd` stories).

ADRs: [0012](../adr/0012-laz-ibonds-projection-convention-and-round-trip.md) and
[0013](../adr/0013-laz-committed-fund-list-data-file.md) — app ADRs, numbers are global
(`apps/laz/docs/adr/`, next free number after platform 0011).

## Implementation notes

_developer: what was built, deviations from the design and why._

Built as designed: the slice `apps/laz/src/features/plan/` (`data/fund-list.json`,
`logic/fund.ts`, `projection.ts`, `phase.ts`, `parseInputs.ts`, `format.ts`, components, CSS
Modules), `main.tsx` renders `PlanCalculator`, `Content.*` deleted, `playwright.config.ts` probe
is `{ role: 'form', name: 'Eingaben' }`, `tsconfig.app.json` has `resolveJsonModule`.
`tokens.css` and `tokens.test.ts` unchanged (no new token). No network call, no storage write.

Unit tests (4 files, 8 tests): AC1, AC4, AC3, parsing branches; every hand-oracle figure in the
design reproduces against the code, exactly: day counts 731/1096/1461/1826/2192/2557/2922,
payouts 39,5373 / 43,0785 / 47,2752 / 52,2631 / 58,2172 / 65,3371 / 73,8925, F = 55,125236
(tax off) and 56,844419 (r 25 %), 181,41 €/175,92 €, total 11.428,52 €, 2034 = 544,22 €,
AC1 40,00/43,30/46,80 and `d = 0` → 40,00, AC4 14,00/10,00/13,00 and the fixture row 45,96 €,
AC3 round trips exact (0 cents) with the largest payout 3.628,10 €.

Deviations (none changes an AC):

- Components sit directly in `features/plan/`, no `components/` subfolder, as in `avd`.
- `logic/fields.ts` owns the month key helpers (`monthKey`/`monthParts`/`monthKeyOf`) and the
  override range specs, so the parser and `phase.ts` share them; `format.ts` additionally exports
  `formatMonth` (used by the caption and the `endBeforeStart` error).
- The AC4 25 % case asserts `toBeCloseTo(1300, 6)` plus the shown `13,00 €`, because 1300 cents is
  not exactly representable in a float (1299.9999999999998); the hand oracle itself is unchanged.
- The parsing test's `endBeforeStart` case uses phase start `1.1.2034` / end `31.12.2033`, since
  `31.3.2034` is after the start and produces no error; `parseInputs` returns the errors whenever
  any field is invalid, so the cross-field branch is reachable on its own.
- The data file carries `isin`, `name`, `avgMaturity`, `sharesOutstanding` (display only, fixture
  placeholders); the real ISINs of hak's positions are still open (open question 1).
- `buildPlan` uses `payoutFromDepotCents`/`depotFromPayoutCents`, so a phase with no funding year
  never divides by zero; the UI shows "no result possible" instead.

Open points: `e2e/laz.spec.ts` (AC2/AC5/AC6) is the tester's job and is not written here; no
component tests. `npm run verify -w apps/laz` is green (4 test files, 8 tests);
`npm run test:e2e -w apps/laz` ran once: 41 passed, all platform specs (the sign-in probe passes
against the new form), no earlier-story spec failed.

Fixed in round 1 findings: `formatMonth` no longer invents a day - it names the month with its
year (`Januar 2028`), so the year-table caption reads `Auszahlungsphase Januar 2028 – März 2034`
for the example phase and the `endBeforeStart` error reads `Phase Ende (Monat): muss nach dem
Beginn liegen (Januar 2034). Erlaubt: ein Monat ab dem Beginn.` for `1.1.2034` / `31.12.2033`;
the tester pins these two strings. Removed `formatWholeEuro`, `formatPercent`, the never-passed
`describedBy` prop in `TextField.tsx` and the unused `.legend` rule in `PhaseForm.module.css`.
`payoutFactor` is now `ρ − r × max(0, ρ − 1)`, i.e. `payout = pre-tax − r × max(0, gain)`: equal
for a positive gain, AC4's r = 0 % and 100 % cases unchanged, and a negative gain is no longer
lifted to the NAV at r = 0 % (the negative-gain unit case now asserts the taxed figure equals the
pre-tax one, `36,50 €`); hand oracles unchanged. Findings 1, 2 and 4 (index row, prettier on the
story, app README) are the docs step and were not touched. Finding 6 (round 1): `asOf` is now
file-level (ADR 0013), so `data/fund-list.json` has one top-level `asOf` and no `asOf` per fund;
`logic/fund.ts` exports the `FundList` shape with `FUND_LIST_AS_OF`, which the projection label and
the projection functions use; the fixture date 2026-12-31 and every hand oracle are unchanged.

## Test report

_tester: AC → test mapping, results, defects found._

| AC  | Test(s)                                                                                                                                                                                        | Result |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| AC1 | `apps/laz/src/features/plan/logic/projection.test.ts` › `projection (ADR 0012)` › "AC1: YTM 0 % and asOf at the liquidation date give exactly the NAV, and YTM 0 % / 2 % / 4 % never decrease" | PASS   |
| AC2 | `apps/laz/e2e/laz.spec.ts` › "AC2: the year overview reports the missing 2028 with no amount and funds each year with the December liquidation of the year before"                             | PASS   |
| AC3 | `apps/laz/src/features/plan/logic/phase.test.ts` › `phase (ADR 0012, the one closed form)` › "AC3: the round trip depot → monthly payout → depot differs by at most one cent"                  | PASS   |
| AC4 | `apps/laz/src/features/plan/logic/projection.test.ts` › "AC4: tax on the gain only, base max(0, gain), measured at r = 0 %, 100 % and 25 %"                                                    | PASS   |
| AC5 | `apps/laz/e2e/laz.spec.ts` › "AC5: the projection label is the accessible description of the figures, names the asOf from the data file, and an override is marked"                            | PASS   |
| AC6 | `apps/laz/e2e/laz.spec.ts` › "AC6: a guest session makes no request of its own, writes nothing to storage, and changes the result only on input"                                               | PASS   |

Supporting test (no AC, per the test set): `parseInputs.test.ts` › "T5: the parsing branches — near misses, bounds, German dates, and the conditional rate" — PASS.

Tests added by the tester: 3 (the e2e AC tests, `e2e/laz.spec.ts`); the 4 unit tests were the developer's and are verified here as the proof of AC1/AC3/AC4. No unit
test of an AC was duplicated at the e2e level (proportionality rule). AC3 is measured on the unrounded internal values, as the test set requires (risk 1).

### Counts, as printed

- vitest `@swfactory/platform`: `Test Files  15 passed (15)`, `Tests  154 passed (154)`
- vitest `@swfactory/laz`: `Test Files  4 passed (4)`, `Tests  8 passed (8)`
- Playwright, whole run (`npm run test:e2e -w apps/laz`): `Running 44 tests using 16 workers` → `44 passed (5.4s)`, no failures, no retries.
  Project `chromium` (the app): 3 tests → `3 passed (4.6s)`. Project `platform` (unchanged sign-in specs): 41 tests, all passed against the new form through the
  `playwright.config.ts` probe `{ role: 'form', name: 'Eingaben' }`.
- `npm run verify -w apps/laz` green: typecheck both workspaces, lint, `format:check`, build, `check-dist: ok laz (standard, 4 files)`.

### Probes (throwaway specs, run then deleted)

- Keyboard-only sign-in, Tab order, Enter inside the form: Enter does not reload the page, focus stays in the field being edited — checked, OK.
- Empty, long and special input (`''`, `'  '`, `1e2`, `0x1A`, `Infinity`, `150 €`, `-0`, U+2212, `31.13.2028`, `29.2.2027`, `29.2.2028`): error texts appear only after
  the first edit, the result area shows `Kein Ergebnis möglich. Bitte die markierten Felder korrigieren.` after the first edit and
  `Noch kein Ergebnis: bitte Phase und Betrag ausfüllen.` before it — checked, OK.
- Double clicks (result area, amount field) and double-toggle of the tax checkbox: the figures return to the same values, no storage write — checked, OK.
- The live region is empty before the first edit (UX §4) — checked, OK (asserted in the AC6 test).

### Non-vacuity evidence

Mutations were applied to `apps/laz/src/features/plan/` and reverted from a backup copy made before any mutation (`backup024`, never a git checkout); after the runs the
backup and the working tree are identical (29 files, 0 differ). Each new assertion failed once:

- AC1: `fund.ts` liquidation date off by one (M1) → `projection.test.ts` AC1 fails.
- AC4: tax taken on the base not the gain (M2), `max(0, gain)` branch removed (M3) → `projection.test.ts` AC4 fails.
- AC3: round trip inverted (M6), last partial year off by one (M4) → `phase.test.ts` AC3 fails.
- Parsing branches: calendar-day branch removed (`31.13.2028` accepted, M7) and `-0` not normalised (M8) → `parseInputs.test.ts` T5 fails.
- `format.ts` locale `de-DE` → `en-US` (M5) → the figure assertions fail in both the unit tests and the three e2e tests.
- AC2: the missing year gets the first fund instead of `null` (M12) → the 2028 row assertion fails; caption start and end swapped (M14) → the caption-period assertion
  fails; missing year counted in the sum and given an amount (M13c) → the 2034 figure and the total fail. M13 and M13b alone are not observable from the UI (a missing
  year renders `–`, and the sum uses only `fundedYears`), so they are reported as the combined mutant.
- AC5: marker never set (M10b) and marker on every cell (M11) → `toHaveAccessibleDescription` fails; `asOf` shown as the month start (M9) → the label assertion fails;
  asOf from the data file and the override figures (`47,28 €` → `45,02 €`) fail with M1. The negative assertion "the same value as the data file is not marked" is not
  vacuous: marker on any parsed value (M10) fails it.
- AC6: injected foreign request (M17) and injected `localStorage.setItem` (M16) → the request-list and storage assertions fail; live text changed without an input (M15)
  → the "result changes only on input" assertion fails; the second typed value ignored by the handler (M18) → the `211,10 €` / `13.299,46 €` live-region assertion fails.

### Defects

- Low (copy/UX, round 1, finding 3): the year-table caption showed `Jahresübersicht 01.01.2028 – 01.03.2034` for the example phase, so the phase's last day
  (`31.3.2034`) appeared as the first day of its month, a day the phase model does not have. Repro: phase start `01.01.2028`, phase end `31.03.2034`. Fixed by the developer:
  `formatMonth` now renders the month name without a day, so the caption reads `Auszahlungsphase Januar 2028 – März 2034` and the `endBeforeStart` error reads
  `Phase Ende (Monat): muss nach dem Beginn liegen (Januar 2034). Erlaubt: ein Monat ab dem Beginn.` — the probe on the code produced exactly these two strings. The assertion
  now pins the two phase months in start–end order (see round 2), which is the AC's claim; the wording itself remains a UX choice.

### Round 2 (reviewer findings 8, 9, 3; tester's files only)

Three test changes (two files, the tester's only):

- `apps/laz/src/features/plan/logic/phase.test.ts` › "AC3: the round trip depot → monthly payout → depot differs by at most one cent" — the vacuous
  `formatEuro(Math.round(x)) === formatEuro(x)` (true for every `x`) is replaced by hand-value checks, and the tax parameter AC3 names is now measured: the round trip runs for
  tax off and tax on at 25 %, on the three depots 0,00 / 10.000,00 / 200.000,00 EUR. Hand values: `F = 55,125236` (tax off) and `F = 56,844419` (tax on, r 25 %), so
  10.000,00 EUR gives 18140,512 cents (`181,41 €`) and 17591,876 cents (`175,92 €`); the largest depot the list covers gives `3.628,10 €`. The rounding check is now: the internal
  value is not already a whole cent, and feeding the SHOWN figure back misses the depot by more than one cent — 26,9 cents (tax off) and 7,0 cents (tax on), which is risk 1.
- `apps/laz/e2e/laz.spec.ts` › AC6 — the `fund-list.json` request assertion is dropped (it holds only on the dev server; the values are bundled, so a built site makes no such
  request, finding 9), and the dev-server condition is stated in the test. The mode-independent assertion that replaces it: the rows the fund table shows equal the years of the
  repo data file read from disk by the test.
- `apps/laz/e2e/laz.spec.ts` › AC2 — the caption assertion pins the two phase months in start–end order (`Januar 2028` before `März 2034`, from the test's own month-name oracle),
  not the printed days, as finding 3 asks.

Round 2 counts, as printed: vitest `@swfactory/platform` `Test Files  15 passed (15)`, `Tests  154 passed (154)`; vitest `@swfactory/laz` `Test Files  4 passed (4)`,
`Tests  8 passed (8)`; Playwright `Running 44 tests using 16 workers` → `44 passed (5.5s)`, no failures, no retries; `check-dist: ok laz (standard, 4 files)`.

Round 2 non-vacuity (mutants applied to the production code, reverted from the backup copy `backup024r2`, never git; backup identical to the tree afterwards, 19 files, 0 differ):

- M19 rounding moved inside the model (`depotCents / factor` → `Math.round(depotCents / factor)`) → AC3 fails: `expected 26.903 to be less than or equal to 1`.
- M20 tax ignored when the checkbox is on → AC3 fails: `expected '181,41 €' to be '175,92 €'` (the tax case, the hand value above).
- M21 `FundTable` renders six rows instead of the data file → the AC6 data-file assertion fails (`toEqual` deep equality).
- M22 `formatMonth` renders the day again → the AC2 caption assertion fails (`caption names the phase start month`, expected substring `Januar 2028`).
- M14 caption start and end swapped → the AC2 order assertion fails (`caption lists start month before end month`).

#### asOf alignment (finding 6, file level; tester's files only)

`e2e/laz.helpers.ts`: `DataFileFund` no longer carries `asOf` (ADR 0013, `asOf` is one value for the whole file); the helper reads the top level (`dataFile()` → `dataFileAsOf()`,
`dataFileFunds()` is the funds array). AC5 now compares the date read back from the page with the file-level `asOf`, and pins the hand value: the committed file's `asOf` is
`2026-12-31`, so the displayed string stays `Stand der Daten: 31.12.2026.` (the accessible description of every projection figure still has to equal the full label).

Non-vacuity of the asOf assertion (both from backup copies, reverted after, never git):

- M23 `data/fund-list.json` `asOf` → `2027-12-31` in a copy: `committed data file asOf (hand value)` fails (expected `2026-12-31`). Note the limit: the file mutation alone cannot
  kill the comparison, because the app and the test read the same file — both sides move together, so the comparison needs a code-side mutant.
- M24 `FUND_LIST_AS_OF` taken from `funds[0].avgMaturity` instead of `FUND_LIST_FILE.asOf` → `shown date equals the file-level asOf` fails: shown `30.06.2028`, expected
  `31.12.2026` (`germanDate(dataFileAsOf())`).

As printed for this round: vitest `@swfactory/platform` `Test Files  15 passed (15)`, `Tests  154 passed (154)`; vitest `@swfactory/laz` `Test Files  4 passed (4)`,
`Tests  8 passed (8)`; Playwright `Running 44 tests using 16 workers` → `44 passed (5.7s)`, no failures, no retries; `check-dist: ok laz (standard, 4 files)`.

Verdict: all six ACs pass; no defect breaks an AC.

### Local Windows vs Ubuntu CI expectation

No pixel, font or layout comparison is asserted here, so there is no visual difference to check on CI. The one platform-sensitive part is the currency separator: the unit
tests hard-code U+00A0 in the expected strings, while the e2e figures are matched with `\s`, which also accepts the narrow no-break space (U+202F) an ICU build may
produce, so CI expectations are neither changed nor weakened. The live-region assertions wait 900 ms past the 700 ms debounce and are the only timing-sensitive part of
the suite; that margin is unchanged for CI.

Verdict: all six ACs pass; no defect breaks an AC.

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

**Round 1, reviewer 2026-11-13. Verdict: APPROVED. Checklist version: 2**

| Item | Result | Note                                                                                                                                                                                                                                                                                                                                                                          |
| ---- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1   | pass   | AC1 `logic/projection.ts` + `projection.test.ts`; AC2 `logic/phase.ts` `fundingFund`/`yearRows` + `e2e/laz.spec.ts`; AC3 `payoutFromDepotCents`/`depotFromPayoutCents` + `phase.test.ts`; AC4 `payoutFactor` tax branch + `projection.test.ts`; AC5 `FundTable.tsx` label and marker + `fieldCopy.ts` + `ResultSummary.tsx`; AC6 `e2e/laz.spec.ts` request and storage probes |
| C2   | n.a.   | no network call and no pending UI; only the live-region debounce timer                                                                                                                                                                                                                                                                                                        |
| C3   | pass   | plan, errors, markers derived in one `useMemo`, not stored; the override handler is a stable `useCallback`; `useSettledValue` clears its timer on change and on unmount                                                                                                                                                                                                       |
| C4   | n.a.   | no render loop or imperative controller                                                                                                                                                                                                                                                                                                                                       |
| C5   | n.a.   | no reducer                                                                                                                                                                                                                                                                                                                                                                    |
| C6   | pass   | the only failure is invalid input, which ends in a visible per-field error and the no-result callout; no I/O, no swallowed catch                                                                                                                                                                                                                                              |
| S1   | pass   | typed text reaches the DOM only as React text; no `dangerouslySetInnerHTML`, no URL or query sink                                                                                                                                                                                                                                                                             |
| S2   | n.a.   | no config, env or auth code in the diff                                                                                                                                                                                                                                                                                                                                       |
| S3   | n.a.   | `package.json` dependencies unchanged, no new dependency                                                                                                                                                                                                                                                                                                                      |
| S4   | n.a.   | no dev-only code; `dist-check.json` untouched, `check:dist: ok laz (standard, 4 files)`                                                                                                                                                                                                                                                                                       |
| S5   | n.a.   | no script or template touched                                                                                                                                                                                                                                                                                                                                                 |
| T1   | fail   | finding 2; everything else re-run green: 8 laz unit tests, 44 e2e tests, typecheck, lint, build, `check:dist`                                                                                                                                                                                                                                                                 |
| T2   | pass   | one test per AC at the cheapest level, no AC tested at two levels; parsing branches inside the single T5 test                                                                                                                                                                                                                                                                 |
| T3   | fail   | finding 8; the mutation probe covers every other assertion, including the AC5 "same value as the file is not marked" negative case                                                                                                                                                                                                                                            |
| T4   | pass   | tests named after ACs; the single Tab press is a no-change check, not a counted sequence; tables looked up by header, not position                                                                                                                                                                                                                                            |
| T5   | pass   | parser branches have cases including the conditional rate; `max(0, gain)` and the zero-factor branch each have a case                                                                                                                                                                                                                                                         |
| K1   | fail   | finding 5; the recorded deviations match the code, but the focusable `FundTable` wrapper (extra tab stop, `fundScrollerLabel` copy) comes from UX §5 and is not recorded                                                                                                                                                                                                      |
| K2   | pass   | no `any`, no `!`, optional props declared with `?:` plus `undefined`, named exports, one component per file, tests colocated                                                                                                                                                                                                                                                  |
| K3   | pass   | tokens only, `transition` uses `var(--duration)`, forced-colours blocks present; the raw 10 px callout padding matches avd's existing pattern                                                                                                                                                                                                                                 |
| K4   | n.a.   | no platform or factory file changed                                                                                                                                                                                                                                                                                                                                           |
| K6   | fail   | finding 1                                                                                                                                                                                                                                                                                                                                                                     |
| K7   | pass   | every answer and correction is in the Decision log, append only                                                                                                                                                                                                                                                                                                               |
| K8   | fail   | finding 4                                                                                                                                                                                                                                                                                                                                                                     |
| K9   | fail   | finding 2 (the source files themselves pass prettier)                                                                                                                                                                                                                                                                                                                         |
| K10  | pass   | workspace prettier uses `--ignore-path ../../.prettierignore`; `tsconfig.app.json` includes the platform's `vite-env.d.ts`                                                                                                                                                                                                                                                    |
| K11  | n.a.   | no env variable added                                                                                                                                                                                                                                                                                                                                                         |
| A1   | pass   | every control has a real label (override cells use the visually hidden label), native radios and checkbox, focus stays in the edited field, focusable scrollers                                                                                                                                                                                                               |
| A2   | pass   | the missing-year, override and invalid states are carried by text plus icon or bar; forced-colours blocks present; the pairs in UX §5 are the pairs the modules paint                                                                                                                                                                                                         |
| A3   | pass   | the live region mounts empty before its content; the platform's global `prefers-reduced-motion` block covers the one transition                                                                                                                                                                                                                                               |
| A4   | n.a.   | no render loop or canvas                                                                                                                                                                                                                                                                                                                                                      |

Findings:

1. `[minor] docs/backlog/README.md:32` — the index row says `designed` while the story frontmatter is `in-review`, so `npm run check:structure` is red — set the index row to the story status at the docs step.

2. `[minor] apps/laz/docs/backlog/024-laz-ibonds-phase-plan.md:480,641` — the story file itself fails `prettier --check`, so `npm run verify -w apps/laz` is red at review time (the test report table needs padding, the `FundTableProps` block exceeds the line width); the tester's "verify green" was measured before the report was written — run prettier on the story at the docs step.

3. `[minor] apps/laz/src/features/plan/logic/format.ts:42` (used by `YearTable.tsx:24`) — `formatMonth` always renders the first day of a month, so the caption states the phase end as `01.03.2034` although the user typed `31.03.2034`; `fieldCopy.ts:81` prints the same first-day date in the `endBeforeStart` error. Not an AC failure, but it is user-visible wording that reports a date the user did not enter, so fix it in this story: name the two months, or render the end as the phase's last day. The fix needs `e2e/laz.spec.ts:51` changed too, because that assertion pins exactly this wording while its comment says the wording is not asserted — assert the two phase months in start–end order instead of the printed days.

4. `[minor] apps/laz/README.md:4` — still says the app shows its content through `src/Content.tsx`, which this story deletes — update the app README (and the CHANGELOG) at the docs step.

5. `[nit] apps/laz/src/features/plan/logic/format.ts:23,28` — `formatWholeEuro` and `formatPercent` are never used (the copy hard-codes its ranges, so the Implementation notes' claim that they are "used by the copy" is wrong); `TextField.tsx:18` `describedBy` is never passed by any call site; `PhaseForm.module.css:19` `.legend` is never applied (the legend has no class) — remove them.

6. `[nit] apps/laz/src/features/plan/PlanCalculator.tsx:195` — the projection label shows only `FUND_LIST[0]?.asOf`, while ADR 0013 stores `asOf` per fund, so a refreshed file with different asOf dates shows one date for every row — declare the asOf file-level in ADR 0013 or show each row's own asOf.

7. `[nit] apps/laz/src/features/plan/logic/projection.ts:33` — `max(0, gain)` makes tax ON at 0 % return the NAV for a negative gain, i.e. more than the pre-tax projection, so AC4's "r = 0 % equals the pre-tax result exactly" and "turning tax off gives the same numbers" do not hold on the override path; the ADR documents the choice, so either say plainly that tax can never lower the result on that branch or clamp to the pre-tax value.

8. `[nit] apps/laz/src/features/plan/logic/phase.test.ts:24,27` — `formatEuro(Math.round(x))` equals `formatEuro(x)` for any x, so that assertion cannot fail; and the round trip is measured only with tax off although AC3 names the tax parameter — add the 25 % case (exact by construction).

9. `[nit] apps/laz/e2e/laz.spec.ts:173` — asserts that a `fund-list.json` request happens, which is true only because the dev server serves the JSON as its own module request; ADR 0013 says the values are in the bundle, so the assertion fails against a built site — drop it or state the dev-server condition.

**Round 2, reviewer 2026-11-13. Verdict: APPROVED. Checklist version: 2** (the round-1 findings above stand; this round only records their state against the current tree. Re-run green: `verify -w apps/laz`, `test:e2e -w apps/laz` 44 passed, `check:structure` ok, `check:dist: ok laz (standard, 4 files)`.)

1. resolved — `docs/backlog/README.md:32` now reads `in-review`, which matches the frontmatter, and `npm run check:structure` is green.

2. resolved as measured here — `npx prettier --check` on the story is green now, so `verify -w apps/laz` is green at review time; the docs step still runs prettier over the whole app.

3. resolved — `format.ts:28` `formatMonth` renders the month name with its year and no day, so the caption reads `Auszahlungsphase Januar 2028 – März 2034` and `fieldCopy.ts:81` prints `…muss nach dem Beginn liegen (Januar 2034)…` for `1.1.2034` / `31.12.2033`. `e2e/laz.spec.ts:50-78` now asserts the two phase months in start–end order from its own month-name oracle, plus that no `TT.MM.JJJJ` appears in the caption, so the contradiction between the comment and the assertion is gone, and M22/M14 show the assertions bite.

4. open — `apps/laz/README.md:4` still names `src/Content.tsx` although this story deletes it; the app README and the CHANGELOG are the docs step.

5. resolved for the nits (`formatWholeEuro`, `formatPercent`, the `describedBy` prop, the `.legend` rule are gone); open for the K1 part: the focusable `FundTable` wrapper and its `Fondsplan, horizontal scrollbar` label are UX §5 wording that is not in UX §2's exact copy and still not recorded as a deviation in the Implementation notes.

6. resolved — ADR 0013 now states `asOf` as one value for the whole file, `fund.ts:24-36` declares `FundList` with `FUND_LIST_AS_OF`, `PlanCalculator.tsx:195` passes it, and `data/fund-list.json` has a single top-level `asOf` and none per fund. The design's file list still shows `formatPercent` (line 405), which is now gone — record it at the docs step.

7. resolved — `projection.ts:34-38` is `ρ − r × max(0, ρ − 1)`, so tax ON at 0 % equals the pre-tax projection on the override path; `projection.test.ts:77-88` asserts that equality (hand value `36,50 €`) and the `max(0, gain)` branch is still covered by its own case. Only the ADR's closed form at `0012…md:44` is written without the clamp and needs the `max(0, ·)` added at the docs step, so the ADR does not contradict the code.

8. resolved — `phase.test.ts:24-50`: the vacuous `formatEuro(Math.round(x))` comparison is replaced by hand values and by checking that the internal value is not already a whole cent and that feeding the shown figure back misses the depot by 26,9 / 7,0 cents; the round trip now runs with tax off and tax on at 25 %, so the tax parameter AC3 names is measured. M19/M20 show it fails on the mutants.

9. resolved — the dev-server-only `fund-list.json` request assertion is gone (`e2e/laz.spec.ts:216-221` says so plainly); the mode-independent assertion that replaces it compares the shown fund rows with the data file read from disk, which M21 kills.

Suggested for CLAUDE.md: a formatter that takes a month must not print a day the user did not enter; a test comment that says a wording is not asserted must not assert it. Run `prettier --check` on the story after the Test report is written, and keep the backlog index row equal to the story's frontmatter status.

## Explanation

The app calculates a payout phase for a retirement time account in two directions.
One direction: a depot at the start, and what monthly payout it can fund over the phase.
The other: a wanted monthly payout, and the depot that would be needed for it.
Both directions use the same calculation, so a result fed back gives the starting value again.
Money from a fund is only available from the month that fund is liquidated, in December.
A phase year is funded by the fund liquidated in December of the year before it.
If a year has no fund, the app says so and does not invent an amount for it.
The payout per share is a projection from the current value and the expected yield, not a market value.
That projection compounds annually over the actual days until the fund's end of year.
Tax is optional, applied to the gain only at liquidation, with a rate the user sets.
The fund values come from a committed data file with one date; nothing is fetched online.
The app stores nothing and sends no data anywhere, and it works for a guest without sign-in.
Risk: the projection is an estimate, so the figures change when the data file is refreshed.
Not verified: the real market values of the actual funds, and the app on a real device.
Not verified either: the app on the CI runner, which only runs when the branch is pushed._

## Retrospective

_Orchestrator, gate 2. What went wrong, root cause, proposals; the Cost table is at the end.

1. **Three runs ended without a reply** (developer round 1, tester round 1, reviewer round 1): the reply exceeded the output limit because the agent's Output section asks for a full checklist and tables. Cost: three re-runs of work that was already on disk. Root cause: the agents write the long content twice — once into the story, once into the reply.
   - **P13** — in `.claude/agents/developer.md`, `tester.md`, `reviewer.md`: the long content goes into the story file only, and the reply is at most 12 lines without tables. This is what the re-runs used, and it worked.
   - **P14** — in the orchestrator's step: when a role returns no reply, read the story section it owns before re-running it, so the work is not done twice. This saved the tester and reviewer re-runs here (only the missing non-vacuity evidence and report had to be added).
2. **Review round 1 spent four of its nine findings on housekeeping** (prettier on the story, the backlog index row, the app README, unused exports). Root cause: prettier and the structure check were not run after the Test report was written, so the reviewer saw a red `verify` at review time. **P15** — run `prettier --check` on the story and `check:structure` before the review step; housekeeping findings should not cost a review round.
3. **Two assertions could not fail** (the reviewer's finding 8): `formatEuro(Math.round(x))` equals `formatEuro(x)` for any x; and an assertion compared the page against the same file the test reads, so editing that file cannot break it. Root cause: the assertion was built from a value the code computes, not from a hand oracle. **P16** — for CLAUDE.md: a test may not compare its subject with the same source it reads; pin a hand value as well, and a negative assertion must be triggered by text that differs from the value already shown (`fill()` with identical text does not fire the change handler).
4. **A test asserted a dev-server-only request** (finding 9), which fails against the built site. Root cause: the AC was measured on the dev server although the data file is bundled. **P17** — for CLAUDE.md: a test that asserts a network request must state the mode it is measured in; against the built site, assert the values, not the request.
5. **The design named exports that nothing called** (`formatPercent`, `formatWholeEuro`), which review deleted, so the design described a function that did not exist (finding 5). **P18** — a design's file list names only exports that a component or the copy actually calls.
6. **UX recorded an accessible name only in the accessibility notes** (the fund-table wrapper, finding K1), so it was not checkable as design copy. **P19** — the UX copy section lists accessible names (`aria-label`, descriptions) as design copy, not only visible text.
7. **A formatter printed a day the user never entered** (`01.03.2034` for a phase ending `31.03.2034`, finding 3). It is wording, not an AC, and only the caption asserted the order of months — so the assertion and its comment contradicted each other. **P20** — a formatter must not print a value the user did not enter; and a test comment that says a wording is not asserted must not assert it.
8. **One process step worked as intended**: the round-trip AC stated that it is measured on unrounded model values before the build, which is why the round trip did not need a re-run (risk 1 in the design was measured by the tester in round 2). No proposal.
9. **Not measured here**: the CI runner (no push), the real market values of hak's actual funds, and the writer script that refreshes the data file, which is a separate story.

### Cost

| Role                        | Round | Model | Tokens       | Tool uses | Duration |
| --------------------------- | ----- | ----- | ------------ | --------- | -------- |
| product-owner               | 1     | n/a   | n/a          | n/a       | n/a      |
| product-owner               | 2     | n/a   | n/a          | n/a       | n/a      |
| architect                   | 1     | n/a   | n/a          | n/a       | n/a      |
| ux-designer                 | 1     | n/a   | n/a          | n/a       | n/a      |
| architect                   | 2     | n/a   | n/a          | n/a       | n/a      |
| developer                   | 1     | n/a   | n/a          | n/a       | n/a      |
| developer                   | 2     | n/a   | n/a          | n/a       | n/a      |
| developer                   | 3     | n/a   | n/a          | n/a       | n/a      |
| tester                      | 1     | n/a   | n/a          | n/a       | n/a      |
| tester                      | 2     | n/a   | n/a          | n/a       | n/a      |
| tester                      | 3     | n/a   | n/a          | n/a       | n/a      |
| tester                      | 4     | n/a   | n/a          | n/a       | n/a      |
| reviewer                    | 1     | n/a   | n/a          | n/a       | n/a      |
| reviewer                    | 2     | n/a   | n/a          | n/a       | n/a      |
| architect                   | 3     | n/a   | n/a          | n/a       | n/a      |
| tech-writer                 | 1     | n/a   | n/a          | n/a       | n/a      |
| ux-designer                 | 2     | n/a   | n/a          | n/a       | n/a      |
| total (measured)            | —     | —     | n/a          | n/a       | n/a      |
| orchestrator (main session) | —     | n/a   | not measured | n/a       | n/a      |

The figures are `n/a` because the harness did not report tokens, tool uses or duration for these runs, so nothing could be copied from a running list; the table records the 17 role runs, not a cost. Three of the 17 runs produced no reply at all and had to be re-run (rows developer 1, tester 1, reviewer 1), which is the cost that P13 addresses: the runs that finished with a capped reply (developer 2, tester 2, reviewer 2) were short.

### Gate 2 outcome

hak approved P13–P20. Applied: P13 in the three role agent files (`developer.md`, `tester.md`, `reviewer.md` — full detail into the story section, reply at most 12 lines), P14 and P15 in the `/feature` skill, P16 in CLAUDE.md (test rules), P17 in CLAUDE.md, P18 in `architect.md`, P19 in `ux-designer.md`, P20 in CLAUDE.md. Two architect and tester memory lines that repeated CLAUDE.md rules were removed from memory.

Manual checks: the CI runner is not run here (no push); hak performs the push himself, so the runner result is his to report. The CI-equivalent run was done locally on Windows (all green, counts above) and reported to hak. Nothing visual was checkable in this story — no animation, no colour, no pixel assertion — so no screenshot check. The real market values of hak's actual funds and the data-file refresh script stay open for the separate devops story._
