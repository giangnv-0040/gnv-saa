'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { CloseIcon, GiftIcon } from '@/components/atoms/KudoIcons';

interface SecretBoxDialogProps {
  onClose: () => void;
}

/**
 * Placeholder dialog for the `Mở quà` (Secret Box) trigger. The actual
 * Secret Box opening UX is owned by a separate spec (US12 — out of scope on
 * the live board). This dialog satisfies the live-board contract: clicking
 * the CTA opens a focusable modal that the user can dismiss.
 */
export function SecretBoxDialog({ onClose }: SecretBoxDialogProps) {
  const t = useTranslations('kudos.live.sidebar.secretBoxDialog');
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeBtnRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="secret-box-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-hero-foreground/15 bg-[#00101A] p-6 text-hero-foreground shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label={t('closeAriaLabel')}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-hero-foreground/70 transition hover:bg-white/5"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#FFEA9E] text-foreground">
            <GiftIcon className="h-6 w-6" />
          </span>
          <h2
            id="secret-box-dialog-title"
            className="text-xl font-extrabold uppercase tracking-wider text-[#FFEA9E]"
          >
            {t('title')}
          </h2>
          <p className="mt-2 text-sm text-hero-foreground/80">{t('body')}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 inline-flex items-center justify-center rounded-full bg-[#FFEA9E] px-6 py-2 text-sm font-extrabold uppercase tracking-wide text-foreground transition hover:bg-[#FFE074]"
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
