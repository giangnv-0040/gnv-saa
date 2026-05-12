import { useTranslations } from 'next-intl';
import type { OAuthErrorCode } from '@/lib/validation/auth';

interface OAuthErrorLiveProps {
  error: OAuthErrorCode | null;
}

/**
 * Live region that announces an OAuth failure to assistive tech.
 *
 * Server Component — the error comes from the URL `?error=` query string at
 * render time, so no client interactivity is needed. Screen readers announce
 * `role="status"` content on initial render, satisfying spec FR-010 / US4.
 *
 * Errors render localized via next-intl. We do NOT include stack traces or
 * any internal identifier (TR-007 / OWASP).
 */
export function OAuthErrorLive({ error }: OAuthErrorLiveProps) {
  const t = useTranslations('login.error');
  if (!error) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto mt-4 w-full max-w-[480px] rounded-(--radius-md) border border-red-500/30 bg-red-50 px-4 py-3 text-sm text-red-900"
    >
      {t(error)}
    </div>
  );
}
