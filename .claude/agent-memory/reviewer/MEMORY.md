# reviewer memory

Lessons learned across stories. One rule per line, newest last. Keep under 100 lines.

- [Async adapter checks](async-adapter-checks.md) — Give every non-interactive await in a pending-UI flow a timeout, and check that late callbacks can't overwrite a success (story 001)
- [Build guard checks](build-guard-checks.md) — Prove the e2e-fake guard with builds that have the env ID set, plain and `--mode e2e`, into the scratchpad; read an ADR before calling it stale (story 001)
