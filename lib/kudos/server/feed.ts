import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/server';
import type { FeedQuery, HighlightQuery } from '../schemas';
import type { Kudo, KudoFilterOption, KudoUserSummary, SpotlightRecipient } from '../types';

/**
 * Read-side queries against `public.kudo_with_aggregates` + child tables.
 *
 * Cursor pagination uses `created_at` + `id` together so newly inserted rows
 * don't shift later pages (TR-007).
 */

type KudoAggregateRow = {
  id: string;
  title: string | null;
  body: string;
  is_anonymous: boolean;
  created_at: string;
  sender_id: string;
  sender_display_name: string | null;
  sender_team: string | null;
  sender_badge: string | null;
  sender_hearts_received: number;
  sender_avatar_url: string | null;
  recipient_id: string;
  recipient_display_name: string | null;
  recipient_team: string | null;
  recipient_badge: string | null;
  recipient_hearts_received: number;
  recipient_avatar_url: string | null;
  hearts_count: number;
};

type ChildLookup = {
  hashtagsByKudo: Map<string, string[]>;
  imagesByKudo: Map<string, string[]>;
  likedKudoIds: Set<string>;
};

interface FeedPage {
  readonly items: readonly Kudo[];
  readonly nextCursor: string | null;
}

export async function fetchFeed(query: FeedQuery): Promise<FeedPage> {
  const supabase = await createServerClient();
  const builder = supabase
    .from('kudo_with_aggregates')
    .select('*')
    .limit(query.limit + 1);

  let q = builder;
  if (query.sort === 'newest') {
    q = q.order('created_at', { ascending: false }).order('id', { ascending: false });
    if (query.cursor) {
      const cursor = decodeCursor(query.cursor);
      if (cursor) {
        q = q.or(
          `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
        );
      }
    }
  } else {
    q = q.order('hearts_count', { ascending: false }).order('id', { ascending: false });
  }

  if (query.hashtag) {
    const ids = await fetchKudoIdsByHashtag(supabase, query.hashtag);
    if (ids.length === 0) return { items: [], nextCursor: null };
    q = q.in('id', ids);
  }

  if (query.team) {
    q = q.or(`sender_team.ilike.${query.team},recipient_team.ilike.${query.team}`);
  }

  const { data, error } = await q;
  if (error) throw new Error(`fetchFeed failed: ${error.message}`);

  const rows = (data ?? []) as KudoAggregateRow[];
  const slice = rows.slice(0, query.limit);
  const lookup = await loadChildren(
    supabase,
    slice.map((r) => r.id),
  );

  const items = slice.map((r) => toKudo(r, lookup));
  const nextCursor =
    rows.length > query.limit && query.sort === 'newest'
      ? encodeCursor({
          createdAt: slice[slice.length - 1]!.created_at,
          id: slice[slice.length - 1]!.id,
        })
      : null;

  return { items, nextCursor };
}

export async function fetchKudoById(id: string): Promise<Kudo | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('kudo_with_aggregates')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`fetchKudoById failed: ${error.message}`);
  if (!data) return null;

  const row = data as KudoAggregateRow;
  const lookup = await loadChildren(supabase, [row.id]);
  return toKudo(row, lookup);
}

export async function fetchHighlight(query: HighlightQuery): Promise<readonly Kudo[]> {
  const supabase = await createServerClient();
  let q = supabase
    .from('kudo_with_aggregates')
    .select('*')
    .order('hearts_count', { ascending: false })
    .order('id', { ascending: false })
    .limit(query.limit);

  if (query.hashtag) {
    const ids = await fetchKudoIdsByHashtag(supabase, query.hashtag);
    if (ids.length === 0) return [];
    q = q.in('id', ids);
  }
  if (query.team) {
    q = q.or(`sender_team.ilike.${query.team},recipient_team.ilike.${query.team}`);
  }

  const { data, error } = await q;
  if (error) throw new Error(`fetchHighlight failed: ${error.message}`);

  const rows = (data ?? []) as KudoAggregateRow[];
  const lookup = await loadChildren(
    supabase,
    rows.map((r) => r.id),
  );
  return rows.map((r) => toKudo(r, lookup));
}

export async function fetchHashtags(): Promise<readonly KudoFilterOption[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('kudo_hashtags')
    .select('tag')
    .order('tag', { ascending: true });
  if (error) throw new Error(`fetchHashtags failed: ${error.message}`);

  const distinct = new Set<string>();
  for (const row of (data ?? []) as { tag: string }[]) distinct.add(row.tag);
  return [...distinct].map((tag) => ({ value: tag, label: `#${tag}` }));
}

export async function fetchDepartments(): Promise<readonly KudoFilterOption[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('users').select('team').not('team', 'is', null);
  if (error) throw new Error(`fetchDepartments failed: ${error.message}`);

  const distinct = new Set<string>();
  for (const row of (data ?? []) as { team: string | null }[]) {
    if (row.team) distinct.add(row.team);
  }
  return [...distinct]
    .sort((a, b) => a.localeCompare(b))
    .map((team) => ({ value: team.toLowerCase(), label: team }));
}

export async function fetchSpotlight(): Promise<{
  readonly recipients: readonly SpotlightRecipient[];
  readonly total: number;
}> {
  const supabase = await createServerClient();
  const [{ data: rows, error }, { count, error: countErr }] = await Promise.all([
    supabase
      .from('kudo_spotlight')
      .select('user_id, display_name, kudos_count, last_received_at, last_kudo_id')
      .order('kudos_count', { ascending: false })
      .limit(200),
    supabase.from('kudos').select('*', { count: 'exact', head: true }),
  ]);

  if (error) throw new Error(`fetchSpotlight failed: ${error.message}`);
  if (countErr) throw new Error(`fetchSpotlight count failed: ${countErr.message}`);

  return {
    recipients: (rows ?? []).map((r: SpotlightRow) => ({
      userId: r.user_id,
      displayName: r.display_name ?? '',
      kudosCount: r.kudos_count,
      lastReceivedAt: r.last_received_at,
      lastKudoId: r.last_kudo_id,
    })),
    total: count ?? 0,
  };
}

type SpotlightRow = {
  user_id: string;
  display_name: string | null;
  kudos_count: number;
  last_received_at: string;
  last_kudo_id: string;
};

// -----------------------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------------------

async function fetchKudoIdsByHashtag(supabase: SupabaseClient, hashtag: string): Promise<string[]> {
  const { data, error } = await supabase.from('kudo_hashtags').select('kudo_id').eq('tag', hashtag);
  if (error) throw new Error(`fetchKudoIdsByHashtag failed: ${error.message}`);
  return ((data ?? []) as { kudo_id: string }[]).map((row) => row.kudo_id);
}

async function loadChildren(
  supabase: SupabaseClient,
  kudoIds: readonly string[],
): Promise<ChildLookup> {
  const hashtagsByKudo = new Map<string, string[]>();
  const imagesByKudo = new Map<string, string[]>();
  const likedKudoIds = new Set<string>();

  if (kudoIds.length === 0) return { hashtagsByKudo, imagesByKudo, likedKudoIds };

  const idList = kudoIds as string[];

  const [hashtagsRes, imagesRes, viewerLikesRes] = await Promise.all([
    supabase
      .from('kudo_hashtags')
      .select('kudo_id, tag, position')
      .in('kudo_id', idList)
      .order('position', { ascending: true }),
    supabase
      .from('kudo_images')
      .select('kudo_id, url, position')
      .in('kudo_id', idList)
      .order('position', { ascending: true }),
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return { data: [] as { kudo_id: string }[] };
      return supabase
        .from('kudo_likes')
        .select('kudo_id')
        .eq('user_id', user.id)
        .in('kudo_id', idList);
    }),
  ]);

  if (hashtagsRes.error) {
    throw new Error(`loadChildren hashtags failed: ${hashtagsRes.error.message}`);
  }
  if (imagesRes.error) {
    throw new Error(`loadChildren images failed: ${imagesRes.error.message}`);
  }

  for (const row of (hashtagsRes.data ?? []) as { kudo_id: string; tag: string }[]) {
    const arr = hashtagsByKudo.get(row.kudo_id) ?? [];
    arr.push(row.tag);
    hashtagsByKudo.set(row.kudo_id, arr);
  }
  for (const row of (imagesRes.data ?? []) as { kudo_id: string; url: string }[]) {
    const arr = imagesByKudo.get(row.kudo_id) ?? [];
    arr.push(row.url);
    imagesByKudo.set(row.kudo_id, arr);
  }
  for (const row of (viewerLikesRes.data ?? []) as { kudo_id: string }[]) {
    likedKudoIds.add(row.kudo_id);
  }

  return { hashtagsByKudo, imagesByKudo, likedKudoIds };
}

function toKudo(row: KudoAggregateRow, lookup: ChildLookup): Kudo {
  return {
    id: row.id,
    sender: toUser(row, 'sender'),
    recipient: toUser(row, 'recipient'),
    title: row.title,
    body: row.body,
    hashtags: lookup.hashtagsByKudo.get(row.id) ?? [],
    imageUrls: lookup.imagesByKudo.get(row.id) ?? [],
    heartsCount: row.hearts_count,
    viewerHasLiked: lookup.likedKudoIds.has(row.id),
    createdAt: row.created_at,
  };
}

function toUser(row: KudoAggregateRow, side: 'sender' | 'recipient'): KudoUserSummary {
  return {
    id: row[`${side}_id`],
    displayName: row[`${side}_display_name`] ?? '',
    team: row[`${side}_team`] ?? '',
    badge: row[`${side}_badge`],
    heartsReceived: row[`${side}_hearts_received`],
    avatarUrl: row[`${side}_avatar_url`],
  };
}

interface Cursor {
  createdAt: string;
  id: string;
}

function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c), 'utf-8').toString('base64url');
}

function decodeCursor(raw: string): Cursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf-8'));
    if (typeof parsed?.createdAt === 'string' && typeof parsed?.id === 'string') {
      return parsed as Cursor;
    }
    return null;
  } catch {
    return null;
  }
}
