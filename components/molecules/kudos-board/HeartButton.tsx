'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { HeartIcon } from '@/components/atoms/KudoIcons';
import { Toast } from '@/components/molecules/Toast';
import { useLikeKudo } from '@/lib/kudos/queries/useLikeKudo';
import { ROUTES } from '@/lib/routes';

interface HeartButtonProps {
  kudoId: string;
  count: number;
  liked: boolean;
  /** True when the viewer is the kudo's sender — like is disabled. */
  isOwn?: boolean;
  /** When false, clicks redirect to /login?redirectTo=… (FR-013). */
  isAuthenticated?: boolean;
}

/** FR-006: client-side debounce window for rapid heart clicks. */
const DEBOUNCE_MS = 300;

/**
 * Toggleable heart button used by every Kudo card. Mutates through
 * `useLikeKudo` (optimistic + rollback). Disabled state covers FR-005
 * (sender cannot like own kudo) and FR-006 (double-click debounce).
 */
export function HeartButton({
  kudoId,
  count,
  liked,
  isOwn = false,
  isAuthenticated = true,
}: HeartButtonProps) {
  const t = useTranslations('kudos.live.feed');
  const router = useRouter();
  const pathname = usePathname();
  const mutation = useLikeKudo();
  const lastClickAtRef = useRef(0);
  const [errorOpen, setErrorOpen] = useState(false);

  function handleClick() {
    if (isOwn) return;
    const now = Date.now();
    if (now - lastClickAtRef.current < DEBOUNCE_MS) return;
    lastClickAtRef.current = now;
    if (!isAuthenticated) {
      const redirectTo = pathname || ROUTES.KUDOS;
      router.push(`${ROUTES.LOGIN}?redirectTo=${encodeURIComponent(redirectTo)}`);
      return;
    }
    mutation.mutate({ kudoId, liked: !liked }, { onError: () => setErrorOpen(true) });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isOwn || mutation.isPending}
        aria-pressed={liked}
        aria-disabled={isOwn}
        aria-label={liked ? t('unlikeAriaLabel') : t('likeAriaLabel')}
        title={isOwn ? t('selfLikeDisabledTooltip') : undefined}
        className={[
          'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold transition',
          liked ? 'text-[#D4271D]' : 'text-foreground/70 hover:text-[#D4271D]',
          isOwn ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        ].join(' ')}
      >
        <span className="tabular-nums">{count.toLocaleString('en-US')}</span>
        <HeartIcon filled={liked} className="h-5 w-5" />
      </button>
      {errorOpen ? (
        <Toast
          message={t('likeErrorToast')}
          durationMs={3000}
          onDismiss={() => setErrorOpen(false)}
        />
      ) : null}
    </>
  );
}
