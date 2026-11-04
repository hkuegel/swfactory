---
name: bug
description: Fix a bug through the factory - record it, reproduce it with a failing test, fix, verify, review and run a short retro.
argument-hint: <bug description>
disable-model-invocation: true
---

# Bug pipeline

Bug: $ARGUMENTS

You are the **orchestrator**; delegate each step with the Agent tool.

**Formatting:** `product-owner` and `tech-writer` have no shell. After every step in
which one of them edited markdown, run
`npx prettier --write docs apps/*/docs README.md CHANGELOG.md apps/*/README.md` yourself
(`npm run verify` checks markdown too).

1. **Record** — `product-owner`: create a story (in the backlog of the platform or the
   affected app) with `type: bug` and branch `fix/NNN-slug`; pass the bug description **verbatim** for "Original request". ACs
   describe the correct behaviour, context holds the observed behaviour and repro
   steps; if the bug contradicts an existing story, link it via `changes:`. If the
   repro is unclear, ask hak and log the answer in the Decision log.
   Commit the story on `main` (`docs(backlog): add bug NNN – <title>`), then create
   the branch.
2. **Reproduce** — `tester`: write the smallest failing test for the bug and confirm it
   fails for the right reason. If it can't be reproduced, stop and report to hak.
3. **Fix** — `developer`: make the failing test pass with the smallest correct change;
   `npm run verify` green. (Call `architect` first only if the fix needs a design change.)
4. **Verify** — `tester`: re-run, add regression tests for related edge cases.
5. **Review** — `reviewer`; loop back to `developer` on CHANGES_REQUESTED (max 3 rounds).
6. **Docs** — `tech-writer`: CHANGELOG entry under "Fixed".
7. **Explanation** — write the story's "Explanation" section yourself (English, at most
   15 lines of at most 120 characters: what was wrong, what the fix changes, main risk, what was not verified;
   plain language, no code or file names) from the story, the test report and the diff.
8. **Retro** — in the story's "Retrospective": why did the bug get through? Which
   story, AC, test or review step should have caught it? Propose concrete edits to
   agents, `CLAUDE.md` or templates so it can't happen again. Append a `### Cost`
   table: the same table as in the `/feature` retro step (one row per agent run, a
   `total (measured)` row, an `orchestrator (main session)` row; `n/a` for missing
   figures; a resumed run's tokens are always `n/a`, tool uses and duration are kept;
   prefer a fresh agent over resuming one when the remaining work is small and
   self-contained). Note role, round, model, tokens, tool uses and duration after every agent
   completion.
9. **GATE** — present first the same explanation as in the story's "Explanation", in
   German (same content, at most 15 lines of at most 120 characters), then the result and the retro proposals to
   hak. Apply hak's corrections to the English Explanation at once. Apply only approved
   proposals, set `status: done`, and ask before committing. Never push or merge
   without a separate go.
