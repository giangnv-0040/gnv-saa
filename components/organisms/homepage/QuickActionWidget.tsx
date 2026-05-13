'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ROUTES } from '@/lib/routes';

/**
 * Floating bottom-right widget. Clicking the pill opens an overlay with two
 * actions (FR-018): "Viết Kudo" → /kudos/new and "Thể lệ SAA" → /rules.
 * Outside-click / Esc close the overlay (US5 #3).
 */
export function QuickActionWidget() {
  const t = useTranslations('homepage.widget');
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
    <div ref={containerRef} className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2">
      {open ? (
        <ul
          id={menuId}
          role="menu"
          aria-label={t('ariaLabel')}
          className="w-44 overflow-hidden rounded-(--radius-md) border border-foreground/10 bg-background text-foreground shadow-lg"
        >
          <li>
            <Link
              href={ROUTES.KUDOS_NEW}
              role="menuitem"
              onClick={close}
              className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-foreground/5"
            >
              <Image
                src="/assets/homepage/icons/pen.svg"
                alt=""
                aria-hidden
                width={20}
                height={20}
                unoptimized
                className="h-5 w-5"
              />
              {t('viewKudo')}
            </Link>
          </li>
          <li>
            <Link
              href={ROUTES.RULES}
              role="menuitem"
              onClick={close}
              className="flex items-center gap-3 border-t border-foreground/10 px-4 py-3 text-sm hover:bg-foreground/5"
            >
              <Image
                src="/assets/homepage/icons/widget-saa.svg"
                alt=""
                aria-hidden
                width={20}
                height={20}
                unoptimized
                className="h-5 w-5"
              />
              {t('rules')}
            </Link>
          </li>
        </ul>
      ) : null}

      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={t('ariaLabel')}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full bg-cta px-5 py-3 text-cta-foreground shadow-lg transition-transform hover:scale-105"
      >
        <Image
          src="/assets/homepage/icons/pen.svg"
          alt=""
          aria-hidden
          width={20}
          height={20}
          unoptimized
          className="h-5 w-5"
        />
        <span className="text-foreground/40">/</span>
        <Image
          src="/assets/homepage/icons/widget-saa.svg"
          alt=""
          aria-hidden
          width={20}
          height={20}
          unoptimized
          className="h-5 w-5"
        />
      </button>
    </div>
  );
}
