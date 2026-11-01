import type { AuthUser } from '../types.ts';

function nonBlankString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/**
 * Turns the OIDC userinfo JSON into an AuthUser. Needs `sub` and `email`; a missing or blank
 * `name` becomes null (AC11). Returns null if the body isn't usable.
 */
export function parseUserInfo(body: unknown): AuthUser | null {
  if (typeof body !== 'object' || body === null) return null;
  const record: Record<string, unknown> = { ...body };
  const id = nonBlankString(record['sub']);
  const email = nonBlankString(record['email']);
  if (!id || !email) return null;
  return { id, email, name: nonBlankString(record['name']) };
}
