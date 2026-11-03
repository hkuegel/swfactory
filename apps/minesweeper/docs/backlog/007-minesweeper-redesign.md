---
id: 007
title: Minesweeper redesign, a nicer look of the 2D UI
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
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

What exists today: a login screen (stories [001](../../../../docs/backlog/001-login.md), [004](../../../../docs/backlog/004-guest-login.md)), and once signed in a header ("Signed in as …", "Sign out") above the Minesweeper of [005](005-minesweeper.md) and [006](006-minesweeper-presets-timer.md): setup form with presets, status bar (counter, timer, result message) and a board in the classic bevelled grey style. Light and dark colour scheme follow the system.

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
- [002](../../../../docs/backlog/002-login-microsoft.md) and [003](../../../../docs/backlog/003-stay-signed-in.md) are drafts and not affected, except that a later login button would follow the same look.

## Acceptance criteria

- **AC1:** Given the redesigned app, when I exercise every behaviour of [005/AC1–AC10](005-minesweeper.md) and [006/AC1–AC5](006-minesweeper-presets-timer.md) (and the login behaviour of [001](../../../../docs/backlog/001-login.md) and [004](../../../../docs/backlog/004-guest-login.md)), then each holds exactly as before, with the same visible texts, labels, button names and cell accessible names, the same tab order and the same keyboard and touch gestures.
- **AC2:** Given any screen of the app (login view, signed-in view before the first "Start", during a game, after a win and after a loss, with a setup error shown, and every loading or error state that exists today), when I look at it, then all of it follows the chosen direction consistently: one font family for all text (the system font), one corner radius for all buttons and inputs, one fill colour for primary actions ("Start", sign-in buttons) and one outlined style for secondary actions (presets, "Sign out"), and the colours of messages (error, won, lost) are the same wherever they appear. Exception: the "Sign in with Google" button keeps Google's branded look (white in light, Google's dark theme in dark, Google's logo colours) and adopts only the shared corner radius, height, width and the system font.
- **AC3:** Given either colour scheme (light and dark, as set by the system), when I look at any state of AC2, then all text has a contrast of at least 4.5:1 against its background, all non-text elements that carry meaning (input borders, the edges of hidden and flagged cells against their surroundings, flag and mine glyphs, the focus ring) at least 3:1, and each digit 1 to 8 on a revealed cell at least 4.5:1; and in forced-colours mode (Windows high contrast) every cell state stays distinguishable. Revealed cells may use a decorative hairline edge; it is exempt from the 3:1 rule.
- **AC4:** Given the board, when I look at hidden, flagged, revealed empty, revealed numbered, mine, exploded mine and wrong-flag cells, then each state differs from the others by shape (raised or flat, flag glyph, mine glyph, a mark on the wrong flag, the digit) and not by colour alone; and every interactive element, including the focused cell, shows a visible focus indicator of at least 2 px; and cells are at least 24 px and fields and buttons at least 40 px high.
- **AC5:** Given viewport widths of 320, 375 and 800 px (and 200 % zoom at 320 px), when I show boards of 9 × 9, 16 × 30 and 30 × 30, then the page itself never scrolls sideways, only the board scrolls inside its own box when it is wider than the screen, and setup, status bar and messages stay fully visible and operable without overlapping.
- **AC6:** Given I have set the system to reduce motion, when I reveal, flag, hover or press anything, then nothing animates or transitions; and given normal motion settings, when anything transitions, then each transition lasts at most 200 ms, nothing loops or flashes, and the new state of a cell is already readable by assistive technology immediately (not after the transition). Exception to "nothing loops": the sign-in progress spinner of [001](../../../../docs/backlog/001-login.md) and [004](../../../../docs/backlog/004-guest-login.md) is an essential progress indicator; it may rotate only while a sign-in is in progress, and under reduced motion it is static (no rotation).

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
- 2026-11-02 — Conflict 1 (UX design §11 point 1; Technical design risk 2): AC2 asks for one fill colour for sign-in buttons, but the "Sign in with Google" button must keep Google's branding (white in light, Google's dark theme in dark, logo colours). Proposed: the Google button keeps its branded look and only adopts the shared radius, height, width and the system font. — A: "Ja, alle drei" (hak, after design) = accepted as proposed. Consequence: exception sentence added to AC2; no other AC changed.
- 2026-11-02 — Conflict 2 (UX design §11 point 2; Technical design risk 3): AC6 says "nothing loops", but the sign-in progress spinner of 001 and 004 rotates while a sign-in is in progress. Proposed: the spinner is allowed as an essential progress indicator and is static under reduced motion. — A: "Ja, alle drei" (hak, after design) = accepted as proposed. Consequence: exception sentence added to AC6.
- 2026-11-02 — Conflict 3 (UX design §11 point 3): AC3 "cell edges" is ambiguous. Proposed: the 3:1 contrast applies to the edges of hidden and flagged cells; revealed cells may use a decorative hairline. — A: "Ja, alle drei" (hak, after design) = accepted as proposed. Consequence: AC3 names the edges of hidden and flagged cells; revealed-cell hairline exempt from 3:1.
- 2026-11-02 — Gate 2: sign off the look from the screenshots, apply all five retro proposals, commit? No open manual checks. — A: "Ja, alles" (hak, gate 2). Consequence: look accepted; proposals applied to `CLAUDE.md`, tester, product-owner and the `/feature` skill; status done. (orchestrator)

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

Scope: a visual design system for the whole app (login view, signed-in header, setup, status bar, board). Structure, copy, accessible names, tab order, live regions and focus movement of 001, 004, 005 and 006 are **not changed** (AC1); this section replaces only their visual spec (colours, bevel, sizes, radii, shadows). "005 §n" and "006 §n" refer to their UX designs. All colour values below were computed by hand against the sRGB formula; the developer or tester should re-check them with a contrast tool before gate 2 (a failing pair is a defect in this design, tell the UX designer).

### 1. Principles

- Calm and modern: one accent (blue) on a cool neutral palette, soft rounded shapes, a soft panel for the game, very little shadow. Meaning never rests on colour alone.
- Every colour, size, radius and duration is a **CSS custom property** defined once on `:root` (light) and redefined in `@media (prefers-color-scheme: dark)` (the app keeps `color-scheme: light dark`; `light-dark()` is allowed instead if the architect prefers, the values are the same). No component hard-codes a colour.
- Hover styles only inside `@media (hover: hover)`, so touch devices never keep a sticky hover.
- Cell look uses only `background-color`, `border`, **inset** `box-shadow`, `outline` and SVG glyphs: no outer shadows, `filter`, `backdrop-filter` or `clip-path` on cells. This keeps the look intact when 008 tilts the board (section 9).
- Reuse existing code: `MessageIcon`, `NoticeIcon`, `GoogleLogo`, the `visuallyHidden` classes and the grid layout of `SetupForm`. Only styling changes; the one allowed markup addition is a decorative `aria-hidden` disc inside the mine SVG for the exploded cell (section 3).

### 2. Design tokens

#### 2.1 Colour tokens

Surfaces, text and edges. "Edge" = a border that carries meaning (needs 3:1); "border" = a decorative hairline.

| Token                    | Light     | Dark      | Use                                              |
| ------------------------ | --------- | --------- | ------------------------------------------------ |
| `--color-page`           | `#f2f4f7` | `#111318` | page background                                  |
| `--color-surface`        | `#ffffff` | `#1b1f26` | panel, login card, header                        |
| `--color-surface-subtle` | `#eef1f5` | `#252a33` | status chips, neutral callout                    |
| `--color-border`         | `#d5d9e0` | `#2b313b` | panel, header and divider hairlines (decorative) |
| `--color-edge`           | `#737c8b` | `#8b94a3` | input and secondary-button borders, tile edge    |
| `--color-text`           | `#1b1f24` | `#e8eaed` | all body text                                    |
| `--color-text-muted`     | `#4a5360` | `#a9b1bd` | hints, preset detail, legends, empty text        |
| `--color-input-bg`       | `#ffffff` | `#12151a` | input background                                 |

Accent and states.

| Token                         | Light     | Dark      | Use                                                  |
| ----------------------------- | --------- | --------- | ---------------------------------------------------- |
| `--color-accent`              | `#1d4ed8` | `#a8c7fa` | primary fill, secondary text, focus ring             |
| `--color-accent-hover`        | `#1e40af` | `#bfd3fb` | primary hover                                        |
| `--color-accent-active`       | `#1e3a8a` | `#8eb1f3` | primary pressed                                      |
| `--color-on-accent`           | `#ffffff` | `#062e6f` | text on primary                                      |
| `--color-accent-subtle`       | `#e8effd` | `#232b3d` | secondary hover fill                                 |
| `--color-accent-subtle-press` | `#d5e1fb` | `#2d3850` | secondary pressed fill                               |
| `--color-focus`               | `#1d4ed8` | `#a8c7fa` | focus ring (same value as accent, kept as own token) |
| `--color-danger`              | `#b3261e` | `#f2b8b5` | error and lost: icon, bar, invalid border            |
| `--color-danger-bg`           | `#fdecea` | `#3a1b1a` | error and lost callout, exploded cell                |
| `--color-danger-solid`        | `#b3261e` | `#f28b82` | flag, exploded-mine disc and ring                    |
| `--color-on-danger-solid`     | `#ffffff` | `#1b1f24` | glyph on the exploded disc                           |
| `--color-success`             | `#1a7030` | `#81c995` | won: icon and bar                                    |
| `--color-success-bg`          | `#e8f5ea` | `#16291b` | won callout                                          |
| `--color-disabled-bg`         | `#e6e9ee` | `#2a2f38` | disabled button fill                                 |
| `--color-disabled-text`       | `#6b7482` | `#8b94a3` | disabled button text and icon (exempt from contrast) |

Message text itself is always `--color-text` (over 14:1); the message colour is carried by the tinted background, a 4 px left bar and the icon, so AA holds in both schemes and error, lost and won look the same wherever they appear (AC2). Mapping: error and lost use danger, won uses success, info and progress ("cancelled", "Signing in with Google…") use the neutral `--color-surface-subtle` with a `--color-text-muted` bar and icon.

