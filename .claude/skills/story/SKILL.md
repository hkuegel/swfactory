---
name: story
description: Refine an idea into a user story with acceptance criteria in docs/backlog/ (product-owner only, no design or code).
argument-hint: <idea>
disable-model-invocation: true
---

Idea: $ARGUMENTS

Delegate to the `product-owner` subagent to create the story in `docs/backlog/`; pass
the idea **verbatim** so it lands in "Original request".
Then show hak the story path, the user story, the ACs and any open questions. If hak
answers questions or asks for changes, send them back to `product-owner` to update the
story and its Decision log. Don't start design or implementation.
When hak approves the story, ask whether to commit it on `main`
(`docs(backlog): add story NNN – <title>`).
