---
id: 017
title: Altersvorsorgedepot chart with solid colours instead of stripes
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: avd # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<name>/docs/backlog)
branch: feature/017-avd-chart-solid-colours
supersedes: []
changes: [] # no AC of 013 to 016 names stripes or patterns; only the UX design visual specs (013 §5/§8, 015 §5/§8) are replaced, see Context
superseded-by:
---

# 017 – Altersvorsorgedepot chart with solid colours instead of stripes

## Original request

> 1. hak, 2026-11-08: "Die Farbgestaltung beim Balkendiagramm gefällt mir nicht, wilr sollten nicht "gestreifte" Balen nehmem, das ist unübersichtlich."
> 2. hak's slash command, 2026-11-08: "/feature Diagramm ohne Streifen"

## User story

As a saver looking at the balance chart, I want every part of the bars drawn in a plain, clearly different colour instead of stripes, so that I can read the chart at a glance.

## Context

- Related stories: [013](013-avd-saving-phase-zulagen.md) (chart, Zulagen striped, returns hollow, loss dashed hollow), [015](015-avd-reinvest-tax-refund.md) (reinvested refund as heavy framed stripes), [016](016-avd-etf-comparison.md) (the same message already split this chart change off, see its Decision log). 014/AC5 (no chart bar changes when only the tax rate changes) is unaffected: this story changes only how the bars look, not their size or position.
- Today the normal view uses patterns for identity: Zulagen striped (50 %), reinvested refund heavy framed stripes (75 %), positive returns hollow (pale fill, outline), loss hollow with a dashed outline. Only own contributions is solid. hak finds this cluttered.
- Why the patterns exist (orchestrator, 2026-11-08): in forced-colours mode (Windows high contrast) the system replaces all colours, so series can only be told apart by pattern, border or glyph. CLAUDE.md "Styling": every state cue also exists as a border, outline or glyph, so it survives forced colours.
- Proposed approach (orchestrator, accepted by hak at gate 1, see Decision log): solid, clearly distinct colours in the normal view (light and dark); stripes/patterns/outlines only in forced-colours mode, so that rule still holds.
- Series that can occur: own contributions, Zulagen, reinvested refund (only while checked, 015), returns, loss (negative returns, only if a year has a loss). The stacking order and the 1 px surface separator between stacked segments stay as they are.
- No AC of 013 to 016 names stripes or patterns, so there is no `changes:` link. Only the UX design visual specs are replaced: 013 UX §5 (series table) and §8 (token roles: "stripe colour", "outline of returns", "dashed outline of loss", "pale fills are decorative") and 015 UX §5 and §8 (heavy stripes, frame). The tech-writer/ux-designer must update those rows; this story does not edit them.
- Existing colour tokens are contrast-tested at 3:1 against the surface (013 UX §8); that rule continues to hold for the new fills.

## Acceptance criteria

- **AC1:** Given a result is shown (light and dark colour scheme, forced colours off), when the chart is displayed with the reinvestment checkbox unchecked and checked and with a negative return so that a loss segment occurs, then every segment of every series in the bars is filled with one uniform colour: no stripes, no pattern, no hollow (outline-only) look and no dashed outline; sampled pixels inside a segment, away from its edge, all have the same colour.
- **AC2:** Given the chart of AC1 shows all five series (own contributions, Zulagen, reinvested refund, returns, loss), when the fill colours are compared, then all five fills are pairwise different, each has at least 3:1 contrast against the surface in light and in dark scheme, and every pair of series that can sit next to each other in a bar differs by at least the minimum fixed in the UX design.
- **AC3:** Given the legend is shown, when its swatches are compared with the bars, then each swatch is one uniform colour equal to the fill of its series in the bars, the legend entries, their order and their texts are as in 013 and 015 (reinvested entry only while checked, loss entry only if a loss occurs), and no swatch has a pattern or dashed outline.
- **AC4:** Given forced colours are active (`forced-colors: active`), when the chart and legend are displayed (reinvestment unchecked and checked, with a loss), then every series can be told apart from every other series without relying on colour, by pattern, border or outline, in the bars and in the legend swatches, and no series is invisible against the canvas.
- **AC5:** Given any valid input, when the chart is displayed, then the figures, the per-year table, the comparison, the legend texts and the chart's text alternative are unchanged from 013 to 016, and for the same input the silhouette of the bars (position and height of every segment) is the same as before this story (014/AC5 still holds).

## Out of scope

- Any change of data, numbers, bar sizes, axes, grid, tick labels or text; a new chart type or additional series; a chart for the comparison (016).
- New colour-scheme modes beyond the existing light/dark and forced-colours handling.
- Editing the UX design sections of 013 and 015 (tech-writer/ux-designer follow-up, see Context).

## Open questions

None for hak.

- Exact minimum contrast between neighbouring series fills: decided by the UX designer (Decision log).

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-08 — Request: hak finds the striped bars unclear and wants no stripes (Original request 1); then started the feature with "/feature Diagramm ohne Streifen" (Original request 2). The same message was already split off from 016 as its own story (016 Decision log).
- 2026-11-08 — Orchestrator answered hak: the stripes exist for forced-colours mode (Windows high contrast), where all colours are replaced and series can only be told apart by pattern; proposed solid, clearly distinct colours in the normal view and stripes/patterns only in forced-colours mode. hak did not comment on the proposal when starting the slash command; it is kept as Open question 1 for gate 1, not as a confirmed decision.
- 2026-11-08 — hak: "Ja, alle passen" (answer to all four open questions, all bracketed proposals accepted). Decisions: (1) stripes/patterns only in forced-colours mode, solid colours in the normal view (light and dark); (2) the exact minimum contrast between neighbouring series fills is left to the UX designer; (3) all series solid, including positive returns and loss (loss in a clearly different colour, drawn over the stack as today); (4) forced-colours mode keeps today's shapes (solid / stripes / heavy framed stripes / hollow / dashed hollow).
- 2026-11-08 — Status set to ready.

<!-- Sections below are filled in by later roles. Don't delete headings. -->

