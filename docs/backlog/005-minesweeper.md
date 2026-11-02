---
id: 005
title: Minesweeper with configurable board size and mine count
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
branch: feature/005-minesweeper
supersedes: []
changes: [004/AC7] # the signed-in content is no longer the placeholder text and the counter
superseded-by:
---

# 005 – Minesweeper with configurable board size and mine count

## Original request

> implementiere ein mine sweeper spiel. ich möchte grösse des spielfelds und ANzahl der Bomben festelgen können

## User story

As a signed-in player, I want to play Minesweeper on a board whose size and number of mines I choose myself, so that I can play easy or hard games as I like.

## Context

First domain story after the infrastructure baseline (git tag `base`). Requested by hak on 2026-11-01 in German; the app language stays English like all copy so far.

Interpretation (confirmed at gate 1):

- "Bomben" means the mines of classic Minesweeper.
- "Grösse des Spielfelds" means the number of rows and the number of columns, chosen separately (non-square boards are allowed).
- Classic Minesweeper: a rectangular grid of hidden cells, some of which contain a mine. Revealing a cell with a mine loses the game. Revealing a cell without a mine shows how many of its up to 8 neighbours (horizontal, vertical, diagonal) contain a mine. A cell with 0 neighbouring mines automatically reveals all its neighbours, and so on (flood fill). The player can mark hidden cells with a flag. The player wins when every cell without a mine is revealed.

What exists today: a login screen (Google, plus "Sign in as guest" in development, stories [001](001-login.md) and [004](004-guest-login.md)); once signed in the page shows a header ("Signed in as …", "Sign out"), a placeholder paragraph and a counter button. Nothing is stored (001: every reload shows the login screen).

Constraints confirmed by hak at gate 1 ("Passt, mit Split"). They are constraints unless an AC says otherwise:

- **Where the game lives:** it replaces the placeholder paragraph and the counter button in the signed-in view. Only signed-in users, guests included, can play. The signed-in header stays as it is.
- **Value ranges:** rows and columns 5 to 30; mines 1 to (rows × columns − 9). Defaults on first visit: 9 rows, 9 columns, 10 mines. The mine limit follows from the safe first reveal (AC5): the first revealed cell and its neighbours never contain a mine.
- **Flagging:** a flag has two states only, flagged or not flagged (no question marks). Flag with right-click on desktop and long-press on touch devices (AC6), or with the F key (AC8). The flag count has no limit.
- **Nothing is persisted:** settings, a running game and any times are lost on reload and on sign-out; best times would be a follow-up story.
- **No confirmation** is asked before "Start" discards a game in progress (AC2).
- **Setup stays visible** above the board, also while a game is running, so "Start" restarts with the values in the fields.

Relation to other stories:

- [001/AC1](001-login.md) still holds: someone who is not signed in sees the login screen and no game.
- [004/AC7](004-guest-login.md) says a guest sees "the same signed-in content as a Google user (the counter is visible)". "Same content as a Google user" still holds; the counter in its parenthesis is replaced by the game, hence `changes: [004/AC7]`.
- [006 – Presets and timer](006-minesweeper-presets-timer.md) was split off at gate 1 and extends AC1 and AC2 of this story.

## Acceptance criteria

- **AC1:** Given I am signed in, when I look at the page, then I see inputs for the number of rows, columns and mines, each with a visible label, the allowed range shown next to it, and the values 9, 9 and 10 prefilled, plus a "Start" option, and no board yet. (extended by [006](006-minesweeper-presets-timer.md))
- **AC2:** Given the setup values are valid, when I choose "Start" (the first time, during a game or after a game has ended, without any confirmation), then a new board with exactly the chosen number of rows and columns appears, all cells hidden, the remaining-mines counter shows the number of mines, no win or loss message is shown, and the setup inputs stay visible above the board; and when I only edit the setup values without choosing "Start", then the current board and counter stay unchanged. (extended by [006](006-minesweeper-presets-timer.md))
- **AC3:** Given a value is empty, not a whole number, or outside its allowed range (rows and columns 5 to 30, mines 1 to rows × columns − 9), when I choose "Start", then I see a message that names the problem field and states what is allowed, no board is created, and a game already in progress stays unchanged.
- **AC4:** Given a game in progress, when I reveal a hidden cell that contains no mine and has n ≥ 1 neighbouring mines (8-neighbourhood), then the cell shows the number n; revealing an already revealed cell changes nothing.
- **AC5:** Given a game in progress, when I reveal a hidden cell that contains no mine and has 0 neighbouring mines, then it is shown as empty and all its neighbours are revealed, repeating for every newly revealed empty cell, and flagged cells are not revealed by this; and the first cell I reveal in a game never contains a mine and is shown as empty, so that an area opens.
- **AC6:** Given a game in progress, when I flag a hidden cell with a right-click (mouse) or a long-press (touch), then the cell shows a flag, and when I do the same on the flagged cell, then it is hidden again; while a cell is flagged, trying to reveal it changes nothing, and a revealed cell cannot be flagged.
- **AC7:** Given a game in progress, when I look at the remaining-mines counter, then it shows the number of mines minus the number of flags currently placed, starting at the number of mines, updating on every flag placed or removed, and showing a negative number if there are more flags than mines.
- **AC8:** Given a game in progress, when I use only the keyboard, then the arrow keys move the focus between the cells of the board (not beyond its edges), Enter or Space reveals the focused cell as in AC4 and AC5, and the F key flags or unflags the focused cell as in AC6.
- **AC9:** Given a game in progress, when I reveal a hidden cell that contains a mine, then I see a message that the game is lost, all mines are shown, the mine I revealed is highlighted, flags on cells without a mine are marked as wrong, correctly flagged mines stay flagged, and revealing or flagging cells no longer changes the board.
- **AC10:** Given a game in progress, when I have revealed every cell that contains no mine, then I see a message that the game is won, all mines are flagged, the counter shows 0, and revealing or flagging cells no longer changes the board.

## Out of scope

- Presets (Beginner, Intermediate, Expert) and a timer: story [006](006-minesweeper-presets-timer.md), split off at gate 1.
- "Chording" (clicking a revealed number to reveal its remaining neighbours once enough flags are placed): follow-up story.
- Best times, high-score table, statistics or any other persisted data: follow-up story.
- Saving a running game, or keeping the settings, across a reload or sign-out.
- Question marks as a third flag state.
- Multiplayer, undo, hints, solver, custom themes, sound.
- Any backend, and any use of the signed-in identity beyond showing the game only to signed-in users.

## Open questions

None.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-01 — Story created from hak's request (German, kept verbatim). "Bomben" read as mines, "Grösse des Spielfelds" read as rows and columns (assumptions). ACs written for the answer-independent core of classic Minesweeper. 16 open questions recorded with proposed defaults in brackets, none confirmed. Marks change to 004/AC7 (depends on question 7). 10 ACs, above the ~7 guideline. Status draft. (product-owner)
- 2026-11-01 — Q1: Ranges and defaults? Proposed: rows and columns 5 to 30, mines 1 to (rows × columns − 9), defaults 9 × 9 with 10 mines. — A: "Passt, mit Split" (hak, gate 1) = as proposed. Consequence: AC1 (defaults, ranges shown), AC3 (validation); constraint in Context.
- 2026-11-01 — Q2: Presets in addition to free input (Beginner 9 × 9 / 10, Intermediate 16 × 16 / 40, Expert 16 × 30 / 99)? — A: "Passt, mit Split" (hak, gate 1) = yes, but moved to story 006 by the split. Consequence: no AC here; see 006.
- 2026-11-01 — Q3: First click always safe, including its neighbours? — A: "Passt, mit Split" (hak, gate 1) = yes, mines are placed after the first click. Consequence: second half of AC5; mine limit rows × columns − 9.
- 2026-11-01 — Q4: How to flag, and play without a mouse? — A: "Passt, mit Split" (hak, gate 1) = right-click on desktop, long-press on touch, keyboard with arrow keys, Enter or Space to reveal, F to flag; keyboard and touch play stay in this story (orchestrator recommendation, accepted for accessibility). Consequence: AC6 (mouse and touch flagging) and AC8 (keyboard play).
- 2026-11-01 — Q5: Timer (seconds since the first reveal, stops on win and loss, reset on a new game)? — A: "Passt, mit Split" (hak, gate 1) = yes, but moved to story 006 by the split. Consequence: no AC here; see 006.
- 2026-11-01 — Q6: Chording? — A: "Passt, mit Split" (hak, gate 1) = no, not in this story; follow-up. Consequence: Out of scope.
- 2026-11-01 — Q7: Where does the game live? — A: "Passt, mit Split" (hak, gate 1) = it replaces the placeholder paragraph and the counter; only signed-in users, guests included. Consequence: constraint in Context; `changes: [004/AC7]` confirmed.
- 2026-11-01 — Q8: Persistence? — A: "Passt, mit Split" (hak, gate 1) = nothing persisted, not settings, running game or times; best times a follow-up. Consequence: constraint and Out of scope.
- 2026-11-01 — Q9: Question marks as a third flag state? — A: "Passt, mit Split" (hak, gate 1) = no. Consequence: constraint and Out of scope.
- 2026-11-01 — Q10: Rows and columns separate (non-square boards allowed)? — A: "Passt, mit Split" (hak, gate 1) = yes, separate. Consequence: AC1 and AC3 have separate rows and columns inputs.
- 2026-11-01 — Q11: What does a lost game show? — A: "Passt, mit Split" (hak, gate 1) = the revealed mine is highlighted, flags on cells without a mine are marked as wrong, correctly flagged mines stay flagged. Consequence: AC9.
- 2026-11-01 — Q12: What does a won game show? — A: "Passt, mit Split" (hak, gate 1) = remaining unflagged mines are flagged automatically, counter shows 0. Consequence: AC10.
- 2026-11-01 — Q13: Can the counter go below 0? — A: "Passt, mit Split" (hak, gate 1) = yes, it shows the negative number; no limit on flags. Consequence: AC7.
- 2026-11-01 — Q14: Confirmation before "Start" discards a running game? — A: "Passt, mit Split" (hak, gate 1) = no confirmation. Consequence: AC2.
- 2026-11-01 — Q15: Setup always visible, also during a game? — A: "Passt, mit Split" (hak, gate 1) = yes, above the board. Consequence: AC2.
- 2026-11-01 — Q16: Minimum number of mines? — A: "Passt, mit Split" (hak, gate 1) = minimum 1. Consequence: AC3.
- 2026-11-01 — Scope decision: split. The orchestrator recommended moving presets (Q2) and the timer (Q5) into a follow-up story 006 and keeping keyboard and touch play in 005 for accessibility. — A: "Passt, mit Split" (hak, gate 1). Consequence: story 006 created; ACs folded and merged (overlapping flag, counter, win, loss and restart behaviour merged; 10 ACs remain, flagged as above the ~7 guideline because setup, play and keyboard are not useful alone); open questions now empty; status ready. (product-owner)
- 2026-11-02 — Gate 2: apply all five retro proposals, waive the manual phone check, commit? — A: "Ja, alles" (hak, gate 2). Consequence: proposals applied to tester, ux-designer, architect and the `/feature` skill; phone check recorded as waived in the Test report; status done. (orchestrator)

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

