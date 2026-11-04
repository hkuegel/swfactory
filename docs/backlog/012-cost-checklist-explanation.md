---
id: 012
title: Factory process - cost per story, reviewer checklist, plain-language explanation at gate 2
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: chore # feature | bug | chore
app: platform # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<name>/docs/backlog)
branch: feature/012-factory-process-improvements
supersedes: []
changes: []
superseded-by:
---

# 012 – Factory process: cost per story, reviewer checklist, plain-language explanation at gate 2

## Original request

> Verbatim, hak, 2026-11-04 (short exchange):
>
> - hak: "such mir mal nach mehr Artikeln zum Thema software factories (also mit AI)"
> - hak: "ja bitte. ich will nicht alles lesen. gib mir eine zusammenfassung und weise darauf hin wenn ich was komplett lesen sollte"
> - The orchestrator summarised Addy Osmani "Software Factories, Light and Dark", LaunchDarkly "Building a software factory on our scariest code" and Zylos Research "Multi-agent software development" and proposed three improvements:
>   1. "Kosten pro Story: Tokens pro Story/Rolle in der Retro festhalten (LaunchDarkly hat das von Anfang an als Metrik geführt, wir bisher gar nicht)."
>   2. "Reviewer mit fester Checkliste statt freiem Review, damit der LLM-Reviewer weniger beliebig ist (Osmanis Kritik)."
>   3. "Gegen Comprehension Debt: bei Gate 2 eine kurze Klartext-Erklärung, wie die Lösung funktioniert und wo die Risiken liegen – nicht nur AC-Tabelle und Bilder."
> - hak: "Ja, Story schreiben"

## User story

As the sponsor of the factory, I want to see what a story cost, have reviews follow a fixed checklist, and get a short plain-language explanation at gate 2, so that I can steer cost, trust the review to be consistent, and understand what was built without reading code.

## Context

Three improvements to the factory process itself, taken from articles on AI software factories. No app or platform code changes; only process files (`CLAUDE.md`, agent files, the `feature` and `bug` skills, the story template) and the structure check.

- Cost: the orchestrator sees each subagent's token usage, tool uses, duration and chosen model when the agent finishes. It does not see its own main-session tokens per story exactly.
- Review: today the reviewer writes free-form findings with severities; its memory holds several check files. A fixed checklist makes reviews comparable between stories.
- Comprehension: hak does not read code. Gate 2 today shows an AC table, test results and screenshots, but no explanation of how the solution works.

Applies to `/feature` and `/bug` (both have a retro and gate).

Decided at gate 1 (see Decision log):

- Reviewer checklist: one factory file `.claude/agents/reviewer-checklist.md` with a `version:` in its first lines, referenced from the reviewer's agent file. The existing check files in the reviewer's memory stay as lessons.
- Explanation: a new section "Explanation" between "Review" and "Retrospective", written by the orchestrator after the review verdict, from story, diff and test report. The tech-writer is not involved.
- Enforcement: `npm run check:structure` fails for a story with `status: done` and an id above 012 that lacks the cost table row or has an empty or missing "Explanation" section. This is a script change for `devops`.
- Scope in time: stories 001 to 011 are not backfilled. The rule applies from story 013 on; story 012 is exempt from AC1 to AC7, because they cannot be observed on it before it is done.
- Cost numbers are recorded only: no thresholds, no budgets. The retro may comment when one role stands out.

## Acceptance criteria

- **AC1:** Given a story of `/feature` or `/bug` that went through the pipeline after this change, when its "Retrospective" section is read, then it contains a cost table with one row per agent run (role, round, model, tokens, tool uses, duration) and a total over the rows.
- **AC2:** Given a cost table, when the orchestrator's own main-session usage is not exactly observable, then the table has a separate row "orchestrator (main session)" marked as "not measured" or as an estimate labelled "estimate"; it is never shown as a measured value, and it is not included in the total of measured rows.
- **AC3:** Given a run of an agent whose usage was not reported, when the cost table is written, then that row shows "n/a" instead of a number or a guess.
- **AC4:** Given a reviewer run, when the story's "Review" section is read, then it lists every item of the reviewer checklist with a result of pass, fail or n.a. (n.a. with a one-line reason), plus the checklist version used.
- **AC5:** Given the checklist, when it is read, then it is one versioned file in the repository, `.claude/agents/reviewer-checklist.md` (version in its first lines), that the reviewer agent is instructed to work through, and findings outside the checklist are still allowed and reported with severity as before.
- **AC6:** Given gate 2, when the orchestrator presents the story to hak, then the presentation includes, in German, an explanation of at most 15 lines (how the solution works, what changed where, the main risks, what was not verified), in plain language without code or file-level jargon, in addition to the existing gate items.
- **AC7:** Given a story that reached gate 2 after this change, when its file is read, then it has a section "Explanation" in English with the same content as the German one shown at gate 2, placed between "Review" and "Retrospective", and the story template contains that section heading.

## Out of scope

- Changing models, the agent roster or roles.
- Dashboards, charts or any cost tooling beyond the table in the story.
- Budgets or limits on cost; this story only records it.
- Any app or platform code.
- Rewriting old stories (stories 001 to 011 are exempt, see Decision log).

## Open questions

