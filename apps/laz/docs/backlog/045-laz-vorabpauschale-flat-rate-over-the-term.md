---
id: 045
title: The flat rate for accumulating funds (Vorabpauschale) is a parameter, constant over the term
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: laz # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<app name>/docs/backlog)
size: M # S | M | L (story 026). S = at most three ACs: needs only the Explanation, no Review section and no Cost table.
branch: feature/045-laz-vorabpauschale-flat-rate-over-the-term
supersedes: [] # stories this one fully replaces, e.g. [004]
changes: [024/AC3, 024/AC4, 031/AC3, 032/AC2] # the tax case gains a second tax base: the round trip and the tax at liquidation, the four tax states, and the parts that add up to the depot
superseded-by: # set on the OLD story when a newer one replaces it
---

# 045 – The flat rate for accumulating funds (Vorabpauschale) is a parameter, constant over the term

## Original request

> "nächste story für laz/bond ladder
>
> bei thesaurierenden Fonds muss (im Steuerfall) ein Vorsteuerpauschale gezahlt werden. Recherchiere das und
> baue das entsprechend ein. Die Vorsteuerpauschale nehmen wir über die Laufzeit als konstant an (Parameter,
> Vorbelegung der aktuelle Wert)" (hak, 2026-11-15)

Hak's word is `Vorsteuerpauschale`. The term the law uses for what he means is **Vorabpauschale**
(§ 18 InvStG); `Vorsteuerpauschale` is the colloquial name the depot statements use (UStG § 24's
Vorsteuerpauschale is the agricultural flat rate and has nothing to do with funds). Hak chose the legal term
for the UI, so the UI says `Vorabpauschale` and the explanatory text names the colloquial word once.

`size: M` because the story moves one behaviour in five places that only work together: the field, the yearly
base, the credit at liquidation, the depot, and the fund table's column. A one-AC story could not add the
flat rate without changing the tax rule of story 024, which is exactly what this story does.

## User story

As the depot owner, I want the plan to show what the accumulating funds cost me in tax every year — not only
the tax at the end — so that I know which money leaves the plan during the term, and so that the same base is
not taxed twice.

## Context — the research (2026-11-15)

- The flat rate is the **Vorabpauschale** of § 18 InvStG, introduced with the 2018 investment tax reform. It
  is a fictitious minimum annual earning for (partially) accumulating public funds, taxed every year even
  when nothing is paid out. It applies to accumulating and partially distributing funds, not to a fund that
  distributes more than the flat rate.