Scope: the signed-in view only. The header ("Signed in as …", "Sign out") and the login view stay as in [001](001-login.md) and [004](004-guest-login.md). The game replaces the placeholder paragraph and the counter. Story [006](006-minesweeper-presets-timer.md) will add presets and a timer; this design only leaves slots for them.

Page colours in use (from `src/index.css`): light page `#FAFAFA`, text `#1A1A1A`; dark page `#161616`, text `#ECECEC`. Focus ring: `#0B57D0` (light), `#A8C7FA` (dark), 2 px solid, as in 001.

### 1. Layout / component tree

```
main
├─ h1 "Software Factory"                         (unchanged)
└─ section aria-labelledby                       the game
    ├─ h2 "Minesweeper"
    ├─ form (noValidate)  onSubmit = Start
    │   └─ fieldset
    │       ├─ legend "Board setup"
    │       ├─ [slot 006: presets group, above the fields]
    │       ├─ div (row of three fields)
    │       │   ├─ field: label "Rows"     + input#rows     + span#rows-hint     "5 to 30"
    │       │   ├─ field: label "Columns"  + input#columns  + span#columns-hint  "5 to 30"
    │       │   └─ field: label "Mines"    + input#mines    + span#mines-hint    "1 to {rows × columns − 9}"
    │       ├─ div (messages, only after a failed Start)
    │       │   └─ p#rows-error / p#columns-error / p#mines-error   (icon + text, one per invalid field)
    │       └─ button type="submit" "Start"
    ├─ [no game yet]  p "Set the board size and the number of mines to begin."
    └─ [game exists]
        ├─ div (status bar)
        │   ├─ p aria-live="polite" aria-atomic="true"   "Mines left: " + <span>{n}</span>
        │   ├─ [slot 006: timer, next to the counter]
        │   └─ div aria-live="polite"                    persistent wrapper; result <p> inside
        │       └─ p  (only when the game has ended)     icon + "You won! Every safe cell is revealed." / "You lost. You revealed a mine."
        └─ div (board scroll container, overflow auto)
            └─ div role="grid" aria-label="Minesweeper board" aria-rowcount aria-colcount [aria-readonly when ended]
                └─ div role="row" × rows
                    └─ div role="gridcell" × columns   roving tabindex, aria-label per cell (section 5)
```

Decisions:

- **Setup is a real `<form>`** with native `<input>`s, `<label>`s and a submit button, so Enter in any field starts a game ("Start" without confirmation, AC2). Inputs are `type="text"` with `inputmode="numeric"` and `autocomplete="off"`, not `type="number"`: a number input hides what the user typed when it is not a number, so "abc" or "5.5" could not be told apart from "empty" and could not be reported as AC3 requires. A valid value is digits only (after trimming spaces).
- **Setup stays visible** above the board at all times (Context). Editing fields never changes the running board or counter (AC2).
- **Game heading:** an `h2` "Minesweeper" keeps one `h1`.
- **Empty state:** before the first "Start" there is no board, no status bar, no counter (AC1); the single line "Set the board size and the number of mines to begin." takes their place. It deliberately does not contain the word "Start".
- **Status bar position:** between setup and board. The counter does not stick to the top while scrolling (a sticky bar would hide focused cells).
- **Slots for 006:** the presets group sits inside the fieldset above the three fields; the timer sits in the status bar next to the counter. No design for them here.
- **Width:** the setup and status bar use the existing `main` column (max 40 rem). The board scroll container may be wider than that column, up to the viewport width minus 1 rem on each side, and is centred when it fits. This needs the signed-in content to break out of the 40 rem limit; developer detail, the visual rule is what counts.

### 2. States

**Setup**

| State                       | What the user sees                                                                                                                                                        | What the user can do                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Idle (AC1)                  | Three labelled inputs with 9, 9 and 10, hints "5 to 30", "5 to 30", "1 to 72", button "Start". No messages.                                                               | Edit values; "Start".                             |
| Invalid after "Start" (AC3) | A message per invalid field below the row of fields, input marked invalid (2 px border in the error colour plus icon in the message). Running game and counter unchanged. | Fix and "Start" again.                            |
| Valid "Start" (AC2)         | All messages gone, new board all hidden, counter at the mine count, no result message, setup still visible.                                                               | Play; "Start" again at any time, no confirmation. |
| Disabled                    | Nothing in the setup is ever disabled (an invalid "Start" explains itself with messages).                                                                                 |                                                   |

**Board and status bar**

| State      | What the user sees                                                                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No game    | Empty-state line only.                                                                                                                                                          |
| Playing    | Counter "Mines left: n"; board with hidden, flagged and revealed cells; no result message.                                                                                      |
| Won (AC10) | Result "You won! Every safe cell is revealed."; all mines flagged; counter "Mines left: 0"; board read-only.                                                                    |
| Lost (AC9) | Result "You lost. You revealed a mine."; all mines shown, the revealed mine highlighted, wrong flags marked, correct flags kept; counter keeps its last value; board read-only. |

Loading and error states of the page do not exist (no network, no async). "Read-only" after the end means: reveal and flag do nothing, arrow keys still move the focus so the result can be inspected, and the grid has `aria-readonly="true"`.

**Cell states** (see section 3 for colours)

| Cell                                                         | Look                                                         | Accessible name (section 5)                               |
| ------------------------------------------------------------ | ------------------------------------------------------------ | --------------------------------------------------------- |
| Hidden                                                       | raised (bevel), flat light-grey fill                         | `Row 3, column 5, hidden`                                 |
| Flagged                                                      | hidden look plus flag glyph                                  | `Row 3, column 5, flagged`                                |
| Revealed, 0 mines nearby                                     | flat, empty                                                  | `Row 3, column 5, empty`                                  |
| Revealed, n mines nearby (1 to 8)                            | flat, digit in its colour                                    | `Row 3, column 5, 2 mines nearby` (`1 mine nearby` for 1) |
| Mine (after a loss, not revealed by the player, not flagged) | flat, mine glyph                                             | `Row 3, column 5, mine`                                   |
| Mine the player revealed (after a loss)                      | flat, mine glyph, tinted fill and 2 px error-coloured border | `Row 3, column 5, exploded mine`                          |
| Wrong flag (after a loss: flag on a safe cell)               | flat, flag glyph with a diagonal slash                       | `Row 3, column 5, wrong flag, no mine here`               |
| Correct flag (after a loss) and auto-flag (after a win)      | same as flagged                                              | `Row 3, column 5, flagged`                                |

Shape cues are never colour alone: hidden vs revealed differ by bevel, flagged by the glyph, mines by the glyph, wrong flag by the slash, numbers by the digit.

### 3. Visual spec (light and dark, with contrast)

Cell size: 32 px square on screens 600 px and wider. Below 600 px: fluid, `clamp(24px, (100vw − 2rem) / columns, 40px)`. 24 px is the minimum (WCAG 2.2 target size, 2.5.8); the board is wider than the screen when the columns do not fit, see section 7. Digits 700 weight, 16 px (14 px when the cell is below 28 px). Cells are separated by 1 px.

| Element                          | Light                                                                                                | Dark                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Hidden cell fill / border        | `#CBD0D6` / 1 px `#6B7076` (border vs page about 4.8:1)                                              | `#4A4F55` / 1 px `#9AA0A6` (border vs page about 6.9:1)                          |
| Hidden bevel                     | top and left 2 px `#FFFFFF`, bottom and right 2 px `#6B7076`                                         | top and left 2 px `#7A8087`, bottom and right 2 px `#202124`                     |
| Revealed cell fill / border      | `#F1F3F4` / 1 px `#B0B5BA`                                                                           | `#202124` / 1 px `#3C4043`                                                       |
| Flag glyph                       | flag `#B3261E`, pole `#1F1F1F`; on hidden fill about 4.2:1 and 11:1                                  | flag `#F28B82`, pole `#ECECEC`; on hidden fill about 3.5:1 and 7:1               |
| Mine glyph                       | `#1F1F1F` on revealed fill about 15:1                                                                | `#ECECEC` on revealed fill about 13:1                                            |
| Exploded mine                    | fill `#F9C6C2`, border 2 px `#B3261E` (about 6.3:1 vs page); glyph about 11:1                        | fill `#5C1A17`, border 2 px `#F28B82` (about 7.6:1 vs page); glyph about 11:1    |
| Wrong flag                       | flag as above plus slash `#1F1F1F` about 15:1 on revealed fill                                       | flag as above plus slash `#ECECEC` about 13:1 on revealed fill                   |
| Focus ring on a cell             | 2 px solid `#0B57D0`, offset -2 px (inside the cell): about 4.1:1 on hidden, about 5.6:1 on revealed | 2 px solid `#A8C7FA`, offset -2 px: about 4.8:1 on hidden, about 9:1 on revealed |
| Hover (hidden cell only)         | `#1F1F1F` overlay at 8 %                                                                             | `#ECECEC` overlay at 8 %                                                         |
| Pressed / long-press in progress | same overlay at 16 %                                                                                 | same overlay at 16 %                                                             |

Digit colours on the revealed fill (all at least 4.5:1; the digit itself, not the colour, carries the number):

