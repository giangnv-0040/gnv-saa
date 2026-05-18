'use server';

import { logger } from '@/lib/logger';
import { writeKudoSchema, type WriteKudoFieldErrors } from './validation';

export interface SubmitKudoPayload {
  recipientId: string;
  title: string;
  body: string;
  hashtags: string[];
  anonymous: boolean;
  imagesCount: number;
}

export type SubmitKudoResult =
  | { ok: true }
  | { ok: false; errors: WriteKudoFieldErrors }
  | { ok: false; serverError: string };

/**
 * Server action stub for posting a Kudo. Real persistence (Supabase) is out
 * of scope of this iteration — we validate, log, and return success so the
 * UI flow is end-to-end testable.
 */
export async function submitKudoAction(payload: SubmitKudoPayload): Promise<SubmitKudoResult> {
  const parsed = writeKudoSchema.safeParse(payload);
  if (!parsed.success) {
    const errors: WriteKudoFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      const code = issue.message as WriteKudoFieldErrors[keyof WriteKudoFieldErrors];
      if (typeof path === 'string' && code) {
        if (path === 'imagesCount') errors.images = code;
        else (errors as Record<string, typeof code>)[path] = code;
      }
    }
    return { ok: false, errors };
  }

  logger.info('kudo.submit.ok', {
    recipientId: parsed.data.recipientId,
    hashtags: parsed.data.hashtags.length,
    images: parsed.data.imagesCount,
    anonymous: parsed.data.anonymous,
  });

  return { ok: true };
}
