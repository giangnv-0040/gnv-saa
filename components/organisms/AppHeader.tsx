import Image from 'next/image';
import type { ReactNode } from 'react';

interface AppHeaderProps {
  /**
   * Trailing-edge slot (e.g. the LanguageSwitcher). Reserved on the right
   * so authenticated screens can drop in user controls later without
   * touching AppHeader.
   */
  children?: ReactNode;
}

/**
 * Shared application header.
 *
 * Spec FR-013: the Logo is non-interactive on every screen — no onClick,
 * href, tabIndex, role, or cursor-pointer utility. The logo simply
 * communicates brand identity.
 */
export function AppHeader({ children }: AppHeaderProps) {
  return (
    <header className="flex w-full items-center justify-between px-6 py-4 md:px-10 lg:px-16">
      <Image
        src="/assets/common/logo.png"
        alt="SAA"
        width={52}
        height={48}
        priority
        className="h-12 w-auto select-none"
      />
      <div className="flex items-center gap-2">{children}</div>
    </header>
  );
}
