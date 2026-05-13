'use client';

import Image from 'next/image';
import { useCallback, useEffect, useId, useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { FlagIcon } from '@/components/atoms/FlagIcon';
import { Toast } from '@/components/molecules/Toast';
import { setLocale } from '@/lib/i18n/actions';
import { logger } from '@/lib/logger';
import { locales, type Locale } from '@/lib/i18n/config';

interface LanguageSwitcherProps {
  currentLocale: Locale;
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const t = useTranslations('language');
  const tErr = useTranslations('homepage.errors');
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();

  // Close on outside click + Esc
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

  // Focus the first option when the listbox opens.
  useEffect(() => {
    if (open) itemRefs.current[0]?.focus();
  }, [open]);

  // FR-026 — if `setLocale` fails (network / 5xx), keep the previous locale
  // and surface a non-blocking toast. The dropdown is always closed first so
  // the user can retry without re-opening the menu.
  const onSelect = useCallback(
    (locale: Locale) => {
      setOpen(false);
      startTransition(async () => {
        try {
          await setLocale(locale);
        } catch (error) {
          logger.warn('language_switch_failed', { locale, error: (error as Error).message });
          setErrorMessage(tErr('localeSwitchFailed'));
        }
      });
    },
    [tErr],
  );

  const onListboxKey = useCallback((event: React.KeyboardEvent<HTMLUListElement>) => {
    const focusedIndex = itemRefs.current.findIndex((b) => b === document.activeElement);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = (focusedIndex + 1) % locales.length;
      itemRefs.current[next]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = (focusedIndex - 1 + locales.length) % locales.length;
      itemRefs.current[prev]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      itemRefs.current[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      itemRefs.current[locales.length - 1]?.focus();
    }
  }, []);

  return (
    <>
      {errorMessage ? (
        <Toast message={errorMessage} onDismiss={() => setErrorMessage(null)} />
      ) : null}
      <div ref={containerRef} className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-label={t('switcher.ariaLabel')}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-12 items-center gap-2 rounded-(--radius-md) px-3 text-base font-medium hover:bg-foreground/5"
        >
          <FlagIcon locale={currentLocale} />
          <span>{t(`code.${currentLocale}`)}</span>
          <ChevronDown open={open} />
        </button>

        {open && (
          <ul
            id={listboxId}
            role="listbox"
            aria-label={t('switcher.ariaLabel')}
            onKeyDown={onListboxKey}
            className="absolute right-0 z-20 mt-2 w-44 rounded-(--radius-md) border border-foreground/10 bg-background py-1 text-foreground shadow-lg"
          >
            {locales.map((locale, idx) => {
              const isActive = locale === currentLocale;
              return (
                <li key={locale} role="presentation">
                  <button
                    ref={(el) => {
                      itemRefs.current[idx] = el;
                    }}
                    type="button"
                    role="option"
                    aria-current={isActive ? 'true' : undefined}
                    aria-selected={isActive}
                    onClick={() => onSelect(locale)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-foreground hover:bg-foreground/5 aria-[current=true]:font-semibold"
                  >
                    <FlagIcon locale={locale} />
                    <span className="flex-1">{t(`label.${locale}`)}</span>
                    <span className="text-foreground/60">{t(`code.${locale}`)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <Image
      src="/assets/common/icons/chevron-down.svg"
      alt=""
      aria-hidden
      width={24}
      height={24}
      unoptimized
      className={['h-6 w-6 transition-transform', open ? 'rotate-180' : ''].join(' ')}
    />
  );
}
