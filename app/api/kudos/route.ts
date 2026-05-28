import { NextResponse } from 'next/server';
import { fetchFeed, fetchHighlight } from '@/lib/kudos/server/feed';
import { FeedQuerySchema, HighlightQuerySchema } from '@/lib/kudos/schemas';

/**
 * GET /api/kudos
 * - sort=newest (default) — cursor-paginated feed for ALL KUDOS (US6 / FR-003).
 * - sort=hearts            — top-N for HIGHLIGHT KUDOS (US1+US4 / FR-002).
 * Query params validated by Zod at the boundary.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const sort = url.searchParams.get('sort') ?? 'newest';

  if (sort === 'hearts') {
    const parsed = HighlightQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const items = await fetchHighlight(parsed.data);
    return NextResponse.json({ items });
  }

  const parsed = FeedQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const page = await fetchFeed(parsed.data);
  return NextResponse.json(page);
}
