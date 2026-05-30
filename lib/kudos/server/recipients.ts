import { createServerClient } from '@/lib/supabase/server';
import type { Recipient } from '../types';

type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  team: string | null;
};

/**
 * Recipients picker source for the Viết Kudo form.
 *
 * Returns every user in `public.users` except the current viewer (a user
 * cannot send a kudo to themselves — DB also enforces this via
 * `kudos_sender_recipient_diff`).
 */
export async function fetchRecipients(): Promise<readonly Recipient[]> {
  const supabase = await createServerClient();

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  let query = supabase
    .from('users')
    .select('id, email, display_name, avatar_url, team')
    .order('display_name', { ascending: true });

  if (viewer) query = query.neq('id', viewer.id);

  const { data, error } = await query;
  if (error) throw new Error(`fetchRecipients failed: ${error.message}`);

  return ((data ?? []) as UserRow[]).map((row) => ({
    id: row.id,
    displayName: row.display_name ?? row.email,
    email: row.email,
    avatarUrl: row.avatar_url,
    team: row.team ?? '',
  }));
}
