---
name: chart-colour-ladder
description: How to pick N solid chart fills that survive colour blindness, greyscale and 3:1 on the surface
metadata:
  type: feedback
---

For solid series colours use a lightness ladder in the same rank order in light and dark, plus distinct hues; state a rule over ALL pairs (not only current neighbours), because absent series make others touch (story 017).

**Why:** on a white surface 3:1 caps luminance at about 0.30, so five fills fit only about 1.4:1 steps (levels L+0.05 from 0.33 to 0.086); a 1.5 rule is infeasible with a believable hue set, 1.35 is the workable rule.

**How to apply:** compute levels first (top = amber at L about 0.28, bottom = deep purple at L about 0.036), assign the lightest to the series that normally touches the darkest ones, then pick hexes; list the ten pair contrasts in the story; patterns survive only in forced-colours.
