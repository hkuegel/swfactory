---
id: 007
title: Minesweeper redesign, a nicer look of the 2D UI
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
branch: feature/007-minesweeper-redesign
supersedes: []
changes: [] # no AC of 005 or 006 changes its wording; only their visual spec (UX design) is replaced, see Context
superseded-by:
---

# 007 – Minesweeper redesign, a nicer look of the 2D UI

## Original request

> ich hätte gerne ein schönere UI.
> Und zwar eine schönere Version der jetzigen UI, plus einen zusätzlichen 3D Modus (umschaltbar, auch während des Spiels)

Note: this is one request (hak, 2026-11-02, German) that covers two parts. This story is part (a), the nicer version of the current UI. Part (b), the switchable 3D mode, is story [008](008-minesweeper-3d-mode.md). hak confirmed the split at gate 1.

## User story

As a player, I want the app and the Minesweeper game to look more attractive and consistent, so that playing is more pleasant, without anything working differently.

## Context

Requested by hak on 2026-11-02 in German; the app language stays English like all copy so far.

What exists today: a login screen (stories [001](001-login.md), [004](004-guest-login.md)), and once signed in a header ("Signed in as …", "Sign out") above the Minesweeper of [005](005-minesweeper.md) and [006](006-minesweeper-presets-timer.md): setup form with presets, status bar (counter, timer, result message) and a board in the classic bevelled grey style. Light and dark colour scheme follow the system.

This story is a pure visual refresh. The behaviour of 005 and 006 does not change:

- All ACs of 005 and 006 keep holding, with the same visible texts, button names, labels and cell accessible names as in their UX designs (copy sections). They are the regression oracle: the existing e2e tests must pass without changes to their expectations.
- No AC of 005 or 006 changes its wording, so there is no `changes:` link. What is replaced is the visual spec in their UX designs (colours, bevels, sizes). The UX design of this story takes over that part; accessibility values of 005/006 (contrast, target sizes, forced-colours behaviour) are the floor, not a ceiling.

Constraints confirmed by hak at gate 1 ("Ja, alle Vorschläge", 2026-11-02). They are constraints unless an AC says otherwise:

- **Visual direction (called "the chosen direction" in the ACs):** modern and calm: rounded corners, one accent colour on a neutral palette, the game inside a soft panel with a clear heading hierarchy, slightly softer cell shapes with a gentle raised look for hidden cells; the classic grey bevel is retired.
- **Scope:** the whole app: login view, signed-in header and the game.
- **Colour scheme:** light and dark keep following the system; no manual switch.
- **Fonts:** the system font, no downloaded web fonts.
- **Motion:** small transitions (hover, reveal, flag) of at most 200 ms, off under reduced motion (AC6).
- **Sizes:** cells 32 px on screens of 600 px and wider and fluid from 24 px below, as in 005.

"Nicer" is subjective. Acceptance therefore has two layers (both confirmed by hak at gate 1):

- **Automated (the ACs below):** consistency, no behaviour change, contrast, accessibility, responsiveness, motion.
- **Visual sign-off by hak at gate 2**, on screenshots of the key states against the chosen direction. A look that passes all ACs but does not match the chosen direction is not accepted. The UX design of this story must list the screenshot states; the proposed minimum is: login view; signed in before the first "Start"; a game in progress with revealed cells and flags; a lost game; a won game; the setup with an error shown; each in light and dark, plus the game in progress at 375 px width.

Relation to other stories:

- [008 – 3D mode](008-minesweeper-3d-mode.md) depends on this story: the 3D look builds on the visual direction chosen here.
- [002](002-login-microsoft.md) and [003](003-stay-signed-in.md) are drafts and not affected, except that a later login button would follow the same look.

## Acceptance criteria

