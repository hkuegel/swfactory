# App `__NAME__`

An app on the software factory's platform, created from `templates/app` by `/new-app`.
It shows its content after sign-in (`src/Content.tsx`); sign-in, shell and design tokens
come from `@swfactory/platform`.

```bash
npm run dev -w apps/__NAME__          # dev server (port 5173)
npm run verify -w apps/__NAME__       # platform checks + this app's typecheck, lint, tests, build
npm run test:e2e -w apps/__NAME__     # the platform's sign-in specs plus this app's own e2e
```

App-specific design tokens go in `src/tokens.css`, stories in `docs/backlog/`, ADRs in `docs/adr/`.
