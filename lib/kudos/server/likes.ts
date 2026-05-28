import { createServerClient } from '@/lib/supabase/server';

/**
 * Like / unlike a kudo. Both endpoints route through here so the
 * defence-in-depth rules stay in one place:
 * - caller must be authenticated
 * - caller may not be the kudo's sender (FR-005)
 * - one like per (user, kudo) — enforced by composite PK; we surface 409
 * - `delta_at_write` snapshots the special-day multiplier at like-time so the
 *   aggregate counter can't drift later (FR-020)
 */

export type LikeResult =
  | { kind: 'ok'; heartsCount: number }
  | { kind: 'unauthenticated' }
  | { kind: 'forbidden_self_like' }
  | { kind: 'conflict' }
  | { kind: 'not_found' }
  | { kind: 'error'; message: string };

export async function addLike(kudoId: string): Promise<LikeResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { kind: 'unauthenticated' };

  const { data: kudo, error: kudoErr } = await supabase
    .from('kudos')
    .select('id, sender_id')
    .eq('id', kudoId)
    .maybeSingle();
  if (kudoErr) return { kind: 'error', message: kudoErr.message };
  if (!kudo) return { kind: 'not_found' };
  if (kudo.sender_id === user.id) return { kind: 'forbidden_self_like' };

  // Resolve special-day multiplier server-side.
  const { data: multiplier, error: mErr } = await supabase.rpc('current_heart_multiplier');
  if (mErr) return { kind: 'error', message: mErr.message };

  const { error: insertErr } = await supabase
    .from('kudo_likes')
    .insert({ kudo_id: kudoId, user_id: user.id, delta_at_write: multiplier ?? 1 });

  if (insertErr) {
    if (insertErr.code === '23505') return { kind: 'conflict' };
    return { kind: 'error', message: insertErr.message };
  }

  return { kind: 'ok', heartsCount: await heartsCountFor(supabase, kudoId) };
}

export async function removeLike(kudoId: string): Promise<LikeResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { kind: 'unauthenticated' };

  const { error, data } = await supabase
    .from('kudo_likes')
    .delete()
    .eq('kudo_id', kudoId)
    .eq('user_id', user.id)
    .select('kudo_id');
  if (error) return { kind: 'error', message: error.message };
  if (!data || data.length === 0) return { kind: 'not_found' };

  return { kind: 'ok', heartsCount: await heartsCountFor(supabase, kudoId) };
}

async function heartsCountFor(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  kudoId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('kudo_likes')
    .select('*', { count: 'exact', head: true })
    .eq('kudo_id', kudoId);
  if (error) return 0;
  return count ?? 0;
}