None.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-04 — Q: Write a story for the three proposed improvements? — A: "Ja, Story schreiben" (hak)
- 2026-11-04 — Q: Open question 1, where does the reviewer checklist live? Proposed default: `.claude/agents/reviewer-checklist.md`, a factory file with a `version:` in its first lines, referenced from `reviewer.md`; the existing check files in the reviewer's memory stay as lessons. — A: "Ja, alles" (hak, gate 1). Default confirmed; folded into Context and AC5.
- 2026-11-04 — Q: Open question 2, where does the explanation live in the story and who writes it? Proposed default: new section "Explanation" between "Review" and "Retrospective", written by the orchestrator after the review verdict from story, diff and test report; the tech-writer is not involved. — A: "Ja, alles" (hak, gate 1). Default confirmed; folded into Context and AC7.
- 2026-11-04 — Q: Open question 3, should `check-structure` enforce the new sections? Proposed default: yes, for a story with `status: done` and an id above 012 a cost table row and a non-empty "Explanation" section; script change by devops, not required for the process change to count as done. — A: "Ja, alles" (hak, gate 1). Default confirmed; folded into Context (enforcement).
- 2026-11-04 — Q: Open question 4, are old stories (001 to 011) exempt? Proposed default: yes, nothing is backfilled; the rule applies from story 013 on, and 012 itself is exempt from AC1 to AC7. — A: "Ja, alles" (hak, gate 1). Default confirmed; folded into Context (scope in time).
- 2026-11-04 — Q: Open question 5, how are cost numbers used? Proposed default: recorded only, no thresholds; the retro may comment when one role stands out. — A: "Ja, alles" (hak, gate 1). Default confirmed; folded into Context.
- 2026-11-04 — Q: Open question 6, for `/bug`, is the cost table required too? Proposed default: yes, same table, because it also has a retro. — A: "Ja, alles" (hak, gate 1). Default confirmed; folded into AC1.
- 2026-11-04 — Q: AC1 to AC7 as written, approved at gate 1? — A: "Ja, alles" (hak, gate 1). ACs unchanged in wording except the references to the open questions (AC5 location, AC7 placement) which now carry the confirmed values.
- 2026-11-04 — Gate 2: accept the result and apply all four retro proposals (checklist v2, fresh agents for measurable cost, near-miss probes for check scripts, 120-character line limit for the Explanation), commit. — A: "Ja, alles" (hak, gate 2) = as proposed. Consequence: status done.

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

Not applicable (no UI).

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

Implementer: `devops` (factory files need an owner, CLAUDE.md "Factory files"; recorded in Implementation notes). Pure process change: no dependencies, no ADR (every item is a text file; all of it is reversible by a retro proposal). No UX design needed.

### Files

| File                                   | Change                                                                                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.claude/agents/reviewer-checklist.md` | new: the versioned checklist (AC5)                                                                                                               |
| `.claude/agents/reviewer.md`           | step 4 works through the checklist; step 5 report format; boundaries unchanged                                                                   |
| `docs/templates/story.md`              | new heading `## Explanation` between Review and Retrospective; Retrospective placeholder mentions the `### Cost` table                           |
| `.claude/skills/feature/SKILL.md`      | new step "Explanation" (before Retro), cost table in the Retro step, Gate 2 shows the German explanation first; model-economy note for cost data |
| `.claude/skills/bug/SKILL.md`          | same three edits (shorter)                                                                                                                       |
| `CLAUDE.md`                            | Conventions: one bullet "Story record" naming the cost table, checklist and Explanation and that check-structure enforces them from story 013    |
| `scripts/check-structure.mjs`          | new rule 4 (header comment updated)                                                                                                              |
| `docs/backlog/README.md`               | none beyond the status cell                                                                                                                      |

