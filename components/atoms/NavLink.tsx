'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface NavLinkProps {
  href: string;
  /**
   * When true, the link is active only when `pathname` exactly equals `href`.
   * When false (default), active is also true when `pathname` starts with
   * `href` (useful for section parents like `/awards` matching `/awards#x`).
   */
  exact?: boolean;
  children: ReactNode;
}

/**
 * Active-aware navigation link. Computes the active state from `usePathname`
 * and exposes it via `aria-current="page"` (TR-009 + FR-002).
 *
 * Visual treatment (selected vs. hover vs. normal) is delegated to Tailwind
 * utility classes consuming the design tokens; this atom only owns behavior.
 */
export function NavLink({ href, exact = false, children }: NavLinkProps) {
  const pathname = usePathname() ?? '/';
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={[
        'rounded-(--radius-md) px-3 py-2 text-sm font-medium transition-colors',
        'hover:bg-foreground/5',
        isActive ? 'text-cta underline underline-offset-4' : 'text-foreground/90',
      ].join(' ')}
    >
      {children}
    </Link>
  );
}
