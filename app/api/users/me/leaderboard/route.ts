import { NextResponse } from 'next/server';
import { fetchLeaderboard } from '@/lib/kudos/server/stats';
import { LeaderboardQuerySchema } from '@/lib/kudos/schemas';

/**
 * GET /api/users/me/leaderboard?type=rank-promotion|gift-received&limit=10
 * Returns the chosen mini-leaderboard for the live-board sidebar (D.3 / US8).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = LeaderboardQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const items = await fetchLeaderboard(parsed.data.type, parsed.data.limit);
  return NextResponse.json({ items });
}
