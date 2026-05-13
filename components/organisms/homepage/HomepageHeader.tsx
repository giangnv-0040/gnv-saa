import { AppHeader } from '@/components/organisms/AppHeader';
import { LanguageSwitcher } from '@/components/molecules/LanguageSwitcher';
import { HeaderNav } from '@/components/molecules/HeaderNav';
import { NotificationButton } from '@/components/molecules/NotificationButton';
import { ProfileMenu } from '@/components/molecules/ProfileMenu';
import type { Locale } from '@/lib/i18n/config';
import { ROUTES } from '@/lib/routes';
import type { UserProfile } from '@/lib/users/types';

interface HomepageHeaderProps {
  /** Current visitor's profile or `null` for anonymous traffic. */
  user: UserProfile | null;
  /** Unread notification count (0 when anonymous / stub). */
  unreadCount: number;
  /** Current locale for the LanguageSwitcher trigger label. */
  locale: Locale;
}

/**
 * Composes the homepage shell header on top of the shared `AppHeader` slots.
 *
 * - Logo is interactive (`logoHref="/"`) per spec FR-004.
 * - HeaderNav (US6) plugs into the `nav` slot when that user story ships.
 * - The `controls` slot stacks: LanguageSwitcher (always), NotificationButton
 *   (auth-only — FR-019 hides it when anonymous), ProfileMenu (always; its
 *   own internal logic renders anon vs. user vs. admin items).
 */
export function HomepageHeader({ user, unreadCount, locale }: HomepageHeaderProps) {
  return (
    <AppHeader
      logoHref={ROUTES.HOME}
      nav={<HeaderNav />}
      controls={
        <>
          <LanguageSwitcher currentLocale={locale} />
          {user !== null ? <NotificationButton unreadCount={unreadCount} /> : null}
          <ProfileMenu user={user} />
        </>
      }
    />
  );
}
