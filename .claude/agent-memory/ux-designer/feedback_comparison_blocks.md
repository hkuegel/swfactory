---
name: comparison-blocks-and-copy-collisions
description: Rules for side-by-side result blocks and duplicate AC phrases in the avd app (story 016)
metadata:
  type: feedback
---

- Two figure blocks with label-left/value-right rows go side by side only from 900 px; at 600 to 899 px each block is about 230 px wide and labels wrap to three lines (story 016).
- A new result region next to an existing one: name it without the old region's name (getByRole region name is a substring match), give blocks `role="group"` named by their h3 (no extra landmarks) and tell tests to use `exact: true` when one heading is a substring of another (story 016).
- When an AC requires the same phrase in two places (block note and general note), start one with the phrase and the other with a unique prefix ("Hinweis zum Vergleich:"), and list the scoping for the tester (story 016).
- Show a derived row (e.g. kept refund) when without it the visible figures do not add up to the yield; drop other optional rows to stay lean (story 016).
- formatEuro writes a hyphen-minus, the story prose uses U+2212: tell the tester to match `[-−]` (story 016).
- Heading inside a grid form (sub-heading between control groups): plain h3 spanning both columns, no fieldset, not inside field components (story 016).