Cell tokens.

| Token                   | Light     | Dark      | Use                                 |
| ----------------------- | --------- | --------- | ----------------------------------- |
| `--cell-revealed-fill`  | `#e5e9ef` | `#0e1014` | revealed cell and the board well    |
| `--cell-revealed-edge`  | `#cfd5de` | `#232831` | revealed cell hairline (decorative) |
| `--cell-tile-fill`      | `#f7f8fa` | `#343a45` | hidden and flagged tile             |
| `--cell-tile-hover`     | `#ffffff` | `#3f4652` | tile hover                          |
| `--cell-tile-pressed`   | `#e9edf3` | `#2a2f38` | tile pressed (active or long press) |
| `--cell-tile-highlight` | `#ffffff` | `#4a515d` | 1 px top highlight of a tile        |
| `--cell-tile-lip`       | `#c3cad6` | `#1c2028` | 3 px bottom lip of a tile           |
| `--cell-pressed-shade`  | `#b9c1ce` | `#0a0c10` | inner shade of a pressed tile       |

All colour tokens are opaque 6-digit hex (the tokens test of the Technical design forbids alpha in contrast-tested tokens); hover and pressed fills are their own tokens, no alpha overlays. Only the `--shadow-*` composites below use alpha, because they are decoration and carry no text.

Tile edge colour is `--color-edge`. Flag colour is `--color-danger-solid`; pole, mine glyph and wrong-flag slash are `--color-text`. Exploded fill is `--color-danger-bg`.

Number colours 1 to 8 (all on `--cell-revealed-fill`):

| Digit | Light     | Contrast | Dark      | Contrast |
| ----- | --------- | -------- | --------- | -------- |
| 1     | `#0b57d0` | 5.2:1    | `#8ab4f8` | 9.0:1    |
| 2     | `#1a7030` | 5.1:1    | `#81c995` | 9.7:1    |
| 3     | `#c5221f` | 4.8:1    | `#f28b82` | 8.0:1    |
| 4     | `#5b2a9e` | 7.6:1    | `#c58af9` | 7.6:1    |
| 5     | `#8c1d18` | 7.5:1    | `#fda48a` | 9.8:1    |
| 6     | `#00696b` | 5.3:1    | `#78d9ec` | 11.7:1   |
| 7     | `#1b1f24` | 13.6:1   | `#e8eaed` | 15.8:1   |
| 8     | `#5f6368` | 5.0:1    | `#bdc1c6` | 10.5:1   |

Digits are also told apart by their glyph (the digit itself), never by colour alone. The light 3 and 5 are both reds and the light 1 equals the accent; that is deliberate (continuity with 005) and harmless because the digit is the cue.

#### 2.2 Contrast values of the pairs that matter

Minimum rule: text 4.5:1, meaningful non-text 3:1.

| Pair                                                     | Light                 | Dark                    |
| -------------------------------------------------------- | --------------------- | ----------------------- |
| `--color-text` on page / surface                         | 15.0 / 16.6           | 15.4 / 13.7             |
| `--color-text` on revealed fill / tile / chip            | 13.6 / 15.6 / 14.6    | 15.8 / 9.5 / 11.9       |
| `--color-text-muted` on surface / page / revealed fill   | 7.8 / 7.1 / 6.4       | 7.7 / 8.6 / 8.8         |
| `--color-accent` text on surface / page / accent-subtle  | 6.7 / 6.1 / 5.8       | 9.6 / 10.8 / 8.2        |
| `--color-on-accent` on accent / hover / pressed          | 6.7 / 8.7 / 10.4      | 7.5 / 8.6 / 6.0         |
| `--color-edge` on surface / page / revealed fill / tile  | 4.2 / 3.8 / 3.5 / 4.0 | 5.4 / 6.1 / 6.2 / 3.7   |
| `--color-focus` on surface / page / tile / revealed fill | 6.7 / 6.1 / 6.3 / 5.5 | 9.6 / 10.8 / 6.7 / 11.1 |
| `--color-danger` (icon, bar) on danger-bg / surface      | 5.7 / 6.5             | 9.1 / 9.7               |
| `--color-success` (icon, bar) on success-bg / surface    | 5.5 / 6.2             | 7.8 / 8.4               |
| flag `--color-danger-solid` on tile                      | 6.2                   | 4.8                     |
| exploded disc on exploded fill / glyph on disc           | 5.7 / 6.5             | 6.5 / 6.9               |
| Google button text on its fill (section 4.4)             | 16.7                  | 14.5                    |
| Google button border on surface                          | 4.5                   | 5.2                     |

#### 2.3 Scales

| Group      | Tokens                                                                                                                                                                                                                                                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spacing    | `--space-1` 4px, `--space-2` 8px, `--space-3` 12px, `--space-4` 16px, `--space-5` 24px, `--space-6` 32px, `--space-7` 48px, `--space-8` 64px                                                                                                                                                                                                                         |
| Radius     | `--radius-control` 8px (every button, input, callout, chip), `--radius-cell` 6px, `--radius-well` 12px, `--radius-panel` 16px                                                                                                                                                                                                                                        |
| Shadow     | `--shadow-panel`: light `0 1px 2px rgb(16 24 40 / 6%), 0 8px 24px rgb(16 24 40 / 6%)`, dark `0 1px 2px rgb(0 0 0 / 40%), 0 8px 24px rgb(0 0 0 / 30%)`; `--shadow-control`: light `0 1px 2px rgb(16 24 40 / 10%)` on primary only, dark `none`. Shadows are decoration; every surface also has a real 1px border                                                      |
| Size       | `--control-height` 44px (buttons and inputs, at least 40 px per AC4), `--cell` 32px (see 3.1), `--cell-gap` 2px, `--tile-lip` 3px                                                                                                                                                                                                                                    |
| Font       | `--font-family`: the existing stack `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` for **all** text including buttons and inputs (`font: inherit`)                                                                                                                                                                                                       |
| Type scale | `--text-sm` 0.875rem/1.4 (hints, preset detail, legends, labels), `--text-base` 1rem/1.5 (body, buttons, inputs), `--text-lg` 1.125rem/1.4 (identity, result message), `--text-h2` 1.375rem/1.3 weight 600, `--text-h1` 1.75rem/1.2 weight 700 (letter-spacing -0.01em). Weights: 400 body, 500 buttons and labels, 600 legends, name, result, h2, 700 digits and h1 |
| Motion     | `--duration` 120ms (within the 200 ms limit; `0s` under reduced motion), `--ease` `ease-out`. 008 may add its own longer token for the view switch (its limit is 300 ms)                                                                                                                                                                                             |

Text sizes are in `rem` so browser zoom and text-size settings work; the cell digit keeps its size from 005 (`clamp(14px, calc(var(--cell) - 12px), 16px)`, 700, tabular numbers).

### 3. Board and cells

#### 3.1 Board structure

- **Game panel**: the `<section>` of the game is the soft panel: `--color-surface`, 1px `--color-border`, `--radius-panel`, `--shadow-panel`, padding `--space-5` (below 600 px `--space-4`).
- **Board well**: the board's scroll box (`.scroller`) is a recessed tray: `--cell-revealed-fill`, 1px `--color-border`, `--radius-well`, padding `--space-2` (below 600 px 4px), `width: fit-content; max-width: 100%; margin-inline: auto; overflow: auto; overscroll-behavior-x: contain`. It is the only thing that scrolls sideways (AC5).
- **Grid**: `gap: var(--cell-gap)` (2px) between rows and cells. Hidden tiles stand out of the well, revealed cells are flat in it.
- **Cell size**: `--cell` is 32px from 600 px; below 600 px it is `clamp(24px, calc((100vw - var(--board-chrome) - (var(--cols) - 1) * var(--cell-gap)) / var(--cols)), 40px)` with `--board-chrome` 42px (2 x 16 panel padding + 2 x 4 well padding + 2 x 1 well border). Express it with the architect's tokens instead of the literal: below 600 px the panel is edge to edge (`--page-pad` 0 for the panel, side `--panel-border` 0, `--panel-pad` 16px), so chrome = 2 x (`--page-pad` + `--panel-border` + `--panel-pad` + `--well-pad` + `--well-border`) = 2 x (0 + 0 + 16 + 4 + 1) = 42px; the `h1` and the header keep their own 16 px inset. The formula should also subtract the 2 px gaps as shown (the old formula ignored the 1 px gaps; with 2 px they matter: 30 cells = 58 px). The real chrome and the token must stay equal. Cells never go below 24 px (AC4).
- Cells: `--radius-cell`, 1px border, `cursor: default`, touch rules unchanged from 005 (`touch-action: manipulation`, no selection, no callout).

#### 3.2 Cell states (distinguishable by shape, AC4)

| State                             | Surface                                                                                        | Shape cue                                    | Glyph                                                                                 |
| --------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------- |
| Hidden                            | `--cell-tile-fill`, 1px `--color-edge`, inset top highlight 1px, inset bottom lip `--tile-lip` | raised tile with a thick bottom lip          | none                                                                                  |
| Flagged                           | as hidden                                                                                      | raised tile                                  | flag (pole and triangle), flag `--color-danger-solid`                                 |
| Revealed empty                    | `--cell-revealed-fill`, 1px `--cell-revealed-edge`, no shadow                                  | flat, no lip                                 | none                                                                                  |
| Revealed number                   | as revealed empty                                                                              | flat                                         | the digit, colour per 2.1                                                             |
| Mine (shown after a loss)         | as revealed empty                                                                              | flat                                         | mine glyph (circle with 8 spikes) in `--color-text`                                   |
| Exploded mine                     | `--color-danger-bg`, 2px `--color-danger-solid` border (inner size unchanged)                  | flat, thick ring, solid disc behind the mine | mine glyph on a filled disc (`--color-danger-solid`, glyph `--color-on-danger-solid`) |
| Wrong flag                        | as revealed empty                                                                              | flat, diagonal slash                         | flag with a 2.5 px slash in `--color-text`                                            |
| Pressed (long press or `:active`) | `--cell-tile-pressed`, no lip, inset `0 2px 4px --cell-pressed-shade`                          | tile pushed in                               | unchanged                                                                             |

