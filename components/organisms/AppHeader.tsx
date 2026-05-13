import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

interface AppHeaderProps {
  /**
   * Center slot for navigation links (used by Homepage SAA's HeaderNav).
   * Omitted on screens that don't need primary nav, e.g. Login.
   */
  nav?: ReactNode;
  /**
   * Trailing-edge slot for controls — language switcher, notification bell,
   * profile menu. Aliases the previous `children` prop semantics so existing
   * callers (Login) keep working without a code change.
   */
  controls?: ReactNode;
  /**
   * Backwards-compatible alias for `controls`. Existing Login layout passes
   * the LanguageSwitcher via `children`; do not remove without updating it.
   */
  children?: ReactNode;
  /**
   * When provided, renders the logo as a `<Link>` to the given path with an
   * `aria-label`. When omitted, the logo stays a non-interactive `<Image>`.
   *
   * Login renders without `logoHref` (the logo communicates brand identity
   * only). Homepage SAA and other post-login screens pass `logoHref="/"` so
   * the logo navigates home (spec FR-004). Reconciles Homepage FR-004 vs.
   * Login FR-013 — see `.momorph/specs/i87tDx10uM-homepage-saa/plan.md`.
   */
  logoHref?: string;
}

/**
 * Shared application header.
 *
 * - Default mode (Login): no nav, no logoHref → logo is non-interactive,
 *   controls slot rendered on the right.
 * - Homepage mode: nav slot in the middle, controls slot on the right,
 *   logoHref="/" → logo becomes a `<Link>` with an accessible name.
 */
export function AppHeader({ nav, controls, children, logoHref }: AppHeaderProps) {
  // `children` is the legacy slot that maps to `controls`. Prefer `controls`
  // when both are passed (explicit > implicit).
  const trailing = controls ?? children;

  return (
    <header className="flex w-full items-center justify-between px-6 py-4 md:px-10 lg:px-16">
      <LogoSlot href={logoHref} />
      {nav ? <div className="flex flex-1 items-center justify-center">{nav}</div> : null}
      <div className="flex items-center gap-2">{trailing}</div>
    </header>
  );
}

function LogoSlot({ href }: { href: string | undefined }) {
  const logo = (
    <Image
      src="/assets/common/logo.png"
      alt="SAA"
      width={52}
      height={48}
      priority
      className="h-12 w-auto select-none"
    />
  );

  if (href === undefined) return logo;
  return <LogoLink href={href}>{logo}</LogoLink>;
}

function LogoLink({ href, children }: { href: string; children: ReactNode }) {
  const t = useTranslations('header');
  return (
    <Link
      href={href}
      aria-label={t('nav.logoAriaLabel')}
      className="inline-flex items-center rounded-(--radius-md)"
    >
      {children}
    </Link>
  );
}
