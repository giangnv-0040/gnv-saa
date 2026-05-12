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
    <div className="flex min-h-screen flex-1 flex-col bg-hero-background text-hero-foreground">
      <AppHeader>
        <LanguageSwitcher currentLocale={currentLocale} />
      </AppHeader>
      <main className="flex flex-1 flex-col">
        <LoginHero redirectTo={safeRedirect} />
        <OAuthErrorLive error={error} />
      </main>
      <AppFooter />
    </div>
  );
}
