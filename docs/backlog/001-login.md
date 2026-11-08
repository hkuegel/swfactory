---
id: 001
title: Login with Google
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
branch: feature/001-login
supersedes: []
changes: []
superseded-by:
---

# 001 – Login with Google

## Original request

> login - the user should be able to login, using google or exchange

## User story

As a visitor of the app, I want to sign in with my Google account and sign out again, so that the app knows who I am and I stay in control of whether I am signed in.

## Context

First real story; the backlog was empty. The app is currently a fresh scaffold with a placeholder counter, no backend, no routing and no authentication.

hak's original request named two providers, Google and "exchange". At gate 1 hak narrowed the scope to Google only ("lets start with only google authentication"). The Microsoft / "exchange" sign-in was split off into [002 – Login with Microsoft](002-login-microsoft.md).

Constraints confirmed by hak at gate 1 ("Yes, confirm all"). They are constraints, not ACs:

- Any Google account (personal or organisation) may sign in; there is no restriction by domain or account.
- Frontend-only: there is no backend in this story and no server-side verification of the sign-in.
- Nothing in the app is protected yet. "Signed in" means only that the user's name (or email, see AC11) is shown.
- The app stores no user data of its own; user information is kept in memory only.
- Every page reload shows the login screen, whether or not the user was signed in before. Staying signed in across reloads is not part of this story (hak, 2026-11-01, "C: drop AC7/AC8"); it moves to [003 – Stay signed in](003-stay-signed-in.md), which needs a backend.

AC7 and AC8 are removed and their numbers are not reused. AC10 stays: after a logout, a reload must not sign the user in again, which is now also what happens on every reload.

In automated tests the identity provider will be simulated. The ACs below describe only what the user can observe.

## Acceptance criteria

- **AC1:** Given I am not signed in, when I open the app, then I see a login screen with a "Sign in with Google" option and no signed-in state. (changed by [004](004-guest-login.md)) (changed by [018](018-deploy-github-pages.md): the deploy build shows no Google option)
- **AC2:** Given I am on the login screen, when I choose "Sign in with Google" and complete the Google sign-in successfully, then I see that I am signed in, with my name displayed, and the login screen is no longer shown.
- **AC3:** Given I have chosen "Sign in with Google" and the sign-in is in progress, when I look at the login screen, then a progress indication is visible and the "Sign in with Google" option is disabled until the attempt ends.
- **AC4:** Given I have chosen "Sign in with Google", when I cancel or close the Google sign-in without completing it, then I stay on the login screen, I see a message that the sign-in was cancelled, and the option is enabled again.
- **AC5:** Given I have chosen "Sign in with Google", when Google reports an error (for example unavailable or access denied), then I stay on the login screen, I see an error message that the Google sign-in failed, and the option is enabled again.
- **AC6:** Given a sign-in attempt has failed or was cancelled and an error or cancel message is shown, when I retry and the sign-in succeeds, then I see the signed-in state and no error or cancel message is shown anymore.
- ~~**AC7:** Given I am signed in and my Google session is still valid, when I reload the page, then I am still signed in with my name displayed, without having to choose "Sign in with Google" again.~~ _Removed 2026-11-01 (hak, option C) — staying signed in moves to [003](003-stay-signed-in.md)._
- ~~**AC8:** Given I was signed in but my Google session is no longer valid, when I reload the page, then I see the login screen and no signed-in state.~~ _Removed 2026-11-01 (hak, option C) — staying signed in moves to [003](003-stay-signed-in.md)._
- **AC9:** Given I am signed in, when I choose to sign out, then I see the login screen with the "Sign in with Google" option and no signed-in state.
- **AC10:** Given I have signed out and my Google session is still valid, when I reload the page, then I still see the login screen and no signed-in state (I am not signed in again silently).
- **AC11:** Given Google provides no name for my account, when I sign in successfully, then my email address is displayed in place of the name.

## Out of scope

- Sign-in with a Microsoft work account ("exchange"): see [002 – Login with Microsoft](002-login-microsoft.md).
- Staying signed in across page reloads or browser restarts: see [003 – Stay signed in](003-stay-signed-in.md).
- Server-side verification of the sign-in and any backend (later story, see 003).
- Protecting parts of the app or routes so that only signed-in users can access them (later story).
- Restricting which Google accounts may sign in, for example to a domain (later story).
- Linking or merging accounts across providers (only relevant once more than one provider exists, see 002).
- User profiles, roles or any persisted user data of our own.
- Any other sign-in method (username/password, other providers).

## Open questions

