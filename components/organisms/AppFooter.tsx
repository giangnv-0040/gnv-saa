import { useTranslations } from 'next-intl';

/**
 * Shared application footer. Non-interactive on every screen (FR-013).
 * `mt-auto` keeps it pinned to the viewport bottom inside the page flex
 * column without needing `position: fixed` (FR-014).
 */
export function AppFooter() {
  const t = useTranslations('footer');
  return (
    <footer role="contentinfo" className="mt-auto w-full px-6 py-4 text-center text-sm opacity-80">
      {t('copyright')}
    </footer>
  );
}
