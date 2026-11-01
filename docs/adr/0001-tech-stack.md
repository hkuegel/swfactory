# 0001 – Frontend tech stack

- **Status:** accepted
- **Date:** 2026-11-01

## Context

The factory builds a single-page web application. Agents need a stack with fast
feedback (type checks, tests, lint) so they can verify their own work, and with
conventions that are widely known so generated code stays idiomatic.

## Options considered

1. **Vite + React + TypeScript** – fast dev server and builds, minimal config, the
   de-facto default for client-side React apps.
2. **Next.js** – SSR, routing and API routes built in; more framework surface and
   server concerns than needed for an SPA.

## Decision

Vite + React 19 + TypeScript (strict). Vitest + Testing Library for unit/component
tests, Playwright for e2e, ESLint (typescript-eslint) + Prettier, CSS Modules for
styling. Routing, server-state and UI libraries are added later, each via its own ADR.

## Consequences

- No SSR; if SEO or server rendering becomes a requirement, revisit with a new ADR.
- Vitest shares Vite's config, so tests and app resolve modules the same way.
