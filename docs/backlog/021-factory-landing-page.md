---
id: 021
title: Factory landing page at the site root
status: in-review # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: platform # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<name>/docs/backlog)
branch: feature/021-factory-landing-page
supersedes: [] # stories this one fully replaces, e.g. [004]
changes: [018/AC1, 018/AC5] # stories whose behaviour this one modifies, e.g. [004/AC2, 007]
superseded-by: # set on the OLD story when a newer one replaces it
---

# 021 – Factory landing page at the site root

## Original request

> hak, 2026-11-12: "/feature sw factory web page - i would like to have a fancy web page that describes how the sw factory works. you might reuse some of the ideas from the slides. it should be deplyoed alongside with the apps"

## User story

As the sponsor of the software factory, I want a fancy public web page at the root of the published site that explains how the factory works and links to the published apps and the repository, so that I can show visitors the concept, the process and the results from one link, deployed together with the apps.

## Context

- hak's answers to the orchestrator (2026-11-12, Decision log): the page is the **site root** (`https://hkuegel.github.io/swfactory/`, a GitHub 404 today, see 018 Technical design risk "Site root"), without sign-in, with links to the apps; English; content about swfactory only, nothing about a client's internal tools or the client's name. It is a platform story.
- Source of ideas: the public part of hak's slide deck (the orchestrator removed the client-internal material (two internal tools and the client's name) and saved a text extract). The deck covers much more than the page needs: hak decided (gate 1) that the page presents only the most important aspects and does not flood the reader; it need not take over everything from the slides. The essential set is: what a software factory is and why (code is cheap, verification is the bottleneck); how it works (roles and the pipeline with its two human gates); how quality is ensured (verification and learning, in brief); the result (links to the apps and the repository). Cost and deployment appear at most as a short facts strip. Everything else (building blocks, story file in detail, model mix, lessons, per-role token charts) is left to the repository link. Wording, order and the exact selection within this set are UX design decisions.
- Sources named on the slides (Addy Osmani, "Software Factories, Light and Dark"; Khatua et al., CooperBench, arXiv 2601.13295; the LaunchDarkly blog account) are named as sources wherever the page uses their ideas or figures. No text of an external source is copied beyond what the slides already attribute.
- Public site, consistent with 018: no sign-in, no request to any third party on load (no web fonts from a CDN, no analytics, no external scripts or images), nothing stored. Published by the same CI deploy as the apps, only from `main` after the checks are green (018/AC5). The apps' URLs (`/avd/`, `/minesweeper/`) must keep working.
- "Fancy" (hak, gate 1): professional and good-looking, gladly with some effects, but not overdone. Testable part: a visual diagram of the pipeline with its two human gates, at least one interactive element (activating a pipeline step shows its role and output), motion that respects reduced motion, light and dark appearance, a layout that works from 320 px, and forced colours; effects are few and subtle (one entry animation of at most 2 s, highlight of the selected step, nothing loops). Taste is not turned into design values: the look is left to the UX designer, and hak signs off the look on screenshots at gate 2, as in 007/009.
- Links to the apps come from the list of published apps, not from names written into platform code (`npm run check:structure` forbids app names in platform code; 018 publishes every workspace under `apps/`). This is a constraint for the design. Whether the page is its own workspace or part of the platform is for the architect.
- Figures (decided, gate 1): only the few figures the page actually shows. Where the repository holds the number (e.g. stories done, tokens and agent runs from the Cost tables) it is derived at build time; the estimated cost (about 20 € for the avd stories) is static text labelled "estimate" with its date. Every figure states what it counts and when it was taken.
- Legal (hak's decision in 018, no legal assessment by the factory): the sites have no Impressum and no privacy page. The page must not claim that it has either. By hak's decision (gate 1) the page names neither hak nor firstwaters; the repository link is the only pointer to the owner.
- No screenshots of the apps, links only (hak, gate 1). App links open in the same tab.
- Lesson of bug 020: a check of the published build belongs in the pages smoke test (`e2e/pages`), not only the dev server. The root page is checked there as well.

## Acceptance criteria

- **AC1:** Given a deploy, when I open the site root (`/swfactory/`), then a page opens with no sign-in and no 404, with exactly one level-1 heading naming the software factory and level-2 headings that cover the essential set (what a factory is and why; how it works with roles and the pipeline with its two human gates; how quality is ensured; the result with links). The page is short: at most 5 level-2 sections, at most 700 words of visible text on the whole page, and at most 120 words in any one section (proposed caps; the UX designer may choose lower ones, not higher). Cost and deployment, if shown, are only a facts strip inside those caps. Every level-2 heading is reachable from a navigation on the page, and a link to the repository is offered for details beyond the essentials.
- **AC2:** Given the page, when I look for the pipeline, then it is shown as a visual diagram with every pipeline step in order and the two human gates marked, and every step is operable by keyboard; activating a step shows the role that owns it and what it produces. Given scripts that animate fail to run or reduced motion is on, then the same information is available as plain text with no interaction needed. Effects are few and subtle: the only animations are the highlight of the selected step and one entry animation of at most 2 s; nothing loops.
- **AC3:** Given the page, when I look for links, then there is one link per published app that opens that app (its login screen, no 404), and a link to `https://github.com/hkuegel/swfactory`; and when a further app is added under `apps/` and published (018/AC1), then a link to it appears without a change to platform code. Given no app is published, then the page shows a short "no apps published" text instead of an empty list. Where the page uses an idea or figure of Osmani, Khatua et al. or the LaunchDarkly blog, the source is named.
- **AC4:** Given the published page, when its visible text and files are searched, then the three client-internal names (stored as hashes in the published-build check) occur nowhere on the page or in its files (the common word "Internal" is not banned), and neither "Harald Kügel" nor "firstwaters" appears (the repository address, which contains the GitHub account name, is the one exception), and nothing on the page says or implies that an Impressum or a privacy page exists.
- **AC5:** Given the page is opened under `/swfactory/`, when it loads, then every request goes to the page's own origin (no Google, font, analytics or other third-party host), every request succeeds (no 404 for scripts, styles, images or fonts), no sign-in control is shown, and nothing is written to storage or cookies.
- **AC6:** Given a viewport width from 320 px up, in light and dark appearance and in forced-colours mode, then the page has no horizontal scrolling, all text keeps contrast of at least 4.5:1 (3:1 for large text and diagram parts that carry meaning), every state of the diagram has a cue other than colour, and with reduced motion on no element moves or loops. Given keyboard-only use, then every interactive element is reachable and operable, shows a visible focus, and the focus order follows the reading order. Flashing, if any, stays at no more than 3 per second.
- **AC7:** Given the deploy, when the published site is checked, then the root page and both apps are published by the same single run of the CI deploy, only from `main` after verify, e2e and the pages checks are green (018/AC5 still holds); the dev-only check covers every file of the published artifact including the root page and fails when a dev-only string or a file that belongs to no checked unit is present; and the pages smoke test of the published build opens the root page and follows every app link.
- **AC8:** Given the figures the page shows (only the few it needs), when I compare each derived figure with its source, then it equals the value in the repository as of the date the page states next to it; the estimated cost is labelled "estimate" with its date; and a figure with no source is not shown. If the page shows no figure, this AC holds vacuously and the tester notes it.

## Out of scope

- Any content about a client's internal tools, the client's name or other internal material (hak's decision); the slides' internal sections.
- Full coverage of the slides (hak: the page presents only the most important aspects): building blocks, story file in detail, model mix, token charts per role, lessons.
- Screenshots or images of the apps; names of hak or firstwaters.
- A German version; a language switch (hak: English).
- Impressum, privacy page, cookie banner, analytics (018 decision; nothing is collected).
- A custom domain, a blog or news section, comments, search, a contact form.
- Live data from GitHub at run time (stars, commits, CI status): a request to a third party on load would break AC5.
- A change to the apps, the sign-in or the factory process; documenting the factory in the README (stays with the tech-writer).
- Deciding workspace layout, build tooling or animation techniques (architect and UX designer).

## Open questions

None for hak. Handed over (not blocking):

- UX designer: choice and wording of the sections within the caps of AC1 (the 5 / 700 / 120 numbers are caps, lower is fine), and which few figures, if any, the facts strip shows.
- Architect: whether the page is its own unit or part of the platform; how figures are derived at build time; how the root page fits the dev-only check's "unchecked entry" rule (AC7).

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-12 — Where should the page live (today `https://hkuegel.github.io/swfactory/` is a 404; apps are under `/avd/` and `/minesweeper/`)? — A: "Startseite (Recommended)": the site root becomes the factory page, without sign-in, with links to the apps. Platform story. (hak, question dialog)
- 2026-11-12 — Language? — A: "Englisch (Recommended)". (hak, question dialog)
- 2026-11-12 — The slides contain client-internal material on two internal tools and are marked "Internal"; the page is public. What may go on the page? — A: "Nur swfactory (Recommended)": concept, roles, pipeline, verification, learning, cost, deployment; nothing about the client's internal tools or the client's name. (hak, question dialog)
- 2026-11-12 — Scope decision (orchestrator, passed on by the product-owner): constraints carried into Context and ACs as proposals, unconfirmed: self-contained page without third-party requests (consistent with 018), same CI deploy, root page covered by dist check and pages smoke test, meaning of "fancy", figures static versus derived, links from the list of published apps. Open questions 1 to 6 hold the bracketed proposals; hak confirms or corrects at gate 1.
- 2026-11-12 — Gate 1, general: the orchestrator told hak "Für alles, was du nicht nennst, gilt mein Vorschlag, einschließlich der Korrektur an AC4 (Verbot nur für [client-internal names withheld])." After choosing "Ich ändere was", hak answered: "fancy bedeutet, dass sie professionell und gut aussehen, gerne mit etwas Effekten, aber nicht übertrieben. Die Seite muss nicht alles aus den Folien übernehmen, es geht darum die wichtigsten Aspekte vorzustellen, ohne den User mit Information zu überfluten. Der Rest passt." (hak)
- 2026-11-12 — Q1 (what does "fancy" mean?): hak: "fancy bedeutet, dass sie professionell und gut aussehen, gerne mit etwas Effekten, aber nicht übertrieben." Consequence: AC2 and AC6 stay as the testable part; effects few and subtle; look signed off by hak on screenshots at gate 2; no design values in the story.
- 2026-11-12 — Content scope (new): hak: "Die Seite muss nicht alles aus den Folien übernehmen, es geht darum die wichtigsten Aspekte vorzustellen, ohne den User mit Information zu überfluten." Consequence: AC1 reworked from seven topic sections to the essential set with measurable caps (at most 5 level-2 sections, 700 words in total, 120 words per section, proposed by the product-owner for the UX designer); cost and deployment at most a short facts strip; "full coverage of the slides" moved to Out of scope; AC8 limited to the figures actually shown.
- 2026-11-12 — AC4 (orchestrator's correction, accepted through "Der Rest passt."): ban only the three client-internal names (kept as hashes in the test, not in plain text); "Internal" dropped as a common English word.
- 2026-11-12 — Q2 (figures), Q3 (no name or firstwaters, repository link only), Q4 (selected-step highlight plus one entry animation of at most 2 s, nothing loops), Q5 (no app screenshots, links only), Q6 (same tab): proposals accepted by "Der Rest passt." (hak). Open questions cleared; status set to ready.

<!-- Sections below are filled in by later roles. Don't delete headings. -->

- 2026-11-12 — Orchestrator: AC4 made precise – the ban on hak's name covers "Harald Kügel" and "firstwaters" as text; the repository address github.com/hkuegel/swfactory, which AC3 requires, contains the account name and is the exception.
- 2026-11-12 — Confidentiality: the orchestrator had pushed the story branch with the client-internal names in this story and in two test files of a public repository and reported it to hak. hak: "Ja, bereinigen". The names are replaced by neutral wording here, the test keeps them as hashes only, and the branch is replaced on GitHub. Quotes above are shortened with "[client-internal names withheld]".
- 2026-11-12 — Orchestrator (history): to remove the client-internal names from every commit, the gate-1 story commit on the local main (never pushed to origin/main) and the first pushed work-in-progress commit are dropped; the story lands on main together with the story branch. The branch on GitHub is deleted and pushed again from the cleaned state.

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

Intent (hak, gate 1): professional, good-looking, some effects, not overdone, only the most
important aspects, no flood of information. Design answer: a calm page on one centred column,
a strong hero, generous whitespace, **four** short sections, one centrepiece (the pipeline),
three effects only (entry rise, selected-step highlight, hover). About 340 words in total.

All contrast values below are **hand-computed** (sRGB linearisation, no shell available);
margins under 0.3 are marked tight; the tester re-checks with a tool.

### 1. Page structure and what is left out

Own caps (lower than the AC, therefore binding per AC1): **4 level-2 sections, at most 100
words in any section, at most 400 words on the whole page.** Counted with scripts off, which
is the maximum (§2 gives the counts).

```
body
  a.skip                        "Skip to main content" (visible on focus only)
  div.page                      gradient background (§4), contains header and main
    header (banner)
      nav[aria-label="Page sections"]   4 in-page links
    main#main
      div.hero                  NOT a section: h1, claim, 2 links, motif (the entry animation node)
      section#why     (h2)      three cards + one closing line
      section#how     (h2)      the pipeline diagram (centrepiece)
      section#quality (h2)      four numbered layers + one learning line
      section#result  (h2)      app link cards, facts strip, repository link
```

| Section              | Shows                                                     | How                                          |
| -------------------- | --------------------------------------------------------- | -------------------------------------------- |
| Hero                 | what it is, one claim, where to go                        | centred h1, claim, 2 link buttons, SVG motif |
| Why a factory (#why) | code is cheap, checking is the bottleneck, agents collide | 3 cards in one row, source line per card     |
| How it works (#how)  | roles, the pipeline, the two human gates                  | the diagram (§3), two forms                  |
| How quality is kept  | four verification layers, the learning loop               | ordered list as 2 x 2 cards, one line below  |
| The result (#result) | the published apps, three figures, the repository         | app link cards, facts strip, one text link   |

**Left out on purpose** (the repository link carries it): the five building blocks, the story
file in detail, model mix and per-role token charts, the real lessons examples (stories 014 to
020), the review-loop rule, CI and deployment steps as a diagram (the deploy shows only as
"online" in the result lead), LaunchDarkly and the light/dark-factory terms (so no LaunchDarkly
source is shown), tokens per story, agent time, the AVD calculator's feature list. No footer,
no Impressum or privacy wording (AC4).

### 2. Exact copy (English) and word counts

Words = `\S+` matches of `innerText`, scripts off. Pseudo-element text (arrows, the pointer
glyph) is not counted and not in the DOM.

**Header and skip link (10 words)**

- Skip link: `Skip to main content`
- Nav links, in order: `Why` (`#why`), `How it works` (`#how`), `Quality` (`#quality`),
  `Result` (`#result`)

**Hero (28 words, not a section)**

- Eyebrow `<p>`: `swfactory`
- h1: `A software factory of AI agents`
- Claim: `Roles, written handoffs and two human gates turn an idea into tested, reviewed, published software.`
- Primary link (repository, external, same tab): `View on GitHub`
- Secondary link (`#result`): `See the apps`

**Section "Why a factory" (86 words)**

- h2: `Why a factory`
- Lead: `Code is cheap now. Checking it is the bottleneck.`
- Card 1, h3 `Generation scales`: `An agent writes a feature, its tests and its docs in minutes.`
- Card 2, h3 `Verification does not`: `Review and testing set the limit. Give an agent only the autonomy you can check cheaply.`
  Source line: `Source: Addy Osmani, 2026`
- Card 3, h3 `Collaboration is hard`: `In the CooperBench benchmark, two agents together succeeded about 30% less often than alone.`
  Source line: `Source: Khatua et al., 2026`
- Closing: `A software factory structures the work so every step is small, written down and checked.`

**Section "How it works" (83 words static; 47 interactive)**

- h2: `How it works`
- Intro: `Two human gates, marked as diamonds. Every other step is owned by agent roles. Agents hand over through files, not chat.`
- Steps (label / owner / produces), `kind` in brackets:

| Label    | Owner                    | Produces                                  |
| -------- | ------------------------ | ----------------------------------------- |
| `Story`  | `Product owner`          | `Idea becomes acceptance criteria`        |
| `Gate 1` | `Sponsor (human)`        | `Approves the story` (gate)               |
| `Design` | `Architect, UX designer` | `Technical and UX design`                 |
| `Build`  | `Developer`              | `Code and unit tests`                     |
| `Test`   | `Tester`                 | `Proof for every criterion`               |
| `Review` | `Reviewer`               | `Checklist verdict`                       |
| `Docs`   | `Tech writer`            | `README and changelog`                    |
| `Retro`  | `Orchestrator`           | `Explanation and rule proposals`          |
| `Gate 2` | `Sponsor (human)`        | `Approves result and rule changes` (gate) |

The idea of the process ("idea, story, gate 1, design, build, test, review, docs,
explanation, retro, gate 2") is grouped: the idea is the input of `Story`; the explanation
belongs to `Retro`. Both gates stay separate steps. Panel labels (interactive form only):
`Owner`, `Produces`.

**Section "How quality is kept" (71 words)**

- h2: `How quality is kept`
- Lead: `Four layers, from cheap and automatic to rare and human.`
- Ordered list, each `<strong>` label then sentence:
  1. `Automated checks` `Types, lint, tests, build and a check that dev-only code never ships.`
  2. `Tests` `One test per acceptance criterion, checked on the real output.`
  3. `Review checklist` `A versioned checklist, every item reported.`
  4. `Human gates` `Two per story: the plan and the result.`
- Learning line: `After every story the factory learns: a retro ends in approved, versioned rule changes.`

**Section "The result" (62 words with two apps of two-word titles; page with figures)**

- h2: `The result`
- Lead: `Try what the factory built. Each app opens at its login screen, with guest access.`
  (second sentence omitted when there are no apps)
- App link cards: link text = the app's `<title>` only, nothing else.
- No apps: `No apps published yet.` (one `<p>`, no list)
- Facts strip (`dl`, three tiles; figure first visually, label second):
  - `18` / `stories done` (derived: `backlog.storiesDone`)
  - `116` / `agent runs recorded in cost tables` (derived: `cost.agentRuns`)
  - `about 20 €` / `estimate (2026-11-09): token cost of a five-story calculator app at API list prices, order of magnitude` (static, from `content.ts`)
  - Note under the strip (only when a derived tile is shown): `Counted in the repository on 2026-11-12.` (date = `asOf`)
  - Numbers via the one `en-US` helper, no rounding ("116", not "about 100"); the figures
    above are today's values as examples only.
- Repository text link: `Read the details in the repository`

| Block              | Words   |
| ------------------ | ------- |
| Header + skip link | 10      |
| Hero               | 28      |
| Why a factory      | 86      |
| How it works       | 83      |
| How quality        | 71      |
| The result         | 62      |
| **Total**          | **340** |

Interactive form: "How it works" drops to about 47 words (9 tab labels + one panel). Banned
words checked in the copy above: none of the three client-internal names (kept as hashes in the test, not in plain text), firstwaters, Harald, Kügel, hak,
Impressum, imprint, privacy, Datenschutz, legal notice occurs. `hkuegel` appears only in the
repository URL.

### 3. The pipeline diagram

Both forms sit in the same grid wrapper (`.pipeline`) so the wrapper node survives the
switch. **Marker shapes** (decorative, `aria-hidden`): step = circle, 1.25 rem, 2 px border;
gate = diamond (square rotated 45 degrees, 1.125 rem), filled with the gate colour. A vertical
2 px spine line runs behind the markers (static form and the interactive rail at 600 px and
up).

**Static form** (server render, first client render, scripts off, reduced motion): `<ol
aria-label="Pipeline steps">`, one `<li>` per step, no interaction.

- 600 px and up: each row is a grid `marker | label (5.5 rem, weight 600) | owner (11 rem,
muted) | produces (rest)`, minimum height 3 rem.
- Below 600 px: marker left, then a block of two lines: line 1 label (weight 600) and owner
  (muted, same line, wraps); line 2 produces.
- Gate rows: the diamond, the label text `Gate 1` / `Gate 2` and owner `Sponsor (human)`.

**Interactive form** (after hydration, motion allowed): **confirm the architect's APG Tabs
with automatic activation**, with `aria-orientation="vertical"`. Why tabs and not toggle
buttons: the steps are mutually exclusive and exactly one panel is shown, which is the tabs
model; `aria-pressed` on nine buttons of which only one can be on is wrong semantics and
would add eight tab stops. One tab stop for the rail, the next Tab goes to the panel
(`tabindex="0"`, because it holds no focusable element; APG). Keys as proposed: Up/Left =
previous, Down/Right = next (wrapping), Home/End; Tab and Shift+Tab leave the widget. Initial
selection: `Story`.

- Rail: `role="tablist"` `aria-label="Pipeline steps"`; each tab is a `<button role="tab">`
  with the step's label only as its text and a decorative marker. Gate tabs read "Gate 1" /
  "Gate 2".
- Panel: `role="tabpanel"` `aria-labelledby` the selected tab. Content: marker repeating the
  selected shape (aria-hidden) and the label as a visual title (`aria-hidden`, so it is not
  read twice), then `dl`: `Owner` / owner text, `Produces` / output text. Owner and produces
  at `--text-lg`.
- No live region: selecting a tab happens on the focused control, which announces itself
  ("Design, tab, selected, 3 of 9"); the panel is the next tab stop. A region would repeat.

**Footprint:** at 600 px and up the rail and the panel are two grid columns (rail
`minmax(11rem, 14rem)`, panel 1fr) in one grid row; the panel stretches to the rail height
(9 rows x 3 rem), so the interactive form is exactly as tall as the static form (9 rows x 3
rem). Below 600 px: the rail becomes a 3 x 3 grid of chips (marker above the label,
`--text-sm`, each at least 4 rem high, 4 px gaps, no spine) with the panel (min-height 8 rem)
directly below, so the panel is visible on a phone without scrolling; this is shorter than
the static form there (about 12 rem + 8 rem against about 30 rem); accepted, it is a better
touch layout, and nothing scrolls sideways. At 320 px a chip is about 90 px wide: "Review"
and "Gate 1" at 14 px fit; `overflow-wrap: anywhere` as a safety net for wide fonts.

**Cues (never colour alone):**

| State              | Normal cue                                                                                | Non-colour cue (kept in forced colours)                                                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Step (unselected)  | surface background, 1 px `--color-border`, hollow circle                                  | circle shape, 1 px start edge                                                                                                                                                            |
| Selected tab       | `--color-accent-subtle` background, accent fill in the circle                             | 4 px leading edge (left at 600 px and up, top below) instead of 1 px (padding compensates so nothing moves), a `▸` glyph at the end via `::after` (`content: '▸' / ''`), `aria-selected` |
| Gate               | diamond filled with `--landing-gate`                                                      | diamond shape, label text "Gate n", owner "Sponsor (human)"                                                                                                                              |
| Keyboard focus     | platform `:focus-visible` ring, `outline-offset: -2px` on tabs (inside, neighbours touch) | `Highlight` outline (base.css)                                                                                                                                                           |
| Hover (unselected) | `--color-surface-subtle`, only in `@media (hover: hover)`                                 | none needed                                                                                                                                                                              |

The 1 px / 4 px edge and the `::after` content are the computed-style signature the tester
compares in forced colours (selected vs unselected); gate vs step differ by `transform` and
`border-radius` of the marker and by the label text.

**Forced colours (explicit, do not rely on transparent borders):** tabs and rows
`border-color: ButtonText`; unselected leading edge `Canvas`, selected `Highlight`; circle
`background: Canvas`, border `ButtonText`; selected circle `background: Highlight`; diamond
`background: CanvasText`, selected diamond `Highlight`; spine `CanvasText`; panel border
`ButtonText`; `▸` `Highlight`. The hero gradient is dropped (`background-image: none`).

### 4. Look

**Grid and rhythm.** One centred column `max-width: var(--landing-width)` (60 rem), side
padding `--space-4` below 600 px and `--space-6` from 600 px. Hero padding-block
`--space-7` below 600, `--space-8` from 600. Between sections `--space-7` below 600,
`--space-8` from 600; inside a section: h2 to lead `--space-3`, lead to content `--space-5`.
Cards: surface background, 1 px `--color-border`, `--radius-panel`, padding `--space-5`
(`--space-4` below 600), `--shadow-panel` on the pipeline panel only. Text measure of leads
and claims at most 40 rem.

**Grids.** #why: 3 cards in a row from 900 px, one column below (a 2 + 1 split would leave an
orphan). #quality: 2 x 2 from 600 px, one column below. #result: app cards
`repeat(auto-fit, minmax(14rem, 1fr))`; facts tiles `repeat(auto-fit, minmax(12rem, 1fr))`.
All children `min-width: 0`.

**Type scale** (system stack only, no web font): hero h1 `--landing-text-hero` (2 rem at 320
px growing to 3 rem from about 800 px), weight 700, letter-spacing -0.02em, line-height 1.15,
`text-wrap: balance`, centred; eyebrow `--text-sm`, weight 600, letter-spacing 0.04em, muted,
no `text-transform` (it would change `innerText`); claim and section leads `--text-lg`,
muted; h2 `--text-h2` below 600, `calc(var(--text-h2) * 1.25)` from 600 px, weight 600; h3
and list labels `--text-base`, weight 600; body `--text-base`; source lines, derived note and
chips `--text-sm`; facts figure `calc(var(--text-h1) * 1.25)`, weight 700 (large text).

**Colour roles (existing tokens, both schemes come from the token files).** Page background
gradient on `.page`: `linear-gradient(180deg, var(--color-accent-subtle), var(--color-page))`
over the first 36 rem, `no-repeat`, background-color `--color-page` below. Cards and panel:
`--color-surface`; tiles: `--color-surface-subtle`; text `--color-text`; secondary text
`--color-text-muted`; links and selected edge `--color-accent`; hairlines `--color-border`;
borders that carry meaning (markers, spine, app cards, estimate tile) `--color-edge`.

**Link buttons** (the shared `Button` is a `<button>`; the hero needs `<a>`): landing CSS
re-creates the Button look with the same tokens, no new colours. Primary `View on GitHub`:
`--color-accent` / `--color-on-accent`, hover `--color-accent-hover`, min-height
`--control-height`, radius `--radius-control`, padding 0 `--space-5`. Secondary `See the
apps`: transparent, 1 px `--color-edge`, text `--color-accent`, hover
`--color-accent-subtle`. Below 600 px both are full width, stacked, at most 20 rem wide; from
600 px side by side, centred. Forced colours: border `ButtonText` as in Button.

**App cards:** `<a>` as a whole card, `--color-surface`, 1 px `--color-edge`, radius
`--radius-control`, padding `--space-4`, min-height 3.5 rem, title `--color-accent` weight
600 underlined (offset 3 px; the underline is the link cue), `→` via `::after` at the end.
Hover (pointer only): border `--color-accent`, background `--color-surface-subtle`.
**Estimate tile:** 1 px **dashed** `--color-edge` (derived tiles: solid `--color-border`), the
word "estimate" in the label: the dashed edge and the word say "not counted".

**Motif:** one decorative inline SVG under the hero buttons, `aria-hidden`, `focusable="false"`,
viewBox 320 x 24, width `min(20rem, 100%)`, centred, `margin-top: var(--space-6)`: a 2 px
line (y 12) with nine circles (r 5, x = 12, 49, 86, ... 308) filled `--color-surface`,
stroke `--color-edge` 2 px; at the 2nd and 9th position a diamond (about 9 px) filled
`--landing-gate` instead of a circle. It echoes the pipeline (same shapes, same gate
positions). Colours through CSS classes, not SVG attributes; forced colours: stroke
`CanvasText`, circle fill `Canvas`, diamonds `Highlight`. No image file is downloaded.

**New landing tokens** (`landing/src/tokens.css`; all other colours are platform tokens):

| Token                 | Light                               | Dark      | Use / contrast (hand-computed)                                                                                                             |
| --------------------- | ----------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `--landing-gate`      | `#b45309`                           | `#fbbf24` | diamond fill, 3:1 needed. Light on surface 5.0, on page 4.6, on accent-subtle 4.4. Dark on surface 9.9, on page 11.1, on accent-subtle 8.5 |
| `--duration-entry`    | `900ms`                             | `900ms`   | entry rise; `0s` in the reduced-motion block; at most 2 s                                                                                  |
| `--landing-width`     | `60rem`                             | `60rem`   | column width (no colour; no dark value needed)                                                                                             |
| `--landing-text-hero` | `clamp(2rem, 1.2rem + 3.2vw, 3rem)` | same      | hero h1 size (a `clamp()` of rem and vw, not a `calc()` over a token: see Points for the architect)                                        |

Existing tokens in new pairs (all four pass in both schemes, hand-computed): `--color-text` on
accent-subtle 14.4 (light) / 11.7 (dark), on page 15.0 / 15.4, on surface 16.6 / 13.7;
`--color-text-muted` on accent-subtle 6.7 / 6.5, on page 7.1 / 8.6, on surface 7.8 / 7.6, on
surface-subtle 6.9 / about 6.8; `--color-accent` on surface 6.7 / 9.6, on accent-subtle 5.8 /
8.2, on page 6.1 / 9.6 (hero secondary link, titles, `▸`); `--color-on-accent` on
`--color-accent` 6.7 / 7.5, on accent-hover 8.7 / about 8; `--color-edge` (markers, spine,
tile edges, 3:1) on surface 4.2 / 5.4, on page 3.8 / about 5.9, on accent-subtle 3.7 / 4.6
(light on accent-subtle is the lowest margin, 0.7 above 3:1, not tight).

### 5. Effects (exactly these, nothing loops)

| Effect             | What / where                                                                                                                                                                                                                                                                                      | Duration, easing                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Entry rise         | `@keyframes` on `.hero` (the hero wrapper `div`, always rendered, same node before and after hydration, never a step): opacity 0 to 1 and `translateY(var(--space-4))` to 0; `animation-fill-mode: backwards`, one iteration, no delay. The motif and buttons are inside it, so they rise with it | `var(--duration-entry)` (900 ms), `var(--ease)` |
| Selected highlight | `transition` of `background-color`, `border-color` (the edge) and the marker fill on tabs; the `▸` and panel text change instantly                                                                                                                                                                | `var(--duration)` (120 ms)                      |
| Hover              | links, link buttons and cards: `background-color` / `border-color` transition, pointer devices only                                                                                                                                                                                               | `var(--duration)`                               |

Reduced motion: `--duration-entry` and `--duration` are `0s`, base.css also sets
`animation: none` and `transition: none`; the page also stays in the static form (confirmed:
`useEnhanced()` false), so no step needs interaction and nothing moves. No parallax, scroll
effect, smooth scrolling, pulsing or blinking; no flashing at all. The only file with
`animation` is the hero's CSS module (the architect names it in the token test).

### 6. States and responsive

| Situation                      | What the user sees                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| Normal (scripts on, motion)    | hero rises in once; tabs interactive, `Story` selected                                         |
| Scripts off / not yet hydrated | static list of all nine steps with owner and output; every link works; nothing else is missing |
| Reduced motion                 | static form, no animation, no transition                                                       |
| Hydration failure              | the static form stays as rendered (the page is complete without scripts)                       |
| No apps published              | in #result: `No apps published yet.` and no list; the lead's second sentence is omitted        |
| `asOf` null                    | derived tiles and the "Counted in the repository" note hidden; the estimate tile stays         |
| `backlog` or `cost` null       | that one tile hidden; the grid reflows                                                         |
| Loading, error, disabled       | do not exist: no data fetch at run time, nothing is disabled                                   |
| Light / dark                   | tokens only (§4); the hero gradient runs accent-subtle to page in both                         |
| Forced colours                 | §3 and §4 lists; gradient and shadows dropped; every state keeps a shape, border or glyph cue  |

Widths: **320 px** one column, 16 px side padding, nav wraps to two centred rows, hero links
stacked, #why and #quality one column, pipeline chips 3 x 3 plus panel, app cards and tiles
one column; no horizontal scroll (every text node may break anywhere; the longest fixed
unit is a chip, about 90 px). **600 px** side padding 32 px, link buttons side by side,
#quality 2 x 2, pipeline becomes rail plus panel (rail 11 rem), static rows get the 4-column
grid, h2 grows. **1024 px and up** the column stays 60 rem, #why shows three cards in a row
(from 900 px), the hero h1 is 3 rem.

### 7. Accessibility

- **Landmarks:** `header` (banner) with `nav` "Page sections"; one `main`; no footer. Skip
  link first, targets `main#main`; it is visible on focus (own 2 px focus ring, surface
  background) and counts toward the words (4).
- **Headings:** one `h1`; four `h2` (each `section` has `aria-labelledby` = its h2 id); `h3`
  only for the three cards of #why; no headings inside the pipeline or the facts strip.
- **Focus order = reading order = DOM order:** skip link, four nav links, `View on GitHub`,
  `See the apps`, (#why: no stops), pipeline (one tab stop, then the panel), (#quality: no
  stops), app cards in list order, `Read the details in the repository`. Visual order equals
  DOM order everywhere except the facts tile, where the figure appears above its `dt`
  label (not focusable, reads label then figure).
- **Visible focus:** platform `:focus-visible`; tabs inset (`outline-offset: -2px`); focus
  ring 5.8:1 or better on every surface (accent on accent-subtle 5.8 light, 8.2 dark).
- **Link purpose from text:** `View on GitHub`, `See the apps`, app title, `Read the details
in the repository`. The nav in-page links name their section. External links open in the
  same tab (no `target`).
- **Names:** tablist and list `aria-label="Pipeline steps"`; tab name = the step label; panel
  named by its tab; decorative markers, the motif, arrows and the panel's visual title are
  hidden from the accessibility tree.
- **No `aria-live`** anywhere (no async update; tab selection is announced by the focused
  tab itself). Nothing appears or disappears after load except the swap static to
  interactive form, which happens before a user can act.
- **Targets:** every interactive element at least 44 px high (tabs 3 rem, chips 4 rem).
  **Zoom/text size:** all sizes in rem, nothing fixed in px except borders and the SVG.
- **Native elements:** `a`, `button`, `ol`, `dl`; no custom controls except the tabs, which
  follow APG.

### 8. Points for the architect

1. **Caps:** my own caps (4 sections, at most 100 words per section, at most 400 in total) are
   the design caps; please let E2 and E3 assert these, the AC caps (5 / 120 / 700) stay as the
   outer limit. Counts: 340 words static.
2. **Tabs confirmed** (APG, vertical, automatic activation, panel `tabindex="0"`); `stepNavigation.ts`
   and U2 stay. `useEnhanced()` false under reduced motion confirmed.
3. **`Button` is a `<button>`:** the hero links cannot use it. The landing needs its own link
   classes (§4) reading the same tokens; the token test needs the pairs of §4 (all listed,
   all existing tokens except `--landing-gate`).
4. **`--landing-text-hero` is a `clamp()`** with rem literals and `vw`, not a `calc()` over a
   token. CLAUDE.md asks for `calc()` over tokens only for values derived from tokens; if the
   token rules refuse `vw`, fall back to `calc(var(--text-h1) * 1.15)` (2.0 rem) below 800 px
   and `calc(var(--text-h1) * 1.7)` (about 3 rem) from 800 px in a media query.
5. **Entry animation node:** the hero wrapper (`.hero`) must be rendered by `LandingPage`
   directly, not inside `Pipeline`, and must not change its element type or key. Its
   `animation` lives in one CSS module (named in `tokenRules` `animationFiles`).
6. **Same wrapper in both forms:** `Pipeline` renders one `.pipeline` grid node; only its
   children change (`ol` to tablist + panel). The panel stretches to the rail height, so the
   footprint is equal from 600 px; below 600 px the interactive form is deliberately shorter
   (chips), which E4's frame checks should not treat as a jump after hydration (the swap
   happens before any user action).
7. **Forced colours:** the signature the tester compares is the 4 px vs 1 px leading edge and
   the `▸` pseudo-content (selected vs unselected), `transform` / `border-radius` (gate vs
   step). Both blocks are specified; use `:where()` around `[aria-selected]` scoping so the
   forced-colours block wins (CLAUDE.md).
8. **Figures:** only `backlog.storiesDone` and `cost.agentRuns` are shown, as plain integers
   (no rounding); `cost.stories`, `measuredTokens`, `runsWithoutTokens` need not be computed
   or kept in the types. The estimate string is static in `content.ts` (date 2026-11-09).
9. **Deployment is not shown** (not needed within "short facts strip", keeps the page lean);
   no tile, no deploy diagram. If hak wants it, one tile `main only` would be the extension.
10. No contradiction with the Technical design found; the intro sentence of #how states the
    gate marking in text, the diamond, and the label.

_Please run `npx prettier --write` on this story (tables were padded by hand)._

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

Decision record: [ADR 0011](../adr/0011-landing-page-workspace-prerendered-react.md) (own
workspace `landing/`, React rendered to HTML at build time and hydrated, build-time data
module, root unit in the dist check, animation exception to the token rules).
[ADR 0010](../adr/0010-github-pages-guest-only-deploy-build.md) and
[ADR 0006](../adr/0006-monorepo-npm-workspaces-platform-as-source.md) get a "Revised" line.
No new third-party dependency (React, Vite, Playwright are in place).

#### Spike (2026-11-12, scratch copy, Vite 8, React 19, Chromium)

- A `landing/` workspace built twice (`vite build --ssr src/entry-server.tsx` and the client
  build) with `build.assetsDir: '_landing'`, `emptyOutDir: false`, outDir `_site`: the output
  is `_site/index.html` + `_site/_landing/index-*.{js,css}` (~70 kB gzip JS). CSS Module class
  names are identical in both builds. No inline script in the HTML.
- Pitfall found: the SSR build without `--base /swfactory/` renders links as `/<app>/`; both
  builds need the same base.
- Served by `scripts/serve-pages.mjs` under `/swfactory/`: hydration without console error or
  `pageerror`; tabs appear after hydration and work; with `javaScriptEnabled: false` the full
  static list is there; with `reducedMotion: 'reduce'` no tab and `getAnimations()` is empty;
  with motion the one CSS entry animation reports duration 1500, iterations 1.
- Without git (scratch copy) the date is `null` and the derived figure is not rendered.
- No case-insensitive hit of the three client-internal names (kept as hashes in the test, not in plain text) or `firstwaters` in the React bundle;
  `Kügel` stays UTF-8 in the minified JS (not relied on, see AC4 test).
- Figures on the current tree, two independent methods (index + run rows vs. frontmatter +
  `total (measured)` rows): 18 done stories, 9 with a Cost table, 116 agent runs,
  7,510,740 measured tokens, 13 runs without a token figure. Both methods agree.

#### 1. Where the page lives

A new workspace **`landing/`** (`@swfactory/landing`) at the repo root, added to the root
`workspaces` (`["packages/*", "apps/*", "landing"]`). Not under `apps/` (no sign-in, not an
app, must not be hit by `new-app`, `/rebuild`, the platform's per-app sign-in specs or app
discovery); not inside the platform (a source package that apps type-check and that is never
built). It reuses `createAppViteConfig()`, `@swfactory/platform/tokens.css` and `base.css`,
the Vitest setup and `@swfactory/platform/test/tokenRules`. `check-structure` rule 1 also
scans `landing/`, so no app name can be written into it. Rendering: React rendered to HTML at
build time and hydrated (ADR 0011), so scripts off = full page as HTML (AC2).

| File                                                               | Owner     | Responsibility                                                                                                                                                                                      |
| ------------------------------------------------------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `landing/package.json`                                             | devops    | workspace; deps `react`, `react-dom`, `@swfactory/platform`; scripts `dev`, `typecheck`, `lint`, `format:check` (`--ignore-path ../.prettierignore`), `test`                                        |
| `landing/tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | devops    | as an app's; app: `src`; node: `vite.config.ts`, `build`, `e2e`                                                                                                                                     |
| `landing/vite.config.ts`                                           | devops    | `createAppViteConfig({ plugins: [landingData plugin], build: { assetsDir: '_landing', emptyOutDir: false } })`; the plugin serves `virtual:landing-data` from `loadLandingData(repoRoot)`           |
| `landing/index.html`                                               | developer | `lang="en"`, title, `<link rel="icon" href="data:,">` (no favicon request), `<div id="root"><!--ssr-outlet--></div>`, module script `/src/main.tsx`                                                 |
| `landing/build/landingData.ts`                                     | developer | node glue: discover apps (same rule as build-pages), read their `<title>`, read backlog index + linked stories, `git log -1 --format=%cs` (stderr ignored, failure → `null`), call the pure parsers |
| `landing/src/lib/landingData.ts`                                   | developer | the types below (shared by node glue and components)                                                                                                                                                |
| `landing/src/lib/figures.ts` (+ `.test.ts`)                        | developer | pure parsers: done stories from the index, run rows and tokens of one story's Cost table                                                                                                            |
| `landing/src/lib/stepNavigation.ts` (+ `.test.ts`)                 | developer | pure key → step index mapping (only if UX keeps the tabs pattern, §4)                                                                                                                               |
| `landing/src/content.ts`                                           | developer | static texts: pipeline steps, sources, repository URL, the cost estimate with its date (UX wording)                                                                                                 |
| `landing/src/useEnhanced.ts`                                       | developer | `useSyncExternalStore` hook: `false` on the server and in the hydration render, then `!matchMedia('(prefers-reduced-motion: reduce)').matches`, live on change                                      |
| `landing/src/LandingPage.tsx` + components + `*.module.css`        | developer | the page (sections per UX); thin components, one per file: e.g. `Pipeline.tsx`, `AppLinks.tsx`, `Facts.tsx`                                                                                         |
| `landing/src/entry-server.tsx`                                     | developer | `export function render(): string` = `renderToString(<StrictMode><LandingPage data={data} /></StrictMode>)`                                                                                         |
| `landing/src/main.tsx`                                             | developer | imports tokens/base/`./tokens.css`; `hydrateRoot` when `#root` has an element child, else `createRoot` (dev server)                                                                                 |
| `landing/src/landing-data.d.ts`                                    | developer | `declare module 'virtual:landing-data'` (default export `LandingData`)                                                                                                                              |
| `landing/src/tokens.css` (+ `tokens.test.ts`)                      | developer | landing tokens (light + dark block; `--duration-entry` ≤ 2s, `0s` under reduced motion) and their test                                                                                              |
| `packages/platform/src/test/tokenRules.ts`                         | developer | `bypassProblems(css, { animationFiles })` option, default = the sign-in spinner file (current behaviour unchanged)                                                                                  |

#### 2. Build and publish

`scripts/build-pages.mjs` (devops), after the app loop, before the check:

1. `vite build --ssr src/entry-server.tsx --base /swfactory/ --outDir dist/server` (cwd
   `landing/`, inside the repo so `react` resolves from `node_modules`; `dist` is ignored by
   git, prettier and eslint).
2. `vite build --base /swfactory/ --outDir <_site>` (cwd `landing/`; `emptyOutDir: false` in
   the config keeps the app directories).
3. `import()` the SSR bundle, `render()`; replace `<!--ssr-outlet-->` in `_site/index.html`;
   fail if the outlet is missing or the markup is empty.
4. `check-dist --guest-only --out _site --base /swfactory/` as before (now with the root unit).

The same base goes to both builds (spike pitfall). App links are
`${import.meta.env.BASE_URL}${name}/`, same tab (no `target`).

**App list (AC3):** `loadLandingData` discovers `apps/<name>` with a `package.json` (the rule
of `build-pages`), title from `apps/<name>/index.html` `<title>` (missing title → build
fails). The pages spec asserts that the links equal `listSiteApps()`, so a drift between the
two discoveries fails. **No apps:** `build-pages`, `check-dist` and `listSiteApps()` keep
failing on zero apps (non-vacuity guards of 018), so a zero-app site is never deployed; the
"no apps published" text exists in `AppLinks` and is tested at component level (U5).

**`check-dist --out` (AC7, devops):** allowed top-level entries = checked apps + the root unit
(`index.html` file, `_landing` directory). Constant `ROOT_ASSETS = '_landing'` ("keep in sync
with `landing/vite.config.ts` and `packages/platform/config/pages.ts`").

- Root unit required: `_site/index.html` missing → fail.
- Files = `index.html` + every file below `_landing/`, all scanned.
- Forbidden = platform `forbidden` ∪ `standard.forbidden` ∪ `guestOnly.forbidden`, in **both**
  modes (no sign-in on the page: neither the guest nor the Google strings); no `required`
  string (the guest-only `required` must not apply to the root).
- `index.html` loads ≥ 1 module script; each entry URL lies under `<base>_landing/` and
  exists.
- Any other entry (`stray.txt`, `_other/`, a `favicon.ico` from a future `public/`) still fails.

**Other devops changes:** `packages/platform/config/pages.ts`: `LANDING_ASSETS_DIR = '_landing'`,
`listSiteApps()` skips it (root `index.html` is a file, already skipped); doc comments.
`packages/platform/package.json`: export `"./config/pages": "./config/pages.ts"` (the landing
specs import `SITE_DIR`, `listSiteApps`). `playwright.pages.ts`: third project
`landing-pages` (`testDir: '../../../landing/e2e/pages'`, Desktop Chrome); fix the webServer
comment (the root now answers). `check-structure.mjs`: add `'landing'` to the rule-1 scan.
ESLint: node globals for `landing/build/**` if the glue uses them. `ci.yml`: **no change**
(`pages` job runs `test:pages` and uploads `_site` with the root; deploy conditions of 018/AC5
unchanged; `actions/checkout` depth 1 still has the HEAD commit date).

#### 3. Data and figures (AC3, AC8)

```ts
// landing/src/lib/landingData.ts
export interface PublishedApp {
  readonly name: string; // directory under apps/, link `${BASE_URL}${name}/`
  readonly title: string; // <title> of apps/<name>/index.html
}
export interface BacklogFigures {
  readonly storiesDone: number; // rows of docs/backlog/README.md with status "done"
}
export interface CostFigures {
  readonly stories: number; // done stories with a "### Cost" table in "## Retrospective"
  readonly agentRuns: number; // run rows of those tables (not "total", not "orchestrator")
  readonly measuredTokens: number; // sum of the integer Tokens cells of those run rows
  readonly runsWithoutTokens: number; // run rows whose Tokens cell is "n/a"
}
export interface LandingData {
  readonly apps: readonly PublishedApp[];
  readonly asOf: string | null; // HEAD commit date YYYY-MM-DD; null → no derived figure shown
  readonly backlog: BacklogFigures | null; // null when the index is missing
  readonly cost: CostFigures | null; // null when no done story has a Cost table
}

// landing/src/lib/figures.ts (pure, no fs)
export function doneStoryLinks(indexMarkdown: string): readonly string[]; // link targets of done rows
export function costOfStory(
  storyMarkdown: string,
): { runs: number; tokens: number; runsWithoutTokens: number } | null;
```

- Parsing rules: index status = last cell of a row that links a story (as `check-structure`);
  in a story, strip fenced code first (story 012 has an example table), then take the first
  table after `### Cost` inside `## Retrospective`; skip header, separator, `total …` and
  `orchestrator (main session)` rows.
- **As-of date = HEAD commit date** (`%cs`), not the build date: the same commit always yields
  the same page (tests can compute it), and it is the date of the repository state counted.
  A local build with uncommitted backlog edits counts the working tree (the tests read the same
  tree).
- **Missing source → figure not shown:** `asOf === null` hides every derived figure;
  `backlog`/`cost === null` hides that figure. The static estimate (about 20 €) is text in
  `content.ts` with the word "estimate" and its own date, independent of `asOf`.
- Numbers are formatted by one pure helper with an explicit locale (`'en-US'`), never the
  runtime default, so server markup and hydration agree. If UX rounds (e.g. "7.5 million"),
  the rounding is that helper's and the e2e oracle formats with it.
- Which figures are shown is UX's choice; unused ones are not computed. None shown → AC8
  vacuous (tester notes it).

#### 4. Pipeline diagram (AC2)

```ts
// landing/src/content.ts
export interface PipelineStep {
  readonly id: string; // stable, used for element ids
  readonly kind: 'step' | 'gate';
  readonly label: string; // e.g. "Story", "Gate 1"
  readonly role: string; // owning role, e.g. "product-owner"; gates: "sponsor" (no name, AC4)
  readonly output: string; // what it produces
}
export const PIPELINE: readonly PipelineStep[]; // in CLAUDE.md "Process" order, both gates included
```

- **Static form** (server render, first client render, scripts off, reduced motion): an
  ordered list in reading order; every step shows label, role and output as text; gates are
  marked by text ("Gate") plus a non-colour cue. Nothing to operate.
- **Interactive form** (after hydration, `useEnhanced()` true): proposed pattern **WAI-ARIA
  APG Tabs** with automatic activation: `role="tablist"` (`aria-label`), each step a
  `role="tab"` button with `aria-selected`, roving `tabindex` (one tab stop), Left/Up = previous,
  Right/Down = next (wrapping), Home/End; one `role="tabpanel"` (`aria-labelledby` the selected
  tab) shows role and output. Selection state lives in `Pipeline` (`useState`, initial = first
  step); everything else is derived from `PIPELINE`. `nextStepIndex(current, key, count):
number | undefined` is the pure part. The a11y pattern is UX's call; if UX picks plain
  toggle buttons (`aria-pressed`, every step a tab stop), drop `stepNavigation.ts` and U2.
- **Reduced motion:** `useEnhanced()` stays false, so the static form shows all information
  without interaction. UX may keep the interactive form under reduced motion only if every
  step's role and output stays visible as text in it.
- **Diagram drawing:** HTML/CSS boxes with connectors by borders/pseudo-elements (or a
  decorative inline SVG, `aria-hidden`); text stays HTML so it wraps at 320 px. No canvas, no
  third-party library.
- **Animations:** CSS only. The entry animation runs on first paint without JS, on an element
  that keeps its DOM node through the static → interactive switch (not on a step element whose
  tag changes, which would restart it); duration `var(--duration-entry)` ≤ 2 s, one
  iteration. Selected-step highlight is a `transition` with `var(--duration)`. Reduced motion:
  token `0s` plus the base.css reset.

#### 5. No third-party requests, nothing stored (AC5)

Fonts: the system stack of `--font-family`. No external URL other than the repository and
source links (navigations, not loads). No `localStorage`, `sessionStorage`, cookie or
IndexedDB use; selection state is React state only. `data:,` favicon, so a browser does not
request `/favicon.ico` (a 404 outside the base). No inline script or style; React sets no
`style` attribute (no inline positions), so a CSP could be added later.

#### 6. Content checks (AC1, AC4)

- **Caps** are checked on the built page in the browser: words = `/\S+/` matches of
  `innerText`; total over `body`, per section over each `section` that holds an `h2`; counted
  with scripts off (all step texts visible, the maximum) and on (after hydration). Text
  hidden with `display: none` does not count; visually hidden text does (stricter).
- **Banned strings** (AC4, plus Context "names neither hak nor firstwaters"): whole word,
  case-insensitive: the three client-internal names (kept as hashes in the test, not in plain text), `firstwaters`, `harald`, `kügel`, `hak`; in
  visible text additionally `impressum`, `imprint`, `privacy`, `datenschutz`, `legal notice`.
  Searched in the visible text (both forms) and in every file of the root unit read from
  `_site/` after decoding JS escapes (`\uXXXX`, `\u{…}`, `\xXX`) and HTML entities
  (`&#NNN;`, `&#xHH;`, `&uuml;`). The repository URL (`hkuegel`) matches none of them. One
  test, not a `dist-check` entry (check-dist matches case-sensitively and without decoding).

#### 7. Minimal test set

Unit (developer, `landing/src`, Vitest):

| Id  | AC       | Test                                                                                                                                                                                                                                                                                                                                                       |
| --- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U1  | AC8      | `figures.test.ts`: index → only `done` rows (draft, superseded, rows without link skipped); Cost table → run rows counted, `total (measured)` and orchestrator rows excluded, `n/a` Tokens counted in `runsWithoutTokens`; a fenced example table and a table outside `## Retrospective` ignored; story without Cost table → `null`; one-row table (N = 1) |
| U2  | AC2      | `stepNavigation.test.ts`: wrap at both ends, Home/End, Up/Down = Left/Right, other keys `undefined`                                                                                                                                                                                                                                                        |
| U3  | AC2, AC6 | `tokens.test.ts`: parity, the contrast pairs the landing CSS paints (text 4.5:1, meaningful diagram parts 3:1), `bypassProblems(css, { animationFiles: [<the one file>] })`, that file has `animation: none` under reduced motion, `--duration-entry` ≤ 2s and `0s` under reduced motion, no `infinite` in any landing CSS, every `var()` defined          |
| U4  | AC8      | `Facts.test.tsx`: `asOf: null` → no derived figure rendered; `cost: null` → no cost figure (the estimate stays)                                                                                                                                                                                                                                            |
| U5  | AC3      | `AppLinks.test.tsx`: `apps: []` → the "no apps published" text and no list                                                                                                                                                                                                                                                                                 |

e2e on the published build (tester; `npm run test:pages`, served under `/swfactory/`):

| Id  | AC                 | Test                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| E1  | AC1, AC3, AC5, AC7 | `packages/platform/e2e/pages/pages.spec.ts`, new test "021 AC3/AC5/AC7: the site root links every published app": record requests from before `goto('')`; document 200; one `h1`; no button or link named `/sign in/i`; every request same-origin, every response < 400 (all resource types), ≥ 1 script and stylesheet; repository link href `https://github.com/hkuegel/swfactory`; app link hrefs (found by `href` under the base) as a set equal `listSiteApps()`, none with `target`; for each: click on the root page → URL `<app>/`, h1 = the app's `<title>`, "Sign in as guest" visible, `goBack()` |
| E2  | AC1, AC2, AC4      | `landing/e2e/pages/landing.pages.spec.ts`, context `javaScriptEnabled: false`: exactly one `h1` naming the software factory; 1–5 `h2`; nav links target every `h2` section id; word caps (§6); every `PIPELINE` step's label, role and output visible in order, both gates marked; banned strings absent in visible text and in every root-unit file (§6)                                                                                                                                                                                                                                                    |
| E3  | AC1, AC2, AC5, AC6 | same spec, scripts on: no `pageerror`/console error (hydration); word caps again; Tab from the top until a step has focus — every focusable reached in DOM order with a non-`none` outline; arrow keys/Home/End move the selection and the panel shows the selected step's role and output; under `emulateMedia({ forcedColors: 'active' })` the selected and an unselected step and a gate differ pairwise in a non-colour computed-style signature (border style/width, outline, glyph text); after interacting: `localStorage`/`sessionStorage` empty, `context.cookies()` empty                          |
| E4  | AC2, AC6           | same spec, motion: every `document.getAnimations()` has iterations 1 and delay + duration ≤ 2000 ms; frame check: animations paused at 0 vs. finished → screenshots differ (the effect is visible); after they ended (wait until `getAnimations()` is empty, ≤ 3 s), two screenshots 500 ms apart are equal (nothing loops; same run, so text may stay in). Context `reducedMotion: 'reduce'`: `getAnimations()` empty after load and after any interaction the form offers, and every step's role and output visible                                                                                        |
| E5  | AC6                | same spec, widths 320 and 1280 × `colorScheme` light and dark: `documentElement.scrollWidth <= clientWidth` (after `getAnimations()` is empty). Contrast is covered by U3 (HTML text, no rendered scene)                                                                                                                                                                                                                                                                                                                                                                                                     |
| E6  | AC8                | same spec: each figure the page shows equals an **independent** oracle computed in the spec from the repo (done = stories whose frontmatter `status: done`; tokens = sum of `total (measured)` cells; runs = rows between header and total minus orchestrator), and the stated date equals `git log -1 --format=%cs`; the estimate text contains "estimate" and a date. If UX shows no figure, the test asserts none is shown and the Test report notes AC8 as vacuous                                                                                                                                       |

Probes for the Test report (scratch copy, not committed), each must fail with a clear message
unless marked "pass": `check-dist --out` with (a) a stray `_site/stray.txt`; (b) a stray
`_site/_other/`; (c) `_site/index.html` removed; (d) `__fakeGoogle` planted in a file under
`_site/_landing/` that `index.html` does not reference; (e) `Sign in as guest` planted in
`_site/index.html`, in guest-only **and** standard mode; (f) the landing built with
`--base /wrong/`; (g) all of `_site` checked unchanged → pass. AC4 scanner near misses (each
must be caught): `Firstwaters`, `Kügel` in a JS file, `K&uuml;gel` and `K&#252;gel` in
HTML, a client-internal name in lower case or inside an attribute; and `hkuegel` in the repo URL → not
caught. Word count near misses: visually hidden text counts, a `display: none` panel does not.
AC3: `node scripts/new-app.mjs zzprobe` + `npm install` + `npm run build:pages` → a "Zzprobe"
link appears, no file outside `apps/zzprobe` changed (plus lockfile). AC7: the CI run on the
branch and, after merge, the deploy run of `main` (run ids in the Test report).

No component test repeats E2–E6. No test of the dev server (`npm run dev -w landing` is for
iteration only).

#### 8. Role split, docs and factory files

- **devops:** `landing/package.json`, `landing/tsconfig*.json`, `landing/vite.config.ts`, root
  `package.json` workspaces + `package-lock.json` (`npm install`), `scripts/build-pages.mjs`,
  `scripts/check-dist.mjs`, `scripts/check-structure.mjs`, `packages/platform/config/pages.ts`,
  `packages/platform/config/playwright.pages.ts`, `packages/platform/package.json` (export),
  `eslint.config.js` if needed.
- **developer:** everything in `landing/src/`, `landing/build/`, `landing/index.html`,
  `packages/platform/src/test/tokenRules.ts`; unit tests U1–U5.
- **tester:** E1 in `packages/platform/e2e/pages/pages.spec.ts`, E2–E6 in
  `landing/e2e/pages/landing.pages.spec.ts` (helpers in one `landing/e2e/landing.helpers.ts`).
- **tech-writer:** README (the site root URL, the `landing/` workspace, `npm run dev -w
landing`), CHANGELOG.
- **Factory file, flag only:** CLAUDE.md "Code layout" (a `landing/` entry, `_site/index.html`
  in the `_site` line) and "Commands" (`npm run dev -w landing`) would need a change; no AC of
  this story covers it, so it goes to the retro as a proposal (see my reply), not into this
  story's work.

#### 9. Risks and mitigations

| Risk                                                                         | Mitigation                                                                                                                                |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| SSR and client build with different base → links `/<app>/` (found in spike)  | build-pages passes one `--base` to both; E1 follows every link                                                                            |
| Hydration mismatch (data, locale, time)                                      | one virtual data module for both builds; explicit `'en-US'`; no `Date.now()`/`Math.random()` in render; E3 asserts no console error       |
| Static → interactive switch restarts the entry animation or jumps the layout | animation on a node that survives the switch; UX designs both forms with similar footprint; E4 frame checks                               |
| `_landing` constant drifts between three files                               | comments "keep in sync"; drift fails loudly (unchecked entry in check-dist, or `listSiteApps()` returns `_landing`, no `index.html`)      |
| Wider DejaVu fonts at 320 px on the runner (role names like `product-owner`) | `overflow-wrap: anywhere` in diagram boxes; E5 runs on CI                                                                                 |
| Word caps exceeded only in one form                                          | E2 (static, maximum) and E3 (interactive) both count                                                                                      |
| A banned name hidden by minifier escapes or entities                         | decode before matching (§6), near-miss probes                                                                                             |
| Figure parser and `check-structure` disagree on what a Cost row is           | same rules (fences stripped, Retrospective only); E6 oracle uses the `total (measured)` cells that `check-structure` validates as the sum |
| Build without git (tarball)                                                  | `asOf: null` → derived figures hidden (AC8 by design), page still builds; git stderr ignored                                              |
| Page content drifts from the real process when CLAUDE.md "Process" changes   | no automated guard (the page is a description); tech-writer checks the page when a story changes the process                              |
| An app without `<title>`                                                     | landing build fails with the app's name                                                                                                   |

#### 10. Implementation plan (each step green)

1. **devops:** scaffold `landing/` (package, tsconfigs, vite.config with the data plugin,
   `index.html` with the outlet) with a one-line stub page (`LandingPage` rendering only the
   `h1`, stub `loadLandingData` returning the apps and `null` figures) — the stub `src/` is a
   cross-role exception, recorded in Implementation notes; root workspaces + lockfile;
   `build-pages` landing steps; `check-dist` root unit; `pages.ts`, platform export,
   `playwright.pages.ts` project; `check-structure` scan. Green: `npm run verify`,
   `npm run test:pages` (existing specs pass, `listSiteApps()` unchanged at two apps).
2. **developer:** `tokenRules` option (default unchanged; platform and app token tests stay
   green), then `landing/src` per UX: types, `figures.ts`, `content.ts`, `useEnhanced`,
   components, CSS, tokens, `main.tsx`/`entry-server.tsx`, `build/landingData.ts`; U1–U5.
   Green: `npm run verify`, `npm run test:pages`.
3. **tester:** E1–E6 and the probes; CI run of the branch.
4. **tech-writer:** README, CHANGELOG.

## Implementation notes

_developer: what was built, deviations from the design and why._

**Step 1 (devops, 2026-11-12): toolchain and stub**

- Scaffolded `landing/` (`@swfactory/landing`: `package.json`, three tsconfigs, `vite.config.ts` with
  the `virtual:landing-data` plugin, `index.html` with `<!--ssr-outlet-->` and the `data:,`
  favicon), added it to the root `workspaces`, `npm install` (lockfile only gains the workspace).
  `scripts/build-pages.mjs` builds the landing SSR bundle and client into `_site` with the same
  `--base`, writes `render()` into the outlet and fails on a missing outlet or empty markup.
  `scripts/check-dist.mjs --out` has the root unit (`index.html` + `_landing/`, forbidden strings of
  both modes, no `required`, entry assets under `<base>_landing/`); `pages.ts`
  (`LANDING_ASSETS_DIR`, `listSiteApps()` skips it), platform export `./config/pages`, third
  Playwright project `landing-pages`, `check-structure` scans `landing/`. ESLint, Prettier and
  `ci.yml` needed no change (`dist` is ignored; `landing/build/**` is not linted as node code yet,
  because it has no node globals in use; add `landing/build/**` to the node globals of
  `eslint.config.js` when the glue uses `process`).
- **Cross-role exception (stub in `src/` and `build/`):** to make the step green and testable, devops
  wrote throw-away stubs that the developer replaces: `landing/src/LandingPage.tsx` (only the `h1`,
  carries a `data-apps` attribute so the data module is used; remove it), `src/lib/landingData.ts`
  (the types of the Technical design, complete), `src/landing-data.d.ts`, `src/entry-server.tsx`,
  `src/main.tsx` (hydrate or create root) and `build/landingData.ts` (app discovery is real,
  figures are `null`).
- **Placeholder tests (not U1-U5/E1-E6):** `landing/src/LandingPage.test.tsx` (vitest exits 1 without a
  test file) and `landing/e2e/pages/landing.pages.spec.ts` (Playwright exits 1 on an empty project);
  the developer and the tester replace them.
- Deviation: the outlet is filled by the root-level `build-pages.mjs` after `rmSync(landing/dist)`, so
  a stale SSR bundle can never be used.

**Step 2 (developer, 2026-11-12): the page**

- **Token rules:** `bypassProblems(css, { animationFiles })` in
  `packages/platform/src/test/tokenRules.ts`; default = the sign-in spinner file, so the platform, app
  and skeleton token tests are unchanged and green.
- **Page (`landing/src`):** `LandingPage` (skip link, page wrapper, `main#main`) and one component per
  file in `components/`: `SiteHeader`, `Hero` (+ `HeroMotif`), `Section`, `WhySection`, `HowSection`,
  `Pipeline` (one `.pipeline` wrapper; `PipelineList` = static `ol`, `PipelineTabs` = APG tabs with
  automatic activation, `StepMarker`), `QualitySection`, `ResultSection`, `AppLinks`, `Facts`. Copy as
  in UX §2, the lists in `content.ts`. `useEnhanced` (`useSyncExternalStore`, server snapshot `false`,
  live on the reduced-motion setting), `lib/stepNavigation.ts`, `lib/figures.ts`, `lib/formatCount.ts`
  (the one `en-US` helper), `tokens.css` (`--landing-gate`, `--duration-entry`, `--landing-width`,
  `--landing-text-hero`). The stub `LandingPage`, its `data-apps` attribute and the placeholder unit
  test are gone; the placeholder `landing/e2e/pages/landing.pages.spec.ts` stays for the tester.
- **Build-time data (`landing/build/landingData.ts`):** apps as before; `asOf` = `git log -1
--format=%cs` (stderr ignored, 5 s timeout, failure or an unexpected format gives `null`);
  `backlog.storiesDone` = done rows of the index; `cost.agentRuns` = run rows of the Cost tables of
  those stories (`null` when none has a table; index missing gives `null` for both). Checked on this
  tree: 18 done stories, 116 runs, date 2026-11-12 (equal to the spike's two methods).
- **Unit tests (19 in 5 files):** U1 `lib/figures.test.ts`, U2 `lib/stepNavigation.test.ts`, U3
  `tokens.test.ts`, U4 `components/Facts.test.tsx`, U5 `components/AppLinks.test.tsx`.
- **Checked on the built site** (`_site` served under `/swfactory/`, throwaway Playwright script, not
  committed), 320 / 600 / 1280 px, light and dark, scripts on and off: no horizontal scroll, no element
  past the right edge, no console or page error (hydration), every request same-origin and below 400,
  one `h1`, four `h2`. Words (`innerText`): 338 static / 299 interactive in total; sections 86, 83
  (44 interactive), 71, 60 (the two app titles are one word each; UX counted two). Entry animation:
  one, 900 ms, 1 iteration, none left after it; reduced motion: no animation, static form. From 600 px
  the static list and the rail have the same height and marker position (424 px at 1280). Keyboard:
  skip link, 4 nav links, 2 hero links, the selected tab, the panel, the app cards, the repository
  link, every one with an outline; arrows, Home and End move selection and focus, wrapping. Forced
  colours looked at in both forms. Nothing in storage or cookies. No banned word in `_site/index.html`
  or `_site/_landing/*`.

Deviations from the design:

1. **Figures (UX §8.8):** `CostFigures` holds only `agentRuns`, and `costOfStory` returns
   `{ runs } | null`; `stories`, `measuredTokens` and `runsWithoutTokens` are neither computed nor in
   the types. U1 therefore checks that a run row with `n/a` tokens still counts as a run.
2. **Forced colours, unselected tab (UX §3):** its leading edge is `ButtonText`, not `Canvas`. With
   `Canvas` every unselected tab was a box open on one side (left from 600 px, top below; seen on the
   screenshot). The cue is unchanged: selected = 4 px edge in `Highlight` plus the glyph, unselected =
   1 px and no glyph. One line in `Pipeline.module.css` (`--tab-edge`) if UX wants `Canvas` back.
3. **Rail width at 600 px:** 14 rem, not the 11 rem of UX §6. The grid is as UX §3 writes it
   (`minmax(11rem, 14rem)` and `1fr`); such a track takes its maximum whenever there is room.
4. **`animationFiles` are exact `readCss` keys**, not path suffixes as the old spinner check
   (`endsWith('/auth/LoginView.module.css')`): stricter, same result for every existing stylesheet.
5. **Hero size:** the `clamp()` token is accepted (token files are exempt from the bypass rules), so
   the UX fallback was not needed.
6. **Contrast pairs in U3:** all 26 pairs the landing stylesheets paint, including pairs of platform
   tokens that the platform's token test also has (U3 and UX §8.3 ask for the painted pairs).
7. **Small additions UX left open:** nav links in `--color-text` with a `--color-surface` hover; outer
   corners of the list and the rail use `--radius-control`; on a phone the pointer glyph sits in the
   chip's top corner; the quality numbers are the list's own markers (not in `innerText`); the two
   lists without markers carry `role="list"` (Safari otherwise drops the list semantics); the app
   title is underlined with `text-decoration-line` (the token rule refuses the shorthand's
   `underline` word); a done story of the index whose file is missing fails the build.

Follow-ups / open points:

- On a phone the panel grows by one line when an output wraps (`Gate 2` at 320 px), so the content
  below moves by a line on that selection; the UX minimum height (8 rem) does not prevent it.
- The pointer glyph `▸` is small at both sizes; for hak's look at the screenshots at gate 2.
- `landing/build/**` needs no node globals in ESLint (the glue uses no `process`).
- E1-E6 and the probes are the tester's; `npm run test:pages` is green with the placeholder spec.

**After review round 1 (developer, reported to the orchestrator, who recorded it here):**

- Minor 1: the lead of "How it works" now reads "Every other step is owned by agent roles."
- Nit 3 (orchestrator's scope decision): the tab panel stacks the details of all steps in one grid cell; the inactive
  ones are `visibility: hidden` and `aria-hidden`. The panel height is constant per width (222 px at 320 px, 195 px at
  599 px, 424 px = rail height from 600 px); the static list and the word count are unchanged.
- Nit 4: the second unit case of the app links is removed (the e2e test E1 covers it); the remaining case is named U5.
- Nit 6 (devops, reported to the orchestrator): the `check-dist` root unit fails on any `<script>` without `src` or
  with inline text in the root `index.html` (any casing, any attribute order), so ADR 0011's "no inline script" is
  enforced.

## Test report

_tester: AC → test mapping, results, defects found._

Tester, 2026-11-12, round 1. Tests added: **20** (E1 in `packages/platform/e2e/pages/pages.spec.ts`; 19 in
`landing/e2e/pages/landing.pages.spec.ts`; helpers in `landing/e2e/landing.helpers.ts`; the placeholder spec is replaced). All run on the
published build (`_site/`, served under `/swfactory/`).

| AC  | Test(s)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Result                              |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| AC1 | `AC1: one h1, level-2 sections reachable from the navigation, the word caps hold` (scripts off, UX caps 4 / 100 / 400); `AC1/AC5: hydrates without an error, the caps still hold, nothing is stored` (scripts on); E1 (repository link)                                                                                                                                                                                                                                                                                       | PASS                                |
| AC2 | `AC2: the pipeline is plain text, in order, with both gates marked`; `AC2: the keys move through the steps and the panel shows the owner and the output` (all 9 steps, wrap, Home/End, Tab to panel); `AC2: one entry animation of at most 2 s, one iteration, and every transition is finite`; `AC2/AC6: the entry animation is visible and nothing loops afterwards` (27,226 px differ between first and finished frame, idle noise 0); `AC2/AC6: no animation, no control to operate, every step as text` (reduced motion) | PASS                                |
| AC3 | E1 `021 AC3/AC5/AC7: the site root links every published app` (hrefs as a set = `listSiteApps()`, no `target`, each link reaches the app's login); `AC3: the sources of the ideas and figures used are named`; "no apps" text: U5 (unit, not repeated); "new app appears without a platform change": probe below                                                                                                                                                                                                              | PASS                                |
| AC4 | `AC4: no banned word in the visible text or in any file of the root unit`; `AC4: the scanner catches near misses and lets the repository address pass`                                                                                                                                                                                                                                                                                                                                                                        | PASS                                |
| AC5 | E1 (same origin, every response < 400, script and stylesheet loaded, no sign-in control); `AC1/AC5: hydrates ... nothing is stored` (storage, IndexedDB, cookies)                                                                                                                                                                                                                                                                                                                                                             | PASS                                |
| AC6 | `AC6: no horizontal scrolling at 320 / 1280 px, light / dark / forced colours, with and without scripts` (6 tests); `AC6: every control is reachable by keyboard in reading order and shows a focus ring`; `AC6: in forced colours the selected step, an unselected step and a gate differ without colour`; reduced motion: see AC2; contrast: U3 (26 pairs) plus the re-checks below                                                                                                                                         | PASS                                |
| AC7 | E1 (root and both apps from the one `_site`, every link followed); check-dist probes below; **open:** CI run of the branch and the deploy run of `main` (not started: the orchestrator asks hak first)                                                                                                                                                                                                                                                                                                                        | PASS for what runs locally; CI open |
| AC8 | `AC8: each figure equals the repository count on the stated date; the estimate is labelled` (oracle: frontmatter `status: done` = 18, last `### Cost` table minus total/orchestrator rows = 116, `git log -1 --format=%cs`). Not vacuous: two derived figures and the estimate are shown                                                                                                                                                                                                                                      | PASS                                |

**Results.** `npm run verify` exit 0. Vitest (by `> @swfactory/<name>` header): platform 154 passed, avd 100
passed, minesweeper 103 passed, landing 19 passed; the template skeleton (`check:template`) 5 passed.
`npm run test:pages`: 23 passed (project `pages` 3, `app-pages` 1, `landing-pages` 19), no retry.
`npm run test:e2e`: avd 80 passed (`chromium` 39, `platform` 41), minesweeper 110 passed (`chromium` 64,
`platform` 41, `chromium-3d` 5); logs read: no `flaky`, no retry, no failure.

**Mutation checks** (each applied to `landing/src`, `npm run build:pages`, then the pages and landing projects;
source restored and diffed after): banned word in the copy, a client-internal name in an attribute, `Impressum` in the copy (AC4
test); a fifth `h2` and a nav link removed (AC1 test); a second `h1` (E1 and AC1); a section over 100 words (AC1);
`infinite` on the entry animation, 2500 ms entry, tab selection no longer reaching `getAnimations` (AC2 tests;
`infinite` also fails 8 other specs that wait for the page to settle); app links to a wrong base and an added
"Sign in" button (E1); figures +1 and -1 (AC8); the `▸` glyph removed and a gate rendered as a step (forced-colours
test); `min-width: 400px` (the three 320 px tests); `localStorage.setItem` (AC1/AC5); every tab a tab stop and the
focus outline removed (keyboard test); the panel stuck on step 1, a step role emptied, a step label changed
(AC2 tests, also in the static list: first version used `toContainText` and let `Docs2` pass, fixed to an exact
label); reduced motion ignored by `useEnhanced` (reduced-motion test). Scanner mutations in the helper (no named
entities, substring match, no `\u` decoding) each fail the near-miss test. A third-party stylesheet link in
`index.html` is stopped even earlier, by `check-dist` (build fails). One survivor, equivalent: removing the hero's
own `animation: none` under reduced motion changes nothing because `base.css` forces `animation: none !important`
(and the token is `0s`); three independent guards.

**Probes from the Technical design (scratch copy under the scratchpad, repo untouched):** `check-dist --out`
with a stray `_site/stray.txt`, a stray `_site/_other/`, `index.html` removed, `__fakeGoogle` in an unreferenced
`_site/_landing/extra.js`, `Sign in as guest` in `index.html` (guest-only and standard mode), `--base /wrong/`:
every one exits 1 with a clear message; `_site` unchanged: exit 0. `node scripts/new-app.mjs zzprobe` +
`npm install --offline` + `npm run build:pages`: a "Zzprobe" link `/swfactory/zzprobe/` appears on the root page;
the only changed tracked file is `package-lock.json`, nothing in platform, landing or scripts. Scanner near misses
(`Firstwaters`, `Kügel` as UTF-8 and as `\u00fc`, `\u{fc}`, `\xfc`, decomposed ü, `K&uuml;gel`, `K&#252;gel`,
`K&#xFC;gel`, a client-internal name in lower case or in an attribute, `hak`) are caught; `hkuegel` in the repository URL, `hake`, a longer word that merely contains a banned one as prefix
and `Internal` pass. Word count: text positioned off-screen counts, `display: none` and `visibility: hidden` do not
(8 of 8 expected on a fixture).

**Contrast re-check with a tool** (own script from `tokens.css` of platform and landing, WCAG formula, both
schemes, four backgrounds): all 26 painted pairs hold, no failure. UX numbers confirmed within 0.1 (e.g. text on
accent-subtle 14.35 / 11.74, `--landing-gate` on accent-subtle 4.35 / 8.47, edge on accent-subtle 3.65 / 4.62,
the lowest margin); one UX figure is wrong in the safe direction (accent on page, dark: 10.81, UX wrote 9.6).
Rendered check (every visible text element, computed colour against the first opaque ancestor background, the
hero gradient against both ends; light and dark, scripts on and off; throwaway spec, not kept): 0 failures,
lowest ratio 6.08 (light) and 6.66 (dark). Non-text parts (gate, edge, focus) are covered by the same token pairs.

**Checked, OK (not kept as tests):** double click and rapid clicking of tabs; keyboard with Tab, arrows, Home, End;
hostile text is not applicable (no input); long strings (no field); forced colours at 320 and 1280 px (screenshots);
dark scheme really applied (asserted in E5: light text on dark and the reverse); reduced motion (asserted).
Tested the hero rise only as real CSS (the page-load recorder catches a one-shot animation without a race).

**Developer's open points (reported, not fixed).**

1. Panel growth at 320 px: measured per selected step, the panel is 222 px high for `Story` and `Gate 2` and 195 px
   for the other seven; the content below (#quality) therefore moves by 27 px when the selection changes between
   a long and a short output (initial state `Story`, so the first selection of any other step shifts the page up
   by 27 px). AC6 asks for no horizontal scrolling, contrast, cues, reduced motion and keyboard; it has no rule on
   layout shift, and the focused chips sit above the shift, so I judge it acceptable under AC6. It is a polish
   point for hak at gate 2; a `min-height` that fits the longest output (222 px) would remove it.
2. `▸` glyph: computed 16 px, visually a small triangle (about 7 px wide at 1x, see
   `screenshots/021/glyph-closeup-1280.png`); at 320 px it sits in the chip's top corner and is easy to miss
   (`forced-colours-320.png`). It is not the only cue (4 px/top edge, filled marker, `aria-selected`), so AC6 holds;
   whether it is big enough is hak's look at gate 2.

**Defects:** none found.

**Screenshots** (gitignored, taken after the last e2e run): `screenshots/021/` holds `full-1280-light.png`,
`full-1280-dark.png`, `full-320-light.png`, `forced-colours-1280.png`, `forced-colours-320.png`,
`scripts-off-form-1280.png`, `scripts-off-full-1280.png`, `step-selected-1280-gate1.png`,
`step-selected-320-gate2.png`, `glyph-closeup-1280.png`.

**Manual checks no agent can run:** the live site `https://hkuegel.github.io/swfactory/` after the merge (root and
both apps from one deploy run); a real phone (touch, text size, notch); a real screen reader (tab and panel
announcement, skip link). **Open:** green CI run of the branch (run id to be added) and the deploy run of `main`.

**After review round 1 and the confidentiality fix (tester, reported to the orchestrator, who recorded it here):**

- AC4: the three client-internal names are checked only as SHA-256 hashes of case-folded word tokens, so no plain
  text of them exists in the repository; the scanner's self-test uses a made-up dummy word and its hash. A scratch
  mutation (one of the names in the h1) failed the AC4 test under its neutral label and was reverted.
- Review finding 2: the AC8 figure and estimate lookups are scoped to the result section.
- `npm run verify` green (vitest: platform 154, avd 100, minesweeper 103, landing 18; skeleton 5), `npm run test:pages`
  23 passed.
- CI (DoD), state before these fixes: run 43230867084 on the branch at 79c2129 – verify, pages (23 passed), e2e
  (avd 80 passed, minesweeper 110 passed, no flaky) green; deploy skipped (not main). That branch was replaced after
  the confidentiality fix; the run on the cleaned branch is recorded below.

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

**Round 1, reviewer 2026-11-12. Verdict: APPROVED. Checklist version: 2**

Reviewed `git diff main...HEAD` (79c2129) plus the uncommitted story, ADR 0006/0010/0011, index and
memory edits (`.claude/launch.json` ignored). CI run 43230867084 was still running at review time
(`verify` and `pages` green, `e2e` in progress); the orchestrator adds its result.

| Item | Result | Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1   | pass   | AC1 `LandingPage`/`SiteHeader`/`Section` → E2 caps + nav; AC2 `Pipeline`/`PipelineList`/`PipelineTabs`/`useEnhanced` + Hero CSS → E2, E3 keys, E4, reduced-motion test, U2, U3; AC3 `AppLinks` + `build/landingData.ts` → E1, U5, sources test; AC4 copy → AC4 tests (I scanned all of `_site/`: no hit); AC5 → E1 + E3 storage; AC6 → E5, keyboard, forced colours, U3; AC7 `check-dist` root unit + `build-pages` → E1, probes, CI open; AC8 `figures.ts`/`Facts` → E6, U1, U4 |
| C2   | n.a.   | no network call or pending UI state; the build-time `git log` has a 5 s timeout and falls back to `null`                                                                                                                                                                                                                                                                                                                                                                         |
| C3   | pass   | `useEnhanced` (`useSyncExternalStore`, server snapshot `false`, listener removed), `Pipeline` state, no stored derived value; a reduced-motion mismatch is caught (probe below)                                                                                                                                                                                                                                                                                                  |
| C4   | n.a.   | no render loop or imperative controller; React writes no inline style                                                                                                                                                                                                                                                                                                                                                                                                            |
| C5   | n.a.   | no reducer                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| C6   | pass   | no git → figures hidden (the AC's visible state); missing `<title>` or missing story file throws; `build-pages` exits 1 with a message on build failure, missing outlet, empty markup (probed)                                                                                                                                                                                                                                                                                   |
| S1   | pass   | no `dangerouslySetInnerHTML`; app titles and figures are JSX text (escaped by React); hrefs are `BASE_URL` + directory name; the outlet is replaced with a replacer function                                                                                                                                                                                                                                                                                                     |
| S2   | pass   | no secret, no env variable; only public URLs (repository)                                                                                                                                                                                                                                                                                                                                                                                                                        |
| S3   | pass   | lockfile adds only the `landing` workspace link; `react`/`react-dom` already in use; ADR 0011                                                                                                                                                                                                                                                                                                                                                                                    |
| S4   | n.a.   | no dev-only code in `landing/`; the root unit is scanned for the platform's forbidden strings of both modes                                                                                                                                                                                                                                                                                                                                                                      |
| S5   | pass   | hand run on a scratch copy: `check-dist --out` fails on a forbidden string in a nested unreferenced `_landing/` file, `Sign in with Google`/`accounts.google.com` in the root in guest-only mode, `Sign in as guest` in the root in standard mode, `.nojekyll`, `_landing2/`, missing `_landing/`, an external entry script and stylesheet; `build-pages` fails on empty markup and on a missing outlet; `check-structure` flags an app name in `landing/src` and `landing/e2e`  |
| T1   | pass   | `npm run verify` exit 0 (platform 154, avd 100, minesweeper 103, landing 19, skeleton 5; `check-dist: ok landing (root unit, 3 files)`); `test:pages` 23 passed                                                                                                                                                                                                                                                                                                                  |
| T2   | pass   | one test per AC at the cheapest level; one small duplicate, finding 4                                                                                                                                                                                                                                                                                                                                                                                                            |
| T3   | pass   | non-vacuity guards (text length, `.js` present, oracle throws on 0, `expect(PAIRS).toHaveLength(26)`, option-off assertion in U3); probe: a one-word text change in `_site/index.html` makes the hydration test fail                                                                                                                                                                                                                                                             |
| T4   | pass   | focus by role, Tab sequence derived from the DOM not counted by hand, settled before computed styles, AC names; one unscoped label lookup, finding 2                                                                                                                                                                                                                                                                                                                             |
| T5   | pass   | `figures.ts` U1, `stepNavigation.ts` U2, `Facts` branches U4; script paths hand-run (S5); my parser probe over the real backlog: 18 done, 116 runs, CRLF and trailing spaces handled                                                                                                                                                                                                                                                                                             |
| K1   | pass   | matches design + ADR 0011; the 7 deviations are recorded and sound; no dead code                                                                                                                                                                                                                                                                                                                                                                                                 |
| K2   | pass   | no `any`/`!`, `source?: string \| undefined`, named exports, one component per file, tests colocated                                                                                                                                                                                                                                                                                                                                                                             |
| K3   | pass   | colours from tokens (token test green), every `transition` on `var(--duration)`, `[aria-selected]` in `:where()`; built CSS keeps the forced-colours rule after the normal one (offset 11243 vs 8673)                                                                                                                                                                                                                                                                            |
| K4   | pass   | `check:structure` green and now scans `landing/` (probed); `pages.ts`/`tokenRules.ts` stay generic                                                                                                                                                                                                                                                                                                                                                                               |
| K6   | pass   | story `in-review` = index row `in-review`                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| K7   | pass   | Decision log unchanged since gate 1 (append only); UX selection within the essential set was delegated by the story                                                                                                                                                                                                                                                                                                                                                              |
| K8   | n.a.   | written by the tech-writer in parallel; checked before gate 2                                                                                                                                                                                                                                                                                                                                                                                                                    |
| K9   | pass   | prettier part of verify green; story checked after this section                                                                                                                                                                                                                                                                                                                                                                                                                  |
| K10  | pass   | `format:check` uses `--ignore-path ../.prettierignore`; `tsconfig.app.json` includes the platform `vite-env.d.ts`                                                                                                                                                                                                                                                                                                                                                                |
| K11  | n.a.   | no env variable added                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| A1   | pass   | APG tabs (roving tabindex, arrows/Home/End wrap, `aria-controls`, panel `tabIndex=0`), skip link, nav; focus ring checked by E3                                                                                                                                                                                                                                                                                                                                                  |
| A2   | pass   | selected = 4 px edge + `▸`, gate = diamond + label text, kept in forced colours (E3); 26 painted pairs in U3                                                                                                                                                                                                                                                                                                                                                                     |
| A3   | pass   | no live region; reduced motion → static form, no animation (E4); one 900 ms entry animation                                                                                                                                                                                                                                                                                                                                                                                      |
| A4   | n.a.   | no canvas or render loop                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

Content: the copy equals UX §2 (compared programmatically: every backticked string of §2 is in the
rendered `_site/index.html` or, for panel labels and the no-apps text, in the bundle). Banned words:
none in any file of `_site/` (apps included) nor in `landing/src`. Pipeline steps and owners match
CLAUDE.md "Process" and "Roles"; one sentence of the lead does not (finding 1).

The tester's two polish points: the 27 px panel growth at 320 px is finding 3 (nit, for hak's look);
the small `▸` glyph is no finding (a second cue next to the 4 px edge and the filled marker; size is
taste, for gate 2).

Findings:

1. `[minor] landing/src/components/HowSection.tsx:10 (and UX §2, story line 165)` - "Every other step
   belongs to one agent role." is false for `Design`, which the diagram right below gives to
   "Architect, UX designer" (CLAUDE.md: architect + ux-designer). A public page should not contradict
   itself - change the copy in UX §2 and the code, e.g. "Every other step is owned by agent roles."
   (same word count).
2. `[minor] landing/e2e/pages/landing.pages.spec.ts:491-504` - `figureOf` and the `estimate` locator
   search `dt` on the whole page; CLAUDE.md asks label lookups to be scoped to their region, as later
   stories may add `dl`s with the same labels - scope them to `page.locator('#result')` (as line 503
   already does).
3. `[nit] landing/src/components/Pipeline.module.css:183` - at 320 px the panel is 195 px or 222 px
   high by output length, so the content below moves by 27 px on selection - for hak at gate 2; if
   wanted, size the panel for the longest output (e.g. reserve two lines for the `dd`).
4. `[nit] landing/src/components/AppLinks.test.tsx:13` - the second case (href, title-only name, no
   `target`) repeats what E1 shows on the built page - drop it; U5's first case is the needed branch.
5. `[nit] .claude/agent-memory/ux-designer/MEMORY.md:64, .claude/agent-memory/tester/MEMORY.md:96` -
   two new lessons keep a recipe this story refuted: the UX line says to paint the unselected edge
   `Canvas` (deviation 2 showed it leaves the box open; `ButtonText` was used), and the tester line says
   stripping fences by regex mis-pairs, while `figures.ts` strips them with an anchored back-referenced
   regex and gives 116 - reword both ("`ButtonText`/`Highlight`", "a naive fence regex").
6. `[nit] scripts/check-dist.mjs:254` - nothing guards ADR 0011's "no inline script" (a probe with
   `<script>alert(1)</script>` in the root `index.html` passes `check-dist`; E1 only sees requests) -
   optional: fail the root unit on a `<script>` without `src`, so a later CSP stays possible.

## Explanation

_orchestrator: plain-language explanation shown at gate 2, at most 15 lines of at most 120 characters. No code, no file names._

## Retrospective

_orchestrator: what went wrong (review rounds, defects, corrections at the gates),
proposed changes to agents/CLAUDE.md/templates, and which ones hak approved. Include a
`### Cost` table (see the retro step of `/feature`)._
