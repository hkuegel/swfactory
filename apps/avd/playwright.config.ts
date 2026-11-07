import { createAppPlaywrightConfig } from '@swfactory/platform/config/playwright';

export default createAppPlaywrightConfig({
  // The platform's sign-in specs (smoke, auth, auth-guest) run against this app and expect the
  // title as the page's h1 and the signed-in content to be visible right after sign-in.
  title: 'Altersvorsorgedepot',
  // The input form, named by its heading "Eingaben" (no other text on the page contains it).
  signedInContent: { role: 'form', name: 'Eingaben' },
});
