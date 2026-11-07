---
name: story
description: Refine an idea into a user story with acceptance criteria in a backlog (docs/backlog/ or apps/<name>/docs/backlog/; product-owner only, no design or code).
argument-hint: <idea>
disable-model-invocation: true
---

Idea: $ARGUMENTS

If the idea refers to real-world rules (a law, a product, a standard), research the primary
sources first and pass them to the `product-owner`; the story's Context cites them.

Delegate to the `product-owner` subagent to create the story in `docs/backlog/` (platform)
or `apps/<name>/docs/backlog/` (an app); pass the idea **verbatim** so it lands in
"Original request" and say which backlog. If the idea doesn't make it obvious, ask hak
first: the platform or which app?
Then show hak the story path, the user story, the ACs and any open questions. If hak
answers questions or asks for changes, send them back to `product-owner` to update the
story and its Decision log. Don't start design or implementation.
When hak approves the story, ask whether to commit it on `main`
(`docs(backlog): add story NNN – <title>`).
