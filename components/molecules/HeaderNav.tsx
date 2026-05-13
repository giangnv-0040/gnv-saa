import { useTranslations } from 'next-intl';
import { NavLink } from '@/components/atoms/NavLink';
import { ROUTES } from '@/lib/routes';

/**
 * Primary navigation rendered between the logo and the controls slot of the
 * homepage header. Three fixed entries:
 *
 * - About SAA 2025 → `/` (active when on the homepage)
 * - Awards Information → `/awards`
 * - Sun* Kudos → `/kudos`
 */
export function HeaderNav() {
  const t = useTranslations('header.nav');
  return (
    <nav aria-label="Primary">
      <ul className="flex items-center gap-2">
        <li>
          <NavLink href={ROUTES.HOME} exact>
            {t('about')}
          </NavLink>
        </li>
        <li>
          <NavLink href={ROUTES.AWARDS}>{t('awards')}</NavLink>
        </li>
        <li>
          <NavLink href={ROUTES.KUDOS}>{t('kudos')}</NavLink>
        </li>
      </ul>
    </nav>
  );
}
