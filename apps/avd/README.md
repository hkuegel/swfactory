# App `avd`

An app on the software factory's platform, created from `templates/app` by `/new-app`.
It shows its content after sign-in (`src/Content.tsx`); sign-in, shell and design tokens
come from `@swfactory/platform`.

```bash
npm run dev -w apps/avd          # dev server (port 5173)
npm run verify -w apps/avd       # platform checks + this app's typecheck, lint, tests, build
npm run test:e2e -w apps/avd     # the platform's sign-in specs plus this app's own e2e
```

App-specific design tokens go in `src/tokens.css`, stories in `docs/backlog/`, ADRs in `docs/adr/`.
