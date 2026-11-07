# reviewer memory

Lessons learned across stories. One rule per line, newest last. Keep under 100 lines.

- [Async adapter checks](async-adapter-checks.md) — Give every non-interactive await in a pending-UI flow a timeout, and check that late callbacks can't overwrite a success (story 001)
- [Build guard checks](build-guard-checks.md) — Prove the e2e-fake guard with builds that have the env ID set, plain and `--mode e2e`, into the scratchpad; read an ADR before calling it stale (story 001); probe check-dist with injected/empty/dev builds (004)
- [UI/a11y probes](ui-a11y-probes.md) — Probe forced-colours, live-region, re-render and fit-in-row claims with a scratch Playwright spec (005, 006); audit contrast by the pairs modules paint, not the design table (007); transition/viewport probe pitfalls, layer count, token-derived calc constants (008)
- [WebGL scene checks](webgl-scene-checks.md) — Probe imperative controllers on every lifecycle edge (re-attach on new game) × inactive modes (forced colours); GPU leaks, per-frame cost (009); real-loop vs paused-probe gap, GL object-count leak probe, dev helpers surviving tree-shake (010)
- Run `npx prettier --check` on the story after writing the Review: nested lists need blank lines or `verify` fails (009)
- [Test proportionality](test-proportionality.md) — hak finds suites test-heavy: flag same-AC/same-code-path duplicates as nits, ask for tests only for real uncovered risk (004); the design's test set can itself duplicate (006); size-mismatched pixel diffs pass vacuously (008)
- [Monorepo checks](monorepo-checks.md) — Skeleton isn't run by verify, fixture defaults are vacuous, probe new-app from scratchpad, avoid `git add -N` (story 011)
- Process/script stories (012): probe check-structure-style parsers on a scratchpad copy with fenced examples, bold cells and odd formats; raw-text searches (not `stripCode`d) find headings inside code fences. Don't add sections that belong to the orchestrator (Explanation) to the story.
- Calculator/logic stories (013): Node 25 runs the app's `.ts` logic directly (`node scratch.mjs` importing absolute `.ts` paths): recompute the AC oracle independently and probe worst case, tiny amounts and hostile parser input in one script before reading tests. Write the oracle in integer cents (BigInt), never EUR floats: a float oracle gave 260 false half-cent mismatches (014).
- Check `inputMode` against each field's range: iOS `decimal`/`numeric` keypads have no minus key, so fields that allow negatives need `text` (013).
- Recount reported test numbers per workspace/project from the raw output (vitest: platform, avd, …; Playwright: chromium vs platform): a Test report mixed unit and e2e counts (014).
- When a story adds a shared helper file, check that the old copies were replaced by imports, not left beside it (e2e helpers duplicated in 014).
