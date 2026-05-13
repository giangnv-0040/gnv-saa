import { z } from 'zod';
import { redirectToSchema } from '@/lib/auth/safe-redirect';
import { nonEmptyString } from '@/lib/validation/common';

/** OAuth error codes the application surfaces on /login?error=…  */
export const oauthErrorCodeSchema = z.enum([
  'access_denied',
  'domain_not_allowed',
  'invalid_state',
  'provider_error',
  'network_error',
]);
export type OAuthErrorCode = z.infer<typeof oauthErrorCodeSchema>;

/** Supported app locales. Default is 'vi'. Narrowed to vi/en per Homepage spec FR-024. */
export const localeSchema = z.enum(['vi', 'en']);
export type Locale = z.infer<typeof localeSchema>;

/**
 * Query string accepted by /auth/callback (and parsed at the trust boundary).
 *
 * Note: there is intentionally no `state` field — `@supabase/ssr` uses the
 * PKCE flow, where CSRF protection comes from the `code_verifier` cookie
 * (validated server-side by `exchangeCodeForSession`), not from a `state`
 * query parameter. Adding `state` would be misleading.
 */
export const oauthCallbackQuerySchema = z.object({
  code: nonEmptyString.optional(),
  error: oauthErrorCodeSchema.optional(),
  redirectTo: redirectToSchema.optional(),
});
export type OAuthCallbackQuery = z.infer<typeof oauthCallbackQuerySchema>;
