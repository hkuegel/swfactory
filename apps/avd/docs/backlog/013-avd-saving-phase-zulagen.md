---
id: 013
title: Altersvorsorgedepot saving phase with Zulagen (projection calculator)
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
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

- **AC1:** Given the app is opened, when the page has loaded, then the page shows the title "Altersvorsorgedepot", labelled inputs for age, payout start (age), monthly contribution, number of children, expected return per year in percent and costs per year in percent, each with a visible default (age 40, payout start 65, 150 EUR per month, 0 children, return 5 %, costs 0,5 %), and a result for those defaults is already shown.
- **AC2:** Given a valid age and payout start, when the monthly contribution is set to 0, 9,99, 10, 30, 150, 570 EUR (0 children, age 40), then the yearly Zulage shown is 0, 0, 60, 180, 540, 540 EUR respectively (below 120 EUR per year no Zulage at all; Grundzulage per the formula in Context, capped at 540 EUR).
- **AC3:** Given a valid monthly contribution of 25 EUR (c = 300) and 2 children, when age is 24 and when it is 25, then the yearly Zulage shown is 150 + 600 = 750 EUR in both cases and the one-time Berufseinsteigerbonus of 200 EUR is included in the first year's Zulage only for age 24; with 1 child and a monthly contribution of 9,99 EUR no Zulage and no bonus is shown (Kinderzulage = k · min(c, 300); bonus only if c >= 120).
- **AC4:** Given the reference example (age 57, payout start 65, 150 EUR per month, 0 children, 5 % return, 0,5 % costs), when the result is shown, then it displays own contributions 14.400,00 EUR, Zulagen 4.320,00 EUR, returns 3.536,44 EUR and end value 22.256,44 EUR (rounded to cent; convention in Context); own contributions, Zulagen and returns are each shown as a separate figure and their sum equals the end value; entering the same values again always gives the same numbers.
- **AC5:** Given a result is shown, when the user changes any input to another valid value, then the figures, the table and the chart update without a separate submit; a higher cost value never raises the end value (all else equal); a per-year table lists for every saving year the cumulative own contributions, cumulative Zulagen credited, cumulative returns and the balance at year end; a chart shows the balance split into these three parts over the same years and has a text alternative stating the end value and payout start, and the table gives the same data as text.
- **AC6:** Given any input, when its value is invalid (empty, not a number, negative, age or payout start not a whole number or outside the allowed range, payout start not after the age, monthly contribution above 570 EUR, number of children not a whole number or out of range, return or costs out of range; ranges: see Context), then that field shows an error naming the field and the allowed range, is marked invalid for assistive technology, the previous result is replaced by a hint that no result can be shown, and no NaN, Infinity or negative end value appears anywhere.
- **AC7:** Given the app is used with keyboard only, when the user tabs through the page, then every input is reachable and has a programmatic label, error messages are associated with their field, and the end value is announced politely (live region) when it changes after an edit.
- **AC8:** Given a result is shown, when it is displayed, then a note next to it states that the figures are model calculations based on the entered assumptions, not investment or tax advice, and that eligibility for the state subsidy is assumed; the app shows no buy/sell or product recommendation.

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
