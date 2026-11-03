---
id: 004
title: Sign in as guest (for testing)
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
branch: feature/004-guest-login
supersedes: []
changes: [001/AC1] # the login screen gets a second option next to "Sign in with Google"
superseded-by:
---

# 004 – Sign in as guest (for testing)

## Original request

> for testing also enable a button "sign is as guest"

## User story

As a person testing the app, I want a "Sign in as guest" button on the login screen, so that I can get into the signed-in state without a Google account that is registered for testing.

## Context

Requested by hak on 2026-11-01, right after testing story 001 locally with a real Google client ID. Google sign-in works, but only for Google accounts that are registered as test users in Google Cloud. A guest sign-in makes testing easier because anyone can get into the signed-in state without such an account.

Assumption: "sign is as guest" in the request is a typo for "sign in as guest". The exact button label is an open question (see Open questions 2).

What exists today (story [001](001-login.md)): a login screen with "Sign in with Google"; after a successful sign-in a header "Signed in as {name}" with "Sign out", and the counter visible only when signed in. Nothing is protected, nothing is stored, and every page reload shows the login screen. This story adds a second way to reach the signed-in state; it does not change how Google sign-in works.

Team convention (CLAUDE.md): test fakes are enabled only for local development and test runs and must never reach production builds. A guest login is a similar kind of thing.

Constraints confirmed by hak at gate 1 ("Passt"). They are constraints unless an AC says otherwise:

- **Dev-only:** the guest option exists only in local development and automated test runs. It is never part of a deployed/production app (see AC12). Using it in a deployed app is a later decision, together with route protection and [003](003-stay-signed-in.md).
- The guest is signed in only in memory, like any user in 001: nothing is stored and a reload shows the login screen.
- A guest sees the same signed-in content as a Google user and signs out the same way.
- The login screen intro text stays as it is; the guest option is an additional, visually secondary button.

Relation to other stories:

- Changes 001/AC1: the login screen no longer offers only "Sign in with Google".
- 001/AC9 and AC10 (sign-out shows the login screen; a reload after sign-out still shows the login screen) are expected to hold for guests as well; see AC4 and AC5.
- [003 – Stay signed in](003-stay-signed-in.md) and any later route protection would have to take guest sign-in into account; see Open questions 1.

## Acceptance criteria

- **AC1:** Given I am not signed in and the guest sign-in is available in this environment (local development or a test run), when I open the app, then the login screen shows both a "Sign in with Google" option and a "Sign in as guest" option, and no signed-in state.
- **AC2:** Given I am on the login screen, when I choose "Sign in as guest", then I am signed in immediately, without any Google popup or Google request being needed, I see the signed-in state (a "Signed in as …" line and a "Sign out" option), and the login screen is no longer shown.
- **AC3:** Given Google sign-in cannot work (for example no Google client ID is configured or the Google script cannot be loaded), when I choose "Sign in as guest", then I am signed in as in AC2 and no Google error message is shown.
- **AC4:** Given I am signed in as a guest, when I choose "Sign out", then I see the login screen with both sign-in options and no signed-in state.
- **AC5:** Given I have signed out after a guest sign-in, when I reload the page, then I still see the login screen and no signed-in state.
- **AC6:** Given the login screen shows a Google cancelled or error message from a previous attempt, when I choose "Sign in as guest", then I am signed in and no cancelled or error message is shown anymore.
- **AC7:** Given I am signed in as a guest, when I look at the page, then I see the same signed-in content as a Google user (the counter is visible) and no "Sign in with Google" option. (changed by [005](../../apps/minesweeper/docs/backlog/005-minesweeper.md): the counter is expected to be replaced by the game; "same content as a Google user" still holds)
- **AC8:** Given I choose "Sign in as guest", when I am signed in, then the signed-in line reads "Signed in as Guest".
- **AC9:** Given I have chosen "Sign in with Google" and the sign-in is in progress, when I look at the login screen, then "Sign in as guest" is disabled until the Google attempt ends, and it is enabled again after the attempt is cancelled or has failed.
- **AC10:** Given I am signed in as a guest, when I reload the page, then I see the login screen and no signed-in state.
- **AC11:** Given the login screen shows the guest option, when I read the login screen, then the intro text "Use your Google account to sign in." is still shown unchanged.
- **AC12:** Given the app is built for production (as for a deployment), when I open the login screen of that build, then there is no guest option, "Sign in as guest" is not shown, and the text "Sign in as guest" does not appear anywhere in the built files.

## Out of scope

- Any change to how Google sign-in works (001) or to Microsoft sign-in ([002](002-login-microsoft.md)).
- Keeping a guest signed in across reloads ([003](003-stay-signed-in.md)); guest sessions are not kept (AC10).
- Guest sign-in in a deployed/production app. To be revisited together with route protection and [003](003-stay-signed-in.md).
- Protecting parts of the app or routes (later story); a guest would have to be handled there.
- Guest accounts with their own data, roles, permissions or persisted anything.
- Any backend or server-side check of a guest.

## Open questions

