# product-owner memory

Lessons learned across stories. One rule per line, newest last. Keep under 100 lines.

- hak's requests are terse, one line, lowercase, with ambiguous domain terms (e.g. "exchange" in "login ... google or exchange"); record the most likely reading as an assumption in Open questions and use neutral wording in ACs (story 001).
- When the request leaves out access rules, session, logout and storage, write ACs only for the answer-independent core and list the rest as open questions plus "likely separate story" in Out of scope (story 001).
- hak narrows multi-part requests at gate 1 to one first step ("lets start with only google"); keep per-provider/per-part behaviour in separate ACs and open questions so splitting into a follow-up story is cheap (stories 001/002).
- When splitting a story, keep the original request line verbatim in both stories, add a split note, and log hak's words verbatim in the Decision log of the original (stories 001/002).
- hak accepts proposed defaults in bulk ("Yes, confirm all"); log one Decision log entry per question anyway, and turn confirmed defaults into ACs only where observable, the rest into Context constraints (story 001).
- The ~7 AC limit was exceeded on explicit orchestrator instruction (11 ACs in 001); flag it in the reply and offer a split (e.g. logout/session as own story) instead of silently complying (story 001).
- Check technical feasibility of "nice" behaviours (stay signed in, silent restore) before turning defaults into ACs; hak dropped AC7/AC8 after the architect found them infeasible frontend-only. Never renumber ACs once design exists: strike them through as removed (story 001).
- For test-only features (guest login, fakes) the first open question is always "dev/test builds only or also deployed?" because of the CLAUDE.md no-fakes-in-production rule; write ACs as "where the feature is available" so they hold either way (story 004).
- When the orchestrator supplies proposed defaults for open questions, put each in brackets in the question and keep it unconfirmed in the Decision log; hak confirms in bulk later (story 004).
- When changing another story's AC, append "(changed by [NNN](file))" in the old story and add `changes: [NNN/ACx]` here (story 004).
- Markdown tables in docs/backlog are prettier-checked by `npm run verify`: when adding a README row, re-align all columns to the longest title (story 005).
- When an AC depends on a still-open value or gesture (ranges, flag gesture), reference the open question in the AC ("shown next to the field", "see Open question 4") instead of inventing the number; add the AC for a default (e.g. first click safe) only once confirmed (story 005).
- hak answers a 16-question gate with one line ("Passt, mit Split"); log each question separately with his words verbatim, and when a split moves confirmed defaults to a new story, write that story's ACs but add an open question for any behaviour hak did not explicitly confirm (stories 005/006).
- When a new feature replaces baseline placeholder content (counter), check older ACs that name it (e.g. 004/AC7) and mark them `changes:` even while the replacing answer is still open (story 005).
- When closing an open question, grep the story for "see Open questions" and the question's wording, because Out of scope lines keep pointing at the removed question (story 006).
