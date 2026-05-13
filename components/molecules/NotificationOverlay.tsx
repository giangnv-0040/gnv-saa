'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getRecentNotifications } from '@/lib/notifications/actions';
import { ROUTES } from '@/lib/routes';
import type { Notification } from '@/lib/notifications/types';

interface NotificationOverlayProps {
  id: string;
  onClose: () => void;
}

/**
 * Inline panel anchored to the bell. Lazy-fetches the latest 5 notifications
 * via the stubbed Server Action; renders the empty-state copy until the
 * Notifications spec replaces the stub.
 *
 * Always shows a `See all` link to `/notifications` (US3 #3 acceptance
 * scenario) — that route is currently the `Coming soon` placeholder added in
 * Phase 1.5.
 */
export function NotificationOverlay({ id, onClose }: NotificationOverlayProps) {
  const t = useTranslations('notifications');
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    let cancelled = false;
    getRecentNotifications({ limit: 5 }).then((data) => {
      if (!cancelled) setItems(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      id={id}
      role="dialog"
      aria-label={t('ariaLabel')}
      className="absolute right-0 top-full z-20 mt-2 w-80 rounded-(--radius-md) border border-foreground/10 bg-background text-foreground shadow-lg"
    >
      {items.length === 0 ? (
        <p className="p-4 text-sm text-foreground/70">{t('emptyState')}</p>
      ) : (
        <ul className="divide-y divide-foreground/10">
          {items.map((n) => (
            <li key={n.id} className="p-3 text-sm">
              <p className="font-semibold">{n.title}</p>
              <p className="text-foreground/70">{n.body}</p>
            </li>
          ))}
        </ul>
      )}

      <Link
        href={ROUTES.NOTIFICATIONS}
        onClick={onClose}
        className="block border-t border-foreground/10 px-4 py-3 text-center text-sm font-medium hover:bg-foreground/5"
      >
        {t('seeAll')}
      </Link>
    </div>
  );
}