None. All nine questions were answered at gate 1 (see Decision log).

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-01 — Story created from hak's request. "sign is as guest" read as a typo for "sign in as guest" (assumption, label still open). Key open question recorded without a decision: guest button only in development/test builds or also in a deployed app. Eight further open questions recorded with proposed defaults, none confirmed. ACs written only for behaviour that holds regardless of the answers. Marks change to 001/AC1. Status draft. (product-owner)
- 2026-11-01 — Q1: Where does the guest button exist (dev/test builds only, or also in a deployed app)? Proposed: dev-only. — A: "Passt" (hak, gate 1) = dev-only. Consequence: constraint in Context; AC12 (no guest option in a production build); guest in deployed apps moved to Out of scope, to be revisited with route protection and 003.
- 2026-11-01 — Q2: Button label? Proposed: "Sign in as guest" (request read as typo of "sign is as guest"). — A: "Passt" (hak, gate 1). Consequence: label used in AC1, AC2, AC3, AC6, AC12.
- 2026-11-01 — Q3: Name shown for the guest? Proposed: "Guest". — A: "Passt" (hak, gate 1). Consequence: AC8.
- 2026-11-01 — Q4: Does a guest sign out the same way? Proposed: same "Sign out", back to the login screen. — A: "Passt" (hak, gate 1). Consequence: AC4 stands as written.
- 2026-11-01 — Q5: Does a guest session survive a reload? Proposed: not kept, like 001. — A: "Passt" (hak, gate 1). Consequence: AC10; recorded as a constraint.
- 2026-11-01 — Q6: Do guest and Google look different in the header? Proposed: identical layout, header shows "Signed in as Guest". — A: "Passt" (hak, gate 1). Consequence: AC8; no separate guest marker.
- 2026-11-01 — Q7: May the guest option be used while a Google attempt is in progress? Proposed: disabled during the attempt. — A: "Passt" (hak, gate 1). Consequence: AC9.
- 2026-11-01 — Q8: Should the login intro text change? Proposed: unchanged; guest is an additional, visually secondary button. — A: "Passt" (hak, gate 1). Consequence: AC11; recorded as a constraint.
- 2026-11-01 — Q9: Should a guest see anything different from a Google user? Proposed: exactly the same content. — A: "Passt" (hak, gate 1). Consequence: AC7 stands as written; recorded as a constraint. Open questions now empty; AC8 to AC12 added (12 ACs in total, exceeding the ~7 guideline; flagged in the reply); status set to ready. (product-owner)
- 2026-11-01 — Q: (gate 2) Apply the four retro proposals (dev-only rule, product-owner AC merging, test proportionality, tester placeholder) and commit? — A: "Ja, alle" (hak). Consequence: all applied, including the test-proportionality rule hak had declined after story 001; story set to done and committed on `feature/004-guest-login`. (orchestrator)

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

This design is a delta to the UX design of [001](001-login.md), which stays the base. Everything not mentioned here is unchanged (signed-in header, counter, Google button, progress/cancelled/error copy, focus rules after Google outcomes). The guest button exists only in development and test runs (AC12); in a production build the login view is exactly as in 001.

### 1. Layout (login view only)

```
main
├─ h1 "Software Factory"
├─ [view: login]
│   ├─ p                              "Use your Google account to sign in."      (unchanged, AC11)
│   ├─ button "Sign in with Google"   primary, Google-branded (001 §5)
│   ├─ button "Sign in as guest"      secondary, NOT Google-branded; dev/test only
│   └─ div aria-live="polite"         persistent wrapper (001), directly under BOTH buttons
│       ├─ p progress / p cancelled   (unchanged copy)
│       └─ p role="alert" error       (unchanged copy)
└─ [view: signed in]                  unchanged; header reads "Signed in as Guest" for a guest
```

Decisions (points 1 to 8 of the Technical design, section 7):

- **Placement and order (2):** the two buttons are stacked vertically, Google first (primary), guest below with a 12 px gap. They have the same width (container max 400 px). Never side by side, so the narrow layout is the same as the wide one. The message region stays in one place, directly under both buttons, because all messages name Google ("Google sign-in …", "Signing in with Google…") and so cannot be mistaken for guest messages. It keeps its reserved one-line height.
- **Hint (6):** no "testing only" hint and no extra text. The intro stays exactly "Use your Google account to sign in." (AC11). The button exists only in dev, and the dashed border (below) already marks it as a tool rather than a normal sign-in option. Adding copy would add strings that production must not contain.
- **Progress (8):** the guest has no progress state, no spinner and no progress text; signing in is synchronous.
- **Text rules for queries:** the exact string "Sign in as guest" appears on exactly one element, the guest button, and nowhere else (no hint, no title, no tooltip, no `aria-label` that differs). "Signed in as Guest" in the header does not match it. The string "Sign in with Google" still appears only on the Google button. Tests must use the full names: a regex such as `/sign in/i` now matches both buttons.

### 2. States

| State                                               | Guest button                                                                                                                                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Login, idle (AC1)                                   | Visible, enabled, below the Google button.                                                                                                                                                 |
| Login, Google attempt in progress (AC3 of 001, AC9) | `disabled` (real attribute), label unchanged, dimmed as below. Google button is disabled as well. Progress text "Signing in with Google…" below both.                                      |
| Login, cancelled or error (AC4/AC5 of 001)          | Enabled again together with the Google button; the message stays until the next attempt.                                                                                                   |
| After a click on the guest button (AC2, AC3, AC6)   | Signed-in view replaces the login view at once. A cancelled/error message from before is gone with the login view (AC6). No Google error is shown, even if Google is not configured (AC3). |
| Signed in as guest (AC7, AC8)                       | Same as 001: header "Signed in as Guest" and "Sign out", counter visible, no sign-in buttons.                                                                                              |
| Production build (AC12)                             | Not rendered; the login view has one button.                                                                                                                                               |

### 3. Guest button styling (secondary, not Google-branded)

