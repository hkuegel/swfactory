---
name: bug
description: Fix a bug through the factory - record it, reproduce it with a failing test, fix, verify and review.
argument-hint: <bug description>
disable-model-invocation: true
---

# Bug pipeline

Bug: $ARGUMENTS

You are the **orchestrator**; delegate each step with the Agent tool.

1. **Record** — `product-owner`: create a story with `type: bug` and branch
   `fix/NNN-slug`; ACs describe the correct behaviour, context holds the observed
   behaviour and repro steps. If the repro is unclear, ask hak before going on.
2. **Reproduce** — `tester`: write the smallest failing test for the bug and confirm it
   fails for the right reason. If it can't be reproduced, stop and report to hak.
3. **Fix** — `developer`: make the failing test pass with the smallest correct change;
   `npm run verify` green. (Call `architect` first only if the fix needs a design change.)
4. **Verify** — `tester`: re-run, add regression tests for related edge cases.
5. **Review** — `reviewer`; loop back to `developer` on CHANGES_REQUESTED (max 3 rounds).
6. **Docs** — `tech-writer`: CHANGELOG entry under "Fixed".
7. **GATE** — present the result to hak and ask before committing. Never push or merge
   without a separate go.