Constraint: rule 1 of check-structure scans `.claude/agents|skills`, `docs/templates` and `CLAUDE.md` for app names, so none of these files may name an app (use "a render loop", not an app's feature name).

Risk R1: Claude Code loads every `.md` in `.claude/agents/` as an agent definition. `reviewer-checklist.md` has no frontmatter, so it may be skipped or flagged. AC5 fixes the location, so devops must check once (start `claude`, `/agents`, no error and no phantom agent). If it does appear as an agent, stop and ask hak to change AC5 (fallback: `.claude/reviewer-checklist.md`); don't improvise.

### 1. Cost table (AC1 to AC3)

Where: a `### Cost` subsection (exact heading) inside `## Retrospective`, after the free text and before or after "What went wrong"; the position inside the section is free, the heading is what check-structure finds.

Format (one table, this exact header; integers without thousands separators so the sum is checkable):

```markdown
### Cost

| Role                        | Round | Model  | Tokens       | Tool uses | Duration |
| --------------------------- | ----- | ------ | ------------ | --------- | -------- |
| product-owner               | 1     | sonnet | 41200        | 9         | 2:35     |
| architect                   | 1     | opus   | 88650        | 31        | 7:10     |
| tester                      | 1     | opus   | n/a          | n/a       | n/a      |
| reviewer                    | 2     | opus   | 63100        | 22        | 5:02     |
| total (measured)            |       |        | 192950       | 62        | 14:47    |
| orchestrator (main session) |       | opus   | not measured | n/a       | n/a      |
```

Rules (written into both skills' retro step):

- One row per agent run, in chronological order. Role = agent name. Round = ordinal of that agent's run in this story (1, 2, 3 ...). A run resumed with SendMessage is a new row with the next number (review fixes: developer 1, 2; reviewer 1, 2). A usage-limit interruption plus resume is two rows.
- Model = the model the run used (the `model:` override passed in the Agent call, else the agent file's `model:`). Tokens = the `subagent_tokens` figure of the completion data; Tool uses = its tool-use count; Duration = its duration as `m:ss` (`h:mm:ss` over an hour).
- If a run's completion data lacks a figure, or it is unclear whether a resumed run's figure is cumulative or only the new part, write `n/a` in that cell (all three number cells if all are missing). Never infer or estimate a subagent row.
- The total row is `total (measured)`: the sum of the integer cells of that column, `n/a` cells skipped. Tokens and Tool uses are summed; Duration is summed as well (agent time, not wall-clock). If rows were skipped, nothing more is needed; the n/a rows are visible above it.
- The orchestrator row comes last and after the total, is never summed. Tokens cell is `not measured`, or `estimate: ~NNNN` when a figure exists (for example from hak); Tool uses and Duration are `n/a`. Model = the main session's model if known, else `n/a`.
- The orchestrator keeps a running list while the pipeline runs (one line per completed agent: role, round, model, the three figures, copied at once from the completion message) in its task list, and writes the table in the retro step from it. No numbers are reconstructed afterwards. Free text under the table may comment when one role stands out; no thresholds.

### 2. `reviewer-checklist.md` (AC4, AC5)

Structure of the file:

```markdown
# Reviewer checklist

Version: 1

How to use: ... (4 lines: work through every item in order; result `pass`, `fail` or `n.a.`; an
`n.a.` needs the condition below it to be true and a one-line reason in the story; a `fail` needs a
finding with severity in the Review section; findings outside the list are still allowed.)
How to change: only through a hak-approved retro proposal; bump `Version`, never renumber
or reuse an id, append a line to "Changes" below.

## A. Correctness

- **C1** ...

## Changes

- 1 (2026-11-04): first version.
```

Version is an integer on its own `Version: N` line in the first ten lines (the reviewer quotes it; nothing parses it). Ids are stable (letter + number) so a table from story 013 and one from story 030 compare item by item. Retired ids stay in the file as `~~C7~~ retired in vN`.

First version of the items (each ends with "n.a. when ..."; devops may tighten wording, not drop items):

Correctness

- **C1** Every AC is met by the code: for each AC name the code path and the test that shows it. n.a. never.
- **C2** Async flows: every non-interactive await in a pending-UI flow has a timeout (AbortController + named constant) that ends in the error state; a late callback cannot overwrite a success. n.a. when the diff has no network call or pending state.
- **C3** React state and effects: effect dependencies complete, cleanup on unmount, no stale closures, derived values not stored. n.a. when no hook or component logic changed.
- **C4** Imperative controllers and render loops: every path that writes inline styles or external state is also written when the loop does not run (forced colours, reduced motion, inactive scene) and on every re-attach (new game, mode switch). n.a. when no render loop or imperative controller changed.
- **C5** Time and randomness are never read inside reducers (`now` or a seed is passed in the action). n.a. when no reducer changed.
- **C6** Every failure path ends in a visible state or a logged error; no swallowed errors, no hidden catch. n.a. when the diff has no error handling or I/O.

Security and dev-only

- **S1** No `dangerouslySetInnerHTML`, no unvalidated URL or user input reaching the DOM, a URL or a query. n.a. when no input or rendering code changed.
- **S2** No secrets in code, config or docs; `VITE_*` values are public only. n.a. when no config, env or auth code changed.
- **S3** New dependencies: ADR exists, trustworthy source, types installed with `-D`. n.a. when `package.json` dependencies are unchanged.
- **S4** Dev-only code and test fakes are guarded with `import.meta.env.DEV` (and the mode) written out at every use site, their strings are in the owning workspace's `dist-check.json`, and helpers outside the guard are not left in the production bundle (grep `dist/`). n.a. when no dev-only code was added.
- **S5** Copied or generated code (`templates/app`, scripts) is exercised by `npm run verify` or was run by hand by the reviewer. n.a. when none was touched.

Tests

- **T1** `npm run verify` run by the reviewer is green. n.a. never.
- **T2** Test proportionality: one test per AC at the cheapest level; no AC tested at several levels or the same code path twice; unit tests only for logic with branches. n.a. when no test changed.
- **T3** Tests would fail on a regression: no vacuous fixtures (blank names, empty lists, `''` defaults, size-mismatched pixel diffs), assertions on intent not design values. n.a. when no test changed.
- **T4** Test independence: no counted Tab sequences or raw coordinates of moving elements, motion paused before clicks, tests named after ACs. n.a. when no e2e spec changed.

Conventions

- **K1** Matches the Technical design; deviations are in Implementation notes; no dead code, duplication or speculative abstraction. n.a. never.
- **K2** TypeScript rules of CLAUDE.md: no `any`, no `!` without a comment, optional props `?: T | undefined`, named exports, one component per file, tests next to the code. n.a. when no TypeScript changed.
- **K3** Styling rules: tokens only (no colour literals or `font-family`), `transition` uses `var(--duration)`, derived values are `calc()` over tokens, variant selectors in `:where()`, dark mode only in token files. n.a. when no CSS changed.
- **K4** Platform and factory files name and import no app (`check:structure` green); platform code is generic. n.a. when no platform or factory file changed.
- **K5** Records: story status, index row, Decision log, README/CHANGELOG updated where user-visible; markdown passes prettier. n.a. never.

Accessibility and UI

- **A1** Controls have role and accessible name, work by keyboard, focus is visible and managed (move, restore). n.a. when no UI changed.
- **A2** Every state cue also exists as border, outline or glyph (survives forced colours); contrast checked for the pairs actually painted. n.a. when no UI or colour changed.
- **A3** Live regions mount before their content; reduced motion is honoured. n.a. when no UI, animation or announcement changed.
- **A4** Rendering cost: no per-frame allocation or whole-buffer uploads, no leak of GPU or listener resources across repeated attach (count them). n.a. when no render loop or canvas changed.

That is 24 items. Seeds from the reviewer memory: C2 (async-adapter-checks), S4 (build-guard-checks), S5/K4/T3 (monorepo-checks, test-proportionality), C4/A4 (webgl-scene-checks), A2/A3 (ui-a11y-probes). The memory files stay unchanged as the "how to probe" lessons.

Reviewer file edits (`reviewer.md`): step 4 becomes "Work through `.claude/agents/reviewer-checklist.md` item by item (read it fresh each round, it is the version of record); the old review focus list stays as the guide for findings beyond it"; step 5 replaced by the report format below. The verdict rule gets one line: a `fail` item is a finding and carries a severity; blocker/major rules are unchanged.

Review section format (every round, full table, not a diff to the last round):

```markdown
**Round N, reviewer YYYY-MM-DD. Verdict: ... Checklist version: 1**

| Item | Result | Note                               |
| ---- | ------ | ---------------------------------- |
| C1   | pass   | AC1 to AC7 traced, see test report |
| C2   | n.a.   | no network call in the diff        |
| S4   | fail   | finding 2                          |

Findings: `[blocker|major|minor|nit] file:line - problem - suggested fix` (as before, numbered)
```

All 24 ids appear. `pass` needs only a short note (what was looked at); `n.a.` needs the reason; `fail` points to a finding number. Not enforced by the script (a markdown table is not worth parsing); the retro checks that the table is complete.

### 3. Explanation (AC6, AC7)

Template (`docs/templates/story.md`), between Review and Retrospective:

```markdown
## Explanation

_orchestrator: plain-language explanation shown at gate 2, at most 15 lines. No code, no file names._
```

(The placeholder is one line starting `_orchestrator:` and ending `_`; check-structure ignores it.) The story's English text and the German text shown at gate 2 carry the same content, the German one is a translation, not a second draft.

Outline (at most 15 non-blank lines, short paragraphs or four labelled lines):

1. How it works: the idea in two or three sentences, in terms of what the user or the factory sees.
2. What changed: which behaviours or process steps are new or different, by area, not by file.
3. Risks: the two or three that matter, and what stops them.
4. Not verified: everything no agent could check (real devices, real services, manual checks left open, tests not written) - "nothing" is written out if so.

The orchestrator writes it after the review verdict APPROVED and the docs step, from the story (ACs, Technical design, Implementation notes), the Test report and `git diff main...HEAD --stat`. hak's corrections at the gate are applied to the section (English) at once.

Skill text. `feature`: new step 8 "**Explanation** - write the story's "Explanation" section yourself (English, at most 15 lines: how it works, what changed, main risks, what was not verified; plain language, no code or file names) from the story, the test report and the diff." Old 8 (Retro) becomes 9, GATE 2 becomes 10. Gate 2 gets the first item: "present first the same explanation in German, at most 15 lines, before the AC table, then: ...". `bug`: new step 7 "Explanation" (same sentence, "what was wrong, what the fix changes, risk, what was not verified"), Retro 8, GATE 9, gate text starts with the German explanation. Retro step in both: "append a `### Cost` table as specified in `CLAUDE.md`/this step: ..." with the rules of section 1 in full in `feature` and by reference ("same table as in /feature") in `bug`. `feature` gets one more line near "Model economy": "After every agent completion, note role, round, model, tokens, tool uses and duration for the cost table."

### 4. `check-structure` rule 4

For every story file (all backlogs, the `stories` array of rule 3) with `status: done` and numeric id > 12:

1. Sections: split the markdown (headings found on `stripCode(text)`, bodies taken from the raw text at the same offsets, since `stripCode` keeps lengths). Headings `## Review`, `## Explanation`, `## Retrospective` must exist in this order; otherwise report "missing/misplaced section".
2. Explanation body: remove blank lines, HTML comments and lines matching `^_orchestrator:.*_$` (the placeholder). Fail if nothing is left ("empty Explanation") or if more than 15 lines are left ("Explanation longer than 15 lines").
3. Cost table: inside the Retrospective body find the line `### Cost` (exact, trimmed); the first table after it must have the header cells `Role|Round|Model|Tokens|Tool uses|Duration` (compare after trim and lower-casing). Then:
   - at least one run row (a row that is neither total nor orchestrator);
   - every run row has six non-empty cells; Tokens, Tool uses, Duration are an integer / integer / `m:ss` or `n/a`;
   - exactly one row whose first cell starts with `total`, and its Tokens cell, if the run rows have integers, starts with the sum of the integer Tokens cells (`parseInt`; the cell may continue with a note) - this is what catches an orchestrator estimate being summed (AC2);
   - exactly one row whose first cell starts with `orchestrator (main session)`, whose Tokens cell is `not measured` or starts with `estimate`.
4. Messages follow the existing `report(file, line, message)` style, one problem per violation, line = the heading line or the offending row.

Skip rule: `id <= 12` or `status != done` are not checked, so 001 to 012 pass untouched; a story that is `in-review` is not checked (the check bites when the orchestrator sets `done`). Row parsing reuses the plain `split('|')` of rule 3 (no escaped pipes in these cells). The rule is about 50 lines, written as small functions in the same file; no new module.

### Risks

- R1 above (agent loader and the checklist file).
- R2: a fixed checklist can turn into a box-ticking exercise that crowds out thinking. Mitigation: findings outside the list stay allowed and are named in the reviewer file; the retro may propose new items from the findings that came from outside the list.
- R3: `subagent_tokens` of a resumed agent may be cumulative. Mitigation: the n/a rule; the first story (013) shows what the harness reports and the retro of 013 fixes the rule if needed.
- R4: check-structure fails `verify` for any later story whose orchestrator forgets the table. That is the intent; the message says what is missing.
- R5: placeholder-only Explanation is detected by the `_orchestrator:` pattern; if devops changes the template wording the pattern must change with it (both in the same commit; the dry run below catches a mismatch).

### Implementation plan

1. `reviewer-checklist.md` (24 items, version 1); then `reviewer.md`; check R1.
2. `docs/templates/story.md` (Explanation heading, Retrospective placeholder).
3. `feature` and `bug` skills.
4. `CLAUDE.md` bullet. (Factory files: the orchestrator reviews the diff before gate 2.)
5. `check-structure` rule 4 and header comment; run `npm run check:structure` on the real repo (must stay ok), then the dry runs below.
6. `npx prettier --write` on every touched markdown file; `npm run verify`.

### Test set (all by dry run; no committed test file, because scripts have no test setup and the process ACs show on story 013)

| AC      | How the tester verifies now                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC1-AC3 | Read both skills' retro step against the format; then the check-structure dry run (below): a filled example cost table incl. a `n/a` run row, a resumed row (round 2) and an orchestrator row is accepted; planted: wrong header, no total row, total that includes an orchestrator estimate, orchestrator row with a bare number, missing Cost heading are each rejected with a message.                                                                                |
| AC4-AC5 | Apply the checklist to an existing diff: `git diff main...feature/010-...` is not available after merge, so use `git diff d855974^..d855974` (story 011) or `ff36315^..b0579df` (story 010): fill the 24-row table in a scratch file, confirm every id has a result, every `n.a.` has a reason that matches its condition, and that a finding outside the list still has a place. Plus: file exists, `Version:` within the first 10 lines, `reviewer.md` names the path. |
| AC6     | Read the skill text of both skills; produce a German explanation of story 011 or 010 from its story and diff following the outline and check: at most 15 lines, no code or file names.                                                                                                                                                                                                                                                                                   |
| AC7     | `grep -n '^## ' docs/templates/story.md` shows Review, Explanation, Retrospective in that order; the dry-run story with the heading passes, one without it and one with the placeholder only are rejected.                                                                                                                                                                                                                                                               |

Dry run (outside the repo, the script's ROOT is its parent directory): in the scratchpad copy `scripts/check-structure.mjs`, create `docs/backlog/README.md` with an index row per scratch story and stories `013-ok.md` (valid), `014-no-cost.md`, `015-empty-explanation.md`, `016-long-explanation.md` (16 lines), `017-wrong-order.md`, `018-in-review.md` (status `in-review`, nothing filled: must pass), `012-exempt.md` (done, nothing filled: must pass). Expected: `013`, `018`, `012` pass; each planted story yields exactly its own message. Also `npm run check:structure` on the real repo stays ok. Keep the scratch files out of the repo; list the cases and outcomes in the Test report.

## Implementation notes

_developer: what was built, deviations from the design and why._

Implemented by `devops` across roles (factory files have no other owner, CLAUDE.md "Factory files"); recorded here as the design asks.

- Built as designed: `.claude/agents/reviewer-checklist.md` (Version 1, 24 items C1-C6, S1-S5, T1-T4, K1-K5, A1-A4, wording as in the design, grouped under headings), `reviewer.md` (steps 4 and 5, verdict line), `docs/templates/story.md` (Explanation heading; Retrospective placeholder mentions the `### Cost` table), both skills (Explanation step, Cost table in the retro step, German explanation first at the gate, renumbering, running-list note in `feature`), the CLAUDE.md "Story record" bullet, `scripts/check-structure.mjs` rule 4 (about 90 lines after Prettier, small functions, no new module).
- R1 (loader risk) checked: a scratch project with a frontmatter-less `.md` next to a valid agent file, started with `claude -p ... --output-format stream-json --verbose --debug-file`: the init event lists only the valid agent (no phantom agent), and the debug log has no warning or error about the file. AC5 path stays.
- Deviations: none in behaviour. The cost-table rules are written into the `feature` retro step in full; `bug` refers to it. Rule 4 counts a non-integer Tokens cell as 0 in the total comparison, so one bad cell also yields a second "total" message.
- Dry run of rule 4 on a scratch copy (outside the repo): 013 valid, 012 exempt, 018 in-review and 023 (orchestrator estimate, total not including it) pass; 014 (no Cost heading), 015 (placeholder only), 016 (16 lines), 017 (wrong order), 019 (wrong header), 020 (no total), 021 (estimate summed into the total), 022 (bare number in the orchestrator row), 024 (wrong total), 025 (no orchestrator row), 026 (`41,200`) each yield their own message. `npm run check:structure` on the real repo: ok.

Follow-up after the test report (minor defects, fixed in place, checklist stays Version 1 because it is new in this story): rule 4 now compares the total's Tokens, Tool uses and Duration with the exact sums (the figure alone; Tokens may be followed by a note after a space), so 10 times the sum no longer passes, and requires the orchestrator row after the total. Re-probed on a scratch copy: x10 total, wrong Tool uses total, wrong Duration totals and orchestrator-before-total are each rejected; a valid table and a Tokens total with a trailing note pass. Checklist wording changed for S1, S5, A1 and C6; `feature` Gate 2 says hak's corrections go into the English Explanation at once (also in `bug`); wraps in both skills tidied.

### Review round 1 follow-up

- Finding 1: `check-structure` rule 4 finds `### Cost` and the table rows in the code-stripped text (same line indices), so a fenced example table before the real one is ignored.
- Finding 2: `*` and `_` are stripped from the first cell before matching the total and orchestrator labels; the error messages name the expected label.
- Finding 3: letters dropped from the checklist group headings (ids unchanged, Version 1 edited in place).
- Finding 4: the CLAUDE.md process diagram shows the explanation step between tech-writer and retro.
- Probes on a scratch copy: a retro with a fenced example table before a valid table passes; a retro with only a fenced table fails with "no ### Cost"; a bold `**total (measured)**` row passes.

## Test report

_tester: AC → test mapping, results, defects found._

All by dry run, as the Technical design's test set says; no test file added (0 tests). Scratch material (outside the repo): `/private/tmp/claude-501/-Users-haraldkuegel-swfactory/b6ad74d5-b7e6-4d4e-b781-9f99c3559d23/scratchpad/r012/` (`gen.py` builds 31 scratch stories, `expl-en.md`, `expl-de.md`).

| AC  | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Result |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| AC1 | `feature` retro step specifies the `### Cost` table: exact header, one row per run in chronological order, Round/Model/Tokens/Tool uses/Duration sources, `total (measured)`; `bug` refers to it. Filled from the real figures of this story (product-owner sonnet 32351/13/0:48, product-owner haiku 35706/8/0:34, architect 59885/10/2:12, devops 57654/17/2:16 → total 185596 / 48 / 5:50, orchestrator row "not measured"): rule 4 accepts it. Plus n/a row, `h:mm:ss`, total with a note, upper-case header: accepted. Wrong header, no total, wrong total, `41,200`, `2min`, heading without table: each rejected with its own message. | PASS   |
| AC2 | Orchestrator row last, "not measured" or "estimate: ~N", never summed (skill text). Rule 4: estimate row with total excluding it accepted; total including it (275596) rejected; numeric orchestrator cell rejected; missing orchestrator row rejected.                                                                                                                                                                                                                                                                                                                                                                                       | PASS   |
| AC3 | Skill: missing figure or unclear cumulative figure → `n/a`, never inferred. Rule 4: row with `n/a` cells accepted and excluded from the sum; all rows n/a with total `n/a` accepted.                                                                                                                                                                                                                                                                                                                                                                                                                                                          | PASS   |
| AC4 | Checklist v1 applied to story 010 (`ff36315^..b0579df`), table below: all 24 ids decidable to a result; 5 items have a loosely worded condition (see "Ambiguous items"). `reviewer.md` step 4/5 require every id with pass/fail/n.a., the reason for n.a., the finding number for fail, and the version in the header; the format example is in the file.                                                                                                                                                                                                                                                                                     | PASS   |
| AC5 | `.claude/agents/reviewer-checklist.md` exists, `Version: 1` on line 3, 24 items (C1-C6, S1-S5, T1-T4, K1-K5, A1-A4), `Changes` section; `reviewer.md` names the path and says findings beyond the checklist are still allowed with severity. No phantom agent (devops checked R1; not repeated).                                                                                                                                                                                                                                                                                                                                              | PASS   |
| AC6 | Both skills' gate step: German translation of the Explanation, same content, at most 15 lines, before the AC table. A German explanation of story 010 written from story and diff following the skills' wording: 7 lines, no code or file names; the instructions were enough.                                                                                                                                                                                                                                                                                                                                                                | PASS   |
| AC7 | `grep '^## ' docs/templates/story.md`: Review, Explanation, Retrospective in this order. Rule 4: story without the heading, placeholder only, empty, comment only, wrong order (two variants) rejected; 15 lines accepted, 16 rejected; the English text of the story-010 dry run (7 lines) accepted.                                                                                                                                                                                                                                                                                                                                         | PASS   |

Rule 4 dry run (31 scratch stories, script copy outside the repo; the real repo `npm run check:structure` is ok):

- Accepted (expected): done 013 valid, 014 with an n/a run row, 015 with an orchestrator estimate, 016 all n/a, 017 `h:mm:ss`, 025 15-line Explanation, 040 total with a note, 041 mixed-case header; exempt: 011 and 012 (done, nothing filled), 018 (`in-review`, nothing filled).
- Rejected with their own message: 020 no Cost heading, 021 no Explanation heading, 022 placeholder only, 023 empty, 039 comment only, 024 16 lines, 026 and 027 wrong order, 028 wrong total, 029 estimate summed, 030 numeric orchestrator, 031 no total, 032 no orchestrator row, 033 wrong header, 034 `41,200` (plus a second "total" message, as the notes say), 037 bad duration, 038 heading without table.
- Not rejected although the design says so or implies it (defects 1 and 2 below): 013 with total `1855960`; 035 orchestrator row before the total row; 036 total row with wrong Tool uses and Duration.

Checklist v1 applied to story 010 (scratch):

| Item | Result | Note                                                                                                              |
| ---- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| C1   | pass   | AC1-AC5 traced to the lifecycle, no-replay, reduced-motion, flash and `measure:fps` tests in the story's test set |
| C2   | n.a.   | no network call or pending-UI await in the diff                                                                   |
| C3   | n.a.   | no `.tsx` or hook changed; the scene is imperative                                                                |
| C4   | pass   | static drawing when `reducedMotion` or inactive (`finishEffects`), effects disposed on re-attach                  |
| C5   | n.a.   | no reducer in the diff (the plan takes a seed)                                                                    |
| C6   | pass   | `try/catch` around effect update and dispose with logging                                                         |
| S1   | n.a.?  | no DOM input or HTML sink; WebGL "rendering code" changed, see ambiguity 1                                        |
| S2   | n.a.   | no config, env or auth code                                                                                       |
| S3   | n.a.   | no `package.json` change                                                                                          |
| S4   | pass   | `fxState` probe added to the app's `dist-check.json`; dist check green                                            |
| S5   | pass?  | `measure-fps.mjs` (app script) and `check-structure.mjs` changed, run by hand; see ambiguity 2                    |
| T1   | pass   | reviewer runs `npm run verify` (not run at the old commit in this dry run)                                        |
| T2   | pass   | one e2e test per AC; unit tests for the plan and timeline                                                         |
| T3   | pass   | pixel counts against token colours, strobe self-test                                                              |
| T4   | pass   | probe paused before clicks, tests named AC1..AC5                                                                  |
| K1   | pass   | design and notes agree                                                                                            |
| K2   | pass   | no `any`, no `!` without comment                                                                                  |
| K3   | pass   | tokens only, new colours in `tokens.css`                                                                          |
| K4   | pass   | `check:structure` green                                                                                           |
| K5   | pass   | status, index, README, CHANGELOG, prettier                                                                        |
| A1   | n.a.?  | no control added, but UI did change; see ambiguity 3                                                              |
| A2   | pass   | effect colours decoration only, final board keeps cues; contrast on rendered pixels                               |
| A3   | pass   | reduced motion honoured; no live region changed                                                                   |
| A4   | pass   | no per-frame allocation, dispose counted                                                                          |

Ambiguous checklist items (decidable only by a judgement call; wording to tighten at the next version bump):

1. **S1** "n.a. when no input or rendering code changed": "rendering" can mean WebGL drawing or DOM rendering. Say "DOM, URL or query sinks".
2. **S5** "(`templates/app`, scripts)": root `scripts/` or any `*.mjs` in an app? Name the paths.
3. **A1** "n.a. when no UI changed": a canvas effect is UI but has no controls; say "no control, focus or label changed".
4. **C6** "n.a. when no error handling or I/O": is a new `try/catch` for decoration "error handling"? Probably yes (pass), but a diff that only passes errors through is unclear.
5. **T2** "no AC tested at several levels": the cheapest-level judgement (the design lets a unit test back an e2e test of the same AC when logic branches) has no objective test; the same holds for **K1** "speculative abstraction".
6. **T1** needs the reviewer to run `verify`; a dry run on an old commit cannot (not an item defect).

Also unclear for AC6/AC7: "at most 15 lines" is counted in physical lines by rule 4, but the German gate text and a hard-wrapped English text have no common line measure, so seven very long lines pass. Say "at most 15 lines of at most 100 characters" or "at most 15 sentences".

**Defects (both minor, nothing blocks the ACs):**

1. Total check uses `startsWith`: a total `1855960` (10 times the sum) or `18559600` passes, because the design allows a trailing note. Repro: scratch story `013-ok` with total Tokens `1855960` → no message. Fix: match `^<sum>(\s|$)`.
2. Rule 4 does not check the total's Tool uses and Duration, nor that the orchestrator row comes after the total (design: "last and after the total"). Repro: scratch stories 035 (orchestrator row first) and 036 (total `999` tool uses, `99:99`) → accepted. Fix: either check them or drop the claim from the skill text; the AC text only needs the Tokens sum.
3. Cosmetic: `bug/SKILL.md` step 8 has a line starting `(measured)`,`at column 0. It is a valid lazy continuation of the list paragraph and the code span`total (measured)`spans the line break, so it renders correctly (Prettier parses it as one paragraph; no Markdown renderer was installed to confirm visually). Step 9 and`feature` step 10 contain a short line / a long line left by the edit; harmless.
4. Not a defect, a gap: the `feature` skill does not say that hak's corrections at the gate are applied to the English Explanation at once (the design says so).

`npm run verify`: green (exit 0, check:structure ok, check:dist ok).

## Review

**Round 1, reviewer 2026-11-04. Verdict: APPROVED. Checklist version: 1**

| Item | Result | Note                                                                                                                                                                       |
| ---- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1   | pass   | AC1-AC7 traced to skill text, template, rule 4 and checklist file; the ACs show on story 013, not here (exempt per Decision log); no code path beyond rule 4               |
| C2   | n.a.   | no network call or pending state in the diff                                                                                                                               |
| C3   | n.a.   | no hook or component changed                                                                                                                                               |
| C4   | n.a.   | no render loop or imperative controller changed                                                                                                                            |
| C5   | n.a.   | no reducer changed                                                                                                                                                         |
| C6   | pass   | rule 4 reports every violation via `report(...)` with file and line, no swallowed errors; early `return` after a structural failure is deliberate                          |
| S1   | n.a.   | no DOM, URL or query sink; rule 4 only reads local markdown                                                                                                                |
| S2   | n.a.   | no config, env or auth code                                                                                                                                                |
| S3   | n.a.   | no `package.json` change                                                                                                                                                   |
| S4   | n.a.   | no dev-only code added                                                                                                                                                     |
| S5   | pass   | `scripts/check-structure.mjs` changed: `npm run verify` green, plus my own probe on a scratch copy (valid table, fenced `### Cost`, bold total, `00:30`), see findings 1-2 |
| T1   | pass   | `npm run verify` run by me: green (check:structure ok, check:dist ok)                                                                                                      |
| T2   | n.a.   | no test file changed (dry runs by design, see item note under "Hard to decide")                                                                                            |
| T3   | n.a.   | no test file changed                                                                                                                                                       |
| T4   | n.a.   | no e2e spec changed                                                                                                                                                        |
| K1   | pass   | design and Implementation notes agree; follow-up (exact sums, orchestrator after total) is in the notes; no app names, no dead code; rule 4 is one function plus helpers   |
| K2   | n.a.   | no TypeScript changed (`.mjs` only)                                                                                                                                        |
| K3   | n.a.   | no CSS changed                                                                                                                                                             |
| K4   | pass   | factory files name no app (`check:structure` green); only the 10 files named in the design changed, plus tester/architect memory lines                                     |
| K5   | pass   | status `in-review`, index row `in-review`, Decision log complete, CLAUDE.md bullet added, CHANGELOG/README not needed (no user-visible change); prettier green in verify   |
| A1   | n.a.   | no UI                                                                                                                                                                      |
| A2   | n.a.   | no UI or colour                                                                                                                                                            |
| A3   | n.a.   | no UI, animation or announcement                                                                                                                                           |
| A4   | n.a.   | no render loop or canvas                                                                                                                                                   |

Findings:

1. `[minor] scripts/check-structure.mjs:~255 (costAt = lines.findIndex(l => l.trim() === '### Cost'))` - the heading is searched in the raw Retrospective, so a `### Cost` inside a code fence (e.g. a retro that quotes the table format, as this story's own design does) is taken as the real one. Probe: a story with a fenced example before the real table gets "needs exactly one total row (found 0)", although the real table is valid. Fix: search the stripped text at the same offsets (`stripCode` keeps lengths), as is already done for the section headings.
2. `[nit] scripts/check-structure.mjs:isTotal/isOrchestrator` - a bold first cell (`**total (measured)**`) is not recognised and is reported as a run row with "six non-empty cells", which misleads. Fix: strip `*` and `_` from the first cell before matching, or name the exact expected label in the message.
3. `[nit] .claude/agents/reviewer-checklist.md:11-48` - the group headings are lettered A-E, but item ids use other letters (group "A. Correctness" holds C items, "C. Tests" holds T items, "A1" lives in group E). Drop the letters from the headings (a table row in a story says "A1", the reader will look under "A").
4. `[nit] CLAUDE.md` process diagram - it still goes `tech-writer -> retro -> GATE 2`; the new Explanation step (after docs, before retro) is not shown. Add it, or the diagram and both skills disagree.
5. `[nit] .claude/agents/reviewer-checklist.md` - gaps against CLAUDE.md: "Workspace tooling" (prettier `--ignore-path`, `tsconfig.app.json` include of `vite-env.d.ts`), `.env.example` for new per-developer values, "function components and hooks only" are not covered by any item. Not blocking; consider for version 2 (K2 and S2 are the natural places).
6. `[nit] scripts/check-structure.mjs` (`MAX_EXPLANATION_LINES`) - counts physical lines, so hard-wrapped or very long lines pass or fail inconsistently (tester's note). Accepted for version 1; the sentence limit in the skills is the real control.

Checked, OK: section detection ignores `## Explanation` inside code fences and inline code; exemption (`id <= 12`, `status != done`) uses the id from the file name and the first `status:` line, which also copes with the template's `# draft | ...` comment; `00:30` and `h:mm:ss` accepted; both skills renumber consistently (feature 1-10, bug 1-9), no stale step references elsewhere; no app names in any factory file; `reviewer.md` step 4/5 and the verdict line match AC4 and AC5; the `reviewer-checklist.md` loader risk (R1) was checked by devops.

Hard to decide in the checklist (first real use):

- **C1** "name the code path and the test": for a process story there is no code path and the ACs are only observable on the next story; I passed it with that caveat. Suggest "n.a. never; for process-only stories name the file and text that implements the AC".
- **K5** bundles six checks (status, index, Decision log, README/CHANGELOG, prettier, ...) in one result; a partial failure has no clean result. Consider splitting.
- **T2/T3** are `n.a.` when no test changed, but a diff that adds logic with branches and no test at all (here rule 4, by design decision) has no item that catches it. Suggest a T-item "new logic with branches has a test or a recorded reason".
- **S5** `pass` needed my own probe because verify does not exercise rule 4's failure paths; the item allows "run by hand" but does not say what counts as sufficient.
- **K4** "n.a. when no platform or factory file changed" is clear, but the first clause ("name and import no app") overlaps with S5 for scripts; no double reporting occurred.
- **K1** "speculative abstraction" has no objective test (tester's note); no problem found here.

## Explanation

How it works: every story now ends with three extra things for hak. The retro lists what each agent run cost (model,
tokens, tool calls, time); the reviewer ticks off a fixed checklist of 24 points instead of reviewing freely; and
before the gate hak gets a short plain-language explanation, in German, of what was built.
What changed: the reviewer works through a versioned checklist and reports every point as pass, fail or not
applicable; the story template has an Explanation section; the feature and bug workflows record costs after every
agent run and show the explanation first at the final gate; the structure check rejects a finished story from 013 on
that lacks a correct cost table or an explanation.
Risks: token figures for a resumed agent are unclear (it seems to count its whole previous context), so those cells
say n/a; the orchestrator's own share of the work is not measured at all; a fixed checklist can turn into box-ticking,
so findings outside it stay allowed and the list changes only through approved retros.
Not verified: the new rules only take effect on story 013, so they were tested with dry runs (a filled cost table, the
checklist applied to story 010, a sample explanation), not on a real finished story; the 15-line limit counts physical
lines, not length.

## Retrospective

_orchestrator, 2026-11-04._

Went well: a small, process-only story ran through all roles in about an hour of agent time; the tester and the reviewer each found real defects in the new check script (a loose total match, a fenced example table taken for the real one) before it could misfire on story 013; the checklist was used for real in this story's own review.

### What went wrong

| #   | Problem                                                                                                                                       | Root cause                                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| P1  | The first version of the check script accepted ten times the real total and ignored tool-use and duration totals; a fenced example broke it.  | The design named the rule's checks but not the near misses (loose matches, unchecked columns, code fences). |
| P2  | A resumed agent reported more tokens for 4 tool calls than its first run for 17, so its figure is probably cumulative.                        | The completion data of a resumed agent is not documented; the design had foreseen it and wrote `n/a`.       |
| P3  | The reviewer found six checklist items hard to decide (C1 for process stories, K5 bundles six checks, no item for new untested branch logic). | Version 1 was derived from rules, not from use; this was its first real review.                             |

### Proposed changes

1. **Reviewer checklist version 2 (P3; reviewer's and tester's notes):** C1 gets a process-story variant ("name the file and text that implements the AC"); K5 is split into its separate checks; new item T5 "new logic with branches has a test or a recorded reason"; S5 says what a sufficient hand run is (each failure path of a new check probed once); new items for the "Workspace tooling" rule and `.env.example`.
2. **`feature` skill, cost table (P2):** prefer a fresh agent over resuming one when the remaining work is small and self-contained, so its cost is measurable; a resumed run's tokens are always `n/a`, its tool uses and duration are kept.
3. **`architect` (P1):** when a design adds a check or validation script, list its near misses to probe (loose matches, unchecked columns, code fences or quoting, formatting variants).
4. **Explanation length (tester's and reviewer's note):** "at most 15 lines" becomes "at most 15 lines of at most 120 characters" in the template, the skills and check-structure.

### Cost

| Role                        | Round | Model  | Tokens       | Tool uses | Duration |
| --------------------------- | ----- | ------ | ------------ | --------- | -------- |
| product-owner               | 1     | sonnet | 32351        | 13        | 0:48     |
| product-owner               | 2     | haiku  | 35706        | 8         | 0:34     |
| architect                   | 1     | sonnet | 59885        | 10        | 2:12     |
| devops                      | 1     | sonnet | 57654        | 17        | 2:16     |
| tester                      | 1     | sonnet | 74140        | 18        | 2:29     |
| devops                      | 2     | sonnet | n/a          | 4         | 0:45     |
| reviewer                    | 1     | sonnet | 62093        | 12        | 1:38     |
| tech-writer                 | 1     | haiku  | 53416        | 12        | 0:26     |
| devops                      | 3     | sonnet | 31098        | 10        | 0:55     |
| total (measured)            |       |        | 406343       | 104       | 12:03    |
| orchestrator (main session) |       | opus   | not measured |           |          |

Devops round 2 was a resumed agent; it reported 64280 tokens for 4 tool calls, which looks cumulative, so the cell says n/a (P2).

### Outcome

hak approved all four proposals at gate 2 ("Ja, alles", 2026-11-04). Applied: 1 as
reviewer checklist version 2; 2 in the `feature` and `bug` skills; 3 in
`.claude/agents/architect.md`; 4 in the story template, both skills, `CLAUDE.md` and
check-structure rule 4 (this story's Explanation rewrapped to match).
