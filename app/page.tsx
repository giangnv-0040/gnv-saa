import { getLocale } from 'next-intl/server';
import { AppFooter } from '@/components/organisms/AppFooter';
import { AwardsGridSection } from '@/components/organisms/homepage/AwardsGridSection';
import { HeroSection } from '@/components/organisms/homepage/HeroSection';
import { HomepageHeader } from '@/components/organisms/homepage/HomepageHeader';
import { KudosPromoSection } from '@/components/organisms/homepage/KudosPromoSection';
import { QuickActionWidget } from '@/components/organisms/homepage/QuickActionWidget';
import { getCurrentUserProfile } from '@/lib/users/actions';
import { getUnreadCount } from '@/lib/notifications/actions';
import { defaultLocale, isLocale } from '@/lib/i18n/config';

/**
 * Homepage SAA (frame `i87tDx10uM`).
 *
 * Public landing page. Anonymous visitors are welcome (middleware no longer
 * redirects `/` to `/login`). Per-user data is fetched in this Server
 * Component and threaded down to the header / sections.
 *
 * US6 will plug HeaderNav into HomepageHeader's `nav` slot.
 */
export default async function HomePage() {
  const [user, unreadCount, rawLocale] = await Promise.all([
    getCurrentUserProfile(),
    getUnreadCount(),
    getLocale(),
  ]);

  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  return (
    <>
      <HomepageHeader user={user} unreadCount={unreadCount} locale={locale} />

      <HeroSection />

      {/* Everything below the hero shares the dark navy theme — awards
          grid, Sun* Kudos promo, and the homepage footer. The Hero section
          already supplies its own bg art + gradient fade, so this wrapper
          starts where the gradient lands. */}
      <div className="bg-hero-background text-hero-foreground">
        <AwardsGridSection />
        <KudosPromoSection />
        <AppFooter variant="homepage" />
      </div>

      <QuickActionWidget />
    </>
  );
}