None.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-01 — Story created from hak's request. Interpretation of "exchange" as a Microsoft work account recorded as an assumption in Open questions; not decided. Scope limited to sign-in and the signed-in state; logout and route protection named as likely separate stories. (product-owner)
- 2026-11-01 — Q: Scope, which providers should the first story cover (Google and "exchange" as requested, or fewer)? — A: "lets start with only google authentication" (hak, gate 1). Consequence: story rescoped to Google only (title, user story, ACs; the Microsoft option and its AC removed, ACs renumbered AC1 to AC6); Microsoft / "exchange" split off into story 002; open questions that only apply with several providers or to Microsoft moved to 002 or dropped; proposed defaults added to the remaining open questions, not yet confirmed. (product-owner)
- 2026-11-01 — Q: Allowed accounts: are all Google accounts allowed, or only certain ones? — A: Any Google account for now; no restriction (confirmed by hak: "Yes, confirm all"). Recorded as a constraint; restriction by domain or account is a later story.
- 2026-11-01 — Q: Backend: is there or should there be a backend as part of this story? — A: Frontend-only for now; server-side token verification is a later story (confirmed by hak: "Yes, confirm all").
- 2026-11-01 — Q: What changes after login / what is protected? — A: Nothing is protected yet; "signed in" means only that the user's name is shown (confirmed by hak: "Yes, confirm all"). Route protection is a later story.
- 2026-11-01 — Q: Stay signed in after reload? — A: Yes, through Google's own session, with no storage of our own (confirmed by hak: "Yes, confirm all"). Added as AC7 and AC8.
- 2026-11-01 — Q: Logout in this story or a follow-up? — A: Part of this story (confirmed by hak: "Yes, confirm all"). Added as AC9 and AC10; user story updated.
- 2026-11-01 — Q: What is shown if Google does not deliver a name? — A: Show the email address (confirmed by hak: "Yes, confirm all"). Added as AC11.
- 2026-11-01 — Q: Is any data about the user stored? — A: None; kept in memory only (confirmed by hak: "Yes, confirm all"). Recorded as a constraint. Status set to ready.
- 2026-11-01 — Q: 11 ACs exceed the ~7 guideline; split session/logout (AC7–AC10) into a separate story? — A: "Go, keep 11 ACs" (hak, gate 1). Story approved as is. (orchestrator)
- 2026-11-01 — Q: (architect's open question 1) AC7 (stay signed in after reload) can't be met reliably with "frontend-only, no own storage" together with AC3 to AC5 (own button with disabled, cancel and error states). Options: C = drop AC7/AC8, every reload shows the login screen, staying signed in moves to a backend story; A = keep AC7 as best effort via Google's automatic sign-in (Chrome/Edge only, rate-limited, Google prompt may show); A+ = A plus a non-personal "was signed in" flag in local storage; D = Google's own button (AC3 to AC5 not possible); E = keep name/email in session storage. — A: "C: drop AC7/AC8" (hak). Consequence: AC7 and AC8 marked removed (numbers not renumbered, not reused); every reload shows the login screen; AC10 unchanged and still valid; Context and Out of scope updated; open questions now empty; staying signed in split off into story 003 (draft). (product-owner)
- 2026-11-01 — Q: (gate 2) "Cancel" on Google's consent screen arrives as `access_denied` and shows the AC5 error, not the AC4 cancelled message — keep? Also: apply all six retro proposals and commit? — A: "Yes, all" (hak). Consequence: mapping kept as is (AC5 wording); retro proposals applied; story set to done and committed on `feature/001-login`. (orchestrator)

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

Scope: one screen (`App`) with two mutually exclusive views: **login** and **signed in**. The app never restores a session (AC7/AC8 removed, hak option C), so every page load starts in "login, idle". No routing, no dialogs. There are no existing shared components in `src/components/`; the only reusable piece is `Counter` (`src/features/counter/Counter.tsx`), which stays unchanged.

### 1. Layout / component tree

```
App
├─ header (banner)                      only in view "signed in"
│   ├─ p#identity (tabindex=-1)         "Signed in as " + <span>{name or email}</span>
│   └─ button "Sign out"
└─ main
    ├─ h1 "Software Factory"            always visible, in both views
    ├─ [view: login]
    │   ├─ p                            "Use your Google account to sign in."
    │   ├─ button "Sign in with Google" custom Google-style button (logo svg aria-hidden + label)
    │   └─ div aria-live="polite"       persistent wrapper, content swaps (see states)
    │       ├─ p  progress              spinner (decorative) + "Signing in with Google…"
    │       ├─ p  cancelled             "Google sign-in was cancelled. You can try again."
    │       └─ p role="alert"  error    "Google sign-in failed. Please try again."
    └─ [view: signed in]
        ├─ p  "Your app starts here. Run /feature to build the first story."   (existing placeholder, unchanged)
        └─ Counter                      (existing, unchanged)
```

Decisions:

- **Where the signed-in state lives:** a header bar at the top of the page: identity on the left, "Sign out" on the right. It is only rendered when signed in, so the login screen has no signed-in state (AC1, AC9, AC10).
- **Counter and placeholder paragraph:** shown **only in the signed-in view**. This is presentation only, not protection (nothing is protected, per the story): it keeps the login screen focused on one action and gives the signed-in state visible content. The architect must not model this as a route/access guard. If the PO prefers the counter always visible, only the view table changes; no ACs are affected.
- The `h1` "Software Factory" stays in all views so the page always has one level-1 heading and the layout does not jump between views.
- Text rules so tests can query unambiguously: the exact string "Sign in with Google" appears **only** on the button. No other element (intro, progress, messages) contains that phrase. Do not add an `h2` "Sign in".

### 2. States

| View / state                        | What the user sees                                                                                                                                                 | What the user can do                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| **Login, idle** (AC1)               | `h1`, intro text, enabled button "Sign in with Google", empty message area. No header, no name, no counter.                                                        | Activate the button.                                                |
| **Login, in progress** (AC3)        | Same screen. Button is `disabled`. Below it the spinner and "Signing in with Google…". Button label does not change. Any previous cancelled/error message is gone. | Nothing (button disabled). The Google popup is where the user acts. |
| **Login, cancelled** (AC4)          | Button enabled again. Message "Google sign-in was cancelled. You can try again." in neutral text colour with an info icon.                                         | Retry with the button.                                              |
| **Login, error** (AC5)              | Button enabled again. Message "Google sign-in failed. Please try again." in error colour with an error icon (icon + wording, not colour alone).                    | Retry with the button.                                              |
| **Signed in, name available** (AC2) | Header: "Signed in as Jane Doe" + "Sign out". Below: `h1`, placeholder text, counter. No login button, no messages.                                                | Sign out; use counter.                                              |
| **Signed in, no name** (AC11)       | Identical to above, with the email address instead of the name: "Signed in as jane@example.com".                                                                   | Same.                                                               |
| **Empty**                           | Not applicable (no lists or data).                                                                                                                                 |                                                                     |
| **Disabled**                        | Only the login button during progress (see above). "Sign out" is never disabled: signing out is synchronous and in memory, so there is no progress state for it.   |                                                                     |

Edge rules:

- Name wins over email. Treat a missing, empty or whitespace-only name as "no name" (AC11).
- Email is always present: a Google profile without email ends as the AC5 error, so there is no "neither name nor email" state.
- If the Google script cannot load, nothing happens on page load; the failure shows up on click as the AC5 error message.
- Messages never persist across attempts: starting a new attempt clears any cancelled/error message immediately (before success), which also satisfies AC6. On success no message exists (AC6), as the login view is no longer rendered.
- A reload (AC10) always starts in "login, idle" with no message, whether or not the user was signed in before. No sign-out confirmation message is shown after logout or reload.

### 3. Interactions

| Control                                                                                    | Behaviour                                                                                                                                                          |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Sign in with Google** (button, `type="button"`)                                          | Click, Enter or Space starts the attempt. Immediately: clear any message, set button `disabled`, show progress. The attempt ends in one of three outcomes (below). |
| Outcome: success                                                                           | Switch to the signed-in view. Move focus to `#identity` (the "Signed in as …" paragraph), so screen reader users hear the name.                                    |
| Outcome: cancelled (user closed or dismissed the Google popup/consent without completing)  | Enable the button, remove progress, show the cancelled message. Move focus to the button.                                                                          |
| Outcome: error (Google reports an error, popup blocked, script unavailable, access denied) | Enable the button, remove progress, show the error message. Move focus to the button.                                                                              |
| **Sign out** (button, `type="button"`)                                                     | Click, Enter or Space: end the session and switch to the login view (idle, no message). Move focus to the "Sign in with Google" button.                            |
| Counter                                                                                    | Unchanged.                                                                                                                                                         |

Validation: there are no form fields, so no field validation. Messages appear only as the result of an attempt, never on load or on blur.

Focus summary:

- Page load: no programmatic focus; the user starts at the top of the document.
- Sign-in start: no focus move (the Google popup takes focus). Do not rely on the disabled button holding focus.
- After success: `#identity`. After cancel / error / sign-out: "Sign in with Google" button.
- Never let focus fall back to `<body>` after one of these transitions.

### 4. Copy (exact strings; tests query by these)

| Where                                    | Text                                                                                                                  |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Heading (`h1`)                           | `Software Factory`                                                                                                    |
| Login intro                              | `Use your Google account to sign in.`                                                                                 |
| Login button label (and accessible name) | `Sign in with Google`                                                                                                 |
| Progress text                            | `Signing in with Google…`                                                                                             |
| Cancelled message                        | `Google sign-in was cancelled. You can try again.`                                                                    |
| Error message                            | `Google sign-in failed. Please try again.`                                                                            |
| Signed-in identity                       | `Signed in as ` + name or email (name/email in its own `<span>`, so `getByText('Jane Doe')` matches the span exactly) |
| Sign-out button                          | `Sign out`                                                                                                            |
| Placeholder paragraph, counter           | unchanged from the current app                                                                                        |

The ellipsis is the single character `…` (U+2026).

### 5. Google button (custom, guideline-conformant)

Specification for a custom button following Google's "Sign in with Google" branding guidelines (light theme, standard button):

- Native `<button type="button">` containing the official multicolour "G" logo as inline SVG (unaltered, `aria-hidden="true"`, `focusable="false"`) followed by the text `Sign in with Google`. The text is one of Google's permitted labels.
- Idle: white background `#FFFFFF`, 1 px border `#747775`, text `#1F1F1F`, font Roboto Medium 14 px (fallback to the app's sans-serif), height 40 px, 12 px horizontal padding, 8 px gap logo/label, corner radius 4 px (pill shape is also allowed; pick one and keep it).
- Hover: `#303030` overlay at 8 % opacity. Focus-visible overlay 12 % **plus** the app focus ring (see accessibility). Pressed: 12 %.
- Disabled (during progress): background `#FFFFFF` at 38 %, border `#1F1F1F` at 12 %, text `#1F1F1F` at 38 %, logo at 38 %; cursor `not-allowed`. Disabled controls are exempt from contrast rules; the progress text next to it carries the state.
- Do not change logo colours, do not add other branding, do not rename the label.

Decided: the custom native button with a real `disabled` attribute is used, not Google's rendered iframe button (see Technical design and ADR 0002).

### 6. Accessibility

- **Semantics:** `header` (banner) for the signed-in bar, `main` for the content, one `h1`. Native `<button>` for both actions. The Google logo is decorative; the accessible name of the sign-in button is exactly `Sign in with Google`.
- **Live regions:**
  - The wrapper `div aria-live="polite"` in the login view is mounted persistently; progress and cancelled messages are swapped inside it so they are announced reliably. No `role` on the wrapper (so `queryByRole('status')` does not match an empty region).
  - The error message uses `role="alert"` and is rendered only when there is an error (so `queryByRole('alert')` returns nothing otherwise, matching AC6).
  - The sign-out and success transitions are announced through the focus move, not a separate live message (avoids extra text that could conflict with "no message" checks).
- **Keyboard flow:**
  - Login view: Tab reaches only "Sign in with Google" (one tab stop). Enter and Space activate. During progress the button is disabled and skipped.
  - Signed-in view: Tab order is "Sign out", then the counter controls. `#identity` is `tabindex="-1"` (focusable by script, not a tab stop).
  - No focus traps, no hover-only controls.
- **Focus indication:** visible on every control: 2 px solid `#0B57D0` outline with 2 px offset (about 6.9:1 against white; WCAG 2.2 AA needs 3:1 and 2.4.11 not obscured). Do not rely on the default ring being visible against the white button.
- **Colour contrast (AA):** text `#1F1F1F` on white about 16:1. Error text `#B3261E` on white about 6.5:1. Button border `#747775` on white about 4.5:1 (needs 3:1). Cancelled message uses neutral text colour. Error and cancelled messages each have an icon (`aria-hidden`) in addition to words; state is never colour-only.
- **Target size:** button 40 px high, Sign out at least 40 × 40 px effective (WCAG 2.2 target size minimum is 24 px).
- **Motion:** the spinner is decorative (`aria-hidden`); with `prefers-reduced-motion: reduce` replace rotation with a static or slow-fade indicator. Meaning is always in the text.
- **Language:** the app language is English; `lang="en"` is already set in `index.html`.
- **Messages remain readable at 200 % zoom** and wrap; no truncation of the email address.

#### Dark mode

The app uses `color-scheme: light dark`, so these rules apply under `prefers-color-scheme: dark`:

- Error text: `#F2B8B5` (replaces `#B3261E`, which fails AA on a dark background). About 9:1 against `#242424`; needs 4.5:1.
- Focus ring: `#A8C7FA` (replaces `#0B57D0`), 2 px solid with 2 px offset. About 9:1 against `#242424`; needs 3:1. The offset keeps the ring on the page background, not on the white button.
- Google button: stays in its light theme (white fill, `#747775` border, `#1F1F1F` text) in dark mode as well. The white fill is high contrast on the dark page, and the logo and label stay unaltered per Google's guidelines.
- All other text (intro, cancelled message, identity, counter) uses the inherited text colour; the cancelled message stays neutral. Icons next to messages take the colour of their message text.
- If the page background is darker than `#242424`, both colours only gain contrast; if it is lighter than about `#4A4A4A`, re-check them.

### 7. Responsive behaviour (below 600 px)

- Content column: single column with 16 px side padding. Sign-in button becomes full width (container max 400 px above 600 px), logo and label stay centred together. Height stays 40 px.
- Signed-in header: identity and "Sign out" stack vertically (identity first, button below, left-aligned, full width), since long emails and names must wrap rather than truncate (`overflow-wrap: anywhere`). Above 600 px they sit on one row (identity left, button right).
- Message area: full width, text wraps, icon stays top-aligned with the first line. Reserve space (min-height of one line) for the message area so the button does not jump when progress appears and disappears.
- Counter: unchanged behaviour; it must still fit at 320 px with no horizontal scrolling (reflow, WCAG 1.4.10).

### 8. Open points for architect / PO

All resolved:

1. Official vs custom button: resolved, custom button chosen (see Technical design and ADR 0002).
2. Initial session check, timeout, missing name and email: obsolete with AC7/AC8 removed; email is always present.
3. Counter visible only when signed in: resolved, kept (hak was told and did not object).
4. Simulated provider in tests: success, cancel and error are enough to reach every state above.

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

> Final design for variant **C** (hak, 2026-11-01: "C: drop AC7/AC8"). There's no session
> restore after reload; staying signed in moves to story 003. ADRs:
> [0002 – Google sign-in via GIS token client](../adr/0002-google-sign-in-gis-token-client.md),
> [0003 – AuthClient abstraction and e2e fake](../adr/0003-auth-client-abstraction-and-e2e-fake.md).

### 1. Decisions in short

- **Interactive sign-in:** Google Identity Services (GIS) **OAuth 2.0 token client**
  (`google.accounts.oauth2.initTokenClient`, popup), opened from **our own native
  `<button>`**. Scope `openid email profile`, `prompt: 'select_account'`.
- **Name/email** come from the OIDC **userinfo endpoint**
  (`https://openidconnect.googleapis.com/v1/userinfo`), called once with the access token.
  They're for **display only**: nothing is verified server-side, and no authorization may
  ever be based on them. Server-side ID-token verification is a later story.
- **No session restore.** Every page load starts signed out (AC7/AC8 dropped). AC10 holds
  because nothing restores.
- **No npm dependency.** The GIS script is loaded at runtime by our adapter. The GIS types
  are hand-written (minimal subset). No `@react-oauth/google`, since it wraps the same APIs
  with the same limits (ADR 0002).
- **State:** `AuthProvider` (React context + `useReducer` over a pure `authReducer`) owns
  the auth state. UI talks only to the `AuthClient` interface (ADR 0003).
- **Tests:** component tests inject a fake `AuthClient`. e2e runs the Vite dev server in
  mode `e2e`, which swaps in the fake. The guard is statically `false` in production builds,
  so there's no backdoor (ADR 0003).

### 2. Why this Google integration (AC → mechanism)

| AC                        | Token client + own button (chosen)                                                                                | GIS rendered button / One Tap (`google.accounts.id`) | Redirect (OIDC implicit / PKCE)                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| AC3 disabled + progress   | real `disabled` while `signIn()` promise is pending                                                               | iframe: can't be disabled; no "attempt ended" signal | page navigates away, no progress state                                          |
| AC4 cancel                | `error_callback` `{ type: 'popup_closed' }`                                                                       | no callback when the dialog is closed                | "Cancel" returns `access_denied` (same as AC5); closing the tab is undetectable |
| AC5 error                 | `callback` with `error`, `error_callback` `popup_failed_to_open`/`unknown`, userinfo failure, script load failure | errors only inside Google's UI                       | `error` param                                                                   |
| AC9 sign out              | drop state in memory                                                                                              | `disableAutoSelect()`                                | drop state                                                                      |
| AC10 no silent re-sign-in | trivially true: the app never restores a session                                                                  | needs `disableAutoSelect()`                          | needs grant revocation                                                          |

Also: Google "Web application" clients need a `client_secret` at the token endpoint, so a
secret-less PKCE code flow isn't available to a pure SPA. AC7/AC8 were dropped because the
token client can't restore silently (a popup needs a user gesture). The only storage-free
alternative, FedCM automatic sign-in, is Chromium-only and rate-limited; that's for
story 003.

### 3. Files

New and changed files (developer owns `src/**` and `.env.example`; config files marked _devops_; e2e files marked _tester_):

| Path                                                                | Responsibility                                                                                                                       |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `.env.example`                                                      | Documents `VITE_GOOGLE_CLIENT_ID=` (empty) with a comment pointing to the README setup. Committed (already allowed by `.gitignore`). |
| `src/vite-env.d.ts`                                                 | `ImportMetaEnv` typing for `VITE_GOOGLE_CLIENT_ID`.                                                                                  |
| `src/features/auth/types.ts`                                        | `AuthUser`, `SignInResult`, `SignInErrorReason`, `AuthClient`.                                                                       |
| `src/features/auth/displayName.ts` (+ `.test.ts`)                   | `displayName(user)`: trimmed name, else email (AC11).                                                                                |
| `src/features/auth/authReducer.ts` (+ `.test.ts`)                   | Pure state machine: `AuthState`, `AuthAction`, `authReducer`, `initialAuthState`.                                                    |
| `src/features/auth/AuthContext.ts`                                  | `AuthContext` (`createContext<AuthContextValue \| null>(null)`) and `AuthContextValue` type.                                         |
| `src/features/auth/AuthProvider.tsx` (+ `.test.tsx`)                | Owns the reducer, calls the `AuthClient`, exposes `signIn` / `signOut`.                                                              |
| `src/features/auth/useAuth.ts`                                      | Reads the context; throws if used outside `AuthProvider`.                                                                            |
| `src/features/auth/createAuthClient.ts`                             | Composition: fake (e2e dev mode) / Google / "not configured".                                                                        |
| `src/features/auth/google/gisTypes.ts`                              | Minimal hand-written GIS types (`oauth2` token client only) plus the `Window.google` augmentation.                                   |
| `src/features/auth/google/loadGisScript.ts` (+ `.test.ts`)          | Injects `https://accounts.google.com/gsi/client` once. Memoized promise, reset on failure so a later attempt can retry.              |
| `src/features/auth/google/parseUserInfo.ts` (+ `.test.ts`)          | `unknown` userinfo JSON → `AuthUser \| null` (needs `sub` and `email` strings; blank `name` → `null`).                               |
| `src/features/auth/google/createGoogleAuthClient.ts` (+ `.test.ts`) | `AuthClient` over the GIS token client (§6). Tests stub `loadScript` and `fetch`.                                                    |
| `src/features/auth/fake/createFakeAuthClient.ts` (+ `.test.ts`)     | Deterministic fake `AuthClient` with a control object (§8). No top-level side effects.                                               |
| `src/features/auth/GoogleSignInButton.tsx` + `.module.css` (+ test) | Custom branded native button (UX §5). Props below.                                                                                   |
| `src/features/auth/LoginView.tsx` + `.module.css` (+ test)          | Intro, button, persistent live region with progress / cancelled / error (UX).                                                        |
| `src/features/auth/SignedInHeader.tsx` + `.module.css` (+ test)     | "Signed in as …" + "Sign out" (UX).                                                                                                  |
| `src/app/App.tsx`, `App.module.css` (+ `App.test.tsx`)              | Picks the view from `useAuth().state`; header, `h1`, placeholder + `Counter` only when signed in; focus moves (UX §3).               |
| `src/main.tsx`                                                      | `const authClient = createAuthClient()` (once, outside React) → `<AuthProvider client={authClient}><App /></AuthProvider>`.          |
| `playwright.config.ts` (_devops_)                                   | webServer `npm run dev -- --mode e2e --port 5174 --strictPort`, `baseURL` port 5174.                                                 |
| `e2e/auth.spec.ts`, `e2e/smoke.spec.ts` (_tester_)                  | AC tests via the fake; smoke test signs in first, because the counter is now only in the signed-in view.                             |
| `README.md` (_tech-writer_)                                         | Google Cloud setup and `.env.local` (§7).                                                                                            |

Component names are mine where UX gives none. If UX renames them, UX wins; the props
contract stays. There's no "checking" view. No route/access guard: hiding the counter when
signed out is presentation only (UX §1).

### 4. Types and props

```ts
// src/features/auth/types.ts
export interface AuthUser {
  /** Google subject (`sub`). Display/React keys only — never an authorization basis. */
  readonly id: string;
  /** Always present: the adapter treats a profile without email as an error. */
  readonly email: string;
  /** null if Google provides no name or a blank one (AC11). */
  readonly name: string | null;
}

export type SignInErrorReason =
  | 'not_configured' // VITE_GOOGLE_CLIENT_ID missing
  | 'unavailable' // GIS script not loaded / failed, userinfo request failed
  | 'popup_blocked' // error_callback popup_failed_to_open
  | 'access_denied' // token callback error=access_denied (incl. "Cancel" on Google's consent screen)
  | 'unknown';

export type SignInResult =
  | { readonly kind: 'success'; readonly user: AuthUser }
  | { readonly kind: 'cancelled' }
  | { readonly kind: 'error'; readonly reason: SignInErrorReason };

export interface AuthClient {
  /**
   * Interactive sign-in. MUST be called synchronously inside the click handler (it opens a
   * popup). Never rejects; every outcome is a SignInResult.
   */
  signIn(): Promise<SignInResult>;
  /** Forget provider-side state (e.g. the in-memory access token). Never throws. */
  signOut(): void;
}
```

```ts
// src/features/auth/authReducer.ts
export type SignInNotice = 'cancelled' | 'error';

export type AuthState =
  | { readonly status: 'signedOut'; readonly notice: SignInNotice | null }
  | { readonly status: 'signingIn' }
  | { readonly status: 'signedIn'; readonly user: AuthUser };

export type AuthAction =
  | { readonly type: 'signInStarted' }
  | { readonly type: 'signInSettled'; readonly result: SignInResult }
  | { readonly type: 'signedOut' };

export const initialAuthState: AuthState = { status: 'signedOut', notice: null };
```

```ts
// src/features/auth/AuthContext.ts
export interface AuthContextValue {
  readonly state: AuthState;
  /** Call directly from the click handler, with no await before it (popup needs the gesture). */
  readonly signIn: () => void;
  readonly signOut: () => void;
}

// src/features/auth/AuthProvider.tsx
export interface AuthProviderProps {
  readonly client: AuthClient;
  readonly children: ReactNode;
}

// UI (names per §3)
export interface GoogleSignInButtonProps {
  readonly disabled: boolean;
  readonly onClick: () => void;
}
export interface LoginViewProps {
  readonly inProgress: boolean;
  readonly notice: SignInNotice | null;
  readonly onSignIn: () => void;
}
export interface SignedInHeaderProps {
  readonly displayName: string;
  readonly onSignOut: () => void;
}
```

### 5. Data flow and state ownership

- **Single owner:** `AuthProvider` holds `AuthState` in `useReducer(authReducer, initialAuthState)`.
  Nothing about the user lives anywhere else. There's no storage of any kind in production
  code (no localStorage/sessionStorage/cookies/IndexedDB written by us). A reload therefore
  always starts at the login view, idle with no message (AC1, AC10).
- **Derived, not stored:** `displayName(user)`, the view to render (`status`), the button's
  `disabled` (`status === 'signingIn'`) and the message (`notice`).
- **Transitions** (anything else returns the same state object, so stale or late events are ignored):

  | From                     | Action                    | To                                     |
  | ------------------------ | ------------------------- | -------------------------------------- |
  | `signedOut` (any notice) | `signInStarted`           | `signingIn` (notice cleared: AC3, AC6) |
  | `signingIn`              | `signInSettled` success   | `signedIn` (AC2)                       |
  | `signingIn`              | `signInSettled` cancelled | `signedOut`, notice `cancelled` (AC4)  |
  | `signingIn`              | `signInSettled` error     | `signedOut`, notice `error` (AC5)      |
  | `signedIn`               | `signedOut`               | `signedOut`, notice `null` (AC9)       |

- **`signIn()` in the provider:** a ref guard (`inFlightRef`) blocks a second call
  synchronously. Then `dispatch({ type: 'signInStarted' })`, then **synchronously**
  `client.signIn().then((result) => dispatch({ type: 'signInSettled', result }))`. In
  dev, the provider logs `result.reason` on errors (`console.warn`), never tokens.
- **`signOut()`:** if `signedIn`: `client.signOut()` and then
  `dispatch({ type: 'signedOut' })`. It's synchronous in the UI, as UX requires.
- **Context value** memoized (`useMemo`). `signIn`/`signOut` are stable (`useCallback`). The
  current state is read via a ref so the callbacks don't change on every transition.
- **Focus moves** (UX §3) live in `App`. Derive them from the previous and current
  `status` (keep the previous one in a ref): `signingIn→signedIn` focuses `#identity`;
  `signingIn→signedOut` and `signedIn→signedOut` focus the sign-in button. Page load does
  nothing.
- **StrictMode:** the client is created once in `main.tsx`, outside React, so a double
  render never creates two GIS token clients. The provider has no effects that talk to
  Google.

### 6. Google adapter: contract and error mapping

`createGoogleAuthClient({ clientId, loadScript = loadGisScript, fetchFn = fetch })`:

1. **On creation:** starts `loadScript()`. When it resolves:
   `tokenClient = accounts.oauth2.initTokenClient({ client_id, scope: 'openid email profile', callback: onToken, error_callback: onError })`.
   Pending-attempt routing: the adapter holds at most one `pending` deferred. The init
   callbacks settle it (the GIS callback is fixed at init, so don't rely on reassigning
   `tokenClient.callback`).
2. **`signIn()`:** if `tokenClient` isn't ready, resolve `error/unavailable` (and if loading
   failed, start a fresh load for the next attempt). If an attempt is pending, return the
   same promise. Otherwise create `pending` and call
   `tokenClient.requestAccessToken({ prompt: 'select_account' })` **synchronously**.
3. **Mapping:**

   | GIS signal                                                               | Result                                                               |
   | ------------------------------------------------------------------------ | -------------------------------------------------------------------- |
   | `error_callback` `type: 'popup_closed'`                                  | `cancelled` (AC4)                                                    |
   | `error_callback` `type: 'popup_failed_to_open'`                          | `error` / `popup_blocked` (AC5)                                      |
   | `error_callback` other                                                   | `error` / `unknown` (AC5)                                            |
   | `callback` with `error === 'access_denied'`                              | `error` / `access_denied` (AC5, per the AC5 wording "access denied") |
   | `callback` with any other `error`                                        | `error` / `unknown`                                                  |
   | `callback` with `access_token` → userinfo `fetch` not ok / network error | `error` / `unavailable`                                              |
   | userinfo body fails `parseUserInfo` (no `sub`/`email`)                   | `error` / `unknown`                                                  |
   | userinfo ok                                                              | `success` with `AuthUser` (AC2, AC11)                                |

4. **Access token:** used only for the single userinfo call, then dropped. It's never put
   into React state, never logged, and never sent anywhere except the userinfo endpoint.
5. **`signOut()`:** no-op apart from clearing any leftover adapter state. There's no Google
   session restore that could silently sign the user in again, so no Google-side call is
   needed for AC10. We don't revoke the grant, because that would force Google's consent
   screen on every next sign-in.
6. **No timeout** on interactive attempts: the user may take their time in the popup.
   Closing it ends the attempt (AC4).

### 7. Configuration

- `VITE_GOOGLE_CLIENT_ID` in `.env.local` (gitignored via `*.local`; never committed).
  `.env.example` holds the empty key plus a comment. The client ID isn't a secret (it's
  inlined into the bundle), but it's per developer and environment, so it isn't committed.
