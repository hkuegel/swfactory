---
id: 049
title: The Vorabpauschale reserve earns interest on the deposit account
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: laz # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<app name>/docs/backlog)
size: S # S | M | L (story 026)
branch: feature/049-laz-interest-on-the-reserve
supersedes: [] # stories this one fully replaces
changes: [046/AC2, 048/AC3] # the parked money now includes the reserve; the statement shows its interest
superseded-by:
---

# 049 – The Vorabpauschale reserve earns interest on the deposit account

## Original request

> mir ist es halt aufegfallen weil wir direkt am Anfang noch 13k Reserver für die Vorabpauschale rumliegen haben.
> Das müsste doch etwas mehr ausmachen !?

> /feature laz Zinsen auf den ganzen Kontostand - bitte schlank umsetzen

## User story

As the depot owner, I want the cash reserve for the Vorabpauschale to earn interest like the money that waits for
the payouts, so that the account statement has no cash lying idle and the payout is not understated.

## Context

Story 048 shows the account statement. With the parking option on, only the money of a phase year earns interest
(046, `m(m + 1) / 24` year units). The reserve for the Vorabpauschale tax (13.664 € on hak's depot of 640.000 €)
sits on the same account from the purchase until it is used up, and earns nothing (048 kept that out). The
orchestrator's estimate: about 850 € gross, 615 € net over the term, about 8 € more payout per month.

## Acceptance criteria

- **AC1 (the reserve earns interest):** Given the parking option is on and the plan has a reserve, then each
  calendar year the reserve earns rate × (sum of the reserve balance at the start of each month) / 12, counted
  from the month after the purchase month; the January balance is already lowered by the Vorabpauschale paid on
  the first working day. The interest is credited at the end of the year, taxed by 048 AC1, and the net interest
  stays in the reserve and earns from the next year on. It is shown in the statement's interest and interest-tax
  columns, also in the years before the phase. Hand oracle: reserve 1.000,00 €, rate 2,40 %, purchase in November,
  no tax: interest of that year 2,00 € (December only).
- **AC2 (the depot uses it):** Given the tax case with a reserve and parking on, the reserve the depot holds is
  the smallest one that pays every Vorabpauschale, so the statement still ends at 0,00 € (rounding residue at most
  5 cents), and the monthly payout is higher than with the reserve earning nothing, by less than 0,5 %.
- **AC3 (nothing else moves):** Given the parking option is off, or the plan has no reserve (tax off or flat rate
  0 %), every figure equals the one of story 048 (048 AC6 pins, the 046 interest figures).

## Out of scope

- Changing the 046 rule for the money of a phase year; a Basiszins per year; interest on interest inside a year.

## Open questions

- None.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-16 — hak: "Zinsen auf den ganzen Kontostand", lean as in story 048 (orchestrator writes story, review and
  docs; one developer and one tester run on Sonnet).
- 2026-11-16 — orchestrator: the whole balance is the phase-year money (046 rule unchanged) plus the reserve; only
  the reserve is new, so 046 and 048 figures stay where there is no reserve (AC3).

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_No new control: the existing parking option and rate apply; the figures appear in existing statement columns._

## Technical design

_developer (lean process): short design note._

## Implementation notes

_developer: what was built, deviations from the design and why._

## Test report

_tester: AC → test mapping, results, defects found._

| AC  | Test(s) | Result |
| --- | ------- | ------ |

## Explanation

_orchestrator: plain-language explanation shown at gate 2, at most 15 lines of at most 120 characters. No code, no file names._

## Retrospective

_orchestrator._
