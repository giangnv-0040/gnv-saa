import { createAdminClient } from '@/lib/supabase/server';

/**
 * Server-only check: is the domain portion of `email` on the Sun*
 * allow-list (`auth_allowed_domains`) AND enabled?
 *
 * Matching is case-insensitive on the domain part. The query uses the service
 * role; the table has no RLS policy for authenticated users.
 *
 * MUST be called BEFORE the session cookie is set (spec FR-005).
 */
export async function isDomainAllowed(email: string): Promise<boolean> {
  if (typeof email !== 'string' || !email.includes('@')) return false;

  const domain = email.split('@').pop()?.toLowerCase().trim();
  if (!domain) return false;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('auth_allowed_domains')
    .select('domain')
    .eq('domain', domain)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`allow-list lookup failed: ${error.message}`);
  }

  return data !== null;
}