- `createAuthClient()`:
  ```ts
  if (import.meta.env.DEV && import.meta.env.MODE === 'e2e') → createFakeAuthClient({ exposeControl: true })
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()
  if (!clientId) → console.error('VITE_GOOGLE_CLIENT_ID is not set …see .env.example'); inline client: signIn → error/not_configured, signOut no-op
  else → createGoogleAuthClient({ clientId })
  ```
  **If the ID is missing**, the app renders normally and the login screen works. Choosing
  "Sign in with Google" shows the AC5 error message, and the console explains why. No
  build failure, because CI builds and unit tests run without the ID. A deployment (later
  story) must set it at build time.
- **Google Cloud setup** (prerequisite for manual checks; README by tech-writer): OAuth
  client type "Web application"; Authorized JavaScript origins `http://localhost:5173`
  **and** `http://localhost`; no redirect URI needed; consent screen "External" with
  scopes `openid`, `email`, `profile`, **publishing status "In production"**. "Testing"
  allows only listed test users, which conflicts with "any Google account". Basic scopes
  need no Google verification.

### 8. Testability and the e2e seam

- **Unit:** `authReducer`, `displayName`, `parseUserInfo`, `loadGisScript` (jsdom:
  dispatch `load`/`error` on the injected `<script>`), `createGoogleAuthClient` (stub
  `loadScript` returning a fake `accounts.oauth2`, stub `fetchFn`). Assert every row of the
  §6 mapping, and that `requestAccessToken` is called **synchronously** inside `signIn()`
  (before any `await`).
