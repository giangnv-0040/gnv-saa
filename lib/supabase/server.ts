import { createServerClient as createSsrServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Server-side Supabase client for Server Components, Server Actions, and Route
 * Handlers. Reads + writes session cookies via next/headers. Uses the public
 * anon key — never the service role.
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSsrServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies (read-only).
          // Middleware and Route Handlers can — silently noop in render contexts.
        }
      },
    },
  });
}

/**
 * Admin Supabase client (service role). USE ONLY in server-only code paths:
 * - /auth/callback route handler (allow-list lookup, last_login_at update)
 * - Future admin route handlers.
 * NEVER import this module from a Client Component or from any code that
 * could end up in the client bundle.
 */
export function createAdminClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is missing. This client must only be used server-side.',
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
