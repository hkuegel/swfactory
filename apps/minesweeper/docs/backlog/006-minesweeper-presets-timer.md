---
id: 006
title: Minesweeper presets and timer
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
branch: feature/006-minesweeper-presets-timer
supersedes: []
changes: [005/AC1, 005/AC2] # setup gets presets (AC1); starting a board also resets the timer (AC2)
superseded-by:
---

# 006 – Minesweeper presets and timer

## Original request

> implementiere ein mine sweeper spiel. ich möchte grösse des spielfelds und ANzahl der Bomben festelgen können

Note: this is hak's request for story [005](005-minesweeper.md) (2026-11-01, German). Presets and the timer were split off from 005 at hak's decision at gate 1 ("Passt, mit Split").

## User story

As a player, I want ready-made difficulty levels and a running timer, so that I can start a typical game with one choice and see how long a game takes.

## Context

Split off from [005](005-minesweeper.md) at its gate 1. hak confirmed both features there with the proposed defaults:

- **Presets** in addition to free input: Beginner 9 × 9 with 10 mines, Intermediate 16 × 16 with 40 mines, Expert 16 × 30 with 99 mines (rows × columns).
- **Timer:** seconds since the first reveal; stops on win and on loss; reset on a new game.

This story depends on 005 (setup inputs, "Start", board, win and loss). The preset values are within the ranges of 005 (rows and columns 5 to 30, mines 1 to rows × columns − 9).

Nothing is persisted (005): the timer is lost on reload; best times are a separate follow-up story.

## Acceptance criteria

- **AC1:** Given I am signed in and look at the setup, when I see the difficulty options, then there are exactly three presets named "Beginner", "Intermediate" and "Expert" next to the free inputs of [005/AC1](005-minesweeper.md).
- **AC2:** Given the setup is shown, when I choose a preset, then the rows, columns and mines inputs show 9 / 9 / 10 (Beginner), 16 / 16 / 40 (Intermediate) or 16 / 30 / 99 (Expert), I can still edit them, and a board in progress stays unchanged until I choose "Start" (as in [005/AC2](005-minesweeper.md)).
- **AC3:** Given a board has been created with "Start", when I look at the timer, then it shows 0 and does not advance until I reveal the first cell; after that it shows the whole seconds elapsed since the first reveal, increasing by one every second while the game is in progress, with no upper limit.
- **AC4:** Given a game in progress with a running timer, when the game is won or lost, then the timer stops and keeps showing the elapsed seconds.
- **AC5:** Given a game is in progress or finished, when I choose "Start" with valid values, then the timer shows 0 and does not run until the first reveal of the new game.

## Out of scope

- Best times, high-score table or statistics (follow-up story); the timer value is not stored.
- Saving the chosen preset or the timer across reload or sign-out.
- Further presets, custom named presets, or a preset that starts the game by itself (see Decision log, 2026-11-02).
- Chording and everything else listed as out of scope in [005](005-minesweeper.md).

## Open questions

