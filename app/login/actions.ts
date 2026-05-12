'use server';

import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { sanitizeRedirectTo } from '@/lib/auth/safe-redirect';
import { logger } from '@/lib/logger';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/**
 * Initiates the Google OAuth flow via Supabase. Reads `redirectTo` from the
 * form data, sanitizes, and embeds it into the callback URL so the server
 * can read it back after the OAuth round-trip.
 *
 * Spec FR-015: same-window redirect — Next.js `redirect()` returns a 303
 * pointing at the Google consent screen URL Supabase generates. Popups are
 * forbidden.
 */
export async function signInWithGoogle(formData: FormData): Promise<void> {
  const safeRedirect = sanitizeRedirectTo(formData.get('redirectTo'));

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${SITE_URL}/auth/callback?redirectTo=${encodeURIComponent(safeRedirect)}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error || !data?.url) {
      logger.warn('signInWithGoogle: provider returned no url', { error: error?.message });
      redirect('/login?error=provider_error');
    }

    redirect(data.url);
  } catch (err) {
    // `redirect()` throws an internal Next.js error that must propagate; any
    // OTHER throw is a real failure (network, unexpected) → network_error.
    if (isNextRedirectError(err)) throw err;
    logger.error('signInWithGoogle: unexpected failure', {
      message: err instanceof Error ? err.message : String(err),
    });
    redirect('/login?error=network_error');
  }
}

function isNextRedirectError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'digest' in err &&
    typeof (err as { digest?: unknown }).digest === 'string' &&
    (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  );
}
