import { NextResponse } from 'next/server';
import { fetchSpotlight } from '@/lib/kudos/server/feed';

/** GET /api/kudos/spotlight — word-cloud recipient distribution (US7 / FR-014). */
export async function GET() {
  const data = await fetchSpotlight();
  return NextResponse.json(data);
}
