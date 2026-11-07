---
id: 013
title: Altersvorsorgedepot saving phase with Zulagen (projection calculator)
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: avd # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<name>/docs/backlog)
branch: feature/013-avd-saving-phase-zulagen
supersedes: []
changes: []
superseded-by:
---

# 013 – Altersvorsorgedepot saving phase with Zulagen (projection calculator)

## Original request

> Avd Altervorsorgedepot. Interaktive Berechnung und Anzeige des Altersvorsorgedepots.

## User story

As a person planning my retirement, I want to enter my age, payout start, monthly contribution, number of children, expected return and costs and see the projected value of my Altersvorsorgedepot at payout start, split into own contributions, state Zulagen and returns and shown per year, updated as I type, so that I can understand what the state subsidy and my assumptions contribute.

## Context

- First story of the new app `avd` (title in the app shell: "Altersvorsorgedepot"). Personal planning tool for hak. UI language: German, German number format.
- Scope chosen by hak ("Ja, so schneiden", see Decision log): 013 is the **saving phase with Zulagen** only. Later stories: taxes (Sonderausgabenabzug, Günstigerprüfung; needs income / tax rate), payout phase (Auszahlungsplan to at least age 85, at most 30 % lump sum, monthly pension), comparison with a normal ETF depot, glidepath before payout.
- The app is a calculator with explicit, visible, editable assumptions. It gives no buy/sell or product recommendations; results are model calculations, not advice.
- **Rules of the adopted law used by this story** (source: BT-Drs. 21/4996, Beschlussempfehlung Finanzausschuss 25.03.2026, https://dserver.bundestag.de/btd/21/049/2104996.pdf; passed Bundestag 27.03.2026, Bundesrat 08.05.2026; products from 01.01.2027). Let c = own contribution per year in EUR, k = number of children with Kindergeld:
  - c < 120 EUR per year: no Zulage at all (no Grundzulage, Kinderzulage or Berufseinsteigerbonus).
  - Maximum own contribution c <= 6.840 EUR per year (570 EUR per month); Zulagen do not count towards it.
  - Grundzulage = 0,5 · min(c, 360) + 0,25 · max(0, min(c, 1.800) − 360); maximum 540 EUR per year.
  - Kinderzulage = k · min(c, 300) per year.
  - Berufseinsteigerbonus: 200 EUR once, if the person is under 25 at the start of the contribution year.
  - Zulagen are credited to the depot in the year after the contribution year (the exact date is not fixed by law).
  - Payout start between 65 and 70 (earlier only with an earlier statutory pension; that case is ignored here). Default 65.
  - Standarddepot: effective costs at most 1,0 % per year; no guarantee. The glidepath before payout is not modelled here.
  - Eligibility to receive Zulagen is assumed to be given (stated in the UI note, AC8).
- Calculation convention (settled, Decision log 2026-11-07): contributions at the end of each month; net return per year r_net = (1 + return) · (1 − costs) − 1; monthly growth factor (1 + r_net)^(1/12); the Zulage of year n is credited at the end of January of year n+1; the Zulage of the last year is added to the end value at payout start without further returns.
- Yearly sum: the contribution is entered per month, the Zulage rules apply to c = 12 · monthly contribution. Children are entered as one number "children with Kindergeld" (0 to 10), assumed constant for the whole saving period. The Berufseinsteigerbonus applies once if the entered age is under 25 (start of year 1) and c >= 120, as part of the Zulage of year 1. Year 1 is the year of the entered age. Results are nominal. Table and chart are both visible.
- Allowed input ranges (settled): age 18 to 69 whole years; payout start 65 to 70 whole years and greater than age; monthly contribution 0 to 570 EUR with 2 decimals; children 0 to 10 whole; return −10 % to 20 %; costs 0 % to 1,0 % (Standarddepot cap) with a hint stating the cap; percentages up to 2 decimals.
- Reference example (oracle for AC4, numbers computed by the orchestrator, confirmed by hak): age 57, payout start 65 (8 saving years), 150 EUR per month (c = 1.800), 0 children, return 5 %, costs 0,5 %. Own contributions 14.400 EUR; Grundzulage 540 EUR per year, 4.320 EUR in total; Berufseinsteigerbonus none; returns 3.536,44 EUR and end value 22.256,44 EUR (r_net = 4,475 %; convention above).

## Acceptance criteria

- **AC1:** Given the app is opened, when the page has loaded, then the page shows the title "Altersvorsorgedepot", labelled inputs for age, payout start (age), monthly contribution, number of children, expected return per year in percent and costs per year in percent, each with a visible default (age 40, payout start 65, 150 EUR per month, 0 children, return 5 %, costs 0,5 %), and a result for those defaults is already shown. (changed by [014](014-avd-tax-refund.md), [015](015-avd-reinvest-tax-refund.md))
- **AC2:** Given a valid age and payout start, when the monthly contribution is set to 0, 9,99, 10, 30, 150, 570 EUR (0 children, age 40), then the yearly Zulage shown is 0, 0, 60, 180, 540, 540 EUR respectively (below 120 EUR per year no Zulage at all; Grundzulage per the formula in Context, capped at 540 EUR).
- **AC3:** Given a valid monthly contribution of 25 EUR (c = 300) and 2 children, when age is 24 and when it is 25, then the yearly Zulage shown is 150 + 600 = 750 EUR in both cases and the one-time Berufseinsteigerbonus of 200 EUR is included in the first year's Zulage only for age 24; with 1 child and a monthly contribution of 9,99 EUR no Zulage and no bonus is shown (Kinderzulage = k · min(c, 300); bonus only if c >= 120).
- **AC4:** Given the reference example (age 57, payout start 65, 150 EUR per month, 0 children, 5 % return, 0,5 % costs), when the result is shown, then it displays own contributions 14.400,00 EUR, Zulagen 4.320,00 EUR, returns 3.536,44 EUR and end value 22.256,44 EUR (rounded to cent; convention in Context); own contributions, Zulagen and returns are each shown as a separate figure and their sum equals the end value; entering the same values again always gives the same numbers.
- **AC5:** Given a result is shown, when the user changes any input to another valid value, then the figures, the table and the chart update without a separate submit; a higher cost value never raises the end value (all else equal); a per-year table lists for every saving year the cumulative own contributions, cumulative Zulagen credited, cumulative returns and the balance at year end; a chart shows the balance split into these three parts over the same years and has a text alternative stating the end value and payout start, and the table gives the same data as text. (changed by [014](014-avd-tax-refund.md), [015](015-avd-reinvest-tax-refund.md))
- **AC6:** Given any input, when its value is invalid (empty, not a number, negative, age or payout start not a whole number or outside the allowed range, payout start not after the age, monthly contribution above 570 EUR, number of children not a whole number or out of range, return or costs out of range; ranges: see Context), then that field shows an error naming the field and the allowed range, is marked invalid for assistive technology, the previous result is replaced by a hint that no result can be shown, and no NaN, Infinity or negative end value appears anywhere. (changed by [014](014-avd-tax-refund.md))
- **AC7:** Given the app is used with keyboard only, when the user tabs through the page, then every input is reachable and has a programmatic label, error messages are associated with their field, and the end value is announced politely (live region) when it changes after an edit. (changed by [014](014-avd-tax-refund.md))
- **AC8:** Given a result is shown, when it is displayed, then a note next to it states that the figures are model calculations based on the entered assumptions, not investment or tax advice, and that eligibility for the state subsidy is assumed; the app shows no buy/sell or product recommendation. (changed by [014](014-avd-tax-refund.md))

## Out of scope

- Taxes (Sonderausgabenabzug, Günstigerprüfung), income and tax rate, payout phase (Auszahlungsplan, lump sum, monthly pension), comparison with a normal ETF depot, glidepath before payout, early payout start with an earlier statutory pension, check of eligibility for Zulagen, contract and provider costs beyond one yearly cost percentage, inflation adjustment, scenarios, saving/loading of inputs (nothing persisted), export/print. All except the last four are planned as later stories.
- Product or provider recommendations of any kind.

## Open questions

None. All earlier questions are settled (see Context and Decision log 2026-11-07).

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-07 — Story created as draft; no answers from hak yet. Proposed defaults in the Open questions are unconfirmed.
- 2026-11-07 — hak on Q1: "wir reden hier vom Altervorsorgedepot mit staatlicher Förderung dass ab 2027 angeboten wird. Es gibt dazu schon einige Beispiel-Rechner im Internet. Recherchiere das bitte erstmal"
- 2026-11-07 — The orchestrator researched the adopted law and proposed this cut. hak answered: "Ja, so schneiden". The cut: 013 = saving phase with Zulagen (inputs: age, payout start 65–70, monthly contribution, children, return, costs; output: end value split into own contributions / Zulagen / returns, yearly table + chart); later stories: taxes (Sonderausgabenabzug, Günstigerprüfung; needs income/tax rate), payout phase (Auszahlungsplan to ≥85, ≤30 % lump sum, monthly pension), comparison with a normal ETF depot.
- 2026-11-07 — Open questions 1–7 (children as one constant number; calculation convention; Berufseinsteigerbonus under 25; load defaults; input ranges; table and chart both visible; nominal only) and the reference example (returns 3.536,44 EUR, end value 22.256,44 EUR, r_net = 4,475 %), all proposed with defaults — hak: "Ja, alle passen"
- 2026-11-07 — Scope decision: AC7 and AC8 stay in this story (no split, 8 ACs). Status set to ready.

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

Language: German, German number format (`22.256,44 €`, comma decimal). The app speaks neutrally (no "du"/"Sie"). Everything is synchronous: there is no loading state. All colours are tokens; new app tokens are listed in section 8 (the developer adds them to `apps/avd/src/tokens.css` and `PAIRS`). Existing shell: title "Altersvorsorgedepot" is the `h1`; this feature adds only `h2` and below.

### 1. Layout / component tree

Single column inside the shell panel, top to bottom (the panel is edge to edge below 600 px, see section 7).

```text
SavingCalculator                          (fragment inside the shell)
  section.inputs                          <form aria-labelledby=h2 noValidate>  h2 "Eingaben"   <- signedInContent probe
    InputForm: six Field blocks in this order
      Field "Alter heute"                  [input] suffix "Jahre"
      Field "Auszahlungsbeginn (Lebensjahr)" [input] suffix "Jahre"
      Field "Monatlicher Beitrag"          [input] suffix "€"
      Field "Kinder mit Kindergeld"        [input] suffix "Kinder"
      Field "Erwartete Rendite pro Jahr"   [input] suffix "%"
      Field "Kosten pro Jahr"              [input] suffix "%"
      each Field: <label>, input wrapper (input + aria-hidden unit suffix),
                  <p> hint (always), <p> error (only while invalid)
  section.result                          <section aria-labelledby=h2>  h2 "Ergebnis"
    live region                           <p aria-live="polite"> visually hidden, mounted empty (section 4)
    valid:
      ResultSummary <dl> four figures: "Eigene Beiträge", "Zulagen gesamt", "Erträge", "Endwert"
      Zulage details <dl>: "Zulage pro Jahr", "Berufseinsteigerbonus (einmalig, im 1. Jahr)",
                           "Zulage im 1. Jahr" (only if the bonus > 0)
      Note <p> (AC8)
    invalid:
      Callout (danger) with the "no result" hint
  section.chart   (valid only)            h2 "Verlauf des Kontostands"
    Legend <ul> (3 or 4 items, real text)
    BalanceChart  <div role="img" aria-label=…>  y-axis labels | SVG plot | x-axis labels + "Sparjahr"
  section.table   (valid only)            h2 "Jahrestabelle"
    scroll wrapper <div role="region" aria-label="Jahrestabelle, horizontal scrollbar" tabindex=0>
      YearTable <table> caption, thead, tbody (one row per saving year), footnote <p> below
```

- Shared components: only `Button` exists in `src/components/`, and this view needs no button (no submit; the result updates while typing). Everything else is new in `src/features/saving/` (as the Technical design lists).
- The form has no submit button. With six fields and no submit button, Enter in a field does not submit; `onSubmit` still calls `preventDefault()` for safety.
- Landmarks: the form is the `form` role through its accessible name "Eingaben" (visible `h2`, `aria-labelledby`). That name is the `signedInContent` probe: `{ role: 'form', name: 'Eingaben' }`. The word "Eingaben" must appear nowhere else on the page (no label, hint, error, live text, note or chart text contains it) and no field label contains it, so substring matching is unambiguous. The title "Altersvorsorgedepot" is likewise not repeated in any other text.
- Tests should query fields with `getByLabel(label, { exact: true })`: label texts are chosen so none is a substring of another (see "Alter heute" vs "Auszahlungsbeginn (Lebensjahr)": the word "Alter" occurs only in the first), but "Kosten pro Jahr" and "Erwartete Rendite pro Jahr" share "pro Jahr" and the table caption and Zulage rows use "pro Jahr" too.

### 2. Copy (exact texts)

Field labels, units and hints. The hint is always visible under the field and is part of the field's description. The unit suffix is decoration (`aria-hidden`); the hint names the unit for assistive technology.

| Field id    | Label (exact)                  | Suffix | Hint (exact)                                                                            | Range text `{R}` used in errors                   | Default |
| ----------- | ------------------------------ | ------ | --------------------------------------------------------------------------------------- | ------------------------------------------------- | ------- |
| `age`       | Alter heute                    | Jahre  | Ganze Jahre, 18 bis 69.                                                                 | 18 bis 69 Jahre                                   | 40      |
| `payoutAge` | Auszahlungsbeginn (Lebensjahr) | Jahre  | Ganze Jahre, 65 bis 70, später als das heutige Alter.                                   | 65 bis 70 Jahre, später als das heutige Alter     | 65      |
| `monthly`   | Monatlicher Beitrag            | €      | 0 bis 570,00 € pro Monat, höchstens 2 Nachkommastellen.                                 | 0 bis 570,00 € pro Monat                          | 150     |
| `children`  | Kinder mit Kindergeld          | Kinder | Ganze Zahl, 0 bis 10; gilt für die gesamte Sparzeit.                                    | 0 bis 10 Kinder (ganze Zahl)                      | 0       |
| `returnPct` | Erwartete Rendite pro Jahr     | %      | -10,00 bis 20,00 % pro Jahr vor Kosten, höchstens 2 Nachkommastellen.                   | -10,00 bis 20,00 % (höchstens 2 Nachkommastellen) | 5       |
| `costsPct`  | Kosten pro Jahr                | %      | 0,00 bis 1,00 % pro Jahr (Obergrenze beim Standarddepot), höchstens 2 Nachkommastellen. | 0,00 bis 1,00 % (höchstens 2 Nachkommastellen)    | 0,5     |

Minus sign in copy is the ASCII hyphen-minus (`-10,00`), so tests and users can type exactly what they read; the parser also accepts U+2212.

Field error texts (one sentence, always the exact label and the range `{R}`; shown as soon as the value is invalid, no blur or submit needed):

| `FieldError` kind | Text                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| `empty`           | `{Label}: Wert fehlt. Erlaubt: {R}.`                                                                                |
| `format`          | `{Label}: keine gültige Zahl. Erlaubt: {R}.`                                                                        |
| `range`           | `{Label}: Wert außerhalb des erlaubten Bereichs. Erlaubt: {R}.`                                                     |
| `notAfterAge`     | `Auszahlungsbeginn (Lebensjahr): muss später liegen als das heutige Alter ({age} Jahre). Erlaubt: 65 bis 70 Jahre.` |

Example: `Monatlicher Beitrag: Wert außerhalb des erlaubten Bereichs. Erlaubt: 0 bis 570,00 € pro Monat.`

Result area:

| Where                        | Text (exact)                                                                                                                                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Section headings             | `Eingaben`, `Ergebnis`, `Verlauf des Kontostands`, `Jahrestabelle`                                                                                                                                                                     |
| Figure labels (`dt`)         | `Eigene Beiträge`, `Zulagen gesamt`, `Erträge`, `Endwert`                                                                                                                                                                              |
| Figure values (`dd`)         | `formatEuro`, e.g. `14.400,00 €`, `4.320,00 €`, `3.536,44 €`, `22.256,44 €`; negative returns as `-4.478,79 €`                                                                                                                         |
| Endwert sub-line             | `bei Auszahlungsbeginn mit {payoutAge}` (inside the `dd` after the value, in muted text)                                                                                                                                               |
| Zulage rows                  | `Zulage pro Jahr` = `perYearCents`; `Berufseinsteigerbonus (einmalig, im 1. Jahr)` = `200,00 €` or `keiner`; `Zulage im 1. Jahr` = `perYearCents + bonusCents` (row only when the bonus is > 0)                                        |
| Zulage rows lead-in `h3`     | none; the rows sit in a second `dl` with the visually identical label style and a `aria-label="Zulagen im Detail"`                                                                                                                     |
| Model note (AC8)             | `Hinweis: Die Zahlen sind Modellrechnungen auf Grundlage der eingegebenen Annahmen, keine Anlage- oder Steuerberatung. Es wird angenommen, dass der Anspruch auf die staatliche Zulage besteht. Beträge sind nominal, ohne Inflation.` |
| No-result hint (AC6)         | `Kein Ergebnis möglich. Bitte die markierten Felder korrigieren.`                                                                                                                                                                      |
| Chart empty (contribution 0) | `Ohne Beitrag entsteht kein Kontostand.` (text inside the plot area, muted)                                                                                                                                                            |
| Legend                       | `Eigene Beiträge`, `Zulagen`, `Erträge`, and only when some return is negative `Verlust (negative Erträge)`                                                                                                                            |
| Chart axis titles            | x: `Sparjahr`; y: none (tick labels carry `€`)                                                                                                                                                                                         |
| Table caption                | `Entwicklung pro Sparjahr, kumuliert`                                                                                                                                                                                                  |
| Table headers                | `Jahr`, `Alter`, `Eigene Beiträge`, `Zulagen gutgeschrieben`, `Erträge`, `Kontostand am Jahresende`                                                                                                                                    |
| Table footnote               | `Zulagen eines Jahres werden im Folgejahr gutgeschrieben. Die letzte Zulage ist im Endwert enthalten, ohne weitere Erträge.`                                                                                                           |

Copy rules: the AC quoted phrase "Zulage" appears in several rows by design, so tests locate figures by `dt`/row structure: `Zulagen gesamt` vs `Zulage pro Jahr` are different strings, neither is a substring of the other, but "Zulagen" is a substring of "Zulagen gesamt" and "Zulagen gutgeschrieben": use `exact: true` or the full label. "Kein Ergebnis möglich" contains neither "Eingaben" nor a field label. Row "Zulage im 1. Jahr" shows the sum including the bonus; with 24-year-old, 25 EUR, 2 children: `Zulage pro Jahr` 750,00 €, bonus `200,00 €`, `Zulage im 1. Jahr` 950,00 €. Age 25: 750,00 €, bonus `keiner`, no third row. 1 child at 9,99 EUR, age 24: `0,00 €`, `keiner`, no third row.

### 3. States

| View          | State                               | What the user sees / can do                                                                                                                                                                                |
| ------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Whole page    | Loading                             | None: all synchronous, the first render already shows the default result (AC1).                                                                                                                            |
| Whole page    | Initial / success                   | Defaults in the six fields, hints visible, result, chart and table for the defaults. Live region empty (nothing was changed yet).                                                                          |
| Field         | Valid                               | Hint only; border `--color-edge` 1 px.                                                                                                                                                                     |
| Field         | Invalid                             | Error `<p>` with icon below the hint; input border 2 px `--color-danger` plus the icon (not colour alone); `aria-invalid="true"`; `aria-describedby` = hint id + error id. Hint stays visible.             |
| Field         | Focused                             | 2 px `--color-focus` outline, offset 2 px (3:1 against surface and input background). The invalid border is kept under it.                                                                                 |
| Field         | Disabled                            | Never: no field is ever disabled (nothing to wait for).                                                                                                                                                    |
| Result        | Valid                               | Figures, Zulage details, note.                                                                                                                                                                             |
| Result        | Invalid (any field)                 | Figures, Zulage details, note, chart section and table section are all removed; the danger callout with the no-result hint stands in the `Ergebnis` section. Fixing the last error brings everything back. |
| Result        | Negative returns (return -10 %)     | `Erträge` shows a negative amount with a leading `-`; chart shows loss segments, legend gains the loss item; table cells negative. This is valid, no error.                                                |
| Result        | Contribution 0                      | All figures `0,00 €`; Zulage rows `0,00 €` / `keiner`; chart shows axis tick 0 and the "Ohne Beitrag" text; table rows all `0,00 €`.                                                                       |
| Result        | One saving year (age 69, payout 70) | One table row, one chart bar (bar slots are at least 8 wide, section 5, so the bar is not stretched).                                                                                                      |
| Chart / table | Error                               | Not shown (removed with the result).                                                                                                                                                                       |
| Table         | Narrow viewport                     | Scrolls horizontally inside its own wrapper; the page itself never scrolls sideways.                                                                                                                       |

### 4. Interactions

- Typing in a field: the raw text is stored unchanged (no reformatting while typing, no caret jump). On every keystroke the field's validity, figures, chart and table are recomputed and shown immediately. Nothing waits for blur or submit.
- Typing states such as `5,` are valid; a lone `-` shows the `format` error until completed (accepted by AC6).
- Errors appear immediately for the field being edited and for any other field that is invalid (e.g. after the cross-field check changes). Errors are never announced by role=alert (would chatter on every key); they are the field's description.
- Focus never moves automatically. Focus stays in the field being edited; the removal of chart and table on invalid input does not touch focus because focus is in the form.
- Tab order: the six fields in the order of the tree, then the scrollable table wrapper (focusable because it scrolls). The wrapper is reachable only while a result exists.
- Mouse/touch: tapping a label focuses its field (native `label for`).
- Mobile keyboards: `inputMode="numeric"` for age, payout start and children; `inputMode="decimal"` for the other three; `autocomplete="off"`, `spellcheck="false"`. Font size 16 px minimum so iOS does not zoom.
- Live region: one `<p aria-live="polite">` inside `Ergebnis`, visually hidden, mounted on the first render with empty content and in every state. Its text is empty until the user has changed a field the first time (an `edited` flag set in `onChange`; the initial default result is not announced, the page was just opened). After that its text is derived from the settled values:
  - valid: `Endwert bei Auszahlungsbeginn mit {payoutAge}: {endValue}.` e.g. `Endwert bei Auszahlungsbeginn mit 65: 22.256,44 €.`
  - invalid: `Kein Ergebnis: {Label des ersten fehlerhaften Feldes} ist ungültig.` e.g. `Kein Ergebnis: Alter heute ist ungültig.` (first error in the field order of the tree)
- **Debounce required** (answer to the Technical design question): the live text is driven through `useSettledValue(text, 700)`, a trailing debounce of 700 ms; the visible figures, errors, chart and table are not delayed. Reason: every keystroke changes the end value (`1`, `15`, `150`), and a polite region would queue three announcements and make a screen reader read stale values for several seconds. Because the visible UI updates at once, sighted users lose nothing. The identical-string case (user edits a field and the end value does not change) is not re-announced, which is intended: nothing changed. Unit test of the hook on fake timers; e2e drives it with `page.clock`.
- Chart: no hover, no tooltip, no click (exact values live in the table).
- Reduced motion: nothing animates; no transitions are specified beyond `var(--duration)` on the input border colour.

### 5. Chart

Container `div[role="img"]` with `aria-label` (all inner content `aria-hidden`):

`Gestapeltes Säulendiagramm: Kontostand pro Sparjahr bis zum Auszahlungsbeginn mit {payoutAge}, Endwert {endValue}. Davon eigene Beiträge {c}, Zulagen {z}, Erträge {r}. Genaue Werte pro Jahr in der Jahrestabelle.`

Example: `Gestapeltes Säulendiagramm: Kontostand pro Sparjahr bis zum Auszahlungsbeginn mit 65, Endwert 22.256,44 €. Davon eigene Beiträge 14.400,00 €, Zulagen 4.320,00 €, Erträge 3.536,44 €. Genaue Werte pro Jahr in der Jahrestabelle.` (it contains no field label, no "Eingaben", no heading text other than the words "Zulagen"/"Erträge", which are only in an aria-label.)

Series look. Identity never relies on colour alone: stacking order, fill style and outline differ. Series order bottom to top: contributions, Zulagen, returns (as in the table columns).

| Series                     | Fill style                                                                                        | Outline                                                      | Tokens                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------- |
| Eigene Beiträge            | solid                                                                                             | 1 px `--color-surface` (separates from neighbours)           | fill `--chart-contributions`                                     |
| Zulagen                    | horizontal stripes: 50 % series colour / 50 % surface, period 4 units of the 100-unit plot height | 1 px `--color-surface`                                       | stripes `--chart-zulagen` on `--color-surface` (SVG `<pattern>`) |
| Erträge (positive)         | hollow: pale fill, 2 px solid outline in the series colour                                        | 2 px `--chart-returns` (`vector-effect: non-scaling-stroke`) | fill `--chart-returns-fill`, stroke `--chart-returns`            |
| Verlust (negative Erträge) | hollow: pale fill, 2 px dashed outline (`stroke-dasharray` 4 3), drawn over the stack             | 2 px `--chart-loss`                                          | fill `--chart-loss-fill`, stroke `--chart-loss`                  |

- Horizontal stripes (not diagonal) because the plot is `preserveAspectRatio="none"`: a diagonal pattern would shear differently per size. The `<pattern>` uses `patternUnits="userSpaceOnUse"` and only horizontal rules (their pixel thickness scales with the plot height only, about 5 px at 240 px height, which is intended). The legend swatches are 16 x 16 px inline SVG that reference the same pattern id (the `<defs>` svg must not be `display:none`; the plot SVG owns the `<defs>`, ids unique per page).
- Bar slots: `slotCount = max(N, 8)`; bar i occupies slot i from the left, so a single bar does not stretch across the plot (computed in the component from the geometry fractions, not in `chartGeometry`). Gap = 20 % of a slot; with 52 bars at 375 px a bar is about 4 px wide, still visible; no minimum pixel width (as the design says).
- Axis: baseline 1 px `--color-edge` (3:1); horizontal gridlines at every tick, 1 px `--color-border` (decorative, the tick label carries the value). y tick labels (HTML, right-aligned, `--text-sm`, `--color-text-muted`) formatted as whole euros with the unit, e.g. `20.000 €` (`Intl` without fraction digits; the only extra formatter, in `format.ts`). x labels: saving year number under the bar, only for years 1, last, and multiples of `step` where `step` is the smallest of 1, 2, 5, 10 that gives at most 8 labels (at most 12 at 600 px and wider); title `Sparjahr` centred under them, `--text-sm`, muted.
- Heights: plot 240 px (200 px below 600 px). Left axis column 64 px (52 px below 600 px). The chart container never exceeds the panel width; no horizontal scroll inside it.
- Legend: `<ul>` of inline items above the chart (wraps), each a swatch (16 px, 1 px `--color-edge` frame for the swatch only if its fill is pale) plus text in `--color-text`. The legend is real text outside the `role="img"`, so it is read.
- Forced colours (`@media (forced-colors: active)`, in the module CSS, via system colours in the one place allowed): contributions fill `CanvasText`; Zulagen stripes `CanvasText` on `Canvas`; returns fill `Canvas`, stroke `CanvasText` 2 px solid; loss fill `Canvas`, stroke `CanvasText` 2 px dashed; gridlines `GrayText`; baseline `CanvasText`; legend swatches use the same rules. The shape cues (solid / stripes / hollow / dashed) therefore survive. If `fill`/`stroke` on SVG are not recoloured by the browser, the forced block makes the above explicit; the developer checks with `emulateMedia({ forcedColors: 'active' })`.
- All-zero state: no segments, tick 0 only, centred muted text `Ohne Beitrag entsteht kein Kontostand.`

### 6. Accessibility

- Semantics: `h1` (shell) then `h2` x4; `form` named by its `h2`; each field is `<label for>` + `<input type="text">` (not `number`, per the design); hint `<p id>`; error `<p id>` only while invalid. Result figures in `<dl>` with `<dt>`/`<dd>`; Zulage details in a second `<dl aria-label="Zulagen im Detail">`. Table: `<table>` with `<caption>`, `<th scope="col">` for each header, row header `<th scope="row">` for `Jahr`, `<td>` for numbers.
- Accessible names: the six labels of section 2, exact. Each input's description = hint (+ error while invalid): `aria-describedby="{id}-hint {id}-error"` while invalid, `"{id}-hint"` otherwise; the error id is not referenced while it is not in the DOM. `aria-describedby` is chosen over `aria-errormessage` because support in screen readers is better; the e2e uses `toHaveAccessibleDescription` (contains the error text). `aria-invalid="true"` only while invalid, the attribute absent otherwise (not `"false"`).
- Error `<p>` has no role and no `aria-live` (chatter, see section 4). Icon is `aria-hidden`.
- Result region: the `section` is named by `Ergebnis`; the figures are plain text, not live.
- Live regions: the single `aria-live="polite"` `<p class="visuallyHidden">` is rendered from the first paint (empty) and never conditionally mounted; it is the only live region. No `role=alert/status` anywhere (their persistent empty regions would break tests and double announce).
- Keyboard: Tab / Shift+Tab through six fields (no tab stops in between), then the table wrapper (focus ring 2 px `--color-focus`, offset -2 px so it is not clipped by `overflow: auto`); arrow keys scroll the wrapper natively. Everything is operable by keyboard; the chart is not interactive and not focusable.
- Focus management: never moved by the app; typing keeps focus in the field. Removal of chart and table on invalid input never removes the focused element.
- Colour contrast (WCAG 2.2 AA): all text uses existing token pairs (`--color-text`, `--color-text-muted` on `--color-surface` / `--color-input-bg` / `--color-surface-subtle` / `--color-danger-bg`; see section 8). Message text stays in `--color-text`; the danger cue is the icon, the bar and the border. Focus indicators and field borders 3:1 (`--color-focus`, `--color-edge`, `--color-danger`).
- Target size: inputs 44 px high (`--control-height`); legend and axis labels are not interactive.
- Zoom / reflow: at 320 px wide and 400 % zoom everything stacks to one column; only the table wrapper scrolls (a WCAG 2.2 exception for data tables).
- Forced colours: input borders and the callout border are real 1-2 px borders (`ButtonText` / `CanvasText` by the browser), the callout bar is a `border-left`, the icon uses `currentColor`; focus is an `outline`, not a box-shadow; chart per section 5.

### 7. Responsive behaviour

| Aspect         | 600 px and wider                                                                          | Below 600 px                                                                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Panel          | shell panel with border and 24 px padding (`--panel-pad`)                                 | edge to edge, 16 px padding                                                                                                                                                        |
| Fields         | two-column grid, gap `--space-4` (`--space-5` row gap); hints and errors under each field | one column; label, field, hint, error stacked                                                                                                                                      |
| Figures        | `dl` as 4 cards in a row from 900 px, 2 x 2 from 600 px; label above value                | four rows, label left (muted `--text-sm`) and value right (tabular numbers); `Endwert` row emphasised                                                                              |
| Zulage details | label and value in one line each, left-aligned                                            | same as figures (rows)                                                                                                                                                             |
| Note           | below the details, full width, `--text-sm`                                                | same                                                                                                                                                                               |
| Chart          | plot 240 px high, y column 64 px, up to 12 x labels                                       | plot 200 px, y column 52 px, up to 8 x labels (about 280 px plot width at 375 px)                                                                                                  |
| Table          | fits the panel when it can                                                                | wrapper scrolls horizontally (min table width 560 px), first column `Jahr` sticky with `--color-surface` background and a 1 px `--color-border` right edge; scroll shadow not used |
| Type           | `--text-base`, figures `--text-h2` (Endwert `--text-h1`)                                  | `--text-base`, figures `--text-lg`, Endwert `--text-h2`                                                                                                                            |

Tested widths: 375 px (primary), 320 px (the 52-bar chart and the table), 1280 px. The page must not scroll sideways at 320 px.

### 8. Dark mode and tokens

Existing tokens are reused for all text, surfaces and field chrome (pairs in the platform token test). Values below; contrast computed by hand with the sRGB linearisation (no shell available), against `--color-surface` (light `#ffffff`, dark `#1b1f26`). The tester should re-check the new tokens with a tool; none has a margin under 0.3 above its threshold.

Existing token use (no new values):

| Element                                      | Light                                                     | Dark                   | Ratio (documented by the platform) |
| -------------------------------------------- | --------------------------------------------------------- | ---------------------- | ---------------------------------- |
| Panel, figure cards, table body              | `--color-surface` `#ffffff`                               | `#1b1f26`              | n/a                                |
| Input background                             | `--color-input-bg` `#ffffff`                              | `#12151a`              | n/a                                |
| Input border (valid), baseline, field chrome | `--color-edge` `#737c8b` (UI 3:1)                         | `#8b94a3` (UI 3:1)     | about 4.0 / 5.4                    |
| Input border (invalid), icon, callout bar    | `--color-danger` `#b3261e`                                | `#f2b8b5`              | about 6.5 / 9.5                    |
| Callout and error text                       | `--color-text` `#1b1f24` on `--color-danger-bg` `#fdecea` | `#e8eaed` on `#3a1b1a` | above 15 / above 11                |
| Labels, figures, table text                  | `--color-text`                                            | `--color-text`         | above 15 / above 13                |
| Hints, units, axis labels, sub-lines         | `--color-text-muted` `#4a5360`                            | `#a9b1bd`              | about 7.8 / 8.5                    |
| Table header and note background             | `--color-surface-subtle` `#eef1f5`                        | `#252a33`              | text above 13 / above 11           |
| Focus outline                                | `--color-focus` `#1d4ed8`                                 | `#a8c7fa`              | about 6.7 / 8.9                    |
| Gridlines, row separators (decorative)       | `--color-border` `#d5d9e0`                                | `#2b313b`              | decorative, not required           |
| Live region                                  | visually hidden, no visible colour                        | same                   | n/a                                |

New app tokens (in `apps/avd/src/tokens.css`, opaque hex; every one has a dark value; `PAIRS` as NON_TEXT 3:1 against `--color-surface`):

| Token                   | Light     | Dark      | Use                                        | Ratio vs surface (light / dark) | Rule |
| ----------------------- | --------- | --------- | ------------------------------------------ | ------------------------------- | ---- |
| `--chart-contributions` | `#1d4ed8` | `#8ab4f8` | solid fill of own contributions, swatch    | about 6.7 / 7.8                 | 3:1  |
| `--chart-zulagen`       | `#b45309` | `#f6ad55` | stripe colour of Zulagen, swatch           | about 5.0 / 8.7                 | 3:1  |
| `--chart-returns`       | `#1a7030` | `#81c995` | 2 px outline of positive returns, swatch   | about 6.2 / 8.4                 | 3:1  |
| `--chart-returns-fill`  | `#e8f5ea` | `#16291b` | pale fill inside the returns outline       | decorative (outline carries it) | none |
| `--chart-loss`          | `#b3261e` | `#f28b82` | dashed outline of negative returns, swatch | about 6.5 / 8.2                 | 3:1  |
| `--chart-loss-fill`     | `#fdecea` | `#3a1b1a` | pale fill inside the loss outline          | decorative (outline carries it) | none |

Dark mode notes: the three solid series colours are lighter, desaturated variants so they stay 3:1 or better on the dark surface; stripes in dark mode are the light colour on the dark surface (stripe and gap both stay visible); the pale fills become dark tints so the hollow bars do not glow. Series are still told apart by solid / stripes / hollow / dashed in both schemes. Adjacent colours (blue vs amber vs green) differ in hue and in lightness (`#1d4ed8` vs `#b45309` vs `#1a7030` in light, three hue families with different luminance); the shapes carry the difference for colour-blind users.

### 9. Table detail

| Column                   | Content (`formatEuro` except Jahr/Alter) | Alignment | Notes                                                                               |
| ------------------------ | ---------------------------------------- | --------- | ----------------------------------------------------------------------------------- |
| Jahr (row header)        | 1 to N                                   | left      | `th scope="row"`, sticky below 600 px                                               |
| Alter                    | `age + year - 1`                         | right     | the age in that saving year (year 1 = year of the entered age)                      |
| Eigene Beiträge          | cumulative contributions                 | right     | tabular numbers                                                                     |
| Zulagen gutgeschrieben   | cumulative Zulagen credited              | right     | row 1 is `0,00 €` (Zulagen come one year later); last row includes the final Zulage |
| Erträge                  | cumulative returns                       | right     | may be negative                                                                     |
| Kontostand am Jahresende | balance                                  | right     | last row = `Endwert`; last row is bold with a 1 px `--color-edge` top border        |

Header cells: `--color-surface-subtle` background, `--color-text`, weight 600, 1 px bottom border `--color-edge`. Body: row separators 1 px `--color-border`, no zebra. All numbers `font-variant-numeric: tabular-nums`.

### 10. Points for the architect

None of these contradict the fixed points; each needs a small action:

- **Debounce:** UX requires `useSettledValue(text, 700)` for the live text only (section 4); the architect's "if UX requires one" clause applies. Add the hook, its unit test on fake timers and the `page.clock` e2e step.
- **`edited` flag:** the live region is empty until the first edit (so the default result on load is not announced and the region exists before its first content). That is one boolean in `SavingCalculator` state set in `onChange`; still no reducer or effect.
- **Extra formatter:** the y axis shows whole euros (`20.000 €`): one more `Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })` in `format.ts` (still the only money formatting).
- **Chart x position:** the component, not `chartGeometry`, places bars at `index / max(N, 8)` so a one-year projection is not stretched.
- **Zulage figures:** `Zulage pro Jahr` = `zulage.perYearCents`, bonus = `zulage.bonusCents` (`keiner` if 0), `Zulage im 1. Jahr` = `perYearCents + bonusCents` only if the bonus is > 0.
- **Row semantics:** unchanged (row 1 has 0 Zulagen credited, last row = end value).
- **Probe:** `signedInContent` = `{ role: 'form', name: 'Eingaben' }`; nothing else may contain the word "Eingaben".
- **Open for the product owner:** none. AC1 wording "payout start (age)" is realised as the label "Auszahlungsbeginn (Lebensjahr)" to keep "Alter" unique to the age field.

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

**ADR:** [0007 – pure projection module with cent-rounding at the boundary, hand-drawn SVG chart](../adr/0007-avd-projection-model-and-svg-chart.md). No new dependency, no platform change, no dev-only code (so no `dist-check.json` for the app).

### Overview

One feature slice `apps/avd/src/features/saving/`. Pure, deterministic logic in `logic/` (no React import): field specs + parsing of the raw input strings, Zulage rules, the monthly projection, chart geometry, formatting. One stateful component holds the six raw input strings; everything else (validation result, projection, table rows, chart geometry, live-region text) is derived during render. No reducer, no effects, no timers, no network.

### Files

| Path (below `apps/avd/`)                                     | Responsibility                                                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `src/main.tsx` (change)                                      | renders `<SavingCalculator />` instead of `<Content />`                                           |
| `src/Content.tsx`, `src/Content.test.tsx` (delete)           | skeleton placeholder                                                                              |
| `playwright.config.ts` (change)                              | `signedInContent` = a calculator element (see Risks 6), not the placeholder region                |
| `src/tokens.css`, `src/tokens.test.ts` (change)              | chart series tokens (light + dark) and their contrast pairs against `--color-surface` (NON_TEXT)  |
| `src/features/saving/logic/fields.ts`                        | `FieldId`, `FIELD_SPECS` (range, decimals, default) — single source for parser, hints and errors  |
| `src/features/saving/logic/parseInputs.ts` (+ test)          | raw strings → `Inputs` (integers) or per-field errors, incl. the cross-field check                |
| `src/features/saving/logic/zulage.ts` (+ test)               | Grundzulage, Kinderzulage, Berufseinsteigerbonus for one year (integer cents)                     |
| `src/features/saving/logic/project.ts` (+ test)              | monthly projection → yearly rows and totals (convention of Context)                               |
| `src/features/saving/logic/chartGeometry.ts` (+ test)        | rows → stacked-bar segments and axis ticks as fractions 0..1                                      |
| `src/features/saving/logic/format.ts`                        | `formatEuro(cents)`, `formatPercent`, via `Intl.NumberFormat('de-DE')`; the only money formatting |
| `src/features/saving/SavingCalculator.tsx` (+ `.module.css`) | owns the raw input state, derives everything, lays out form, result, note, table, chart           |
| `src/features/saving/InputForm.tsx` (+ css)                  | six labelled text inputs with hint and error (props only)                                         |
| `src/features/saving/ResultSummary.tsx` (+ css)              | the four figures, yearly Zulage and bonus, live region, model note (AC8), or the "no result" hint |
| `src/features/saving/YearTable.tsx` (+ css)                  | per-year table (AC5)                                                                              |
| `src/features/saving/BalanceChart.tsx` (+ css)               | SVG stacked bars + HTML axis labels + text alternative (AC5)                                      |
| `e2e/avd.spec.ts`                                            | one test per AC (rebuild oracle)                                                                  |

The component split follows the UX component tree where it differs; the `logic/` modules and their types are fixed by this design.

### Key types

```ts
// logic/fields.ts
export type FieldId = 'age' | 'payoutAge' | 'monthly' | 'children' | 'returnPct' | 'costsPct';
export type RawInputs = Readonly<Record<FieldId, string>>;

export interface FieldSpec {
  /** Limits in the field's integer unit: years, children, cents, basis points (1 % = 100). */
  readonly min: number;
  readonly max: number;
  /** 0: whole numbers only; 2: up to two decimals (cents, hundredths of a percent). */
  readonly decimals: 0 | 2;
  readonly defaultValue: string; // shown in the input: '40', '65', '150', '0', '5', '0,5'
}
export const FIELD_SPECS: Readonly<Record<FieldId, FieldSpec>>;
// age 18..69 (0), payoutAge 65..70 (0), monthly 0..57000 (2), children 0..10 (0),
// returnPct -1000..2000 (2), costsPct 0..100 (2)

// logic/parseInputs.ts
export interface Inputs {
  readonly age: number;
  readonly payoutAge: number;
  readonly monthlyCents: number;
  readonly children: number;
  readonly returnBp: number;
  readonly costsBp: number;
}
export type FieldError =
  | { readonly kind: 'empty' }
  | { readonly kind: 'format' } // not a number, too many decimals, decimals in a whole field
  | { readonly kind: 'range' } // outside FIELD_SPECS[field]
  | { readonly kind: 'notAfterAge'; readonly age: number }; // payoutAge only
export type ParseResult =
  | { readonly ok: true; readonly inputs: Inputs }
  | { readonly ok: false; readonly errors: Readonly<Partial<Record<FieldId, FieldError>>> };
export function parseInputs(raw: RawInputs): ParseResult;

// logic/zulage.ts
export interface Zulage {
  readonly grundCents: number;
  readonly kinderCents: number;
  readonly perYearCents: number; // grund + kinder, every saving year
  readonly bonusCents: number; // Berufseinsteigerbonus, once, part of year 1's Zulage (0 or 20000)
}
export function zulage(annualCents: number, children: number, ageAtStart: number): Zulage;

// logic/project.ts
export interface YearRow {
  readonly year: number; // 1-based saving year
  readonly age: number; // age in that year: age + year - 1
  readonly contributionsCents: number; // cumulative own contributions
  readonly zulagenCents: number; // cumulative Zulagen credited (row 1: 0; last row incl. the final one)
  readonly returnsCents: number; // balance - contributions - zulagen (may be negative)
  readonly balanceCents: number; // balance at year end, rounded once
}
export interface Projection {
  readonly zulage: Zulage;
  readonly years: readonly YearRow[]; // length = payoutAge - age, >= 1
  readonly total: YearRow; // = last row: end value at payout start and its three parts
}
export function project(inputs: Inputs): Projection;

// logic/chartGeometry.ts
export type Series = 'contributions' | 'zulagen' | 'returns';
export interface Segment {
  readonly series: Series;
  readonly from: number; // fraction of the plot height, 0 = baseline, from < to
  readonly to: number;
  readonly loss: boolean; // returns < 0: drawn from balance up to contributions + Zulagen
}
export interface Bar {
  readonly year: number;
  readonly age: number;
  readonly segments: readonly Segment[]; // zero-height segments omitted
}
export interface Tick {
  readonly cents: number;
  readonly at: number; // fraction 0..1
}
export interface ChartGeometry {
  readonly bars: readonly Bar[];
  readonly ticks: readonly Tick[];
}
export function chartGeometry(rows: readonly YearRow[]): ChartGeometry;
```

Component props (all `readonly`, optional props as `?: T | undefined`):

```ts
interface InputFormProps {
  readonly values: RawInputs;
  readonly errors: Readonly<Partial<Record<FieldId, FieldError>>>;
  readonly onChange: (field: FieldId, value: string) => void;
}
interface ResultSummaryProps {
  readonly projection: Projection | null; // null: show the "no result" hint (AC6)
  readonly payoutAge: number | null;
}
interface YearTableProps {
  readonly rows: readonly YearRow[];
}
interface BalanceChartProps {
  readonly rows: readonly YearRow[];
  readonly payoutAge: number;
}
```

### Data flow and state ownership

- `SavingCalculator` owns `const [values, setValues] = useState<RawInputs>(defaults)` (defaults from `FIELD_SPECS`). `onChange` replaces one field. The raw string is never reformatted while typing (no caret jumps).
- Derived on every render, never stored: `parsed = parseInputs(values)`; `projection = parsed.ok ? project(parsed.inputs) : null` (at most 52 × 12 steps, `useMemo` optional); `chartGeometry(projection.years)` inside `BalanceChart`.
- Invalid input (AC6): `projection` is `null`; summary, table and chart are replaced by the hint; nothing formats a value from invalid input, so NaN/Infinity can't reach the DOM.
- Field errors show as soon as the value is invalid (no submit, no blur state); `aria-invalid` and the error id in `aria-describedby` (or `aria-errormessage`, as UX decides) only while invalid.
- Live region (AC7): one element with `aria-live="polite"` that is always mounted (also in the invalid state, so it exists before its content changes); its text is derived from the projection, e.g. end value and payout age. No debounce by default (polite announcements are queued and superseded); if UX requires one, add a tiny `useSettledValue(value, ms)` hook with a unit test on fake timers and drive it with `page.clock` in e2e.

### Calculation (convention of Context, ADR 0007)

- `N = payoutAge - age` saving years; `c = 12 · monthlyCents`; `z = zulage(c, children, age)`.
- `rNet = (1 + returnBp / 10000) · (1 − costsBp / 10000) − 1`; `g = (1 + rNet) ** (1 / 12)` (always > 0 within the allowed ranges, so the balance never goes negative).
- `zulageOf(n) = z.perYearCents + (n === 1 ? z.bonusCents : 0)`.
- Loop over years `n = 1..N`, months `1..12`: `balance = balance · g + monthlyCents`; in month 1 of year `n ≥ 2` additionally `balance += zulageOf(n − 1)` (end of January, no growth in that month). After month 12 of year `N`: `balance += zulageOf(N)` (no further returns). Emit one `YearRow` per year.
- **Rounding:** contributions and Zulagen are exact integer cents (c in cents is a multiple of 12, so 0,5 · c and 0,25 · c are whole cents). The balance is an **unrounded float in cents**; each row rounds it once (`balanceCents = Math.round(balance)`) and derives `returnsCents = balanceCents − contributionsCents − zulagenCents`. So the three parts sum to the end value exactly in every row (AC4). Rounding the balance every month gives 22.256,45 EUR for the reference example instead of 22.256,44 — the developer must not do it.
- Zulage rules (`zulage.ts`): `c < 12000` → all zero (also no bonus); Grund = `0,5 · min(c, 36000) + 0,25 · max(0, min(c, 180000) − 36000)` (max 54000 by construction); Kinder = `children · min(c, 30000)`; bonus = `20000` iff `ageAtStart < 25`. The 6.840 EUR cap is enforced by the input range (570 EUR per month), not here.
- Closed form, used as the unit-test oracle: `E = m · Σ_{i=0}^{12N−1} g^i + Σ_{n=1}^{N−1} zulageOf(n) · g^{12(N−n)−1} + zulageOf(N)`.

### Input parsing (`parseInputs.ts`)

- Trim; replace U+2212 (−) by `-`. Whole fields: `^-?\d+$`. Decimal fields: `^-?(\d+([.,]\d{0,2})?|[.,]\d{1,2})$` — comma is the decimal separator, a dot is accepted as one too, no thousands grouping (all maxima are below 1.000), at most 2 decimals, `5,` and `,5` accepted (typing states).
- Convert by string arithmetic to the integer unit (`"9,99"` → 999), never `parseFloat · 100`; `-0` → 0. Then range check on integers (exact: 57000 ok, 57001 not).
- Error order per field: `empty` → `format` → `range`. Cross-field: only if age and payoutAge are both valid and `payoutAge <= age` → `notAfterAge` on payoutAge.
- Not used: `Number(text)` / `parseFloat` on the raw text (`Number('') === 0`, `Number(' ') === 0`, `Number('1e2') === 100`, `parseFloat('12abc') === 12`, `Number('Infinity')`).
- Inputs are `type="text"` with `inputMode="numeric"` (whole) or `"decimal"`, not `type="number"` (its comma handling and `e` acceptance differ per browser, and its value is `''` for partial input).
- Messages are built in the UI from `FieldError` + `FIELD_SPECS` and always name the field and its range (AC6), e.g. "Monatlicher Beitrag: 0 bis 570,00 €, höchstens 2 Nachkommastellen". Wording is UX-owned.

### Chart (ADR 0007: hand-drawn SVG, no library)

- One stacked bar per saving year: contributions (bottom), Zulagen, returns (top). Negative cumulative returns: the returns segment is a `loss` segment from the balance up to contributions + Zulagen, drawn over the stack in a distinct style, so the visible top is still the balance.
- Scale: top = smallest "nice" tick (step 1, 2 or 5 · 10^k, 3 to 6 ticks) ≥ the maximum over rows of `max(contributions + zulagen, balance)`. All-zero rows (monthly contribution 0): no segments, one tick 0, no division by zero.
- Rendering: the plot is `<svg viewBox="0 0 100 100" preserveAspectRatio="none">` with `<rect>`s (fractions × 100, y flipped), `vector-effect="non-scaling-stroke"` on outlines; tick and age labels are HTML positioned by percent beside/below it, so text stays real-size at 375 px. Fills and strokes come from app tokens via the CSS module (token test applies; no colour in attributes).
- Accessibility: the chart container has `role="img"` and an `aria-label` (text alternative) with the end value and payout start, e.g. "Kontostand pro Jahr bis zum Auszahlungsbeginn mit 65: Endwert 22.256,44 €"; its contents are `aria-hidden`. A legend names the three parts. The table carries the same data as text.
- Series are distinguishable without colour (pattern or outline per series, UX-owned) and adjacent segments are separated by a thin `--color-surface` stroke, so only each series against the surface needs 3:1 (`NON_TEXT` pairs in `tokens.test.ts`).
- No animation of bar heights is needed; if UX adds a transition it uses `var(--duration)`.

### Formatting (`format.ts`)

- `formatEuro(cents)`: `new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100)` → `22.256,44 €` (with U+00A0 before `€`; negative returns as `-4.478,79 €`). Formatters are created once at module level.
- Percent and defaults in the inputs are plain strings from `FIELD_SPECS` (`0,5`), not formatted numbers.

### Error handling

No I/O, no async. The only error state is invalid input (AC6), handled by `ParseResult`. `project()` is total for every `Inputs` that `parseInputs` can produce; no try/catch.

### Alignment with UX

The UX section was empty when this design was written. UX owns: labels and their exact text, hints and error wording, layout and component tree, where "Zulage pro Jahr" and the bonus are shown (the data offers `perYearCents`, `bonusCents` and `perYearCents + bonusCents` for year 1), table columns and captions, chart look (series tokens, patterns, legend), the live-region text and whether it is debounced, error association (`aria-describedby` vs `aria-errormessage`). Fixed by this design: row semantics (row 1 has no Zulage credited yet; the last row includes the final Zulage, so it equals the end value), the integer/rounding model, text inputs instead of `type="number"`, an always-mounted live region, `role="img"` + label on the chart.

### Risks and mitigations

1. **Rounding drift** (monthly cent rounding or `parseFloat`): breaks AC4 by a cent. Round once per reported value; parse by string arithmetic; the e2e AC4 oracle and the closed-form unit oracle catch it.
2. **U+00A0 in `Intl` output**: e2e matches figures with a regex using `\s` (or the formatter's own output), never a literal space.
3. **Chart scale with all-zero rows** (contribution 0 is valid): division by zero → `NaN` in SVG attributes. Guard in `chartGeometry`; unit-tested.
4. **Live region chatter** while typing: polite region, no debounce unless UX asks; the region must be mounted from the start.
5. **Typing states** (`-`, `5,`): `5,` parses; a lone `-` shows a format error until completed, which AC6 allows.
6. **Signed-in probe collision**: the platform specs locate `signedInContent` by role + name with substring matching. Use an element whose name is unique and contains neither the title nor another label (e.g. `{ role: 'form', name: 'Eingaben' }` if UX names the form so); a label like "Alter" would also match "Auszahlungsbeginn (Alter)".
7. **Forced colours**: series identity must survive without author colours (pattern/outline); tester probes with `emulateMedia({ forcedColors: 'active' })` and lists it as "checked" unless it finds a defect.
8. **Negative returns** (return −10 %): the "returns" figure and table cells are negative, which is valid (AC6 forbids only a negative end value, which can't occur); the chart uses the `loss` segment.
9. **52 bars at 375 px**: about 6 px per bar; gap as a fraction of the slot, no minimum pixel width.

### Implementation plan

1. `logic/fields.ts`, `logic/parseInputs.ts` + test.
2. `logic/zulage.ts` + test; `logic/project.ts` + test (closed-form oracle first).
3. `logic/format.ts`; `logic/chartGeometry.ts` + test.
4. Components: `InputForm`, `ResultSummary` (incl. live region and note), `YearTable`, `BalanceChart`, `SavingCalculator`; CSS modules from tokens; chart tokens + `PAIRS` in `src/tokens.test.ts`.
5. `main.tsx` renders `SavingCalculator`; delete `Content.tsx` + test; update `signedInContent` in `playwright.config.ts`.
6. `e2e/avd.spec.ts`; `npm run verify -w apps/avd` and `npm run test:e2e -w apps/avd` green.

### Minimal test set

Each behaviour once: the AC's visible values in e2e, logic edge cases not listed in the ACs in unit tests. The reference example (AC4) and the values listed in AC2/AC3 are asserted only in e2e (checklist T2), since they are the rebuild oracle; unit tests use other inputs.

Unit (Vitest, next to the modules):

- `parseInputs.test.ts` (table-driven) — rejected: `''`, `'  '`, `'abc'`, `'1e2'`, `'0x1A'`, `'Infinity'`, `'NaN'`, `'12abc'`, `'1.234,56'`, `'9,999'`, `'+5'`, `'5 5'`, `'150 €'`, `'40,5'` for age, `'1,5'` for children; accepted: `' 150 '` → 15000, `'9.99'` → 999, `'5,'` → 500, `',5'` → 50, `'−2,5'` (U+2212) → −250, `'040'` → 40, `'-0'` → 0; range bounds on both sides for every field (570,00/570,01; 1,00/1,01; −10,00/−10,01; 20,00/20,01; 18/17; 69/70; 65/64; 70/71; 10/11; `-1` children); cross-field: payout = age and payout < age → `notAfterAge`; invalid age + payout 65 → only the age error; two invalid fields → two errors.
- `zulage.test.ts` — second band mid (`c` = 1.000,08 → Grund 340,02), just above the band edge (1.800,12 → 540), Kinderzulage cap (`c` = 6.840, k = 10 → 3.000) and below it (299,88, k = 1 → 299,88), bonus at age 18 with `c` = 120; and a loop over every monthly cent value 0..57000 asserting all parts are integers (the whole-cent claim of the rounding model).
- `project.test.ts` — closed-form oracle (±1 cent) for a few inputs incl. N = 1, N = 52, return −10 %, children + bonus; every row: parts sum to the balance, row 1 has no Zulage, last row = `total`, `years.length = N`; costs never raise the end value (AC5 property; grid of return −10..20 % × costs 0..1 % for a few ages/contributions); extremes (18 → 70, 570 EUR, 10 children, 20 % and −10 %/1 %) finite, non-negative balance, safe integers.
- `chartGeometry.test.ts` — segments of a bar end at the balance fraction; loss case; all-zero rows → no segments, no `NaN`; top tick ≥ max with a 1/2/5 · 10^k step and 3–6 ticks.
- `src/tokens.test.ts` — the chart tokens' parity and `NON_TEXT` pairs against `--color-surface` (existing rules, new `PAIRS`).

No component tests (the e2e tests show the UI).

e2e (`apps/avd/e2e/avd.spec.ts`, guest sign-in in `beforeEach`; inputs by label, figures by their label/region from UX):

- `AC1` defaults visible in the six labelled inputs, a result (end value) shown.
- `AC2` contributions 0 / 9,99 / 10 / 30 / 150 / 570 → yearly Zulage 0 / 0 / 60 / 180 / 540 / 540 EUR.
- `AC3` 25 EUR, 2 children: age 24 → 750 EUR + bonus 200 EUR in year 1; age 25 → 750 EUR, no bonus; 1 child, 9,99 EUR at age 24 → no Zulage and no bonus (age 24, so the bonus condition is really exercised).
- `AC4` reference example → the four figures exactly; the test parses the displayed parts and checks their sum equals the displayed end value; change a field and set it back → identical figures.
- `AC5` an edit updates figures, table and chart without submit; the table has one row per saving year (57 → 65: 8 rows; payout 70: 13 rows) and its last balance equals the end value; the chart's text alternative names the end value and payout start; **pixel check:** `chart.screenshot({ animations: 'disabled' })` differs after the edit and equals the first screenshot after restoring the value. (Cost monotonicity is the unit property above.)
- `AC6` one case per class — empty, `abc`, out of range (age 17; contribution 600), payout = age: the field's message names field and range, `aria-invalid="true"`, the "no result" hint replaces figures, table and chart, the page text contains neither `NaN` nor `Infinity`; fixing the value brings the result back.
- `AC7` Tab (until focused, no counted sequence) reaches each of the six inputs, each found by `getByLabel`; an invalid field's error is its accessible description (`toHaveAccessibleDescription` or `toHaveAccessibleErrorMessage`, per UX wiring); the polite live region holds the new end value after an edit.
- `AC8` the note (model calculation, no investment or tax advice, eligibility assumed) is visible next to the result. Absence of recommendations is a review item, not a test.

Platform sign-in specs run unchanged against the new `signedInContent`. No e2e spec walks `parentElement` / `locator('..')` from the replaced placeholder.

## Implementation notes

_developer: what was built, deviations from the design and why._

**Built** (all below `apps/avd/`):

- `src/features/saving/logic/`: `fields.ts` (`FIELD_IDS`, `FIELD_SPECS`, `DEFAULT_INPUTS`),
  `parseInputs.ts`, `zulage.ts`, `project.ts`, `chartGeometry.ts` (+ `xAxisYears`), `format.ts`
  (`formatEuro`, `formatWholeEuro`), each pure, with unit tests as named in the design.
- `src/features/saving/`: `SavingCalculator` (raw input state + `edited` flag, everything else
  derived), `InputForm`, `ResultSummary` (figures, Zulage details, the one live region, note,
  "no result" callout), `BalanceChart` (hand-drawn SVG, legend, `role="img"` text alternative),
  `ChartSwatch`, `YearTable`, `ErrorIcon`, `fieldCopy.ts` (UX copy and error texts),
  `useSettledValue.ts` (700 ms trailing debounce of the live text only), CSS Modules.
- `src/tokens.css`: six chart tokens (light + dark); `src/tokens.test.ts`: four `NON_TEXT`
  pairs against `--color-surface`.
- `src/main.tsx` renders `SavingCalculator`; `src/Content.tsx` and its test deleted;
  `playwright.config.ts`: `signedInContent` = `{ role: 'form', name: 'Eingaben' }`.
- Unit tests: 70 (parseInputs 37, zulage 5 incl. the 0..57000 cents loop, project 13 incl. the
  closed-form oracle and the cost-monotonicity grid, chartGeometry 10, useSettledValue 1 on fake
  timers, tokens 4). No component tests; `e2e/avd.spec.ts` is left to the tester.
- Checked in a browser (375/320/1280 px, dark, forced colours, return −10 %, contribution 0,
  one saving year, 52 years at 570 € / 20 %): no sideways page scroll, reference example shows
  22.256,44 €, live region holds the end value 700 ms after an edit and the "Kein Ergebnis" text
  when invalid; in forced colours the series stay solid / striped / hollow / dashed.

**Deviations** (small, none touches the fixed points):

1. `ResultSummary` has a third prop `liveText`: the live region sits in the `Ergebnis` section
   (UX tree), its text (incl. the first invalid field's label) is derived in `SavingCalculator`.
2. Labels, hints, range texts and error messages live in `fieldCopy.ts` next to the components,
   not in `logic/fields.ts`: wording is UX-owned; `FIELD_SPECS` keeps ranges and defaults.
3. No `formatPercent`: inputs show their raw strings, nothing else formats a percentage.
4. Tick step at least 1 € so whole-euro tick labels never repeat; only for a maximum below
   about 3 € (contributions of a few cents) there are fewer than 3 ticks.
5. `xAxisYears(count, maxLabels)` in `chartGeometry.ts` (pure, tested) picks the x labels; a
   multiple closer than half a step to the last year is dropped (e.g. 50 next to 52), else the
   two labels overlap. Labels of the 8-label and the 12-label set are rendered once, each hidden
   by a media query where it doesn't belong.
6. The y-axis column is `minmax(52px | 64px, max-content)`, sized by an invisible copy of the
   top tick label: with a fixed 52 px column, labels such as `400.000 €` (or `800.000.000 €` at
   570 € / 20 % / 52 years) spilled off the left edge at 375 px.
7. The shell renders no panel for signed-in content, so `SavingCalculator` draws its own panel
   (edge to edge below 600 px, card from 600 px, max 64 rem), like the minesweeper app.
8. With one saving year, row 1 is also the last row and includes the final Zulage (the last-row
   rule wins over "row 1 has no Zulage credited"); the unit test checks row 1 only when N > 1.
9. The striped Zulagen legend swatch gets a 1 px `--color-edge` frame (half of it is surface);
   the returns and loss swatches are framed by their own series outline.

Review round 1, finding 1: `InputForm` derives `inputMode` per field (`inputModeFor`): `text` when `FIELD_SPECS[field].min < 0` (only the return, so the iOS keyboard has a minus key), else `numeric` / `decimal` as before. Deviates from UX §4 (`decimal`).

**Open points / follow-ups**

- `apps/avd/README.md` still points to `src/Content.tsx` (tech-writer). Done: README rewritten in the docs step.
- `e2e/avd.spec.ts` (one test per AC, AC7 with `page.clock` for the 700 ms debounce) is the
  tester's. The platform sign-in specs pass against the new `signedInContent` (41/41).

## Test report

_tester: AC → test mapping, results, defects found._

All tests in `apps/avd/e2e/avd.spec.ts` (9 tests added; no unit or component tests added). `npm run verify -w apps/avd` green (70 developer unit tests + build + dist check); `npm run test:e2e -w apps/avd`: 50 passed (9 avd + 41 platform sign-in specs).

| AC  | Test (e2e/avd.spec.ts)                                                                             | Result |
| --- | -------------------------------------------------------------------------------------------------- | ------ |
| AC1 | `AC1: the title, six labelled inputs with their defaults and a result are shown on load`           | PASS   |
| AC2 | `AC2: the yearly Zulage for 0, 9,99, 10, 30, 150 and 570 EUR per month`                            | PASS   |
| AC3 | `AC3: Kinderzulage and Berufseinsteigerbonus depend on children, age and the 120 EUR floor`        | PASS   |
| AC4 | `AC4: the reference example gives the four exact figures, their sum, and is repeatable`            | PASS   |
| AC5 | `AC5: edits update figures, table and chart at once; ...` and `narrow screen > AC5: at 375 px ...` | PASS   |
| AC6 | `AC6: invalid input names field and range, marks it invalid and replaces result, ...`              | PASS   |
| AC7 | `AC7: keyboard reaches every labelled input, errors are descriptions, the live region ...`         | PASS   |
| AC8 | `AC8: the model note is shown next to the result and no recommendation is made`                    | PASS   |

AC5 pixel rule: the chart screenshot differs after an edit and is byte-equal after restoring; the chart also contains token-coloured pixels of all three series. AC7 uses `page.clock` (empty at 300 ms, filled after 800 ms, invalid text too).

**Mutation checks** (each fails the named test, all restored): Zulage floor 120 to 110 EUR (AC2), bonus age 25 to 26 (AC3), returns segment not drawn (AC5), table returns column +1 cent (AC5), `aria-invalid` removed (AC6), live delay 700 to 0 ms (AC7), note text shortened (AC8). Survivor: Kinderzulage cap 300 to 310 EUR is not caught by e2e (AC3 uses c = 300 exactly); covered by the developer's `zulage.test.ts` (c = 6.840, k = 10), as the design intends.

**Probes, checked, OK (not kept):** chart token contrast measured with a tool: light 6.70 / 5.02 / 6.17 / 6.54, dark 7.84 / 8.68 / 8.44 / 6.92 (contributions / Zulagen / returns / loss vs surface; all above 3:1, matches the UX figures); forced colours (solid / striped / hollow / dashed still distinct, loss dashed; screenshot `screenshots/013/forced.png`); dark mode renders; 375 px and 320 px with 52 years at 570 EUR / 20 %: no sideways page scroll; hostile and odd input in the contribution field (`<img onerror>`, 400 digits, `1e2`, full-width digits, `150 €`, `+5`, `0,005`): all flagged invalid, no NaN / Infinity; contribution 0 shows the empty-chart text; return -10 % shows the loss legend and a negative returns figure; Enter in a field does not reload the page. Screenshots: `screenshots/013/` (forced.png, dark.png, w375.png, w320.png).

**Defects:** none.

**Verdict: PASS.**

**Regression after review round 1 (tester, 2026-11-07)**

- Changed since the round-1 run: (a) `InputForm.tsx` `inputModeFor`: fields with `min < 0` use `inputMode="text"` (only the return field), review finding 1; (b) `e2e/avd.spec.ts` AC5 test: removed the "higher costs never raise the end value" block (review nit 3). The unit grid in `project.test.ts` (lines 64–66) covers that property. The rest of the AC5 test is unchanged. Test count unchanged: 9 tests in `avd.spec.ts`.
- `npm run test:e2e -w apps/avd`: 50 passed, 0 failed (9 avd + 41 platform sign-in specs).
- `npm run verify -w apps/avd`: exit 0. Typecheck, lint, format, 70 unit tests passed, build, `check:dist` ok (avd).
- Gap, not covered by any test: the `inputMode` attribute itself (finding 1). The fix is checked by review only. A one-line e2e assertion (return field `inputmode="text"`, costs `inputmode="decimal"`) would close it; not added, since the run was scoped to the two changes.
- Verdict: PASS.

**Manual checks (gate 2, 2026-11-07)**

- Typing a negative return on a real iPhone: not run. hak approved the commit at gate 2 without answering this check;
  it stays open.
- VoiceOver announcing the end value on a real device: not run, open for the same reason. Both are only checked in
  emulated browsers (Playwright) so far.

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

**Round 1, reviewer 2026-11-07. Verdict: APPROVED. Checklist version: 2**

| Item | Result | Note                                                                                                                                                                                                                                                                                                                                                    |
| ---- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1   | pass   | AC1 defaults `fields.ts` → `InputForm`; AC2/AC3 `zulage.ts` → `ResultSummary` details; AC4 `project.ts` (one `Math.round` per row, returns derived); AC5 `YearTable`/`BalanceChart`; AC6 `parseInputs` + `projection === null`; AC7 live region + `aria-describedby`; AC8 note. Each traced to its e2e test in `e2e/avd.spec.ts`, all 9 green in my run |
| C2   | n.a.   | no network call or pending state (the only timer is the live-text debounce)                                                                                                                                                                                                                                                                             |
| C3   | pass   | `useSettledValue`: deps `[value, delayMs]`, `clearTimeout` cleanup; everything else derived during render, only raw strings and `edited` in state                                                                                                                                                                                                       |
| C4   | n.a.   | no render loop or imperative controller; SVG is declarative                                                                                                                                                                                                                                                                                             |
| C5   | n.a.   | no reducer                                                                                                                                                                                                                                                                                                                                              |
| C6   | n.a.   | no I/O; the only `throw` in `project()` is unreachable after `parseInputs` (payout > age)                                                                                                                                                                                                                                                               |
| S1   | pass   | no `dangerouslySetInnerHTML`; input text is only echoed back into its own `value`, errors don't quote it; hostile strings probed (`<img onerror>`, 400 digits, Arabic and full-width digits, `0b1`, `1_000`, `5e`, U+2010) all `format`/`range`, regexes linear                                                                                         |
| S2   | pass   | only `playwright.config.ts` changed (`signedInContent`), no env or secret                                                                                                                                                                                                                                                                               |
| S3   | n.a.   | no `package.json` change                                                                                                                                                                                                                                                                                                                                |
| S4   | n.a.   | no dev-only code; `check:dist` ok for avd                                                                                                                                                                                                                                                                                                               |
| S5   | n.a.   | no script, template or generated code touched                                                                                                                                                                                                                                                                                                           |
| T1   | pass   | `npm run verify` run by me: green (exit 0, avd 70 unit tests, check:dist ok); `npm run test:e2e -w apps/avd`: 50 passed                                                                                                                                                                                                                                 |
| T2   | fail   | findings 3 and 4 (nits)                                                                                                                                                                                                                                                                                                                                 |
| T3   | pass   | AC4 oracle exact; AC5 pixel check counts token-coloured pixels per series and the "equals after restore" direction carries weight (same element size); closed-form unit oracle independent of the loop; no vacuous fixtures                                                                                                                             |
| T4   | pass   | Tab until focused (no counted sequence), no coordinates, no motion; every test named after its AC                                                                                                                                                                                                                                                       |
| T5   | pass   | parsing, Zulage bands, projection, tick/label selection and the debounce all have unit tests; error-copy mapping is shown per field in e2e AC6                                                                                                                                                                                                          |
| K1   | pass   | matches the design and ADR 0007 (integer boundary, float balance, round once); the nine deviations are in Implementation notes; no dead code beyond fields fixed by the design's types (`Bar.age`, `grundCents`)                                                                                                                                        |
| K2   | pass   | no `any`, no `!`; optional props `?: T \| undefined`; named exports; one component per file; tests next to the code                                                                                                                                                                                                                                     |
| K3   | pass   | colours only via tokens (token test green), system colours only in forced-colours blocks; transition uses `var(--duration)`; `calc()` over tokens; `1.5em` and `10px` follow the existing platform callout pattern                                                                                                                                      |
| K4   | n.a.   | no platform or factory file changed (agent memory only)                                                                                                                                                                                                                                                                                                 |
| K6   | pass   | story `in-review`, index row `in-review`                                                                                                                                                                                                                                                                                                                |
| K7   | pass   | hak's answers through "Ja, alle passen" and the scope decision are logged; no new decision since                                                                                                                                                                                                                                                        |
| K8   | fail   | finding 2 (tech-writer step, follows this review)                                                                                                                                                                                                                                                                                                       |
| K9   | pass   | prettier check green in verify                                                                                                                                                                                                                                                                                                                          |
| K10  | n.a.   | no workspace script or tsconfig changed                                                                                                                                                                                                                                                                                                                 |
| K11  | n.a.   | no env variable added                                                                                                                                                                                                                                                                                                                                   |
| A1   | pass   | six `<label for>` inputs, form named "Eingaben", errors in `aria-describedby`, `aria-invalid` only while invalid, focus never moved, scroll wrapper focusable with inset outline; mobile keypad issue in finding 1                                                                                                                                      |
| A2   | pass   | invalid = 2 px border + icon + text; series solid / stripes / hollow / dashed, checked on `screenshots/013/forced.png`; chart token pairs in `PAIRS` (NON_TEXT), text uses existing platform pairs                                                                                                                                                      |
| A3   | pass   | one `aria-live="polite"` `<p>`, mounted empty in every state, filled after the first edit, debounced 700 ms; no animation, the one transition uses `var(--duration)` (0 s under reduced motion)                                                                                                                                                         |
| A4   | n.a.   | no render loop or canvas; at most 52 × 3 static `<rect>`                                                                                                                                                                                                                                                                                                |

Findings:

1. `[minor] apps/avd/src/features/saving/InputForm.tsx:41` - `inputMode="decimal"` on "Erwartete Rendite pro Jahr": the iOS decimal keypad has no minus key, so the allowed negative returns (-10 to 0 %) can't be typed on an iPhone without an external keyboard (UX §4 asked for `decimal`). Fix: `inputMode="text"` for fields whose `FIELD_SPECS[field].min < 0` (only `returnPct`), or keep `decimal` and say in the hint how to enter a negative value. Input for the ux-designer.
2. `[minor] apps/avd/README.md:4`, `CHANGELOG.md` - the README still says the app shows `src/Content.tsx`, and the CHANGELOG has no entry for the calculator. This is the tech-writer step that follows the review (already noted under Implementation notes, open points).
3. `[nit] apps/avd/e2e/avd.spec.ts:234-243` - the e2e check that higher costs never raise the end value repeats the cost grid in `project.test.ts:55`. The design names the unit grid as the only test ("Cost monotonicity is the unit property above"), and three points in e2e add nothing. Fix: drop the e2e block.
4. `[nit] apps/avd/src/features/saving/useSettledValue.test.ts` - the same debounce path is shown by e2e AC7 with `page.clock` (empty at 300 ms, filled after 800 ms). The design asked for both. This is input for the architect: one level is enough (the e2e, as the rebuild oracle).
5. `[nit] .claude/agent-memory/ux-designer/MEMORY.md:50` - the new lesson starts "Spacing/space of Prettier", which is garbled, and it sits above the story-009 spinner line, which breaks "newest last". Fix: reword it, for example "Wide markdown tables: ask the caller to run `npx prettier --write` (no shell) (story 013)", and move it to the end.

Checked, OK: I recomputed the reference example independently (balance 2.225.644,48 cents → 22.256,44 €). Zulage edges are right: 9,99/10/30 €; c = 300 with 2 children → 750 €; the bonus needs both age < 25 and c ≥ 120. The bonus is credited in January of year 2 (row 2 shows 950 €). The last Zulage is added after month 12 and earns no returns. The worst case (18 → 70, 570 €, 10 children, 20 %) gives 7,18 · 10^10 cents, which is a safe integer, and the ticks come out at 0 / 200 / 400 / 600 / 800 Mio. €. For 0,01 € over one year at -10 %, the end value is 0,11 €, the returns are -0,01 € and the tick step is 1 €. Typing states parse as intended: `5,`, `,5`, `-,5` and `−0,5` (U+2212) are accepted, `-,5` for the contribution is a range error, and `-0,00` gives 0. In forced colours with return -10 %, the loss overlay hides the Zulagen stripes once the balance is below own contributions. That is the documented design (Risk 8), not a defect. The memory lessons of the architect, the developer and the tester are correct: payout = age is only reachable from age 65 on, and an element screenshot is clipped to the element's box.

## Explanation

The new app projects a subsidised Altersvorsorgedepot from today's age up to the chosen payout start (65 to 70).
You enter age, payout start, monthly contribution, children, expected return and costs; everything updates while typing.
The state Zulagen follow the adopted law: 50 % on the first 360 EUR a year, 25 % up to 1,800 EUR, at most 540 EUR,
plus up to 300 EUR per child and a one-time 200 EUR bonus under 25; below 120 EUR a year there is nothing.
Each year's Zulage arrives in January of the next year; the last one is added at payout start.
The result shows own contributions, Zulagen, returns and end value; a yearly table and a bar chart show the course.
Money is kept in whole cents and rounded once per shown value, so the three parts always add up to the end value.
The reference case (age 57, 150 EUR a month, 5 % return, 0.5 % costs) gives 22,256.44 EUR, checked three times.
Invalid input is named at the field with its allowed range, and the result is hidden until it is fixed.
A note says the figures are a model calculation, not investment or tax advice, and that eligibility is assumed.
Changed after review: the return field now shows a keyboard with a minus key on iPhones.
Risks: the rules come from the committee text of March 2026, not the published law gazette; taxes are not included.
Not verified: a real iPhone or screen reader (only emulated in the browser), and the exact Zulage payment dates.

## Retrospective

### What went wrong

1. **Gate 1 needed a second round.** The first draft modelled a generic depot because nobody knew which product
   "Altersvorsorgedepot" meant. hak named the subsidised depot from 2027 and asked for research; the story was then
   rewritten. Root cause: the orchestrator passed a domain idea to the product owner (no web access) without
   researching the real-world rules first.
2. **`/feature` could not be started from a next-step button.** The button said "Ja, umsetzen" without the slash
   command, and the workflow skills only start on hak's own command. Root cause: orchestrator wording, not a
   factory gap (lesson kept in the orchestrator's own memory).
3. **Review round 1 (APPROVED, 2 minor, 3 nits).** Main finding: the UX design asked for `inputMode="decimal"` on a
   field that allows negative values, and the iOS decimal keypad has no minus key. Root cause: no convention.
   Also: an e2e check duplicated a unit property (the design's test set said unit only), the app README was stale
   until the docs step, and one UX memory line was garbled. All fixed after approval; tester regression PASS
   (50 e2e, 70 unit). The `inputMode` fix has no pinning test (not an AC; accepted).
4. **Two tester mutants survived at first** (missing returns segment, table off by one cent); the tester closed both
   gaps before reporting. No defect reached review.
5. The product owner could not rename the story file (no move tool); the orchestrator renamed it.

### Proposed changes

- **P1** `CLAUDE.md`, Conventions: "A text input whose allowed range includes negative values uses
  `inputMode="text"`; iOS numeric/decimal keypads have no minus key." (reviewer)
- **P2** `CLAUDE.md`, Conventions: "Money in calculations: integer cents at module boundaries and string-based parsing
  of user input (no `parseFloat`); round only where the story's convention says, and derive the last part of a
  'parts sum to total' breakdown instead of rounding it separately." (architect)
- **P3** `.claude/skills/story` and `.claude/skills/feature`, step 1: "If the idea refers to real-world rules (a law,
  a product, a standard), the orchestrator researches primary sources first and passes them to the product owner;
  the story's Context cites them."
- **P4** `CLAUDE.md`, Test proportionality: "When a design has separate rules for the first and the last item (row,
  year), the minimal test set includes the case where both are the same item (N = 1)." (developer)
- **P5** `.claude/agents/tech-writer.md`: "When a story adds an app, update the root README sentence that lists the
  apps." (tech-writer)

**Outcome (gate 2, 2026-11-07):** hak: "Alle, dann committen". P1–P5 applied by `devops` (one run), diff reviewed by
the orchestrator: P1, P2 and P4 in `CLAUDE.md`, P3 in the `story` and `feature` skills, P5 in the tech-writer agent.

Agent-memory diffs checked: architect, developer, reviewer, tester and tech-writer lessons are correct; the garbled
ux-designer line was fixed in this story.

### Cost

| Role                        | Round | Model  | Tokens       | Tool uses | Duration |
| --------------------------- | ----- | ------ | ------------ | --------- | -------- |
| product-owner               | 1     | sonnet | 31302        | 8         | 0:41     |
| general-purpose             | 1     | opus   | 151625       | 43        | 5:42     |
| product-owner               | 2     | sonnet | n/a          | 4         | 0:59     |
| product-owner               | 3     | sonnet | n/a          | 12        | 0:19     |
| architect                   | 1     | opus   | 95112        | 19        | 6:44     |
| ux-designer                 | 1     | sonnet | 65362        | 8         | 3:09     |
| developer                   | 1     | opus   | 145958       | 48        | 10:00    |
| tester                      | 1     | sonnet | 101162       | 22        | 4:48     |
| reviewer                    | 1     | opus   | 145228       | 28        | 4:18     |
| developer                   | 2     | sonnet | 30365        | 5         | 0:28     |
| ux-designer                 | 2     | haiku  | 28164        | 4         | 0:13     |
| tech-writer                 | 1     | haiku  | 87831        | 15        | 1:15     |
| tester                      | 2     | haiku  | 55110        | 12        | 0:54     |
| devops                      | 1     | sonnet | 27526        | 5         | 0:31     |
| total (measured)            |       |        | 964745       | 233       | 40:01    |
| orchestrator (main session) |       | opus   | not measured | n/a       | n/a      |

The general-purpose row is the domain research before the story rewrite (law text and existing calculators). The
developer's first run and the opus review are the largest; the haiku and sonnet follow-ups stayed small.
