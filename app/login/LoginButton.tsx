'use client';

import Image from 'next/image';
import { useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/atoms/Button';
import { Spinner } from '@/components/atoms/Spinner';
import { signInWithGoogle } from './actions';

interface LoginButtonProps {
  redirectTo: string;
}

/**
 * Google OAuth CTA. Wraps a progressive-enhancement `<form action>` so the
 * sign-in works even without JS hydration; useFormStatus reports the pending
 * state during the Server Action.
 *
 * - autoFocus: programmatic focus on initial paint (FR-016, no useEffect)
 * - Disabled + Spinner while pending (FR-003, FR-012)
 * - Hidden `redirectTo` input lets the server action read the safe target
 */
export function LoginButton({ redirectTo }: LoginButtonProps) {
  return (
    <form action={signInWithGoogle} className="contents">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <LoginButtonInner />
    </form>
  );
}

function LoginButtonInner() {
  const { pending } = useFormStatus();
  const t = useTranslations('login.button');

  return (
    <Button
      type="submit"
      variant="cta"
      size="lg"
      autoFocus
      disabled={pending}
      aria-busy={pending}
      className="w-[305px] justify-start"
      data-testid="login-button"
    >
      {pending ? (
        <Spinner className="h-6 w-6" aria-label={t('loading')} />
      ) : (
        <Image
          src="/assets/common/icons/google.svg"
          alt=""
          aria-hidden="true"
          width={24}
          height={24}
          className="h-6 w-6 shrink-0"
          data-testid="google-icon"
        />
      )}
      <span className="whitespace-nowrap font-display text-xl leading-[40px] tracking-[0.5px]">
        {pending ? t('loading') : t('label')}
      </span>
    </Button>
  );
}
