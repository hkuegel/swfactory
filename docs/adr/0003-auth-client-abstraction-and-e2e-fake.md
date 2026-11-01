# 0003 – AuthClient abstraction, React context for auth state, and an e2e-only fake provider

- **Status:** accepted
- **Date:** 2026-11-01
- **Revised:** 2026-11-01 for option C: the fake is in-memory only (no simulated Google session in `sessionStorage`).
- **Story:** docs/backlog/001-login.md

## Context

Sign-in state is needed app-wide (login screen, header). The identity provider (Google, later
Microsoft in story 002) must be replaceable by a simulation in component tests and in
Playwright e2e, because real Google sign-in can't run in CI. The simulation must never ship
in a production build: a switchable fake login in production would be a backdoor once
anything relies on sign-in.

## Options considered

1. **State library (Redux, Zustand, …)**: more than one piece of state with four transitions
   needs. Rejected.
2. **React context + `useReducer` + an `AuthClient` interface injected into the provider**
   (chosen): built in, the pure reducer is unit-testable, and the provider is testable with
   any `AuthClient`.
3. **e2e via Playwright route interception of the GIS script** (serve a fake
   `window.google`): ships no test code at all, but we'd have to re-implement Google's API
   surface and its popup/FedCM semantics in test code, which is brittle and tied to Google
   internals.
4. **e2e via a fake `AuthClient` chosen at runtime by an env variable or URL flag**:
   rejected. A runtime flag can be flipped in production.
5. **e2e via a fake `AuthClient` chosen only when the Vite dev server runs in mode `e2e`**
   (chosen). The guard is `import.meta.env.DEV && import.meta.env.MODE === 'e2e'`. Vite
   replaces `import.meta.env.DEV` with the literal `false` in `vite build`, so the branch
   and the (side-effect-free) fake module are removed from production bundles whatever env
   variables are set.

## Decision

- `AuthClient` interface (`src/features/auth/types.ts`) is the only contract between the UI
  and an identity provider. Implementations: `createGoogleAuthClient` (real),
  `createFakeAuthClient` (tests/e2e), and an inline "not configured" client.
- `AuthProvider` owns `AuthState` via `useReducer` (pure `authReducer`). Components read it
  through `useAuth()`. The client is created once in `src/main.tsx` by `createAuthClient()`
  and injected as a prop.
- e2e: Playwright starts `vite --mode e2e` on its own port (5174, so it never reuses a
  developer's normal dev server). The fake exposes a control object `window.__fakeGoogle`
  only in that mode. The fake is purely in memory and persists nothing across reloads, the
  same as the real app (no session restore, story 001 variant C). The control object is
  recreated on every page load.

## Consequences

- Story 002 (Microsoft) plugs in as another `AuthClient` (or a provider-keyed set of
  clients) without touching the reducer's states.
- e2e tests check our UI and state machine, not Google's real behaviour. Real Google is
  checked manually (and through the adapter's unit tests with a stubbed `window.google`).
- The fake module must stay free of top-level side effects, or tree-shaking might keep it.
  Check: after `npm run build`, `grep -r "__fakeGoogle" dist` finds nothing. The reviewer
  checks this; devops may automate it in `verify`.
- The e2e server must run in dev mode (`vite`, not `vite preview`), because the fake isn't
  in production bundles by design.
