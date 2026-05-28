'use client';

import { useTranslations } from 'next-intl';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/atoms/KudoIcons';

const arrowClass =
  'inline-flex h-12 w-12 items-center justify-center rounded-full border border-hero-foreground/30 text-hero-foreground transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40';

interface CarouselArrowProps {
  direction: 'prev' | 'next';
  disabled: boolean;
  onClick: () => void;
}

/**
 * Single arrow button — Figma `B.2.1_Button lùi` (prev) and
 * `B.2.2_Button tiến` (next). Used independently so each can be placed on
 * its own side of the HIGHLIGHT KUDOS carousel.
 */
export function CarouselArrow({ direction, disabled, onClick }: CarouselArrowProps) {
  const t = useTranslations('kudos.live.highlight.carousel');
  const Icon = direction === 'prev' ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'prev' ? t('previousAriaLabel') : t('nextAriaLabel')}
      aria-disabled={disabled}
      className={arrowClass}
    >
      <Icon className="h-6 w-6" />
    </button>
  );
}

interface CarouselIndicatorProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * Page indicator with prev/next arrows below the carousel — Figma
 * `B.5_slide` (B.5.1_Button lùi + B.5.2_số trang + B.5.3_Button tiến).
 */
export function CarouselIndicator({ current, total, onPrev, onNext }: CarouselIndicatorProps) {
  const t = useTranslations('kudos.live.highlight.carousel');
  const atStart = current <= 1;
  const atEnd = current >= total;
  return (
    <div className="flex items-center justify-center gap-4 text-hero-foreground">
      <CarouselArrow direction="prev" disabled={atStart} onClick={onPrev} />
      <span className="text-2xl font-bold tabular-nums">{t('page', { current, total })}</span>
      <CarouselArrow direction="next" disabled={atEnd} onClick={onNext} />
    </div>
  );
}