_None._

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-01 — Story created by the split of 005 at hak's gate 1 ("Passt, mit Split"). Presets (005 Q2) and timer (005 Q5) were confirmed there with the proposed defaults, so ACs are written for both. One new open question recorded with a proposed default: whether a preset only fills the inputs or starts the game; not asked at gate 1, so the story stays draft until hak confirms. `changes: [005/AC1, 005/AC2]`. (product-owner)
- 2026-11-02 — Gate 1, hak: "passt. leg los". Answer to the former open question 1 (does a preset only fill the inputs or start a game immediately): a preset only fills the inputs; "Start" is still needed, as in 005/AC2. Consequence: AC2 unchanged, question removed from "Open questions", status set to `ready`. (product-owner)
- 2026-11-02 — Gate 1, hak: "passt. leg los" (accepts the orchestrator's proposal at gate 1). Scope decision: the timer has no upper limit, unlike classic Minesweeper, which stops at 999. Consequence: "with no upper limit" added to AC3; the 999 cap is not applied. (product-owner)
- 2026-11-02 — Gate 2: apply all four retro proposals and commit? No open manual checks. — A: "Ja, alles" (hak, gate 2). Consequence: proposals applied to `CLAUDE.md`, developer, architect and `e2e/auth.spec.ts`; status done. (orchestrator)

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

Scope: the two slots that the UX design of [005](005-minesweeper.md) left open: the presets group in the setup form and the timer in the status bar. Everything else (setup fields, validation, board, live regions, colours, 600 px breakpoint) is reused from 005 and not repeated here; "005 §n" refers to its UX design.

### 1. Layout / component tree

```
section (the game)                                   unchanged
├─ h2 "Minesweeper"
├─ form > fieldset  legend "Board setup"
│   ├─ fieldset  legend "Difficulty"                 NEW, above the three fields
│   │   ├─ button type="button" "Beginner"      + span (visible detail, aria-hidden) + span (visually hidden description)
│   │   ├─ button type="button" "Intermediate"  + same
│   │   └─ button type="button" "Expert"        + same
│   ├─ div (row of three fields)                   unchanged
│   ├─ div (messages)                              unchanged
│   └─ button type="submit" "Start"                unchanged
├─ p (visually hidden, aria-live="polite")         unchanged: "New game: …"
├─ p (visually hidden, aria-live="polite")         NEW, mounted empty: preset announcement
├─ [no game yet] empty-state line                  unchanged
└─ [game exists]
    └─ div (status bar, column)
        ├─ div (row)                               NEW wrapper
        │   ├─ p aria-live="polite" aria-atomic="true"  "Mines left: " + <span>{n}</span>   unchanged, stays alone in its live region
        │   └─ p (no live attributes, no role)     NEW  "Time: " + <span>{seconds}</span>
        └─ div aria-live="polite"                  unchanged; result <p> (+ NEW hidden span inside it when ended)
```

Control choice for the presets: **three plain buttons** (`type="button"`, so they never submit the form).

- A preset only fills the inputs (decision log, 2026-11-02). A radio group would promise a selected state that goes stale as soon as the user edits a field, and arrow keys in a radio group would change the values on every key press. A select hides the options behind an extra tap and fires no change when the same preset is chosen again after editing. A button is a one-shot action with no state, which is exactly what this is.
- No `aria-pressed`, no "selected" look: there is nothing to keep in sync with the inputs.
- Buttons use the secondary (outlined) style so that "Start" remains the one primary action.

### 2. States

**Presets**

| State                 | What the user sees / can do                                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Idle                  | Three outlined buttons, each with a small detail line below its name. Always enabled, before the first game, during a game and after it has ended.                                    |
| Disabled              | Never. A preset changes only the inputs, so it is harmless at any time (AC2).                                                                                                         |
| Applied               | The three inputs show the preset values; any setup messages (and `aria-invalid`) are gone; board, counter, timer and result message are untouched. Focus stays on the pressed button. |
| Loading, empty, error | Do not exist (no async, preset values are always valid).                                                                                                                              |

**Timer** (in the status bar, so it exists only when a game exists; before the first "Start" there is no timer, as there is no counter)

| Game phase                     | Shows                                                                                                 |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `ready` (board, no reveal yet) | `Time: 0`, not advancing, also while the player flags cells (AC3).                                    |
| `playing`                      | `Time: n`, +1 every second after the first reveal, whole seconds, no upper limit (AC3).               |
| `won` / `lost`                 | `Time: n`, frozen at the value of the moment the game ended (AC4).                                    |
| Valid "Start" (AC5)            | `Time: 0`, not running until the first reveal of the new game.                                        |
| Invalid "Start"                | Unchanged: a running timer keeps running, a frozen one stays frozen (the game is unchanged, 005/AC3). |

The number is a plain integer: no `m:ss`, no thousands separator, no unit (it must read `Time: 1234` after 1234 seconds, AC3).

### 3. Interactions

- **Preset button** (click, tap, Enter, Space): sets Rows, Columns and Mines to 9 / 9 / 10 (Beginner), 16 / 16 / 40 (Intermediate) or 16 / 30 / 99 (Expert), clears all setup error messages, and sets the preset announcement (section 5). It does not validate, does not start a game, does not touch the running game. The user can edit the values afterwards and then chooses "Start".
- **Focus after a preset:** stays on the pressed button (nothing is removed or disabled). The inputs are the next tab stops, so the user can fine-tune or go straight to "Start". Focus is not moved to "Start": that would skip the chance to adjust the values.
- **Timer:** no control, not focusable. It starts with the first successful reveal of a game, stops on win and loss, resets on a valid "Start". Elapsed time is measured from timestamps, not by counting ticks, so a throttled background tab shows the right value when it returns (AC3 "whole seconds elapsed").
- **Tab order (signed in):** "Sign out", Beginner, Intermediate, Expert, Rows, Columns, Mines, "Start", the board (one stop). Visual order equals DOM order.

### 4. Copy (exact strings)

| Where                             | Text                                                                                                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Group legend                      | `Difficulty`                                                                                                                                                              |
| Preset buttons (accessible name)  | `Beginner`, `Intermediate`, `Expert` (exactly these, nothing else in the button's own text)                                                                               |
| Visible detail line (aria-hidden) | `9 × 9, 10 mines` / `16 × 16, 40 mines` / `16 × 30, 99 mines` (rows × columns, the multiplication sign U+00D7 as in the 005 hint)                                         |
| Visually hidden description       | `9 rows, 9 columns, 10 mines` / `16 rows, 16 columns, 40 mines` / `16 rows, 30 columns, 99 mines`, referenced by `aria-describedby` on the button                         |
| Preset announcement               | `{Name} values set: {rows} rows, {columns} columns, {mines} mines.` (for example `Beginner values set: 9 rows, 9 columns, 10 mines.`). Does not contain the word "Start". |
| Timer                             | `Time: ` + number in its own `<span>` (for example `Time: 0`, `Time: 87`)                                                                                                 |
| Finish suffix (visually hidden)   | `Finished in {n} seconds.` (`Finished in 1 second.` for one; `Finished in 0 seconds.` for zero)                                                                           |

Text rules for queries: the preset names appear only as the buttons' own text ("Beginner" etc. are not repeated in the announcement without "values set"); "Start" stays exact and unique; the won and lost messages of 005 are unchanged and each remains on exactly one element (see section 5 for how the suffix is added without changing the `<p>`'s own text).

### 5. Accessibility

- **Presets:** native buttons in a native `fieldset`/`legend`, so a screen reader says "Difficulty, group, Beginner, button, 9 rows, 9 columns, 10 mines". The visible detail line is `aria-hidden` so it is not in the name; the description is read once.
- **Preset announcement:** a preset changes three inputs without moving focus, so it needs a live announcement. A second visually hidden `p aria-live="polite" aria-atomic="true"`, no role, is mounted empty from the first render of the game section (not together with its first content) and gets its text on each preset press. Pressing the same preset twice gives identical text, which screen readers do not repeat: clear, then set again after about 100 ms (as for "New game: …" in 005 §5; the existing no-break-space trick is also fine). It has no visible colour, so no colour values apply. It may share one region with the "New game" announcement if the architect prefers, as long as it is mounted empty and repeats are announced.
- **Timer, no per-second announcements:** the timer `<p>` has no `aria-live`, no `role="status"`, no `role="timer"` (that role needs an accessible name and is handled inconsistently by screen readers; plain text is enough) and is not a child of any live region. In particular it must not sit inside the counter's `aria-live="polite" aria-atomic="true"` paragraph, or every tick would re-read the counter. A screen reader user reads the current value when browsing to it. Ticks must not move or restore focus.
- **Final time on win or loss:** inside the existing persistent result live region, the won or lost `<p>` gets one extra child `span` (visually hidden with the clip pattern of 005, not `display: none`) with `Finished in {n} seconds.` The whole message is then announced in one go: "You won! Every safe cell is revealed. Finished in 42 seconds." The visible time stays in the timer; the span is not visible, so nothing is shown twice. The `<p>`'s own text stays exactly the 005 string, so `getByText` on the 005 messages keeps working. `n` must be the same value that the frozen timer shows (take it from the end event, not from a later tick).
- **Timer start, stop and reset:** no announcement. Start of a game is already announced ("New game: …"), the first reveal needs none, and the end is covered by the suffix above.
- **Contrast and target size:** preset buttons are at least 40 px high and 6.5 rem wide (section 6 and 7); colours below.
- **Motion:** none. Nothing animates, the timer changes only its digits.

### 6. Visual spec

Page colours as in 005 (light `#FAFAFA`, dark `#161616`). The timer reuses the counter styling; only the preset buttons are new.

| Element                              | Light                                                                | Dark                                                    |
| ------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------- |
| Preset button text                   | `#0B57D0` on `#FAFAFA`, about 6.1:1                                  | `#A8C7FA` on `#161616`, about 10.5:1                    |
| Preset button border                 | 1 px `#747775`, about 4.3:1 vs page; radius 4 px; transparent fill   | 1 px `#9AA0A6`, about 6.9:1 vs page; transparent fill   |
| Detail line (14 px)                  | `#5F6368`, about 5.8:1                                               | `#BDC1C6`, about 10:1                                   |
| Hover                                | overlay `#0B57D0` at 8 %; text still about 5.5:1, detail about 5.2:1 | overlay `#A8C7FA` at 8 %; text still about 8.5:1        |
| Pressed                              | same overlay at 16 %; text about 5.0:1                               | same overlay at 16 %; text about 6.8:1                  |
| Focus ring                           | 2 px solid `#0B57D0`, offset 2 px; about 6.1:1 vs page               | 2 px solid `#A8C7FA`, offset 2 px; about 10.5:1 vs page |
| Legend "Difficulty"                  | as the "Board setup" legend (inherited text, about 16:1)             | as the "Board setup" legend (about 14:1)                |
| Timer text and number                | as the counter (inherited, about 16:1); digits `tabular-nums`        | as the counter (inherited, about 14:1)                  |
| Hidden spans and announcement region | no visible colour (visually hidden)                                  | no visible colour (visually hidden)                     |

Forced colours (Windows high contrast):

- Preset buttons keep a real 1 px solid border (not a shadow or background image) so their edge stays visible; text and border take `ButtonText`; the hover state is a `Highlight` border and not only the translucent overlay; the focus ring stays a CSS `outline` (system colour), never a `box-shadow`.
- The timer is plain text and needs nothing.
- Small fix in the control next to the new buttons: "Start" has `border: 0` today, so in forced colours it can melt into the page. Give it `1px solid ButtonText` in forced-colors mode (005 §3 only specified cells).

### 7. Responsive behaviour

- **Wide (600 px and up):** the Difficulty fieldset is a row of three buttons, left-aligned, above the fields row; each button is as wide as its content (minimum 6.5 rem) with the same height. The legend sits on top as for "Board setup".
- **Below 600 px:** the three buttons share one row at equal width (`flex: 1 1 6.5rem`); at 375 px that is about 104 px each and they fit in one row. When they do not fit (about 330 px and narrower) they wrap, with no horizontal scrolling. The detail line may wrap onto two lines; all buttons in a row stay equally high. Rest of the setup as in 005 §7.
- **Status bar:** counter and timer sit in one row, 1.5 rem apart, the row wraps below about 280 px. The counter's number reserves `min-width: 4ch` (tabular digits), so the timer does not jump while the counter changes between ordinary values; the timer is last in the row and can grow to the right. The result message stays below the row at full width. At 320 px and 200 % zoom nothing scrolls sideways.

### 8. Open points for architect / PO

1. **Live regions:** the preset announcement may share the existing visually hidden region; the requirement is "mounted empty, repeats are announced".
2. **Final time in the result:** the won and lost messages get a visually hidden child `span` with `Finished in {n} seconds.`; the frozen timer and this value must come from the same end event.
3. **Timer from timestamps:** the displayed seconds derive from elapsed time, so a throttled background tab is correct on return; the one-second tick must not re-render the board (900 cells).
4. **Preset values and tests:** buttons are queried by role and exact name (`getByRole('button', { name: 'Beginner' })`); the inputs by their 005 labels. The timer is queried by its text (`Time: 0`, or the number span), not by a role.

### 9. Superseded parts of the 005 UX design

005 is not edited. Where it differs, this section wins in the signed-in view:

- §1 tree, "[slot 006: presets group, above the fields]" and "[slot 006: timer, next to the counter]": filled by sections 1 and 7 above.
- §4 Tab order and §5 Keyboard flow: "Sign out", Rows, Columns, Mines, "Start", board becomes "Sign out", Beginner, Intermediate, Expert, Rows, Columns, Mines, "Start", board.
- §2 Setup states, row "Disabled: nothing in the setup is ever disabled": still true, the presets are never disabled either.
- §3 forced colours: "Start" gets a `ButtonText` border (section 6).
- §5 live regions: the won and lost message `<p>` gets the hidden finish suffix; its own text is unchanged.

## Technical design

Builds on the 005 design (`docs/backlog/005-minesweeper.md`, "Technical design"). No new
dependency, no new ADR: both parts are local to `src/features/minesweeper/` and cheap to
change.

### 1. Decisions in short

- **Preset values** are a constant in `logic/presets.ts` (`PRESETS`), typed as `GameConfig`
  (numbers). A preset click only calls `setValues(presetToValues(config))` in `Minesweeper`
  (the setup strings are already the source of truth, 005 §7) and clears all setup errors.
  No game dispatch, so a running board stays untouched until "Start" (AC2). Which element
  the presets are (buttons, radio group) is the UX section's call; they must be
  `type="button"` so they don't submit the form. A "selected" look, if UX wants one, is
  derived with `matchingPreset(values)` (preset whose three numbers equal the current,
  trimmed values), never stored: after the user edits a field, no preset is selected.
- **Time comes into the reducer as data, not from inside it.** The `reveal` action carries
  `now: number` (`Date.now()`, set in the `Minesweeper` dispatch wrapper). The reducer
  stores `startedAt` when a reveal leaves phase `ready` and `endedAt` when a reveal ends the
  game (won or lost). It stays pure and deterministic (StrictMode double call, 005 risk 1),
  the timestamps are unit-testable, and the start and stop moments are exact (no effect
  lag). `start` resets both to `null` (AC3, AC5). Flags never set `startedAt` (AC3: "first
  reveal").
- **Elapsed seconds are derived, never stored:** `elapsedSeconds(startedAt, endedAt, now)`
  (pure, in `logic/`). Only the wall-clock `now` is state, and it lives in a small `Timer`
  component, so the 4 ticks per second re-render only that component, not the `Board`.
- **Ticking:** `useElapsedSeconds(startedAt, endedAt)` runs a `setInterval` of
  `TICK_MS = 250` only while `startedAt !== null && endedAt === null`. It polls faster than 1 s
  because the value is computed from timestamps: the display is at most 250 ms late, never
  drifts, and catches up at once after a throttled background tab. When `endedAt` is set the
  interval is cleared and the value is computed from `endedAt`, so it stays frozen (AC4).
- **A game can end on its first reveal** (e.g. 30 × 30 with 1 mine: one flood fill wins).
  Then `ready → won` with no `playing` in between, and `startedAt === endedAt` → 0. That is
  why start is tied to "left `ready`", not to a `playing` phase.
- **No e2e hook.** Playwright's `page.clock` fakes `Date`, `setInterval` and `performance.now`
  in the page, which is all the timer uses. Nothing dev-only is added, so `check-dist.mjs`
  stays unchanged.

### 2. AC → mechanism

| AC  | Mechanism                                                                                                                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1 | `SetupForm` renders one control per entry of `PRESETS` (exactly Beginner, Intermediate, Expert, in that order) inside the fieldset above the three fields (UX slot).                                 |
| AC2 | `onPreset` → `setValues(presetToValues(preset))` + `setErrors({})`; inputs stay editable (unchanged controlled inputs); no `dispatch`, so the board and counter stay as they are.                    |
| AC3 | After `start`: `startedAt === null` → `elapsedSeconds` 0, no interval. The first `reveal` sets `startedAt = now` → interval runs → `floor((now − startedAt) / 1000)`, unbounded (no `Math.min`).     |
| AC4 | The `reveal` that ends the game sets `endedAt = now` → interval cleared, value computed from `endedAt`. `toggleFlag` and later actions are ignored in `won`/`lost` anyway (005).                     |
| AC5 | `start` (valid values, any phase) → new state with `startedAt = endedAt = null`; the `Timer` stays mounted and shows 0; the interval is cleared by the effect cleanup as `startedAt` becomes `null`. |

### 3. Files

| Path                                                        | Responsibility                                                                                                                                                                         |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/minesweeper/logic/presets.ts` (+ test)        | New. `PRESETS`, `presetToValues(config): SetupValues`, `matchingPreset(values)` (only if UX shows a selected state).                                                                   |
| `src/features/minesweeper/logic/elapsedSeconds.ts` (+ test) | New. Pure `elapsedSeconds(startedAt, endedAt, now)`.                                                                                                                                   |
| `src/features/minesweeper/logic/types.ts`                   | `GameState` gets `startedAt`, `endedAt`; the `reveal` action gets `now`; new `Preset` type.                                                                                            |
| `src/features/minesweeper/logic/gameReducer.ts` (+ test)    | `startState` sets both timestamps to `null`; `reveal(state, index, now)` sets them as in §1. Existing test helper `reveal` gets a `now` argument (default 0).                          |
| `src/features/minesweeper/useElapsedSeconds.ts`             | New hook: `now` state + interval effect (§1), returns whole seconds.                                                                                                                   |
| `src/features/minesweeper/Timer.tsx` (+ `.module.css`)      | New. Shows the seconds; markup, copy and semantics from the UX section. Own component so only it re-renders on a tick.                                                                 |
| `src/features/minesweeper/GameStatus.tsx`                   | Renders `<Timer>` next to the counter (UX slot); two new props.                                                                                                                        |
| `src/features/minesweeper/SetupForm.tsx` + `.module.css`    | Renders the preset controls above the fields; new prop `onPreset`.                                                                                                                     |
| `src/features/minesweeper/Minesweeper.tsx`                  | `handlePreset`; `handleReveal` dispatches `{ type: 'reveal', index, now: Date.now() }`; passes `startedAt`/`endedAt` to `GameStatus`. `Board`, `Cell`, `useBoardInput` stay unchanged. |
| `e2e/minesweeper.spec.ts` (_tester_)                        | One `describe` for 006 (shares the helpers of the 005 specs), §6.                                                                                                                      |

### 4. Types

```ts
// logic/types.ts (additions)
export interface GameState {
  // ...005 fields...
  /** Wall-clock ms of the first reveal (the one that leaves `ready`); null before. */
  readonly startedAt: number | null;
  /** Wall-clock ms of the reveal that won or lost the game; null while it is not over. */
  readonly endedAt: number | null;
}
export type GameAction =
  /* start, toggleFlag unchanged */
  { readonly type: 'reveal'; readonly index: number; readonly now: number };
// `now` is required: forgetting it would silently break the timer, the compiler catches it.

export interface Preset {
  readonly name: 'Beginner' | 'Intermediate' | 'Expert';
  readonly config: GameConfig;
}

// logic/presets.ts
export const PRESETS: readonly Preset[] = [
  { name: 'Beginner', config: { rows: 9, cols: 9, mines: 10 } },
  { name: 'Intermediate', config: { rows: 16, cols: 16, mines: 40 } },
  { name: 'Expert', config: { rows: 16, cols: 30, mines: 99 } }, // rows × columns
];
export function presetToValues(config: GameConfig): SetupValues; // String() of each number

// logic/elapsedSeconds.ts
export function elapsedSeconds(
  startedAt: number | null,
  endedAt: number | null,
  now: number,
): number; // null start → 0; else max(0, floor(((endedAt ?? now) − startedAt) / 1000))

// useElapsedSeconds.ts
export const TICK_MS = 250;
export function useElapsedSeconds(startedAt: number | null, endedAt: number | null): number;
```

```ts
// Component props (additions)
export interface SetupFormProps {
  // ...005 props...
  readonly onPreset: (config: GameConfig) => void;
}
export interface GameStatusProps {
  // ...005 props...
  readonly startedAt: number | null;
  readonly endedAt: number | null;
}
export interface TimerProps {
  readonly startedAt: number | null;
  readonly endedAt: number | null;
}
```

### 5. Reducer and hook rules

- **`reveal(state, index, now)`**: guards unchanged (they return the same state object).
  Leaving `ready` sets `startedAt = state.startedAt ?? now` (only the first reveal can do
  this). A losing reveal returns `endedAt: now`; a winning reveal returns `endedAt: now`.
  A reveal that neither ends nor starts the game does not touch the timestamps.
- **`useElapsedSeconds`**: `const [now, setNow] = useState(Date.now)`; `return
elapsedSeconds(startedAt, endedAt, now)`. An effect on `[startedAt, endedAt]` returns early
  unless `startedAt !== null && endedAt === null`; otherwise it starts
  `setInterval(() => setNow(Date.now()), TICK_MS)` and clears it in the cleanup. There is no
  synchronous `setNow` inside the effect (avoids the `react-hooks` set-state-in-effect
  lint); a `now` that is older than `startedAt` (stale from the last game) is clamped to 0
  by `elapsedSeconds`, and the first tick fixes it within 250 ms while the value is still 0
  anyway. Clock use is `Date.now()`; a backwards system-clock jump is clamped to 0, accepted
  for a non-persisted display timer.
- **`Timer`** is mounted whenever `GameStatus` is (i.e. when a game exists), not keyed by
  `game.id`: a new game just passes `null`/`null`.
- **Presets are never "applied" to a game.** Choosing one while a game runs changes only the
  inputs (AC2). Do not make `Minesweeper` depend on which preset is chosen.

### 6. Testability (minimal set)

**Unit (only logic with branches):**

- `elapsedSeconds.test.ts`: one `it.each` table: `null` start → 0; running 0 / 999 / 1000 /
  61 000 ms; with `endedAt` the value ignores `now`; `now` before `startedAt` → 0; large value
  (e.g. 100 000 s) is not capped (AC3).
- `gameReducer.test.ts`, one new `it` for AC3/AC4/AC5 state: first reveal sets `startedAt`;
  a flag before it does not; a later reveal and a flag keep `startedAt`; losing reveal sets
  `endedAt`; winning reveal sets `endedAt`; a win on the first reveal gives
  `startedAt === endedAt`; `start` resets both to `null`. The existing `reveal` helper gets
  a `now` argument.
- `presets.test.ts`: one `it.each` over `PRESETS`: `validateSetup(presetToValues(config))`
  is ok. This guards the story's requirement that presets stay inside the 005 ranges if those
  ever change. The exact numbers are asserted in e2e (AC2), not duplicated here.

**e2e (in `e2e/minesweeper.spec.ts`, names start with the AC; sign in via the e2e fake;
fixed layouts via `__minesweeperMines` for deterministic win/loss):**

- AC1: exactly three preset controls named Beginner, Intermediate, Expert; the free inputs
  are still there.
- AC2: choose each preset in turn and check rows/columns/mines (9/9/10, 16/16/40, 16/30/99);
  edit one input after choosing; with a game on the board, choosing a preset leaves the grid
  and counter unchanged, and only "Start" creates the new board.
- AC3: with the fake clock: after "Start" the timer shows 0 and stays 0 after
  `runFor(5000)`; after the first reveal and `runFor(3000)` it shows 3 (this also covers
  "whole seconds", "+1 per second"). A test that waits past 999 s through the fake clock
  (`runFor(1_000_000)`) shows 1000, no cap (one assertion in the same test; cheap with a
  fake clock).
- AC4: fixed layout; reveal a safe cell, `runFor(2000)`, lose by revealing a mine, timer
  keeps its value after `runFor(5000)`. A second short test (or the same for AC10): win,
  value frozen. Win and loss use different code paths in the reducer (§5), so both are
  checked once.
- AC5: while running and after a finished game, "Start" resets the timer to 0, and it stays
  0 until the first reveal (`runFor`), then counts again.

**Fake clock (`page.clock`, Playwright 1.64):** call `page.clock.install({ time: T0 })`
before `page.goto` (so the init script covers the page), sign in, then
`page.clock.pauseAt(T0 + ...)` so time only moves with `runFor`. Without `pauseAt` the fake
clock keeps running in real time and exact assertions are flaky. Only the 006 tests install
it; the 005 tests (e.g. the AC6 long-press wait) stay on real time. If `page.clock` turns
out unusable here (for example the e2e sign-in fake relies on timers that stay paused), tell
the architect before adding any hook: a dev-only `Date.now` override would have to follow
the literal-guard rule and extend `scripts/check-dist.mjs`.

**Not written:** component tests for `Timer`, `SetupForm` or the preset controls (e2e shows
them); a hook test for `useElapsedSeconds` (the pure function and the e2e tests cover its
branches).

### 7. Risks

1. **Timers under test.** `page.clock` interplay with the sign-in fake or React scheduling.
   Mitigation: install before `goto`, sign in, then pause; run one 006 test early (§8 step 6) to learn this before writing the rest.
2. **Hidden or throttled tab:** intervals fire at 1 Hz or slower in the background. The
   timer is computed from timestamps, so it is right when the tab returns; no extra work.
3. **First reveal wins immediately** (tiny set of mines on a large board): `startedAt ===
endedAt` → 0, the interval never starts. Covered by the reducer unit test.
4. **Wall-clock jump** (system time changed mid-game): clamped to 0 or briefly off; accepted
   because nothing is stored and best times are a follow-up. When that follow-up arrives, it
   should switch to `performance.now()` for the stored value.
5. **Timer announcements:** a per-second live region would make screen readers chatty. The
   UX section decides the semantics (recommendation: not a live region, optionally the final
   time in the result message); this design only supplies the number.
6. **Stale preset selection UI:** if UX shows a selected preset, derive it from the values
   (`matchingPreset`), so it can never disagree with the inputs.

### 8. Implementation plan (developer, in order)

1. `logic/types.ts` (new fields, `now`, `Preset`), `logic/elapsedSeconds.ts` + test.
2. `logic/gameReducer.ts`: timestamps in `startState`/`reveal`; update the test helper
   and add the timestamps `it` (§6).
3. `logic/presets.ts` + test.
4. `useElapsedSeconds.ts`, `Timer.tsx`; wire `GameStatus` (new props) per the UX section.
5. `SetupForm` preset controls + `onPreset`; `Minesweeper`: `handlePreset`, `handleReveal`
   with `now`, new `GameStatus` props.
6. e2e (tester): install the fake clock and run one timer test first, then the rest.
7. `npm run verify`; manual check of the layout of the timer on a phone width (UX).

## Implementation notes

**Built** (all in `src/features/minesweeper/`):

- Logic: `logic/presets.ts` (`PRESETS`, `presetToValues`; no `matchingPreset`, the UX has no selected state), `logic/elapsedSeconds.ts`, `GameState.startedAt`/`endedAt` and `reveal.now` in `types.ts` / `gameReducer.ts` as designed.
- `useElapsedSeconds.ts` (250 ms interval only while running) and `Timer.tsx`: only `Timer` re-renders per tick, `Board` is untouched. `Timer` is a plain `<p>` ("Time: " + `<span>`), no live region or role.
- `GameStatus.tsx`: counter and `Timer` in a wrapping row; the won/lost `<p>` gets a visually hidden `<span>` "Finished in {n} second(s)." computed with `elapsedSeconds(startedAt, endedAt, 0)`, i.e. from the same `endedAt` as the frozen timer.
- `SetupForm.tsx`: nested `fieldset` "Difficulty" with three `type="button"` presets (detail line `aria-hidden`, description via `aria-describedby`); `Minesweeper.tsx`: `handlePreset` sets the inputs, clears errors, no dispatch.
- CSS: preset styles from UX §6/§7, forced-colors rules, and the `1px solid ButtonText` border for "Start".
- Unit tests: `elapsedSeconds.test.ts`, `presets.test.ts`, one new timestamps `it` in `gameReducer.test.ts` (helper `reveal(index, now = 0)`).

**Deviations**

- `onPreset` takes the whole `Preset` (not just `GameConfig`): the announcement needs the name.
- One shared live region for "New game: …" and "{Name} values set: …" (agreed in the UX/architect hand-off). The text now comes from a small `announcement` state `{ text, serial }` set in the handlers (not derived from `game.id`); every other message gets a trailing no-break space (never on the initial empty render) so repeats are announced.
- The visually hidden preset description is a sibling of the button inside a wrapper `div`, not a child: a child would become part of the button's accessible name, which must be exactly "Beginner" etc.

**Fixed after test (preset layout at 375 px):** "Intermediate" plus the 0.75 rem side padding was wider than a third of the row, so Expert wrapped. Below 600 px the preset wrapper and button now have `min-width: 0` and `padding-inline: 0.25rem` (`SetupForm.module.css`); the three share one row, and the `.fixme` on the e2e test is removed.

**Open points**

- Both resolved by the tester: `e2e/auth.spec.ts` follows the new tab order, and the 006 e2e tests are in `e2e/minesweeper.spec.ts`.

## Test report

Tester, 2026-11-02. `npm run verify` green (200 unit tests), `npm run test:e2e`: 58 passed, 1 skipped (the `test.fixme` below).

Fake clock: `page.clock.install({ time })` before `goto`, guest sign-in, then `pauseAt`; works with the sign-in fake, so no hook was needed and `check-dist.mjs` is unchanged. A 1 000 000 s jump uses `fastForward` (one jump; `runFor` would fire 4 million ticks and take 20 s).

| AC  | Test(s) (all in `e2e/minesweeper.spec.ts`, describe "006 presets and timer")                                                                                                                                                                  | Result |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| AC1 | `AC1: exactly three presets, next to the free inputs`                                                                                                                                                                                         | PASS   |
| AC2 | `AC2: a preset fills the inputs, they stay editable, and a board changes only with Start` (also: preset clears setup errors, focus stays on the button, board/flags/counter unchanged, timer keeps running, only Start creates the new board) | PASS   |
| AC3 | `AC3: the timer shows 0 until the first reveal, then whole seconds, with no cap` (flag does not start it, 999 ms shows 0, 1000 ms shows 1, jump of 1 000 000 s shows 1003)                                                                    | PASS   |
| AC4 | `AC4: a lost game freezes the timer on its value`, `AC4: a won game freezes the timer on its value` (both also check the hidden "Finished in n second(s)." text)                                                                              | PASS   |
| AC5 | `AC5: Start resets the timer, which stays 0 until the first reveal of the new game` (while running and after a finished game)                                                                                                                 | PASS   |

**Added tests: 7** (6 AC tests + 1 `test.fixme` for the layout defect). **Changed:** `e2e/auth.spec.ts` "keyboard only: sign in, sign out and sign in again…" now expects Beginner as the tab stop after "Sign out" (new tab order, UX §9; not a defect).

**Checked, OK** (throwaway probes, not kept):

- Dark mode (`emulateMedia colorScheme: dark`): preset text `#A8C7FA`, border `#9AA0A6`, detail `#BDC1C6`, focus ring 2 px solid `#A8C7FA`; all as in UX §6.
- Forced colours (`forcedColors: active`): preset buttons keep a real 1 px solid border and text in `ButtonText`, "Start" has a 1 px solid `ButtonText` border, hover changes the border colour, the focus ring is a 2 px solid outline.
- Keyboard: Enter and Space activate a preset; the preset buttons never submit the form; double click on a preset is harmless; accessible name is exactly "Beginner" etc., description "16 rows, 30 columns, 99 mines".
- Announcement "Beginner values set: 9 rows, 9 columns, 10 mines." exists in one `aria-live="polite" aria-atomic="true"` region; the timer has no role and is not inside any live region.
- Game that is won on the first reveal (30 × 30, 1 mine): timer 0, stays 0 after 1.5 s real time, "Finished in 0 seconds." present.
- No horizontal scrolling at 320, 375 and 800 px; the timer sits next to the counter in one row.

**Defects**

1. **Low, UX §7 deviation (no AC affected):** at 375 px (and 320 px) the preset buttons do not share one row. Beginner and Intermediate fill row 1 (168 px each), Expert wraps to a full-width row 2 (343 px). UX §7 expects one row of about 104 px each at 375 px. Cause (not verified in code): the flex items' min-content width (word "Intermediate" plus 0.75 rem padding on both sides) is larger than the 6.5 rem basis, so the three do not fit into 343 px. Repro: viewport 375 × 800, sign in, look at "Difficulty". Test: `e2e/minesweeper.spec.ts`, "UX7: at 375 px the three presets share one row without horizontal scrolling" (`test.fixme`; remove `.fixme` when fixed, it fails on the row check; confirmed). It is a layout nicety, so the story goes to review; hak or the reviewer can decide whether to fix it first.

**Verdict: PASS** (all five ACs pass; one low layout defect noted).

## Review

### Round 1 — 2026-11-02 — APPROVED

`npm run verify` green (200 unit tests, check-dist ok); `npx playwright test`: 59 passed (UX7 included, no fixme left).

**Findings**

- [nit] `e2e/minesweeper.spec.ts:438` (AC1) — the three `toBeVisible` checks on the presets repeat what `toHaveText([/^Beginner/, /^Intermediate/, /^Expert/])` on the "Difficulty" group already shows (exactly three, in order). Drop them; keep the input and "Start" checks.
- [nit] `e2e/minesweeper.spec.ts:517` (AC4 won) and the 1 000 000 s jump in the AC3 test — won vs lost only differ in the reducer, and "no cap" only in `elapsedSeconds`; both are already unit-tested (`gameReducer.test.ts:150`, `elapsedSeconds.test.ts:11`). The UI freeze path is the same for win and loss. The Technical design asked for these, so no change is needed now; it's input for the architect's minimal test set in future stories.
- [nit] `e2e/auth.spec.ts:318` — the change is correct (UX §9 tab order), but the auth spec now pins the game's first tab stop, so every setup change will break an auth test again (005, now 006). Optional: assert only that focus has left "Sign out" (for example that it is inside the Minesweeper section) before `Shift+Tab`.
- [nit] Story/backlog hygiene — "Implementation notes → Open points" still says that `auth.spec.ts` fails and that there's no e2e for 006 yet, and `docs/backlog/README.md` lists 006 as `designed`. Tidy up in the docs step.

**Checked, OK**

- Reducer: `now` comes in on the `reveal` action (`Minesweeper.tsx:95`, the only dispatch site), so the reducer stays pure under StrictMode. `startedAt = state.startedAt ?? now` is set on every path that leaves `ready`, including a first-reveal loss with a fixed layout. `endedAt` is set on both win and loss, and a win on the first reveal gives `startedAt === endedAt`. Guards return the same object, so a reveal after the end doesn't move `endedAt`. `start` resets both to null.
- Timer: the interval runs only while `startedAt !== null && endedAt === null`, effect deps are `[startedAt, endedAt]`, and the cleanup clears it on end, restart and unmount. A stale `now` from the previous game is clamped to 0 and fixed by the first tick. The frozen display and the hidden "Finished in n seconds." both come from `endedAt`, so they always agree.
- Re-render isolation (probe on a 30 × 30 board, 3 s of fake-clock ticks): 0 DOM mutations in the grid, 3 in the timer (one per whole second).
- Live region: the region is mounted empty, and each message is set in its handler with `serial`. Pressing the same preset three times gives `text+NBSP`, `text`, `text+NBSP`, so repeats are announced. The only text node containing U+00A0 is in the visually hidden `<p>` (clip-path inset(50%)). The timer is not inside any `aria-live` element and has no role. The result live wrapper is persistent, and the finish suffix is a visually hidden child, so the 005 `getByText(WON/LOST)` queries still pass.
- A11y: native `fieldset`/`legend` "Difficulty". The buttons' accessible name is exactly the preset name: the detail line is `aria-hidden`, and the description is a sibling referenced by `aria-describedby`. All buttons are `type="button"`. DOM order matches UX §3. Forced-colours rules and the "Start" border match UX §6 (the tester's probe also confirmed them).
- Layout probe: at 375 and 360 px the three presets share one row (109/104 px, "Intermediate" 94 px wide, no overflow). At 340 and 320 px they wrap 2 + 1, close to UX's "about 330 px". At 188 px (375 px at 200 % zoom) they stack, with no horizontal scrolling anywhere.
- Security: no new dependency, no HTML injection, no dev-only strings added (check-dist unchanged and green).

## Retrospective

_orchestrator, 2026-11-02._

Went well: gate 1 in one round, parallel design without conflicts, `page.clock` without a
dev-only hook, tester PASS, review APPROVED in round 1 with nits only. Model economy
worked: haiku for the story update and docs, sonnet for design, build and test, the
developer resumed for the layout fix.

### What went wrong

| #   | Problem                                                                                                                  | Root cause                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | The new presets broke the keyboard test in `e2e/auth.spec.ts` (tab order); the same happened in 005.                     | The auth spec pins the game's first tab stop (cross-feature coupling), and the developer doesn't run the e2e tests before handing over. |
| P2  | Tester defect (low): at 375 px "Expert" wrapped to a second row, although UX §7 requires one row.                        | Flex items' `min-width: auto`; the developer didn't check the UX layout claim at the stated width.                                      |
| P3  | Review nit: the design's test set asked for e2e checks (won vs lost freeze, no cap) already covered by unit tests.       | The architect's minimal test set guards against unit tests repeating e2e, not the other way round.                                      |
| P4  | The same lessons landed in several agent memories (tab-order coupling in developer, tester, reviewer; time in reducers). | Team-level knowledge without a home in `CLAUDE.md`.                                                                                     |

### Proposed changes

1. **`CLAUDE.md`, Code layout (P1, P4; reviewer's suggestion):** "Tests of one feature
   don't depend on another feature's layout or tab order — e.g. an auth test asserts
   that focus left the auth controls, not which game control it landed on." Plus a
   one-time change of `e2e/auth.spec.ts:318` to that form (tester, haiku).
2. **`developer` agent (P1; developer's suggestion):** before handing over, run
   `npm run test:e2e` once and pass failing specs of earlier stories to the tester.
3. **`CLAUDE.md`, Code layout (P4; architect's suggestion):** "Time and randomness never
   inside reducers — pass `now` or a seed in the action; e2e tests control time with
   Playwright `page.clock`, a dev-only hook only if that doesn't work."
4. **`architect` agent (P3):** each behaviour is tested once — edge cases of pure logic
   (limits, rare paths) in unit tests, the AC's visible behaviour in e2e; never both.

P2 needs no change: the tester caught it with a bounding-box check, which is now in its
memory.

### Outcome

All four proposals approved by hak at gate 2 ("Ja, alles") and applied: `CLAUDE.md`
Code layout gets "Independent tests" (1) and "Time and randomness" (3), the tester
changed `e2e/auth.spec.ts` to assert only that focus left "Sign out" (1),
`.claude/agents/developer.md` runs the e2e tests before handing over (2),
`.claude/agents/architect.md` tests each behaviour once (4). No open manual checks.
