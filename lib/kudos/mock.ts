import type {
  HashtagSuggestion,
  Kudo,
  KudoFilterOption,
  KudoUserSummary,
  LeaderboardEntry,
  Recipient,
  SpotlightRecipient,
  UserKudoStats,
} from './types';

/**
 * Hard-coded recipient list used by the Viết Kudo form. Replaced by a real
 * `public.users` query in a follow-up iteration (out of scope of the UI ship).
 */
export const MOCK_RECIPIENTS: readonly Recipient[] = [
  {
    id: 'u-nhat',
    displayName: 'Huỳnh Dương Xuân Nhật',
    email: 'nhat.huynh@sun-asterisk.com',
    avatarUrl: null,
    team: 'CEVC3',
  },
  {
    id: 'u-hieu',
    displayName: 'Nguyễn Trung Hiếu',
    email: 'hieu.nguyen@sun-asterisk.com',
    avatarUrl: null,
    team: 'CEVC1',
  },
  {
    id: 'u-linh',
    displayName: 'Trần Mỹ Linh',
    email: 'linh.tran@sun-asterisk.com',
    avatarUrl: null,
    team: 'BizDev',
  },
  {
    id: 'u-phuc',
    displayName: 'Lê Hồng Phúc',
    email: 'phuc.le@sun-asterisk.com',
    avatarUrl: null,
    team: 'Design',
  },
  {
    id: 'u-an',
    displayName: 'Phạm Hoài An',
    email: 'an.pham@sun-asterisk.com',
    avatarUrl: null,
    team: 'QA',
  },
  {
    id: 'u-thao',
    displayName: 'Đặng Phương Thảo',
    email: 'thao.dang@sun-asterisk.com',
    avatarUrl: null,
    team: 'HR',
  },
  {
    id: 'u-khoa',
    displayName: 'Vũ Anh Khoa',
    email: 'khoa.vu@sun-asterisk.com',
    avatarUrl: null,
    team: 'Mobile',
  },
];

/**
 * Curated hashtag suggestions. Order matters — surfaces team-favorite tags
 * first. Slugs are stable; labels flow through i18n if/when translated.
 */
export const HASHTAG_SUGGESTIONS: readonly HashtagSuggestion[] = [
  { slug: 'teamwork', label: '#TeamWork' },
  { slug: 'rootfurther', label: '#RootFurther' },
  { slug: 'innovation', label: '#Innovation' },
  { slug: 'customer-first', label: '#CustomerFirst' },
  { slug: 'mentor', label: '#Mentor' },
  { slug: 'go-extra-mile', label: '#GoExtraMile' },
  { slug: 'problem-solver', label: '#ProblemSolver' },
  { slug: 'kindness', label: '#Kindness' },
  { slug: 'craftsmanship', label: '#Craftsmanship' },
  { slug: 'ownership', label: '#Ownership' },
];

export function findRecipient(id: string | null): Recipient | null {
  if (!id) return null;
  return MOCK_RECIPIENTS.find((r) => r.id === id) ?? null;
}

export function findHashtagLabel(slug: string): string {
  return HASHTAG_SUGGESTIONS.find((h) => h.slug === slug)?.label ?? `#${slug}`;
}

/* ---------------------------------------------------------------------------
 * Live board mock data (`/kudos`)
 *
 * UI-shell fixtures for `Sun* Kudos - Live board`. Replaces the placeholder
 * `ComingSoon` page for the duration of the UI iteration. Real data comes
 * online once the migrations + API handlers in plan §Phase 1–4 land.
 * ------------------------------------------------------------------------- */

/**
 * Avatar PNGs downloaded from Figma media nodes (`MM_MEDIA_Avatar`, 64×64).
 * Rotated through users to give variety in the live board mock; production
 * data ships real avatars from `public.users.avatar_url`.
 */
const AVATAR_POOL = [
  '/assets/kudos/avatar-1.png',
  '/assets/kudos/avatar-2.png',
  '/assets/kudos/avatar-3.png',
] as const;

const userSummary = (
  id: string,
  displayName: string,
  team: string,
  badge: string | null = null,
  heartsReceived = 0,
  avatarIdx = 0,
): KudoUserSummary => ({
  id,
  displayName,
  team,
  badge,
  heartsReceived,
  avatarUrl: AVATAR_POOL[avatarIdx % AVATAR_POOL.length]!,
});

