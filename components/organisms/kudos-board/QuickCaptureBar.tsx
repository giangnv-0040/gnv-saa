'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PencilIcon, SearchIcon } from '@/components/atoms/KudoIcons';
import { ROUTES } from '@/lib/routes';

/**
 * Two-up bar below the hero banner: pencil-pill capture (→ /kudos/new) on
 * the left, Sunner profile search on the right. Quick-capture lives in
 * the same component because it shares the visual band.
 */
export function QuickCaptureBar() {
  const tCapture = useTranslations('kudos.live.quickCapture');
  const tSearch = useTranslations('kudos.live.sunnerSearch');
  const router = useRouter();

  return (
    <section className="relative -mt-6 mx-auto flex max-w-7xl flex-col gap-3 px-6 md:flex-row md:items-center md:gap-6 md:px-10 lg:px-16">
      <button
        type="button"
        onClick={() => router.push(ROUTES.KUDOS_NEW)}
        aria-label={tCapture('iconAriaLabel')}
        className="flex flex-1 items-center gap-3 rounded-full border border-hero-foreground/30 bg-hero-background/70 px-5 py-3 text-left text-sm font-semibold text-hero-foreground/70 backdrop-blur transition hover:bg-hero-background/90 hover:text-hero-foreground"
      >
        <PencilIcon className="h-5 w-5" />
        <span>{tCapture('placeholder')}</span>
      </button>

      <form
        role="search"
        onSubmit={(event) => event.preventDefault()}
        className="flex flex-1 items-center gap-2 rounded-full border border-hero-foreground/30 bg-hero-background/70 px-5 py-3 backdrop-blur"
      >
        <SearchIcon className="h-5 w-5 text-hero-foreground/70" />
        <input
          type="search"
          aria-label={tSearch('buttonAriaLabel')}
          placeholder={tSearch('placeholder')}
          maxLength={100}
          className="flex-1 bg-transparent text-sm font-semibold text-hero-foreground outline-none placeholder:text-hero-foreground/50"
        />
      </form>
    </section>
  );
}
