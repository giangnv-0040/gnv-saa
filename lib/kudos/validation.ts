import { z } from 'zod';
import {
  KUDO_BODY_MAX_LENGTH,
  KUDO_MAX_HASHTAGS,
  KUDO_MAX_IMAGES,
  KUDO_TITLE_MAX_LENGTH,
} from './types';

/**
 * Client-side schema for the Viết Kudo form. The `images` field is validated
 * separately because `File` is not safely transferable through Zod without a
 * runtime check; we only validate the count here.
 */
export const writeKudoSchema = z.object({
  recipientId: z.string().min(1, { message: 'recipientRequired' }),
  title: z.string().trim().max(KUDO_TITLE_MAX_LENGTH, { message: 'titleTooLong' }).optional(),
  body: z
    .string()
    .trim()
    .min(1, { message: 'bodyRequired' })
    .max(KUDO_BODY_MAX_LENGTH, { message: 'bodyTooLong' }),
  hashtags: z
    .array(z.string().trim().min(1))
    .min(1, { message: 'hashtagRequired' })
    .max(KUDO_MAX_HASHTAGS, { message: 'hashtagTooMany' }),
  imagesCount: z.number().int().min(0).max(KUDO_MAX_IMAGES, { message: 'imagesTooMany' }),
  anonymous: z.boolean(),
});

export type WriteKudoSchemaInput = z.input<typeof writeKudoSchema>;
export type WriteKudoSchemaOutput = z.output<typeof writeKudoSchema>;

export type WriteKudoErrorCode =
  | 'recipientRequired'
  | 'bodyRequired'
  | 'bodyTooLong'
  | 'titleTooLong'
  | 'hashtagRequired'
  | 'hashtagTooMany'
  | 'imagesTooMany';

export interface WriteKudoFieldErrors {
  recipientId?: WriteKudoErrorCode;
  title?: WriteKudoErrorCode;
  body?: WriteKudoErrorCode;
  hashtags?: WriteKudoErrorCode;
  images?: WriteKudoErrorCode;
}

/**
 * Run the schema against a partial form and return a flat error map keyed by
 * field name. Returns `null` when the form is valid.
 */
export function validateWriteKudo(input: WriteKudoSchemaInput): WriteKudoFieldErrors | null {
  const parsed = writeKudoSchema.safeParse(input);
  if (parsed.success) return null;

  const errors: WriteKudoFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const code = issue.message as WriteKudoErrorCode;
    const path = issue.path[0];
    if (path === 'recipientId') errors.recipientId = code;
    else if (path === 'title') errors.title = code;
    else if (path === 'body') errors.body = code;
    else if (path === 'hashtags') errors.hashtags = code;
    else if (path === 'imagesCount') errors.images = code;
  }
  return Object.keys(errors).length === 0 ? null : errors;
}
