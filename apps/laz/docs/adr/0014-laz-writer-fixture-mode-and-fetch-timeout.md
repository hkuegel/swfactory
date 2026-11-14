# 014 – Writer script: fixture mode is the default, live fetch has a timeout

- **Status:** accepted
- **Date:** 2026-11-13
- **Story:** apps/laz/docs/backlog/025-laz-fund-list-writer.md

## Context

Story 025 adds a script that reads fund values from an external page. Two rules apply to it: tests
never make live network requests (P17), and every network call that keeps a progress state open needs a
timeout that ends in an error state, so no run can hang forever. The script is not UI, but a run that
hangs is the same failure: a CI job or a manual run that never ends and never says why.

The script also needs a decision that is not about timeouts: which mode is the default. A script whose
default mode fetches would make every accidental run a request to a third-party site, and would make CI
depend on that site staying readable. A script whose default mode reads stored responses keeps the tests
independent of the source.

## Options considered

1. **Live mode is the default, fixture mode is an option** – fewer flags for the normal use case; but an
   accidental run hits the source, CI needs the source, and a test that forgets the flag makes a request.
2. **Fixture mode is the default, live mode requires an explicit argument** – the tests and CI can never
   reach the network by accident; a live run is a deliberate act by hak or by the UI-triggered workflow.
   The cost is one flag on the everyday command and one explicit branch in the CLI.
3. **Two separate entry points (one script per mode)** – no flag to forget, but the shared parse and write
   code must then be reached through two paths, and the CLI's error handling is duplicated.

## Decision

Fixture mode is the default; live mode is reached only by `--mode=live`, from hak's command line or from
this story's UI-triggered workflow. The fetch in live mode uses an `AbortController` with the named
constant `FETCH_TIMEOUT_MS = 15000`, and the timeout ends the run in the error state with the fund named,
not with a partial file. Tests run in fixture mode only and assert that the parse module never reaches the
request function; the request module is never imported by a test.

CI runs `test:scripts` in fixture mode, so CI has no dependency on the source. The live run is reported by
hak after the push (Definition of Done), because a workflow job cannot be tested without a runner.

Hak's CI decision of 2026-11-14 adds the two names the test run is given, so the mode is stated by the run
instead of falling back to a default: `VITE_TEST_MODE=local` is the mode of a test run, and `LAZ_FUND`
names the fund data it reads (`fixture` for the stored copy, `committed` for the file the writer writes).
The live part is not a test run: it runs as its own step after the publish, in `--frozen` mode, which writes
nothing and names each difference with the committed file. `--full` is the write mode and writes the whole
table; it refuses to write a result that does not fit the committed fund identity, so a CI run can never
publish a file its own checks would contradict.

## Consequences

- The parse module and the fetch module are separate files on purpose: the separation is what makes the
  "no request in fixture mode" assertion measurable, not just a convention.
- A live run can fail because the source changed, and that failure is a named error rather than a wrong
  number. CI stays green when the source moves, because CI reads stored responses.
- Stored responses must keep their exact bytes, so `scripts/fixtures/` is excluded from prettier; a
  reformatted fixture can make the patterns match differently than the real response does.
- The timeout is a constant in the fetch module, so a change to it is one line; nothing in this design
  depends on a specific value, only that a hanging request cannot keep a run open.
- A key is not part of this design: no free source that carries the needed fields works without a key, and
  a key in a guest bundle would be visible to every visitor, so the app stays keyless (ADR 0013, P15).
- A test run cannot name the live source: `apps/laz/src/features/plan/logic/fundSource.ts` refuses mode
  `live`, so the CI checks step cannot reach the network by accident even when the environment is set wrong.
  This is the same rule as the separation of the parse module, now carried by the name of the run.
