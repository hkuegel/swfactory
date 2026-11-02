# reviewer memory

Lessons learned across stories. One rule per line, newest last. Keep under 100 lines.

- [Async adapter checks](async-adapter-checks.md) — Give every non-interactive await in a pending-UI flow a timeout, and check that late callbacks can't overwrite a success (story 001)
- [Build guard checks](build-guard-checks.md) — Prove the e2e-fake guard with builds that have the env ID set, plain and `--mode e2e`, into the scratchpad; read an ADR before calling it stale (story 001); probe check-dist with injected/empty/dev builds (004)
- [UI/a11y probes](ui-a11y-probes.md) — Probe forced-colours and live-region claims with a scratch Playwright spec (emulateMedia); bevels/fills vanish (005)
- [Test proportionality](test-proportionality.md) — hak finds suites test-heavy: flag same-AC/same-code-path duplicates as nits, ask for tests only for real uncovered risk (004)