- **Component:** render with `<AuthProvider client={fake}>`. Tests use
  `createFakeAuthClient()` and its `control`. Query by role/label and the exact UX copy.
  Test names reference ACs.
- **Fake contract:**

  ```ts
  export interface FakeAccount {
    readonly sub: string;
    readonly email: string;
    readonly name?: string;
  }
  export interface FakeGoogleControl {
    /** Account returned by the next successful sign-in. Default: Ada Lovelace <ada@example.com>. */
    setAccount(account: FakeAccount): void;
    /** Settles the pending interactive sign-in; until then signIn() stays pending (AC3 observable). */
    settleSignIn(outcome: 'success' | 'cancelled' | 'error'): void;
  }
  export interface FakeAuthClient extends AuthClient {
    readonly control: FakeGoogleControl;
  }
  export function createFakeAuthClient(options?: { exposeControl?: boolean }): FakeAuthClient;
  ```

  The fake is purely in memory (nothing persists across reloads, the same as the real
  app). With `exposeControl`, the control is set as `window.__fakeGoogle` inside the
  factory (never at module top level). Since the control is recreated on each page load,
  e2e specs call `setAccount` after `page.goto`/`reload` when they need a non-default
  account (AC11).

- **e2e:** Playwright runs `vite --mode e2e` on port **5174**. A separate port means
  `reuseExistingServer` can never pick up a developer's normal `npm run dev` on 5173, which
  would run against real Google. Specs drive the fake with
  `page.evaluate(() => window.__fakeGoogle?.settleSignIn('success'))`. They declare the
  `Window` augmentation locally, since `e2e/` is in `tsconfig.node.json` and doesn't see
  `src`. AC10: sign in, sign out, `page.reload()`, then expect the login view and no
  "Signed in as" text. That still gets tested, even though it's trivially true.
