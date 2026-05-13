import type { Locale } from '@/lib/i18n/config';

/**
 * Application-facing user profile. Mirrors the columns on `public.users` that
 * are read by Homepage SAA (and any future authenticated screen).
 *
 * `role` is added by the `20260513000001_add_user_role.sql` migration. It
 * MUST NEVER be mutable from the client.
 */
export type UserRole = 'user' | 'admin';

export interface UserProfile {
  readonly id: string;
  readonly email: string;
  readonly displayName: string | null;
  readonly avatarUrl: string | null;
  readonly locale: Locale;
  readonly role: UserRole;
}