Shape and type: native `<button type="button">`, height 40 px (same as the Google button), same width, 4 px radius, 12 px horizontal padding, label centred, same font family and 14 px / weight 500 as the Google button. No logo, no icon, no Google colours. Background transparent (page colour shows through). Border 1 px **dashed**; the dashed line is the only visual cue that separates it from the Google button's solid border and marks it as a test tool.

| State         | Light mode (page `#FFFFFF`)                                                | Dark mode (page `#242424`)                                                 |
| ------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Idle          | text `#1F1F1F`, border `#595959`                                           | text `#E3E3E3`, border `#A6A6A6`                                           |
| Hover         | idle plus `#1F1F1F` overlay at 8 % (about `#EBEBEB`)                       | idle plus `#E3E3E3` overlay at 8 % (about `#333333`)                       |
| Pressed       | same overlay at 12 %                                                       | same overlay at 12 %                                                       |
| Focus-visible | 12 % overlay plus ring 2 px solid `#0B57D0`, offset 2 px                   | 12 % overlay plus ring 2 px solid `#A8C7FA`, offset 2 px                   |
| Disabled      | text and border at 38 % opacity, border stays dashed, cursor `not-allowed` | text and border at 38 % opacity, border stays dashed, cursor `not-allowed` |

Contrast values (WCAG 2.2 AA: 4.5:1 text, 3:1 non-text):

| Pair                             | Light       | Dark        |
| -------------------------------- | ----------- | ----------- |
| Text on page                     | about 16:1  | about 12:1  |
| Text on hover background         | about 14:1  | about 10:1  |
| Border on page (needs 3:1)       | about 7:1   | about 6.4:1 |
| Border on hover background (3:1) | about 6:1   | about 5.2:1 |
| Focus ring on page (needs 3:1)   | about 6.9:1 | about 9:1   |

Disabled controls are exempt from contrast rules; the progress text carries the state. Unlike the Google button, the guest button follows the colour scheme (it is not locked to a light theme), because it carries no brand. The focus ring uses the same colours as in 001 (light and dark), drawn on the page background thanks to the offset.

### 4. Interactions and focus

| Control                                    | Behaviour                                                                                                                                                                                                |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sign in as guest** (click, Enter, Space) | Signs in immediately, no popup, no network, no progress. Switches to the signed-in view. Focus moves to `#identity` ("Signed in as Guest"), the same rule as after a Google success (point 4).           |
| **Sign out** (guest)                       | Same as 001: login view (idle, no message), focus on the "Sign in with Google" button (point 5). Reason: one provider-independent rule; the guest button is a dev tool and not the natural first choice. |

Tab order (point 3, confirmed):

- Login view, idle, cancelled or error: two tab stops, "Sign in with Google" first, then "Sign in as guest", then the rest of the page. Enter and Space activate.
- Login view, Google attempt in progress: both buttons are disabled, so there are no tab stops in the view until the attempt ends.
- Production build: one tab stop (as in 001).
- Signed-in view: unchanged ("Sign out", then the counter controls).

Announcements: no new live text. Guest sign-in is announced by the focus move to "Signed in as Guest". The existing polite wrapper is unchanged.

### 5. Copy (new strings only)

| Where                            | Text                                                                             |
| -------------------------------- | -------------------------------------------------------------------------------- |
| Guest button label and name      | `Sign in as guest`                                                               |
| Signed-in line for a guest (AC8) | `Signed in as ` + `Guest`, with `Guest` in its own `<span>` like any name in 001 |

All other strings are unchanged, including the intro "Use your Google account to sign in." (AC11).

### 6. Responsive behaviour (below 600 px)

- Both buttons are full width of the content column (16 px side padding) and stay stacked in the same order with the 12 px gap; height stays 40 px.
- Above 600 px both buttons keep the same width (container max 400 px), also stacked.
- Message region: unchanged (full width, wraps, reserved one-line height).
- At 320 px width and 200 % zoom the buttons and the dashed border must not cause horizontal scrolling.

### 7. Parts of the 001 UX design superseded by this story

001 is not edited. Where 001 and this section disagree, this section wins in development and test builds (the production build behaves as 001).

- 001 §1 tree, login view node: has one button; now two (Google, guest). Message region sits under both.
- 001 §2 States, rows "Login, idle", "Login, in progress", "Login, cancelled" and "Login, error": "the button" and "button enabled again/disabled" now mean both buttons.
- 001 §2 States, row "Disabled": "Only the login button during progress" now includes the guest button.
- 001 §2 Edge rules, "Email is always present": holds for Google users only; a guest has no email and is shown by name, "Signed in as Guest".
- 001 §4 Copy, row "Signed-in identity": the name may be "Guest" (guest user).
- 001 §6 Keyboard flow, "Login view: Tab reaches only "Sign in with Google" (one tab stop) … During progress the button is disabled and skipped": now two tab stops, and during progress both buttons are skipped.
- 001 §3 Focus summary, "After success: `#identity`": also applies to guest sign-in. Rules after cancel, error and sign-out are unchanged.
- 001 §7 Responsive, first bullet, "Sign-in button becomes full width": applies to both buttons.
- 001 §1 Decisions, text rule "Sign in with Google appears only on the button": still true; add the same rule for "Sign in as guest".
- The e2e probe "the login screen has exactly one tab stop" (001) becomes two stops in dev/e2e mode; this is already in the Technical design.

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

### 1. Decisions in short

