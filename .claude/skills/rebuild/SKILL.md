---
name: rebuild
description: Regenerate one app from its backlog - reset it to the app skeleton, replay its done stories in order on a fresh branch against the current platform, and check the result against the original end-to-end tests.
argument-hint: '<app> [up-to NNN] [from: <tag|commit>] [stack: <changes>]'
disable-model-invocation: true
---

# Rebuild an app from its backlog

Arguments: $ARGUMENTS

You are the **orchestrator**. The story files in `apps/<app>/docs/backlog/` are the
specification; the app is regenerated from them. The result won't be identical code — the
goal is the **same behaviour**, proven by the original end-to-end tests.

**Starting point:** the app skeleton (`templates/app/`) plus the **current** platform
(`packages/platform/`). The platform is not rebuilt and its stories (in `docs/backlog/`)
are never replayed; only the stories of the app are. The git tag `base` marks the
pre-split baseline (single-app layout, no `apps/`) and is no longer a starting point:
`from: base` is meant only for archaeology, not for a rebuild — say so if asked.
`from: <tag|commit>` (a commit after the split) starts the app from that commit's
`apps/<app>/{src,e2e,public}` instead of the skeleton and skips the stories that were
already `done` there (`git show <ref>:apps/<app>/docs/backlog/<file>`).

## 1. Plan and confirm

1. Require a clean working tree on `main`; otherwise stop and tell hak. `<app>` is
   required and `apps/<app>/` must exist; otherwise stop and list the apps in `apps/`.
2. Build the replay list: the stories in `apps/<app>/docs/backlog/` with `status: done`,
   sorted by id, skipping those with `status: superseded`. Stop at `up-to NNN` if given.
   Stories with `changes:` stay in order — they modify what earlier stories built. Every
   app story is newer than the skeleton, so there is no comparison with a baseline. If the
   list is empty, tell hak there's nothing to rebuild and stop.
3. Show hak the list, the estimated effort (one design/build/test/review cycle per
   story) and ask:
   - go / no go;
   - whether to commit each story on the rebuild branch (recommended: checkpoints);
   - if `stack:` changes were given (e.g. a different state library): approval for
     the `architect` to first write an ADR for them.

## 2. Prepare

1. `git switch -c rebuild/<app>-<YYYY-MM-DD>` from `main`.
2. Save the oracle: `git archive main apps/<app>/e2e | tar -x -C <scratchpad>/oracle` —
   the original Playwright specs of the app, used only at the end. Don't show them to the
   agents. The platform's sign-in specs are not part of the oracle (they run in every
   `test:e2e` anyway).
3. Reset the app to the skeleton (or, with `from:`, `git checkout <ref> -- apps/<app>/src
apps/<app>/e2e apps/<app>/public` and delete what doesn't exist there):
   `node scripts/new-app.mjs <app> --reset` replaces
   `apps/<app>/src`, `e2e` and `public` by the skeleton's versions (title read from the
   app's `index.html`). `package.json`, configs, `dist-check.json`, `index.html`, `docs/`
   and `README.md` stay as on `main`; so do `.claude/` (agents, memory, skills) and the
   platform.
4. Run `npm install` and `npm run verify -w apps/<app>` — must be green before the first
   story (the skeleton's own tests run). Only `verify` is green at this point: the
   `platform` e2e project fails until the app shows the `signedInContent` named in its
   `playwright.config.ts` (e.g. the Start button), which the replayed stories have to
   build — don't read those failures as defects.

## 3. Replay each story

For each story in order (no product-owner step and no gates — the stories are approved):

1. `architect` (+ `ux-designer` if UI): "Rebuild mode — redesign story NNN for the
   **current** code base. The existing design sections are reference, not instruction.
   ADRs in `docs/adr/` and `apps/<app>/docs/adr/` stay binding." They overwrite the
   design sections on this branch.
2. `developer` → `tester` → `reviewer`, with the usual loops (max 3 review rounds).
   Until the app's `signedInContent` exists (normally after the first story), `test:e2e`
   fails in the `platform` project for that reason only; the first story's acceptance
   includes producing it.
3. If a story can't be approved, stop the rebuild and report to hak — don't skip it,
   later stories may depend on it.
4. If agreed, commit: `rebuild: story NNN – <title>`.

## 4. Check against the oracle

1. Copy the oracle specs to `apps/<app>/e2e/oracle/` and run
   `npm run test:e2e -w apps/<app> -- e2e/oracle`.
2. Remove `apps/<app>/e2e/oracle/` again (never commit it).
3. Report to hak: per story pass/fail, oracle results (failures mapped to story/AC via
   test names), `git diff --stat main`, and notable differences in behaviour or
   structure. A failing oracle test means either the rebuild is wrong or the story is
   incomplete — say which, and propose a story fix if the spec was the gap.

Never merge the rebuild branch into `main` or push it without a separate go from hak.