The exploded disc is a decorative `<circle cx="12" cy="12" r="11">` drawn first inside the existing mine SVG (`aria-hidden` stays); the mine glyph strokes switch to `--color-on-danger-solid` on that cell only. Mine versus exploded mine therefore differ by disc, ring and tint, not by colour alone. Hidden versus revealed differ by lip and fill; the lip and the tile edge also differ in forced colours (section 8).

Edges against the page (AC3): the tiles carry the board edge, their 1px `--color-edge` is 3.5:1 or more against the well in both schemes. Revealed cells are identified by being flat, by their digit, and by the well outline; their hairline is decorative on purpose (a 900-cell grid of 3:1 lines would not be calm). The tester should read "cell edges" in AC3 as the edge of the hidden and flagged tiles; flag this to the reviewer.

Hover (only `@media (hover: hover)` and only while the game runs, i.e. `aria-readonly` is absent): tile fill `--cell-tile-hover`, `cursor: pointer`. Transition `background-color`, `box-shadow` over `--duration`. Pressed as in the table. After a win or loss the grid is read-only: no hover change, no pointer cursor.

Focus: `outline: 2px solid var(--color-focus); outline-offset: -2px` on the focused cell (inside the cell, so neighbours and the scroll box never clip it, and it follows the tilt in 008). 5.5:1 or more on every cell fill in both schemes (AC4: at least 2 px, at least 3:1). On the exploded cell the ring covers the red border; the disc keeps the state readable.

### 4. Components

#### 4.1 Buttons

All buttons: height `--control-height`, `--radius-control`, `font: inherit`, weight 500, `cursor: pointer`, `transition: background-color, border-color var(--duration) var(--ease)`.

| State    | Primary ("Start")                                                                                               | Secondary (presets, "Sign out")                                              |
| -------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Rest     | fill `--color-accent`, text `--color-on-accent`, no border (forced colours: 1px, section 8), `--shadow-control` | transparent, 1px `--color-edge`, text `--color-accent`                       |
| Hover    | fill `--color-accent-hover`                                                                                     | fill `--color-accent-subtle`                                                 |
| Active   | fill `--color-accent-active`, no shadow                                                                         | fill `--color-accent-subtle-press`                                           |
| Focus    | global ring (4.5)                                                                                               | global ring (4.5)                                                            |
| Disabled | fill `--color-disabled-bg`, text `--color-disabled-text`, `cursor: not-allowed`                                 | border `--color-border`, text `--color-disabled-text`, `cursor: not-allowed` |

Padding: primary `0 var(--space-5)`, secondary `0 var(--space-4)`. Preset buttons are secondary buttons with two lines (name 500, detail `--text-sm` weight 400 `--color-text-muted`, centred), `min-height` 56px, min width 6.5rem from 600 px. Preset detail stays `aria-hidden` with the description outside the button, as today. "Start" has no disabled state in the app; the style is specified for completeness. Only "Start" and the sign-in buttons are primary weight; there is exactly one primary action per screen.

#### 4.2 Inputs, labels, hints

- Label: `--text-sm`, weight 500, `--color-text`, gap 4px to the input.
- Input: height `--control-height`, `--radius-control`, `--color-input-bg`, 1px `--color-edge` (4.2:1 and 5.4:1 on the surface), text `--color-text`, padding `0 var(--space-3)`, `font: inherit`.
- Hover: border `--color-text-muted`. Focus: border `--color-accent` plus the global ring (2px, offset 2px).
- Invalid (`aria-invalid="true"`): 2px `--color-danger` border, horizontal padding reduced by 1px so the text does not move. The icon in the message below is the non-colour cue.
- Hint: `--text-sm`, `--color-text-muted`. Legends ("Board setup", "Difficulty"): `--text-sm`, weight 600, `--color-text-muted`.

#### 4.3 Callouts (messages) and status chips

- **Callout** (setup errors, result message, login messages): `display: flex; gap: var(--space-2); padding: 10px var(--space-3); border-radius: var(--radius-control); border-left: 4px solid <state colour>; background: <state bg>`; icon 20 px in the state colour, text `--color-text`, `--text-base` (result message weight 600 and `--text-lg`). States: error and lost = danger, won = success, info and progress = neutral. Error and info keep their existing icons (`MessageIcon`, `NoticeIcon`); the won and lost icons stay as they are.
- A one-line callout is 44 px high; the login message area keeps `min-height: 44px` reserved so the buttons do not jump (replaces the 1.5em reserve).
- **Status chips**: the counter paragraph and the timer paragraph are chips: `--color-surface-subtle`, `--radius-control`, padding `var(--space-1) var(--space-3)`, tabular numbers, value weight 600. Both stay in a wrapping row with gap `--space-2`. No other change to their markup or live-region behaviour.

#### 4.4 Sign-in buttons (001, 004)

- **Google button**: keeps Google's branding (system colours of its light and dark theme), but takes the shared shape: height `--control-height`, `--radius-control`, 14px / 500 label, 18px logo with 8px gap, full width of the login card at every width (the guest button below it has the same width, as 004 requires). Light: fill `#ffffff`, text `#1f1f1f`, border `#747775`. Dark: Google's dark theme, fill `#131314`, text `#e3e3e3`, border `#8e918f`. Opaque states instead of overlays: hover fill light `#eeeeee`, dark `#242425`; focus-visible and pressed fill light `#e6e6e6`, dark `#2c2c2d`. Disabled: light fill `#ffffff`, border `#e4e4e4`, text and logo `#aaaaaa`; dark fill `#181a1f`, border `#333639`, text and logo `#65686b` (the logo keeps the 38 % opacity it has today). Label font follows `--font-family`. These brand values are the one allowed colour-literal exception in the tokens test.
- **Guest button** (dev only, 004): secondary style with the 1px dashed border `--color-edge` kept as the "test tool" marker, text `--color-text`, same overlays as secondary, disabled as secondary with the dashed border.
- AC2 conflict, see section 11: Google's guidelines require its own fill (and Roboto), so the Google button is not filled with the accent colour.

#### 4.5 Header

`<header>`: `--color-surface`, 1px `--color-border` bottom, padding `var(--space-3) var(--space-4)` (from 600 px `var(--space-3) var(--space-5)`), not sticky (nothing may cover content at 200 % zoom). The identity paragraph is `--text-lg`, the name inside weight 600; the programmatic focus target (`tabindex="-1"`) gets the global ring with `--radius-control` when focused. "Sign out" is a secondary button.

#### 4.6 Global focus ring

`:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; border-radius unchanged }`; cells use offset -2px (3.1). The ring is 2 px and at least 5.5:1 against every surface in both schemes (2.2). Never remove it, never replace it by a box-shadow (forced colours drops shadows).

### 5. Layout per view

Page: `--color-page`, `--font-family`, `--color-text`. `main` side padding `--space-4` (from 600 px `--space-5`). The `h1` "Software Factory" is centred, `--text-h1`, margin `0 0 var(--space-5)`.

#### 5.1 Login view (signed out)

```text
main
  h1  Software Factory                      (centred)
  div.login   = card: surface, 1px border, radius-panel, shadow-panel, padding 24 (16 below 600)
    p  Use your Google account to sign in.
    div.buttons (column, gap 12, each button full card width)
      Google button (4.4)
      Guest button (dev only)
    div[aria-live=polite].messages  (min-height 44, margin-top 12)
      callout: progress | info (cancelled) | error
```

| Width | Behaviour                                                                                                         |
| ----- | ----------------------------------------------------------------------------------------------------------------- |
| 320   | main padding 16, card 288 wide, card padding 16, buttons 256 wide; top padding 32; messages wrap, nothing clipped |
| 375   | same, card 343 wide                                                                                               |
| 800   | card 28rem (448px) wide, centred, top padding 64; buttons fill the card                                           |

#### 5.2 Signed-in header and game

```text
header                                       (full width bar)
  p#identity  Signed in as <name>
  button      Sign out                         (secondary)
main (wide)
  h1  Software Factory                         (centred)
  section.game = panel
    div.column (max 40rem, centred inside the panel)
      h2  Minesweeper
      form
        fieldset "Board setup"
          fieldset "Difficulty": 3 preset buttons in one row
          fields: Rows, Columns, Mines (label, input, hint)
          errors: one callout per message (when present)
          button Start (primary)
      p[aria-live] announcements (visually hidden, unchanged)
      empty text  |  status block: chips (Mines left, Time) + result callout (live wrapper)
    board well (scroll box) -> grid (only after the first Start)
```

| Width | Header                                       | Panel and setup                                                                                                                                                                                                                                                                                                            | Board                                                                                                                                           |
| ----- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 320   | column: identity, then full-width "Sign out" | panel edge to edge (no side border, radius 0, no shadow, border top and bottom), padding 16; presets one row (each about 90 px) or wrapping to two rows if text does not fit; Rows/Columns/Mines in one row (about 88 px each, `min-width` 5rem; wrap allowed at larger text sizes); "Start" full width below the messages | cell `clamp(24px, ...)`: 9 x 9 about 24.6 px (no scroll), 16 x 30 and 30 x 30 are 24 px and scroll inside the well; page never scrolls sideways |
| 375   | as 320                                       | as 320, fields about 105 px, presets about 109 px                                                                                                                                                                                                                                                                          | 9 x 9 about 35 px; 16 x 30 and 30 x 30 are 24 px and scroll; the 24 px minimum target size holds (AC4, AC5)                                     |
| 800   | one row: identity left, "Sign out" right     | rounded panel (width fits content, at least the 40rem column plus padding, never wider than the viewport minus 2 x 24), padding 24; setup in the 40rem column: fields and "Start" in one row, "Start" aligned to the inputs (margin-top = label line 20px + 4px)                                                           | cells 32 px: 9 x 9 about 304 px; 16 x 30 and 30 x 30 are about 1018 px wide and scroll inside the well, centred when they fit                   |

