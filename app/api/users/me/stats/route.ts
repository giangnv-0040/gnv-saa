import { NextResponse } from 'next/server';
import { fetchMyStats } from '@/lib/kudos/server/stats';

/** GET /api/users/me/stats — personal counters for the live-board sidebar (US8). */
export async function GET() {
  const stats = await fetchMyStats();
  if (!stats) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  return NextResponse.json({ stats });
}
