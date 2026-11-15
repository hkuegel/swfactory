# The harness the roles run in (OpenCode, 2026-11-15)

The role definitions in `.claude/agents/` are the version of record for the rules, and they stay
for Claude Code. The files in `.opencode/agents/` are the same roles read by OpenCode: they point
at the role file and state only what is different in this harness. Read this file through them.

- **The model.** Only one model exists here: `strata/iq2_xs` (Qwen3.8-Flash-Next, IQ2_XS, about
  63 GB), which is also the model the orchestrator session runs on. A role file does not name a
  model, so a run inherits the session model. An alias that the environment does not have
  (`sonnet`, `opus`, `haiku`) ends the run with an error, which killed two runs on 2026-11-15.
- **One run at a time.** hak's instruction of 2026-11-15: no parallel agents. A run that is
  cancelled returns nothing, and whatever it wrote before the cancellation stays in the tree
  unconfirmed — read it, name it as foreign work, and do not treat it as a result.
- **No SendMessage.** A follow-up to a role is a new `subagent` call with the `sessionID` of that
  role's earlier run; that keeps its context. Subagents always run in the background and the parent
  gets a report when the child goes idle.
- **Memory.** OpenCode has no `memory:` field. A role reads `.claude/agent-memory/<role>/MEMORY.md`
  before it starts and appends its lessons to it at the end, in the same one-line rule form the role
  file describes. Lessons for the whole team go in the reply under "Suggested for CLAUDE.md", not in
  the memory.
- **`gh`.** It is installed at `C:/Program Files/GitHub CLI/gh.exe` but not on the PATH of the shell
  the harness uses, so call it by full path. The token is in the environment (`GH_TOKEN`); do not
  print it. A run that cannot find `gh` must not claim to have opened a pull request.
- **Worktrees.** `node_modules` exists only in the worktrees where it was installed
  (`swfactory`, `swfactory-main`, `swfactory-032`). Nothing can be run in a worktree without it; a
  role that needs checks runs in a worktree that has them, or the work is not reported as verified.
- **Ports.** 5173 is hak's dev server, never touched. 5174 must stay free before an e2e run, because
  Playwright starts its own dev server there through `webServer`; a server on 5174 makes the sign-in
  tests time out.
- **Formatting.** A role that edits markdown does not run prettier itself; the orchestrator runs
  prettier and `npm run check:structure` after the step. A markdown file that is only read is quoted
  with the exact strings, as they are.
- **Nothing is claimed without a runner.** Counts, verdicts, mutation results and gate approvals come
  from what a run printed, not from what a role expects. Write to the story only what was observed.