- **Guest isn't an identity provider**, so it isn't an `AuthClient`. It's a reducer action
  `guestSignedIn` that the `AuthProvider` dispatches directly. The Google client is never
  touched, which makes guest sign-in work without a client ID or a loaded GIS script (AC3).
- **Dev-only guard:** `import.meta.env.DEV`, written **literally at every use site**. It
  follows the pattern of [ADR 0003](../adr/0003-auth-client-abstraction-and-e2e-fake.md),
  but with a different condition: the e2e fake uses `DEV && MODE === 'e2e'`, while guest uses
  `DEV` alone, so it shows in `npm run dev` (mode `development`), `vite --mode e2e` and Vitest.
  `vite build` replaces `DEV` with `false`, so the branch and the label are dropped; `vite preview`
  serves that build and so has no guest either (AC12). There's no new ADR: the decision is cheap
  to reverse (remove the guard), and the pattern and its rationale are already in ADR 0003.
- **No new dependency, no storage**, no change to the Google adapter.

### 2. AC → mechanism

| AC   | Mechanism                                                                                                                                           |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1  | `LoginView` renders the guest button when `import.meta.env.DEV && onSignInAsGuest`; Google button unchanged.                                        |
| AC2  | `signInAsGuest()` → `dispatch({ type: 'guestSignedIn' })` → `signedIn` with `GUEST_USER` synchronously; no client call, no network.                 |
| AC3  | Guest path never calls `AuthClient`; the "not configured" client and a failed GIS load only report on a Google click.                               |
| AC4  | Existing `signOut()` (001/AC9), unchanged; the login view renders both buttons again.                                                               |
| AC5  | No storage (001): a reload always starts `signedOut`.                                                                                               |
| AC6  | Reducer: `guestSignedIn` from `signedOut` with any notice → `signedIn` (notice gone with the login view).                                           |
| AC7  | `App` already renders the signed-in content for any `signedIn` user; no provider check anywhere.                                                    |
| AC8  | `GUEST_USER.name = 'Guest'` → `displayName` → "Signed in as Guest".                                                                                 |
| AC9  | Guest button `disabled={inProgress}`, the same prop as the Google button; the reducer ignores `guestSignedIn` while `signingIn` (defence in depth). |
| AC10 | Same as AC5: nothing is persisted, guests included.                                                                                                 |
| AC11 | `LoginView` intro `<p>` unchanged.                                                                                                                  |
| AC12 | DEV guard → dead code in `vite build`; checked by a `verify` step that greps `dist` (§6).                                                           |

### 3. Files

| Path                                                                        | Change                                                                                                                                                                                   |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/auth/types.ts`                                                | `AuthUser` becomes a discriminated union on `provider` (§4).                                                                                                                             |
| `src/features/auth/guestUser.ts`                                            | `GUEST_USER` constant (no other code).                                                                                                                                                   |
| `src/features/auth/authReducer.ts` (+ test)                                 | Action `guestSignedIn`, valid only from `signedOut`.                                                                                                                                     |
| `src/features/auth/AuthContext.ts`                                          | `signInAsGuest?: (() => void) \| undefined` on `AuthContextValue`.                                                                                                                       |
| `src/features/auth/AuthProvider.tsx` (+ test)                               | `signInAsGuest` (stable `useCallback`; same `stateRef`/`inFlightRef` guard as `signIn`), put into the value only under `import.meta.env.DEV`.                                            |
| `src/features/auth/displayName.ts`                                          | Handle the union (guest → `name`; Google unchanged).                                                                                                                                     |
| `src/features/auth/google/parseUserInfo.ts`, `fake/createFakeAuthClient.ts` | Add `provider: 'google'` to the users they build (the type checker finds every place).                                                                                                   |
| `src/features/auth/LoginView.tsx` + `.module.css`                           | Optional prop `onSignInAsGuest`; second native `<button type="button">` "Sign in as guest" under the literal DEV guard; styling per UX. No separate component file: it's a plain button. |
| `src/features/auth/useAuthFocus.ts`                                         | Focus rule for `signedOut → signedIn` (guest), per UX (§7).                                                                                                                              |
| `src/app/App.tsx`                                                           | Pass `signInAsGuest` from `useAuth()` to `LoginView`.                                                                                                                                    |
| `package.json` (_devops_)                                                   | `verify` gets a bundle check after `vite build` (§6).                                                                                                                                    |
| `e2e/auth-guest.spec.ts` (_tester_)                                         | Guest ACs (§6). Update the 001 probe "the login screen has exactly one tab stop" to two stops.                                                                                           |

### 4. Types

```ts
// src/features/auth/types.ts
export type AuthUser =
  | {
      readonly provider: 'google';
      /** Google subject (`sub`). Display/React keys only — never an authorization basis. */
      readonly id: string;
      readonly email: string;
      readonly name: string | null;
    }
  | {
      readonly provider: 'guest';
      readonly id: 'guest';
      readonly email: null;
      readonly name: 'Guest';
    };

// src/features/auth/guestUser.ts
export const GUEST_USER = {
  provider: 'guest',
  id: 'guest',
  email: null,
  name: 'Guest',
} as const satisfies AuthUser;

// src/features/auth/authReducer.ts
export type AuthAction =
  | { readonly type: 'signInStarted' }
  | { readonly type: 'signInSettled'; readonly result: SignInResult }
  | { readonly type: 'guestSignedIn' }
  | { readonly type: 'signedOut' };
// case 'guestSignedIn': return state.status === 'signedOut' ? { status: 'signedIn', user: GUEST_USER } : state;

