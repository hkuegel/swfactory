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

**Model economy:** pass `model: haiku` for regression runs of the `tester` and for
small doc edits (Decision log entries, status changes, index rows). For follow-ups
within the same story (review fixes, answers to questions), resume the agent with
SendMessage instead of starting a new one — it keeps its context. But when the remaining
work is small and self-contained, prefer a fresh agent: its cost is then measurable (a
resumed run's tokens are always `n/a`; its tool uses and duration are kept).
After every agent completion, note role, round, model, tokens, tool uses and duration
for the cost table (retro step).

**Formatting:** `product-owner`, `ux-designer` and `tech-writer` have no shell. After
every step in which one of them edited markdown, run
`npx prettier --write docs apps/*/docs README.md CHANGELOG.md apps/*/README.md` yourself
(`npm run verify` checks markdown too). Never format a file while another agent is still editing it.
Before the review step, run prettier and `npm run check:structure` on the story and the backlog index, so housekeeping (story formatting, the index row matching the story status) does not become a review finding. When a role's run ends with no reply, read the story section that role owns before re-running it: the work is usually already on disk and only the reply was lost.

1. **Story** — `product-owner`: turn the idea into a story in the backlog of the platform
   (`docs/backlog/`) or of an app (`apps/<name>/docs/backlog/`; the story's `app:` field).
   Pass hak's request **verbatim** (the full text above) so it lands in "Original request",
   and say which one it is. If the idea doesn't make it obvious, ask hak first: the
   platform (sign-in, shell, tokens, tooling) or which app?
   If hak's request or answers involve confidential material, tell the `product-owner` up
   front which terms must not be written down.
   If the idea refers to real-world rules (a law, a product, a standard), research the primary
   sources first and pass them to `product-owner`; the story's Context cites them. For a
   third-party service (hosting, sign-in, analytics), the research also covers its terms of use
   and the legal duties it brings for a public site (e.g. Impressum, privacy statement, data sent
   to third parties), and hak sees them before a recommendation.
2. **GATE 1** — show hak the user story, ACs and open questions. Wait for approval or
   answers. Send every answer or correction back to `product-owner`, telling it to
   update the story **and** the Decision log. Continue only on an explicit go.
   **Feasibility check:** if an answer or proposed default touches technical
   constraints (storage, backend, sessions, security, third-party capabilities), ask
   the `architect` for a short feasibility check of the affected ACs **before** they are
   final, and show hak the result at the gate.
   Then, on `main` with a clean tree, commit the story and backlog index:
   `docs(backlog): add story NNN – <title>`. Then create the branch `feature/NNN-slug`.
3. **Design** — `architect`: technical design (+ ADRs). If the story has UI, run
   `ux-designer` too: in parallel only for pure UI stories; if the story depends on an
   external integration or platform limits (identity providers, third-party widgets,
   browser APIs), run the `architect` first and the `ux-designer` afterwards on the
   finished design. When both ran in parallel, compare the two sections for
   contradictions (a rule in one that the other breaks) before the build and have the
   `architect` resolve them, ADRs included. If the architect sets `status: blocked`, bring the open questions
   to hak and log the answers as in step 2.
4. **Build** — `developer`: implement on branch `feature/NNN-slug` until
   `npm run verify` is green.
5. **Test** — `tester`: verify all ACs. On FAIL, send the defects to `developer`, then
   re-run `tester`.
6. **Review** — `reviewer`. On CHANGES_REQUESTED, send the findings to `developer`,
   then `tester` (regression), then `reviewer` again. After 3 rounds without approval,
   stop and escalate to hak with a summary of the disagreement.
7. **Docs** — `tech-writer`: CHANGELOG/README.
8. **Explanation** — write the story's "Explanation" section yourself (English, at most
   15 lines of at most 120 characters: how it works, what changed, main risks, what was not verified; plain
   language, no code or file names) from the story, the test report and the diff
   (`git diff main...HEAD --stat`).
9. **Retro** — write the story's "Retrospective" section yourself:
   - what went wrong: review rounds and their findings, test defects, corrections
     hak made at the gates, steps that had to be repeated;
   - root cause per problem (unclear AC? missing convention? agent ignored a rule?);
   - **proposed changes** as concrete edits: to an agent file in `.claude/agents/`,
     to `CLAUDE.md`, or to a template — plus the agents' "Suggested for CLAUDE.md" items;
   - glance at `.claude/agent-memory/*/MEMORY.md` diffs from this story and flag
     lessons that look wrong or belong in `CLAUDE.md` instead;
   - if nothing went wrong, say so in one line and propose nothing;
   - append a `### Cost` table, one row per agent run in chronological order, with
     exactly this header: `| Role | Round | Model | Tokens | Tool uses | Duration |`.
     Role = agent name; Round = ordinal of that agent's run in this story (a run resumed
     with SendMessage, or resumed after a usage-limit interruption, is a new row with the
     next number); Model = the model the run used (the `model:` override of the Agent
     call, else the agent file's); Tokens = the `subagent_tokens` figure of the completion
     data as an integer without separators; Tool uses = its tool-use count; Duration =
     `m:ss` (`h:mm:ss` over an hour). Copy the figures from the running list you kept;
     never reconstruct them afterwards. If a figure is missing, or it is unclear whether
     a resumed run's figure is cumulative, write `n/a` in that cell (a resumed run's tokens
     are always `n/a`; keep its tool uses and duration); never infer or
     estimate a subagent row. Then one row `total (measured)`: the sum of the integer
     cells per column (n/a cells skipped; Duration is agent time, not wall-clock). Last,
     after the total and never summed, the row `orchestrator (main session)`: Tokens
     `not measured` (or `estimate: ~NNNN` when a figure exists), Tool uses and Duration
     `n/a`, Model = the main session's model or `n/a`. The text under the table may note
     when one role stands out; there are no thresholds or budgets.
10. **GATE 2** — present to hak first the same explanation as in the story's
    "Explanation", in German (a translation, same content, at most 15 lines of at most 120 characters), before the
    AC table; apply hak's corrections to the English Explanation at once. Then present:
    story path, branch, files changed, AC/test table, review verdict, the retro
    proposals, and every open manual check (real devices, real third-party services)
    that no agent could run. Ask which proposals to apply, whether hak runs or waives
    each manual check, and whether to commit. Record the manual-check results in the
    Test report. For visual stories, check that `screenshots/NNN/` exists and show hak
    the key states for sign-off. Apply only approved proposals (record the outcome in
    the Retrospective section), set the story `status: done`, update the backlog index,
    then commit on the story branch — code, story, memory and agent changes together.
    Never push or merge without a separate go.
