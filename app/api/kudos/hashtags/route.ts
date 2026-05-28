import { NextResponse } from 'next/server';
import { fetchHashtags } from '@/lib/kudos/server/feed';

/** GET /api/kudos/hashtags — distinct hashtag tokens for the filter dropdown (US4). */
export async function GET() {
  const items = await fetchHashtags();
  return NextResponse.json({ items });
}