// src/features/auth/AuthContext.ts
export interface AuthContextValue {
  readonly state: AuthState;
  readonly signIn: () => void;
  /** Present only in DEV builds (story 004). Signs in as the guest synchronously. */
  readonly signInAsGuest?: (() => void) | undefined;
  readonly signOut: () => void;
}

// src/features/auth/LoginView.tsx
export interface LoginViewProps {
  readonly inProgress: boolean;
  readonly notice: SignInNotice | null;
  readonly onSignIn: () => void;
  /** Guest sign-in; the button renders only if set and only in DEV. */
  readonly onSignInAsGuest?: (() => void) | undefined;
  readonly signInButtonRef?: Ref<HTMLButtonElement> | undefined;
}
```

The union keeps 001's invariant: a Google user always has an email. `displayName`:
`user.provider === 'guest' ? user.name : (user.name?.trim() || user.email)`.

### 5. Data flow and state

- **Owner unchanged:** `AuthProvider`'s reducer. The guest is just a `signedIn` state with
  `GUEST_USER`; nothing downstream distinguishes providers (AC7).
- **`signInAsGuest()`:** if `inFlightRef.current` or `stateRef.current.status !== 'signedOut'`,
  return. Otherwise `dispatch({ type: 'guestSignedIn' })`. No client call.
- **`signOut()` unchanged:** it still calls `client.signOut()` for a guest, which is harmless
  (the Google adapter only clears its own leftovers, and the not-configured client is a no-op).
- **Context value:** `signInAsGuest: import.meta.env.DEV ? signInAsGuest : undefined`.
- **Overlap:** a late Google result can't arrive after a guest sign-in, because the guest button
  is disabled while `signingIn`. If one ever did, the reducer ignores `signInSettled` outside
  `signingIn`.
- **Guard rule for the developer:** write `import.meta.env.DEV` literally in the provider
  and in `LoginView`. Don't re-export it as a constant from another module, because
  cross-module constant folding isn't guaranteed and the label could survive in the bundle.

### 6. Testability (minimal set, one level per AC)

Each AC is tested once, at the cheapest level that shows it. There are no duplicate
component tests for what e2e already shows.

- **Unit (`authReducer.test.ts`, 3 cases):** `guestSignedIn` from `signedOut` with a notice →
  `signedIn` guest (AC6); ignored in `signingIn` (AC9) and in `signedIn` (same state object).
- **Component (`AuthProvider.test.tsx`, 1 case):** with a client whose `signIn` is a `vi.fn()`
  returning `not_configured`, `signInAsGuest()` signs in and `signIn` is never called (AC3).
  In e2e the fake always "works", so AC3 can't be shown there.
- **e2e (`e2e/auth-guest.spec.ts`, ~8 tests, names start with the AC):**
  - AC1 together with AC11 (both buttons, intro unchanged);
  - AC2 together with AC8 ("Signed in as Guest", login screen gone);
  - AC4 with AC5 (sign out, then reload);
  - AC6 (after a fake `error`, then guest);
  - AC7 (counter visible, no Google button);
  - AC9 (guest disabled during a pending fake attempt, enabled again after `cancelled`);
  - AC10 (reload while signed in as guest).
- **AC12, as a build check rather than a test file (_devops_):** add a script to `verify`
  after `vite build`: `! grep -rq -e "Sign in as guest" -e "__fakeGoogle" dist`. That also
  automates ADR 0003's fake check. Reviewer runs it manually once:
  `npm run build && grep -r "Sign in as guest" dist` must be empty.
- **Not needed:** separate `LoginView`/button unit tests, `displayName` guest test (covered
  by AC8 e2e), tests of the DEV guard via `vi.stubEnv` (the build check is the real oracle).

### 7. For the ux-designer (to decide)

1. **Guest button styling:** visually secondary to the Google button (hak: "additional,
   visually secondary"). Must not look like a Google-branded button. Define idle, hover, focus
   and disabled states (disabled during a Google attempt, AC9).
2. **Placement and order:** the button sits below or beside the Google button. Is the message
   live region still directly under the Google button, or under both?
3. **Tab order:** the login view now has two tab stops (Google first, then guest). Confirm.
4. **Focus after guest sign-in:** my default is the same as Google success, `#identity`
   ("Signed in as Guest"). That's implemented as a `signedOut → signedIn` rule in `useAuthFocus`.
5. **Focus after sign-out of a guest:** keep 001's rule (focus the "Sign in with Google"
   button), or focus the guest button? My default is to keep 001's rule.
6. **Intro text (AC11):** "Use your Google account to sign in." stays unchanged next to a
   guest option. Decide whether the guest button needs its own small hint (for example a
   "testing only" note). No hint is needed for the ACs.