- **No backdoor in production:** the guard `import.meta.env.DEV && …` becomes `false` in
  `vite build`, so the fake is tree-shaken. Reviewer check: `npm run build && grep -r "__fakeGoogle" dist` must find nothing.
- Real Google behaviour isn't part of automated tests; it's checked manually (§10, step 11).

### 9. Security and CSP

- **Display only:** the client-side identity (userinfo) isn't authenticated by any server.
  Never use it for authorization, access decisions or as a trusted user ID toward a
  backend. The later backend story must verify a Google ID token server-side (signature via
  Google JWKS, `aud`, `iss`, `exp`).
- **Minimal scope** `openid email profile`; access token memory-only and short-lived in our
  code (§6). We don't render `picture` (out of scope; avoids third-party image requests).
- **Rendering:** name/email only as React text nodes; no `dangerouslySetInnerHTML`.
- **No storage, no cookies** set by our code or by GIS in this flow (we don't use
  `google.accounts.id`/One Tap).
- **Third-party script:** loaded only from `https://accounts.google.com/gsi/client`, no SRI
  possible (accepted in ADR 0002).
- **CSP:** none exists today, and none should be added in this story: a meta CSP would break
  Vite dev's inline HMR scripts. The hosting story must allow
  `script-src https://accounts.google.com/gsi/client` and
  `connect-src https://openidconnect.googleapis.com`. Never send
  `Cross-Origin-Opener-Policy: same-origin`, because it breaks the popup and
  `popup_closed`; use `same-origin-allow-popups`.
- **Privacy note (not a legal assessment):** the GIS script loads for every visitor of the
  login screen, so requests go to Google even without a sign-in. It has to be preloaded,
  because the popup must open synchronously on click. hak should decide whether a privacy
  notice or consent is needed before any public deployment.

### 10. Risks and mitigations

1. **Popup blocked** if anything is awaited before `requestAccessToken`. Mitigation:
   preload the script at client creation; `signIn` returns `unavailable` when not ready;
   a unit test asserts the synchronous call.
2. **`popup_closed` detection** depends on GIS and on no strict COOP. Mitigation: manual
   cancel check in Chrome and one non-Chromium browser; a COOP note for hosting (§9).
3. **GIS behaviour drift** (deprecations; my knowledge of GIS details may be dated).
   Mitigation: everything Google-specific sits in `src/features/auth/google/` behind
   `AuthClient`; check against current Google docs during implementation.
4. **Fake leaking into production:** DEV guard plus the dist grep (§8).
5. **e2e accidentally against real Google:** separate port 5174 (§8).
6. **Consent screen left in "Testing":** only test users can sign in. hak publishes it (§7).
7. **"Cancel" on Google's consent screen** arrives as `access_denied` and is shown as an
   error (AC5 wording). Closing the popup is the cancel path (AC4). The PO may object.
8. **Smoke e2e breaks** because the counter moved into the signed-in view (UX §1). The
   tester updates `e2e/smoke.spec.ts`.
9. **Users lose the session on reload.** That's the accepted consequence of dropping
   AC7/AC8; it's fixed in story 003.

### 11. Alignment with UX design

- **Button:** custom native `<button>` with the real `disabled` attribute (UX §5's
  assumption is confirmed). No official rendered button, so UX §5's fallback list isn't
  needed.
- **No checking view:** with AC7/AC8 dropped there's no session check on load. The login
  view (idle, no message) shows immediately on every load and reload. The UX section's
  "checking" view, its copy and its timeout don't apply.
- **Script load failure** has no separate on-load handling: it surfaces only when the user
  clicks, as the AC5 error message.
- **UX open point 4:** "neither name nor email" is unreachable. `AuthUser.email` is
  required, and a profile without email ends as an AC5 error. So the "Google account"
  fallback isn't implemented.
- **Sign out** is synchronous in the UI, as UX assumed.
- **Focus moves** as per UX §3, implemented in `App` from status transitions (§5).
- **`lang="en"`** is already set in `index.html`.

### 12. Implementation plan (developer, in order)

1. `.env.example`, `src/vite-env.d.ts`.
2. `types.ts`; `displayName.ts` + test (AC11 incl. blank name).
3. `authReducer.ts` + test (every row of the §5 table; ignored actions return the same state).
4. `fake/createFakeAuthClient.ts` + test.
5. `AuthContext.ts`, `AuthProvider.tsx`, `useAuth.ts`; `AuthProvider.test.tsx` with the fake (AC2 to AC6, AC9; double-click guard).
6. `google/gisTypes.ts`, `google/loadGisScript.ts` + test, `google/parseUserInfo.ts` + test, `google/createGoogleAuthClient.ts` + test (§6 mapping, synchronous popup call).
7. `createAuthClient.ts` (fake / missing ID / Google).
8. UI per UX design: `GoogleSignInButton`, `LoginView`, `SignedInHeader` (+ CSS modules, tests by role and exact copy).
9. `App.tsx` (views, focus moves) + `App.test.tsx` (AC1 initial login view, AC10 remount after sign-out shows the login view); `main.tsx` wiring.
10. Hand off: devops changes `playwright.config.ts` (`--mode e2e`, port 5174); tester writes `e2e/auth.spec.ts` (AC1 to AC6, AC9 to AC11; AC7/AC8 are dropped) and updates the smoke test; tech-writer documents §7 in the README.
11. `npm run verify` green; `npm run build && grep -r "__fakeGoogle" dist` empty; manual sign-in with a real client ID (success, cancel by closing the popup, popup blocked) in Chrome and one non-Chromium browser.

## Implementation notes

_developer: what was built, deviations from the design and why._

**What was built** (follows §12 steps 1 to 9; step 10 only for the Playwright config):

- `.env.example`, `src/vite-env.d.ts` (`VITE_GOOGLE_CLIENT_ID?: string`, `strictImportMetaEnv` on, so unknown env keys are type errors).
- `src/features/auth/`: `types.ts`, `displayName.ts`, `authReducer.ts`, `AuthContext.ts`, `AuthProvider.tsx`, `useAuth.ts`, `createAuthClient.ts`, `fake/createFakeAuthClient.ts`, `google/gisTypes.ts`, `google/loadGisScript.ts`, `google/parseUserInfo.ts`, `google/createGoogleAuthClient.ts`, UI `GoogleSignInButton.tsx`, `LoginView.tsx`, `SignedInHeader.tsx` (+ CSS modules), `GoogleLogo.tsx`, `NoticeIcon.tsx`, `useAuthFocus.ts`. Tests next to each file, named after ACs.
- `src/app/App.tsx` (views + focus moves via `useAuthFocus`), `App.module.css`, `App.test.tsx`; `src/main.tsx` creates the client once outside React and wraps `App` in `AuthProvider`.
- `src/index.css`: global `:focus-visible` ring (2 px `#0B57D0`, 2 px offset), so the counter and Sign out get it too.
- `playwright.config.ts`: port 5174, `npm run dev -- --mode e2e --port 5174 --strictPort`.
- `src/lib/createDeferred.ts` (+ test), used by the fake and the Google adapter.

