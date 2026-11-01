import type { AuthUser } from './types.ts';

/**
 * Name shown for the signed-in user: the guest's fixed name (004/AC8), else the trimmed Google
 * name, or the email if there is no name (001/AC11).
 */
export function displayName(user: AuthUser): string {
  if (user.provider === 'guest') return user.name;
  const name = user.name?.trim();
  return name ? name : user.email;
}
