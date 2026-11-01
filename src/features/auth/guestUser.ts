import type { AuthUser } from './types.ts';

/** The user a dev-only guest sign-in produces (story 004). */
export const GUEST_USER = {
  provider: 'guest',
  id: 'guest',
  email: null,
  name: 'Guest',
} as const satisfies AuthUser;
