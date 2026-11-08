---
id: 018
title: Deploy the apps on GitHub Pages
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: platform # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<name>/docs/backlog)
branch: feature/018-deploy-github-pages
supersedes: [] # stories this one fully replaces, e.g. [004]
changes: [001/AC1, 004/AC1, 004/AC11, 004/AC12] # stories whose behaviour this one modifies, e.g. [004/AC2, 007]
superseded-by: # set on the OLD story when a newer one replaces it
---

# 018 – Deploy the apps on GitHub Pages

## Original request

> 1. hak, 2026-11-08: "können wir das noch irgendwo in der cloud über einen freien kostenplan deployen ? Google zum Beispiel"
> 2. hak's slash command, 2026-11-08: "/feature Deployment auf Firebase Hosting"

Later words of hak (gate 1, 2026-11-08, verbatim):

> 3. "4. mit Gastzugang. 6. ja. wir sollten in keinerlei rechtliche Probleme laufen"
> 4. Choices in a question dialog: Google sign-in online → "Nur Gast online (Recommended)"; Impressum and privacy pages in every app → "Nein"; hosting → "GitHub Pages".

## User story

As the sponsor of the software factory, I want every app to be published automatically on GitHub Pages with guest sign-in only, so that I can open and show the apps from any browser without running them locally and without any Google or cloud console setup.

## Context

