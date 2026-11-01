---
name: rebuild
description: Regenerate the app from the backlog - replay all done stories in order on a fresh branch, starting from the scaffold, and check the result against the original end-to-end tests.
argument-hint: '[up-to NNN] [stack: <changes>]'
disable-model-invocation: true
---

# Rebuild from the backlog

Arguments: $ARGUMENTS

You are the **orchestrator**. The story files in `docs/backlog/` are the specification;
the app is regenerated from them. The result won't be identical code — the goal is the
**same behaviour**, proven by the original end-to-end tests.

## 1. Plan and confirm

1. Require a clean working tree on `main`; otherwise stop and tell hak.
2. Build the replay list: all stories with `status: done`, sorted by id, skipping those
   with `status: superseded`. Stop at `up-to NNN` if given. Stories with `changes:`
   stay in order — they modify what earlier stories built.
3. Show hak the list, the estimated effort (one design/build/test/review cycle per
   story) and ask:
   - go / no go;
   - whether to commit each story on the rebuild branch (recommended: checkpoints);
   - if `stack:` changes were given (e.g. a different state library): approval for
     the `architect` to first write an ADR for them.

## 2. Prepare

1. `git switch -c rebuild/<YYYY-MM-DD>` from `main`.
2. Save the oracle: `git archive main e2e | tar -x -C <scratchpad>/oracle` — the
   original Playwright specs, used only at the end. Don't show them to the agents.
3. Reset the app code to the scaffold:
   `git checkout $(git rev-list --max-parents=0 main) -- src e2e`, then delete files in
   `src/` and `e2e/` that don't exist in that first commit.
   Keep `docs/`, `.claude/` (agents, memory, skills), configs and `package.json`.
4. Run `npm install` and `npm run verify` — must be green before the first story.

## 3. Replay each story

For each story in order (no product-owner step and no gates — the stories are approved):

1. `architect` (+ `ux-designer` if UI): "Rebuild mode — redesign story NNN for the
   **current** code base. The existing design sections are reference, not instruction.
   ADRs in `docs/adr/` stay binding." They overwrite the design sections on this branch.
2. `developer` → `tester` → `reviewer`, with the usual loops (max 3 review rounds).
3. If a story can't be approved, stop the rebuild and report to hak — don't skip it,
   later stories may depend on it.
4. If agreed, commit: `rebuild: story NNN – <title>`.

## 4. Check against the oracle

1. Copy the oracle specs to `e2e/oracle/` and run `npm run test:e2e -- e2e/oracle`.
2. Remove `e2e/oracle/` again (never commit it).
3. Report to hak: per story pass/fail, oracle results (failures mapped to story/AC via
   test names), `git diff --stat main`, and notable differences in behaviour or
   structure. A failing oracle test means either the rebuild is wrong or the story is
   incomplete — say which, and propose a story fix if the spec was the gap.

Never merge the rebuild branch into `main` or push it without a separate go from hak.
