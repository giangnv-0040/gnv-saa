'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ROUTES } from '@/lib/routes';
import type { UserProfile } from '@/lib/users/types';

interface ProfileMenuProps {
  user: UserProfile | null;
}

/**
 * Avatar + dropdown menu.
 *
 * - `user === null` → anonymous: dropdown contains a single `Sign in` action
 *   that navigates to `/login` (FR-019).
 * - `user.role === 'admin'` → `Profile`, `Sign out`, `Admin Dashboard`
 *   (FR-022).
 * - else → `Profile`, `Sign out`.
 *
 * Sign-out is rendered as a `<form action="/auth/signout" method="post">` —
 * reuses the existing Route Handler at `app/auth/signout/route.ts`.
 */
export function ProfileMenu({ user }: ProfileMenuProps) {
  const t = useTranslations('profile.menu');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={t('ariaLabel')}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-foreground/5 hover:bg-foreground/10"
      >
        <ProfileAvatar user={user} />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={t('ariaLabel')}
          className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-(--radius-md) border border-foreground/10 bg-background text-foreground shadow-lg"
        >
          {user === null ? (
            <Link
              href={ROUTES.LOGIN}
              role="menuitem"
              onClick={close}
              className="block px-4 py-2 text-sm hover:bg-foreground/5"
            >
              {t('signIn')}
            </Link>
          ) : (
            <>
              <Link
                href={ROUTES.PROFILE}
                role="menuitem"
                onClick={close}
                className="block px-4 py-2 text-sm hover:bg-foreground/5"
              >
                {t('profile')}
              </Link>
              {user.role === 'admin' ? (
                <Link
                  href={ROUTES.ADMIN}
                  role="menuitem"
                  onClick={close}
                  className="block px-4 py-2 text-sm hover:bg-foreground/5"
                >
                  {t('adminDashboard')}
                </Link>
              ) : null}
              <form action={ROUTES.SIGN_OUT} method="post" className="block">
                <button
                  type="submit"
                  role="menuitem"
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-foreground/5"
                >
                  {t('signOut')}
                </button>
              </form>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ProfileAvatar({ user }: { user: UserProfile | null }) {
  if (user?.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt=""
        aria-hidden
        width={40}
        height={40}
        className="h-10 w-10 object-cover"
        unoptimized
      />
    );
  }
  return (
    <Image
      src="/assets/homepage/icons/user-default.svg"
      alt=""
      aria-hidden
      width={24}
      height={24}
      unoptimized
      className="h-6 w-6"
    />
  );
}
