import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRightIcon, PencilIcon } from '@/components/atoms/KudoIcons';
import { CopyLinkButton } from './CopyLinkButton';
import { HashtagChip } from './HashtagChip';
import { HeartButton } from './HeartButton';
import { UserChip } from './UserChip';
import type { Kudo } from '@/lib/kudos/types';
import { kudoDetailPath } from '@/lib/routes';

interface KudoCardProps {
  kudo: Kudo;
  variant?: 'highlight' | 'feed';
  /** Viewer id used to derive `isOwn` for the heart button (FR-005). */
  viewerId?: string | null;
}

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  return `${hh}:${mm} - ${dd}/${mo}/${d.getFullYear()}`;
};

/**
 * Single Kudo card. The `highlight` variant ships in the carousel (3-line
 * clamp, "Xem chi tiết" pill); the `feed` variant ships in ALL KUDOS
 * (5-line clamp, image gallery, edit pencil on the right). Both share
 * sender/recipient chips, hashtags and the action bar.
 */
export function KudoCard({ kudo, variant = 'feed', viewerId = null }: KudoCardProps) {
  const t = useTranslations('kudos.live.feed');
  const isHighlight = variant === 'highlight';
  const detailHref = kudoDetailPath(kudo.id);
  const isAuthenticated = viewerId !== null;
  const isOwn = isAuthenticated && kudo.sender.id === viewerId;

  return (
    <article
      className={[
        'flex w-full flex-col gap-3 rounded-(--radius-lg) bg-[#FFF8E1] p-5 text-foreground shadow-lg',
        isHighlight ? 'h-full min-h-[320px]' : '',
      ].join(' ')}
    >
      <header className="flex items-start justify-between gap-3">
        <UserChip user={kudo.sender} />
        <span aria-hidden className="mt-3 text-foreground/40">
          <ArrowRightIcon className="h-5 w-5" />
        </span>
        <UserChip user={kudo.recipient} align="right" />
      </header>

      <div className="flex items-center justify-between text-xs text-foreground/60">
        <span>{formatTime(kudo.createdAt)}</span>
        {!isHighlight ? (
          <Link
            href={detailHref}
            aria-label={t('viewDetailsAriaLabel')}
            className="inline-flex items-center gap-1 text-foreground/60 hover:text-foreground"
          >
            <PencilIcon className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      <Link
        href={detailHref}
        aria-label={t('viewDetailsAriaLabel')}
        className="flex flex-col gap-2 outline-none focus-visible:ring-2 focus-visible:ring-[#D4271D]/40"
      >
        {kudo.title ? (
          <span className="block text-center text-sm font-bold uppercase tracking-wide text-[#C0392B]">
            {kudo.title}
          </span>
        ) : null}

        <span
          className={[
            'block whitespace-pre-line text-sm leading-relaxed text-foreground/90',
            isHighlight ? 'line-clamp-3' : 'line-clamp-5',
          ].join(' ')}
        >
          {kudo.body}
        </span>
      </Link>

      {!isHighlight && kudo.imageUrls.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {kudo.imageUrls.slice(0, 5).map((src, i) => (
            <span
              key={`${kudo.id}-img-${i}`}
              className="block h-16 w-16 overflow-hidden rounded-md bg-foreground/10"
              aria-hidden="true"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {kudo.hashtags.slice(0, 5).map((tag, i) => (
          <HashtagChip key={`${kudo.id}-tag-${i}`} tag={tag} />
        ))}
      </div>

      <footer className="mt-auto flex items-center justify-between gap-3 pt-2">
        <HeartButton
          kudoId={kudo.id}
          count={kudo.heartsCount}
          liked={kudo.viewerHasLiked}
          isOwn={isOwn}
          isAuthenticated={isAuthenticated}
        />
        <div className="flex items-center gap-3">
          <CopyLinkButton kudoId={kudo.id} />
          {isHighlight ? (
            <Link
              href={detailHref}
              className="rounded-full bg-foreground/5 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-foreground/10"
            >
              {t('viewDetails')}
            </Link>
          ) : null}
        </div>
      </footer>
    </article>
  );
}