- 2026-11-08 — Gate 2: hak approved all retro proposals and the commit ("Alle, dann committen"); the screenshots of light, dark and forced colours were shown. Manual checks (real iPhone, Windows high contrast on a real machine, greyscale print) not answered by hak: recorded as not run, open.

## UX design

Scope: only the look of the series in `BalanceChart` and its legend swatches. Nothing else on screen changes: no new element, no new copy, no new state, no interaction, no focus change. Structure, states, copy, bar sizes, axes and the text alternative stay exactly as in 013 §5, 015 §5 and 016. Contrast values below are computed by hand (sRGB linearisation, relative luminance L; contrast = (L1 + 0,05) / (L2 + 0,05)); the tester re-checks them with a tool. Chart surface = `--color-surface` (`#ffffff` light, `#1b1f26` dark; L 1,0 and 0,0135).

### 1. Superseded parts of 013 and 015

Replaced by this story (the old sections are not edited):

- 013 UX §5 series table: "Zulagen striped (50 %)", "returns hollow (pale fill, outline)", "loss hollow, dashed outline" - in the normal view every series is a uniform solid fill (§2). The shapes still apply in forced-colours mode (§5).
- 013 UX §8 token roles: "stripe colour", "outline of returns", "dashed outline of loss", "pale fills are decorative" - each `--chart-*` token is now the fill of its series; `--chart-returns-fill` and `--chart-loss-fill` are no longer needed (§3).
- 015 UX §5 and §8: "heavy stripes", "frame" of the reinvested refund - now a plain fill.
- 013 UX §8 and 015 UX §8 rows that give contrast numbers for the old colours (3:1 against the surface stays as a rule, the numbers are in §2).

### 2. Colours (normal view, forced colours off)

Series order in the bar (bottom to top) and in the legend is unchanged: own contributions, Zulagen, reinvested refund (only while checked), returns, then loss (negative returns, drawn over the stack as today). Each series is one opaque fill; the 1 px `--color-surface` stroke between segments stays (it keeps neighbours apart even if two fills were close). No outline in the series colour, no dashes, no pattern.

Design logic: colour alone is not enough (colour-blind readers, greyscale print), so the five fills form a **lightness ladder** in the same rank order in both schemes, and the hues are as far apart as possible (amber, red, green, blue, purple: blue and amber stay separable for the common red-green deficiencies; red and green are separated by a lightness step as well; purple is the darkest in light mode and blue the next, so they differ in lightness and in hue). The ladder from lightest to darkest in the light scheme is Zulagen, loss, returns, contributions, reinvested; the dark scheme has the same rank order (lightest = Zulagen).

**Measurable rule (AC2 minimum difference):** the contrast ratio between the fills of any two of the five series is at least **1,35 : 1** (relative luminance, same formula as WCAG), in each scheme. This is deliberately applied to all ten pairs, not only to current neighbours, because a series can be absent (no Zulagen, refund not reinvested, no loss) and then two other series touch. The designed values reach at least 1,38 : 1 (margin against hand-rounding). Each fill also has at least **3 : 1** against the surface of its scheme. Both rules are checked over the token values (token test) and, for AC1/AC2, on rendered pixels in e2e.

| Series                     | Token                   | Light     | Dark      | L light | L dark | vs surface light | vs surface dark |
| -------------------------- | ----------------------- | --------- | --------- | ------- | ------ | ---------------- | --------------- |
| Own contributions (blue)   | `--chart-contributions` | `#2243ac` | `#5186e8` | 0,073   | 0,246  | 8,5 : 1          | 4,7 : 1         |
| Zulagen (amber)            | `--chart-zulagen`       | `#d17d00` | `#fddf9c` | 0,282   | 0,760  | 3,2 : 1          | 12,7 : 1        |
| Reinvested refund (purple) | `--chart-reinvested`    | `#5f1259` | `#a84ca2` | 0,036   | 0,161  | 12,2 : 1         | 3,3 : 1         |
| Returns (green)            | `--chart-returns`       | `#1f6f3b` | `#4cb66b` | 0,120   | 0,361  | 6,2 : 1          | 6,5 : 1         |
| Loss (red)                 | `--chart-loss`          | `#d8433c` | `#fdaba3` | 0,189   | 0,527  | 4,4 : 1          | 9,1 : 1         |

Pair contrasts (the ten pairs; the lowest per scheme is the tight one):

| Pair                       | Light | Dark |
| -------------------------- | ----- | ---- |
| Zulagen / loss             | 1,39  | 1,41 |
| Loss / returns             | 1,41  | 1,40 |
| Returns / contributions    | 1,38  | 1,39 |
| Contributions / reinvested | 1,44  | 1,40 |
| Zulagen / returns          | 1,96  | 1,97 |
| Loss / contributions       | 1,94  | 1,95 |
| Returns / reinvested       | 1,98  | 1,95 |
| Zulagen / contributions    | 2,70  | 2,74 |
| Loss / reinvested          | 2,79  | 2,73 |
| Zulagen / reinvested       | 3,87  | 3,84 |

Notes:

- Tight pairs (all four ladder steps are within 0,07 of the rule): returns/contributions (light 1,38, dark 1,39), Zulagen/loss (1,39 / 1,41), loss/returns (1,41 / 1,40), contributions/reinvested (1,44 / 1,40). Only returns/contributions touch in a bar when there is neither Zulagen nor a reinvested part; loss is an overlay; the 1 px surface stroke and the hue change separate them as well. The tester re-checks with a tool; if a pair measures under 1,35 the colour moves, not the rule.
- Tightest against the surface: Zulagen light 3,2 : 1 and reinvested dark 3,3 : 1 (rule 3 : 1). Do not lighten the light amber or darken the dark purple; the tester re-checks with a tool.
- Greyscale: the ladder steps are about 8 to 12 points of L\* each in light and about 12 to 15 in dark, so every fill is a different grey; neighbours that normally touch (contributions / Zulagen, Zulagen / reinvested, reinvested / returns) differ by 2,0 : 1 or more in light and in dark.
- Colour is no longer an AC-quoted string or part of any text, so no copy changes. The legend text and the per-year table carry the series names, so the bar fills are not the only way to read the figures (WCAG 1.4.1); the legend order equals the stack order, which also lets a reader map a segment by its position.