**Checks:** `npm run verify` green (118 unit/component tests). `npm run build && grep -r "__fakeGoogle" dist` finds nothing. Also checked: a production build with `--mode e2e` and an ID set contains no fake either; a build with an ID set contains the GIS and userinfo URLs (without an ID Vite inlines `undefined` and drops the Google adapter, which is expected). A throwaway browser run against `vite --mode e2e` on 5174 went through progress, cancel, success, sign-out and reload with the fake and found no console errors and no horizontal scrolling at 320 px.

**Deviations from the design:**

1. `src/lib/createDeferred.ts` added: `Promise.withResolvers` is ES2024, but `tsconfig.app.json` has `lib: ES2023`.
2. Ref props added to the §4 props contract (additive): `GoogleSignInButtonProps.ref`, `LoginViewProps.signInButtonRef`, `SignedInHeaderProps.identityRef`. `App` needs them for the focus moves. The focus logic is in a hook `useAuthFocus(status)` instead of inline in `App`.
3. `loadGisScript.ts` exports `createGisScriptLoader(doc)` and the app-wide `loadGisScript = createGisScriptLoader()`, so tests get a fresh memo without module resets. `loadGisScript` resolves with `google.accounts.oauth2` (the design left the resolved value open).
4. `createGoogleAuthClient`: if `initTokenClient` throws (e.g. a malformed client ID), this counts as a failed load (`unavailable`, retried on the next click). A token response with neither `error` nor `access_token`, a userinfo body that isn't JSON, or `requestAccessToken` throwing all map to `error/unknown`. The design didn't list these cases.
5. `AuthProvider` also refuses `signIn` unless the status is `signedOut`, and turns a rejected `client.signIn()` into `error/unknown` even though the contract says it never rejects, so the UI can't hang in progress.
6. The fake maps `settleSignIn('error')` to reason `unknown`.
7. Dark mode (the app already has `color-scheme: light dark`, UX only specifies light): in dark mode the error text is `#F2B8B5` and the focus ring `#A8C7FA`, because `#B3261E` and `#0B57D0` don't reach AA or 3:1 on the dark page background. The Google button stays in the light theme.
8. ~~Not a code deviation, but ADR 0003 still says the fake keeps a simulated Google session in `sessionStorage`. That was written before variant C. I followed §8 of this design (fake purely in memory). The ADR text should be updated by the architect.~~ Resolved: ADR 0003 was already revised on 2026-11-01 (fake in memory only). Nothing left to do.
9. Userinfo timeout (deviation from §6.6, added in review round 1): the non-interactive userinfo call is bounded by `USERINFO_TIMEOUT_MS` (10 s). An `AbortController` aborts the request and the body read (its `signal` is passed in the `fetchFn` init). A `Promise.race` against the timer also ends the attempt if a fetch implementation ignores the signal. A timeout maps to `error/unavailable` (AC5), and the timer is cleared on completion. §6.6 "no timeout" still holds for the interactive popup.
10. Late GIS callbacks (added in review round 1): once a token is accepted for the pending attempt, further `callback` / `error_callback` calls for that attempt are ignored. The userinfo result alone decides the outcome, so a late `popup_closed` can't turn a success into "cancelled". The flag is reset when the next attempt starts, and the userinfo result settles only the attempt it belongs to.

**Open points / follow-ups:**

- `e2e/smoke.spec.ts` now fails (the counter is only in the signed-in view). Left for the tester, together with `e2e/auth.spec.ts`.
- README section on Google Cloud setup and `.env.local` (§7) for the tech-writer.
- Manual check with a real client ID (§12 step 11: success, closing the popup, popup blocked, in Chrome and one non-Chromium browser) still to do. It needs a Google Cloud OAuth client, which I don't have.

**Fixed in round 1:**

- [major] Stalled userinfo request: fixed with deviation 9. Tests:
  - `createGoogleAuthClient.test.ts` "userinfo timeout" block: aborted after exactly `USERINFO_TIMEOUT_MS`, a fetch that ignores the signal, a body that never finishes, the timer cleared on success, a retry after a timeout;
  - `App.google.test.tsx` "AC5: a userinfo request that never answers ends in the error alert and re-enables the button".
- [minor] Late `error_callback` after the token: fixed with deviation 10. Tests: `createGoogleAuthClient.test.ts` "late GIS callbacks after a token was accepted" (token, then `popup_closed`, then userinfo ok gives success; a second token callback is ignored; the next attempt reacts to `popup_closed` again).
- Both fixes were mutation-checked: removing either guard makes the new tests fail.
- [minor] Click while GIS is loading: no code change (accepted by design), as the reviewer said.
- [minor] Consent-screen "Cancel" as `access_denied`: no code change. hak/PO decide.
- [nit] e2e tsconfig: left alone (devops chore), as instructed.
- [nit] Deviation 8: marked resolved.
- [nit] Dark-mode colours (deviation 7): for UX to record in the UX section. No code change.
- [nit] `.gitignore` `.idea`: not mine to change in this story.

## Test report

_tester: AC → test mapping, results, defects found._

Run on branch `feature/001-login`: `npm run verify` green (typecheck, lint, prettier, 136 unit/component tests at first run, build); `npm run test:e2e` 33/33 green (two consecutive runs, no flakes); `grep -r "__fakeGoogle" dist` finds nothing. e2e specs are `e2e/auth.spec.ts` (all via the fake `window.__fakeGoogle`) and `e2e/smoke.spec.ts`. Active ACs: AC1–AC6, AC9–AC11 (AC7/AC8 removed).

| AC   | Test(s)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Result |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| AC1  | e2e `auth.spec.ts`: "AC1: opening the app shows the login screen with no signed-in state", "AC1: page load does not move focus…", "AC1: the sign-in button is full width…" (375 px). Unit: `App.test.tsx` "AC1: opens on the login screen…", "AC1: page load does not move focus"; `LoginView.test.tsx` "AC1: …"; `GoogleSignInButton.test.tsx` "AC1: …"; `AuthProvider.test.tsx`/`authReducer.test.ts` "AC1: starts signed out…"                                                                                  | PASS   |
| AC2  | e2e: "AC2: a successful sign-in shows the name and hides the login screen", "AC2: focus moves to the identity after a successful sign-in". Unit: `App.test.tsx` "AC2: shows the name in the header…", "AC2: moves focus to the identity…"; `App.google.test.tsx` "AC2: a token plus userinfo with a name shows the name"; `SignedInHeader.test.tsx`, `displayName.test.ts`, `parseUserInfo.test.ts`, `createGoogleAuthClient.test.ts` "AC2: …"                                                                     | PASS   |
| AC3  | e2e: "AC3: while the attempt is pending, progress is shown and the button is disabled", "AC3: progress and message stay inside the viewport". Unit: `App.test.tsx` "AC3: shows progress and disables the button…"; `App.google.test.tsx` "AC3: a double click opens only one Google popup"; `AuthProvider.test.tsx` "AC3: a double click starts only one attempt"; `LoginView.test.tsx`/`GoogleSignInButton.test.tsx`/`createGoogleAuthClient.test.ts` "AC3: …"                                                    | PASS   |
| AC4  | e2e: "AC4: cancelling shows the cancelled message, stays on login and re-enables the button" (incl. focus on the button). Unit: `App.test.tsx` "AC4: stays on the login screen…"; `App.google.test.tsx` "AC4: closing the Google popup shows the cancelled message"; `createGoogleAuthClient.test.ts` "AC4: popup_closed resolves as cancelled"; `LoginView.test.tsx` "AC4: …"                                                                                                                                     | PASS   |
| AC5  | e2e: "AC5: an error shows the failure alert, stays on login and re-enables the button". Unit: `App.test.tsx` "AC5: …"; `App.google.test.tsx` "AC5: a blocked popup…", "access_denied…", "a failing userinfo request…", "a profile without email…", "without VITE_GOOGLE_CLIENT_ID the login screen renders and a click shows the error"; `createAuthClient.test.ts` "AC5: …"; `createGoogleAuthClient.test.ts` / `loadGisScript.test.ts` "AC5: …"                                                                  | PASS   |
| AC6  | e2e: "AC6: retrying after an error clears the message at once and success leaves none", "AC6: retrying after a cancel clears…", "AC6: an error after a cancel replaces the cancelled message". Unit: `App.test.tsx` "AC6: a successful retry after an error…", "…after a cancel…"; `App.google.test.tsx` "AC6: after a cancel, a retry that succeeds shows no message"; `AuthProvider.test.tsx` "AC6: …"                                                                                                           | PASS   |
| AC9  | e2e: "AC9: signing out shows the login screen with no signed-in state" (incl. focus on the button), "AC9: after signing out, signing in again works (also as another account)". Unit: `App.test.tsx` "AC9: sign out shows the login screen…", "AC9: after sign-out a new sign-in shows the new account…", "AC9: the counter state does not survive a sign-out"; `AuthProvider.test.tsx` "AC9: …"; `SignedInHeader.test.tsx` "AC9: …"                                                                               | PASS   |
| AC10 | e2e: "AC10: after signing out, a reload still shows the login screen", "AC10: reloading while signed in also shows the login screen (no session restore)", "AC10: the app writes no user data to browser storage". Unit: `App.test.tsx` "AC10: after sign-out a reload (fresh mount)…"; `App.google.test.tsx` "AC10: signing out and signing in again needs a new Google round trip"; `createGoogleAuthClient.test.ts` "AC9/AC10: signOut never throws and does not call Google"                                   | PASS   |
| AC11 | e2e: "AC11: an account without a name shows the email address instead", "AC11: a whitespace-only name counts as no name", narrow-viewport "AC2/AC9/AC11: …long email wraps". Unit: `App.test.tsx` "AC11: shows the email when Google provides no name", "a whitespace-only name falls back to the email (AC11)"; `App.google.test.tsx` "AC11: userinfo without a name shows the email"; `displayName.test.ts`, `parseUserInfo.test.ts`, `createGoogleAuthClient.test.ts`, `createFakeAuthClient.test.ts` "AC11: …" | PASS   |