- The base per calendar year: **value of the share at the start of the year × 70 % × Basiszins** (the 70 % is
  the Bewertungsabschlag that covers the fund's internal costs). Distributions of that year reduce it to
  zero. It cannot be negative, and it is capped at the year's actual value increase.
- The Basiszins is published by the BMF for each year (the Bundesbank derives it from public bond yields on
  the first trading day of the year): 2023 = 2,55 % → 1,785 %; 2024 = 2,29 % → 1,603 %; 2025 = 2,53 % →
  1,771 %; **2026 = 3,20 % → 2,24 %** (BMF letter of 13.1.2026). Hak wants one constant rate over the term,
  prefilled with the current value: **2,24 %**.
- The tax on the flat base is the normal capital gain tax: 25 % plus 5,5 % of that as Solzzuschlag
  (26,375 %), plus church tax on the capital gain tax where it applies — the rates story 031 already models.
- The payment for a year is due on the first business day of the following year (for 2026: 4.1.2027), and the
  bank debits it from the settlement account (Verrechnungskonto), not from the fund. A flat rate already paid
  is credited when the share is sold: the sale gain is reduced by the flat bases of the earlier years, so the
  same base is never taxed twice.
- For the ladder this matters every year: the projection of story 024 (ADR 0012) compounds the YTM with no
  distribution, so every fund row is an accumulating fund, and the flat rate applies in every calendar year
  the fund is held — except the year it is dissolved, which hak excluded on 2026-11-15.
- The fund is bought "now", so the months before the purchase count for the first partial year: § 18 InvStG
  reduces the base by 1/12 for every whole calendar month before the month of acquisition. The app's asOf
  month is the month of acquisition (story 032 buys at the data file's NAV).
- Teilfreistellung: an accumulating bond fund is a "sonstiger Fonds" (below 25 % equity), so **0 %** — hak's
  answer of 2026-11-15. The Sparer-Pauschbetrag stays out of the model (his answer), which means the tax case
  in this app means: tax on, no deduction.

## Acceptance criteria

- **AC1 (the parameter):** Given the tax case is on, then the tax block has a field for the flat rate with the
  copy of UX §2, prefilled with `2,24`, and its hint says the rate is constant over the whole term; the value
  is read as whole hundredths of a percent (2,24 % is 224), with the rule of a percent field. Given the
  Kapitalertragsteuer checkbox is off, the field is still shown and its copy says it counts only in the tax
  case, and no flat-rate tax is calculated anywhere.
- **AC2 (the base of a year):** For one fund, the flat base of a calendar year is the fund's value at the
  start of that year — the data file's value grown at YTM, on the projection's day-count path (ADR 0012) —
  times the flat rate, and the first partial year is reduced by 1/12 for every whole calendar month before the
  month of acquisition. The base cannot be larger than that year's actual increase, and a year whose increase
  is not positive pays nothing. The year of liquidation does not count. Hand oracle, fund NAV 100 €, YTM 5 %,
  asOf 1.1.2025, fund year 2027, rate 2,24 %, tax 26,375 %: 2025 base 2,24 € → 0,5908 €; 2026 base 2,352 € →
  0,62034 €; sum 1,21114 €. Month case, asOf 1.7.2025 (six whole months before the acquisition month): base
  1,12 € → 0,2954 €. Cap case, YTM 1 %: base 2,24 € capped to the year's increase of 1,00 € → 0,26375 €.
  Negative YTM: pays nothing.
- **AC3 (no base is taxed twice):** In the tax case the tax at liquidation is computed on the gain **minus**
  the flat bases already taxed in the earlier years, so the flat-rate payments plus the liquidation tax equal
  the rate times the whole gain. On the hand oracle of AC2: whole gain 15,7625 €, bases 4,592 €, remaining
  gain 11,170,5 €, liquidation tax 2,946219375 €, payout per share 112,816280625 € → `112,82 €`; total tax
  4,157359375 € = 26,375 % of 15,7625 €. The fund's own figure is not reduced by the yearly payments, because
  the money for them comes from the settlement account (hak's answer of 2026-11-15). Story 024 AC4 (taxed
  payout = NAV + (1 − r) × gain) holds while the flat rate is 0.
- **AC4 (what the UI shows):** The fund table shows, per fund, the flat-rate tax over the years that fund is
  held, as its own column, and the fund section states the sum over the funds once. A fund outside the tax
  case, or a fund with no year that pays, shows the dash with its reason; a fund outside the phase keeps the
  reason strings of story 032. The copy says once that the payment for a year falls on the first business day
  of the next year, that the year of liquidation does not count, and that the money comes from the
  Verrechnungskonto.
- **AC5 (the depot):** The yearly payments belong to the depot the plan searches for (hak's answer of
  2026-11-15), so `D = P · F + cash` and `P = (D − cash) / F`, where `cash` is the flat tax of the funds that
  fund a phase year, undiscounted. The round trip of story 024 AC3 holds while the flat rate is 0, and in the
  tax case the parts shown in the fund table — the purchase parts and the flat parts — add up to the shown
  depot (story 032 AC2, extended: the last part is derived from the total).

## Out of scope

- A per-year table of the payments: AC4 shows one figure per fund, not one per calendar year. A table that
  names each year's payment and the year it is due in is a story of its own.
- Interest on the yearly payments before they fall due: they are shown undiscounted, because they are money
  that leaves the plan, not money that is invested.
- Negative Basiszins, a per-year Basiszins, the Sparer-Pauschbetrag, Teilfreistellung above 0 %,
  distributing funds, and the 1/12 rule for a fund bought after the start of a year other than through the
  asOf month: the model takes one constant rate as hak asked.
- The fund data file and its writer: no new field in `data/fund-list.json`, the rate is a UI parameter.
- Changing the projection convention of ADR 0012 (annual effective compounding, ACT/365). AC3 changes only
  which part of the gain the tax at liquidation reads.

## Open questions

_None open: every question asked at gate 1 on 2026-11-15 is answered in the Decision log._

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be rebuilt without the chat.
Append only._

- 2026-11-15 — hak's request (verbatim above): the accumulating funds pay a flat-rate tax in the tax case, the
  rate is assumed constant over the term as a parameter, prefilled with the current value.
- 2026-11-15 — hak's answer (UI word): `Vorabpauschale`, the legal term of § 18 InvStG. The colloquial
  `Vorsteuerpauschale` is named once in the explanatory text.
- 2026-11-15 — hak's answer (where the money comes from): the settlement account. The fund's own value is not
  reduced by the payment, so the fund's figure at liquidation stays the fund's figure.
- 2026-11-15 — hak's answer (the parameter): the flat rate as a percent of the value at the start of the year,
  prefilled with `2,24` % (70 % × the Basiszins of 2026), constant over the term.
- 2026-11-15 — hak's answer (deductions): no Sparer-Pauschbetrag, no Teilfreistellung; an accumulating bond
  fund has 0 % Teilfreistellung.
- 2026-11-15 — hak's answer (Q1, the depot): the yearly payments are folded into the depot the plan searches
  for, so AC5 exists; the shown depot includes the payments.
- 2026-11-15 — hak's answer (Q2, the first partial year): whole months, as § 18 InvStG counts them
  (1/12 for every whole calendar month before the acquisition month), not the ACT/365 day fraction.
- 2026-11-15 — hak's answer (Q3, where it is shown): a column in the fund table plus the sum over all funds
  in the fund section, not a table per calendar year.
- 2026-11-15 — hak's answer (Q4, the liquidation year): the year of liquidation does not count; the fund is
  gone on 31.12. and no flat rate is computed for that year.
- 2026-11-15 — hak's answer (Q5, double taxation): the flat bases already taxed are credited against the tax
  at liquidation, so no base is taxed twice; this moves the rule story 024 AC4 gave, which is why AC4 is
  listed in `changes:`.
- 2026-11-15 — orchestrator's decision (recorded at gate 1, hak did not object to it as a question): the
  percent value is stored in whole hundredths of a percent (2,24 % = 224), the unit the percent field of
  story 033 reads, and the field keeps the rule of a percent field (0 to 100 %), because a rate that belongs
  to what the value means has a bound of its own (story 030). The tax rates stay in millionths of a percent.
- 2026-11-15 — orchestrator's decision: the flat base path uses the projection's day count for the value at
  the start of a year, so the bases of the counted years stay a part of the gain the tax at liquidation reads
  (AC3's equality cannot break). Only the fraction of the first partial year follows the whole-month rule.
- 2026-11-15 — orchestrator's decision: `cash` is the flat tax of the funds that fund a phase year only,
  because a fund outside the phase is not bought and its money is not part of the depot. A fund outside the
  phase shows no flat figure, for the same reason story 032 AC3 gives.
- 2026-11-15 — orchestrator's decision: the flat field is prefilled with `2,24`, so the existing hand values
  of the tax case in the e2e specs and the unit tests are kept by typing `0` in the flat field in those
  cases; the new hand values are the ones of AC2 and AC3.

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

To be written after gate 1.

### Copy (exact strings)

To be written after gate 1.

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

To be written after gate 1.

## Implementation notes

_developer: what was built, deviations from the design and why._

To be written after gate 2 is granted.

## Test report

_tester: AC → test mapping, results, defects found._

To be written after gate 2 is granted.

## Review

_reviewer: findings against the checklist; the rounds are recorded here._

To be written after gate 2 is granted.

## Explanation

_The section hak reads at gate 2, at most 15 lines of at most 120 characters._

To be written after gate 2 is granted.

## Retrospective

_orchestrator: what went wrong (review rounds, defects, corrections at the gates), proposed changes to
agents/CLAUDE.md/templates, and which ones hak approved. Include a `### Cost` table (see the retro step of
`/feature`)._

To be written at the end.
