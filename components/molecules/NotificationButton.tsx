'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BellIcon } from '@/components/atoms/BellIcon';
import { UnreadBadge } from '@/components/atoms/UnreadBadge';
import { NotificationOverlay } from './NotificationOverlay';

interface NotificationButtonProps {
  /** Unread count fetched server-side; controls the badge visibility. */
  unreadCount: number;
}

/**
 * Bell button + inline overlay. Visible only to authenticated users
 * (callers must guard at render time per FR-019).
 *
 * Reuses the outside-click + Esc + keyboard semantics established by
 * `LanguageSwitcher`. Clicking the bell toggles an overlay that lazily
 * fetches the latest 5 notifications via a Server Action (stub returns []
 * until the Notifications spec ships).
 */
export function NotificationButton({ unreadCount }: NotificationButtonProps) {
  const t = useTranslations('notifications');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayId = useId();

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

  const toggle = useCallback(() => setOpen((v) => !v), []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? overlayId : undefined}
        aria-label={t('ariaLabel')}
        onClick={toggle}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-foreground/5"
      >
        <BellIcon />
        <UnreadBadge count={unreadCount} ariaLabel={t('unreadBadgeLabel')} />
      </button>

      {open ? <NotificationOverlay id={overlayId} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
