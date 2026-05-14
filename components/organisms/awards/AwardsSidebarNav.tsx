'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { awards } from '@/lib/awards/config';
import { AwardsSidebarItem } from './AwardsSidebarItem';

const SLUGS = awards.map((a) => a.slug);
const PROGRAMMATIC_SCROLL_GUARD_MS = 250;

/**
 * Sticky sidebar with 6 nav entries. The only client island on the
 * Awards Information page.
 *
 * Responsibilities:
 * - Click an item → smooth scroll to `#{slug}` + set active + update URL hash.
 * - Scrollspy (IntersectionObserver) → update active as user scrolls past
 *   sections. Suppressed for ~250 ms after a click to avoid a fight with
 *   the click-initiated smooth scroll.
 * - Initial mount → read `window.location.hash`; if it matches a known
 *   slug, set active + scroll to that section. Unknown / empty hash falls
 *   back to the first slug with no scroll (Test ID-13).
 * - Respects `prefers-reduced-motion: reduce` — scroll behaviour becomes
 *   `'instant'`.
 */
export function AwardsSidebarNav() {
  const t = useTranslations('homepage.awards.list');
  const tPage = useTranslations('awardsPage');
  // Read the initial hash synchronously so we don't need setState in an effect.
  const [activeSlug, setActiveSlug] = useState<string>(() => {
    if (typeof window === 'undefined') return SLUGS[0] ?? '';
    const hash = window.location.hash.slice(1);
    return SLUGS.includes(hash) ? hash : (SLUGS[0] ?? '');
  });
  const isProgrammaticScrollRef = useRef<boolean>(false);

  // On mount, if the URL carries a known slug hash, scroll the matching
  // section into view. The active state was already set by the lazy
  // useState initializer above.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash || !SLUGS.includes(hash)) return;
    const target = document.getElementById(hash);
    if (!target) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    isProgrammaticScrollRef.current = true;
    target.scrollIntoView({
      behavior: prefersReduced ? 'instant' : 'smooth',
      block: 'start',
    });
    window.setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, PROGRAMMATIC_SCROLL_GUARD_MS);
  }, []);

  // Scrollspy — keeps `activeSlug` in sync with whichever section is in
  // the viewport. Suppressed during programmatic scroll.
  useEffect(() => {
    const sections = SLUGS.map((slug) => document.getElementById(slug)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollRef.current) return;
        // Pick the entry closest to the top of the viewport that's
        // currently intersecting. If none intersect, leave state as-is.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length === 0) return;
        const topId = visible[0].target.id;
        if (topId && SLUGS.includes(topId)) setActiveSlug(topId);
      },
      {
        // Trigger when the section's top is in the upper 40% of the viewport.
        rootMargin: '-20% 0px -40% 0px',
        threshold: 0,
      },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const handleClick = useCallback((slug: string) => {
    const target = document.getElementById(slug);
    if (!target) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    isProgrammaticScrollRef.current = true;
    setActiveSlug(slug);
    target.scrollIntoView({
      behavior: prefersReduced ? 'instant' : 'smooth',
      block: 'start',
    });
    if (typeof window.history.replaceState === 'function') {
      window.history.replaceState(null, '', `#${slug}`);
    }
    window.setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, PROGRAMMATIC_SCROLL_GUARD_MS);
  }, []);

  return (
    <nav aria-label={tPage('sidebarAriaLabel')} className="flex flex-col gap-1">
      {awards.map((award) => (
        <AwardsSidebarItem
          key={award.slug}
          slug={award.slug}
          label={t(`${slugToKey(award.slug)}.title`)}
          isActive={award.slug === activeSlug}
          onClick={handleClick}
        />
      ))}
    </nav>
  );
}

// Maps award slugs (kebab-case) to their i18n key segment (camelCase).
// The i18n keys live under `homepage.awards.list.<camelCaseKey>.title`.
function slugToKey(slug: string): string {
  switch (slug) {
    case 'top-talent':
      return 'topTalent';
    case 'top-project':
      return 'topProject';
    case 'top-project-leader':
      return 'topProjectLeader';
    case 'best-manager':
      return 'bestManager';
    case 'signature-2025-creator':
      return 'signature2025Creator';
    case 'mvp':
      return 'mvp';
    default:
      return slug;
  }
}
