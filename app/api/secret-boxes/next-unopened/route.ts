import { NextResponse } from 'next/server';
import { fetchNextUnopenedBox } from '@/lib/kudos/server/secret-boxes';

/**
 * GET /api/secret-boxes/next-unopened — returns the id of the next unopened
 * box for the current viewer (US12 / D.1.8). Used by the sidebar "Mở quà"
 * CTA to know which box to hand off to the Secret Box dialog.
 */
export async function GET() {
  const result = await fetchNextUnopenedBox();
  switch (result.kind) {
    case 'ok':
      return NextResponse.json({ boxId: result.boxId });
    case 'unauthenticated':
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    case 'none':
      return NextResponse.json({ boxId: null });
    case 'error':
      return NextResponse.json({ error: result.message }, { status: 500 });
  }
}
