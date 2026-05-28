import { createServerClient } from '@/lib/supabase/server';
import type { LeaderboardEntry, UserKudoStats } from '../types';
import type { LeaderboardType } from '../schemas';

const EMPTY_STATS: UserKudoStats = {
  kudosReceived: 0,
  kudosSent: 0,
  heartsReceived: 0,
  secretBoxesOpened: 0,
  secretBoxesUnopened: 0,
};

/** Personal counters for the live-board sidebar (D.1.*). */
export async function fetchMyStats(): Promise<UserKudoStats | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_kudo_stats')
    .select(
      'kudos_received, kudos_sent, hearts_received, secret_boxes_opened, secret_boxes_unopened',
    )
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw new Error(`fetchMyStats failed: ${error.message}`);
  if (!data) return EMPTY_STATS;

  return {
    kudosReceived: data.kudos_received,
    kudosSent: data.kudos_sent,
    heartsReceived: data.hearts_received,
    secretBoxesOpened: data.secret_boxes_opened,
    secretBoxesUnopened: data.secret_boxes_unopened,
  };
}

/**
 * Sidebar leaderboards (D.3 + sibling). `gift-received` lists the most
 * recent gift recipients; `rank-promotion` lists users whose `badge` was
 * upgraded most recently. The rank-promotion source-of-truth is TBD with
 * the admin tooling; for now we return badge holders ordered by hearts.
 */
export async function fetchLeaderboard(
  type: LeaderboardType,
  limit: number,
): Promise<readonly LeaderboardEntry[]> {
  const supabase = await createServerClient();

  if (type === 'gift-received') {
    const { data, error } = await supabase
      .from('secret_boxes')
      .select(
        'owner_id, content_id, opened_at, owner:users!secret_boxes_owner_id_fkey(id, display_name, team, avatar_url)',
      )
      .not('opened_at', 'is', null)
      .order('opened_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`fetchLeaderboard gift-received failed: ${error.message}`);

    type GiftRow = {
      owner_id: string;
      content_id: string | null;
      owner:
        | {
            id: string;
            display_name: string | null;
            team: string | null;
            avatar_url: string | null;
          }
        | Array<{
            id: string;
            display_name: string | null;
            team: string | null;
            avatar_url: string | null;
          }>
        | null;
    };

    return ((data ?? []) as unknown as GiftRow[]).map((row) => {
      const owner = Array.isArray(row.owner) ? row.owner[0] : row.owner;
      return {
        userId: owner?.id ?? row.owner_id,
        displayName: owner?.display_name ?? '',
        team: owner?.team ?? '',
        kind: 'gift' as const,
        note: row.content_id ?? '',
        avatarUrl: owner?.avatar_url ?? null,
      };
    });
  }

  // rank-promotion — placeholder source (badge holders by hearts).
  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, team, avatar_url, badge, hearts_received')
    .not('badge', 'is', null)
    .order('hearts_received', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`fetchLeaderboard rank-promotion failed: ${error.message}`);

  type UserRow = {
    id: string;
    display_name: string | null;
    team: string | null;
    avatar_url: string | null;
    badge: string | null;
    hearts_received: number;
  };

  return (data ?? []).map((row: UserRow) => ({
    userId: row.id,
    displayName: row.display_name ?? '',
    team: row.team ?? '',
    kind: 'rank-promotion' as const,
    note: row.badge ?? '',
    avatarUrl: row.avatar_url,
  }));
}
