import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowRightIcon, ChevronLeftIcon } from '@/components/atoms/KudoIcons';
import { CopyLinkButton } from '@/components/molecules/kudos-board/CopyLinkButton';
import { HashtagChip } from '@/components/molecules/kudos-board/HashtagChip';
import { HeartButton } from '@/components/molecules/kudos-board/HeartButton';
import { UserChip } from '@/components/molecules/kudos-board/UserChip';
import { AppFooter } from '@/components/organisms/AppFooter';
import { HomepageHeader } from '@/components/organisms/homepage/HomepageHeader';
import { defaultLocale, isLocale } from '@/lib/i18n/config';
import { fetchKudoById } from '@/lib/kudos/server/feed';
import { logger } from '@/lib/logger';
import { getUnreadCount } from '@/lib/notifications/actions';
import { ROUTES } from '@/lib/routes';
import { getCurrentUserProfile } from '@/lib/users/actions';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  return `${hh}:${mm} - ${dd}/${mo}/${d.getFullYear()}`;
}

export default async function KudoDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!UUID_REGEX.test(id)) notFound();

  const [user, unreadCount, rawLocale, kudo] = await Promise.all([
    getCurrentUserProfile(),
    getUnreadCount(),
    getLocale(),
    fetchKudoById(id).catch((error) => {
      logger.warn('kudos.detail.fetch_failed', {
        kudoId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }),
  ]);

  if (!kudo) notFound();

  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const t = await getTranslations('kudos.detail');
  const isOwn = user?.id === kudo.sender.id;

  return (
    <div className="flex min-h-screen flex-col bg-hero-background text-hero-foreground">
      <HomepageHeader user={user} unreadCount={unreadCount} locale={locale} />

      <main className="flex-1 px-4 py-10 md:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <Link
            href={ROUTES.KUDOS}
            className="mb-6 inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            {t('backToBoard')}
          </Link>

          <article className="flex flex-col gap-5 rounded-(--radius-lg) bg-[#FFF8E1] p-8 text-foreground shadow-xl">
            <header className="flex items-start justify-between gap-3">
              <UserChip user={kudo.sender} />
              <span aria-hidden className="mt-3 text-foreground/40">
                <ArrowRightIcon className="h-5 w-5" />
              </span>
              <UserChip user={kudo.recipient} align="right" />
            </header>

            <div className="text-xs text-foreground/60">{formatDateTime(kudo.createdAt)}</div>

            {kudo.title ? (
              <h1 className="text-center text-base font-bold uppercase tracking-wide text-[#C0392B]">
                {kudo.title}
              </h1>
            ) : null}

            <p className="whitespace-pre-line text-base leading-relaxed text-foreground/90">
              {kudo.body}
            </p>

            {kudo.imageUrls.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {kudo.imageUrls.map((src, i) => (
                  <span
                    key={`${kudo.id}-img-${i}`}
                    className="block aspect-square overflow-hidden rounded-md bg-foreground/10"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={t('imageAlt')} className="h-full w-full object-cover" />
                  </span>
                ))}
              </div>
            ) : null}

            {kudo.hashtags.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {kudo.hashtags.map((tag, i) => (
                  <HashtagChip key={`${kudo.id}-tag-${i}`} tag={tag} />
                ))}
              </div>
            ) : null}

            <footer className="mt-2 flex items-center justify-between gap-3 border-t border-foreground/10 pt-4">
              <HeartButton
                kudoId={kudo.id}
                count={kudo.heartsCount}
                liked={kudo.viewerHasLiked}
                isOwn={isOwn}
                isAuthenticated={user !== null}
              />
              <CopyLinkButton kudoId={kudo.id} />
            </footer>
          </article>
        </div>
      </main>

      <AppFooter variant="homepage" />
    </div>
  );
}