| Digit | Light on `#F1F3F4`      | Dark on `#202124`       |
| ----- | ----------------------- | ----------------------- |
| 1     | `#0B57D0` (about 5.7:1) | `#8AB4F8` (about 7.6:1) |
| 2     | `#1E7B34` (about 4.7:1) | `#81C995` (about 8:1)   |
| 3     | `#C5221F` (about 5.1:1) | `#F28B82` (about 6.7:1) |
| 4     | `#5B2A9E` (about 8.2:1) | `#C58AF9` (about 6.3:1) |
| 5     | `#8C1D18` (about 8.1:1) | `#FDA48A` (about 8.2:1) |
| 6     | `#00696B` (about 5.8:1) | `#78D9EC` (about 9.7:1) |
| 7     | `#1F1F1F` (about 15:1)  | `#ECECEC` (about 13:1)  |
| 8     | `#5F6368` (about 5.4:1) | `#BDC1C6` (about 8.7:1) |

Other elements:

| Element             | Light                                                                                                   | Dark                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Input border / text | 1 px `#747775` (about 4.3:1 vs page) / `#1A1A1A`                                                        | 1 px `#9AA0A6` (about 6.9:1) / `#ECECEC`                                     |
| Hint text           | `#5F6368` (about 5.8:1)                                                                                 | `#BDC1C6` (about 10:1)                                                       |
| Invalid input       | 2 px border `#B3261E` (about 6.3:1)                                                                     | 2 px border `#F2B8B5` (about 10:1)                                           |
| Error message text  | `#B3261E` (about 6.3:1) with error icon                                                                 | `#F2B8B5` (about 10:1) with error icon                                       |
| "Start" button      | fill `#0B57D0`, text `#FFFFFF` (about 6.4:1); hover overlay `#FFFFFF` at 8 %; height 40 px, radius 4 px | fill `#A8C7FA`, text `#062E6F` (about 7.5:1); hover overlay `#062E6F` at 8 % |
| Won message         | `#1E7B34` (about 5.1:1) with check icon                                                                 | `#81C995` (about 9:1) with check icon                                        |
| Lost message        | `#B3261E` (about 6.3:1) with cross icon                                                                 | `#F2B8B5` (about 10:1) with cross icon                                       |
| Counter text        | inherited (about 16:1)                                                                                  | inherited (about 14:1)                                                       |

Icons are inline SVG with `aria-hidden="true"`. In forced-colors mode (Windows high contrast) cell borders use `CanvasText`, glyphs use `currentColor`, and the focus ring uses the system focus colour, so every state remains distinguishable.

### 4. Interactions

**Setup**

| Control                                                | Behaviour                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Rows, Columns, Mines inputs                            | Plain text entry. Editing never touches the running game. The Mines hint updates as rows and columns change: when both are valid it reads "1 to {rows × columns − 9}", otherwise "1 to rows × columns − 9". Editing a field clears only that field's error message.                                                                                                                                                      |
| Start (click, Enter, Space, or Enter inside any field) | Trim all three values; each must be digits only and in range (rows, columns 5 to 30; mines 1 to rows × columns − 9). Valid: create the new board (AC2), clear all messages, keep focus on the "Start" button (see focus rules). Invalid: no new board, game unchanged, show one message per invalid field, mark those inputs `aria-invalid="true"`, move focus to the first invalid input (order: Rows, Columns, Mines). |

Validation timing: messages appear only after "Start" is chosen, never while typing or on blur. If rows or columns are invalid, the Mines upper limit cannot be judged: Mines is then only reported if it is empty, not a whole number or below 1.

**Board (pointer)**

| Input                                     | Behaviour                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Left click / tap on a hidden cell         | Reveal (AC4, AC5). The clicked cell becomes the focused (roving) cell.                                                                                                                                                                                                                                                                                                                                                                                     |
| Click / tap on a flagged or revealed cell | Nothing (AC4, AC6).                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Right click (mouse) on any cell           | Toggle flag on a hidden or flagged cell (AC6); nothing on a revealed cell. The browser context menu is suppressed on all board cells (`contextmenu` default prevented) and nowhere else.                                                                                                                                                                                                                                                                   |
| Long press (touch)                        | Press and hold 500 ms on a hidden or flagged cell toggles the flag. After 150 ms the cell shows the pressed overlay (16 %), at 500 ms the flag appears or disappears and the device vibrates for 10 ms where the browser supports `navigator.vibrate`. Lifting the finger after the toggle must not also reveal the cell. Moving more than 10 px or starting a scroll before 500 ms cancels the long press and the tap. A tap shorter than 500 ms reveals. |
| After the game has ended                  | Reveal and flag do nothing, with every input method.                                                                                                                                                                                                                                                                                                                                                                                                       |

Touch details for the developer: `touch-action: manipulation`, `user-select: none`, `-webkit-touch-callout: none` on cells, so the browser shows no text selection or callout menu. On touch, the flag is toggled by the 500 ms timer only; the `contextmenu` event that some mobile browsers fire after a long press must be ignored for touch so that the flag is not toggled twice.

**Board (keyboard, AC8)**

| Key                                     | Behaviour                                                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Arrow Left / Right / Up / Down          | Move focus one cell; stop at the edges (no wrap). Default scrolling is prevented.                                  |
| Enter or Space                          | Reveal the focused cell as in AC4 and AC5 (nothing on a flagged or revealed cell). Space does not scroll the page. |
| F (any case, no Ctrl, Meta or Alt held) | Toggle flag on the focused cell as in AC6. Browser shortcuts such as Ctrl+F are not touched.                       |
| Home / End                              | Optional extra: first / last cell of the row. Ctrl+Home / Ctrl+End: first / last cell of the board.                |
| Tab / Shift+Tab                         | Leave the board (the board is one tab stop).                                                                       |

The board is one tab stop with a roving tabindex: exactly one cell has `tabindex="0"` (the last focused cell, initially row 1, column 1, reset on every new board), all others `tabindex="-1"`. Focus moves onto the cell element itself; the browser scrolls it into view.

**Focus rules**

| Event                           | Focus                                                                                                                                     |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Page load of the signed-in view | Unchanged from 001/004 (`#identity` after a sign-in).                                                                                     |
| "Start" succeeds                | Stays on "Start". Reason: do not steal focus; the board is the next tab stop; the start announcement (section 5) is read.                 |
| "Start" fails                   | First invalid input. Its error message is part of its description, so the problem is read out on focus.                                   |
| Reveal or flag (any input)      | The acted-on cell is focused and stays focused; no focus jump after flood fill.                                                           |
| Game won or lost                | Stays on the current cell. The result is announced by the live region, not by moving focus. Arrow keys keep working to inspect the board. |
| Sign out                        | As in 001: the "Sign in with Google" button.                                                                                              |

### 5. Accessibility

- **Grid semantics (assumption, to align with the architect):** `role="grid"` > `role="row"` > `role="gridcell"` on plain elements, with a **roving tabindex on the gridcells** and focus on the gridcell element itself. No `<button>` inside the cells: the arrow-key model of AC8 is the ARIA grid pattern, and a button per cell would add 900 extra roles and make "revealed" cells look actionable. Click, `contextmenu` and `keydown` handlers sit on the grid or the cells. If the architect prefers a different focus model (for example `aria-activedescendant` on the grid), the accessible names, the live regions and the focus rules above stay valid; only where DOM focus sits changes. Flagged for alignment.
- **Names:** the grid has `aria-label="Minesweeper board"`, `aria-rowcount` and `aria-colcount` set to the board size. Each cell has an `aria-label` as in the cell table (numbers 1-based). The visible digit is `aria-hidden` inside the cell so the name is not read twice.
- **Setup:** each input has a visible `<label>` and `aria-describedby="…-hint …-error"` (the error id only while shown); invalid inputs have `aria-invalid="true"`. The fieldset legend is "Board setup". Native form: Enter submits.
- **Live regions:**
  - The counter paragraph is `aria-live="polite"` and `aria-atomic="true"`, so "Mines left: 9" is read after each flag toggle. This is the only feedback a screen reader user gets for a flag change on the focused cell besides the changed cell name.
  - **Start announcement (visually hidden):** a `div aria-live="polite"` with no `role` is mounted from the first render of the signed-in view and stays empty until the first successful Start. Each successful Start sets its text to the copy row "New game: {rows} by {columns}, {mines} mines.". It is visually hidden with the usual clip pattern, not `display: none` and not removed from the DOM, which would silence it. It has no visible colour, so no colour values apply in either scheme. Identical settings give identical text and screen readers do not repeat an unchanged region, so on each Start the text is cleared and set again after about 100 ms. An invalid Start does not touch it. It replaces the counter announcement named for "Start succeeds" in section 4.
  - The result message sits in a persistent `div aria-live="polite"` (no `role`, so `queryByRole('status')` and `queryByRole('alert')` find nothing before the end). The result `<p>` is rendered only when the game has ended.
  - Validation messages are not live; the focus move to the first invalid field announces them.
- **Text rules for queries:** "Start" is the exact text of the button and no other element. "You won! Every safe cell is revealed." and "You lost. You revealed a mine." are each on exactly one element and only after the matching game end; no other string uses the words "won" or "lost". "Rows", "Columns" and "Mines" are exact label texts; the counter label is "Mines left:", and cell names contain "mine" or "mines", so tests must query labels with exact strings, not `/mines/i`.
- **Keyboard flow (signed in):** Tab order is "Sign out", Rows, Columns, Mines, "Start", the board (one stop). Nothing is reachable only by mouse or touch; long-press flagging has the F key as its keyboard equivalent.
- **Contrast and target size:** all values in section 3 (AA text 4.5:1, non-text 3:1). Cells are at least 24 px (2.5.8); setup fields and "Start" are at least 40 px high.
- **Motion:** no animation is required; the pressed overlay is a colour change.
- **Reflow:** the board is a two-dimensional game surface and may scroll in both directions (WCAG 1.4.10 exception); everything else (setup, messages, status bar) reflows at 320 px and 200 % zoom without horizontal scrolling.

### 6. Copy (exact strings; tests query by these)

