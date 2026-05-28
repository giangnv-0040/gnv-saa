'use client';

import cloud from 'd3-cloud';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SearchIcon, PanZoomIcon } from '@/components/atoms/KudoIcons';
import { kudoDetailPath } from '@/lib/routes';
import type { SpotlightRecipient } from '@/lib/kudos/types';

interface SpotlightBoardProps {
  recipients: readonly SpotlightRecipient[];
  total: number;
}

const SEARCH_DEBOUNCE_MS = 200;
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 420;
const FONT_MIN = 14;
const FONT_MAX = 64;

const formatLastReceived = (iso: string) => {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  return `${hh}:${mm} - ${dd}/${mo}/${d.getFullYear()}`;
};

interface PlacedWord {
  text: string;
  size: number;
  x: number;
  y: number;
  rotate: number;
  userId: string;
  lastKudoId: string;
  lastReceivedAt: string;
}

/**
 * SPOTLIGHT BOARD — d3-cloud word-cloud layout rendered as plain DOM nodes
 * inside an SVG. We keep DOM (not canvas) so the words remain hover/focus
 * targets and the sr-only fallback list mirrors the same data (TR-005 a11y).
 *
 * - Layout is computed once per recipients change; the most-kudos recipient
 *   gets the largest font, with a log-scaled fall-off.
 * - Hover/focus → tooltip with name + last-received timestamp.
 * - Click → `/kudos/{lastKudoId}` (US7 #5).
 * - Search debounced 200ms, highlights matching nodes.
 * - Pan/zoom toggle scales the viewport when enabled.
 */