const SAMPLE_USERS: readonly KudoUserSummary[] = [
  userSummary('u-nhat', 'Huỳnh Dương Xuân Nhật', 'CEVC10', 'Rising Hero', 24, 0),
  userSummary('u-hieu', 'Nguyễn Trung Hiếu', 'CEVC1', 'Legend Hero', 53, 1),
  userSummary('u-linh', 'Trần Mỹ Linh', 'BizDev', 'New Hero', 8, 2),
  userSummary('u-phuc', 'Lê Hồng Phúc', 'Design', 'Legend Hero', 41, 0),
  userSummary('u-an', 'Phạm Hoài An', 'QA', 'Rising Hero', 19, 1),
  userSummary('u-thao', 'Đặng Phương Thảo', 'HR', null, 6, 2),
  userSummary('u-khoa', 'Vũ Anh Khoa', 'Mobile', 'New Hero', 15, 0),
  userSummary('u-mai', 'Trịnh Minh Mai', 'CEVC3', null, 11, 1),
  userSummary('u-quang', 'Lê Đức Quang', 'CEVC2', 'Rising Hero', 22, 2),
  userSummary('u-nga', 'Phan Thị Nga', 'Marketing', null, 9, 0),
];

function pickUser(idx: number): KudoUserSummary {
  return SAMPLE_USERS[idx % SAMPLE_USERS.length]!;
}

const MOCK_KUDO_BODY =
  'Cám ơn người em bình thường nhưng phi thường :D Cám ơn sự chăm chỉ, cẩn mẫn của em đã tạo động lực rất nhiều cho team, để luôn nhắc mình luôn phải nỗ lực hơn nữa trong công việc. <3 và cuộc sống...';

function makeKudo(
  id: string,
  senderIdx: number,
  recipientIdx: number,
  options: {
    title?: string;
    heartsCount?: number;
    viewerHasLiked?: boolean;
    hashtags?: readonly string[];
    imageUrls?: readonly string[];
    createdAt?: string;
  } = {},
): Kudo {
  return {
    id,
    sender: pickUser(senderIdx),
    recipient: pickUser(recipientIdx),
    title: options.title ?? 'IDOL GIỚI TRẺ',
    body: MOCK_KUDO_BODY,
    hashtags: options.hashtags ?? ['Dedicated', 'Inspring', 'Dedicated', 'Inspring', 'Dedicated'],
    imageUrls: options.imageUrls ?? [],
    heartsCount: options.heartsCount ?? 1000,
    viewerHasLiked: options.viewerHasLiked ?? false,
    createdAt: options.createdAt ?? '2026-05-20T10:00:00.000Z',
  };
}

/** 5 cards in the HIGHLIGHT KUDOS carousel — sorted by hearts descending. */
export const MOCK_HIGHLIGHT_KUDOS: readonly Kudo[] = [
  makeKudo('k-h1', 1, 0, { heartsCount: 1000, viewerHasLiked: true }),
  makeKudo('k-h2', 0, 3, { heartsCount: 980 }),
  makeKudo('k-h3', 3, 1, { heartsCount: 942 }),
  makeKudo('k-h4', 4, 2, { heartsCount: 901 }),
  makeKudo('k-h5', 2, 4, { heartsCount: 870 }),
];

/** Feed of every kudo (newest first). Padding with samples that share copy. */
export const MOCK_FEED_KUDOS: readonly Kudo[] = [
  makeKudo('k-1', 0, 1, {
    heartsCount: 1000,
    viewerHasLiked: true,
    imageUrls: [
      '/assets/kudos/sample-photo.png',
      '/assets/kudos/sample-photo.png',
      '/assets/kudos/sample-photo.png',
      '/assets/kudos/sample-photo.png',
      '/assets/kudos/sample-photo.png',
    ],
  }),
  makeKudo('k-2', 1, 0, {
    heartsCount: 1000,
    viewerHasLiked: true,
    imageUrls: [
      '/assets/kudos/sample-photo.png',
      '/assets/kudos/sample-photo.png',
      '/assets/kudos/sample-photo.png',
      '/assets/kudos/sample-photo.png',
      '/assets/kudos/sample-photo.png',
    ],
  }),
  makeKudo('k-3', 2, 3, {
    heartsCount: 1000,
    imageUrls: [
      '/assets/kudos/sample-photo.png',
      '/assets/kudos/sample-photo.png',
      '/assets/kudos/sample-photo.png',
      '/assets/kudos/sample-photo.png',
      '/assets/kudos/sample-photo.png',
    ],
  }),
  makeKudo('k-4', 4, 6, {
    heartsCount: 1000,
    imageUrls: [
      '/assets/kudos/sample-photo.png',
      '/assets/kudos/sample-photo.png',
      '/assets/kudos/sample-photo.png',
      '/assets/kudos/sample-photo.png',
      '/assets/kudos/sample-photo.png',
    ],
  }),
];

