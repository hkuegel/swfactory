---
id: 024
title: Lebensarbeitszeitkonto iBonds payout phase, both directions (projection)
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
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
