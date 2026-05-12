import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient, createServerClient } from '@/lib/supabase/server';
import { isDomainAllowed } from '@/lib/auth/allow-list';
import { sanitizeRedirectTo } from '@/lib/auth/safe-redirect';
import {
  oauthCallbackQuerySchema,
  oauthErrorCodeSchema,
  type OAuthErrorCode,
} from '@/lib/validation/auth';
import { logger } from '@/lib/logger';

/**
 * GET /auth/callback — handles the OAuth redirect from Google.
 *
 * Implements the ordered checklist from spec FR-004. Every failure path
 * redirects to /login?error=<code> with NO session cookie set. The cookie
 * is only written on the happy path AFTER the domain check passes.
 *
 * After the cookie is set we kick off a fire-and-forget UPDATE of
 * `users.last_login_at`. A failure of that update MUST NOT fail the login.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const rawParams: Record<string, string> = {};
  for (const [k, v] of url.searchParams.entries()) rawParams[k] = v;

  // Pass-through: if Google itself returned an error code, surface it verbatim
  // when recognized; otherwise treat as provider_error.
  if (rawParams.error) {
    const parsed = oauthErrorCodeSchema.safeParse(rawParams.error);
    return redirectToLogin(url, parsed.success ? parsed.data : 'provider_error');
  }

  // ----- Step 1: parse + validate the callback query string ---------------
  const parsed = oauthCallbackQuerySchema.safeParse(rawParams);
  if (!parsed.success || !parsed.data.code || !parsed.data.state) {
    return redirectToLogin(url, 'invalid_state');
  }
  const { code, redirectTo: requestedRedirect } = parsed.data;

  // ----- Step 2: exchange the code for a session --------------------------
  const supabase = await createServerClient();
  const { data: exchange, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError || !exchange?.user?.email) {
    logger.warn('callback: code exchange failed', { error: exchangeError?.message });
    return redirectToLogin(url, 'provider_error');
  }
  const { user } = exchange;

  // ----- Step 3: enforce the Sun*-domain allow-list -----------------------
  let allowed: boolean;
  try {
    allowed = await isDomainAllowed(user.email!);
  } catch (err) {
    logger.error('callback: allow-list lookup threw', {
      message: err instanceof Error ? err.message : String(err),
    });
    return redirectToLogin(url, 'provider_error');
  }

  if (!allowed) {
    logger.info('callback: domain rejected', { email: user.email });
    // Session may already have been mounted by exchangeCodeForSession — sign
    // out to ensure no cookie remains for this disallowed identity.
    await supabase.auth.signOut().catch(() => {
      /* best effort */
    });
    return redirectToLogin(url, 'domain_not_allowed');
  }

  // ----- Step 4: success — cookie set by @supabase/ssr; update last_login_at fire-and-forget
  void updateLastLoginAt(user.id).catch((err) => {
    logger.warn('callback: last_login_at update failed (non-fatal)', {
      message: err instanceof Error ? err.message : String(err),
      userId: user.id,
    });
  });

  const finalRedirect = sanitizeRedirectTo(requestedRedirect);
  return NextResponse.redirect(new URL(finalRedirect, url));
}

function redirectToLogin(currentUrl: URL, error: OAuthErrorCode) {
  const dest = new URL('/login', currentUrl);
  dest.searchParams.set('error', error);
  return NextResponse.redirect(dest);
}

async function updateLastLoginAt(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw new Error(error.message);
}
