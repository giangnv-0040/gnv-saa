import { createServerClient } from '@/lib/supabase/server';

export type NextUnopenedResult =
  | { kind: 'ok'; boxId: string }
  | { kind: 'unauthenticated' }
  | { kind: 'none' }
  | { kind: 'error'; message: string };

/**
 * Returns the next unopened Secret Box for the current user — used by the
 * sidebar "Mở quà" CTA to open the (out-of-scope) Secret Box dialog with a
 * target id (US12).
 */
export async function fetchNextUnopenedBox(): Promise<NextUnopenedResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { kind: 'unauthenticated' };

  const { data, error } = await supabase
    .from('secret_boxes')
    .select('id')
    .eq('owner_id', user.id)
    .is('opened_at', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) return { kind: 'error', message: error.message };
  if (!data) return { kind: 'none' };
  return { kind: 'ok', boxId: data.id };
}