| Where               | Text                                                                                                                                                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Game heading (`h2`) | `Minesweeper`                                                                                                                                                                                                           |
| Fieldset legend     | `Board setup`                                                                                                                                                                                                           |
| Labels              | `Rows`, `Columns`, `Mines`                                                                                                                                                                                              |
| Hint rows / columns | `5 to 30` (both)                                                                                                                                                                                                        |
| Hint mines          | `1 to {rows × columns − 9}` (for 9 and 9: `1 to 72`); if rows or columns are invalid: `1 to rows × columns − 9`                                                                                                         |
| Default values      | `9`, `9`, `10`                                                                                                                                                                                                          |
| Start button        | `Start`                                                                                                                                                                                                                 |
| Error rows          | `Rows must be a whole number from 5 to 30.`                                                                                                                                                                             |
| Error columns       | `Columns must be a whole number from 5 to 30.`                                                                                                                                                                          |
| Error mines         | `Mines must be a whole number from 1 to {rows × columns − 9}.` (for example `Mines must be a whole number from 1 to 72.`); if rows or columns are invalid: `Mines must be a whole number from 1 to rows × columns − 9.` |
| Empty state         | `Set the board size and the number of mines to begin.`                                                                                                                                                                  |
| Counter             | `Mines left: ` + number in its own `<span>` (for example `Mines left: 10`, `Mines left: -2`); negative numbers use the ASCII hyphen-minus                                                                               |
| Start announcement  | `New game: {rows} by {columns}, {mines} mines.` (for example `New game: 9 by 9, 10 mines.`); visually hidden, see section 5                                                                                             |
| Won                 | `You won! Every safe cell is revealed.`                                                                                                                                                                                 |
| Lost                | `You lost. You revealed a mine.`                                                                                                                                                                                        |
| Grid name           | `Minesweeper board`                                                                                                                                                                                                     |
| Cell names          | `Row {r}, column {c}, hidden` / `flagged` / `empty` / `1 mine nearby` / `{n} mines nearby` (n = 2 to 8) / `mine` / `exploded mine` / `wrong flag, no mine here`                                                         |

The error messages use the same wording for "empty", "not a whole number" and "out of range" (one message per field states what is allowed, AC3).

### 7. Responsive behaviour

Below 600 px:

- Setup: the three fields stay in one row, each a third of the width (minimum 5 rem so labels and 3-digit values fit; the row wraps to two lines below about 340 px). "Start" is full width below the row, 40 px high. Error messages are full width below the row (not inside the narrow field columns), each linked to its input.
- Status bar: counter (and later the timer) in one row; the result message below it, full width, text wraps.
- Board: fluid cell size `clamp(24px, (100vw − 2rem) / columns, 40px)`. A 9 × 9 board is about 38 px per cell on a 375 px phone and fits with no scrolling. A 30 × 30 board is 24 px per cell and 720 px wide: the board scroll container scrolls horizontally inside its own box (`overflow: auto`, `max-width: 100%`); the page itself does not scroll sideways. Vertical scrolling is the page's. Because the cells are focusable, keyboard users scroll implicitly by moving the focus; the container needs no extra tab stop.
- Touch: long-press flagging as in section 4; a drag scrolls the board and never reveals or flags.

600 px and wider:

- Cells are 32 px. A 30 × 30 board is 960 px wide: it exceeds the 40 rem column, so the board container is as wide as the viewport (minus 1 rem each side) and scrolls only if the viewport is narrower than the board. Boards that fit are centred.
- Setup: three fields and "Start" in one row, "Start" aligned to the input baseline.

### 8. Open points for architect / PO

1. **Focus model:** roving tabindex on `role="gridcell"` elements (section 5). The architect confirms, or names the alternative.
2. **Text inputs instead of `type="number"`:** needed to report non-numbers (AC3); the architect's validation function takes the raw strings.
3. **Board wider than the 40 rem column:** the signed-in layout must allow this (section 1).
4. **Touch:** flag by the 500 ms timer only; the `contextmenu` event is ignored for touch. Pointer events vs separate touch events is the architect's choice.
5. **Counter shows `-n` with a hyphen-minus** (tests, AC7), not the typographic minus.
6. **Start announcement for one mine:** the copy row gives "New game: 9 by 9, 1 mines." for one mine. Proposed: "1 mine" (singular, as in "1 mine nearby"). PO or hak to confirm before tests are written.

### 9. Superseded parts of the earlier UX designs

001 and 004 are not edited. Where they disagree with this section, this section wins in the signed-in view. The login view and the signed-in header are not affected.

From the 004 UX design:

- §1 tree, line "[view: signed in] unchanged; header reads "Signed in as Guest" for a guest": the header part holds, but the content below it is now the game, not the placeholder and counter.
- §2 States, row "Signed in as guest (AC7, AC8)": "counter visible" now means the game (setup, status bar with "Mines left: n", board) is visible; header and "Sign out" unchanged.
- §4 Tab order, bullet "Signed-in view: unchanged ("Sign out", then the counter controls)": now "Sign out", Rows, Columns, Mines, "Start", then the board as one tab stop.

From the 001 UX design (and still quoted by 004):

- §1 tree, [view: signed in]: the placeholder paragraph ("Your app starts here. Run /feature to build the first story.") and `Counter` are replaced by the game section.
- §1 Decisions, "Counter and placeholder paragraph: shown only in the signed-in view": replaced by "the game is shown only in the signed-in view"; still presentation, not protection.
- §2 States, rows "Signed in, name available" and "Signed in, no name": "Below: `h1`, placeholder text, counter" becomes "Below: `h1`, the game".
- §3 Interactions, row "Counter | Unchanged": no longer applies (there is no counter button).
- §4 Copy, row "Placeholder paragraph, counter | unchanged from the current app": no longer applies.
- §6 Keyboard flow, "Signed-in view: Tab order is "Sign out", then the counter controls": see the 004 item above.
- §7 Responsive, "Counter: unchanged behaviour; it must still fit at 320 px": replaced by section 7 above (board scrolls inside its own container; the rest reflows).
- The 40 rem content column (`App.module.css`, `.main`) no longer limits the signed-in view for the board; see section 1.

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

### 1. Decisions in short

- **Pure game logic** in `src/features/minesweeper/logic/` (no React, no DOM). The UI is a
  thin layer over one reducer. Board size is at most 30 × 30 = 900 cells, so plain arrays
  indexed by `row * cols + col` are enough.
- **State:** `useReducer(gameReducer)` for the game (`GameState | null`; `null` = no board
  yet, AC1). `useState` for the raw setup strings and validation errors. Both live in the
  `Minesweeper` container. Nothing is persisted. Sign-out unmounts the container, so
  everything is lost, as the story requires.
- **Randomness stays out of the reducer.** "Start" generates a `seed` in the event handler
  (`crypto.getRandomValues`). The reducer places mines on the first reveal using a seeded
  PRNG, so it's pure and deterministic. That matters because React StrictMode calls
  reducers twice; with `Math.random()` inside, both calls would place different mines.
- **e2e fixed layout:** `window.__minesweeperMines` is read only under
  `import.meta.env.DEV && import.meta.env.MODE === 'e2e'` (CLAUDE.md "Dev-only code"), and
  the string is added to `scripts/check-dist.mjs`.
- **Board rendering:** `role="grid"` > `role="row"` > `role="gridcell"` (plain
  elements, no `<button>` per cell, as in UX design §6) with a **roving tabindex on the
  gridcells** (one tab stop). Event delegation at grid level means memoized cells get no
  callbacks. Long-press is our own pointer-event timer, because iOS Safari fires no
  `contextmenu` on long-press.
- **No new dependency, no ADR.** Everything here is local to the feature and cheap to
  change. The seeded PRNG is ~10 lines (`src/lib/seededRandom.ts`).

### 2. AC → mechanism

| AC   | Mechanism                                                                                                                                                                                                          |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC1  | `SetupForm` with three labelled text inputs (raw strings `'9'`, `'9'`, `'10'`), range hints from `setupLimits(raw)`, "Start"; game state `null` → no `Board`.                                                      |
| AC2  | "Start" → `validateSetup` ok → `dispatch({ type: 'start', config, seed, fixedMines })` → fresh `GameState` (new `id`, all `hidden`, phase `ready`). Editing inputs only changes the setup strings, never the game. |
| AC3  | `validateSetup` returns per-field errors → shown, **no dispatch**, so the running game stays untouched.                                                                                                            |
| AC4  | Reducer `reveal`: hidden non-mine cell → `revealed`; `adjacent[i]` rendered as the number; revealed/flagged → same state.                                                                                          |
| AC5  | First `reveal` in phase `ready` → `placeMines` excludes the 3 × 3 zone around the cell → that cell has 0 neighbours → iterative flood fill; flagged cells are skipped.                                             |
| AC6  | `toggleFlag`: `hidden ⇄ flagged`; ignored on `revealed`; `reveal` on `flagged` → same state. Mouse: `contextmenu`. Touch: long-press timer (§6).                                                                   |
| AC7  | Derived: `config.mines − flagCount` (can be negative).                                                                                                                                                             |
| AC8  | Grid `onKeyDown`: arrows move `activeIndex` (clamped at edges); Enter/Space → `reveal(activeIndex)`; `f`/`F` → `toggleFlag(activeIndex)`; all in one grid `onKeyDown`.                                             |
| AC9  | `reveal` on a mine → phase `lost`, `explodedIndex`; `cellView()` derives shown mines, the exploded mine, wrong flags and kept correct flags; the reducer ignores all actions except `start` in `won`/`lost`.       |
| AC10 | After each `reveal`: `revealedCount === rows × cols − mines` → phase `won`, all mine cells become `flagged` (so `flagCount = mines` and the counter shows 0); frozen as in AC9.                                    |

### 3. Files

