import { createServerClient } from '@/lib/supabase/server';
import { isLocale, defaultLocale } from '@/lib/i18n/config';
import { logger } from '@/lib/logger';
import type { UserProfile, UserRole } from './types';

/**
 * Server-only helper to load the current user's profile row from
 * `public.users`.
 *
 * Returns `null` ONLY when the visitor has no Supabase session (anonymous,
 * or session expired). If the auth session exists but the `public.users`
 * row lookup fails (RLS, missing row, missing column from an un-applied
 * migration), the helper falls back to a synthetic profile built from
 * `auth.users` metadata so the UI still treats the visitor as
 * authenticated. Spec FR-019 + Edge Case "`/users/me` 401" — authentication
 * is owned by Supabase Auth, not by the profile table.
 *
 * The helper MUST NEVER throw — Homepage SAA is a public surface.
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fallback: UserProfile = {
    id: user.id,
    email: user.email ?? '',
    displayName:
      (typeof metadata.full_name === 'string' && metadata.full_name) ||
      (typeof metadata.name === 'string' && metadata.name) ||
      null,
    avatarUrl: typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null,
    locale: defaultLocale,
    role: 'user' satisfies UserRole,
  };

  const { data, error } = await supabase
    .from('users')
    .select('id, email, display_name, avatar_url, locale, role')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) {
    logger.warn('users.profile.lookup_failed_fallback', {
      userId: user.id,
      error: error?.message,
    });
    return fallback;
  }

  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name ?? fallback.displayName,
    avatarUrl: data.avatar_url ?? fallback.avatarUrl,
    locale: isLocale(data.locale) ? data.locale : defaultLocale,
    role: data.role === 'admin' ? 'admin' : ('user' satisfies UserRole),
  };
}
