import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ROUTES } from '@/lib/routes';

interface AppFooterProps {
  /**
   * Footer style.
   * - `'login'` (default): minimal — copyright only, no interactive descendants.
   * - `'homepage'`: full layout — logo (left) + 4 nav links (center) + copyright (right).
   *
   * `'mt-auto'` is preserved on both variants so the footer remains pinned to
   * the viewport bottom inside the page flex column (FR-014).
   */
  variant?: 'login' | 'homepage';
}

/**
 * Shared application footer. Reused across Login, Homepage SAA, Awards
 * Information, Sun* Kudos, and admin layouts. New visual treatments are
 * added by extending the `variant` union, never by hard-coding per-screen
 * markup elsewhere (Constitution §II — composition over duplication).
 */
export function AppFooter({ variant = 'login' }: AppFooterProps) {
  if (variant === 'homepage') return <HomepageFooter />;
  return <LoginFooter />;
}

function LoginFooter() {
  const t = useTranslations('footer');
  return (
    <footer role="contentinfo" className="mt-auto w-full px-6 py-4 text-center text-sm opacity-80">
      {t('copyright')}
    </footer>
  );
}

function HomepageFooter() {
  const t = useTranslations('footer');
  const tHeader = useTranslations('header');
  return (
    <footer
      role="contentinfo"
      className="mt-auto flex w-full flex-col items-center justify-between gap-6 px-6 py-6 text-sm md:flex-row md:px-10 lg:px-16"
    >
      <Link
        href={ROUTES.HOME}
        aria-label={tHeader('nav.logoAriaLabel')}
        className="inline-flex items-center rounded-(--radius-md)"
      >
        <Image
          src="/assets/homepage/images/logo-footer.png"
          alt="SAA"
          width={69}
          height={64}
          className="h-14 w-auto select-none"
          unoptimized
        />
      </Link>

      <nav aria-label="Footer">
        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          <li>
            <Link href={ROUTES.HOME} className="hover:underline">
              {t('nav.about')}
            </Link>
          </li>
          <li>
            <Link href={ROUTES.AWARDS} className="hover:underline">
              {t('nav.awards')}
            </Link>
          </li>
          <li>
            <Link href={ROUTES.KUDOS} className="hover:underline">
              {t('nav.kudos')}
            </Link>
          </li>
          <li>
            <Link href={ROUTES.COMMUNITY_STANDARDS} className="hover:underline">
              {t('nav.communityStandards')}
            </Link>
          </li>
        </ul>
      </nav>

      <span className="opacity-70">{t('copyright')}</span>
    </footer>
  );
}
