/**
 * Domain types for the Viết Kudo (write kudos) screen.
 *
 * Persistence is out of scope for this iteration. These types describe the
 * shape the client form produces and the shape consumers (analytics, stub
 * server action) expect.
 */

export interface Recipient {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
  readonly avatarUrl: string | null;
  readonly team: string;
}

export interface HashtagSuggestion {
  readonly slug: string;
  readonly label: string;
}

export interface KudoImage {
  readonly id: string;
  readonly file: File;
  readonly previewUrl: string;
}

export interface WriteKudoFormValues {
  recipientId: string | null;
  title: string;
  body: string;
  hashtags: string[];
  anonymous: boolean;
  images: KudoImage[];
}

export const KUDO_MAX_HASHTAGS = 5;
export const KUDO_MAX_IMAGES = 5;
export const KUDO_TITLE_MAX_LENGTH = 80;
export const KUDO_BODY_MAX_LENGTH = 2000;
