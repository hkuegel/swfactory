# App `laz`

An app on the software factory's platform, created from `templates/app` by `/new-app`.
It calculates the payout phase of a Lebensarbeitszeitkonto: the maximum monthly payout a
depot funds over a phase of the length you choose, or the depot a target monthly payout
would need. The payout per share is a projection from YTM and NAV, not a published market
value, and the app labels it as such. It speaks German and uses German number formats, for
example `181,41 €`. Sign-in, shell and design tokens come from `@swfactory/platform`.

```bash
npm run dev -w apps/laz          # dev server (port 5173)
npm run verify -w apps/laz       # platform checks + this app's typecheck, lint, tests, build
npm run test:e2e -w apps/laz     # the platform's sign-in specs plus this app's own e2e
```

App-specific design tokens go in `src/tokens.css`, stories in `docs/backlog/`, ADRs in `docs/adr/`.