At 200 % zoom at 320 px (160 CSS px) the same rules apply: nothing is wider than the viewport except the well; long words wrap (`overflow-wrap: anywhere` on messages and identity); presets and fields wrap to several rows; vertical scrolling is the only page scroll. A 30 x 30 board at 1280 px: the panel grows to fit it (about 1084 px).

Status block spacing: 1px `--color-border` divider above it, `--space-4` padding-top, `--space-5` margin-top; result callout `--space-3` below the chips; the board well `--space-5` below the status block. Empty text (before the first "Start"): `--color-text-muted`, margin-top `--space-5`, no box.

### 6. States per view

| View / element | State                            | What the user sees                                                                                                       |
| -------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Login          | idle                             | card with text, enabled sign-in button(s), empty message area (44 px reserved)                                           |
| Login          | signing in (loading)             | buttons disabled (4.4), neutral callout with spinner and "Signing in with Google…"                                       |
| Login          | cancelled (info)                 | neutral callout with info icon                                                                                           |
| Login          | failed (error)                   | danger callout with error icon (the only one with `role="alert"`, unchanged)                                             |
| Header         | signed in                        | identity and "Sign out"; focus on the identity after sign-in as today                                                    |
| Game           | before the first "Start" (empty) | panel with setup, muted empty text, no board                                                                             |
| Setup          | preset chosen (success)          | inputs filled; no visible message (announced as today)                                                                   |
| Setup          | invalid                          | invalid inputs with 2px danger border, one danger callout per message under the fields, focus on the first invalid input |
| Game           | running                          | chips, board with tiles; no result callout                                                                               |
| Game           | won                              | success callout "You won! Every safe cell is revealed.", board read-only (no hover)                                      |
| Game           | lost                             | danger callout "You lost. You revealed a mine.", mines shown, exploded cell, wrong flags, board read-only                |
| Disabled       | sign-in buttons while signing in | section 4.1 and 4.4 disabled styles                                                                                      |

There is no error or loading state in the game itself (no network). "Start" keeps working at any time (005/AC2).

### 7. Interactions, motion

- Behaviour, validation timing, focus movement and gestures: exactly as in 005 §4 and 006 §4. Nothing new is clickable and nothing changes the tab order.
- **Transitions** (normal motion): only on buttons (background, border), inputs (border), tiles (`background-color`, `box-shadow`) and chips; `--duration` (120 ms). Reveal and flag changes may fade the fill within 120 ms; the DOM state (class, glyph, accessible name) changes immediately, so assistive technology never waits for the transition (AC6). No transform or movement on any control, nothing loops, nothing flashes.
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` sets `--duration` to `0s` and adds `*, *::before, *::after { transition: none !important; animation: none !important; }`, so no hover, press, reveal or flag animates (AC6). The progress spinner already has a static reduced-motion form (opacity 0.6, no rotation) and keeps it.
- A flood-fill reveal can touch hundreds of cells at once: only the two cheap properties above may transition, never layout properties.

### 8. Forced colours (Windows high contrast)

Forced colours drop fills, `box-shadow` and background images and replace colours by system ones. Rules (all in `@media (forced-colors: active)`):

- **Panel, header, login card, callouts, chips, inputs**: their 1px borders are real borders and stay (`CanvasText` or `ButtonText`); the 4px callout bar stays (`border-left`). Panel and card get `border: 1px solid CanvasText`; no reliance on shadow.
- **Primary button**: `border: 1px solid ButtonText` (the current `border: 0` would make it vanish); secondary keeps its border in `ButtonText`; hover changes the border to `Highlight`; disabled uses `GrayText` for text and border.
- **Hidden and flagged tile**: `forced-color-adjust: none; background: ButtonFace; color: ButtonText; border: 2px solid ButtonText; box-shadow: inset 0 -3px 0 ButtonText; background-image: none`. The thick border plus the bottom lip keep the raised shape.
- **Revealed cells** (empty, number, mine, wrong flag): keep automatic adjustment (`Canvas` fill, digits in `CanvasText`), `border: 1px solid GrayText`, no lip. The shape differs from the tile by border thickness and lip.
- **Exploded mine**: `border: 3px solid CanvasText`; the disc `fill: CanvasText` and the glyph strokes `Canvas`; the lost state is therefore a filled dark disc, visible without colour.
- **Flag, pole, slash, mine glyph**: `fill` and `stroke` `currentColor` (`stroke: none` on pole and flag), as in 005; the flag keeps its triangle-on-pole shape, the wrong flag its slash.
- **Focus**: `outline: 2px solid Highlight` for every focus-visible, cells with offset -2px.
- Chips and callouts: no fill needed; the icon and the bar provide the shape. Do not set `forced-color-adjust: none` anywhere except on the tiles.

### 9. Readiness for 008 (3D mode)

- The cell look is built from tokens: 008 can restyle depth by overriding `--tile-lip`, `--cell-tile-lip`, `--cell-tile-highlight`, `--cell-gap` and the well under a `[data-view]` attribute on the board, without touching 2D rules. The 2D look must stay pixel-identical when 008 switches back (008/AC3).
- Because cells use inset shadows and borders only, no outer shadow is clipped or distorted by the tilted plane; the focus ring is inside the cell and tilts with it; glyphs are SVG and scale with it.
- The well's `overflow: auto` clips transforms: 008 needs extra padding inside the scroll box, or the tilt is applied to the grid with enough padding, so the far edge of the plane is not cut. Avoid `container-type` on the panel (it adds containment that can interfere with `perspective`); that is why the cell size uses `100vw`, not `100cqw`.
- Colour tokens carry the state, so 3D tiles reuse `--cell-tile-*` and number colours unchanged; contrast rules of AC3 hold because the values do not depend on the angle.
- 008's "View" control (2D or 3D) should reuse the secondary button look for its options, the selected option shown with `--color-accent-subtle-press` fill and a 2 px `--color-accent` bottom border plus a check mark (not colour alone); 008's UX design specifies it.

### 10. Accessibility

- **No change** to semantics: landmarks (`header`, `main`, `section` named by "Minesweeper"), fieldsets and legends, labels, `aria-describedby` hints and errors, grid, rows, gridcells with their `aria-label`s, roving tabindex, `aria-readonly` at the end, tab order, all live regions (mounted empty, role-less wrappers, `role="alert"` only on the login failure and only when shown). The ARIA texts are the oracle (AC1).
- Visual order equals DOM order in every layout (no CSS `order`, no `flex-direction: *-reverse`, no grid-area reordering beyond what exists), so reading and tab order stay the same at every width.
- Contrast: all pairs in 2.1 and 2.2 meet WCAG 2.2 AA (text 4.5:1, non-text 3:1) in both schemes; digits 1 to 8 at 4.8:1 or more in light and 7.6:1 or more in dark.
- Target size: cells at least 24 px (2 px gap adds spacing), buttons and inputs 44 px high (at least 40 px).
- Focus indicator: 2 px, at least 5.5:1, never removed, visible in forced colours (`Highlight`).
- Colour is never the only cue: errors have an icon and text, won and lost have an icon and text, mine, exploded mine, flag and wrong flag differ by glyph, disc, ring and slash, hidden versus revealed differ by lip and flatness, the invalid input has a thicker border plus its message.
- Dark mode and light mode follow `prefers-color-scheme` only, no switch.
- Live announcements: unchanged; visually hidden texts have no colour (the dark-mode rule is answered by their absence).

### 11. Open points for the product owner and the architect

1. **AC2 versus Google branding.** AC2 asks for one fill colour for sign-in buttons, but Google's guidelines (and `GoogleSignInButton.module.css`) require Google's own fill, logo colours and Roboto label. The design keeps the Google button branded (white in light, Google's dark theme in dark) and gives it the shared radius, height, width and the system font for the label; the accent fill applies to "Start" and to any future non-Google sign-in button. The product owner should reword AC2 ("sign-in buttons follow the shared shape and size; Google's button keeps its branded fill") or tell us to deviate from Google's rules. (resolved, see Decision log)
2. **AC6 "nothing loops" versus the progress spinner** of 001 and 004. The spinner rotates until the network timeout ends the state; it is a functional loading indicator with a static reduced-motion form. The design keeps it. If AC6 must apply literally, replace it by a static icon and rely on the text "Signing in with Google…"; ask the product owner. (resolved, see Decision log)
3. **AC3 "cell edges against the page"**: read as the edge of hidden and flagged tiles (3.5:1 or more against the well, 3:1 required); revealed cells have a decorative hairline (3.2). Confirm with the reviewer. (resolved, see Decision log)
4. **Markup additions for the developer and architect**: the decorative disc in the mine SVG; the token file of the Technical design (`src/app/tokens.css`) holds every token of section 2 for both schemes, using the names of section 2 or the architect's names with the same values (the architect's table wins on names, this section wins on values and contrast); the board chrome is defined once from the page, panel and well paddings (see 3.1).
5. **Header and `h1` placement** is a pure CSS change (the existing `.wide > h1` rule becomes centred text); no JSX change is needed for the layout in section 5.
6. The contrast table in 2.2 is the input for the architect's `tokens.test.ts`; the pairs listed there are the ones to assert.

### 12. Screenshot states for hak's gate 2

Each in light and dark (the tester takes them in both schemes; hover and focus are not needed unless stated), at 800 px unless noted:

1. Login view, idle.
2. Login view, "Signing in with Google…" (disabled buttons, spinner) and the error callout (one shot each; light and dark).
3. Signed in before the first "Start" (header, panel, presets, fields, empty text).
4. Game in progress: 9 x 9 with revealed numbers 1 to 8 (use a fixed mine layout), flags and hidden tiles, the keyboard focus ring on one cell.
5. Lost game: mines, exploded mine, wrong flag, danger callout.
6. Won game: success callout, frozen timer.
7. Setup with an error shown (two invalid fields, focus on the first).
8. Game in progress at 375 px width (9 x 9 without scroll) and a 16 x 30 board at 375 px (shows scrolling inside the well).
9. Forced-colours screenshot (emulated) of a lost game, so the cell shapes can be checked without colour (not a sign-off item, evidence for AC3).
10. Zoom evidence for AC5: 320 px at 200 % with a 9 x 9 and with a 30 x 30 board (no sideways page scroll).

### 13. Superseded parts of the earlier UX designs

The visual spec below is replaced by this section; everything not listed (structure, copy, behaviour, ARIA, focus movement, live regions) stays valid.

- 005 UX: the colour tokens and the grey bevel of the cells, the `1px` grid gap, the layout colours of the setup, status and result messages, the sizes of the board chrome. Cell sizes (32 px, fluid 24 px below 600 px) and the 600 px breakpoint stay.
- 006 UX: the look of the preset buttons and of the timer text (now a secondary button and a chip).
- 001 and 004 UX: the look of the login view (now a card), the message colours, the guest button's grey look (the dashed border stays); the texts and the Google branding stay.

## Technical design

Decision record: [ADR 0004 – design tokens as CSS custom properties](../../../../docs/adr/0004-design-tokens-css-custom-properties.md).
No new dependency (system font, no axe-core). No change to any `*.ts`/`*.tsx` file other than
class names, the new `Button`, and the `main.tsx` import: logic, state, texts, roles, labels,
tab order and input handling stay exactly as they are (AC1).

### 1. Approach in short

- **Tokens:** one global `src/app/tokens.css` with CSS custom properties (colour, radius,
  spacing, type, control height, motion, elevation). Light values in `:root`, dark values in
  one `@media (prefers-color-scheme: dark) { :root { … } }` block. CSS Modules only read
  `var(--…)`; they hold no colour literal and no dark-mode block any more.
- **Global base:** `src/index.css` is rewritten to use the tokens (font, page colours, `:focus-visible`
  ring, box-sizing, headings). `src/main.tsx` imports `./app/tokens.css` before `./index.css`.
- **Wiring:**
  - Dark: the media query block above; `color-scheme: light dark` stays on `:root` (native
    controls and scrollbars follow).
  - Reduced motion: `--duration` is `120ms` in `:root` and `0s` inside
    `@media (prefers-reduced-motion: reduce)`. Every `transition` is
    `<property> var(--duration) var(--ease)`; no `transition: all`. Nothing else needs a
    per-module rule. One global exception in `src/index.css` under the same media query:
    `transition: none !important; animation: none !important` on all elements (safety net,
    see ADR 0004). The login spinner (`@keyframes`) keeps its own reduced-motion rule.
  - Forced colours: stays a local `@media (forced-colors: active)` block in the modules that
    need it (Board, SetupForm, Button), system colour keywords only. In that mode
    `box-shadow` and gradients vanish, so **every state cue must also exist as border,
    outline or glyph**, not only as shadow, gradient or background (see the cell rules below).
- **Shared button:** `src/components/Button.tsx` (+ module), `variant` primary or secondary,
  used for Start, the three presets, Sign out and the dev guest button. The Google button
  keeps its module for branding but uses `--font`, `--radius-control`, `--control-height`.
- **Test guard:** `src/app/tokens.test.ts` (see §7) makes the consistency rules of AC2/AC3
  mechanical instead of a matter of discipline.

### 2. Files

New:

| Path                               | Responsibility                                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `src/app/tokens.css`               | All design tokens, light + dark + reduced-motion. The only file with colour literals.                              |
| `src/app/tokens.test.ts`           | Unit test: light/dark parity, contrast table, no token bypass in other CSS (§7).                                   |
| `src/components/Button.tsx`        | Primary/secondary button: 40 px, shared radius, font, focus, hover, disabled; passes through all `<button>` props. |
| `src/components/Button.module.css` | The two variants, reading tokens; forced-colours border.                                                           |
| `e2e/redesign.spec.ts`             | The few checks that only a browser can show (§7). Uses the guest sign-in like the other specs.                     |

Changed (CSS and class names only, unless stated):

| Path                                                     | Change                                                                                                                                                                                                                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/main.tsx`                                           | Import `./app/tokens.css` before `./index.css`.                                                                                                                                                                                                               |
| `src/index.css`                                          | Use tokens; drop the duplicated dark block; global `:focus-visible` from tokens; heading hierarchy (h1/h2) from the type scale.                                                                                                                               |
| `src/app/App.module.css`                                 | Keep `.main`/`.wide` and the 40 rem heading column; spacing from tokens. The page gutter comes from `--page-pad` (see "Board sizing").                                                                                                                        |
| `src/features/auth/LoginView.module.css` + `.tsx`        | Guest button becomes `<Button variant="secondary" className={styles.guest}>` (keeps the dashed border as the dev-only marker); messages use the message tokens; spinner keeps its own reduced-motion rule. Same texts, same `role="alert"`, same live region. |
| `src/features/auth/GoogleSignInButton.module.css`        | Remove `font-family: Roboto…` and the 4 px radius; use tokens. Brand colours are the one allowed colour-literal exception (allow-listed in the test) unless UX picks the accent-filled variant.                                                               |
| `src/features/auth/SignedInHeader.module.css` + `.tsx`   | "Sign out" becomes `<Button variant="secondary">`; header surface/border from tokens.                                                                                                                                                                         |
| `src/features/minesweeper/Minesweeper.module.css`        | `.game` becomes the soft panel (surface, border, radius, elevation, padding from tokens); `.column` stays the 40 rem column. Remove the duplicated `.visuallyHidden` only if a shared one is introduced (optional, not required).                             |
| `src/features/minesweeper/SetupForm.module.css` + `.tsx` | Presets and Start become `<Button>`; inputs use `--control-height`, `--radius-control`, token borders; invalid state keeps a 2 px border plus the existing message icon. Remove all hex values and the dark block.                                            |
| `src/features/minesweeper/GameStatus.module.css`         | Counter/timer as a calm status row; won/lost/error colours from the shared message tokens.                                                                                                                                                                    |
| `src/features/minesweeper/Timer.module.css`              | Only if the status row needs it; otherwise untouched.                                                                                                                                                                                                         |
| `src/features/minesweeper/Board.module.css`              | Rewritten visuals (rounded, gently raised hidden cells, flat revealed cells); all colours from `--cell-*`/`--n1..n8` tokens; the dark block and the 16 local colour variables are removed; forced-colours block kept and adapted.                             |

