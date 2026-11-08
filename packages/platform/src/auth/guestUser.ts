import type { AuthUser } from './types.ts';

/** The user a guest sign-in produces (dev or guest-only deploy build; stories 004, 018). */
export const GUEST_USER = {
  provider: 'guest',
  id: 'guest',
  email: null,
  name: 'Guest',
} as const satisfies AuthUser;
