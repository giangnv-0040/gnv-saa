'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CarouselArrow,
  CarouselIndicator,
} from '@/components/molecules/kudos-board/CarouselArrows';
import { FilterDropdown } from '@/components/molecules/kudos-board/FilterDropdown';
import { KudoCard } from '@/components/molecules/kudos-board/KudoCard';
import {
  useDepartmentOptions,
  useHashtagOptions,
} from '@/lib/kudos/queries/useHashtagsAndDepartments';
import { useHighlightKudos } from '@/lib/kudos/queries/useHighlightKudos';
import type { Kudo, KudoFilterOption } from '@/lib/kudos/types';

interface HighlightCarouselProps {
  /** Server-rendered first batch — Top 5 by hearts (US1). */
  initial?: readonly Kudo[];
  hashtagOptions?: readonly KudoFilterOption[];
  departmentOptions?: readonly KudoFilterOption[];
  viewerId?: string | null;
}

/**
 * HIGHLIGHT KUDOS — carousel + filters. Filter changes trigger a refetch of
 * `GET /api/kudos?sort=hearts&limit=5&hashtag=&team=` via TanStack Query.
 */
export function HighlightCarousel({
  initial,
  hashtagOptions: initialHashtags,
  departmentOptions: initialDepartments,
  viewerId = null,
}: HighlightCarouselProps) {
  const t = useTranslations('kudos.live.highlight');
  const tFilters = useTranslations('kudos.live.highlight.filters');

  const [hashtag, setHashtag] = useState<string | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  const { data: hashtagOptions } = useHashtagOptions(initialHashtags);
  const { data: departmentOptions } = useDepartmentOptions(initialDepartments);
  const { data: items } = useHighlightKudos({
    hashtag,
    team: department,
    initial: !hashtag && !department ? initial : undefined,
  });

  const filtered = useMemo(() => items ?? [], [items]);

  const total = filtered.length;
  const current = total === 0 ? 0 : Math.min(index, total - 1) + 1;

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 text-hero-foreground md:px-10 lg:px-16">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-hero-foreground/70">{t('eyebrow')}</p>
          <h2 className="text-3xl font-extrabold uppercase tracking-wider text-[#FFEA9E] md:text-4xl">
            {t('title')}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <FilterDropdown
            label={tFilters('hashtag')}
            options={hashtagOptions ?? []}
            value={hashtag}
            onChange={(v) => {
              setHashtag(v);
              setIndex(0);
            }}
            clearLabel={tFilters('clear')}
          />
          <FilterDropdown
            label={tFilters('department')}
            options={departmentOptions ?? []}
            value={department}
            onChange={(v) => {
              setDepartment(v);
              setIndex(0);
            }}
            clearLabel={tFilters('clear')}
          />
        </div>
      </header>

      <div className="mt-6">
        {total === 0 ? (
          <p className="rounded-lg border border-dashed border-hero-foreground/30 py-12 text-center text-sm text-hero-foreground/60">
            {t('empty')}
          </p>
        ) : (
          <div className="flex items-stretch gap-4">
            <div className="hidden self-center md:flex">
              <CarouselArrow
                direction="prev"
                disabled={current <= 1}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
              />
            </div>
            <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
              {pickWindow(filtered, index).map((entry) => (
                <div
                  key={`${entry.kudo.id}-${entry.position}`}
                  aria-current={entry.isActive ? 'true' : undefined}
                  // Non-active cards are decorative carousel previews — hide
                  // from a11y tree so the active card is the only focusable
                  // / contrast-checked surface on each slide.
                  aria-hidden={entry.isActive ? undefined : 'true'}
                  inert={entry.isActive ? undefined : true}
                  className={[
                    'transition duration-300',
                    entry.isActive
                      ? 'opacity-100 md:scale-105'
                      : 'pointer-events-none opacity-50 md:scale-90',
                  ].join(' ')}
                >
                  <KudoCard kudo={entry.kudo} variant="highlight" viewerId={viewerId} />
                </div>
              ))}
            </div>
            <div className="hidden self-center md:flex">
              <CarouselArrow
                direction="next"
                disabled={current >= total}
                onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
              />
            </div>
          </div>
        )}
      </div>

      {total > 0 ? (
        <div className="mt-6">
          <CarouselIndicator
            current={current}
            total={total}
            onPrev={() => setIndex((i) => Math.max(0, i - 1))}
            onNext={() => setIndex((i) => Math.min(total - 1, i + 1))}
          />
        </div>
      ) : null}
    </section>
  );
}

interface WindowEntry {
  kudo: Kudo;
  position: number;
  isActive: boolean;
}

/**
 * Returns up to 3 cards centered on the active index: previous (faded),
 * active (prominent), next (faded). At list boundaries the active card
 * sits at the left or right edge instead of the middle.
 */
function pickWindow(kudos: readonly Kudo[], activeIndex: number): readonly WindowEntry[] {
  const n = kudos.length;
  if (n === 0) return [];
  if (n === 1) return [{ kudo: kudos[0]!, position: activeIndex, isActive: true }];

  const items: WindowEntry[] = [];
  if (activeIndex > 0) {
    items.push({
      kudo: kudos[activeIndex - 1]!,
      position: activeIndex - 1,
      isActive: false,
    });
  }
  items.push({ kudo: kudos[activeIndex]!, position: activeIndex, isActive: true });
  if (activeIndex < n - 1) {
    items.push({
      kudo: kudos[activeIndex + 1]!,
      position: activeIndex + 1,
      isActive: false,
    });
  }
  return items;
}
