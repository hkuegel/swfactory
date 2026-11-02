# 0004 – Design tokens as CSS custom properties, dark mode via media query, shared Button

- **Status:** accepted
- **Date:** 2026-11-02
- **Story:** docs/backlog/007-minesweeper-redesign.md (also used by 008)

## Context

Story 007 restyles the whole app and requires consistency (one font, one radius, one primary
and one secondary button style, one set of message colours) in light and dark, with contrast
guarantees. Today every CSS module carries its own hex values and its own
`prefers-color-scheme` block (about nine copies of the palette), and four modules draw their
own buttons. Story 008 (3D mode) reuses the same colours and depth values. The decision is
costly to reverse because every module will consume it.

## Options considered

1. **CSS custom properties in one global file, light values in `:root`, dark values in one
   `@media (prefers-color-scheme: dark) { :root { … } }` block** (chosen) – no dependency,
   no build step, one place to change, works in jsdom/Vitest as plain text, and the build
   pipeline leaves it alone.
2. **Same, but with `light-dark(a, b)` per token** – half the lines and no way to forget a
   dark value, but it needs a 2024 browser baseline, and Vite's CSS transform may rewrite it
   for the default build target. The e2e suite runs on the dev server, so a production-only
   rewrite problem would go unseen. Rejected for that risk.
3. **A CSS-in-JS or design-token library (vanilla-extract, Style Dictionary, Tailwind)** –
   a new dependency and build step for one palette. Rejected (CLAUDE.md: no UI framework
   without an ADR, and none is needed).
4. **Keep per-module palettes, just restyle** – no new structure, but consistency (AC2)
   rests on discipline only; this is the situation that produced nine palette copies.

## Decision

Option 1:

- `src/app/tokens.css` is the only place with colour literals, radii, spacing, type scale,
  control height, motion duration and elevation. CSS Modules read `var(--…)`.
- Dark mode is the media query block in the same file; no module has its own
  `prefers-color-scheme` rule. Forced-colours rules stay local in the module that needs them
  and use system colour keywords only.
- Motion: one token `--duration` (at most 200 ms); `prefers-reduced-motion: reduce` sets it
  to `0s` in the token file. Every `transition` uses it, so no module needs its own
  reduced-motion rule (looping animations such as the login spinner keep their own).
  Exception: `src/index.css` adds a global safety net under the same query,
  `transition: none !important; animation: none !important`, for what the token rule misses.
- A unit test (`src/app/tokens.test.ts`) enforces the rules: light and dark define the same
  names, contrast pairs hold in both schemes, and no module bypasses the tokens (no colour
  literals, no `font-family`, no literal transition times outside the allowed files).
- The four hand-drawn buttons share `src/components/Button.tsx` with
  `variant: 'primary' | 'secondary'`. The Google button keeps its own module (branding) but
  consumes the same tokens for font, radius and height.

## Consequences

- Restyling or adding the 3D look (008) means changing or adding tokens, not hunting hex
  values. New tokens must be added to both blocks; the unit test fails otherwise.
- Under reduced motion nothing animates (incl. 008) and no `transitionend`/`animationend` fires.
- Colour tokens that are contrast-tested must be opaque 6-digit hex; hover and pressed
  tints that sit under text are their own opaque tokens, not alpha overlays.
- No manual theme switch: if it comes later, the dark block becomes a
  `[data-theme='dark']` selector next to the media query; a separate decision.
- The login screen's Google button has its own brand constraints; if they conflict with
  the "one fill for primary actions" rule, the UX design names the accepted exception.
