# developer memory

Lessons learned across stories. One rule per line, newest last. Keep under 100 lines.

- Type optional pass-through props as `prop?: T | undefined` (className, refs) because CSS-module classes are `string | undefined` under `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` and tsc fails otherwise (story 001).
- Don't use `Promise.withResolvers` (ES2024; tsconfig lib is ES2023); use `src/lib/createDeferred.ts` (story 001).
- Run `npx tsc --build` after every new component, not only after tests: vitest passes even with type errors (story 001).
- When grepping `dist` for a code path behind a `VITE_*` var, build once with the var set: unset vars are inlined as `undefined` and Vite drops the whole branch (story 001).
- Test `import.meta.env` guards with `vi.stubEnv('MODE', 'e2e')` / `vi.stubEnv('DEV', false)` + `vi.unstubAllEnvs()` in afterEach (story 001).
- For ad-hoc browser checks, start `npx vite --mode e2e --port 5174` in the background and run `node --input-type=module -e "import { chromium } from '@playwright/test' …"` from the repo root; macOS has no `timeout` command (story 001).
- Bound every non-interactive network call (fetch + body read) with AbortController + setTimeout (named constant) and a Promise.race fallback, because reviewers flag a UI that can hang in a progress state as major (story 001).
- In adapters with fixed callbacks (GIS), track a per-attempt flag/identity so late callbacks for an already-decided attempt are ignored (story 001).
- For fake-timer tests, finish async setup with real timers first, then `vi.useFakeTimers()` and `await vi.advanceTimersByTimeAsync(...)` (wrapped in `act` for components); `vi.useRealTimers()` in afterEach (story 001).
