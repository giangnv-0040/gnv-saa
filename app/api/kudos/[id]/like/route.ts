import { NextResponse } from 'next/server';
import { addLike, removeLike } from '@/lib/kudos/server/likes';
import { KudoIdParamSchema } from '@/lib/kudos/schemas';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** POST /api/kudos/[id]/like — like a kudo (US3 / FR-004). */
export async function POST(_request: Request, ctx: RouteContext) {
  const params = await ctx.params;
  const parsed = KudoIdParamSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await addLike(parsed.data.id);
  return mapResult(result);
}

/** DELETE /api/kudos/[id]/like — unlike a kudo (US3 / FR-004). */
export async function DELETE(_request: Request, ctx: RouteContext) {
  const params = await ctx.params;
  const parsed = KudoIdParamSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await removeLike(parsed.data.id);
  return mapResult(result);
}

function mapResult(result: Awaited<ReturnType<typeof addLike>>): NextResponse {
  switch (result.kind) {
    case 'ok':
      return NextResponse.json({ heartsCount: result.heartsCount });
    case 'unauthenticated':
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    case 'forbidden_self_like':
      return NextResponse.json({ error: 'cannot_like_own_kudo' }, { status: 403 });
    case 'conflict':
      return NextResponse.json({ error: 'already_liked' }, { status: 409 });
    case 'not_found':
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    case 'error':
      return NextResponse.json({ error: result.message }, { status: 500 });
  }
}
