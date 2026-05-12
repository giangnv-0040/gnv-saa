'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { localeSchema } from '@/lib/validation/auth';
import { LOCALE_COOKIE_MAX_AGE, LOCALE_COOKIE_NAME } from './config';

/**
 * Persist a locale choice to the `NEXT_LOCALE` cookie. Subsequent requests
 * pick it up in `lib/i18n/request.ts`.
 *
 * Throws if the input is not one of `'vi' | 'en' | 'ja'` — callers are
 * expected to pass a value that already matches the supported set.
 */
export async function setLocale(locale: unknown): Promise<void> {
  const parsed = localeSchema.parse(locale);
  const cookieStore = await cookies();

  cookieStore.set({
    name: LOCALE_COOKIE_NAME,
    value: parsed,
    path: '/',
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false, // readable by the client for optimistic UI hints
  });

  revalidatePath('/', 'layout');
}
