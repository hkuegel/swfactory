---
name: end-effects-design-rules
description: Rules for designing explosion/confetti style end effects in the rendered 3D scene (flash limits, light vs dark colours, scaling)
metadata:
  type: feedback
---

- One luminance flash per game end at most, none from chained events (mine reveals, sparks); shake = one decaying translation cycle (about 2.5 Hz, 3 to 5 px), never a rattle, so the "3 flashes per second incl. shake" AC holds by construction.
- Confetti pieces carry the same colour on both faces and only change width when they turn; otherwise a turning piece flickers.
- In the light scheme the table rim is dark and the tiles are near white: confetti needs mid luminance (0.18 to 0.31) to show on both, so do not reuse the dark digit colours; in dark the pastel `--n*` hex values can be reused. A flash cannot be brighter than ivory tiles: carry the bang by dark smoke, ring, shards and shake.
- Make the last frame of an effect identical to the static final board and to the reduced-motion picture; then "ends by X s", "no replay" and "reduced motion" are one pixel check.
- Confine effects to the canvas (aria-hidden) and add no DOM and no announcement; the result message and timer are DOM and appear at t = 0.
- Large scrolling boards: place confetti by the visible window of the scroller, not by the whole board; tell the architect the scene needs the scroll window.
- Keep 300 to 400 ms of slack under each AC duration limit; a hidden tab, scheme or motion change ends a running effect at once (no replay), never by a frame-gap watchdog: a slow frame must not cut a closed-form effect before it is seen (story 010, review round 1).