Not changed: all of `logic/`, `Board.tsx`, `Cell.tsx` (class names `hidden, flagged, empty, number n1..n8, mine, mineExploded, flagWrong, pressed` stay, so the DOM and the tests keep working), `useBoardInput.ts`, `Minesweeper.tsx`, `GameStatus.tsx`, auth code, all existing tests. If the UX design needs an extra wrapper element, add it without touching roles, labels or order.

### 3. Token contract (names and structure; values are the UX design's)

The UX design's colour/size table maps 1:1 onto `tokens.css`; the developer copies the UX
names where they exist and otherwise follows this scheme (semantic, not literal names):

```css
:root {
  color-scheme: light dark;
  /* colour: all opaque #rrggbb so the contrast test can read them */
  --color-page: …;
  --color-surface: …; /* panel */
  --color-text: …;
  --color-text-muted: …;
  --color-border: …;
  --color-border-strong: …; /* input borders, cell edge: ≥ 3:1 */
  --color-accent: …;
  --color-accent-hover: …;
  --color-on-accent: …;
  --color-secondary-hover: …; /* opaque tint under text */
  --color-error: …;
  --color-won: …;
  --color-lost: …;
  --color-focus: …; /* ring: ≥ 3:1 on page, panel and cells */
  /* board */
  --cell-hidden: …;
  --cell-hidden-edge: …;
  --cell-hidden-hover: …;
  --cell-revealed: …;
  --cell-revealed-edge: …;
  --cell-exploded: …;
  --cell-glyph: …;
  --cell-flag: …;
  --n1: …; /* … */
  --n8: …;
  /* shape */
  --radius-control: …;
  --radius-panel: …;
  --radius-cell: …;
  --control-height: 40px;
  --focus-width: 2px;
  --page-pad: 1rem;
  --panel-pad: …;
  --panel-border: 1px;
  /* type */
  --font: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --text-sm: …;
  --text-md: …;
  --text-lg: …;
  --text-xl: …;
  /* depth (008 reuses and extends these) */
  --shadow-panel: …;
  --shadow-raised: …;
  /* motion */
  --duration: 120ms;
  --ease: ease-out; /* 0s under reduced motion */
}
@media (prefers-color-scheme: dark) {
  :root {
    /* same colour and shadow names */
  }
}
@media (prefers-reduced-motion: reduce) {
  :root {
    --duration: 0s;
  }
}
```

Rules:

- Every colour token has a dark value. The unit test fails if the two blocks define different names.
- Contrast-tested tokens are opaque 6-digit hex (no `rgb()`, `color-mix`, alpha). A hover or
  pressed state that changes the background under text is its own opaque token and is in the
  contrast table. Alpha overlays (`linear-gradient(rgb(var(--overlay) / 8%), …)`) are retired.
- Spacing, radii and type sizes are tokens; one-off lengths (grid gaps, icon sizes) may stay
  literal in the module.
- `--duration` is at most `200ms`.

### 4. Board and layout notes (state and data flow unchanged)

State ownership does not change (`Minesweeper` owns setup/game state, `Board` owns focus and
press state in `useBoardInput`; theme and motion are pure CSS, no JS, no React state, no
context). Nothing is derived in TypeScript for the redesign.

```tsx
// src/components/Button.tsx
import type { ComponentPropsWithRef } from 'react';

export interface ButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'className'> {
  readonly variant: 'primary' | 'secondary';
  /** Extra class for layout or a variant marker (e.g. the dashed dev guest button). */
  readonly className?: string | undefined;
}
// Renders <button type={type ?? 'button'} className={joined}>; `ref` is a normal prop in React 19.
```

