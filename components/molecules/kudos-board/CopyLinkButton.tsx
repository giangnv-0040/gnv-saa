'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LinkIcon } from '@/components/atoms/KudoIcons';
import { Toast } from '@/components/molecules/Toast';

interface CopyLinkButtonProps {
  kudoId: string;
}

/**
 * Copies the canonical `/kudos/{id}` URL to the clipboard. Mock-mode wires
 * `navigator.clipboard` and surfaces success / failure via the existing
 * `Toast` molecule per US9.
 */
export function CopyLinkButton({ kudoId }: CopyLinkButtonProps) {
  const t = useTranslations('kudos.live.feed');
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const copy = useCallback(() => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/kudos/${kudoId}`;
    navigator.clipboard
      ?.writeText(url)
      .then(() => setToast({ message: t('copyLinkSuccess'), tone: 'success' }))
      .catch(() => setToast({ message: t('copyLinkError'), tone: 'error' }));
  }, [kudoId, t]);

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-2 text-sm font-bold text-foreground/70 hover:text-foreground"
      >
        <LinkIcon className="h-5 w-5" />
        {t('copyLink')}
      </button>
      {toast ? (
        <Toast message={toast.message} durationMs={3000} onDismiss={() => setToast(null)} />
      ) : null}
    </>
  );
}
