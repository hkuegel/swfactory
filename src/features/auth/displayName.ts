import type { AuthUser } from './types.ts';

/** Name shown for the signed-in user: the trimmed name, or the email if there is no name (AC11). */
export function displayName(user: AuthUser): string {
  const name = user.name?.trim();
  return name ? name : user.email;
}
