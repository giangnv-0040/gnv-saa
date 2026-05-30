'use server';

import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import { ROUTES } from '@/lib/routes';
import { createServerClient } from '@/lib/supabase/server';
import { writeKudoSchema, type WriteKudoFieldErrors } from './validation';

export interface SubmitKudoPayload {
  recipientId: string;
  title: string;
  body: string;
  hashtags: string[];
  anonymous: boolean;
  imageUrls: string[];
}

export type SubmitKudoResult =
  | { ok: true }
  | { ok: false; errors: WriteKudoFieldErrors }
  | { ok: false; serverError: string };

/**
 * Persists a Kudo + its hashtags + its image attachments to Supabase. The
 * sender is taken from the Supabase Auth session — never trusted from the
 * payload (RLS also enforces `sender_id = auth.uid()` server-side).
 *
 * Image files are uploaded client-side to the `kudo-images` bucket before
 * this action runs; the caller passes in the resulting public URLs which
 * are then mirrored into `public.kudo_images`.
 *
 * On success the `/kudos` live board is revalidated so the new row shows
 * up after a client redirect.
 */
export async function submitKudoAction(payload: SubmitKudoPayload): Promise<SubmitKudoResult> {
  const parsed = writeKudoSchema.safeParse(payload);
  if (!parsed.success) {
    const errors: WriteKudoFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      const code = issue.message as WriteKudoFieldErrors[keyof WriteKudoFieldErrors];
      if (typeof path === 'string' && code) {
        if (path === 'imageUrls') errors.images = code;
        else (errors as Record<string, typeof code>)[path] = code;
      }
    }
    return { ok: false, errors };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, serverError: 'unauthenticated' };

  if (user.id === parsed.data.recipientId) {
    return { ok: false, errors: { recipientId: 'recipientRequired' } };
  }

  const { data: kudo, error: insertErr } = await supabase
    .from('kudos')
    .insert({
      sender_id: user.id,
      recipient_id: parsed.data.recipientId,
      title: parsed.data.title?.length ? parsed.data.title : null,
      body: parsed.data.body,
      is_anonymous: parsed.data.anonymous,
    })
    .select('id')
    .single();

  if (insertErr || !kudo) {
    logger.error('kudo.submit.insert_failed', {
      userId: user.id,
      error: insertErr?.message,
    });
    return { ok: false, serverError: insertErr?.message ?? 'insert_failed' };
  }

  if (parsed.data.hashtags.length > 0) {
    const rows = parsed.data.hashtags.map((tag, position) => ({
      kudo_id: kudo.id,
      tag: tag.toLowerCase(),
      position,
    }));
    const { error: hashtagErr } = await supabase.from('kudo_hashtags').insert(rows);
    if (hashtagErr) {
      logger.error('kudo.submit.hashtags_failed', {
        kudoId: kudo.id,
        error: hashtagErr.message,
      });
      // The kudo itself was created — surface the issue but don't roll back
      // the row; tags can be re-added later. RLS would block any partial
      // cleanup from the client anyway.
      return { ok: false, serverError: hashtagErr.message };
    }
  }

  if (parsed.data.imageUrls.length > 0) {
    const rows = parsed.data.imageUrls.map((url, position) => ({
      kudo_id: kudo.id,
      url,
      position,
    }));
    const { error: imagesErr } = await supabase.from('kudo_images').insert(rows);
    if (imagesErr) {
      logger.error('kudo.submit.images_failed', {
        kudoId: kudo.id,
        error: imagesErr.message,
      });
      return { ok: false, serverError: imagesErr.message };
    }
  }

  logger.info('kudo.submit.ok', {
    kudoId: kudo.id,
    recipientId: parsed.data.recipientId,
    hashtags: parsed.data.hashtags.length,
    images: parsed.data.imageUrls.length,
    anonymous: parsed.data.anonymous,
  });

  revalidatePath(ROUTES.KUDOS);

  return { ok: true };
}