7. **Narrow viewport:** full-width stacking for both buttons, like 001's button below 600 px.
8. **Progress text** "Signing in with Google…" is unchanged; guest has no progress state
   (it's synchronous).

### 8. Risks

1. **Label surviving in the production bundle** if the guard is hidden behind a re-exported
   constant: mitigated by the literal guard rule (§5) and the `verify` grep (§6).
2. **A deliberate `NODE_ENV=development vite build`** would include the guest button: Vite
   derives `DEV` from `NODE_ENV`, not from the mode. CI and deploy builds don't do this; the
   `verify` grep catches it in CI.
3. **001 e2e probe "exactly one tab stop"** breaks in e2e mode (DEV is true there). The tester
   updates it to two stops.
4. **Story 003 / later route protection:** a guest has no Google ID token and must never
   reach a backend. Note for 003 (see the reply to the coordinator; the PO adds it).

### 9. Implementation plan (developer, in order)

1. `types.ts` union + `guestUser.ts`; fix the type errors in `parseUserInfo.ts`,
   `createFakeAuthClient.ts`, `displayName.ts` and existing tests (`provider: 'google'`).
2. `authReducer.ts` `guestSignedIn` + the 3 reducer cases.
3. `AuthContext.ts`, `AuthProvider.tsx` `signInAsGuest` under the literal DEV guard + the AC3 provider test.
4. `LoginView.tsx` (+ CSS per UX) guest button under the literal DEV guard; `App.tsx` wiring.
5. `useAuthFocus.ts` focus rule per UX.
6. Hand off: devops adds the bundle grep to `verify`; tester writes `e2e/auth-guest.spec.ts`
   and updates the tab-stop probe.
7. `npm run verify` green (includes the grep), then a manual check: `npm run build && npx vite preview`
   shows no guest button, and `npm run dev` shows it.

## Implementation notes

_developer: what was built, deviations from the design and why._

**What was built** (implementation plan §9 steps 1 to 5):

- `types.ts`: `AuthUser` is now a union on `provider` (`'google' | 'guest'`). New `guestUser.ts` (`GUEST_USER`). `parseUserInfo.ts` and the fake set `provider: 'google'`. `displayName.ts` returns the guest's name directly.
- `authReducer.ts`: action `guestSignedIn`, valid only from `signedOut` (any notice is dropped); ignored while `signingIn` or `signedIn`.
- `AuthContext.ts` / `AuthProvider.tsx`: `signInAsGuest` uses the same `inFlightRef`/`stateRef` guard as `signIn` and never calls the `AuthClient`. It is put into the context value only under a literal `import.meta.env.DEV`.
- `LoginView.tsx` + `.module.css`: both buttons sit in a stacked `.buttons` wrapper (12 px gap). The guest button "Sign in as guest" is under a literal `import.meta.env.DEV && onSignInAsGuest` guard, `disabled={inProgress}` (AC9). It has a dashed secondary style for light and dark mode per UX §3; disabled is `opacity: 0.38`.
- `useAuthFocus.ts`: any transition into `signedIn` focuses `#identity`, which now covers guest sign-in. Sign-out still focuses the Google button.
- `App.tsx`: passes `signInAsGuest` to `LoginView`.
- Tests (minimal set per §6):
  - `authReducer.test.ts`: `guestSignedIn` from `signedOut` with a notice (AC6); ignored while signing in (AC9) and while signed in.
  - `AuthProvider.test.tsx`: one case for AC3 (client returns `not_configured`, guest signs in, `client.signIn` is never called).
  - Existing tests only got `provider: 'google'` added to their user literals.

**Checks:**

- `npm run verify` green (152 tests).
- `npm run build && grep -r "Sign in as guest" dist` finds nothing; `__fakeGoogle` is absent too. A production build with `--mode e2e` and a client ID set contains no label either.
- Browser check against `vite --mode e2e`:
  - both buttons are the same width (186 px) with a 12 px gap;
  - the guest button is the second tab stop, is disabled during a Google attempt and enabled again after an error;
  - guest sign-in shows "Signed in as Guest" with focus on `#identity`, no alert and the counter;
  - sign-out focuses the Google button;
  - at 320 px both buttons are 288 px wide with no horizontal scroll;
  - dark-mode colours match the UX;
  - `vite preview` of the production build shows only the Google button.
- `npm run test:e2e`: 32 of 33 pass. The failing one is the 001 probe "the login screen has exactly one tab stop", as expected (§8 risk 3), and is left for the tester.

**Deviations from the design:**

1. The buttons are wrapped in an `inline-flex` column (`.buttons`), so both take the width of the wider one (the Google button) without stretching it to 400 px. That keeps the 001 e2e probe "the sign-in button is not stretched to full width" valid. Below 600 px the wrapper is `flex` and both buttons are full width. UX §1 says "same width (container max 400 px)" and doesn't say how to achieve it.
2. The guest disabled state uses `opacity: 0.38` on the whole button, a shortcut for "text and border at 38 %". The button can't be focused when disabled, so the focus ring isn't affected.
3. The AC3 provider test uses a plain `AuthClient` object with `signIn: vi.fn(...)`, as designed. The existing probe component in `AuthProvider.test.tsx` got a "sign in as guest" button and shows `email ?? name`.

**Notes for review / follow-ups:**

- In the production bundle the label, the guest button and the context entry are gone. The reducer's `guestSignedIn` case, `GUEST_USER` and the unexposed `signInAsGuest` callback remain as dead code, because they aren't behind a DEV guard. They can't be reached: the only path to them is `signInAsGuest` on the context, which is `undefined` in production. AC12 only requires the label to be absent. If the reviewer wants the remnants gone too, the reducer case can get its own literal DEV guard.
- For the tester: `e2e/auth-guest.spec.ts`, and update the 001 tab-stop probe to two stops in e2e mode.
- `package.json` `verify` is untouched; devops adds the dist grep.

## Test report

_tester: AC → test mapping, results, defects found._

Run on branch `feature/004-guest-login`: `npm run verify` green (typecheck, lint, prettier, 152 unit/component tests, build, `check:dist`); `npm run test:e2e` 41/41 green. Minimal test set as in Technical design §6: one test per AC or AC group, one level each, nothing duplicated from the developer's unit tests.

**Tests added: 8 e2e tests** in `e2e/auth-guest.spec.ts`, **0 new unit tests** (the developer's 3 reducer cases and 1 provider case already cover AC3, AC6 and AC9 at unit level). **1 existing e2e test changed**: `e2e/auth.spec.ts` "keyboard only: the login screen has exactly two tab stops (Google, then guest)" (was one stop).

| AC   | Test                                                                                                                                                                                                                                                                    | Result |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| AC1  | e2e `auth-guest.spec.ts` "AC1/AC11: the login screen shows both options and the unchanged intro text"                                                                                                                                                                   | PASS   |
| AC2  | e2e "AC2/AC8: signing in as guest is immediate and reads "Signed in as Guest"" (login screen gone, no alert, focus on `#identity`)                                                                                                                                      | PASS   |
| AC3  | unit (developer) `AuthProvider.test.tsx` AC3 case: client returns `not_configured`, guest signs in, `client.signIn` never called                                                                                                                                        | PASS   |
| AC4  | e2e "AC4/AC5: signing out shows both options again, and a reload keeps the login screen" (focus on the Google button)                                                                                                                                                   | PASS   |
| AC5  | same test as AC4                                                                                                                                                                                                                                                        | PASS   |
| AC6  | e2e "AC6: after a Google error, signing in as guest leaves no error message", "AC6: after a Google cancel, …"; unit (developer) reducer case                                                                                                                            | PASS   |
| AC7  | e2e "AC7: a guest sees the same signed-in content as a Google user" (counter works, no Google button)                                                                                                                                                                   | PASS   |
| AC8  | same test as AC2                                                                                                                                                                                                                                                        | PASS   |
| AC9  | e2e "AC9: the guest option is disabled while a Google attempt is pending and enabled after" (after cancelled and after error); unit (developer) reducer                                                                                                                 | PASS   |
| AC10 | e2e "AC10: reloading while signed in as guest shows the login screen" (also checks nothing in localStorage, sessionStorage, cookies)                                                                                                                                    | PASS   |
| AC11 | same test as AC1                                                                                                                                                                                                                                                        | PASS   |
| AC12 | `npm run verify` runs `check:dist` (`scripts/check-dist.mjs`) and passes; I confirmed it fails when the label is injected into `dist/assets/*.js`; manual: `vite preview` of the production build shows only "Sign in with Google" (one button, one tab stop), no guest | PASS   |

**Checked, OK (not kept as permanent tests):** double click on the guest button (one signed-in state, one banner); keyboard only (Tab, Tab, Enter on guest focuses `#identity`; Tab to Sign out, Enter, focus on the Google button; Space on guest also works); guest, sign out, then a Google sign-in still works; the exact strings "Sign in as guest" and "Sign in with Google" each match one element; at 320 px both buttons are 288 px wide, 40 px high, stacked with a 12 px gap, no horizontal scroll; focus ring on the guest button is `2px solid rgb(11, 87, 208)` and its border is dashed; while a Google attempt is pending there is no tab stop in the login view.

**Defects:** none.

**Notes:** (1) The reducer case, `GUEST_USER` and the provider callback remain as unreachable dead code in the production bundle (developer's note); AC12 only requires the label to be absent, so this is for the reviewer to judge. (2) Dark-mode colours of the guest button and a real browser other than Chromium were not checked by me. (3) `check:dist` is hard-wired to `dist/`, so it checks the default build only.

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

### Round 1 — APPROVED

What I ran on `feature/004-guest-login` (uncommitted work on top of `main`):

- `npm run verify` is green: 152 tests, the build and `check:dist` all pass.
- `npm run test:e2e` passes 41 of 41.
- The production `dist/` contains neither "Sign in as guest" nor `__fakeGoogle`.
- I probed `scripts/check-dist.mjs` from a scratch directory, so the repo was not touched:
  - It passes on a clean copy of `dist/`.
  - It fails when the label is injected into the JS bundle.
  - It fails when the JS bundle is missing, so it doesn't pass trivially on an empty build.
  - It fails on a `NODE_ENV=development vite build`, which is risk 2 in the Technical design.
- So the check proves what AC12 asks for. It uses plain Node `fs`, so it runs the same on macOS and on Ubuntu CI. CI runs `npm run verify`, so the check runs there too.
- The guest path doesn't depend on `VITE_GOOGLE_CLIENT_ID`, so a plain build is a valid oracle for it.

What I checked and found fine:

- **DEV guards:** `import.meta.env.DEV` is written out literally in `AuthProvider.tsx` and in `LoginView.tsx`, as §5 asks.
- **Reducer:** `guestSignedIn` only works from `signedOut`, and any notice is dropped. While signing in or signed in, the reducer returns the same state object.
- **Provider guard:** `signInAsGuest` uses the same `inFlightRef` / `stateRef` guard as `signIn` and never calls the `AuthClient` (AC3).
- **Focus rules:**
  - `useAuthFocus` now focuses `#identity` on any change into `signedIn`, so guest sign-in gets the same focus as a Google success.
  - On mount the previous status equals the current one, so a page load still moves no focus.
  - Sign-out of a guest focuses the Google button, as UX §4 says.
- **`AuthUser` union:** the only use of `email` outside tests is in `displayName.ts:10`, where it is narrowed to `provider === 'google'`. `parseUserInfo` and the fake build Google users only, so `email: null` exists only for the guest. The 001 invariant "a Google user always has an email" still holds at the type level.
- **XSS:** the guest name is rendered as a text node, like any other name.
- **Deviations:** all three are acceptable.

Findings:

- [nit] Dead code in the production bundle: the `guestSignedIn` reducer case (`authReducer.ts:40-42`), `GUEST_USER` and the unexposed `signInAsGuest` callback (`AuthProvider.tsx:43-46`) remain in `dist/` (`guestSignedIn` appears twice, `Guest` five times). **Accepted, no change.**
  - Nothing in production can reach it. `dispatch` is private to the provider, and the context exposes `signInAsGuest` as `undefined`.
  - Someone who manipulates their own page through devtools can change any client state anyway.
  - Client-side `signedIn` is display only and never an authorization basis (001 §9).
  - AC12 requires the option and the label to be gone, and they are.
  - Adding a third DEV guard in the reducer would spread the guard pattern without adding protection.
  - Route protection and story 003 must treat `provider: 'guest'` explicitly (Technical design risk 4).
- [nit] `scripts/check-dist.mjs:7`: the `FORBIDDEN` list is hard-coded. If the label is renamed, or a new dev-only feature is added, the check goes stale without anyone noticing. Whoever changes a dev-only string or adds one must update the list in the same change. I suggested this as a CLAUDE.md rule.
- [nit] Proportionality, duplicate coverage:
  - AC6 is tested three times: by the reducer case `004/AC6` and by two e2e tests (`e2e/auth-guest.spec.ts:89` and `:99`). Error and cancel take the same code path, because the guest transition ignores the notice. The cancel e2e test (`:99-108`) can go.
  - The storage assertion in the AC10 e2e test (`:81-86`) repeats 001's "AC10: the app writes no user data to browser storage". The guest path has no storage code. It's optional and harmless.
  - Neither duplicate is worth another round. Drop them in a later test-pruning chore, or leave them.
- [nit] Test report, lines 466-467: an empty "AC / Test(s) / Result" table is left over from the template. Remove it.

Gaps: I found none that carry a real risk.

- The Google path and its timeout are unchanged.
- AC3 can only be shown at unit level.
- AC12 is a build check rather than a test, which is the right tool for it.
- No further tests needed.

## Retrospective

_orchestrator, 2026-11-01._

### What went well

The 001 retro changes worked: the gate-1 feasibility check found no blocker before the
ACs were final, and running the architect before the ux-designer meant no UX rework.
Approved in review round 1, no defects. With a lean test set named in the design, the
story added 8 e2e tests and 4 unit tests (001: 100+ tests).

### What went wrong

| #   | Problem                                                                                                                                                 | Cost                                   | Root cause                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| P1  | 12 ACs; AC5 and AC10 overlap, AC5 repeats 001/AC10; AC6 tested three times.                                                                             | Longer story and test report, minor.   | The product-owner turned every confirmed default into an AC without merging overlaps or checking earlier stories. |
| P2  | `scripts/check-dist.mjs` hard-codes its forbidden strings; renaming a dev-only label or adding a new dev-only feature makes the check silently stale.   | None yet (review nit).                 | No rule says dev-only strings must be registered there.                                                           |
| P3  | The 001 design and README said the Google consent screen must be "In production"; hak's real setup showed that needs a homepage and privacy-policy URL. | README corrected in this story.        | The architect didn't check Google's publishing requirements; caught only by the manual setup.                     |
| P4  | An empty template table stayed in the Test report.                                                                                                      | Cosmetic, removed by the orchestrator. | The tester wrote its table above the template placeholder.                                                        |

### Proposed changes

1. **CLAUDE.md, Conventions (P2; reviewer, developer, tech-writer):** generalise the
   test-fake rule to **dev-only features**: guarded by a literal `import.meta.env.DEV`
   at every use site (never a shared constant), and their visible strings added to the
   forbidden list in `scripts/check-dist.mjs` in the same change.
2. **`product-owner` agent (P1):** when turning confirmed defaults into ACs, merge
   overlapping ACs and don't restate an AC of an earlier story — reference it instead.
3. **CLAUDE.md, test proportionality (reviewer, architect):** "One test per AC at the
   cheapest level that shows it; unit tests only for logic with branches; probes are
   kept as tests only if they found a defect or cover a real risk." hak declined a
   test policy after story 001 ("Not now"); this story applied it per story and it
   worked, so it's proposed again for hak to decide.
4. **`tester` agent (P4):** replace the template's Test report placeholder instead of
   writing above it.

P3 needs no rule change: the README is corrected and the architect noted it in memory.

### Memory check

Eight memory files changed (23 lines). Lessons look correct. The reviewer added a
topic file `test-proportionality.md` — if proposal 3 is approved, it duplicates
CLAUDE.md and can be shortened at the reviewer's next run.

### Outcome

Gate 2, 2026-11-01 — hak: "Ja, alle". All four proposals applied in this commit:

1. Dev-only code rule (test fakes and dev-only features, literal `import.meta.env.DEV`,
   strings registered in `scripts/check-dist.mjs`) → `CLAUDE.md` Conventions.
2. Merge overlapping ACs, don't restate earlier stories' ACs →
   `.claude/agents/product-owner.md`.
3. Test proportionality → `CLAUDE.md` Conventions; applied in
   `.claude/agents/tester.md` (steps 2, 3, 5) and `.claude/agents/reviewer.md` (Tests).
4. Replace the Test report placeholder → `.claude/agents/tester.md` step 5.