- The hosting target changed from Firebase Hosting to GitHub Pages at gate 1 (Decision log). The Firebase research of the first draft is obsolete and removed from this story; the Decision log keeps its trace.
- GitHub Pages facts (research 2026-11-08 from the official GitHub and Vite docs; unconfirmed points are marked):
  - One Pages site per repository: `https://hkuegel.github.io/swfactory/`, so the apps live under subpaths (`/avd/`, `/minesweeper/`). Every app needs its public base path set accordingly; one artifact carries all apps.
  - hak sets "Pages → Source: GitHub Actions" once in the repository settings. The deploy runs as jobs of the CI workflow that need the verify job and run only for pushes to `main`. No token or secret is needed (the workflow's own permissions are enough).
  - No custom cache headers on Pages. Hashed build files make that harmless; the start page may be stale for a few minutes (secondary source, unconfirmed). No cache criterion is therefore written.
  - Limits: site up to 1 GB, bandwidth soft limit 100 GB per month, deploy timeout 10 minutes. Prohibited: sites primarily for commercial transactions or software as a service. Not relevant for these apps.
  - GitHub logs visitor IP addresses (GitHub privacy statement).
- Sign-in online (hak's decision, "Nur Gast online"): the deployed apps offer **only** "Sign in as guest". There is no Google sign-in online, so no OAuth client ID, no consent screen and no Google console step are needed. Open Questions 4 and 6 of the first draft are thereby answered.
- Feasibility (architect, 2026-11-08): guest sign-in is in memory only (no network, no storage), so enabling it online is low risk. The smallest change is a public build setting (default off, set only by the deploy build) so that the existing dev-only guards become "development or setting on". Consequences that the design must handle:
  - 004/AC12 ("no guest option in a production build") holds only while the setting is off; the deploy build is the exception. 001/AC1, 004/AC1 and 004/AC11 name the Google option or the Google intro text and are false in the deploy build. The old ACs are annotated accordingly.
  - The dev-only check (`npm run check:dist`) forbids the guest string today for every build. It must keep forbidding it while the setting is off, and it must forbid the e2e sign-in fake marker always (011/AC6 still holds).
  - The CLAUDE.md "Dev-only code" rule names guest sign-in as its example. It needs an edit, and a new ADR records the decision. This story's AC6 is the approval for that factory-file edit (CLAUDE.md "Factory files").
  - The Google Identity Services script is loaded lazily by the Google client; the design must confirm that the deployed build makes no request to Google on page load.
- The platform serves all apps (ADR 0006): the deploy mechanism is generic and lists apps in configuration; no app name appears in platform code (`npm run check:structure`). App names appear only in this story.
- Legal (hak's decision, no legal assessment by the factory): before hak decided, the orchestrator pointed out that a public site from Germany may need an Impressum (section 5 DDG) and a privacy statement, because GitHub logs visitor IP addresses. hak decided against both pages in the apps ("Nein"). The risk is named in the README (AC7) as a note for hak. Whether this is sufficient is open for hak to review with the AI transformation lead (Open question 2).
- Agents cannot operate the GitHub settings. hak's only one-time manual step: Settings → Pages → Source: GitHub Actions.

## Acceptance criteria

- **AC1:** Given a deploy of `main`, when hak opens `https://hkuegel.github.io/swfactory/avd/` and `https://hkuegel.github.io/swfactory/minesweeper/`, then each shows its own app with its login screen, and none of its JS or CSS files returns a 404 (all asset requests succeed under the subpath). Both apps come from one published artifact, and a further app added to the deploy configuration is published without a change to platform code.
- **AC2:** Given the deploy build, when I open an app's login screen, then it shows "Sign in as guest" and no "Sign in with Google" option, no text that offers Google sign-in (see Open question 1), and the page makes no request to a Google host on load. Choosing "Sign in as guest" signs me in with no error message, and 004/AC2, AC4, AC8 and AC10 still hold.
- **AC3:** Given the default build (guest setting off, as for any other production build), when the dev-only check runs on it, then 004/AC12 holds (no guest option, no guest string in the built files) and the e2e sign-in fake string is absent. Given the deploy build, then the check passes with the guest string allowed and the fake string still absent; and it fails when the fake string appears in either build or when the guest string appears while the setting is off.
- **AC4:** Given local development and test runs (`npm run dev`, `npm run test:e2e`), when I open the login screen, then it behaves as before this story: Google option and guest option both shown (004/AC1, AC11), the e2e sign-in fake works, and no setting has to be provided.
- **AC5:** Given a push to `main`, when verification (`npm run verify`) and the e2e tests are green, then the apps are published once, and the dev-only check ran on exactly the artifact that is published. Given verification, the e2e tests or the dev-only check fail, or a push to a branch other than `main`, then nothing is published. A manual run of the same checks (`workflow_dispatch`) publishes only if all pass. No secret or token is committed, and none is needed.
- **AC6:** Given the repo, when the factory files are read, then the CLAUDE.md "Dev-only code" rule describes guest sign-in as available in development or when the public build setting is on (deploy build only), keeps the e2e fake as never shipped, and a new ADR records the build setting, the flag-aware check and the subpath hosting decision. This AC approves that edit of a factory file.
- **AC7:** Given the README, when hak sets up deployment, then a deployment section names the one-time step (Pages → Source: GitHub Actions), the URLs of both apps, the manual run, that only guest sign-in is online (no Google), and, as a note for hak, that no Impressum or privacy page is provided by his decision and that GitHub logs visitor IP addresses.
- **AC8:** Given a deploy has run, when hak checks the live apps, then both URLs are reachable, guest sign-in works, a reload on the app path still shows the app, and the apps behave as locally. Manual check: the Test report lists it as such (agents cannot reach the live site).

## Out of scope

- A custom domain, PR preview deployments (hak accepted "no previews"), paid services and any hosting other than GitHub Pages.
- Google sign-in online and everything it needs (client ID, authorized origins, consent screen); Microsoft sign-in (story 002); staying signed in across reloads (story 003); route protection.
- Impressum and privacy pages in the apps (hak: "Nein"); legal assessment.
- A backend, analytics, error monitoring and uptime checks.
- Operating the GitHub settings (hak's manual step).

## Open questions

1. Does the deploy build hide the intro text "Use your Google account to sign in." entirely, or show a short guest-only note? [Copy is left to the UX design; the criterion is only that no Google offer appears.]
2. Is publishing without an Impressum and privacy page acceptable from a legal view? [hak decided "Nein"; the factory makes no legal assessment. Not blocking: hak confirms the decision at gate 1 (a legal review, e.g. by a lawyer, is hak's choice). Marked "prüfungs- bzw. abstimmungsbedürftig".] Closed at gate 1: hak confirmed "Nein" (Decision log).

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-08 — Scope decision (orchestrator): recommended Firebase Hosting on the Spark plan, one site per app in one Firebase project; open points named to hak: which apps, manual or automatic deploy, guest access online. hak then started `/feature Deployment auf Firebase Hosting`. The proposals in the Open questions are unconfirmed defaults. **Superseded by the entries below (hosting is GitHub Pages).**
- 2026-11-08 — Gate 1, general: after the orchestrator said that its proposal holds for every point hak does not name, hak answered: "4. mit Gastzugang. 6. ja. wir sollten in keinerlei rechtliche Probleme laufen". (product-owner)
- 2026-11-08 — Q4 (guest sign-in online?): hak: "4. mit Gastzugang." Then, in the question dialog, for Google sign-in online: "Nur Gast online (Recommended)". Consequence: deployed apps offer only guest sign-in, no Google; AC2, AC3, AC6; 004/AC12 and others get `changes:`.
- 2026-11-08 — Q6 (publish the OAuth consent screen without branding): hak said "6. ja" before choosing guest only. **Obsolete:** with no Google sign-in online there is no consent screen step.
- 2026-11-08 — Hosting (question dialog): hak chose "GitHub Pages". Consequence: Firebase decisions are superseded; Q5 (site IDs), Q7 (Firebase terms) and Q8 (quota conflict) are obsolete; story renamed to 018-deploy-github-pages; first-draft Firebase Context and ACs replaced.
- 2026-11-08 — Impressum and privacy pages in every app (question dialog): hak chose "Nein". Orchestrator note: before this, it pointed out (no legal assessment) that a public site from Germany may need an Impressum (section 5 DDG) and a privacy statement because GitHub logs visitor IP addresses. hak decided against both pages; the risk is recorded here and in the README (AC7). hak also said: "wir sollten in keinerlei rechtliche Probleme laufen"; this tension is Open question 2.
- 2026-11-08 — Q1 (which apps), Q2 (automatic deploy on push to `main` after green CI plus a manual fallback) and Q3 (no PR previews): accepted proposals through hak's "my proposal holds for all points you don't name". With GitHub Pages the manual fallback is a manual `workflow_dispatch` run with the same checks (AC5).
- 2026-11-08 — Feasibility (architect): guest sign-in is in memory only, so enabling it online is low risk; a public build setting (default off) is the smallest change; `check:dist` must become flag-aware; the CLAUDE.md dev-only rule and 004/AC12 need changes. Recorded in Context, AC3, AC6. (product-owner)

<!-- Sections below are filled in by later roles. Don't delete headings. -->

- 2026-11-08 — Gate 1: hak approved the story ("Ja, committen") after the orchestrator said that approving it confirms the "Nein" to Impressum and privacy pages; Open question 2 is closed by that confirmation. A legal review stays hak's choice.

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

## Implementation notes

_developer: what was built, deviations from the design and why._

## Test report

_tester: AC → test mapping, results, defects found._

| AC  | Test(s) | Result |
| --- | ------- | ------ |

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

## Explanation

_orchestrator: plain-language explanation shown at gate 2, at most 15 lines of at most 120 characters. No code, no file names._

## Retrospective

_orchestrator: what went wrong (review rounds, defects, corrections at the gates),
proposed changes to agents/CLAUDE.md/templates, and which ones hak approved. Include a
`### Cost` table (see the retro step of `/feature`)._
