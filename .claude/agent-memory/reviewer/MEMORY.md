# reviewer memory

Lessons learned across stories. One rule per line, newest last. Keep under 100 lines.

- [Async adapter checks](async-adapter-checks.md) — Give every non-interactive await in a pending-UI flow a timeout, and check that late callbacks can't overwrite a success (story 001)
- [Build guard checks](build-guard-checks.md) — Prove the e2e-fake guard with builds that have the env ID set, plain and `--mode e2e`, into the scratchpad; read an ADR before calling it stale (story 001); probe check-dist with injected/empty/dev builds (004)
- [UI/a11y probes](ui-a11y-probes.md) — Probe forced-colours, live-region, re-render and fit-in-row claims with a scratch Playwright spec (005, 006); audit contrast by the pairs modules paint, not the design table (007); transition/viewport probe pitfalls, layer count, token-derived calc constants (008)
- [WebGL scene checks](webgl-scene-checks.md) — Probe imperative controllers on every lifecycle edge (re-attach on new game) × inactive modes (forced colours); GPU leaks, per-frame cost (009)
- Run `npx prettier --check` on the story after writing the Review: nested lists need blank lines or `verify` fails (009)
- [Test proportionality](test-proportionality.md) — hak finds suites test-heavy: flag same-AC/same-code-path duplicates as nits, ask for tests only for real uncovered risk (004); the design's test set can itself duplicate (006); size-mismatched pixel diffs pass vacuously (008)
- [Monorepo checks](monorepo-checks.md) — Skeleton isn't run by verify, fixture defaults are vacuous, probe new-app from scratchpad, avoid `git add -N` (story 011)