Additional probes (all passed, tests added): double click, rapid repeated failures (e2e and unit), settling twice, reload during a pending attempt, keyboard-only flow with Enter/Space and the exact tab order (one tab stop on the login screen, `#identity` not a tab stop, focus targets after success/cancel/error/sign-out), visible focus ring (`2px solid rgb(11, 87, 208)`), hostile name rendered as text (no markup, no script run), 120-character email without horizontal scroll, 375 px and 320 px layout (full-width button, stacked header, no horizontal scroll), 900 px layout (header on one row, button not stretched), no browser storage written, missing `VITE_GOOGLE_CLIENT_ID` through the real `App` (login renders, click shows the AC5 alert, console explains why).

**Defects:** none against the active ACs.

**Round 1 regression (after review round 1):** `npm run verify` green (148 unit/component tests), `npm run test:e2e` 33/33 green, `grep -r "__fakeGoogle" dist` still empty. Review of the developer's new tests: they test behaviour (fake timers, abort signal checked, a fetch that ignores the signal, a body stream that never ends, timer cleared, retry after timeout; late `popup_closed` after an accepted token, second token callback, next attempt reacting to `popup_closed` again), not implementation details. The AC5 timeout is also covered through the real UI: `App.google.test.tsx` "AC5: a userinfo request that never answers ends in the error alert and re-enables the button" (progress shown and button disabled until 10 s, then alert, enabled button, focus on the button). I added three edge-case tests in `createGoogleAuthClient.test.ts` ("userinfo timeout: edge cases"): an answer 1 ms before the timeout still signs in and leaves no timer; a late answer of a timed-out request does not settle the next attempt (AC6); a `popup_closed` after a timed-out token is ignored until the next attempt starts. All PASS. Observation 2 below (no userinfo timeout) is fixed; observations 1, 3 and 4 are unchanged. The e2e fake cannot simulate the timeout, so it is unit level only.

**Observations (no AC violated, for reviewer/PO):**

1. Clicking "Sign in with Google" while the GIS script is still loading (slow network, first seconds after page load) immediately shows the AC5 error (`unavailable`), by design (popup needs a synchronous call). After a failed script load the first retry only restarts the load and also shows the error; the retry after that can succeed. Severity: low.
2. No timeout on the userinfo `fetch` after Google returned a token: if that request hangs, the UI stays in "Signing in…" with a disabled button until reload (§6 only rules out a timeout for the popup). Severity: low.
3. "Cancel" on Google's own consent screen arrives as `access_denied` and shows the AC5 error, not the AC4 cancelled message (already named as risk 7 in the Technical design; the PO may object).
4. e2e type check: `e2e/` is typed by `tsconfig.node.json` without the DOM lib, so the specs start with `/// <reference lib="dom" />` for `page.evaluate` callbacks.

**Manual checks, open (real Google cannot be automated; needs a Google Cloud OAuth client, consent screen "In production"):**

- Real client ID: successful sign-in shows the real name (and the email for an account without a name, if one is available).
- Closing the Google popup shows the cancelled message (AC4), and focus returns to the button.
- Blocked popup (browser popup blocker) shows the error message (AC5).
- Sign out, then reload: login screen, no silent sign-in (AC10).
- Each of the above in Chrome and in one non-Chromium browser (Firefox or Safari); `popup_closed` detection depends on the browser and on no strict COOP header.
- Check that the consent screen publishing status is "In production", otherwise only test users can sign in.

**Manual check results:**

- 2026-11-01 — hak, own browser, `http://localhost:5173` with a real client ID: sign-in with hak's own Google account via Google's account picker **works** ("that works", hak).
- Consent screen stays in **"Testing"** with hak as test user: publishing to "In production" requires a homepage and privacy-policy URL, which don't exist while the app only runs locally. Publish once the app has a public URL.
- Not yet reported: closing the popup (AC4), blocked popup (AC5), sign-out + reload (AC10) with real Google, non-Chromium browser.

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

### Round 1 — CHANGES_REQUESTED

Checked myself on `feature/001-login` (uncommitted work on top of `main`): `npm run verify` green (typecheck, lint, prettier, 136 tests, build); `npm run test:e2e` 33/33 green; `npm run build && grep -r "__fakeGoogle" dist` finds nothing. Extra builds into a scratch dir: with a client ID set, and with `--mode e2e` plus a client ID, neither bundle contains `__fakeGoogle`, `settleSignIn` or the fake account; both contain only the GIS script URL and the userinfo URL.

Verified as fine: the fake is unreachable in production (`import.meta.env.DEV && MODE === 'e2e'` is statically false in `vite build`, and the fake has no top-level side effects). The access token is only used in the `Authorization` header of the single userinfo call. It is never stored, put in state or logged, and the dev `console.warn` logs only `result.reason`. Name and email are rendered as React text nodes only, with no `dangerouslySetInnerHTML` anywhere. `.env.example` has an empty key and no `.env.local` is in the tree. The GIS script comes from a fixed https constant, is memoized and is removed again on failure. `requestAccessToken` is called synchronously from the click (unit tests in the provider and the adapter cover it). The double-click guard (`inFlightRef`) works. Sign-out during a pending attempt can't happen because the header isn't rendered. Unmounting while an attempt is pending is harmless. The reducer ignores stale events. The deviations in the Implementation notes are all acceptable (see the last finding about deviation 8). Tests check behaviour by role and exact copy, assert every row of the §6 mapping and would catch regressions.

Findings:

- [major] `src/features/auth/google/createGoogleAuthClient.ts:37-55` (`fetchUser`), called at `:92`. The userinfo request and its body read have no timeout or abort. If the request stalls (captive portal, flaky mobile network, a stalled proxy), `pending` never settles. `AuthProvider`'s `inFlightRef` then stays `true`, and the button stays disabled with "Signing in with Google…" until the user reloads, with no hint that a reload is needed (tester observation 2). AC3 ties the disabled state to "until the attempt ends", and AC5 / design §6 map a userinfo network failure to the error message. A stalled request is a network failure that is never detected, so the attempt can't end. §6 point 6 ("no timeout") was meant for the interactive popup, not for this non-interactive call. **Fix:** bound the call, e.g. an `AbortController` plus `setTimeout` (about 10 s, as a named constant). Pass `signal` in the `fetchFn` init so the body read is covered too, and map an abort to `error/unavailable`. Prefer `AbortController` + `setTimeout` over `AbortSignal.timeout`, so the test can use `vi.useFakeTimers()`. Tests: an adapter unit test with a `fetchFn` that only rejects on abort, which resolves as `error/unavailable` after the timeout; and an `App.google.test.tsx` case "AC5: a userinfo request that never answers ends in the error alert and re-enables the button". Add the timeout to the Implementation notes as a deviation from §6.6.
- [minor] `src/features/auth/google/createGoogleAuthClient.ts:95-97`. `onError` still settles the attempt after `onToken` has accepted a token and the userinfo call is in flight. Google documents `popup_closed` as firing only before a response, so this should not happen. If it ever does fire late, a successful sign-in would show "cancelled" and the user result would be thrown away silently. **Fix (cheap, while touching `fetchUser`):** after a token is accepted for the current attempt, ignore `error_callback` for that attempt, e.g. with a `tokenReceived` flag reset per attempt. Add a unit test: token, then `popup_closed`, then userinfo ok, resolves as `success`.
- [minor] `src/features/auth/google/createGoogleAuthClient.ts:125-128` (tester observation 1). A click while the GIS script is still loading shows the generic AC5 error. After a failed load, the first retry only restarts the load. This is accepted by design: the popup must open synchronously (Technical design risk 1, UX edge rules). No code change in this story. The tech-writer should add "wait a moment and try again" to the README troubleshooting.
- [minor] `src/features/auth/google/createGoogleAuthClient.ts:84` (tester observation 3). "Cancel" on Google's consent screen arrives as `access_denied` and shows the AC5 error, not the AC4 cancelled message. This is consistent with the AC5 wording ("access denied") and Technical design risk 7, so no code change. It is a PO/hak decision. If they want it treated as a cancel, the change is this one mapping row plus its tests.
- [nit] `e2e/auth.spec.ts:1-20`, `e2e/smoke.spec.ts:1-6` (tester observation 4). Each spec has its own `/// <reference lib="dom" />` and its own copy of the `FakeWindow` types. That is fine for two specs. As a later chore for devops: an `e2e/tsconfig.json` (lib `ES2023` + `DOM`, types `node`) referenced from the root `tsconfig.json`, plus a shared `e2e/fakeGoogle.ts` helper. Don't add `DOM` to `tsconfig.node.json`, because that would put browser globals into the Node-side config files.
- [nit] Implementation notes, deviation 8 is out of date: ADR 0003 has already been revised ("Revised: 2026-11-01 … in-memory only", line 5). Mark it as resolved.
- [nit] Implementation notes, deviation 7 (dark-mode colours `#F2B8B5` / `#A8C7FA`) isn't in the UX section. UX should record it there so a rebuild from the backlog reproduces it.
- [nit] `.gitignore:12`: `.idea` is an IDE entry unrelated to this story. It's harmless, but it belongs in a chore or a global gitignore.

