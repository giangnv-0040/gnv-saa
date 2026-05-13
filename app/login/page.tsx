import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { createServerClient } from '@/lib/supabase/server';
import { sanitizeRedirectTo } from '@/lib/auth/safe-redirect';
import { oauthErrorCodeSchema, type OAuthErrorCode } from '@/lib/validation/auth';
import { isLocale, defaultLocale } from '@/lib/i18n/config';
import { AppHeader } from '@/components/organisms/AppHeader';
import { AppFooter } from '@/components/organisms/AppFooter';
import { LanguageSwitcher } from '@/components/molecules/LanguageSwitcher';
import { LoginHero } from './LoginHero';
import { OAuthErrorLive } from './OAuthErrorLive';

interface PageSearchParams {
  error?: string;
  redirectTo?: string;
}

interface LoginPageProps {
  // Next.js 16: searchParams is a Promise.
  searchParams: Promise<PageSearchParams>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const raw = await searchParams;
  const safeRedirect = sanitizeRedirectTo(raw?.redirectTo);

  // 1) If a session already exists, never render the Login UI — redirect first.
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(safeRedirect);
  }

  // 2) Parse the error code (drop unknown values silently to prevent probing).
  const parsedError = oauthErrorCodeSchema.safeParse(raw?.error);
  const error: OAuthErrorCode | null = parsedError.success ? parsedError.data : null;

  // 3) Active locale for the language switcher trigger label.
  const rawLocale = await getLocale();
  const currentLocale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-hero-background text-hero-foreground">
      {/* 1. Full-bleed decorative key-visual artwork exported from Figma
            mms_C_Keyvisual (node 662:14388). */}
      <Image
        src="/assets/login/hero-background.webp"
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="select-none object-cover object-center"
      />

      {/* 2. Rectangle 57 (node 662:14392) — horizontal gradient from Figma:
            darkens the left ~25% so content stays legible, fades to fully
            transparent on the right where the colored swirl shows through. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, #00101A 0%, #00101A 25.41%, rgba(0, 16, 26, 0) 100%)',
        }}
      />

      {/* 3. Cover (node 662:14390) — vertical gradient from Figma: darkens
            the bottom half so the footer + CTA area stay legible. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 top-[138px] h-[calc(100%-138px)]"
        style={{
          background: 'linear-gradient(0deg, #00101A 22.48%, rgba(0, 19, 32, 0) 51.74%)',
        }}
      />

      {/* 4. Foreground content stacks above the image + both overlays. */}
      <div className="relative z-10 flex flex-1 flex-col">
        <AppHeader>
          <LanguageSwitcher currentLocale={currentLocale} />
        </AppHeader>
        <main className="flex flex-1 flex-col">
          <LoginHero redirectTo={safeRedirect} />
          <OAuthErrorLive error={error} />
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
