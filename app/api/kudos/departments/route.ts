import { NextResponse } from 'next/server';
import { fetchDepartments } from '@/lib/kudos/server/feed';

/** GET /api/kudos/departments — distinct user teams for the filter dropdown (US4). */
export async function GET() {
  const items = await fetchDepartments();
  return NextResponse.json({ items });
}
