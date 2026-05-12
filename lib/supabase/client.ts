'use client';

import { createBrowserClient as createSsrBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser-side Supabase client for Client Components. Reads the session from
 * cookies set by the server. Use mainly for the auth state subscription
 * (cross-tab session detection); session reads on the page itself should go
 * through the server client.
 */
export function createBrowserClient() {
  return createSsrBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