| Path                                                                         | Responsibility                                                                                                                                                                                                        |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/seededRandom.ts`                                                    | `seededRandom(seed: number): () => number` (mulberry32). Framework-agnostic.                                                                                                                                          |
| `src/features/minesweeper/logic/types.ts`                                    | `GameConfig`, `CellState`, `GamePhase`, `GameState`, `GameAction`, `SetupValues`, `SetupErrors`.                                                                                                                      |
| `src/features/minesweeper/logic/grid.ts`                                     | `neighbours(index, rows, cols): number[]` (8-neighbourhood, edge-aware), `toIndex`/`toRowCol`.                                                                                                                        |
| `src/features/minesweeper/logic/placeMines.ts` (+ test)                      | `placeMines(config, safeIndex, random): boolean[]`: partial Fisher–Yates over all indices outside the 3 × 3 zone; `adjacentCounts(mines, rows, cols): number[]`.                                                      |
| `src/features/minesweeper/logic/gameReducer.ts` (+ test)                     | `gameReducer(state: GameState \| null, action)`: `start`, `reveal` (placement on the first reveal, iterative flood fill, win/loss), `toggleFlag`.                                                                     |
| `src/features/minesweeper/logic/cellView.ts`                                 | `cellView(state, index): CellView`, the display state for one cell, incl. the AC9 end-state view. Tested via the reducer tests.                                                                                       |
| `src/features/minesweeper/logic/validateSetup.ts` (+ test)                   | `validateSetup(values: SetupValues)` → `{ ok: true; config } \| { ok: false; errors }`; `setupLimits(values)` for the range hints. Constants `MIN_SIZE = 5`, `MAX_SIZE = 30`, `SAFE_ZONE_CELLS = 9`, `DEFAULT_SETUP`. |
| `src/features/minesweeper/Minesweeper.tsx`                                   | Container: setup state, `useReducer(gameReducer, null)`, Start handler (validate → seed → fixed e2e layout → dispatch); renders `SetupForm`, `GameStatus`, `Board`.                                                   |
| `src/features/minesweeper/SetupForm.tsx` + `.module.css`                     | Three inputs, range hints, per-field errors, Start (`<form noValidate onSubmit>`).                                                                                                                                    |
| `src/features/minesweeper/GameStatus.tsx` + `.module.css`                    | Remaining-mines counter and the won/lost message (live region per UX).                                                                                                                                                |
| `src/features/minesweeper/Board.tsx` + `.module.css`                         | `role="grid"`, rows, roving tabindex, delegated mouse/keyboard/pointer handlers; `key={game.id}` from the parent resets focus per game.                                                                               |
| `src/features/minesweeper/Cell.tsx`                                          | `memo` component: one `role="gridcell"` element with `aria-label` per UX, showing a `CellView`; no callbacks, `data-index` for delegation.                                                                            |
| `src/features/minesweeper/useBoardInput.ts`                                  | Hook: `activeIndex`, key handling (arrows/F), focus moves, long-press timer and click suppression (§6).                                                                                                               |
| `src/app/App.tsx`                                                            | Replace placeholder `<p>` + `<Counter />` with `<Minesweeper />` (005 changes 004/AC7).                                                                                                                               |
| `src/features/counter/`                                                      | **Delete** (no longer used; its unit test goes too).                                                                                                                                                                  |
| `scripts/check-dist.mjs`                                                     | Add `'__minesweeperMines'` to `FORBIDDEN`.                                                                                                                                                                            |
| `e2e/minesweeper.spec.ts` (_tester_)                                         | One test per AC (§8).                                                                                                                                                                                                 |
| `e2e/smoke.spec.ts`, `e2e/auth.spec.ts`, `e2e/auth-guest.spec.ts` (_tester_) | Replace counter references (smoke, 004/AC7 "counter visible", the tab-order comment) with the game setup ("Start" button visible).                                                                                    |

### 4. Types

```ts
// logic/types.ts
export interface GameConfig {
  readonly rows: number; // 5..30
  readonly cols: number; // 5..30
  readonly mines: number; // 1..rows*cols-9
}
export type CellState = 'hidden' | 'flagged' | 'revealed';
export type GamePhase = 'ready' | 'playing' | 'won' | 'lost'; // ready = board shown, no reveal yet

export interface GameState {
  readonly id: number; // +1 per Start; React key for Board, reset hook for 006's timer
  readonly config: GameConfig;
  readonly phase: GamePhase;
  readonly seed: number;
  readonly fixedMines: readonly number[] | null; // e2e/unit only: used instead of random placement
  readonly mines: readonly boolean[] | null; // null until the first reveal
  readonly adjacent: readonly number[] | null; // neighbour mine counts, computed with mines
  readonly cells: readonly CellState[];
  readonly revealedCount: number;
  readonly flagCount: number;
  readonly explodedIndex: number | null;
}

export type GameAction =
  | {
      readonly type: 'start';
      readonly config: GameConfig;
      readonly seed: number;
      readonly fixedMines?: readonly number[] | undefined;
    }
  | { readonly type: 'reveal'; readonly index: number }
  | { readonly type: 'toggleFlag'; readonly index: number };

// Raw input strings, so "not a whole number" is detectable and 006 presets just set them.
export interface SetupValues {
  readonly rows: string;
  readonly cols: string;
  readonly mines: string;
}
export type SetupField = keyof SetupValues;
export type SetupError =
  | { readonly kind: 'required' }
  | { readonly kind: 'notWholeNumber' }
  | { readonly kind: 'outOfRange'; readonly min: number; readonly max: number }
  // mines when rows/cols are invalid, so the max is unknown
  | { readonly kind: 'dependsOnSize' };
export type SetupErrors = Partial<Record<SetupField, SetupError>>;

// logic/cellView.ts
export type CellView =
  | { readonly kind: 'hidden' }
  | { readonly kind: 'flagged' }
  | { readonly kind: 'number'; readonly count: number } // 1..8
  | { readonly kind: 'empty' }
  | { readonly kind: 'mine' } // lost: unflagged mine shown
  | { readonly kind: 'mineExploded' } // lost: the mine I revealed
  | { readonly kind: 'flagWrong' }; // lost: flag on a cell without a mine
