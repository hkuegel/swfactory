---
id: 017
title: Altersvorsorgedepot chart with solid colours instead of stripes
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: avd # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<name>/docs/backlog)
branch: feature/017-avd-chart-solid-colours
supersedes: []
changes: [] # no AC of 013 to 016 names stripes or patterns; only the UX design visual specs (013 §5/§8, 015 §5/§8) are replaced, see Context
superseded-by:
---

# 017 – Altersvorsorgedepot chart with solid colours instead of stripes

## Original request

> 1. hak, 2026-11-08: "Die Farbgestaltung beim Balkendiagramm gefällt mir nicht, wilr sollten nicht "gestreifte" Balen nehmem, das ist unübersichtlich."
> 2. hak's slash command, 2026-11-08: "/feature Diagramm ohne Streifen"

## User story

As a saver looking at the balance chart, I want every part of the bars drawn in a plain, clearly different colour instead of stripes, so that I can read the chart at a glance.

## Context

- Related stories: [013](013-avd-saving-phase-zulagen.md) (chart, Zulagen striped, returns hollow, loss dashed hollow), [015](015-avd-reinvest-tax-refund.md) (reinvested refund as heavy framed stripes), [016](016-avd-etf-comparison.md) (the same message already split this chart change off, see its Decision log). 014/AC5 (no chart bar changes when only the tax rate changes) is unaffected: this story changes only how the bars look, not their size or position.
- Today the normal view uses patterns for identity: Zulagen striped (50 %), reinvested refund heavy framed stripes (75 %), positive returns hollow (pale fill, outline), loss hollow with a dashed outline. Only own contributions is solid. hak finds this cluttered.
- Why the patterns exist (orchestrator, 2026-11-08): in forced-colours mode (Windows high contrast) the system replaces all colours, so series can only be told apart by pattern, border or glyph. CLAUDE.md "Styling": every state cue also exists as a border, outline or glyph, so it survives forced colours.
- Proposed approach (orchestrator, accepted by hak at gate 1, see Decision log): solid, clearly distinct colours in the normal view (light and dark); stripes/patterns/outlines only in forced-colours mode, so that rule still holds.
- Series that can occur: own contributions, Zulagen, reinvested refund (only while checked, 015), returns, loss (negative returns, only if a year has a loss). The stacking order and the 1 px surface separator between stacked segments stay as they are.
- No AC of 013 to 016 names stripes or patterns, so there is no `changes:` link. Only the UX design visual specs are replaced: 013 UX §5 (series table) and §8 (token roles: "stripe colour", "outline of returns", "dashed outline of loss", "pale fills are decorative") and 015 UX §5 and §8 (heavy stripes, frame). The tech-writer/ux-designer must update those rows; this story does not edit them.
- Existing colour tokens are contrast-tested at 3:1 against the surface (013 UX §8); that rule continues to hold for the new fills.

## Acceptance criteria

- **AC1:** Given a result is shown (light and dark colour scheme, forced colours off), when the chart is displayed with the reinvestment checkbox unchecked and checked and with a negative return so that a loss segment occurs, then every segment of every series in the bars is filled with one uniform colour: no stripes, no pattern, no hollow (outline-only) look and no dashed outline; sampled pixels inside a segment, away from its edge, all have the same colour.
- **AC2:** Given the chart of AC1 shows all five series (own contributions, Zulagen, reinvested refund, returns, loss), when the fill colours are compared, then all five fills are pairwise different, each has at least 3:1 contrast against the surface in light and in dark scheme, and every pair of series that can sit next to each other in a bar differs by at least the minimum fixed in the UX design.
- **AC3:** Given the legend is shown, when its swatches are compared with the bars, then each swatch is one uniform colour equal to the fill of its series in the bars, the legend entries, their order and their texts are as in 013 and 015 (reinvested entry only while checked, loss entry only if a loss occurs), and no swatch has a pattern or dashed outline.
- **AC4:** Given forced colours are active (`forced-colors: active`), when the chart and legend are displayed (reinvestment unchecked and checked, with a loss), then every series can be told apart from every other series without relying on colour, by pattern, border or outline, in the bars and in the legend swatches, and no series is invisible against the canvas.
- **AC5:** Given any valid input, when the chart is displayed, then the figures, the per-year table, the comparison, the legend texts and the chart's text alternative are unchanged from 013 to 016, and for the same input the silhouette of the bars (position and height of every segment) is the same as before this story (014/AC5 still holds).

## Out of scope

- Any change of data, numbers, bar sizes, axes, grid, tick labels or text; a new chart type or additional series; a chart for the comparison (016).
- New colour-scheme modes beyond the existing light/dark and forced-colours handling.
- Editing the UX design sections of 013 and 015 (tech-writer/ux-designer follow-up, see Context).

## Open questions

None for hak.

- Exact minimum contrast between neighbouring series fills: decided by the UX designer (Decision log).

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-08 — Request: hak finds the striped bars unclear and wants no stripes (Original request 1); then started the feature with "/feature Diagramm ohne Streifen" (Original request 2). The same message was already split off from 016 as its own story (016 Decision log).
- 2026-11-08 — Orchestrator answered hak: the stripes exist for forced-colours mode (Windows high contrast), where all colours are replaced and series can only be told apart by pattern; proposed solid, clearly distinct colours in the normal view and stripes/patterns only in forced-colours mode. hak did not comment on the proposal when starting the slash command; it is kept as Open question 1 for gate 1, not as a confirmed decision.
- 2026-11-08 — hak: "Ja, alle passen" (answer to all four open questions, all bracketed proposals accepted). Decisions: (1) stripes/patterns only in forced-colours mode, solid colours in the normal view (light and dark); (2) the exact minimum contrast between neighbouring series fills is left to the UX designer; (3) all series solid, including positive returns and loss (loss in a clearly different colour, drawn over the stack as today); (4) forced-colours mode keeps today's shapes (solid / stripes / heavy framed stripes / hollow / dashed hollow).
- 2026-11-08 — Status set to ready.

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