- **AC1:** Given the redesigned app, when I exercise every behaviour of [005/AC1–AC10](005-minesweeper.md) and [006/AC1–AC5](006-minesweeper-presets-timer.md) (and the login behaviour of [001](001-login.md) and [004](004-guest-login.md)), then each holds exactly as before, with the same visible texts, labels, button names and cell accessible names, the same tab order and the same keyboard and touch gestures.
- **AC2:** Given any screen of the app (login view, signed-in view before the first "Start", during a game, after a win and after a loss, with a setup error shown, and every loading or error state that exists today), when I look at it, then all of it follows the chosen direction consistently: one font family for all text (the system font), one corner radius for all buttons and inputs, one fill colour for primary actions ("Start", sign-in buttons) and one outlined style for secondary actions (presets, "Sign out"), and the colours of messages (error, won, lost) are the same wherever they appear.
- **AC3:** Given either colour scheme (light and dark, as set by the system), when I look at any state of AC2, then all text has a contrast of at least 4.5:1 against its background, all non-text elements that carry meaning (input borders, cell edges against the page, flag and mine glyphs, the focus ring) at least 3:1, and each digit 1 to 8 on a revealed cell at least 4.5:1; and in forced-colours mode (Windows high contrast) every cell state stays distinguishable.
- **AC4:** Given the board, when I look at hidden, flagged, revealed empty, revealed numbered, mine, exploded mine and wrong-flag cells, then each state differs from the others by shape (raised or flat, flag glyph, mine glyph, a mark on the wrong flag, the digit) and not by colour alone; and every interactive element, including the focused cell, shows a visible focus indicator of at least 2 px; and cells are at least 24 px and fields and buttons at least 40 px high.
- **AC5:** Given viewport widths of 320, 375 and 800 px (and 200 % zoom at 320 px), when I show boards of 9 × 9, 16 × 30 and 30 × 30, then the page itself never scrolls sideways, only the board scrolls inside its own box when it is wider than the screen, and setup, status bar and messages stay fully visible and operable without overlapping.
- **AC6:** Given I have set the system to reduce motion, when I reveal, flag, hover or press anything, then nothing animates or transitions; and given normal motion settings, when anything transitions, then each transition lasts at most 200 ms, nothing loops or flashes, and the new state of a cell is already readable by assistive technology immediately (not after the transition).

## Out of scope

- The 3D mode: story [008](008-minesweeper-3d-mode.md).
- Any change of behaviour, rules, texts, copy or ranges of 001, 004, 005 and 006.
- A manual light/dark switch (the schemes keep following the system); it would be its own story.
- New features: sound, themes selectable by the player, new board sizes, animations that carry information.
- Branding such as a logo or custom illustrations.
- Translating the app.
- Larger cells than in 005 (a separate decision).

## Open questions

None.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-02 — Story created from hak's request (German, kept verbatim) as part (a) of a two-part request. "Schönere UI" read as a visual refresh of the whole current UI with unchanged behaviour (assumption). ACs written for consistency, no regression, contrast in both schemes, non-colour cues, responsiveness and motion; the taste decisions were Open questions 1 to 7 with proposed defaults. No `changes:` link because no AC wording of 005 or 006 changes. 6 ACs. Status draft. (product-owner)
- 2026-11-02 — Q1: Split into 007 (redesign) and 008 (3D), 008 after 007? — A: "Ja, alle Vorschläge" (hak, gate 1) = yes, split, 007 first. Consequence: two stories; 008 depends on 007.
- 2026-11-02 — Q2: Which visual direction? Proposed: modern and calm (rounded corners, one accent colour on a neutral palette, game in a soft panel with clear heading hierarchy, gentle raised look for hidden cells, classic grey bevel retired). — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: constraint in Context, "the chosen direction" in AC2.
- 2026-11-02 — Q3: How much of the app? Proposed: the whole app (login view, header, game). — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: constraint in Context; AC2 covers every screen.
- 2026-11-02 — Q4: Colour scheme control? Proposed: keeps following the system, no manual switch. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: constraint and Out of scope; AC3 covers both schemes.
- 2026-11-02 — Q5: Motion? Proposed: transitions of at most 200 ms, off under reduced motion. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: AC6.
- 2026-11-02 — Q6: Fonts? Proposed: system font, no web fonts. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: constraint in Context; AC2 (one font family).
- 2026-11-02 — Q7: Sizes? Proposed: cells 32 px on wide screens, fluid down to 24 px below 600 px, as in 005. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: constraint in Context; AC4 and AC5 unchanged.
- 2026-11-02 — Scope decision: hak signs off screenshots of the key states at gate 2 (my proposal of the two acceptance layers). — A: "Ja, alle Vorschläge" (hak, gate 1) = accepted. Consequence: stated in Context; the UX design must list the screenshot states (proposed minimum there). Open questions now empty; status ready. (product-owner)

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes. Must list the screenshot states for hak's gate 2 sign-off (Context)._

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

## Retrospective

_orchestrator: what went wrong (review rounds, defects, corrections at the gates),
proposed changes to agents/CLAUDE.md/templates, and which ones hak approved._
