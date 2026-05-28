'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { HeartIcon } from '@/components/atoms/KudoIcons';
import { ROUTES } from '@/lib/routes';
import type { KudoUserSummary } from '@/lib/kudos/types';

interface UserChipProps {
  user: KudoUserSummary;
  align?: 'left' | 'right';
}

/** US11 — preview popover opens after 300ms hover and closes within 150ms. */
const OPEN_DELAY_MS = 300;
const CLOSE_DELAY_MS = 150;

/**
 * Compact identity chip rendered above each Kudo card body — avatar,
 * display name (linked to profile), team, badge, and the hearts-received
 * counter. On hover (≥300ms) reveals a small profile preview popover per
 * US11; the popover closes on Escape or 150ms after mouseleave.
 */
export function UserChip({ user, align = 'left' }: UserChipProps) {
  const t = useTranslations('kudos.live.feed.userChip');
  const [open, setOpen] = useState(false);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(
    () => () => {
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    },
    [],
  );

  function scheduleOpen() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (open) return;
    openTimerRef.current = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
  }

  function scheduleClose() {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    closeTimerRef.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }

  return (
    <span
      className="relative inline-block"
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
      onFocus={scheduleOpen}
      onBlur={scheduleClose}
    >
      <Link
        href={`${ROUTES.PROFILE}/${user.id}`}
        aria-describedby={open ? `user-popover-${user.id}` : undefined}
        className={[
          'group inline-flex items-center gap-2',
          align === 'right' ? 'flex-row-reverse text-right' : 'text-left',
        ].join(' ')}
      >
        <span
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-foreground/10 text-sm font-bold text-foreground/70"
        >
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            user.displayName.slice(0, 1)
          )}
        </span>
        <span className={align === 'right' ? 'items-end text-right' : 'items-start text-left'}>
          <span className="block text-sm font-bold leading-tight text-foreground group-hover:underline">
            {user.displayName}
          </span>
          <span className="block text-xs text-foreground/60">{user.team}</span>
          <span
            className={[
              'mt-0.5 inline-flex items-center gap-1 text-xs text-foreground/70',
              align === 'right' ? 'flex-row-reverse' : '',
            ].join(' ')}
          >
            <HeartIcon filled className="h-3 w-3 text-[#D4271D]" />
            {user.heartsReceived}
            {user.badge ? (
              <span className="ml-1 rounded-full bg-[#FFEA9E] px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                {user.badge}
              </span>
            ) : null}
          </span>
        </span>
      </Link>

      {open ? (
        <span
          id={`user-popover-${user.id}`}
          role="tooltip"
          className={[
            'pointer-events-none absolute top-full z-30 mt-2 w-60 rounded-xl border border-foreground/10 bg-white p-3 text-left text-foreground shadow-xl',
            align === 'right' ? 'right-0' : 'left-0',
          ].join(' ')}
        >
          <span className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-foreground/10 text-base font-bold">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                user.displayName.slice(0, 1)
              )}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-bold">{user.displayName}</span>
              <span className="truncate text-xs text-foreground/60">{user.team}</span>
            </span>
          </span>
          <span className="mt-3 flex items-center justify-between text-xs text-foreground/70">
            <span className="inline-flex items-center gap-1">
              <HeartIcon filled className="h-3.5 w-3.5 text-[#D4271D]" />
              {t('heartsReceived', { count: user.heartsReceived })}
            </span>
            {user.badge ? (
              <span className="rounded-full bg-[#FFEA9E] px-2 py-0.5 text-[10px] font-semibold text-foreground">
                {user.badge}
              </span>
            ) : null}
          </span>
        </span>
      ) : null}
    </span>
  );
}