Still open before merge (not a code finding): the manual checks with a real Google client ID (Technical design §12 step 11, Test report "Manual checks"). They can't be automated and haven't been done yet.

### Round 2 — APPROVED

Checked myself: `npm run verify` green (148 tests); `npm run test:e2e` 33/33 green; `npm run build && grep -r "__fakeGoogle" dist` finds nothing; a build with `--mode e2e` and a client ID contains no fake markers.

Round 1 findings:

- [major] userinfo timeout: **fixed.** `createGoogleAuthClient.ts:70-84`. An `AbortController` with a `setTimeout` of `USERINFO_TIMEOUT_MS` (10 s) aborts both the request and the body read. `Promise.race` also ends the attempt when a fetch ignores the signal. An aborted body read is reported as `unavailable`, not `unknown` (`:59`). Timer leak: none. `clearTimeout` runs in `finally` on every path, and the tests assert `vi.getTimerCount() === 0`. A late answer after a timeout only resolves the stale race and is ignored. Tests cover a stalled request, a fetch that ignores the signal, a body that never finishes, an answer at 9.999 s, retry after a timeout, and the App-level alert with the button enabled again. Fake timers are restored in `afterEach` in both files.
- [minor] late callbacks: **fixed.** `tokenAccepted` (`:102`, `:111`, `:130`) is reset per attempt in `signIn` (`:167`). `settle(result, attempt)` (`:104-108`) resolves only the attempt that a userinfo call belongs to, so a timed-out request that answers late can't settle the next attempt (test "AC6: a late answer…"). Attempt bookkeeping is correct. After a settled attempt with a token, `tokenAccepted` stays `true` until the next `signIn`, but nothing is pending then, so it has no effect.
- [minor] click while GIS is loading: unchanged, accepted (README hint for the tech-writer).
- [minor] consent-screen Cancel → AC5 error: unchanged on purpose; hak decides at gate 2.
- [nit] e2e tsconfig: deferred to a later devops chore. Accepted.
- [nit] deviation 8: marked resolved. [nit] dark mode: now in UX §6 "Dark mode". [nit] `.gitignore` `.idea`: the orchestrator will commit it separately. Accepted.

No new findings. Still open before merge: the manual checks with a real Google client ID (§12 step 11).

## Retrospective

_orchestrator, 2026-11-01._

### What went wrong

| #   | Problem                                                                                                                                               | Cost                                                                    | Root cause                                                                                                                                |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | AC7/AC8 ("stay signed in") turned out infeasible together with "frontend-only, no own storage" and AC3–AC5; architect blocked the story after gate 1. | Extra gate round with hak, PO + architect + UX rework, two ACs dropped. | The orchestrator proposed defaults at gate 1 that contradicted each other technically; nobody checked feasibility before they became ACs. |
| P2  | UX and architect designed in parallel; UX assumed details (checking view, 10 s timeout, "Google account" fallback) the architecture later removed.    | UX section reworked twice.                                              | Parallel design although the story hinges on a third-party integration whose limits shape the UI.                                         |
| P3  | Review round 1, major: userinfo fetch without timeout could leave the UI stuck in "Signing in…".                                                      | One review round (developer + tester + reviewer).                       | No convention for network timeouts; design §6.6 "no timeout" was meant for the popup but read as general.                                 |
| P4  | Story markdown repeatedly failed `prettier --check`; ux-designer, tech-writer and product-owner have no shell and can't format.                       | Orchestrator formatting after each docs step.                           | `npm run verify` checks markdown, but the workflow didn't say who formats docs written by agents without Bash.                            |
| P5  | Dark-mode colours were invented by the developer, not specified in the UX design (reviewer nit).                                                      | Small UX follow-up.                                                     | The app uses `color-scheme: light dark`, but the ux-designer role doesn't ask for dark mode.                                              |
| P6  | ADR 0003 still described the pre-option-C fake (sessionStorage) after the decision changed.                                                           | Small architect follow-up.                                              | No rule that ADRs of an unmerged story are updated with every design change.                                                              |

What went well: tester PASS on first run with good probes (no defects), security review clean, review converged in 2 rounds, decision log captured every gate answer.

### Proposed changes

1. **`/feature` skill, step 2 (P1):** before finalising ACs from proposed defaults that touch technical constraints (storage, backend, sessions, third-party capabilities), ask the `architect` for a quick feasibility check and show the result at gate 1.
2. **`/feature` skill, step 3 (P2):** run `architect` first and `ux-designer` afterwards when the story depends on an external integration or platform limits; parallel only for pure UI stories.
3. **`/feature` and `/bug` skills (P4):** after every step in which an agent without Bash edited markdown, the orchestrator runs `npx prettier --write docs README.md CHANGELOG.md`.
4. **`ux-designer` agent (P5):** add "Dark mode" to "What you do" — colours for both schemes, with contrast values.
5. **`architect` agent (P6):** "When a design decision changes before merge, update the story's ADRs in the same step."
6. **CLAUDE.md, Conventions — team-wide rules suggested by the agents:**
   - Network calls that keep the UI in a progress state need a timeout (AbortController) that ends in the error state. (P3; reviewer, developer)
   - Test fakes are selected only via `import.meta.env.DEV && import.meta.env.MODE === '<mode>'`; prove it by building with all `VITE_*` values set (plain and `--mode e2e`) and grepping `dist`. (architect, reviewer)
   - `VITE_*` values are public (inlined into the bundle): never put secrets there; per-developer values go in `.env.local`, documented in `.env.example`. (architect, tech-writer)
   - Optional props that receive CSS-module classes or refs are typed `prop?: T | undefined` (needed under `exactOptionalPropertyTypes`). (developer)
   - Commands: `npm run test:e2e` runs the app in mode `e2e` on port 5174 with the fake sign-in, never real Google; port 5173 is part of the Google OAuth origins. (developer, tech-writer)
7. **Not proposed now (later devops chore):** an `e2e/tsconfig.json` with the DOM lib instead of `/// <reference lib="dom" />` in each spec (tester, reviewer nit).

### Memory check

All 8 agents wrote lessons (113 lines in total, all dated to story 001). None look wrong. Several duplicate the CLAUDE.md proposals in item 6 (VITE public, prettier, timeouts); if item 6 is approved, the agents can drop those lines at their next run. The reviewer keeps two topic files next to `MEMORY.md` with an index — fine, only the index is loaded automatically.

### Outcome

Gate 2, 2026-11-01 — hak: "Yes, all". All six proposals approved and applied in this
commit:

1. Feasibility check at gate 1 → `.claude/skills/feature/SKILL.md` step 2, and a
   "feasibility check" answer format in `.claude/agents/architect.md`.
2. Architect before UX for integration stories → `.claude/skills/feature/SKILL.md` step 3.
3. Orchestrator formats markdown after shell-less agents → "Formatting" note in
   `.claude/skills/feature/SKILL.md` and `.claude/skills/bug/SKILL.md`.
4. Dark mode → item 7 in `.claude/agents/ux-designer.md`.
5. ADRs kept current before merge → `.claude/agents/architect.md` step 3.
6. Team rules (optional prop typing, network timeouts, test fakes, `VITE_*` config,
   commands) → `CLAUDE.md` Conventions and Commands.

Item 7 (e2e tsconfig) stays a later devops chore. Open before merging to `main`: the
manual checks with a real Google client ID (Test report) and hak's privacy decision on
loading the Google script (Technical design §9).