export function SpotlightBoard({ recipients, total }: SpotlightBoardProps) {
  const t = useTranslations('kudos.live.spotlight');
  const router = useRouter();
  const [rawQuery, setRawQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [panZoomEnabled, setPanZoomEnabled] = useState(false);
  const [placed, setPlaced] = useState<PlacedWord[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(rawQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [rawQuery]);

  // -- Layout pass: run d3-cloud whenever the recipients set changes ------
  useEffect(() => {
    if (recipients.length === 0) return;

    const counts = recipients.map((r) => r.kudosCount);
    const maxCount = Math.max(...counts);
    const minCount = Math.min(...counts);
    const span = Math.max(1, maxCount - minCount);

    type CloudInput = cloud.Word & {
      text: string;
      size: number;
      userId: string;
      lastKudoId: string;
      lastReceivedAt: string;
    };

    const words: CloudInput[] = recipients.map((r) => {
      const ratio = (r.kudosCount - minCount) / span;
      return {
        text: r.displayName,
        size: FONT_MIN + ratio * (FONT_MAX - FONT_MIN),
        userId: r.userId,
        lastKudoId: r.lastKudoId,
        lastReceivedAt: r.lastReceivedAt,
      };
    });

    const layout = cloud<CloudInput>()
      .size([CANVAS_WIDTH, CANVAS_HEIGHT])
      .words(words)
      .padding(6)
      .rotate(() => 0)
      .font('Montserrat, system-ui, sans-serif')
      .fontSize((d) => d.size)
      .on('end', (placedWords) => {
        const result: PlacedWord[] = placedWords.map((w) => ({
          text: w.text ?? '',
          size: w.size ?? FONT_MIN,
          x: w.x ?? 0,
          y: w.y ?? 0,
          rotate: w.rotate ?? 0,
          userId: w.userId,
          lastKudoId: w.lastKudoId,
          lastReceivedAt: w.lastReceivedAt,
        }));
        setPlaced(result);
      });

    layout.start();
    return () => {
      layout.stop();
    };
  }, [recipients]);

  const matches = useMemo(() => {
    if (!debouncedQuery) return new Set<string>();
    const lower = debouncedQuery.toLowerCase();
    return new Set(
      recipients.filter((r) => r.displayName.toLowerCase().includes(lower)).map((r) => r.userId),
    );
  }, [recipients, debouncedQuery]);

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 text-hero-foreground md:px-10 lg:px-16">
      <header className="text-center">
        <p className="text-sm text-hero-foreground/70">{t('eyebrow')}</p>
        <h2 className="text-3xl font-extrabold uppercase tracking-wider text-[#FFEA9E] md:text-4xl">
          {t('title')}
        </h2>
      </header>

      <div className="relative mt-6 overflow-hidden rounded-2xl border border-hero-foreground/30 bg-[radial-gradient(circle_at_50%_30%,rgba(255,234,158,0.08),transparent_60%)]">
        <div className="flex items-center justify-between gap-3 px-6 pt-6">
          <span className="text-2xl font-extrabold text-[#FFEA9E]">
            {t('count', { count: total })}
          </span>
          <div className="flex items-center gap-2">
            <form
              role="search"
              onSubmit={(e) => e.preventDefault()}
              className="flex items-center gap-2 rounded-full border border-hero-foreground/30 bg-hero-background/60 px-3 py-1.5"
            >
              <SearchIcon className="h-4 w-4 text-hero-foreground/70" />
              <input
                type="search"
                aria-label={t('search.buttonAriaLabel')}
                placeholder={t('search.placeholder')}
                maxLength={100}
                value={rawQuery}
                onChange={(event) => setRawQuery(event.target.value)}
                className="w-32 bg-transparent text-xs font-semibold text-hero-foreground outline-none placeholder:text-hero-foreground/50"
              />
            </form>
            <button
              type="button"
              aria-label={t('panZoomAriaLabel')}
              aria-pressed={panZoomEnabled}
              onClick={() => setPanZoomEnabled((v) => !v)}
              className={[
                'inline-flex h-8 w-8 items-center justify-center rounded-full border border-hero-foreground/30 transition',
                panZoomEnabled
                  ? 'bg-[#FFEA9E] text-foreground'
                  : 'text-hero-foreground hover:bg-white/5',
              ].join(' ')}
            >
              <PanZoomIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={containerRef}
          className="relative mt-2 min-h-[420px] w-full overflow-hidden px-6 pb-12"
        >
          {recipients.length === 0 ? (
            <p className="py-20 text-center text-sm text-hero-foreground/60">{t('empty')}</p>
          ) : placed.length === 0 ? (
            <p className="py-20 text-center text-sm text-hero-foreground/60">{t('loading')}</p>
          ) : (
            <svg
              viewBox={`${-CANVAS_WIDTH / 2} ${-CANVAS_HEIGHT / 2} ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
              role="img"
              aria-label={t('listAriaLabel')}
              className={[
                'block h-[420px] w-full transition-transform duration-300',
                panZoomEnabled ? 'scale-110' : 'scale-100',
              ].join(' ')}
            >
              <g>
                {placed.map((word) => {
                  const isMatch = matches.has(word.userId);
                  const dimmed = debouncedQuery && !isMatch;
                  const cls = isMatch
                    ? 'fill-[#FFEA9E] hover:fill-[#FFE074]'
                    : dimmed
                      ? 'fill-hero-foreground/20 hover:fill-hero-foreground/40'
                      : 'fill-hero-foreground/80 hover:fill-[#FFEA9E]';
                  return (
                    <g
                      key={word.userId}
                      transform={`translate(${word.x},${word.y}) rotate(${word.rotate})`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => router.push(kudoDetailPath(word.lastKudoId))}
                    >
                      <title>
                        {t('tooltip', {
                          name: word.text,
                          time: formatLastReceived(word.lastReceivedAt),
                        })}
                      </title>
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontFamily="Montserrat, system-ui, sans-serif"
                        fontWeight={700}
                        fontSize={word.size}
                        className={`transition ${cls}`}
                      >
                        {word.text}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          )}
        </div>

        <ul className="sr-only" aria-label={t('listAriaLabel')}>
          {recipients.map((r) => (
            <li key={`sr-${r.userId}`}>
              <Link href={kudoDetailPath(r.lastKudoId)}>
                {t('listItem', {
                  name: r.displayName,
                  count: r.kudosCount,
                  time: formatLastReceived(r.lastReceivedAt),
                })}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
