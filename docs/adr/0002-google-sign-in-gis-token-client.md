# 0002 – Google sign-in via Google Identity Services token client and a custom button

- **Status:** accepted
- **Date:** 2026-11-01
- **Story:** docs/backlog/001-login.md

## Context

Story 001 needs Google sign-in in a frontend-only SPA (no backend, no own storage, any
Google account) with:

- a sign-in option that can be **disabled** and show **progress** while an attempt runs (AC3),
- a distinct **cancelled** outcome when the user closes the Google dialog (AC4),
- a distinct **error** outcome (AC5),
- the name/email of the user (AC2, AC11),
- no silent sign-in again after an explicit sign-out (AC10).

Google's browser offering today is Google Identity Services (GIS, runtime script
`https://accounts.google.com/gsi/client`) with two separate APIs:

- `google.accounts.id`: "Sign in with Google" (rendered button, One Tap, automatic
  sign-in). On Chromium it runs on FedCM. Returns an ID token (JWT).
- `google.accounts.oauth2`: OAuth 2.0 token client (popup). It returns an access token
  and has `error_callback` (`popup_closed`, `popup_failed_to_open`, `unknown`).

The story originally also required staying signed in after a reload via Google's own session
(AC7/AC8). With AC3 to AC5, that can't be met reliably without own storage. The popup flow
has no silent mode, and FedCM automatic sign-in is Chromium-only, limited to once per 10
minutes, and otherwise shows Google's own prompt. hak decided on 2026-11-01: "C: drop
AC7/AC8". Staying signed in moves to story 003.

## Options considered

1. **GIS `google.accounts.id` with the official rendered button (+ One Tap / auto_select)**
   - Pro: Google's intended "stay signed in" path. Returns an ID token with name/email.
   - Con: the button is a cross-origin iframe. It can't be disabled or styled, and the API
     has no callback when the user closes the dialog or an error happens. AC3, AC4 and AC5
     can't be met.
2. **GIS `google.accounts.oauth2` token client, opened from our own `<button>`** (chosen)
   - Pro: we control the button (real `disabled`, progress). Cancel is `error_callback`
     `popup_closed`, errors are `popup_failed_to_open` / `unknown` / `callback` with `error`.
     All AC3 to AC6 outcomes are distinguishable.
   - Con: no silent mode, so no restore on reload (accepted: AC7/AC8 dropped). Name/email
     need one extra call to the OIDC userinfo endpoint. The popup must be opened
     synchronously in the click handler.
3. **Wrapper library `@react-oauth/google`**
   - Con: it wraps the same two GIS APIs with the same limits. It adds a dependency and its
     own provider for what's about 100 lines of our own adapter code.
4. **Plain OAuth 2.0 / OIDC redirect (authorization code + PKCE, or implicit `id_token`)**
   - Con: Google requires a `client_secret` at the token endpoint for "Web application"
     clients, so a secret-less PKCE code flow isn't available to a pure SPA. Implicit
     redirect leaves the page, so AC3's progress state doesn't exist. A "Cancel" on Google
     comes back as `access_denied`, the same as a real denial (AC4 vs AC5). `state`/`nonce`
     need sessionStorage.

## Decision

- **Interactive sign-in:** GIS token client (option 2), scope `openid email profile`,
  `prompt: 'select_account'`, opened from our own native button. Name/email/sub come from
  `https://openidconnect.googleapis.com/v1/userinfo`. The access token is used only for
  that call, kept in memory in the adapter, and then dropped.
- **No session restore.** Every page load starts signed out, so AC10 holds without any
  Google-side call on sign-out. We don't revoke the grant, which would force the consent
  screen on every sign-in. `google.accounts.id` (One Tap/FedCM) isn't used.
- **No npm dependency.** The GIS script is loaded at runtime by our adapter (not in
  `index.html`, so tests and the e2e fake never load it). The GIS types we use are
  hand-written and minimal (`src/features/auth/google/gisTypes.ts`). No `@types/google.accounts`.

## Consequences

- AC3 to AC6 are fully under our control and testable by role in the DOM.
- Users have to sign in again after every reload until story 003 adds a session (most
  likely server-side, together with the backend story).
- Branding: our button must follow Google's "Sign in with Google" branding guidelines
  (story 001, UX design §5).
- `signIn()` must call `requestAccessToken()` synchronously in the click handler, or
  Safari/Firefox block the popup. So the GIS script is preloaded when the client is created.
- A host must not send `Cross-Origin-Opener-Policy: same-origin`, because it breaks popup
  communication and `popup_closed` detection. Use `same-origin-allow-popups` or no COOP.
- CSP for the later hosting story: `script-src https://accounts.google.com/gsi/client`,
  `connect-src https://openidconnect.googleapis.com`. No SRI is possible: Google updates
  the script in place, and we accept that trust.
- Name/email shown in the client are for display only. Anything that needs authorization
  must verify a Google ID token on a server (signature, `aud`, `iss`, `exp`). That's a later
  story.
- Google Cloud setup: OAuth client of type "Web application", JavaScript origins
  `http://localhost:5173` and `http://localhost`, consent screen published "In production".
  "Testing" limits sign-in to listed test users, which conflicts with "any Google account".
- If Google changes GIS behaviour, only `src/features/auth/google/` is affected (ADR 0003).
- Story 003 will need its own ADR for restoring a session; that ADR supersedes the "no
  session restore" part here.
