---
id: 009
title: Minesweeper 3D visual upgrade, a lit 3D scene with reveal and flag animations
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
branch: feature/009-minesweeper-3d-visual-upgrade
supersedes: []
changes: [008/AC3, 008/AC6, 008/AC7] # 008 stays done; its switch (AC1, AC2, AC8), game behaviour (AC4) and accessibility (AC5) are kept
superseded-by:
---

# 009 – Minesweeper 3D visual upgrade, a lit 3D scene with reveal and flag animations

## Original request

> sorry, das 3d ist aber komplett langweilig. das soll graphisch was her machen

Note: hak, 2026-11-02, German, given right after story [008](008-minesweeper-3d-mode.md) was merged. It is feedback on the 3D view built there. At gate 1 hak confirmed a split: this story (a) is the lit 3D scene with reveal and flag animations, performance, reduced motion, parity and loading/fallback; the loss and win effects are story (b) [010](010-minesweeper-3d-end-effects.md), which depends on this one.

## User story

As a player, I want the 3D view to look spectacular (real depth, light and shadows, lively reveals and flags), so that playing in 3D is worth choosing over the plain 2D view.

## Context

hak finds the result of [008](008-minesweeper-3d-mode.md) (a tilted DOM grid with a fixed angle, relief from shadows, instant switch) "completely boring" and wants it to be visually impressive. "Graphisch was her machen" is subjective; it is read as: real 3D look (depth, lighting, soft shadows) and motion that rewards actions (reveal, flag). The look is signed off by hak at gate 2 on screenshots and a screen recording of at most 30 s; the ACs make the measurable parts testable.

**This partly reverses gate 1 of 008**, where hak accepted "a fixed angle, no camera" over a full 3D scene. hak was asked again and confirmed (Decision log, Q1): a real lit scene, but still **no orbit, zoom or pan** by the player. 008/AC3 (look) and 008/AC6 (motion: nothing moves by itself) are therefore changed here; 008/AC7 (fallback) is extended by new ways 3D can be unavailable.

Confirmed by hak at gate 1 ("Ja, alle Vorschläge", 2026-11-02; see Decision log):

- **Style:** glossy, slightly rounded tiles on a dark stone table, warm key light, soft shadows; the scene follows light and dark like 2D.
- **Camera:** fixed default tilt of at most 35° plus a gentle idle sway of at most 3° with a period of at least 10 s; no user control.
- **Effects in this story:** reveal flip/sink with a wave on opened areas, flag planting. The loss explosion (with camera shake) and the win celebration are in story 010.
- **No sound.** 3D stays switchable during a game; large boards behave as in 008 (the board scrolls in its own box, 30 × 30 playable, no width cut-off); phones get no frame-rate number, effects reduce automatically.
- **Reference machine** for the frame-rate floor is hak's Mac; the tester measures there and hak confirms at gate 2.

Kept from 008: the "View" control and its place, state preservation when switching (008/AC2), game behaviour in 3D (008/AC4), accessibility structure and focus indicator (008/AC5), 2D as the default after reload and sign-in (008/AC8), light and dark schemes, a drag scrolls the board and never rotates the camera, the view is not remembered. The 2D view is not touched.

Feasibility check by the architect (consequences recorded in the Decision log; the Technical design will work them out):

- The scene is built with plain three.js (no React wrapper libraries), loaded lazily when 3D is first chosen; about 150 to 180 kB gzip extra, accepted by hak. New dependency, therefore an ADR.
- The existing DOM grid stays as a transparent overlay aligned to the camera, so input (mouse, long-press, keyboard, drag-scroll) and the screen-reader structure are unchanged.
- Digits, flags and mines are drawn unlit or emissive so the contrast rules of [007/AC3](007-minesweeper-redesign.md) hold at every camera position.
- The scene renders on demand; the idle sway is the only continuous loop. Losing the rendering context returns the view to 2D with a message (AC6).
- End-to-end tests run on software WebGL, where wall-clock timing is unreliable; they use a dev-only time and sway probe (dev builds in the e2e mode only, with an entry in the dist check). The frame-rate check (AC3) is a script in headed Playwright on hak's Mac, not part of CI.
- The scene has a small seam for effects so that [010](010-minesweeper-3d-end-effects.md) is additive.

Numbers in the ACs (durations, sway angle, luminance thresholds) were proposed by the product owner for testability and confirmed by hak. The pixel checks in AC1 are proxies for "looks lit and has depth"; the tester may pick the sample points.

## Acceptance criteria

