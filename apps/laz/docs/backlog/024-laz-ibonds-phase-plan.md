---
id: 024
title: Lebensarbeitszeitkonto iBonds payout phase, both directions (projection)
status: designed # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
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

Fund list (fixture values, `asOf` 2026-12-31 for every fund, so the hand oracle needs no
calendar arithmetic; the developer copies these into the data file):

```json
{
  "funds": [
    { "year": 2028, "navCents": 3800, "ytmBp": 200, "asOf": "2026-12-31" },
    { "year": 2029, "navCents": 4000, "ytmBp": 250, "asOf": "2026-12-31" },
    { "year": 2030, "navCents": 4200, "ytmBp": 300, "asOf": "2026-12-31" },
    { "year": 2031, "navCents": 4400, "ytmBp": 350, "asOf": "2026-12-31" },
    { "year": 2032, "navCents": 4600, "ytmBp": 400, "asOf": "2026-12-31" },
    { "year": 2033, "navCents": 4800, "ytmBp": 450, "asOf": "2026-12-31" },
    { "year": 2034, "navCents": 5000, "ytmBp": 500, "asOf": "2026-12-31" }
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
  `asOf` to the liquidation date (annual compounding, ACT/365 day count, no monthly or simple
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
- `src/features/plan/logic/fund.ts` — the `Fund` type, the typed import of the data file,
  `liquidationDate(fund)` = `31.12.` of its maturity year.
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
- `src/features/plan/logic/format.ts` — `formatEuro` (2 dp), `formatPercent`, `formatDate`, all
  `de-DE`, formatters built once at module level.
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
export interface Fund {
  readonly year: number; // maturity year, the fund list key: 2028..2034
  readonly isin: string;
  readonly name: string;
  readonly navCents: number;
  /** weighted average YTM, basis points (1 % = 100) */
  readonly ytmBp: number;
  /** ISO calendar date YYYY-MM-DD in the data file; the UI renders and accepts it as TT.MM.JJJJ */
  readonly asOf: string;
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