// Lost + flagged mine stays 'flagged'; won: all mines are already 'flagged' in cells.
```

```ts
// Component props
export interface SetupFormProps {
  readonly values: SetupValues;
  readonly errors: SetupErrors;
  readonly onChange: (field: SetupField, value: string) => void;
  readonly onStart: () => void;
}
export interface GameStatusProps {
  readonly remainingMines: number;
  readonly phase: GamePhase;
}
export interface BoardProps {
  readonly game: GameState;
  readonly onReveal: (index: number) => void;
  readonly onToggleFlag: (index: number) => void;
}
export interface CellProps {
  readonly index: number;
  readonly row: number;
  readonly col: number;
  readonly view: CellView;
  readonly isActive: boolean; // tabIndex 0 vs -1
}
// Board sets aria-readonly="true" on the grid when phase is won/lost (UX).
```

### 5. Game rules in the reducer

- **`start`:** builds a new state (`id = (prev?.id ?? 0) + 1`, all `hidden`, phase `ready`,
  `mines`/`adjacent` `null`). It's accepted in every phase (no confirmation, AC2). If
  `fixedMines` is set, the reducer checks it: length equals `config.mines`, indices are in
  range, no duplicates. Otherwise it **throws** (test-only path, so fail fast).
- **`reveal(i)`** (every guard returns the **same state object**):
  1. Phase `won`/`lost`, or cell `flagged`/`revealed` → no change.
  2. Phase `ready` → `mines = fixedMines ?? placeMines(config, i, seededRandom(seed))`,
     `adjacent = adjacentCounts(...)`, phase `playing`.
  3. `mines[i]` → phase `lost`, `explodedIndex = i`, done.
  4. Flood fill, iterative: copy `cells`, `stack = [i]`. While the stack isn't empty: pop
     `j`; skip unless `hidden`; mark `revealed`, `revealedCount++`; if `adjacent[j] === 0`,
     push all `hidden` neighbours. Flagged cells are never revealed. Mines are never reached,
     because only zero-count cells expand. The work is O(cells), with no recursion, so a
     30 × 30 board can't overflow the stack.
  5. `revealedCount === rows × cols − mines` → phase `won`; every mine cell becomes
     `flagged`; `flagCount = mines`.
- **`toggleFlag(i)`:** only in `ready`/`playing`; `hidden ⇄ flagged`, `flagCount ± 1`;
  `revealed` → no change. Flags before the first reveal are allowed. A flagged cell inside
  the later safe zone just stays flagged, and the flood fill skips it.
- **`placeMines`:** candidates = all indices outside the 3 × 3 zone (the zone is clipped at
  edges, so it can be smaller than 9 cells, which only adds candidates). Partial
  Fisher–Yates picks `mines` of them. `mines ≤ rows × cols − 9` guarantees enough
  candidates.
- **Derived in render, not stored:** remaining mines `config.mines − flagCount`; `cellView`
  per cell.

### 6. Input model (board)

- **Focus: roving tabindex.** `activeIndex` (state in `useBoardInput`, initially 0) is the
  only cell with `tabIndex={0}`; all others have `-1`. Arrow keys clamp at the edges (AC8),
  call `preventDefault` (no page scroll), set `activeIndex` and focus that button (refs
  through a `Map<number, HTMLButtonElement>`, or `querySelector('[data-index="…"]')`
  inside the grid). Clicking a cell also makes it active. `Board` gets `key={game.id}`, so a
  new game resets focus to cell 0. Focus stays on the Start button after Start; UX may
  decide otherwise.
- **Reveal:** mouse/tap via a delegated grid `onClick` (left button only, target's
  closest `[data-index]`). Enter/Space via grid `onKeyDown` on `activeIndex`, with
  `preventDefault` so Space doesn't scroll. There's no native button, so nothing activates
  twice. Ignore `event.repeat` for Enter, Space and F, so a held key doesn't toggle a flag
  repeatedly.
- **Flag (mouse):** grid `onContextMenu` → always `preventDefault()`. If the last
  `pointerdown` was `mouse`/`pen`, toggle the flag on the target cell.
- **Flag (keyboard):** `onKeyDown` key `f`/`F` without Ctrl/Meta/Alt (UX) → toggle the
  flag on `activeIndex`.
- **Flag (touch, long-press):** on `pointerdown` with `pointerType === 'touch'`, start a
  timer `LONG_PRESS_MS = 500`. `pointerup`, `pointercancel`, or `pointermove` farther than
  `LONG_PRESS_MOVE_TOLERANCE_PX = 10` cancel it, so panning a large board still works.
  The pressed overlay after 150 ms and the vibration are UX details on top. When
  it fires: toggle the flag, set `suppressClickRef`, and the next `click` on that cell is
  swallowed (otherwise it would also reveal). A `contextmenu` during a touch press only
  gets `preventDefault` and doesn't toggle: Android fires it on long-press, and toggling
  there too would flag twice. Clear the timer on unmount.
- **CSS for the board** (developer, with UX): `touch-action: manipulation` (not `none`,
  panning must work), `user-select: none`, `-webkit-touch-callout: none`.
- **Rendering 900 cells:** `Cell` is `memo` with primitive/stable props (`view` objects are
  recreated per render, so compare with a custom `areEqual` on `view.kind`/`count`, or pass
  `kind` and `count` as separate primitive props, which is simpler). Each action then
  re-renders the grid shell plus only the changed cells. No virtualization: 900 buttons are
  fine.

### 7. Setup, validation and App

- **Setup state** lives in `Minesweeper`: `values: SetupValues` (default `'9'/'9'/'10'`),
  `errors: SetupErrors` (shown only after Start, AC3). Editing a field changes only
  `values`, never the game (AC2). Recommendation to UX: `type="text"` with
  `inputMode="numeric"` and `<form noValidate>`. With `type="number"`, browsers turn text
  like "abc" into `''` and add their own validation popups, which would blur "not a whole
  number" and "empty".
- **`validateSetup`:** trim; `''` → `required`; not `/^\d+$/` → `notWholeNumber` (rejects
  `4.5`, `-3`, `1e2`); rows/cols outside 5..30 → `outOfRange`; mines: if rows and cols are
  valid, check `1..rows*cols−9`. Otherwise `required`/`notWholeNumber`/`< 1` still apply,
  and a high value gets `dependsOnSize`. All field errors are returned; UX writes the
  wording (AC3: names the field, states what is allowed).
- **Range hints (AC1):** `setupLimits(values)` gives min/max per field. The mines max uses
  the current valid rows/cols; otherwise UX shows the formula.
- **Start handler** (`Minesweeper`):
  `validateSetup(values)` → on error `setErrors` and stop. On success: `setErrors({})`, then
  `seed = crypto.getRandomValues(new Uint32Array(1))[0] ?? 0` and

  ```ts
  const fixedMines =
    import.meta.env.DEV && import.meta.env.MODE === 'e2e'
      ? toIndices(window.__minesweeperMines, config) // [[row, col], …] → indices; undefined if unset
      : undefined;
  dispatch({ type: 'start', config, seed, fixedMines });
  ```

  Write the guard literally here. `toIndices` is a tiny function in the same file, used
  only inside the guard. The `Window` augmentation is type-only. Add `'__minesweeperMines'`
  to `FORBIDDEN` in `scripts/check-dist.mjs` in the same change.

- **e2e usage:** `await page.evaluate(() => { window.__minesweeperMines = [[0, 0], [4, 4]]; })`
  before clicking Start (each spec declares the `Window` type locally, as for
  `__fakeGoogle`). A fixed layout is used as is: the test picks a first reveal outside
  its mines.
- **App:** in the signed-in branch, replace the placeholder `<p>` and `<Counter />` with
  `<Minesweeper />`; delete `src/features/counter/`. No guard logic: the login/signed-in
  switch already hides the game (001/AC1).
- **Story 006 slots in without rework:** presets only call `setValues(...)` (setup strings
  are already the source of truth; Start still needed). The timer is a hook over
  `game.id` + `game.phase` transitions (`ready → playing` starts it, `won`/`lost` stop it, a
  new `id` resets it), possibly with a `now` field added to the actions then. Nothing for
  006 gets built now.

### 8. Testability (minimal set)

**Unit (pure logic only; this is where the branching lives):**

- `validateSetup.test.ts`: one `it.each` table:
  - defaults ok;
  - `''`, `' '`, `'4.5'`, `'-3'`, `'abc'`;
  - rows/cols 4/5/30/31;
  - mines 0/1;
  - 9 × 9 with 72 ok and 73 too many;
  - mines with invalid rows → `dependsOnSize`;
  - several errors at once.
- `placeMines.test.ts`: exact count; never in the 3 × 3 zone (centre, edge, corner); same
  seed gives the same layout; maximum density (`rows × cols − 9`) fills every non-zone cell.
- `gameReducer.test.ts` (fixed layouts via `fixedMines`):
  - start: fresh, all hidden;
  - AC4: number, and revealing again changes nothing;
  - AC5: flood fill opens zeros plus their border, skips flags; first reveal with random
    placement is empty;
  - AC6: flag rules;
  - AC7: `flagCount`;
  - AC9: lost plus `cellView` end-state mapping, frozen;
  - AC10: won, mines flagged, frozen;
  - invalid `fixedMines` throws;
  - 30 × 30 with 1 mine: a single reveal wins (worst-case flood, no recursion).

**e2e (`e2e/minesweeper.spec.ts`, one test per AC, names start with the AC; sign in via
the e2e fake first):**

- AC1: labels, range hints, defaults, Start, no grid.
- AC2: Start creates a grid with rows × cols cells and the counter; editing without Start
  changes nothing; restart during a game.
- AC3: one invalid value shows the message and the existing game stays (the full matrix is
  unit-tested).
- AC4: fixed layout, a numbered cell.
- AC5: random placement on 5 × 5 with 16 mines, centre click. This is deterministic without
  any hook: the centre is empty, its 8 neighbours show numbers, and the board is won, which
  is fine. Plus one fixed-layout check that a flag blocks the flood.
- AC6: right-click flag/unflag; long-press with `pointerType: 'touch'` (dispatch
  `pointerdown`, wait > 500 ms, `pointerup`) flags without revealing; revealing a flagged
  cell does nothing.
- AC7: counter after flags, including negative.
- AC8: keyboard only (arrows with edge clamp, Enter/Space reveal, F flag).
- AC9: fixed layout, reveal a mine: message, mines shown, exploded highlighted, wrong flag
  marked, board frozen.
- AC10: fixed layout, reveal all safe cells: message, all mines flagged, counter 0, frozen.

**Not written:** component tests for `SetupForm`/`Board`/`Cell`/`GameStatus` (e2e shows
them), tests of `seededRandom` and `grid` beyond what `placeMines`/reducer tests cover, and
a unit test of the long-press hook (e2e AC6 covers it).

**Check (not a test):** `npm run verify` includes `check:dist`, with `__minesweeperMines`
added. Manual: a 30 × 30 board on a phone (panning, long-press) and on desktop (no lag on
reveal).

### 9. Risks

1. **Impure reducer** (randomness or `Date.now()` inside) gives different boards under
   StrictMode's double call. Mitigation: seed in the action, PRNG in the reducer.
2. **Long-press double actions** (long-press plus `contextmenu` on Android, or long-press
   plus click). Mitigation: §6 rules, e2e AC6, and a manual check on a real phone (iOS and
   Android).
3. **Board wider than the page** (30 columns × ~32 px = 960 px vs. `main` max-width 40rem).
   UX decides cell size, horizontal scrolling or a wider layout.
4. **e2e hook leaking into production:** literal guard plus `check:dist` (§7).
5. **Re-render cost:** `memo` with primitive props (§6). Check manually on 30 × 30.
6. **Existing specs reference the counter** (smoke, 004/AC7, tab order). The tester updates
   them in the same change.

### 10. Implementation plan (developer, in order)

1. `src/lib/seededRandom.ts`; `logic/types.ts`, `logic/grid.ts`.
2. `logic/validateSetup.ts` + test.
3. `logic/placeMines.ts` + test.
4. `logic/gameReducer.ts`, `logic/cellView.ts` + `gameReducer.test.ts`.
5. `Cell.tsx`, `useBoardInput.ts`, `Board.tsx` (+ CSS per UX).
6. `SetupForm.tsx`, `GameStatus.tsx` (+ CSS per UX), `Minesweeper.tsx` incl. the e2e
   fixed-layout guard; `scripts/check-dist.mjs` forbidden string.
7. `App.tsx` wiring; delete `src/features/counter/`.
8. Hand off: tester writes `e2e/minesweeper.spec.ts` and updates the counter references in
   the existing specs.
9. `npm run verify` green; the manual checks from §8.

## Implementation notes

_developer: what was built, deviations from the design and why._

**Built** as in the Technical design (§3 file list):

- `src/lib/seededRandom.ts` (mulberry32).
- `src/features/minesweeper/logic/`: `types.ts`, `grid.ts`, `validateSetup.ts`, `placeMines.ts`
  (+ `adjacentCounts`), `gameReducer.ts` (start/reveal/toggleFlag, iterative flood fill),
  `cellView.ts`. Unit tests: `validateSetup.test.ts` (one `it.each` table), `placeMines.test.ts`,
  `gameReducer.test.ts` (per AC, incl. 30 × 30 with 1 mine and invalid `fixedMines`).
- UI: `Minesweeper.tsx` (container, seed via `crypto.getRandomValues` in the Start handler, literal
  e2e guard for `window.__minesweeperMines`), `SetupForm.tsx`, `GameStatus.tsx`, `Board.tsx`,
  `Cell.tsx` (`memo`, primitive props `kind`/`count`/`isActive`/`isPressed`),
  `useBoardInput.ts` (roving tabindex, keys, click, contextmenu, long press with
  `LONG_PRESS_MS = 500` and `LONG_PRESS_MOVE_TOLERANCE_PX = 10`, pressed overlay after 150 ms,
  `navigator.vibrate(10)` where supported), CSS modules with the UX colours (light, dark,
  forced-colors).
- `App.tsx`: `<Minesweeper />` replaces the placeholder and the counter; `src/features/counter/`
  deleted. `App.test.tsx`: the three counter assertions now use the "Start" button / the setup,
  and 001/AC9 ("state does not survive a sign-out") now checks that the setup values and the
  board are gone after sign-out and sign-in.
- `scripts/check-dist.mjs`: `'__minesweeperMines'` added to `FORBIDDEN`.

**Deviations / decisions within the design:**

1. **Mines while rows or columns are invalid** (design §7 says "a high value gets
   `dependsOnSize`", UX §4 says Mines is only reported if empty, not a whole number or below 1):
   `dependsOnSize` for values below 1 and for values above 891 (30 × 30 − 9, too many for any
   board). Values in between are not judged until the size is valid. This follows UX for every
   plausible value and still reports the impossible ones.
2. **Wide layout:** instead of a `100vw` breakout (which overflows when a vertical scrollbar is
   shown), the signed-in `<main>` gets an extra `.wide` class without the 40 rem limit; the `h1`
   and the setup/status column keep `max-width: 40rem; margin-inline: auto`. The board scroll
   container fills `main` (viewport − 2 × 1 rem) and the grid is centred with
   `width: max-content; margin-inline: auto`.
3. **Focus after a failed Start:** `SetupForm` runs `onStart` inside `flushSync` and then focuses
   the first `[aria-invalid="true"]` input, so the error is already in its `aria-describedby`
   when focus lands. `onStart` keeps its `() => void` signature.
4. **Extra file `MessageIcon.tsx`** (error, won, lost icons) shared by `SetupForm` and
   `GameStatus`, instead of importing `NoticeIcon` across features.
5. **Input ids** use `useId()` (`…-rows`, `…-rows-hint`, `…-rows-error`) instead of the bare
   `rows`/`columns`/`mines` ids sketched in UX §1; labels and descriptions are linked the same way.
6. **Extras from UX marked optional:** Home/End and Ctrl+Home/Ctrl+End are implemented. Arrow keys
   with Alt or Meta held are left to the browser (Alt+Left = back).
7. **Mine hint/error copy** uses the typographic `×` and `−` exactly as in UX §6
   (`1 to rows × columns − 9`); the counter uses the ASCII hyphen-minus (`String(n)`).

**Checks:** `npm run verify` green (187 unit tests, `check:dist` ok);
`npm run build && grep -r "__minesweeperMines" dist` finds nothing. Played in Chromium (dev server
mode `e2e`, Playwright script): defaults/hints/no grid, tab order Rows → Columns → Mines → Start,
5 × 5 fixed layout (number, flood, right-click flag/unflag, touch long press via `pointerdown`
`pointerType: 'touch'` flags without revealing, arrow clamp at edges, F/Enter/Space, exactly one
`tabindex="0"`), win (message, mines flagged, counter 0, `aria-readonly`), invalid Start (two
messages, focus on Rows, describedby incl. error, finished game kept, editing clears only that
field's message), loss (exploded, mine, kept flag, wrong flag, frozen). 30 × 30 random: reveal
~60 ms incl. Playwright round trip; no page-level horizontal scroll at 1280 px and 375 px (cells
24 px at 375 px); dark mode checked visually.

**Follow-ups for the tester:** existing e2e specs that fail now because the counter is gone:
`e2e/smoke.spec.ts` ("app loads and the counter works"), `e2e/auth-guest.spec.ts` AC7,
`e2e/auth.spec.ts` AC2 (line 93) and the probe "keyboard only: sign in, sign out and sign in
again" (tab order, line 311–315). `e2e/auth.spec.ts` line 50 (`/Clicked/` count 0) still passes
but is now vacuous. Not checked manually: real phones (iOS/Android long press, panning) and
Windows forced-colors mode.

**Fixed in round 1:**

- [major] Forced colours: `.hidden, .flagged` now use `forced-color-adjust: none`, `ButtonFace`
  fill, `ButtonText` border and glyph colour and a 2 px inset `ButtonText` frame; revealed cells
  stay on `Canvas` with no frame; the exploded mine gets a 3 px border. Checked once with
  Playwright `emulateMedia({ forcedColors: 'active' })`: hidden and flagged cells have
  `box-shadow: inset 0 0 0 2px`, revealed cells `none` (no kept test).
- [minor] Start announcement: `Minesweeper` keeps a visually hidden `<p aria-live="polite"
aria-atomic="true">` mounted from the start (empty before the first game). On every successful
  Start it reads "New game: {rows} by {columns}, {mines} mines." ("1 mine." for one mine, UX
  addendum). A restart with the same values appends a no-break space on every other game id, so the
  text changes and is announced again; text queries trim it.
- [minor] Phone check (Android/iOS long press): no code change; still open for before the merge.
- [nit] `SetupForm`: the mines error now takes its limit from the live values, the same source
  as the hint (formula while rows or columns are invalid).
- [nit] `toIndices` throws on a layout cell outside the board (`row >= rows`, `col >= cols`,
  negative), so it fails fast like the reducer checks.
- [nit] Glyph class `.mine` renamed to `.mineGlyph`, so it no longer clashes with the cell kind
  class.
- Left alone as agreed: duplication between the reducer tests and e2e (retro topic).

## Test report

_tester: AC → test mapping, results, defects found._

Reducer rules, the validation matrix and mine placement are covered by the developer's unit tests
(`src/features/minesweeper/logic/*.test.ts`, not repeated). The e2e specs show the UI behaviour
with fixed layouts (`window.__minesweeperMines`).

| AC   | Test (`e2e/minesweeper.spec.ts`)                                                                                                                                     | Result |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| AC1  | `AC1: the setup shows labelled inputs with ranges and defaults, Start, and no board`                                                                                 | PASS   |
| AC2  | `AC2: Start creates a hidden board of the chosen size, editing alone changes nothing, restart needs no confirmation`                                                 | PASS   |
| AC3  | `AC3: an invalid value shows a message naming the field, creates no board and keeps a running game`                                                                  | PASS   |
| AC4  | `AC4: a safe cell with neighbouring mines shows its number, revealing it again changes nothing`                                                                      | PASS   |
| AC5  | `AC5: an empty cell opens its area, flags block the opening, the first reveal is always safe`                                                                        | PASS   |
| AC6  | `AC6: right-click flags and unflags, …` (mouse) and `touch › AC6: a long press flags and unflags without revealing, a short tap reveals` (real touch events via CDP) | PASS   |
| AC7  | `AC7: the counter is mines minus flags, and goes negative`                                                                                                           | PASS   |
| AC8  | `AC8: the board is played with the keyboard only`                                                                                                                    | PASS   |
| AC9  | `AC9: revealing a mine loses: all mines shown, the exploded one highlighted, flags judged, board frozen`                                                             | PASS   |
| AC10 | `AC10: revealing every safe cell wins: all mines flagged, counter 0, board frozen`                                                                                   | PASS   |

**Tests added:** 11 in `e2e/minesweeper.spec.ts` (one per AC, AC6 has a mouse and a touch test); no
new unit tests. **Existing specs adapted** (counter removed, no new tests): `e2e/smoke.spec.ts`
(now "app loads and shows the game after sign-in"), `e2e/auth-guest.spec.ts` 004/AC7 (guest sees the
game, marked "changed by story 005"), `e2e/auth.spec.ts` AC2 (game visible instead of
"Clicked 0 times"), the tab-order probe ("Sign out", then Rows), and `expectLoginView` (the vacuous
`/Clicked/` check now asserts that no "Minesweeper" heading and no "Start" button are shown).

**Results:** `npm run verify` green (187 unit tests, `check:dist` ok); `npm run test:e2e` 52 passed
(41 before this story plus 11 new; the new spec also ran 3 times in a row without a flake).

**Checked, OK (throwaway probes, not kept):**

- Invalid setup input: `5.5`, `abc`, empty, blank, `-3`, `1e2`, `+9`, Arabic-Indic and full-width digits,
  a 20-digit number and `<img src=x onerror=…>` all give the field message and no board (the value is
  never echoed); `" 9 "` and `"009"` are accepted as 9.
- Start while a game runs, after a loss, and via Enter in a field: new board, no dialog.
- 30 × 30: one mine and a single reveal wins in about 90 ms including the round trip; 891 mines (the
  maximum) starts and wins on the first reveal; no page-level horizontal scroll at 1280 px and 375 px;
  cells are 24 px at 375 px and the board scrolls inside its own container.
- 375 px: setup fields in one row, full-width Start, messages do not overflow.
- A touch drag over the board (more than 10 px) scrolls it and reveals or flags nothing.
- Flags before the first reveal (also inside the later safe zone): allowed, counter correct, the flood
  fill skips them. Double-click and double right-click on cells: no error, no double toggle.
- Ctrl+F on a cell does not flag. Tab from "Start" goes to cell 1, 1 (one tab stop).
- Dark mode (screenshot): cells, digits, setup and the Start button are legible.
- Not checked: real phones (iOS/Android long press and panning) and Windows forced-colors mode, as the
  developer noted; the e2e touch test uses Chromium's emulated touch.

**Defects:** none.

**Verdict:** PASS.

**Round 1 regression (tester, 2026-11-02):** after the developer's round 1 fixes (forced colours, visually hidden Start announcement, live mines limit, fail-fast layout check, `.mineGlyph` rename). All 11 AC tests above unchanged and passing.

- `npm run verify`: green, 187 unit tests in 17 files, `check:dist` ok.
- `npm run test:e2e`: 52 passed, 0 failed.
- Throwaway check, forced colours (`page.emulateMedia({ forcedColors: 'active' })`, 5 × 5 with two mines, cell (2,2) revealed as "1 mine nearby", cell (5,1) hidden): the hidden cell gets `forced-color-adjust: none` and a 2 px inset `ButtonText` frame (`box-shadow`), the revealed cell has none. A screenshot shows the difference. In the Chromium forced palette `ButtonFace` resolves to white like the revealed fill, so the frame is the only cue that separates hidden from revealed; that is enough under UX §3. OK.
- Throwaway check, Start announcement: after Start the polite live region reads "New game: 5 by 5, 1 mine." (one mine); a second Start with 2 mines reads "New game: 5 by 5, 2 mines.". OK.
- Both probes deleted, nothing kept: tests added in this round 0.
- Still open from review round 1: the manual phone check (Android and iOS long press, panning). Not run here; needed before merge.

**Round 1 regression: PASS, no defects.**

**Manual check at gate 2 (2026-11-02):** the real-phone check (iOS and Android long
press, panning) was waived by hak. Long press and panning are covered only by the e2e
test for AC6 with synthetic pointer events.

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

### Round 1 — CHANGES_REQUESTED

Ran myself: `npm run verify` green (187 unit tests, `check:dist` ok), `npm run test:e2e` 52 passed.
Guard probes (builds into a scratch dir): `__minesweeperMines` is absent from a plain build and from
`--mode e2e` (both with `VITE_GOOGLE_CLIENT_ID` set, game code present), present in a
`NODE_ENV=development --mode e2e` build, and `check-dist` fails on that build with all three markers.

Findings:

- [major] `src/features/minesweeper/Board.module.css:176-198` — Windows high contrast (forced
  colours): hidden and revealed cells look the same. Forced colours replace the fill with `Canvas`
  and drop `box-shadow`, so the bevel, the only shape cue for "hidden", disappears. Checked with
  Playwright `emulateMedia({ forcedColors: 'active' })`: hidden, empty and numbered cells all have
  `bg rgb(255,255,255)`, `border rgb(0,0,0) 1px`, `box-shadow none`. The board can't be played
  there, and UX §3 explicitly requires "every state remains distinguishable". — Fix: in the
  forced-colours block, give `.hidden, .flagged` a cue that survives, e.g.
  `forced-color-adjust: none; background-color: ButtonFace; border-color: ButtonText; box-shadow: inset 0 0 0 2px ButtonText;`
  (or a thicker border), and leave revealed cells on `Canvas`. Check it once with
  `emulateMedia` and list it under "checked, OK"; no kept test needed.
- [minor] `src/features/minesweeper/GameStatus.tsx:14`, `Minesweeper.tsx:71-75` — the counter's
  live region mounts together with the first board. On a restart with the same mine count its text
  doesn't change. Either way screen readers usually announce nothing after "Start". Focus stays on
  "Start", so a screen-reader user gets no sign that a new board exists, unlike what UX §5 promises
  ("read after each flag toggle and after Start"). The gap comes from the UX tree (§1 mounts the
  counter with the game). — Fix (UX to confirm): keep a polite live region mounted from the start
  (empty before the first game, so AC1 still holds) and change its text on every Start, e.g. a
  visually hidden "New game: 9 by 9, 10 mines". Can be fixed in this round or recorded as a
  follow-up.
- [minor] `src/features/minesweeper/useBoardInput.ts:166-192` — long press on real phones is
  unverified. Chrome on Android fires `contextmenu` on its own long-press timeout (about 400–500 ms),
  which may race the 500 ms timer or come with a `pointercancel`. The code handles the cases it can
  (contextmenu ignored for touch, click suppressed after the flag, suppress reset on the next
  `pointerdown`), but design §8/§9 asked for a manual check on iOS and Android, and neither
  developer nor tester did it. — Before merge, check on one Android and one iOS phone: a long press
  flags once, lifting doesn't reveal, a drag scrolls without acting. No code change unless the check
  fails.
- [nit] `src/features/minesweeper/SetupForm.tsx:23-27` — mines error text: `outOfRange` keeps the
  limit from the time of Start, while `required`/`notWholeNumber` use the live limit. After editing
  Rows the message can read "1 to 72" while the hint reads "1 to 171". — Use one source, e.g. the
  live `limits.mines.max` whenever it's known.
- [nit] `src/features/minesweeper/Minesweeper.tsx:21-23` — `toIndices` doesn't check `col < cols`,
  so a test layout `[0, 9]` on 9 columns silently becomes (1, 0) instead of failing fast like
  out-of-range indices do. Test-only; add the bounds check or note it in the comment.
- [nit] `src/features/minesweeper/Board.module.css:112-116` — `.mine` is both the cell class for
  kind `mine` (via `styles[kind]`) and the SVG `<g>` class, so the cell div also gets `fill`/`stroke`.
  Harmless today, but it couples the two. — Rename the glyph class (e.g. `.mineGlyph`).
- [nit, proportionality] `src/features/minesweeper/logic/gameReducer.test.ts:54-106` — the AC4,
  AC6 and AC7 reducer tests run the same single branches as e2e AC4/AC6/AC7 and add no edge case. The
  architect named them in the minimal set, so this is for the retro, not for this round. The AC5
  (random placement, corner/edge, max density), AC9 (`cellView` mapping), AC10 (30 × 30 flood) and
  validation/placement tests carry real branches and stay.

Deviations 1–7 in the Implementation notes: all accepted. (1) Reporting mines < 1 or > 891 while
the size is invalid matches AC3 and keeps the UX rule for plausible values. (2) The `.wide` class is
a cleaner breakout than `100vw`. (3) `flushSync` then focusing the first invalid input gives the
right description on focus. (4)–(7) are local and harmless.

Checked, OK:

- Pure logic. Safe zone clipped at edges and corners; `mines ≤ rows × cols − 9` always fits, and at
  maximum density a centre reveal wins at once. Neighbour counts are edge-aware. The flood fill is
  iterative, expands only zero cells, and skips flags. Win is counted on revealed safe cells only;
  a flag on a safe cell blocks the win, so at a win every flag is on a mine and `flagCount = mines`
  is exact. The lost view follows `cellView`. Validation regex `\d` without the `u` flag is ASCII
  only. `floor(random() × n)` bias is ≤ n/2³² (negligible). The reducer is pure (seed in the
  action, arrays copied, guards return the same object), so StrictMode is safe.
- Input. Exactly one `tabIndex=0`; `onFocus` keeps `activeIndex` in sync with click, right-click,
  long press and Tab. Arrows clamp; Alt/Meta arrows and Ctrl+F are left to the browser; `repeat` is
  ignored. Click, contextmenu and long press: mouse right-click flags once (`pointerdown` records
  the type), touch `contextmenu` is only prevented, the click after a long press is swallowed, a
  stale suppress is cleared on the next `pointerdown`, and `Board` unmount (`key={game.id}`) clears
  the timers. The board is frozen after the end (reducer guards plus `isFlaggable`).
- Rendering. `Cell` is `memo` with primitive props only (no stale-prop risk); handlers are
  delegated on the grid.
- Security. No `dangerouslySetInnerHTML`; setup input is never rendered back except as the input
  value; the hook sits behind the literal `DEV && MODE === 'e2e'` guard and is listed in
  `check-dist`.

### Round 1 — summary

1 major, 2 minor, 4 nits. Fix the major (forced colours). The two minors: fix the live region or
record it as a follow-up, and do the phone check before merge.

### Round 2 — APPROVED

Checked only the code changed since round 1 (`Board.module.css`, `Cell.tsx`, `Minesweeper.tsx`,
`Minesweeper.module.css`, `SetupForm.tsx`). Ran `npm run verify` myself: green (187 unit tests,
`check:dist` ok).

Round-1 findings:

- [major, fixed] Forced colours. Re-probed with `emulateMedia({ forcedColors: 'active' })`: hidden
  cells now have a 2 px inset `ButtonText` frame (`box-shadow ... inset`). Revealed and numbered
  cells have none, so the states are distinguishable. Glyphs inherit `forced-color-adjust: none`
  and use `currentColor` = `ButtonText`.
- [minor, fixed] Start announcement. A visually hidden polite region is mounted before the first
  game. In a probe, three Starts in a row produced "New game: 9 by 9, 10 mines." with and without a
  trailing no-break space in turn. The no-break space can't leak:
  - it is only in the clipped `.visuallyHidden` paragraph (no visible text node contains U+00A0);
  - Testing Library and Playwright text matching trim it (`getByText(…, { exact: true })` still
    finds 1 element);
  - the announcement contains neither "Mines left:" nor "won"/"lost", so the existing counter and
    result queries stay unique.
- [minor, open, goes to gate 2] Real-phone long-press check, as agreed with the coordinator. Not
  blocking.
- [nits, fixed] `errorMessage` takes the live limit for every kind (same source as the hint).
  `toIndices` throws on cells outside the board. `.mine` renamed to `.mineGlyph`.

New findings: none above nit.

- [nit] `Minesweeper.tsx:91-93` and `GameStatus.tsx:14` — when the mine count changes, a Start
  updates two polite regions ("New game: …" and "Mines left: n"), so screen readers may read the
  count twice. Acceptable. Leave as is unless UX wants the counter region quiet on Start.

## Retrospective

_orchestrator, 2026-11-02._

Went well: one gate-1 round with a split (006), parallel design aligned without rework,
lean tests (unit tests only for the game logic, 11 e2e tests), tester PASS without
defects. Smaller models (haiku) for the regression run and small doc edits worked.

### What went wrong

| #   | Problem                                                                                                                          | Root cause                                                                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| P1  | Review major: in forced-colours mode hidden and revealed cells looked identical, although UX specified forced-colours behaviour. | Nobody checked forced colours until the review; the tester only spot-checked dark mode.        |
| P2  | Review minor: no screen-reader announcement after "Start".                                                                       | The UX design mounted the live region together with the board, so its first content is silent. |
| P3  | The design asked for a long-press check on real phones; neither developer nor tester could do it.                                | Real-device checks have no owner in the pipeline.                                              |
| P4  | Reducer tests for AC4/AC6/AC7 repeat single code paths the e2e tests already show (review nit).                                  | The architect's minimal test set listed a reducer test per AC.                                 |

### Proposed changes

1. **`tester` agent (P1):** when the UX design specifies dark-mode, forced-colours or
   reduced-motion behaviour, check each once with `page.emulateMedia(…)` and list the
   result under "checked, OK".
2. **`ux-designer` agent (P2):** every state change that doesn't move focus (new game,
   results, async updates) needs a live announcement; live regions are mounted empty
   from the start, never together with their first content.
3. **`/feature` skill, gate 2 (P3):** list open manual checks (real devices, real
   third-party services) explicitly; hak runs or waives each, recorded in the Test report.
4. **`architect` agent (P4):** in the minimal test set, unit tests only where the logic
   branches beyond what the e2e test for that AC shows.
5. **`/feature` skill, model economy (hak's request):** use `model: haiku` for
   regression runs and small doc edits, and resume an agent for follow-ups within the
   same story instead of starting a new one.

### Outcome

All five proposals approved by hak at gate 2 ("Ja, alles") and applied:
`.claude/agents/tester.md` (1), `.claude/agents/ux-designer.md` (2),
`.claude/skills/feature/SKILL.md` gate 2 (3) and model economy (5),
`.claude/agents/architect.md` (4). The manual phone check was waived.
