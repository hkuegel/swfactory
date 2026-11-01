---
name: feature
description: Run the full software-factory pipeline for a new feature - story, design, implementation, test, review, docs - by delegating to the role agents.
argument-hint: <feature idea>
disable-model-invocation: true
---

# Feature pipeline

Feature idea: $ARGUMENTS

You are the **orchestrator**. Delegate every step to the named subagent with the Agent
tool, passing the story path and what you expect back. Don't do the roles' work
yourself. Track the steps with the task list. After each step, read the story file to
confirm the agent did its part before moving on.

1. **Story** — `product-owner`: turn the idea into a story in `docs/backlog/`.
2. **GATE 1** — show hak the user story, ACs and open questions. Wait for approval or
   answers; send changes back to `product-owner`. Continue only on an explicit go.
3. **Design** — `architect`: technical design (+ ADRs). If the story has UI, run
   `ux-designer` too (both can run in parallel). If the architect sets
   `status: blocked`, bring the open questions to hak.
4. **Build** — `developer`: implement on branch `feature/NNN-slug` until
   `npm run verify` is green.
5. **Test** — `tester`: verify all ACs. On FAIL, send the defects to `developer`, then
   re-run `tester`.
6. **Review** — `reviewer`. On CHANGES_REQUESTED, send the findings to `developer`,
   then `tester` (regression), then `reviewer` again. After 3 rounds without approval,
   stop and escalate to hak with a summary of the disagreement.
7. **Docs** — `tech-writer`: CHANGELOG/README.
8. **GATE 2** — present to hak: story path, branch, files changed, AC/test table,
   review verdict. Ask whether to commit. Only after approval: commit on the story branch
   and set the story `status: done`. Never push or merge without a separate go.
