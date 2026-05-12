import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Integration-test helpers for seeding and tearing down the `users` and
 * `auth_allowed_domains` tables against a LOCAL Supabase. Requires
 * `SUPABASE_SERVICE_ROLE_KEY` in the environment — never use this against
 * production.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function adminClient(): SupabaseClient {
  if (!URL || !SERVICE_ROLE) {
    throw new Error('SUPABASE_* env vars missing — seed helpers are local-only.');
  }
  return createClient(URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function seedAllowedDomains(domains: string[]): Promise<void> {
  const supabase = adminClient();
  const rows = domains.map((domain) => ({ domain: domain.toLowerCase(), enabled: true }));
  const { error } = await supabase.from('auth_allowed_domains').upsert(rows);
  if (error) throw error;
}

export async function disableAllowedDomain(domain: string): Promise<void> {
  const supabase = adminClient();
  const { error } = await supabase
    .from('auth_allowed_domains')
    .update({ enabled: false })
    .eq('domain', domain.toLowerCase());
  if (error) throw error;
}

export async function resetAllowedDomainsToSeed(): Promise<void> {
  const supabase = adminClient();
  // Truncate then re-insert the migration seed.
  const { error: deleteError } = await supabase
    .from('auth_allowed_domains')
    .delete()
    .gte('created_at', '1970-01-01');
  if (deleteError) throw deleteError;
  await seedAllowedDomains(['sun-asterisk.com']);
}

export async function clearUsers(): Promise<void> {
  const supabase = adminClient();
  // Deleting from auth.users cascades to public.users via the FK.
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;
  for (const user of users.users) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw error;
  }
}

export interface TestUserInput {
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export async function createAuthUser(input: TestUserInput): Promise<{ id: string }> {
  const supabase = adminClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email: input.email,
    email_confirm: true,
    user_metadata: {
      full_name: input.full_name,
      avatar_url: input.avatar_url,
    },
  });
  if (error) throw error;
  return { id: data.user.id };
}
