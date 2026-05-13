import type { Award } from './types';

/**
 * The 6 SAA 2025 award categories, in the order they appear on Homepage SAA.
 * Slugs are stable kebab-case identifiers and MUST match the anchors on the
 * Awards Information page (`/awards#{slug}`).
 *
 * Asset paths point to artwork downloaded at Phase 0 (see asset-manifest.md).
 * The shared `award-bg.png` background is composed by `AwardCard` at render
 * time; each entry below references only its per-award name image.
 */
export const awards: readonly Award[] = [
  {
    slug: 'top-talent',
    titleKey: 'homepage.awards.list.topTalent.title',
    descriptionKey: 'homepage.awards.list.topTalent.description',
    nameImage: '/assets/homepage/awards/top-talent-name.png',
  },
  {
    slug: 'top-project',
    titleKey: 'homepage.awards.list.topProject.title',
    descriptionKey: 'homepage.awards.list.topProject.description',
    nameImage: '/assets/homepage/awards/top-project-name.png',
  },
  {
    slug: 'top-project-leader',
    titleKey: 'homepage.awards.list.topProjectLeader.title',
    descriptionKey: 'homepage.awards.list.topProjectLeader.description',
    nameImage: '/assets/homepage/awards/top-project-leader-name.png',
  },
  {
    slug: 'best-manager',
    titleKey: 'homepage.awards.list.bestManager.title',
    descriptionKey: 'homepage.awards.list.bestManager.description',
    nameImage: '/assets/homepage/awards/best-manager-name.png',
  },
  {
    slug: 'signature-2025-creator',
    titleKey: 'homepage.awards.list.signature2025Creator.title',
    descriptionKey: 'homepage.awards.list.signature2025Creator.description',
    nameImage: '/assets/homepage/awards/signature-2025-creator-name.png',
  },
  {
    slug: 'mvp',
    titleKey: 'homepage.awards.list.mvp.title',
    descriptionKey: 'homepage.awards.list.mvp.description',
    nameImage: '/assets/homepage/awards/mvp-name.png',
  },
] as const;

/** Shared background artwork applied to every award card. */
export const AWARD_BACKGROUND_IMAGE = '/assets/homepage/awards/award-bg.png';
