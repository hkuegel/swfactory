---
name: story
description: Refine an idea into a user story with acceptance criteria in docs/backlog/ (product-owner only, no design or code).
argument-hint: <idea>
disable-model-invocation: true
---

Idea: $ARGUMENTS

Delegate to the `product-owner` subagent to create the story in `docs/backlog/`.
Then show hak the story path, the user story, the ACs and any open questions. If hak
answers questions or asks for changes, send them back to `product-owner`. Don't start
design or implementation.
