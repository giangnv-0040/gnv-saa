import { test as base, type BrowserContext, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// True when CI is running with stub Supabase env (smoke mode) and no real
// admin API is reachable. Tests that rely on the admin API should skip.
export const isStubSupabaseEnv =
  URL === 'http://localhost:54321' && SERVICE_ROLE === 'service-role-test-key-ci';

function admin() {
  if (!URL || !SERVICE_ROLE) {
    throw new Error(
      'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for E2E auth fixture.',
    );
  }
  return createClient(URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Programmatically create a Supabase session for `email` (creating the auth.users
 * row if missing) and attach the resulting cookies to the Playwright context.
 * Bypasses Google entirely — happy paths use this for deterministic, fast E2E.
 *
 * Returns the authenticated user id.
 */
export async function loginAs(
  context: BrowserContext,
  email: string,
  full_name = 'Test User',
): Promise<{ userId: string }> {
  const supabase = admin();

  // Ensure a user exists (idempotent — admin.createUser fails if exists; ignore).
  const { data: createData, error: createError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name },
  });
  let userId = createData?.user?.id;
  if (createError && !/already.*exists|email.*registered/i.test(createError.message)) {
    throw createError;
  }
  if (!userId) {
    const { data: list, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    const found = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!found) throw new Error(`Could not find user for email ${email}`);
    userId = found.id;
  }

  // Mint a magiclink to obtain hashed access+refresh tokens, then exchange via the
  // server cookie flow by setting the Supabase session cookie directly.
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });
  if (linkError) throw linkError;

  // generateLink returns { properties.action_link } pointing at /auth/v1/verify?token=...
  // Have Playwright follow that URL — Supabase will set the session cookies on our domain.
  const verifyUrl = linkData.properties?.action_link;
  if (!verifyUrl) throw new Error('generateLink returned no action_link');

  const page = await context.newPage();
  await page.goto(verifyUrl);
  await page.waitForURL((url) => url.origin === SITE_URL, { timeout: 30_000 });
  await page.close();

  return { userId };
}

/**
 * Extended Playwright `test` with an `authenticatedPage` fixture. Use as:
 *
 *   import { test, expect } from 'tests/e2e/fixtures/auth';
 *   test('protected', async ({ authenticatedPage }) => { ... });
 */
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ context }, use) => {
    await loginAs(context, 'e2e-test@sun-asterisk.com');
    const page = await context.newPage();
    // Playwright's `use(value)` is its fixture-yield API — not a React Hook —
    // so the eslint rules-of-hooks plugin's heuristic is a false positive here.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';