- **Board sizing (AC5).** The existing fluid cell size assumes 1 rem page padding on each side
  (`(100vw - 2rem) / --cols`). A panel adds padding and a border, so replace the literal by
  tokens: `--cell: clamp(24px, calc((100vw - 2 * (var(--page-pad) + var(--panel-pad) + var(--panel-border))) / var(--cols)), 40px)`
  below 600 px; 32 px from 600 px up. The panel must never be wider than the viewport
  (`max-width: 100%; min-width: 0`), and only `.scroller` scrolls (`overflow: auto`). If the
  UX design makes the panel edge-to-edge on phones, adjust the tokens, not the formula.
- **Cell states (AC3/AC4).** `hidden`/`flagged`: raised look via a token shadow **and** a visible
  border (so it survives forced colours); `empty`: flat, 1 px border; `number`: as empty plus the
  digit; `mine`: flat plus mine glyph; `mineExploded`: 2 px border in `--cell-exploded`
  (thicker border is the shape cue besides the colour); `flagWrong`: flag glyph plus the slash
  (already in `Cell.tsx`). All glyphs use `--cell-glyph`/`--cell-flag`; forced-colours block
  maps them to `currentColor`.
- **Focus.** One `:focus-visible { outline: var(--focus-width) solid var(--color-focus); }` in
  `index.css`; the cell uses a negative offset so the ring is not clipped by the scroller.
- **Transitions (AC6).** Only `background-color`, `border-color`, `box-shadow`, `transform`,
  `opacity`, and only through `var(--duration)`. State changes come from React as before:
  the `aria-label` and the `role` content change immediately in the DOM; never delay content,
  never use `visibility` or `display` transitions, never `transition: all`.
- **Looping animation.** The only existing loop is the login spinner (a progress indicator,
  static under reduced motion). It stays; see risk 3.
- **For 008:** the board stays one component. The wrapper structure `.scroller` (overflow box)
  → `[role=grid] .grid` stays as it is, and every cell visual reads tokens plus `--cell`, so
  008 can add `data-view` on the same grid element and a `transform`/`perspective` rule in
  `Board.module.css` and a depth token or two, with no remount (`key={game.id}` stays the only
  key). 007 adds no view concept.

### 5. External APIs, error handling, dependencies

No network, no API, no error handling change; all error and loading states keep their
components and texts and only change style. **No new dependency.** System font stack only
(`--font`); no web fonts, no `@font-face`.

### 6. Risks and mitigation

1. **Behaviour regressions hidden by the restyle** (focus order, hit targets, text changes).
   Mitigation: touch only CSS, class names and the four button elements; run the whole
   existing e2e suite unchanged (AC1) after each plan step; `Button` keeps `type`, `ref`,
   `disabled`, `onClick`, accessible names exactly as before (preset buttons keep their
   two-part structure and the detail text outside the accessible name).
2. **Google button brand vs AC2.** AC2 says one radius, one font, and a primary fill for
   sign-in buttons; Google's button guideline prefers its own colours and Roboto. Mitigation:
   the UX design decides (e.g. accent-filled variant, or an accepted exception for the colour
   only); the developer uses tokens for font, radius and height regardless. If the UX design
   keeps the white brand button, the AC2 sentence "primary fill for sign-in buttons" is met by
   the guest/primary style only; list that as an accepted exception in the Implementation notes.
3. **"Nothing loops" in AC6 vs the login spinner.** The spinner is a progress indicator, only
   visible while signing in, and static under reduced motion. Treat it as the one permitted loop
   (essential progress feedback); the test asserts the spinner's reduced-motion state only
   if the fake sign-in can be held in progress cheaply, otherwise "checked, OK" in the Test
   report. If hak reads AC6 strictly, the fix is a static "Signing in…" text without spinner,
   no design change elsewhere.
4. **Fluid cell formula and panel padding** (see §4): a wrong subtraction makes the page scroll
   sideways at 375 px. Covered by the AC5 e2e table.
5. **Forced colours drop shadows and gradients.** Rely on borders and glyphs for every state
   cue; the forced-colours e2e compares the seven cell states.
6. **Dark-mode drift:** a token missing in the dark block shows a light colour on a dark page.
   Covered by the parity check in the unit test.
7. **Performance on 30 × 30 (900 cells) with transitions.** Only colour-type properties,
   120 ms, no `transition: all`, no `will-change`; flood reveal changes many cells at once,
   which is fine at this size. Check by hand once on a 30 × 30 Expert board.
8. **`composes`/specificity:** avoided on purpose; variants are plain class pairs in
   `Button.module.css`; callers pass at most one extra class.
9. **e2e runs on the dev server** (mode `e2e`, port 5174), the check on production CSS is
   `npm run verify` (build); no dev-only code is added, so `check-dist` needs no new entry.

### 7. Minimal test set

| AC  | What shows it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Level                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| AC1 | The existing suites (`e2e/auth*.spec.ts`, `e2e/minesweeper.spec.ts`, `e2e/smoke.spec.ts`, all unit tests) pass with unchanged expectations. No new test.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | existing e2e + unit                            |
| AC2 | `redesign.spec.ts` / "AC2: one font, one control radius, one primary and one secondary style": on the login view and on the signed-in view with a started game and a setup error, collect the computed `font-family` of every element that has text (one distinct value), `border-radius` of every button and input (one distinct value, not 0), and the background of Start vs the other primary actions and presets vs Sign out (same style per role). Message colours, tokens-only styling and the single palette are enforced by the unit test below, not by e2e.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | e2e (1 test)                                   |
| AC3 | **Unit** `tokens.test.ts`: (a) light and dark blocks define the same token names; (b) contrast table over token pairs written as placements, e.g. text on page, text on surface, muted text on surface, on-accent on accent and hover, error/won/lost on surface, digits `--n1..--n8` on `--cell-revealed`, flag and glyph on hidden and on revealed, glyph on exploded, `--color-border-strong` on page and surface, `--cell-hidden-edge` and `--cell-revealed-edge` on the surface, `--color-focus` on page, surface and hidden/revealed cell: ≥ 4.5 for text and digits, ≥ 3 for non-text, in both schemes; (c) no token bypass: no `#hex`, `rgb(`, `hsl(` or `font-family` and no literal transition time in any `src/**/*.css` except `tokens.css`, `index.css` (font) and the allow-listed Google brand colours; border radius only via `var(--radius-…)`, `0` or `50%`. **E2E** "AC3: forced colours": `emulateMedia({ forcedColors: 'active' })`, one lost game on a fixed 5 × 5 layout (hidden, flagged, empty, number, mine, exploded mine, wrong flag all visible); the seven cell states are pairwise distinguishable by `[borderTopWidth, borderTopStyle, backgroundColor, innerHTML]`. | unit (1 file, 3 tests) + e2e (1 test)          |
| AC4 | Same lost-game board, normal colours: the seven states are pairwise distinct by a signature **without any colour** (`[borderTopWidth, boxShadow !== 'none', innerHTML]`), so not by colour alone; computed `outline-width ≥ 2px` and style not `none` on a focused cell, a focused button and a focused input; bounding boxes: cell ≥ 24, Start, presets, Sign out and the three inputs ≥ 40 high.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | e2e (1 test, shares the board with AC3 forced) |
| AC5 | One test with a table: viewports 160 (200 % zoom of 320), 320, 375, 800 px wide, boards 9 × 9, 16 × 30, 30 × 30 started through the form. Per combination: `documentElement.scrollWidth <= innerWidth`; Start, the three presets, the inputs and the status row lie inside the viewport horizontally; the setup, status and board rectangles do not overlap; for boards wider than the box, the grid's scroller has `scrollWidth > clientWidth` and its `clientWidth <= innerWidth`; the cell width ≥ 24 (and = 32 at 800).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | e2e (1 test, loop)                             |
| AC6 | One test, two halves. `reducedMotion: 'reduce'`: after hovering and revealing a cell, flagging one and pressing Start, every element in the document has `transition-duration` of all `0s` (and no running animation: `document.getAnimations()` is empty). Normal motion: the maximum `transition-duration + transition-delay` over all elements ≤ 0.2 s and, after settling, `document.getAnimations()` is empty (nothing loops). Immediate AT state needs no new test: the existing e2e assertions on `toHaveAccessibleName` right after a click already show it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | e2e (1 test)                                   |

Notes for the tester: the existing `e2e/minesweeper.spec.ts` helpers (guest sign-in,
`setMines`, `startFixed5x5`) are the model for `redesign.spec.ts`; copy the few lines instead of
exporting helpers across specs. Colour pairs in the unit test are the contrast oracle (both
schemes, deterministic); e2e does not recompute contrast. Visual taste is not tested: it is
hak's gate 2 sign-off on the UX design's screenshot list (capture them with
`emulateMedia` light/dark and the 375 px viewport, not committed as reference images).

### 8. Implementation plan

1. Write `tokens.css` from the UX design's table (light, dark, reduced-motion); import it in
   `main.tsx`; rewrite `index.css` on top of it. Add `tokens.test.ts` (parity + contrast) and
   make it pass before any module is touched.
2. Add `Button.tsx` + module; switch Start, presets, Sign out and the guest button to it.
   Run the existing e2e suite.
3. Restyle login view and Google button (tokens; brand exception as decided in the UX design),
   then the signed-in header and the page frame (`App.module.css`).
4. Restyle `Minesweeper.module.css` (panel), `SetupForm`, `GameStatus`, `Timer`.
5. Rewrite `Board.module.css` on `--cell-*`/`--n*` tokens, with the board sizing formula, state
   cues that survive forced colours, and the forced-colours block. Remove every dark-mode block
   and colour literal left in any module; add the bypass test (c) and fix what it finds.
6. Write `e2e/redesign.spec.ts` (AC2 to AC6), then `npm run verify` and the full e2e run.
7. Capture the screenshot states listed in the UX design for gate 2 (light and dark, 375 px).

## Implementation notes

_developer: what was built, deviations from the design and why._

**Built (round 1).** Pure CSS refresh plus the shared button; no logic, text, role, label or tab-order change.

