import type { HashtagSuggestion, Recipient } from './types';

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
