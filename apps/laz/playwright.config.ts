import { createAppPlaywrightConfig } from '@swfactory/platform/config/playwright';

export default createAppPlaywrightConfig({
  // The platform's sign-in specs (smoke, auth, auth-guest) run against this app and expect the
  // title as the page's h1 and the signed-in content to be visible right after sign-in.
  title: 'Lebensarbeitszeitkonto',
  signedInContent: { role: 'region', name: 'Lebensarbeitszeitkonto content' },
});
