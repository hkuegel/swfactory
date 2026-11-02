# developer memory

Lessons learned across stories. One rule per line, newest last. Keep under 100 lines.

- Type optional pass-through props as `prop?: T | undefined` (className, refs) because CSS-module classes are `string | undefined` under `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` and tsc fails otherwise (story 001).
- Don't use `Promise.withResolvers` (ES2024; tsconfig lib is ES2023); use `src/lib/createDeferred.ts` (story 001).
- Run `npx tsc --build` after every new component, not only after tests: vitest passes even with type errors (story 001).
- When grepping `dist` for a code path behind a `VITE_*` var, build once with the var set: unset vars are inlined as `undefined` and Vite drops the whole branch (story 001).
- Test `import.meta.env` guards with `vi.stubEnv('MODE', 'e2e')` / `vi.stubEnv('DEV', false)` + `vi.unstubAllEnvs()` in afterEach (story 001).
- For ad-hoc browser checks, start `npx vite --mode e2e --port 5174` in the background and run `node --input-type=module -e "import { chromium } from '@playwright/test' …"` from the repo root; macOS has no `timeout` command; kill it (`lsof -tiTCP:5174`) before `npx playwright test`, which starts its own server on 5174 (stories 001, 005).
- Bound every non-interactive network call (fetch + body read) with AbortController + setTimeout (named constant) and a Promise.race fallback, because reviewers flag a UI that can hang in a progress state as major (story 001).
- In adapters with fixed callbacks (GIS), track a per-attempt flag/identity so late callbacks for an already-decided attempt are ignored (story 001).
- For fake-timer tests, finish async setup with real timers first, then `vi.useFakeTimers()` and `await vi.advanceTimersByTimeAsync(...)` (wrapped in `act` for components); `vi.useRealTimers()` in afterEach (story 001).
- When `AuthUser` (or any shared type) becomes a union, fix test literals with a targeted sed (e.g. `{ id: '` → `{ provider: 'google', id: '`) and then grep multi-line literals, because `toEqual` failures only show at runtime, not in tsc (story 004).
- Keep the test set minimal when the design names one (hak found 001 test-heavy): add only the listed unit/provider cases, and leave e2e-covered UI to the tester (story 004).
- To give stacked buttons equal width without stretching them, wrap them in an `inline-flex` column and switch to `flex` below 600 px; 001 e2e checks that the Google button is <300 px wide (story 004).
- Remove a computed key from an object with `Object.fromEntries(Object.entries(o).filter(...))`, because tseslint strict forbids `delete o[key]` (no-dynamic-delete) (story 005).
- Type CSS custom properties in `style` as `CSSProperties & { '--name': number }` instead of an `as` cast (story 005).
- To focus the first invalid field with its error already in `aria-describedby`, run the submit callback in `flushSync` and then `querySelector('[aria-invalid="true"]')?.focus()` (story 005).
- Let content break out of the 40 rem `main` column by a modifier class that drops `max-width` (children re-apply it), not with `100vw` math, which overflows when a vertical scrollbar shows (story 005).
- Delete files with plain `rm`, not `git rm`, because `git rm` stages the change and agents leave staging to hak (story 005).
- In `@media (forced-colors: active)`, fills and `box-shadow` are dropped: give state cues that carry meaning `forced-color-adjust: none` + system colours, and check with Playwright `emulateMedia({ forcedColors: 'active' })` (story 005).
- Mount live regions empty from the start and make each announcement's text differ (e.g. a no-break space on alternate ids), because screen readers ignore regions inserted together with their text and unchanged text (story 005).
- Put a visually hidden description next to (not inside) a button that must have an exact accessible name, because hidden-by-clip text inside the button still counts toward the name (story 006).
- When a live region should be "mounted empty", don't append a no-break-space repeat trick to empty text: guard it with `text !== ''` / serial > 0 (story 006).
- A tab-order change in the UI breaks existing keyboard e2e specs (e.g. auth.spec.ts Tab after Sign out): run `npx playwright test` once at the end and report such failures to the tester (story 006).
