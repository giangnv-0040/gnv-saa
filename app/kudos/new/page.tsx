import { getLocale } from 'next-intl/server';
import { AppFooter } from '@/components/organisms/AppFooter';
import { HomepageHeader } from '@/components/organisms/homepage/HomepageHeader';
import { WriteKudoBackground } from '@/components/organisms/kudos/WriteKudoBackground';
import { WriteKudoPanel } from '@/components/organisms/kudos/WriteKudoPanel';
import { defaultLocale, isLocale } from '@/lib/i18n/config';
import { MOCK_RECIPIENTS } from '@/lib/kudos/mock';
import { fetchRecipients } from '@/lib/kudos/server/recipients';
import { logger } from '@/lib/logger';
import { getUnreadCount } from '@/lib/notifications/actions';
import { getCurrentUserProfile } from '@/lib/users/actions';

/**
 * Viết Kudo (frame `ihQ26W78P2`).
 *
 * Authenticated-only screen — middleware (`isProtectedPath('/kudos/new')`)
 * redirects anonymous visitors to `/login?redirectTo=/kudos/new`.
 *
 * Layout: full-bleed homepage hero artwork sits behind a dark mask; the
 * cream "Viết KUDO" composition panel floats over it. Shared
 * HomepageHeader + AppFooter wrap the panel so the user can still navigate
 * away if they change their mind without submitting.
 */
export default async function WriteKudoPage() {
  const [user, unreadCount, rawLocale] = await Promise.all([
    getCurrentUserProfile(),
    getUnreadCount(),
    getLocale(),
  ]);

  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  let recipients;
  try {
    recipients = await fetchRecipients();
  } catch (error) {
    logger.warn('kudos.new.recipients_fallback_to_mock', {
      error: error instanceof Error ? error.message : String(error),
    });
    recipients = MOCK_RECIPIENTS;
  }

  return (
    <>
      <WriteKudoBackground />
      <div className="relative z-10 flex min-h-screen flex-col text-hero-foreground">
        <HomepageHeader user={user} unreadCount={unreadCount} locale={locale} />
        <main className="flex flex-1 flex-col items-center justify-start px-4 pb-16 pt-6 md:px-8">
          <WriteKudoPanel recipients={recipients} />
        </main>
        <AppFooter variant="homepage" />
      </div>
    </>
  );
}