### 3. Token changes

All in `apps/avd/src/tokens.css` (app tokens; the platform tokens are untouched):

- Changed values (light and dark): `--chart-contributions`, `--chart-zulagen`, `--chart-returns`, `--chart-loss`, `--chart-reinvested`, to the table in §2 (old: `#1d4ed8`/`#8ab4f8`, `#b45309`/`#f6ad55`, `#1a7030`/`#81c995`, `#b3261e`/`#f28b82`, `#a21caf`/`#f0abfc`).
- Removed: `--chart-returns-fill` and `--chart-loss-fill` (pale hollow fills; no longer painted). If the architect finds another reader, keep them; the UX does not need them.
- Update the comment on the token block: "fills of the series; 3:1 against `--color-surface`; any two differ by 1,35:1".
- No new token. Legend swatches read the same tokens as the bars, so they are equal by construction (AC3). Forced colours need no token (system colours, §5).
- The contrast rule pairs in `tokens.test.ts` change: each of the five tokens against `--color-surface` at 3:1 (unchanged rule, new values); add the ten-pair rule at 1,35:1 per scheme; remove pairs that mention the two removed tokens.

### 4. Layout, states, interactions, copy

- Component tree, states (no result / result / invalid), interactions, copy and the chart's text alternative: unchanged from 013 §1 to §4 and 015/016.
- Swatch: still a 16 px square (`ChartSwatch`), now one uniform fill from the series token with the same 1 px surface stroke as the bar segments. In the normal view it has no frame: every fill has at least 3 : 1 against the surface, so its extent is visible without one (the old `.framed` edge was only for the half-surface striped swatch). In forced colours the framed swatch for stripes stays (§5).
- Hover, focus: none (the chart is not interactive; no tooltip).

### 5. Forced-colours mode (`forced-colors: active`)

Keeps today's shapes exactly, with system colours (decision 4 of the Decision log). Colours are replaced, so identity is by pattern, border and outline:

| Series            | Bar and swatch in forced colours                                 |
| ----------------- | ---------------------------------------------------------------- |
| Own contributions | solid `CanvasText`, 1 px `Canvas` separator                      |
| Zulagen           | stripes 50 % `CanvasText` / `Canvas`, 1 px `Canvas` separator    |
| Reinvested refund | heavy stripes (75 %) `CanvasText` with a 2 px `CanvasText` frame |
| Returns           | hollow: `Canvas` fill, 2 px `CanvasText` outline                 |
| Loss              | hollow: `Canvas` fill, 2 px dashed (4 3) `CanvasText` outline    |
| Striped swatches  | 1 px `CanvasText` frame (as today)                               |

Rules for this block:

- The patterns, frames, hollow fills and dashes exist **only** here. In the normal view no element paints a pattern (AC1 samples pixels inside a segment: stripes would fail it). The forced-colours rules must therefore switch the fill to the pattern and add the strokes; the series classes in the normal view carry only the token fill and the 1 px separator.
- The block must keep winning over the normal-view rules (same specificity, later in the file, or `:where()` as in CLAUDE.md "Styling").
- No series is invisible against the canvas: every fill is `CanvasText` or an outlined hollow with a `CanvasText` outline (AC4). Grid stays `GrayText`, baseline `CanvasText`, as today.

### 6. Accessibility

- No change to semantics, roles, accessible names, keyboard flow, focus or live regions: the chart is non-interactive, aria-hidden decoration is as before, and the text alternative and the table carry the data. AC5 asks that they are byte-identical.
- Colour contrast: every fill 3 : 1 or more against the surface in both schemes (UI-graphics rule, WCAG 1.4.11); the numbers are in §2. The 1 px separators in `--color-surface` are not required to reach any contrast.
- Colour is not the only cue between a bar segment and its legend entry: the same rank order in bar and legend, plus the lightness ladder (§2), plus in forced colours the patterns (§5).
- Reduced motion: nothing animates, no rule needed.

### 7. Responsive behaviour

- No change in layout. Below 600 px the plot is 200 px high and the axis column 52 px; the bars become narrow (slot at least 8 px) and the 1 px separator still applies. Solid fills read better at that width than stripes did (no moiré or aliasing); no change of stripe pitch is left to specify.
- Legend: the 16 px swatches wrap as today.

### 8. Dark mode

Both schemes are specified in §2 (every new colour has a light and a dark value with contrast). The dark fills are lighter than the light fills so they stay at 3 : 1 or more on `#1b1f26`; the rank order of lightness is the same in both schemes. The surface separator is `--color-surface` in both. Forced colours use system colours and need no scheme values.

### 9. For the architect and tester

- Rendered-pixel checks (AC1): sample inside each segment away from its 1 px stroke; fills equal the token colour of the scheme (opaque, no overlays).
- AC2 is checked on the token values (hex) and on sampled pixels; the two rules are "each at least 3 : 1 against the surface" and "any two at least 1,35 : 1".
- AC4 checks run with `forcedColors: 'active'`; pixel comparison between series (stripes vs solid vs hollow) is needed, not only class names.

## Technical design

### Overview

A CSS change of one chart: in the normal view every series class paints its token as a solid fill with
the 1 px `--color-surface` separator; the stripes, frames, hollow fills and dashes move into the
existing `@media (forced-colors: active)` block of `BalanceChart.module.css`. The `<pattern>` elements
stay in the SVG (unused in the normal view). The pattern URL reaches CSS through two inline custom
properties on the chart section, so CSS alone decides between colour and pattern in both modes. Five
token values change (UX §2), two tokens go, the token test gets the AC2 pairs. No data, geometry, copy
or markup structure change; no new dependency, no new ADR (ADR 0007 names no fill styles; this is
cheap to reverse).

### Files

