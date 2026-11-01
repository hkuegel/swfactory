---
name: feature
description: Run the full software-factory pipeline for a new feature - story, design, implementation, test, review, docs, retro - by delegating to the role agents.
argument-hint: <feature idea>
disable-model-invocation: true
---

# Feature pipeline

Feature idea: $ARGUMENTS

You are the **orchestrator**. Delegate every step to the named subagent with the Agent
tool, passing the story path and what you expect back. Don't do the roles' work
yourself. Track the steps with the task list. After each step, read the story file to
confirm the agent did its part before moving on. Collect every "Suggested for
CLAUDE.md" item the agents return — you need them in the retro.

1. **Story** — `product-owner`: turn the idea into a story in `docs/backlog/`. Pass
   hak's request **verbatim** (the full text above) so it lands in "Original request".
2. **GATE 1** — show hak the user story, ACs and open questions. Wait for approval or
   answers. Send every answer or correction back to `product-owner`, telling it to
   update the story **and** the Decision log. Continue only on an explicit go.
   Then, on `main` with a clean tree, commit the story and backlog index:
   `docs(backlog): add story NNN – <title>`. Then create the branch `feature/NNN-slug`.
3. **Design** — `architect`: technical design (+ ADRs). If the story has UI, run
   `ux-designer` too (both can run in parallel). If the architect sets
   `status: blocked`, bring the open questions to hak and log the answers as in step 2.
4. **Build** — `developer`: implement on branch `feature/NNN-slug` until
   `npm run verify` is green.
5. **Test** — `tester`: verify all ACs. On FAIL, send the defects to `developer`, then
   re-run `tester`.
6. **Review** — `reviewer`. On CHANGES_REQUESTED, send the findings to `developer`,
   then `tester` (regression), then `reviewer` again. After 3 rounds without approval,
   stop and escalate to hak with a summary of the disagreement.
7. **Docs** — `tech-writer`: CHANGELOG/README.
8. **Retro** — write the story's "Retrospective" section yourself:
   - what went wrong: review rounds and their findings, test defects, corrections
     hak made at the gates, steps that had to be repeated;
   - root cause per problem (unclear AC? missing convention? agent ignored a rule?);
   - **proposed changes** as concrete edits: to an agent file in `.claude/agents/`,
     to `CLAUDE.md`, or to a template — plus the agents' "Suggested for CLAUDE.md" items;
   - glance at `.claude/agent-memory/*/MEMORY.md` diffs from this story and flag
     lessons that look wrong or belong in `CLAUDE.md` instead;
   - if nothing went wrong, say so in one line and propose nothing.
9. **GATE 2** — present to hak: story path, branch, files changed, AC/test table,
   review verdict, and the retro proposals. Ask which proposals to apply and whether
   to commit. Apply only approved proposals (record the outcome in the Retrospective
   section), set the story `status: done`, update the backlog index, then commit on the
   story branch — code, story, memory and agent changes together. Never push or merge
   without a separate go.
