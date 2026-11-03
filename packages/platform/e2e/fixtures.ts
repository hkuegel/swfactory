import { test as base, type Page } from '@playwright/test';

/** Something only visible after sign-in, so the platform specs don't know the app's content. */
export interface SignedInContent {
  readonly role: Parameters<Page['getByRole']>[0];
  readonly name: string;
}

/** Options every app sets in its Playwright config (see `createAppPlaywrightConfig`). */
export interface AppOptions {
  appTitle: string;
  signedInContent: SignedInContent;
}

/** The element that marks the app's signed-in content. */
export function signedInLocator(page: Page, content: SignedInContent) {
  return page.getByRole(content.role, { name: content.name });
}

export const test = base.extend<AppOptions>({
  appTitle: ['', { option: true }],
  signedInContent: [{ role: 'main', name: '' }, { option: true }],
});

export { expect } from '@playwright/test';
