---
name: async-adapter-checks
description: Review checklist for provider adapters / async flows that drive a disabled-while-pending UI (auth, later 002 Microsoft, 003 session)
metadata:
  type: feedback
---

When an adapter returns a promise that the UI waits on (button disabled + progress until it settles):

- Every **non-interactive** await inside the attempt (fetch, body read, token exchange) needs a timeout/abort mapped to an error result. Otherwise a stalled request leaves the UI disabled forever. Interactive waits (popup) can stay unbounded only if the provider reliably signals close.
  **Why:** story 001 round 1 — userinfo fetch had no timeout; architect's "no timeout" rule was meant for the popup only and was over-applied. Raised as major.
  **How to apply:** grep the adapter for `await`/`.then` between "attempt started" and "settle"; for each, ask "what ends this if the network stalls?". Suggest AbortController + setTimeout (fake-timer testable) over AbortSignal.timeout.
- When reviewing a timeout fix, confirm `clearTimeout` runs in `finally` on every path, there's a test asserting `vi.getTimerCount() === 0`, and late answers settle only the attempt they belong to (identity check on the deferred). Story 001 round 2 had all three and passed.
- Check late/out-of-order provider callbacks: can an error/close callback arriving after a success (while a follow-up call is in flight) overwrite the success? Ask for a per-attempt flag + test.
- Tester "observations" marked low severity are not pre-classified for you: re-judge them against the AC wording ("until the attempt ends") and the design's intent.

Related: [[build-guard-checks]]
