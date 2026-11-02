---
name: test-proportionality
description: hak considers the test suites too heavy (story 001); review tests for proportionality, not just coverage
metadata:
  type: feedback
---

Proportionality is an explicit review criterion: one test per AC at the cheapest level that shows it.

**Why:** hak found story 001 test-heavy; from story 004 on the coordinator asks the reviewer to flag duplicates as well as gaps.
**How to apply:** for each AC, list its tests across unit/component/e2e. Flag as nit when two tests exercise the same code path (e.g. error vs cancel variants feeding the same reducer transition, or repeating an earlier story's storage check). Ask for new tests only where a real risk is uncovered. Build checks (dist grep) count as the oracle for "absent in production" ACs — don't ask for `vi.stubEnv` tests of DEV guards.

Also check the Technical design's "minimal test set" itself: in story 006 it asked for e2e checks that duplicated reducer/pure-function unit tests (won vs lost freeze, no-cap). Flag these as nits with "input for the architect", not as a developer/tester fault.

Cross-spec coupling: auth.spec pins the game's first tab stop, so every setup change breaks it (005, 006). Point this out when it's touched again.

Related: [[async-adapter-checks]]
