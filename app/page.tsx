import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Temporary protected stub for Homepage SAA. The middleware also gates `/`,
 * but we re-check here defense-in-depth.
 *
 * Replaced when the Homepage SAA feature lands (screen `i87tDx10uM`).
 */
export default async function Home() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirectTo=%2F');

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Homepage SAA</h1>
      <p className="mt-3 max-w-md text-base text-foreground/70">
        Coming soon. You are signed in as <strong>{user.email}</strong>.
      </p>
    </main>
  );
}