- `src/app/tokens.css`: all tokens of the UX design (colour light/dark, cells, digits `--n1..8`, spacing, radii, shadows, sizes, type, motion, board-chrome tokens). Imported in `src/main.tsx` before `src/index.css`; `index.css` rewritten on top of it (font, headings, global `:focus-visible`, reduced-motion rule).
- `src/components/Button.tsx` + module (`primary` / `secondary`) used for Start, the three presets, Sign out and the dev guest button (`.buttons .guest` keeps the dashed border).
- Restyled on tokens only: `App`, `LoginView` (card + callouts + spinner), `GoogleSignInButton`, `SignedInHeader`, `Minesweeper` (panel), `SetupForm`, `GameStatus`/`Timer` (chips, result callout), `Board` (well, tiles with lip, flat revealed cells, forced-colours block). No module has a colour literal or a dark-mode block any more.
- Only markup addition: the decorative `<circle r="11">` disc inside the exploded-mine SVG in `Cell.tsx`. `src/components/.gitkeep` removed (the folder now has content).
- `src/app/tokens.test.ts`: light/dark parity, about 50 contrast placements in both schemes (all pass), no token bypass in any other CSS (colour literals, `font-family`, radius, transition times, own dark blocks), `--duration` at most 200 ms and `0s` under reduced motion.

**Deviations.**

