import { createServerClient } from '@/lib/supabase/server';
import { isLocale, defaultLocale } from '@/lib/i18n/config';
import { logger } from '@/lib/logger';
import type { UserProfile, UserRole } from './types';

/**
 * Server-only helper to load the current user's profile row from
 * `public.users`.
 *
 * Returns `null` when:
 * - The visitor has no Supabase session (anonymous).
 * - The session cookie is invalid / expired (401 from Auth).
 * - The `users` row lookup fails for any reason.
 *
 * The helper MUST NEVER throw on auth failure — Homepage SAA is a public
 * surface and gracefully degrades to anonymous UI per spec FR-019 + the
 * "users/me 401" edge case in spec.
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('id, email, display_name, avatar_url, locale, role')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) {
    logger.warn('users.profile.lookup_failed', { userId: user.id, error: error?.message });
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name ?? null,
    avatarUrl: data.avatar_url ?? null,
    locale: isLocale(data.locale) ? data.locale : defaultLocale,
    role: data.role === 'admin' ? 'admin' : ('user' satisfies UserRole),
  };
}
