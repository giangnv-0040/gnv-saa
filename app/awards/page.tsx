import { getLocale } from 'next-intl/server';
import { AppFooter } from '@/components/organisms/AppFooter';
import { HomepageHeader } from '@/components/organisms/homepage/HomepageHeader';
import { KudosPromoSection } from '@/components/organisms/homepage/KudosPromoSection';
import { AwardsContentList } from '@/components/organisms/awards/AwardsContentList';
import { AwardsPageTitle } from '@/components/organisms/awards/AwardsPageTitle';
import { AwardsSidebarNav } from '@/components/organisms/awards/AwardsSidebarNav';
import { KeyvisualBanner } from '@/components/organisms/awards/KeyvisualBanner';
import { getCurrentUserProfile } from '@/lib/users/actions';
import { getUnreadCount } from '@/lib/notifications/actions';
import { defaultLocale, isLocale } from '@/lib/i18n/config';

/**
 * Hệ thống giải / Awards Information (frame `zFYDgyj_pD`).
 *
 * Authenticated-only screen — middleware (`isProtectedPath('/awards')`)
 * redirects anonymous visitors to `/login?redirectTo=/awards{hash}`. Per
 * spec Test ID-1.
 *
 * Page content is fully static: `lib/awards/config.ts` + `lib/awards/details.ts`
 * + i18n keys. No runtime API. Sidebar (with scrollspy + deep-link hash
 * handling) ships in US2/US3.
 */
export default async function AwardsPage() {
  const [user, unreadCount, rawLocale] = await Promise.all([
    getCurrentUserProfile(),
    getUnreadCount(),
    getLocale(),
  ]);

  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  return (
    <>
      <HomepageHeader user={user} unreadCount={unreadCount} locale={locale} />

      <div className="bg-hero-background text-hero-foreground">
        <KeyvisualBanner />
        <AwardsPageTitle />

        <main className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-6 py-8 md:px-10 md:py-12 lg:grid-cols-[220px_1fr] lg:gap-14 lg:px-16">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <AwardsSidebarNav />
          </aside>
          <AwardsContentList />
        </main>

        <KudosPromoSection />
        <AppFooter variant="homepage" />
      </div>
    </>
  );
}
