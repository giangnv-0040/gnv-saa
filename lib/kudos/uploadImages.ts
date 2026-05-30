'use client';

import { createBrowserClient } from '@/lib/supabase/client';
import type { KudoImage } from './types';

const BUCKET = 'kudo-images';

export type UploadImagesResult =
  | { ok: true; urls: string[] }
  | { ok: false; code: 'unauthenticated' | 'upload_failed'; message?: string };

/**
 * Uploads each picked image to the `kudo-images` Supabase Storage bucket
 * under the current user's folder, returning the public URLs in the same
 * order. Called from the Viết Kudo form right before `submitKudoAction` —
 * the resulting URLs are persisted by the server action into
 * `public.kudo_images`.
 *
 * No-op when `images` is empty (returns `{ ok: true, urls: [] }`).
 */
export async function uploadKudoImages(images: KudoImage[]): Promise<UploadImagesResult> {
  if (images.length === 0) return { ok: true, urls: [] };

  const supabase = createBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, code: 'unauthenticated' };

  const urls: string[] = [];
  for (const image of images) {
    const ext = extensionFromFile(image.file);
    const path = `${user.id}/${crypto.randomUUID()}${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, image.file, {
      contentType: image.file.type || undefined,
      upsert: false,
    });
    if (error) {
      return { ok: false, code: 'upload_failed', message: error.message };
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return { ok: true, urls };
}

function extensionFromFile(file: File): string {
  const fromName = file.name.match(/\.[a-zA-Z0-9]+$/)?.[0];
  if (fromName) return fromName.toLowerCase();

  switch (file.type) {
    case 'image/png':
      return '.png';
    case 'image/jpeg':
      return '.jpg';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    default:
      return '';
  }
}