| File                                          | Change                                                                                                                                                                                                                                                                             |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/tokens.css`                              | the five `--chart-*` values of UX §2 (light and dark); `--chart-returns-fill` and `--chart-loss-fill` removed (no other reader: only `BalanceChart.module.css` reads them); block comment per UX §3                                                                                |
| `src/tokens.test.ts`                          | `SERIES` list; `PAIRS` generated from it (5 fills vs surface at `NON_TEXT`, all 10 fill pairs at `SERIES_DISTINCT = 1.35`); `undefinedVarProblems(…, ['--zulagen-stripes', '--reinvested-stripes'])`                                                                               |
| `src/features/saving/BalanceChart.module.css` | normal view: solid token fill + 1 px surface stroke for all five series; `.stripe`, `.stripeGap`, `.heavyStripe` and `.legend .framed` only inside the forced block; forced block keeps today's shapes and now also sets the pattern fills, 2 px widths and the loss dashes itself |
| `src/features/saving/BalanceChart.tsx`        | `segmentFill` and the rect `fill` attribute removed; the `<section>` gets `style` with `--zulagen-stripes` / `--reinvested-stripes` = `url(#…)`; swatches lose the `fill` prop; comments (pattern constants: "forced colours only")                                                |
| `src/features/saving/ChartSwatch.tsx`         | `fill` prop removed; fill and outline come only from the series class                                                                                                                                                                                                              |
| `e2e/avd.helpers.ts`                          | new shared helpers (see test set): series token colours, bar centre-column colour runs, legend swatch by name, computed paint signature                                                                                                                                            |
| `e2e/avd-chart-colours.spec.ts` (new)         | one test per AC1, AC3, AC4                                                                                                                                                                                                                                                         |

Unchanged on purpose: `logic/chartGeometry.ts` and the rect `x`/`y`/`width`/`height` expressions in
`BalanceChart.tsx` (AC5 silhouette), the legend markup and texts, the `aria-label`, the
`{reinvest && <pattern …>}` condition (so the unchecked SVG keeps its node count, 015/AC1 pixel
round-trip).

### Key types and markup

```tsx
// BalanceChart.tsx: CSS picks colour or pattern; only the pattern URL comes from React (useId).
type PatternVars = CSSProperties & Record<'--zulagen-stripes' | '--reinvested-stripes', string>;
const patternVars: PatternVars = {
  '--zulagen-stripes': `url(#${patternId})`,
  '--reinvested-stripes': `url(#${heavyPatternId})`,
};
<section className={styles.section} aria-labelledby={headingId} style={patternVars}>
  …
  <Swatch className={`${styles.zulagen} ${styles.framed}`} />   {/* framed: forced colours only */}
  <Swatch className={styles.reinvested} />
  …
  <rect className={segmentClass(segment)} x=… y=… width=… height=… vectorEffect="non-scaling-stroke" />

// ChartSwatch.tsx
export interface ChartSwatchProps {
  /** The series class of BalanceChart.module.css (fill and outline in both modes). */
  readonly className?: string | undefined;
}
```

The custom properties sit on the section, so they inherit into the plot SVG and the legend swatch
SVGs; the swatches keep referencing the plot's `<defs>` by id, as today (the reinvested swatch and
pattern both exist only while checked).

```css
/* Normal view (UX §2): one solid fill per series, 1 px surface separator, no pattern or dash. */
.contributions,
.zulagen,
.reinvested,
.returns,
.loss {
  stroke: var(--color-surface);
  stroke-width: 1px;
}
.contributions {
  fill: var(--chart-contributions);
}
.zulagen {
  fill: var(--chart-zulagen);
}
.reinvested {
  fill: var(--chart-reinvested);
}
.returns {
  fill: var(--chart-returns);
}
.loss {
  fill: var(--chart-loss);
}

/* Forced colours (UX §5): today's shapes, the only place with patterns, frames and dashes. */
@media (forced-colors: active) {
  .svg,
  .swatch {
    forced-color-adjust: none;
  }
  .contributions {
    fill: CanvasText;
    stroke: Canvas;
  }
  .zulagen {
    fill: var(--zulagen-stripes);
    stroke: Canvas;
  }
  .reinvested {
    fill: var(--reinvested-stripes);
    stroke: CanvasText;
    stroke-width: 2px;
  }
  .returns,
  .loss {
    fill: Canvas;
    stroke: CanvasText;
    stroke-width: 2px;
  }
  .loss {
    stroke-dasharray: 4 3;
  }
  .stripe,
  .heavyStripe {
    fill: CanvasText;
  }
  .stripeGap {
    fill: Canvas;
  }
  .legend .framed {
    stroke: CanvasText;
  }
  /* .grid, .baseline as today */
}
```

The forced block has the same specificity as the normal rules and comes later in the file, so it
wins (UX §5); no `:where()` needed. `.legend .framed` (two classes) beats `.zulagen` for the Zulagen
swatch frame, as today.

### Data flow and state ownership

Unchanged: `SavingCalculator` owns `reinvest` and the inputs; `BalanceChart` derives everything from
`rows` via `chartGeometry`. The only new value is `patternVars`, derived from `useId` per render.

### Why a custom property, not the `fill` attribute

A CSS `fill` always overrides the SVG `fill` presentation attribute, and CSS can't restore the
attribute in one media block, so "solid in the normal view, attribute pattern in forced colours"
would rely on the forced block _not_ setting `fill` on two classes (a silent trap). Patterns in CSS
need the `useId`-based id, which only React knows; hence the inline custom property (precedent:
`--cols`/`--rows` in the minesweeper `Board`, allowed in its token test). Spiked in the scratchpad
with Playwright Chromium: `fill: var(--zulagen-stripes)` with `--zulagen-stripes: url(#id)` set on an
ancestor paints the stripes under `emulateMedia({ forcedColors: 'active' })` in the plot and in a
separate swatch SVG, also with the stylesheet in another directory and minified like the production
build; with forced colours off the computed fill is the token colour.

### Error handling

None (no I/O). A missing custom property would make `fill` invalid at computed time (black); AC4's
swatch pixel check would show it.

### Alignment with UX

- Palette of UX §2 recomputed with the token-test formula: all ten pairs ≥ 1.376 (light) / 1.386
  (dark), lowest vs surface 3.16 (Zulagen light) / 3.32 (reinvested dark): all rules hold. I also
  checked that no blend of two fills (or a fill and the surface) lies within 12 per channel of a third
  series colour, so `chartSeriesPixels` counts in the 013/015 specs stay unambiguous.
- UX §2 applies 1,35:1 to all ten pairs; the token test generates all ten, so "pairwise different"
  (AC2) follows without a separate check.
- UX §9 asks for AC2 also on sampled pixels: the AC1 e2e test asserts that every rendered segment
  colour equals its scheme's token colour (within measured noise). Together with the token test this
  shows AC2 on screen without testing the contrast numbers twice (checklist T2).
- UX §3 "keep the removed tokens if another reader exists": none exists; they go.
- UX §4 swatch: 1 px surface stroke, no frame in the normal view; `framed` stays as a forced-colours-only
  class.
- UX §9 asks for pixel comparisons between series in forced colours: AC4 compares all five swatches
  pairwise by pixels (they use the bars' classes) and checks the solid / stripes / hollow sequence on
  one bar's pixels; computed signatures only add the per-series count in the bars.

### Risks and mitigations

1. **Cascade order:** a normal-view rule placed after the forced block, or a new `fill` on a series
   class in another selector, kills the forced shapes. Keep all series rules above the block; AC4
   test catches it (signatures and swatch pixels).
2. **Anti-aliasing at fractional segment edges** (`preserveAspectRatio="none"`): pixel checks ignore
   runs shorter than 3 px and compare colours within the measured noise (tester states it in a
   comment, as for `differingPixels`).
3. **Short segments:** scenario replay in the scratchpad (geometry of the real modules, 200 px plot):
   reference unchecked shows contributions 115 px, Zulagen 35 px, returns 28 px; reference checked
   at 42 %: reinvested 21 px; return −1 %, costs 0,5 %, checked, 42 %: Zulagen 35 px, reinvested
   15 px, loss 10 px. Return −10 % hides Zulagen (1.4 px) and reinvested (0 px) under the loss
   overlay: don't use it for AC1/AC4.
4. **Tight token margins** (1.376 vs 1.35): if the tester's tool measures below, UX moves the colour,
   not the rule (UX §2).
5. **The 013/015 specs** (`chartSeriesPixels` > 50 / = 0, screenshot equality, `differingPixels`)
   don't depend on stripes or hollow shapes: solid fills only add token-coloured pixels, and the
   reinvested colour is not reachable by blends (see Alignment). No existing assertion changes; no
   e2e spec walks `parentElement` / `locator('..')` from chart markup (the only `locator('..')` is in
   the platform auth spec).

### Implementation plan

1. `tokens.css`: UX §2 values, remove the two pale tokens, comment per UX §3.
2. `tokens.test.ts`: `SERIES`, generated `PAIRS`, allowed custom properties; run it (it must fail on
   the old values before step 1 if done first).
3. `BalanceChart.module.css`: normal rules and forced block as above; update the header comment.
4. `BalanceChart.tsx` and `ChartSwatch.tsx`: drop `segmentFill` and `fill`, add `patternVars` on the
   section; update the stripe-constant comments ("forced colours only").
5. Check by eye in light, dark and forced colours at 375 and 1280 px; `npm run verify -w apps/avd`.
6. Tester: helpers and `avd-chart-colours.spec.ts`; full `npm run test:e2e -w apps/avd`.

### Minimal test set

Scenarios (inputs via the UI): **S1** reference (`setReference`), unchecked; **S2** S1 + rate 42 %,
checked; **S3** S2 with return −1 % (costs 0,5 %). Union of S1–S3 = all five series.

Unit (`src/tokens.test.ts`):

- `017/AC2`: every `SERIES` fill ≥ 3:1 against `--color-surface` and every one of the 10 fill pairs ≥
  1.35:1, in light and dark (`contrastProblems`). The test asserts the generated list has 15 pairs, so
  it can't pass vacuously. Mutation probes (not kept): one dark value moved under 1.35 against one
  neighbour fails; a dark-only leftover token fails parity.

e2e (`e2e/avd-chart-colours.spec.ts`; helpers in `avd.helpers.ts`):

- `AC1`: for `colorScheme` light and dark × S1, S2, S3: in the plot (`chart(page).locator('svg > rect')`,
  structural, no class), every bar's centre column is scanned from the baseline to the bar top on the
  chart screenshot; every run ≥ 3 px has the colour of one series token of the current scheme (read via
  computed style, as in `chartSeriesPixels`) and consecutive long runs differ (stripes and a surface
  gap inside a segment fail; a hollow pale fill fails). Non-vacuous: per scheme the union of run colours
  is all five series. Plus every bar rect's computed `stroke-dasharray` is `none`.
- `AC3`: in S1, S2 and S3 the legend items of the region "Verlauf des Kontostands" (exact) have the
  texts and order of 013/015 (reinvested only in S2/S3, loss only in S3); in S3 each of the five
  swatches (found by its item's exact text) is one colour inside a 2 px inset of its screenshot, equal
  to the colour of that series' runs in the bars, and its computed `stroke-dasharray` is `none`.
- `AC4`: `emulateMedia({ forcedColors: 'active' })`, S2 and S3: the computed signatures (fill, stroke,
  stroke-width, stroke-dasharray) of the bar rects give exactly one distinct signature per series drawn
  (4 in each state, 5 over both), each with fill or stroke ≠ the computed `Canvas`; in S3 the five
  swatch screenshots differ pairwise by more than the measured noise (`differingPixels`) and each
  contains `CanvasText` pixels; and the centre column of the last bar in S3 (AC1 helper) shows, from
  the baseline up, a long `CanvasText` run (solid), then alternating `CanvasText`/`Canvas` runs
  (stripes), and a `Canvas` run inside the bar's extent at the top (hollow loss). Shapes, not exact
  run lengths, are asserted.
- `AC5`: no new test. The 013–016 specs run unchanged (figures, table, label, comparison, 014/AC5
  rate-only pixel equality). Probe, not kept: the `x`/`y`/`width`/`height` attributes of all bar rects
  for S2 and S3 are identical on `main` and on the branch; the reviewer confirms `chartGeometry.ts`
  and the rect geometry expressions are untouched.

No component tests (e2e shows the UI).

## Implementation notes

_developer: what was built, deviations from the design and why._

Built as designed (steps 1 to 5 of the implementation plan):

- `src/tokens.css`: the five `--chart-*` values of UX §2 (light and dark); `--chart-returns-fill` and
  `--chart-loss-fill` removed (no other reader); block comment per UX §3.
- `src/tokens.test.ts`: `SERIES` list and `SERIES_DISTINCT = 1.35`; `PAIRS` generated from it (5 fills
  vs `--color-surface` at `NON_TEXT`, all 10 fill pairs at 1.35). The old "contrast pairs hold" test is
  replaced by `017/AC2: …`, which also asserts the 15 pairs (non-vacuous); `undefinedVarProblems`
  allows `--zulagen-stripes` / `--reinvested-stripes`. The test failed on the old values before the
  tokens changed (all 10 pair rules in both schemes).
- `BalanceChart.module.css`: normal view = one shared rule (1 px `--color-surface` stroke) plus a solid
  token fill per series class; `.stripe`, `.stripeGap`, `.heavyStripe` and `.legend .framed` exist only in
  the forced-colours block, which now also sets the pattern fills (`var(--zulagen-stripes)`,
  `var(--reinvested-stripes)`), the 2 px widths and the loss dashes. The block stays last in the file.
- `BalanceChart.tsx`: `segmentFill` and the rect `fill` attribute removed; `PatternVars` on the
  `<section>` `style`; swatches lose `fill`; pattern constants commented "forced colours only". Rect
  geometry expressions, `chartGeometry.ts`, legend markup/texts, `aria-label` and the
  `{reinvest && <pattern>}` condition untouched.
- `ChartSwatch.tsx`: `fill` prop removed.

Checked by eye (throwaway Playwright script, S1 to S3) in light, dark and forced colours at 375 and
1280 px: solid fills in both schemes, forced colours show solid / stripes / heavy framed stripes /
hollow / dashed hollow in bars and swatches as before; computed styles per series as in UX §5; no
horizontal overflow. Note: in the normal view the unused `<pattern>` rects have no fill rule (they
compute to black); they are never painted there.

Deviations: none. Not done by the developer: `e2e/avd.helpers.ts` helpers and
`e2e/avd-chart-colours.spec.ts` (implementation plan step 6, tester's files). The 013 to 016 specs pass
unchanged.

## Test report

_tester: AC → test mapping, results, defects found._

| AC  | Test(s)                                                                                                                                                                                                                                                                                                                                                                                                    | Result |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| AC1 | `apps/avd/e2e/avd-chart-colours.spec.ts`: `AC1: every segment is one uniform token colour in the light scheme, …` and `… in the dark scheme, …` (S1, S2, S3; centre-column runs of every bar on the screenshot, each run = one series token, neighbours differ, all five series seen, `stroke-dasharray` none)                                                                                             | PASS   |
| AC2 | `apps/avd/src/tokens.test.ts`: `017/AC2: every series fill has 3:1 against the surface and 1.35:1 against every other fill` (15 pairs, both schemes); on screen via AC1 (runs equal the tokens). Re-checked with a Python WCAG calculation: lowest fill/surface 3.16 (Zulagen light) and 3.32 (reinvested dark); lowest pair 1.376 light, 1.386 dark (contributions/returns); all UX §2 numbers reproduced | PASS   |
| AC3 | `avd-chart-colours.spec.ts`: `AC3: legend texts and order as before, and each swatch is the uniform colour of its series in the bars` (light and dark; texts/order in S1-S3; swatch interior pixels equal the bar colour, `stroke-dasharray` none)                                                                                                                                                         | PASS   |
| AC4 | `avd-chart-colours.spec.ts`: `AC4: in forced colours every series differs by pattern, border or outline, in bars and swatches` (4 distinct computed signatures in S2 and S3, 5 over both, none invisible; five swatches differ pairwise by pixels and contain CanvasText; last bar: solid run, stripe alternations, Canvas top for the hollow loss)                                                        | PASS   |
| AC5 | Unchanged 013-016 specs (all green) plus a one-time probe, not kept: `x`/`y`/`width`/`height` of all bar rects in S2 and S3 byte-identical on `main` (git archive copy) and on the branch (2389 bytes of JSON, `cmp` identical); diff shows `chartGeometry.ts` untouched                                                                                                                                   | PASS   |

Tests added: 4 e2e tests in the new `avd-chart-colours.spec.ts` (AC1 runs once per scheme, so 2 + AC3 + AC4), plus helpers in `avd.helpers.ts` (`setScenario`, `barRuns`, `swatchOf`, `innerPixels`, `barSignatures`, `colourOf`, `legend`). The token test is the developer's.

Results: `npm run verify` exit 0. Vitest per workspace: template skeleton 5 passed (2 files); platform 154 passed (15 files); avd 100 passed (11 files); minesweeper 95 passed (12 files). `npm run test:e2e -w apps/avd`: 80 passed (project `platform` 41, project `chromium` 39).

Mutation checks (CSS restored afterwards, `diff` clean), each failed the named tests:

- stripe pattern back in the normal view (`.zulagen` fill = pattern): both AC1 tests and AC3 fail.
- a normal rule placed after the forced block: AC4 fails.
- dashed loss outline in the normal view: both AC1 tests and AC3 fail.
- returns drawn at 50 % opacity: AC1 (both), AC3 and AC4 fail.
- forced block without the loss dashes: AC4 fails (signature count and swatch pair).
- forced block with Canvas instead of CanvasText for own contributions: AC4 fails.

Checked, OK (probes, not kept): dark and light shades read from rendered pixels equal the computed tokens exactly (measured noise 0 per channel; tolerance 1 absorbs engine rounding); anti-aliased edges and 1 px separators are runs under 3 px and ignored, segments up to 4 px high are only blends (measured 3 px `other` runs) and are skipped by `minLength` 5; swatch pixels at inset 2 blend with the 1 px stroke (145,161,214), so the check uses inset 3; S3 draws no `returns` segment (negative returns), so AC3 collects bar colours over S1-S3; forced-colours emulation resolves `Canvas` white and `CanvasText` black in Chromium; no horizontal overflow or layout change visible in the shots.

Not run, open (no agent can run them): real iPhone (Safari rendering of the fills), Windows high-contrast on a real machine, greyscale print of the chart (the lightness ladder is only verified by calculation: every pair of fills at least 1.376:1 in relative luminance).

Review nits fixed (2026-11-08): one colour resolver (`colourOf`, used by `barRuns` and `chartSeriesPixels`); bar rects scoped to `chart(page)`; `legend` now returns only the legend list; AC1 checks the dash via `barSignatures`; AC3 compares each S3 swatch with `colourOf(token)` and checks legend texts once; one `LEGEND_TEXT` constant; `differingPixels` at its default tolerance (measured noise <= 1/255); mutation (zulagen fill = stripe pattern in the normal view) fails both AC1 tests and AC3, CSS restored; verify green, e2e 80 passed (chromium 39, platform 41).

Screenshots (taken after the last e2e run): `screenshots/017/` with `light-S1.png`, `light-S3.png`, `dark-S1.png`, `dark-S3.png`, `forced-S1.png`, `forced-S3.png` (chart region with legend; S1 = reference unchecked, S3 = 42 %, reinvested, -1 % return with loss).

Defects: none.

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

**Round 1, reviewer 2026-11-08. Verdict: APPROVED. Checklist version: 2**

| Item | Result | Note                                                                                                                                                                                                                                                                                        |
| ---- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1   | pass   | AC1: `BalanceChart.module.css` series rules (solid token fill + 1 px surface stroke) → AC1 tests (light, dark); AC2: `tokens.css` + `tokens.test.ts` 017/AC2; AC3: `ChartSwatch` uses the series class → AC3 test; AC4: forced block + `patternVars` → AC4 test; AC5: only `fill` attr gone |
| C2   | n.a.   | no network call or pending state in the diff                                                                                                                                                                                                                                                |
| C3   | pass   | `patternVars` derived per render from `useId`, not stored; no hook or effect added                                                                                                                                                                                                          |
| C4   | n.a.   | no render loop or imperative controller; the pattern vars are inline on the section in every render                                                                                                                                                                                         |
| C5   | n.a.   | no reducer changed                                                                                                                                                                                                                                                                          |
| C6   | n.a.   | no error handling or I/O                                                                                                                                                                                                                                                                    |
| S1   | pass   | `url(#…)` built only from sanitised `useId` (`[^\w-]` stripped); no user input reaches style or DOM sinks                                                                                                                                                                                   |
| S2   | n.a.   | no config, env or auth code changed                                                                                                                                                                                                                                                         |
| S3   | n.a.   | `package.json` dependencies unchanged                                                                                                                                                                                                                                                       |
| S4   | n.a.   | no dev-only code added (`check:dist` ok)                                                                                                                                                                                                                                                    |
| S5   | n.a.   | no script, skeleton or generated code touched                                                                                                                                                                                                                                               |
| T1   | pass   | `npm run verify` exit 0 (vitest 5/154/100/95); `npm run test:e2e -w apps/avd` 80 passed (new spec 4/4)                                                                                                                                                                                      |
| T2   | pass   | one e2e test per AC1/AC3/AC4, AC2 in the token test, AC5 by the 013-016 specs; overlap of AC3 with AC1 is finding 4 (nit)                                                                                                                                                                   |
| T3   | pass   | `PAIRS` length 15 asserted; AC1 requires all five series seen per scheme; colours read from computed tokens, not hex; tolerance 1 backed by measured 0; one unbacked tolerance is finding 3 (nit)                                                                                           |
| T4   | pass   | no Tab counting; bar boxes read from the DOM, no fixed coordinates; chart static; tests named after ACs                                                                                                                                                                                     |
| T5   | n.a.   | no new logic with branches in app code (only CSS and a removed helper)                                                                                                                                                                                                                      |
| K1   | fail   | matches the design (CSS, `PatternVars`, swatch prop removal, `.legend .framed` forced only); helper duplication is findings 1 and 2 (nits)                                                                                                                                                  |
| K2   | pass   | `className?: string \| undefined` kept, no `any`/`!`, named exports, `PatternVars` typed via `CSSProperties & Record<…>`                                                                                                                                                                    |
| K3   | pass   | only tokens and system colours; no new literal; dark values only in `tokens.css`; forced block last in the file (also last in the built CSS, checked in `dist/`)                                                                                                                            |
| K4   | n.a.   | no platform or factory file changed                                                                                                                                                                                                                                                         |
| K6   | pass   | story `status: in-review`, index row `in-review`                                                                                                                                                                                                                                            |
| K7   | pass   | hak's request, the gate-1 answer "Ja, alle passen" and the status change are logged, append only                                                                                                                                                                                            |
| K8   | n.a.   | excluded from this round by the orchestrator: README/CHANGELOG are written by the tech-writer in parallel                                                                                                                                                                                   |
| K9   | pass   | prettier check inside `npm run verify` green                                                                                                                                                                                                                                                |
| K10  | n.a.   | no workspace script or tsconfig changed                                                                                                                                                                                                                                                     |
| K11  | n.a.   | no env variable added                                                                                                                                                                                                                                                                       |
| A1   | n.a.   | no control, focus, label or live region changed (legend markup and `aria-label` unchanged)                                                                                                                                                                                                  |
| A2   | pass   | recomputed: min fill/surface 3.161 (light) / 3.322 (dark), min pair 1.376 / 1.386; chart panel is `--color-surface`; forced colours keep shapes, AC4 checks bars and swatches by pixels                                                                                                     |
| A3   | n.a.   | no animation or announcement changed                                                                                                                                                                                                                                                        |
| A4   | n.a.   | no render loop or canvas changed                                                                                                                                                                                                                                                            |

Findings:

1. `[nit] apps/avd/e2e/avd.helpers.ts:391 - colourOf has the same body as resolve inside barRuns (line 275) and nearly the same as rgb in chartSeriesPixels (line 110); the PNG-to-canvas decode is now in four helpers - resolve the palette with colourOf before the page.evaluate in barRuns and pass RGB triples in, so one resolver remains`
2. `[nit] apps/avd/e2e/avd.helpers.ts:267, :382 and avd-chart-colours.spec.ts:53 - the rect selector [role="img"] svg > rect is repeated three times and is page-wide instead of scoped to chart(page); the spec's dash check repeats what barSignatures already returns (strokeDasharray). legend (line 202) returns the whole chart region, not the legend - use chart(page).locator('svg > rect') in both helpers, read the dash from barSignatures, and name the helper chartRegion or scope it to the list`
3. `[nit] apps/avd/e2e/avd-chart-colours.spec.ts:157 - differingPixels(…, 8): tolerance 8 has no measured maximum channel noise behind it (the comment gives a pixel count, not a channel delta; the helper default is 2) - use the default or state the measured max channel noise next to the 8`
4. `[nit] apps/avd/e2e/avd-chart-colours.spec.ts:78-88 - AC3 re-scans every bar of S1-S3 in both schemes (AC1's work) only to learn each series' bar colour, and checks the scheme-independent legend texts twice; AC1 already shows bar = token colour - compare each S3 swatch with colourOf(page, token) per scheme and check texts/order once (about half of the 2.3 s)`
5. `[nit] apps/avd/e2e/avd-chart-colours.spec.ts:67-96, 139-145 - the five legend texts are written three times (items, names record, names array) - one constant series → legend text, from which the order lists are derived`

No blocker, major or minor. Geometry: `chartGeometry.ts` untouched; in `BalanceChart.tsx` the rect `x`/`y`/`width`/`height`
expressions, legend texts, the `aria-label` and the `{reinvest && <pattern>}` condition are unchanged; only the `fill`
attribute and `segmentFill` went. The forced block wins by order at equal specificity in source and in the built CSS.

## Explanation

The balance chart no longer uses stripes, framed stripes or hollow and dashed bars in the normal view.
Each part of a bar now has one solid colour: contributions, Zulagen, reinvested refund, returns and loss.
The colours step from light to dark in the same order in light and dark mode and also differ in hue.
So colour-blind readers and greyscale prints can still tell neighbouring parts apart.
Every colour reaches at least 3:1 against the background; any two colours differ by at least 1.35:1.
A stricter 1.5:1 rule is not possible with five colours that all keep 3:1 against a white background.
The legend uses the same colours as the bars; texts and order are unchanged.
In Windows high-contrast mode the old shapes stay, because there the system replaces all colours.
Bar sizes, figures, table and comparison are unchanged; bar positions were compared with the main branch.
A token test enforces both contrast rules; new pixel tests check light, dark and high-contrast rendering.
Six deliberately broken variants (stripes back, wrong rule order, dashes, ...) were each caught by a test.
After review: the test helpers were tidied up, with one colour lookup instead of three.
Risks: the closest colour pair is only just above the 1.35:1 rule.
Not verified: a real iPhone, high-contrast mode on a real Windows machine, and a real greyscale print.

## Retrospective

**What went wrong**

- Little. Gate 1 had one open question because hak started the story without commenting on the proposed
  approach (patterns only in forced colours); hak accepted all proposals. Tester PASS and review APPROVED in
  round 1, no defects.
- **Review nits on e2e helpers.** The new pixel helpers brought a third colour resolver and a page-wide selector,
  and one tolerance was not backed by measured noise. Root cause: copied helpers keep coming back (014, 016, 017);
  this time the tester wrote the helpers, and the duplicate check of 016/P2 exists only for the developer. The
  tolerance rule exists in CLAUDE.md and was missed. Fixed by one tester run.
- **Index formatting.** The developer had to re-run prettier after a status change widened the index table.

**Proposed changes**

- **P1 (CLAUDE.md, Shared e2e helpers; reviewer):** add "Helpers that read pixels or resolve colours share one
  resolver; values are resolved outside `page.evaluate` and passed in, never re-resolved per helper."
- **P2 (`.claude/agents/tester.md`):** the same step as developer 016/P2: before reporting, grep the app's e2e specs
  and `e2e/<app>.helpers.ts` for helpers with the same body and merge them.
- **P3 (CLAUDE.md, Styling; ux-designer and architect):** add "A chart series may be a plain colour in the normal
  view when a token test enforces its contrast against the surface and against every other series; the non-colour
  cue then lives in the forced-colours block. A paint that differs by media query is chosen in CSS; a value only
  React knows (`url(#useId)`) is passed as an inline custom property, never as the `fill` attribute."
- **P4 (CLAUDE.md, Conventions/Stories; developer):** "After changing a status in `docs/backlog/README.md`, run
  `npx prettier --write docs/backlog/README.md`."

**Outcome (gate 2, 2026-11-08):** hak approved all proposals. P1, P3 and P4 applied to CLAUDE.md, P2 to `.claude/agents/tester.md` (new step 5), by devops. Manual checks stay not run, open.

Agent memory diffs of this story were checked; all lessons are role-specific and look right.

### Cost

| Role                        | Round | Model  | Tokens       | Tool uses | Duration |
| --------------------------- | ----- | ------ | ------------ | --------- | -------- |
| product-owner               | 1     | sonnet | 53403        | 17        | 0:59     |
| product-owner               | 2     | haiku  | 30068        | 9         | 0:15     |
| architect                   | 1     | opus   | 143506       | 42        | 9:14     |
| ux-designer                 | 1     | sonnet | 59923        | 12        | 3:04     |
| developer                   | 1     | opus   | 82728        | 32        | 4:17     |
| tester                      | 1     | sonnet | 98584        | 26        | 6:23     |
| reviewer                    | 1     | opus   | 99753        | 20        | 3:26     |
| tech-writer                 | 1     | haiku  | 59275        | 9         | 0:25     |
| tester                      | 2     | sonnet | 55240        | 13        | 2:00     |
| devops                      | 1     | haiku  | 32576        | 13        | 0:31     |
| total (measured)            |       |        | 715056       | 193       | 30:34    |
| orchestrator (main session) |       | opus   | not measured | n/a       | n/a      |

The architect stands out (a Chromium spike for pattern fills in forced colours plus geometry replay).