/** Live-sourced filter values — would come from a `GET /api/kudos/{hashtags,departments}` */
export const MOCK_HASHTAG_FILTERS: readonly KudoFilterOption[] = [
  { value: 'dedicated', label: '#Dedicated' },
  { value: 'inspring', label: '#Inspring' },
  { value: 'teamwork', label: '#TeamWork' },
  { value: 'rootfurther', label: '#RootFurther' },
  { value: 'innovation', label: '#Innovation' },
  { value: 'mentor', label: '#Mentor' },
];

export const MOCK_DEPARTMENT_FILTERS: readonly KudoFilterOption[] = [
  { value: 'cevc1', label: 'CEVC1' },
  { value: 'cevc3', label: 'CEVC3' },
  { value: 'cevc10', label: 'CEVC10' },
  { value: 'bizdev', label: 'BizDev' },
  { value: 'design', label: 'Design' },
  { value: 'qa', label: 'QA' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'marketing', label: 'Marketing' },
];

/** Personal counters for the right-hand sidebar (auth viewer). */
export const MOCK_USER_STATS: UserKudoStats = {
  kudosReceived: 25,
  kudosSent: 25,
  heartsReceived: 25,
  secretBoxesOpened: 25,
  secretBoxesUnopened: 25,
};

/** "10 SUNNER NHẬN QUÀ MỚI NHẤT" mini-leaderboard. `note` holds the gift
 * content_id; the client formats the user-visible string via next-intl
 * (FR-018). */
const GIFT_NOTES = [
  'Áo phòng SAA',
  'Mũ SAA',
  'Túi vải SAA',
  'Áo phòng SAA',
  'Bộ stationery SAA',
] as const;

export const MOCK_GIFT_LEADERBOARD: readonly LeaderboardEntry[] = Array.from(
  { length: 5 },
  (_, i) => ({
    userId: `u-leader-${i}`,
    displayName: 'Huỳnh Dương Xuân',
    team: 'CEVC10',
    kind: 'gift' as const,
    note: GIFT_NOTES[i % GIFT_NOTES.length]!,
    avatarUrl: AVATAR_POOL[i % AVATAR_POOL.length]!,
  }),
);

/** "10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT" mini-leaderboard. `note` holds the
 * badge name; client formats "Promoted to {badge}" via next-intl. */
const RANK_BADGES = [
  'Legend Hero',
  'Rising Hero',
  'New Hero',
  'Rising Hero',
  'Legend Hero',
] as const;

export const MOCK_RANK_LEADERBOARD: readonly LeaderboardEntry[] = Array.from(
  { length: 5 },
  (_, i) => ({
    userId: `u-rank-${i}`,
    displayName: SAMPLE_USERS[i % SAMPLE_USERS.length]!.displayName,
    team: SAMPLE_USERS[i % SAMPLE_USERS.length]!.team,
    kind: 'rank-promotion' as const,
    note: RANK_BADGES[i % RANK_BADGES.length]!,
    avatarUrl: AVATAR_POOL[i % AVATAR_POOL.length]!,
  }),
);

/** "Spotlight" board — top recipients by kudo count. */
export const MOCK_SPOTLIGHT_RECIPIENTS: readonly SpotlightRecipient[] = SAMPLE_USERS.map(
  (u, i) => ({
    userId: u.id,
    displayName: u.displayName,
    kudosCount: 30 - i * 2,
    lastReceivedAt: '2026-05-19T08:30:00.000Z',
    lastKudoId: `k-spotlight-${u.id}`,
  }),
);

export const MOCK_SPOTLIGHT_TOTAL = 388;

/**
 * The current viewer in the mock world. Used to derive `isOwn` for the
 * HeartButton (FR-005) until a real auth context is wired into the live
 * board. Setting it to `u-nhat` means the viewer authored kudos whose
 * sender = u-nhat (e.g. `k-1`, `k-h2` in the fixtures), so the heart on
 * those cards is disabled.
 */
export const MOCK_VIEWER_ID = 'u-nhat';

/** Helper for the page composition. */
export const LIVE_BOARD_MOCK = {
  highlight: MOCK_HIGHLIGHT_KUDOS,
  feed: MOCK_FEED_KUDOS,
  hashtags: MOCK_HASHTAG_FILTERS,
  departments: MOCK_DEPARTMENT_FILTERS,
  stats: MOCK_USER_STATS,
  giftLeaderboard: MOCK_GIFT_LEADERBOARD,
  rankLeaderboard: MOCK_RANK_LEADERBOARD,
  spotlight: MOCK_SPOTLIGHT_RECIPIENTS,
  spotlightTotal: MOCK_SPOTLIGHT_TOTAL,
  viewerId: MOCK_VIEWER_ID,
} as const;
