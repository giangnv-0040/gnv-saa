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

/**
 * Domain types for the Sun* Kudos - Live board (`/kudos`).
 *
 * `Kudo` is the canonical persisted shape; the rest support sidebar
 * stats / leaderboards / spotlight rendering. Backed by mock data in the
 * current iteration — see `lib/kudos/mock.ts` (`LIVE_BOARD_MOCK`).
 */
export interface KudoUserSummary {
  readonly id: string;
  readonly displayName: string;
  readonly team: string;
  readonly badge: string | null;
  readonly heartsReceived: number;
  readonly avatarUrl: string | null;
}

export interface Kudo {
  readonly id: string;
  readonly sender: KudoUserSummary;
  readonly recipient: KudoUserSummary;
  readonly title: string | null;
  readonly body: string;
  readonly hashtags: readonly string[];
  readonly imageUrls: readonly string[];
  readonly heartsCount: number;
  readonly viewerHasLiked: boolean;
  readonly createdAt: string;
}

export interface KudoFilterOption {
  readonly value: string;
  readonly label: string;
}

export interface UserKudoStats {
  readonly kudosReceived: number;
  readonly kudosSent: number;
  readonly heartsReceived: number;
  readonly secretBoxesOpened: number;
  readonly secretBoxesUnopened: number;
}

/**
 * Sidebar leaderboard row. `kind` decides how the client formats the note
 * via next-intl — the server MUST NOT pre-format VN-only strings (FR-018).
 * Payload semantics:
 *  - `gift`: `note` is the gift content_id / SKU.
 *  - `rank-promotion`: `note` is the badge name (e.g. "Legend Hero").
 */
export interface LeaderboardEntry {
  readonly userId: string;
  readonly displayName: string;
  readonly team: string;
  readonly kind: 'gift' | 'rank-promotion';
  readonly note: string;
  readonly avatarUrl: string | null;
}

export interface SpotlightRecipient {
  readonly userId: string;
  readonly displayName: string;
  readonly kudosCount: number;
  readonly lastReceivedAt: string;
  readonly lastKudoId: string;
}