1. Google brand colours are tokens (`--google-*`, light and dark) in `tokens.css` instead of literals in the Google module, so the "one allowed literal exception" in the bypass test is not needed (the allow-list is empty) and the module has no dark block (ADR 0004).
2. The tokens test reads the CSS with `node:fs` (`/// <reference types="node" />` in that file), because Vitest returns an empty string for `*.css?raw` imports.
3. Board chrome: `--page-pad`, `--panel-border`, `--panel-pad`, `--well-pad` are overridden in a `min-width: 600px` block of `tokens.css` (the UX design's narrow values are the `:root` defaults). The fluid cell subtracts `--board-chrome` and the `(cols - 1) * 2px` gaps; measured: 9 x 9 fits without scrolling at 320 (29.1 px cells), 375 (35.2) and 800 (32); 16 x 30 and 30 x 30 are 24 px at narrow widths and scroll inside the well; the page never scrolls sideways. The UX design's "about 24.6 px at 320" is a miscalculation, the formula gives 29.1 px.
4. Presets at narrow widths use `flex-basis: 5.5rem` (not 6.5rem) so the three fit one row at 320 as well as at 375.
5. The global `animation: none !important; transition: none !important` reduced-motion rule from the UX design (7) is in `index.css`, although the Technical design said "no `!important`"; `--duration: 0s` alone would already cover transitions. The spinner's own static rule stays.
6. The tokens test has a fourth small test (`--duration` limit) beside the three named in the design.

**Existing e2e (AC1 oracle).** All behaviour specs pass. Three specs in `e2e/auth.spec.ts` (story 001) assert the old visual spec that the UX design replaces (section 13); I did not edit `e2e/`:

- "the focus ring is visible on the sign-in button": expects `rgb(11, 87, 208)`, the new focus colour is `rgb(29, 78, 216)` (`#1d4ed8`).
- "AC1: the sign-in button is full width ...": expects button width = main width - 32 and height 40; now the button fills the login card (card inset and padding) and is 44 px high.
- "the sign-in button is not stretched to full width": expects < 300 px; the UX design makes both buttons fill the 28rem card (398 px) at 800.

Tester: update these three expectations to the new spec.

**Not done / follow-ups.** `e2e/redesign.spec.ts` and the screenshots for gate 2 (tester). Hover and 30 x 30 transition performance were not checked by hand.

**Fixed in round 1:** (all in `src/app/tokens.test.ts`; `e2e/` and the ADR untouched)

- Minor, pairs: added the placements the modules paint: `--color-text-muted` and `--color-text` on `--color-accent-subtle` and `--color-accent-subtle-press` (preset detail, guest text on hover and press, 4.5:1); `--color-danger-solid` on `--cell-tile-hover`, `--cell-tile-pressed` and `--cell-revealed-fill` (flag and wrong flag, 3:1). All pass in both schemes.
- Minor, bypass guard: colour properties (`color`, `background*`, `border*`, `outline*`, `fill`, `stroke`, `box-shadow`, …) are now checked property by property; after removing `var()`, numbers and function names only keywords, line styles and system colours may remain, so `white` or `red` fail. Longhands `transition-duration` / `transition-delay` must use `var(--duration)` too, and any `animation*` property is allowed only in `LoginView.module.css` (spinner, which must set `animation: none` under reduced motion) and `index.css`. Verified by a temporary mutation (`color: white`, `border: ... red`, `transition-duration: 1s`, `animation-name`), all four reported.
- Nit: the `transition: none !important` exemption is limited to `index.css`.
- Nit: dropped the `--duration` unit test (the AC6 e2e is the oracle for the 200 ms limit and the reduced-motion 0s); the file has 3 tests now.

## Test report

_tester: AC → test mapping, results, defects found._

| AC  | Test(s)                                                                                                                                                                                                                                                                                                                            | Result |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| AC1 | Existing suites unchanged in their behaviour expectations: `e2e/auth.spec.ts`, `e2e/auth-guest.spec.ts`, `e2e/minesweeper.spec.ts`, `e2e/smoke.spec.ts`, 20 unit files (204 tests). Three `auth.spec.ts` specs were rewritten, see "Changed existing specs"                                                                        | PASS   |
| AC2 | `e2e/redesign.spec.ts` › "AC2: one font, one control radius, one primary and one secondary style, one colour per message kind" (login with error, signed in with setup error, lost, won: 1 font family, 1 radius, Start = accent fill, presets = Sign out, guest same fill, error/lost same callout colours, won = success tokens) | PASS   |
| AC3 | `src/app/tokens.test.ts` (developer: parity, about 50 contrast placements, no token bypass, `--duration`) + `e2e/redesign.spec.ts` › "AC3: forced colours keep all seven cell states distinguishable"                                                                                                                              | PASS   |
| AC4 | `e2e/redesign.spec.ts` › "AC4: cell states differ by shape not colour, focus ring is at least 2 px, targets are large enough" (seven states pairwise distinct without colour, focus-visible ring >= 2 px on Sign out, input, Start, cell; Start, presets, Sign out, inputs >= 40 px high, cells >= 24 px)                          | PASS   |
| AC5 | `e2e/redesign.spec.ts` › "AC5: no sideways page scroll, only the board scrolls, nothing overlaps (160, 320, 375, 800 px)" (4 widths x 9x9, 16x30, 30x30)                                                                                                                                                                           | PASS   |
| AC6 | `e2e/redesign.spec.ts` › "AC6: reduced motion has no transition or animation, normal motion at most 200 ms and nothing loops" (also the spinner: static under reduced motion, one animation in normal motion)                                                                                                                      | PASS   |

**Verdict: PASS.** `npm run verify` green (204 unit tests, build, check-dist), `npm run test:e2e` 64 passed.

**Tests added:** 5 (all in `e2e/redesign.spec.ts`, one per AC2 to AC6). **Changed:** 3 existing specs in `e2e/auth.spec.ts`. The new specs were mutation-checked (injected CSS: 300 ms transitions, no scroller overflow, borders and shadows equalised, other radius): AC2, AC3, AC4, AC5 and AC6 failed for the right reason. **After review round 1 (minor and nit fixed).** The forced-colours check no longer compares `innerHTML`: the signature is border, background, glyph shape tag names and digit text, and a separate check requires every glyph shape (and digit) to be painted in a colour different from what is behind it (the cell background, for the exploded mine's spikes its disc). Mutation check: forcing all glyph fills and strokes to `Canvas` made AC3 fail ("flagged, mine, exploded, wrongFlag"). The two "full width" checks in `auth.spec.ts` now compare the button width with the content width of the login card (client width minus padding) instead of its own button row. Re-run: `npm run verify` green, `npm run test:e2e` 64 passed.

The cell-signature helper waits for `document.getAnimations()` to be empty first, because cells fade their shadow for 120 ms (without the wait AC4 was flaky).

**Changed existing specs (`e2e/auth.spec.ts`).** None of the three tested an AC of 001/004 (those ACs say nothing about width, height or ring colour); they pinned the 001 UX look that UX design §13 replaces. Each now asserts the intent without the old pixel values:

- "the focus ring is visible on the sign-in button": focused via Tab, `:focus-visible` matches, outline solid, at least 2 px, not transparent (was: exact `rgb(11, 87, 208)`).
- "AC1: the sign-in button is full width and there is no horizontal scrolling" (375 px): the button is as wide as its button row (full width of its container), over 200 px, at least 40 px high, inside the viewport, no sideways scroll (was: main width - 32 and exactly 40 px).
- "the sign-in button is not stretched to full width" became "the login card stays a readable column and the sign-in button fills it" (900 px): button at most 448 px (28 rem), as wide as its row, horizontally centred (was: under 300 px).

No real regression of 001/004 found: all their behaviour specs pass unchanged.

**Defects:** none.

**Checked, OK (no permanent test).**

- Dark mode: both schemes in all gate-2 screenshots; text, borders, digits, flags, mines, callouts and the Google dark theme look right; contrast of the token pairs is the unit test.
- Forced colours: covered by the AC3 spec; screenshot checked by eye. Hidden tiles keep a thick black border and lip, revealed cells a thin border, the exploded mine a filled disc. Chromium's emulated palette draws `GrayText` dark red, so the thin borders of revealed cells look reddish there; that is the emulation, not a token.
- Reduced motion: covered by the AC6 spec.
- Page never scrolls sideways at 160 px (200 % zoom of 320 px); at 320 and 375 px a 9 x 9 board fits without scrolling (cells 29 and 35 px; the UX design's "about 24.6 px" for 320 is the miscalculation the developer noted); 16 x 30 and 30 x 30 scroll inside the well.
- Layout of the login card at 320, 375 and 800 px, header stacked on narrow and one row on wide: seen in screenshots, plus the existing auth specs.
- Hostile text (`<img onerror>`) and long emails in the header: existing auth specs pass on the new layout.
- Hover and press on a 30 x 30 board (performance of transitions) not measurable in e2e; no lag visible in the screenshot run.

**Not covered by any test (risk, low).** The token contrast test checks token pairs, not which pair a module really uses; a module that paired a wrong token (for example muted text on a tile) would pass. The screenshots show no such pair. Real Google rendering of the sign-in button is checked manually as before.

**Screenshots for gate 2** (throwaway script deleted, PNGs under `screenshots/007/`, gitignored via `/screenshots/`; re-taken after review round 1 because Playwright wipes `test-results/` on every run): light and dark of login idle, login progress, login error, signed in before Start, game in progress (digits 1 to 8, flags, focus ring on one cell), setup error, lost, won, 9 x 9 at 375 px, 16 x 30 at 375 px, zoom evidence 320 px at 200 % (9 x 9 and 30 x 30); plus one forced-colours lost game (light). Things to look at as taste, none broken: the won/lost "Time: 0" because the games end within the same second; the exploded mine reads as a red ring with a small white spiked disc, so it is recognisable mostly as "the red one"; in light mode revealed cells and the well share the same fill, so revealed cells are told apart by the flat look and the digit; the login card keeps an empty 44 px strip at the bottom while no message is shown (by design, so the buttons do not jump).

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

### Round 1 — APPROVED

What I checked myself: `npm run verify` green (204 unit, build, check-dist ok); `npx playwright test` 64/64 passed. I also ran a throwaway probe (scratchpad, not committed) over a lost 5 × 5 game in light, dark, forced-colours light and forced-colours dark.

No blockers, no majors.

**Minor**

- [minor] `src/app/tokens.test.ts:80-121`: the PAIRS table copies the design's pairs (UX §2.2), not the pairs the modules actually paint. Pairs in use that are not listed: preset detail `--color-text-muted` on `--color-accent-subtle` / `--color-accent-subtle-press` (hover and press of the preset buttons, `SetupForm.module.css:61` + `Button.module.css:47,62`), guest text `--color-text` on the same two fills (`LoginView.module.css:29`), flag `--color-danger-solid` on `--cell-revealed-fill` (wrong flag, `Board.module.css:105`) and on `--cell-tile-hover` / `--cell-tile-pressed`. I computed all of them and every one passes; the lowest is dark flag on tile hover at 3.98:1. So nothing is broken. Add these placements so the oracle covers what is actually painted. That closes the tester's "token pairs, not usage" risk cheaply, with no e2e contrast sweep.
- [minor] `src/app/tokens.test.ts:158,171`: the bypass guard misses named colours (`white`, `red`, …) and the longhands `transition-duration` and `animation*`. A grep shows no module uses any of them today. Fix: check colour properties by property (`color`, `background*`, `border*-color`, `fill`, `stroke`, `outline-color`, `box-shadow`); allow only `var(--…)`, `currentColor`, `transparent`, `inherit`, `none` or a system colour keyword.
- [minor] `e2e/redesign.spec.ts:88`: the forced-colours signature includes `innerHTML`, so flagged vs hidden and mine vs exploded mine always differ by markup. The test would still pass if forced colours painted a glyph invisibly (for example Canvas on Canvas). Fix: in the colour branch, replace `innerHTML` with "glyph shapes have a computed fill/stroke different from the cell's background". The probe showed every glyph visible today: flag, pole and slash in `ButtonText`/`CanvasText`, the exploded disc `CanvasText` with an inverted glyph.

**Nits**

- [nit] `src/index.css:52-58`: the global reduced-motion rule (`transition: none !important; animation: none !important`) is **accepted**. It is what UX §7 asks for. It is also the only guard for `animation` and the longhand transitions that the bypass test doesn't check. It doesn't conflict with AC6's spinner exception, because the spinner is static under reduced motion either way. What's left is a documentation gap: Technical design §1 and ADR 0004 still say "no `!important`" and "no module needs its own reduced-motion rule". Input for the architect: add one line to ADR 0004 about this global safety net. Consequence for 008: under reduced motion nothing it adds will animate, and no `transitionend`/`animationend` fires. The bypass test also accepts `'none !important'` in any file; restrict it to `index.css`.
- [nit] `src/app/tokens.test.ts:184-190`: the test "`--duration` ≤ 200 ms and `0s` reduced" duplicates the AC6 e2e. That e2e measures the computed durations of every element and is the oracle. It is the same AC at two levels, so the unit test can go.
- [nit] `e2e/auth.spec.ts:382-399` and `:448-461`: "button width = row width" proves almost nothing, because the row is the button's own flex container. If the row shrank to its content, the equality would still hold. Today the "full width" check rests only on `> 200`; the Google button's own width is about 180 px, so that margin is thin. Compare against the card's content box instead (the `.login` card's `clientWidth` minus its padding). Apart from that, the three rewritten specs are still meaningful. They pinned 001 UX values that UX §13 replaces, not 001 ACs, and they now check the intent: the ring is `:focus-visible`, solid, ≥ 2 px and not transparent; the button fits at narrow widths with no sideways scroll; at wide widths it stays bounded and centred. The ring check overlaps a little with AC4's ring check but covers the Google button, which AC4 does not.
- [nit] `LoginView.module.css` `.message`, `GameStatus.module.css` `.result`, `SetupForm.module.css` `.error`: the same callout block (padding, 4 px bar, radius, background) is written three times. Their consistency now rests on the AC2 e2e equality check. That's fine for 007; extract a shared callout if a fourth one appears.

**Checked, OK**

- AC1: the only JSX changes are the `Button` swap (default `type="button"`, Start keeps `submit`, `ref` and aria props pass through) and the decorative `aria-hidden` disc. No `tabindex`, CSS `order` or reverse changes, and the grid areas are unchanged from 006. No existing expectations changed except the three auth specs. `useBoardInput` only sets `pressedIndex` for flaggable cells, so narrowing `.pressed` to `.hidden.pressed` / `.flagged.pressed` changes no behaviour.
- AC3 forced colours (probe, light and dark): hidden and flagged tiles have a 2 px `ButtonText` border plus a 3 px inset lip; revealed cells a 1 px `GrayText` border and no lip; the exploded mine a 3 px border and a filled disc. Start and Sign out keep 1 px borders, and the 4 px callout bar stays.
- Contrast: I went through every fg/bg pair the modules paint, including hover, press, invalid, callout icons and cell glyphs, in both schemes. All meet 4.5:1 (text) or 3:1 (non-text). The focus ring is offset 2 px from controls, so it sits next to the surface, never the accent fill.
- 008 readiness: `Board.tsx` is unchanged, `.scroller > [role=grid].grid` is unchanged, `key={game.id}` is still the only key (no remount), and cells use only background, border, inset shadow, outline and SVG. The well's `overflow: auto` clips transforms, which UX §9 already hands to 008.
- Security: no new dependency, no markup injection, the guest button is still behind the literal DEV guard, and check-dist passes.

**Note for the orchestrator:** `test-results/gate2-007/` no longer exists. `test-results/` was emptied at 19:04, before this review: Playwright clears its output directory on every run. Regenerate the gate-2 screenshots before gate 2, into a folder outside `test-results/`.

## Retrospective

_orchestrator, 2026-11-02._

Went well: gate 1 in one round with a split (008) and an early feasibility check (CSS 3D,
no dependency), tester PASS without defects, review APPROVED in round 1, minors fixed in
parallel by resumed agents.

### What went wrong

| #   | Problem                                                                                                                     | Root cause                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| P1  | Three AC conflicts (Google branding, login spinner, cell edges) surfaced only in design and needed an extra round with hak. | The visual ACs were written without checking third-party branding rules and existing functional indicators.      |
| P2  | Technical and UX design contradicted each other (`!important`), the ADR drifted until review.                               | Parallel design without a reconciliation step; nobody compared the two before the build.                         |
| P3  | Three old `auth.spec.ts` specs failed because they pinned design values (colour, pixel width).                              | e2e specs asserted the 001 look instead of the AC's intent.                                                      |
| P4  | Review minor: the contrast test copied the design's table instead of the pairs the modules paint.                           | No team rule for how style consistency is tested.                                                                |
| P5  | The gate-2 screenshots were lost before the gate.                                                                           | They were saved under `test-results/`, which Playwright wipes on every run; no fixed place for gate screenshots. |

### Proposed changes

1. **`CLAUDE.md`, Conventions — Styling (P4; architect's suggestion):** colours, radii,
   type sizes and durations come from `src/app/tokens.css` (ADR 0004); no colour literals
   or `font-family` in CSS modules; dark mode only in the token file; every state cue
   also exists as a border, outline or glyph (forced colours). Style rules are enforced
   by one unit test over the CSS, covering the pairs the modules actually paint.
2. **`CLAUDE.md`, Test proportionality (P3):** e2e specs assert an AC's intent, never
   design values (exact colours, pixel sizes) — those live in the tokens and their test.
3. **`/feature` skill + `tester` (P5):** for visual stories the tester takes the gate
   screenshots after the last e2e run into `screenshots/NNN/` (gitignored); the
   orchestrator checks the folder exists before gate 2 and shows hak the key states.
4. **`product-owner` (P1):** for visual stories, check each AC against third-party
   branding rules and existing functional indicators (spinners, focus rings) before
   gate 1 and word exceptions into the AC.
5. **`/feature` skill, step 3 (P2):** when architect and UX ran in parallel, the
   orchestrator compares both sections for contradictions before the build and has
   the architect resolve them (incl. the ADR).

### Outcome

hak signed off the look from the screenshots in `screenshots/007/` and approved all five
proposals at gate 2 ("Ja, alles"). Applied: `CLAUDE.md` Styling convention (1) and the
e2e-intent rule under Test proportionality (2); `.claude/agents/tester.md` and the
`/feature` gate-2 step take and check gate screenshots in `screenshots/NNN/` (3);
`.claude/agents/product-owner.md` checks visual ACs against branding and functional
indicators (4); `/feature` step 3 reconciles parallel designs before the build (5).
