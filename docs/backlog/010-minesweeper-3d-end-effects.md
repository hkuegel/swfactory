---
id: 010
title: Minesweeper 3D end effects, explosion on loss and celebration on win
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
branch: feature/010-minesweeper-3d-end-effects
supersedes: []
changes: [] # extends 009 (adds effects to the end of a game); no AC of 009 or 008 changes its wording
superseded-by:
---

# 010 – Minesweeper 3D end effects, explosion on loss and celebration on win

## Original request

> sorry, das 3d ist aber komplett langweilig. das soll graphisch was her machen

Note: hak, 2026-11-02, German, given right after story [008](008-minesweeper-3d-mode.md) was merged. At gate 1 hak confirmed a split into two stories: [009](009-minesweeper-3d-visual-upgrade.md) (the lit 3D scene with reveal and flag animations) and this story, the loss and win effects. This story depends on 009 (built after it).

## User story

As a player, I want a dramatic explosion when I lose and a celebration when I win in the 3D view, so that the end of a game feels rewarding.

## Context

Part of hak's wish to make the 3D view visually impressive (see [009](009-minesweeper-3d-visual-upgrade.md) for the full context, the confirmed visual style and the architect's feasibility check). 009 already shows a lost or won game as a static final board with its message ([009/AC5](009-minesweeper-3d-visual-upgrade.md)); this story adds the effects on top without changing that final state.

Confirmed by hak at gate 1 ("Ja, alle Vorschläge", 2026-11-02; see Decision log):

- **Loss:** an explosion effect (flash, particles and a short camera shake of at most 0.4 s) at the mine, the other mines then revealed one after another, whole effect at most 2.5 s.
- **Win:** a celebration (for example confetti or fireworks) of at most 4 s, no loop.
- **Safety:** nothing flashes more than 3 times in any second; the camera shake is included and is off under reduced motion.
- **No replay:** switching to 3D after a game has ended shows the final board without the effect.
- **No sound.** Large boards: effects shrink in size or number so the frame-rate floors of [009/AC3](009-minesweeper-3d-visual-upgrade.md) hold.
- The effects use the small seam the architect plans in 009's scene, so this story is additive. The same test approach applies as in 009: end-to-end tests run on software WebGL with the dev-only time probe, the frame-rate check is a script in headed Playwright on hak's Mac, and hak signs off a screen recording of at most 30 s at gate 2 (loss and win, light and dark).

## Acceptance criteria

- **AC1:** Given the 3D view and a running game, when I reveal a mine and lose, then an explosion effect (flash, particles and a camera shake of at most 0.4 s) plays at that mine, the other mines are then revealed one after another, the whole effect ends at the latest 2.5 s after the click in a static final board as in [005/AC9](005-minesweeper.md), the "lost" message and the stopped timer appear immediately and not after the effect, nothing flashes more than 3 times in any second, and when I start a new game with "Start" or a preset during the effect, then the effect stops at once.
- **AC2:** Given the 3D view and a running game, when I reveal the last safe cell and win, then a celebration (for example confetti or fireworks) plays over the board, ends at the latest 4 s after the click without looping, leaves the board readable and operable for "Start", the presets and the view control, the "won" message and the stopped timer appear immediately and not after the effect, nothing flashes more than 3 times in any second, and when I start a new game during the celebration, then it stops at once.
- **AC3:** Given a game that has already ended (lost or won), when I switch to 3D (the view starts as 2D after a reload, [008/AC8](008-minesweeper-3d-mode.md), and the game does not survive a reload), then the static final board is shown without any explosion or celebration, also when the game ended while I was in 2D.
- **AC4:** Given I have set the system to reduce motion, when I lose or win in the 3D view, then there is no explosion, camera shake, particle or celebration animation, and the final board and the message appear immediately as a static picture in which the lost state (mines, exploded mine, wrong flags) and the won state (all mines flagged, counter 0) are clearly distinguishable.
- **AC5:** Given the 3D view on the reference machine (hak's Mac), when the explosion or the celebration plays on a 16 × 30 or a 30 × 30 board, then the frame-rate floors of [009/AC3](009-minesweeper-3d-visual-upgrade.md) hold during the effect (at least 50 fps on 16 × 30, at least 30 fps on 30 × 30), the effects being reduced in size or number on large boards rather than slowing the board down. (Verified by a script in headed Playwright on the reference machine; not part of CI.)

## Out of scope

- The scene, reveal and flag animations, loading and fallback: story [009](009-minesweeper-3d-visual-upgrade.md).
- Sound and music; settings to turn effects off (the system "reduce motion" setting is the only switch).
- A replay of the effect, scores, sharing or a leaderboard.
- Free camera control by the player.
- Any change to the 2D view, the rules or the timer.

## Open questions

None.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-02 — Story created by the split of [009](009-minesweeper-3d-visual-upgrade.md) at gate 1. hak's words on the split: "Ja, alle Vorschläge" (hak, gate 1) = accepted. The loss and win effects (old AC3 and AC4 of 009 and their reduced-motion part) moved here; the request line is the same verbatim in both stories. Depends on 009. (product-owner)
- 2026-11-02 — Q4 (of 009): Which effects and durations? Proposed: explosion with particles and a short camera shake (at most 0.4 s, whole loss effect at most 2.5 s), win celebration (at most 4 s), at most 3 flashes per second; does the shake go too far? — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed, camera shake included. Consequence: AC1, AC2, AC4.
- 2026-11-02 — Q5 (of 009): Sound? Proposed: none. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: Out of scope.
- 2026-11-02 — Q6 (of 009): Switching after the end? Proposed: switching to 3D after the game has ended shows the final board without replaying the effect. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: AC3.
- 2026-11-02 — Q7 and Q8 (of 009): Large boards, performance floor and reference machine? Proposed: effects shrink on large boards; at least 50 fps on 16 × 30 and at least 30 fps on 30 × 30. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed; reference machine is hak's Mac. Consequence: AC5.
- 2026-11-02 — Q11 (of 009): Sign-off at gate 2? Proposed: screenshots plus a screen recording of at most 30 s. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: Context; the UX design lists the states (explosion and celebration mid-effect and final, light and dark).
- 2026-11-02 — Architect feasibility check (via the coordinator), as recorded in 009: the effects use a small seam in the scene built in 009, so this story is additive; end-to-end tests use the dev-only time probe on software WebGL; the frame-rate check runs in headed Playwright on hak's Mac. Open questions none; status ready. (product-owner)

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