- **AC1:** Given the 3D view with a running game, when I look at the board, then it is shown as a lit three-dimensional scene: tiles have visible thickness (side faces at least 15 % darker than the top face), hidden tiles are raised and revealed tiles are sunk into the board, flags and mines are 3D objects, raised tiles and objects cast soft shadows (the surface next to a raised tile is at least 10 % darker than the lit surface farther away), digits, flags and mines keep the contrast rules of [007/AC3](007-minesweeper-redesign.md) at every camera position, the camera looks at the board at a tilt of at most 35° and sways gently by at most 3° with a period of at least 10 s (two frames taken 3 s apart differ, none shows a tilt above 35°), and the cells of the far row are at least 24 px wide on screen. (Verified by sampling rendered pixels in the same test run; no committed reference images. Replaces the look of 008/AC3.)
- **AC2:** Given the 3D view and a running game, when I reveal a cell, then it flips or sinks within 150 to 400 ms; when the reveal opens an area, then the newly opened cells animate as a wave that starts at the clicked cell, and the final state is shown at the latest 1.2 s after the click on any board size; when I flag or unflag a cell, then the flag is planted (or removed) with a short animation of at most 300 ms; and in all cases the game state, the counter, the accessible names of the cells and my next input (reveal, flag, keyboard) take effect immediately without waiting for an animation to end. (Verified by frames taken during and after the animation, and by the accessible name of a cell that already shows the new state at the first frame.)
- **AC3:** Given the 3D view on the reference machine (hak's Mac), when I play a 16 × 30 board including a large cascade, then the frame rate stays at 50 fps or higher (median over the cascade and the following 2 s), and given a 30 × 30 board, then it stays at 30 fps or higher and my input is visibly answered within 100 ms, animations being reduced in size or number rather than slowing the board down. (Verified by a script in headed Playwright on the reference machine; not part of CI.)
- **AC4:** Given I have set the system to reduce motion, when I use the 3D view, then the camera does not sway, there are no flip, wave or plant animations, every state change (revealed cells, flags, a lost or won game) is shown immediately as a static picture that is still readable, and switching the view is immediate; and given normal motion settings, then the only motion that continues without my action is the sway of AC1, and every animation caused by my action ends by itself. (Replaces the motion rule of 008/AC6; the 300 ms limit for switching the view stays.)
- **AC5:** Given the 3D view, when I switch between 2D and 3D during a game, play with the mouse, long-press, drag and the keyboard (arrow keys, Enter or Space, F), and lose or win a game, then [008/AC2](008-minesweeper-3d-mode.md), AC4 and AC5 still hold: the same cells, flags, counter, timer and result in both views, the same rules, the same gestures (a drag scrolls the board and never turns the camera), a lost or won game shows its final board and message as in [005/AC9 and AC10](005-minesweeper.md) (as a static picture; no loss or win effect is required here), the same grid structure and cell names for a screen reader, and a visible focus indicator on the focused cell of at least 2 px and 3:1 contrast in both colour schemes.
- **AC6:** Given I choose "3D" for the first time, when the 3D part has to be loaded, then I see a loading indication, the 2D board stays usable, and the 3D board replaces it when ready; given the loading fails or takes longer than 10 s, then I see a short message that 3D could not be loaded, "2D" stays the current view and the game is unchanged; given a browser or device that cannot show the 3D scene, then "3D" is shown as unavailable with a short text; given the 3D rendering is lost during a game, then the view returns to 2D with a short message, the game state is kept, "2D" remains usable and no blank board or error page appears. (Verified by simulating a slow or failing load, a missing capability and a lost rendering context. Extends the fallback of 008/AC7.)

## Out of scope

- The loss explosion with camera shake and the win celebration: story [010](010-minesweeper-3d-end-effects.md).
- Free camera control by the player (rotate, zoom, pan): hak confirmed the camera stays free of user control. It would change the gestures of [008/AC4](008-minesweeper-3d-mode.md) and needs its own story.
- Sound and music (hak: none in this story).
- Any change to the 2D view, the rules, board sizes, presets or the timer.
- Remembering the chosen view or any visual setting across reload; settings to turn effects on or off (the system "reduce motion" setting is the only switch, AC4).
- Themes the player can choose between; one visual style is built.
- Backend, accounts, scores or sharing.

## Open questions

None.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-02 — Story created from hak's request (German, verbatim). "Komplett langweilig, das soll graphisch was her machen" read as a request to make the 008 3D view visually impressive (assumption: real depth, lighting and shadows, animated reveal and flag, loss and win effects). This partly reverses hak's gate-1 decision in 008 ("fixed angle, no camera"), so it was asked again. `changes: [008/AC3, 008/AC6, 008/AC7]`; 008 stays done and is marked "(changed by 009)" on those ACs. 8 ACs, one above the ~7 guideline, with a proposed split. Open questions 1 to 11 with proposed defaults. Status draft. (product-owner)
- 2026-11-02 — Q1: Reversal of "fixed angle, no camera" (008 gate 1)? Proposed: a real scene with light, shadows and effects, but no orbit, zoom or pan. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: Context; Out of scope; 008/AC3 and AC6 changed.
- 2026-11-02 — Q2: Visual style? Proposed: glossy, slightly rounded tiles on a dark stone table, warm key light, soft shadows, following light and dark. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: Context; AC1.
- 2026-11-02 — Q3: Camera? Proposed: fixed tilt of at most 35° plus idle sway of at most 3° with a period of at least 10 s. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: AC1 and AC4 (sway stops under reduced motion).
- 2026-11-02 — Q4: Which effects and durations? Proposed: all four effects (reveal wave, flag planting, explosion with particles and camera shake, win celebration), durations as listed, at most 3 flashes per second, camera shake included. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed, with the split below. Consequence: reveal and flag in AC2 of this story; explosion and celebration in [010](010-minesweeper-3d-end-effects.md).
- 2026-11-02 — Q5: Sound? Proposed: none. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: Out of scope.
- 2026-11-02 — Q6: Switching during a game and after the end? Proposed: switchable, state preserved, no replay of end effects when switching to 3D after the end. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: AC5 (008/AC2 holds); the no-replay rule is in story 010.
- 2026-11-02 — Q7: Large boards and small screens? Proposed: as 008 (own scroll box, far-row cells at least 24 px, 30 × 30 playable, no width cut-off, effects shrink). — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: AC1 (24 px), AC3 (30 × 30).
- 2026-11-02 — Q8: Performance floor and reference machine? Proposed: 50 fps on 16 × 30, 30 fps on 30 × 30 on a typical laptop, reference machine to be named; phones no number. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed; reference machine is hak's Mac, the tester measures there and hak confirms at gate 2; phones get no fps number. Consequence: AC3.
- 2026-11-02 — Q9: Technology and download size? Proposed: architect's call, size reported to hak, loading timeout 10 s. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed; about 170 kB extra lazy download accepted. Consequence: Context (architect feasibility); AC6 (10 s timeout).
- 2026-11-02 — Q10: Light and dark scheme? Proposed: the scene follows the scheme, with the 007/AC3 contrast rules. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: AC1.
- 2026-11-02 — Q11: Sign-off at gate 2? Proposed: screenshots plus a screen recording of at most 30 s, recorded by the tester. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: Context; the UX design lists the exact states (for this story: running game, reveal cascade, flag planting, light and dark, 375 px).
- 2026-11-02 — Scope decision: split the 8 ACs. — A: "Ja, alle Vorschläge" (hak, gate 1) = accepted. Consequence: this story keeps the scene, reveal and flag, performance, reduced motion, parity and loading/fallback and is renumbered to 6 ACs (old AC1, AC2, AC5, AC6, AC7, AC8 became AC1 to AC6; no design existed yet, so renumbering was safe); the loss and win effects (old AC3 and AC4 and their reduced-motion part) moved to the new story 010, which depends on this one. The lost and won final boards are still shown as static pictures here (AC5).
- 2026-11-02 — Architect feasibility check (via the coordinator): plain three.js (no wrapper libraries), loaded lazily, about 150 to 180 kB gzip, new dependency therefore an ADR; the DOM grid stays as a transparent overlay aligned to the camera so input and accessibility are unchanged; digits, flags and mines unlit or emissive to keep the 007/AC3 contrast; render on demand with the sway as the only loop; context loss returns to 2D with a message; e2e runs on software WebGL with a dev-only time and sway probe (dev builds in the e2e mode only, dist-check entry) because wall-clock checks are unreliable there; AC3 measured by a script in headed Playwright on hak's Mac, not in CI; a small effects seam so story 010 is additive. Consequences: Context; AC3 and AC6 worded accordingly; open questions cleared, status ready. (product-owner)

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

## Retrospective

_orchestrator: what went wrong (review rounds, defects, corrections at the gates),
proposed changes to agents/CLAUDE.md/templates, and which ones hak approved._
