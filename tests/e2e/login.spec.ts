import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { test as authTest } from './fixtures/auth';
import viMessages from '../../messages/vi.json';
import enMessages from '../../messages/en.json';
import jaMessages from '../../messages/ja.json';

// =============================================================================
// US1 (P1) — Google Sign-In happy path
// =============================================================================
test.describe('US1 — Login screen', () => {
  test('renders the Login UI for unauthenticated visitors', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(viMessages.login.welcome.line1)).toBeVisible();
    await expect(page.getByText(viMessages.login.welcome.line2)).toBeVisible();
    const button = page.getByRole('button', { name: viMessages.login.button.label });
    await expect(button).toBeVisible();
    await expect(button).toBeFocused(); // FR-016 — auto-focus on mount
  });

  test('clicking LOGIN navigates to Google consent (same-window redirect)', async ({ page }) => {
    await page.goto('/login');
    const button = page.getByRole('button', { name: viMessages.login.button.label });

    // Intercept the Server Action redirect by capturing the network response.
    const navigation = page.waitForURL((url) => /accounts\.google\.com/.test(url.toString()), {
      timeout: 15_000,
    });
    await button.click();
    await navigation; // Will throw if it doesn't land on Google.
  });
});

// =============================================================================
// US2 (P2) — Language switcher persists across reloads (no flash)
// =============================================================================
test.describe('US2 — Language switcher', () => {
  test('default locale is Vietnamese on first visit', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await expect(page.getByText(viMessages.login.welcome.line1)).toBeVisible();
  });

  test('switching to EN updates the UI and persists across reload', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');

    // Open the switcher and select English.
    await page.getByRole('button', { name: viMessages.language.switcher.ariaLabel }).click();
    await page.getByRole('option', { name: viMessages.language.label.en }).click();

    // UI now reflects English.
    await expect(page.getByText(enMessages.login.welcome.line1)).toBeVisible();
    await expect(page.getByRole('button', { name: enMessages.login.button.label })).toBeVisible();

    // Reload: locale must be EN on first paint (no Vietnamese flash).
    await page.reload();
    await expect(page.getByText(enMessages.login.welcome.line1)).toBeVisible();
  });

  test('Esc closes the dropdown without changing locale', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await page.getByRole('button', { name: viMessages.language.switcher.ariaLabel }).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toBeHidden();
    await expect(page.getByText(viMessages.login.welcome.line1)).toBeVisible();
  });

  test('Japanese is selectable', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await page.getByRole('button', { name: viMessages.language.switcher.ariaLabel }).click();
    await page.getByRole('option', { name: viMessages.language.label.ja }).click();
    await expect(page.getByText(jaMessages.login.welcome.line1)).toBeVisible();
  });
});

// =============================================================================
// US4 (P3) — OAuth & domain-gate error paths
// =============================================================================
test.describe('US4 — Error paths', () => {
  const errorCases: Array<{ code: keyof typeof viMessages.login.error; expected: string }> = [
    { code: 'access_denied', expected: viMessages.login.error.access_denied },
    { code: 'domain_not_allowed', expected: viMessages.login.error.domain_not_allowed },
    { code: 'invalid_state', expected: viMessages.login.error.invalid_state },
    { code: 'provider_error', expected: viMessages.login.error.provider_error },
    { code: 'network_error', expected: viMessages.login.error.network_error },
  ];

  for (const { code, expected } of errorCases) {
    test(`?error=${code} shows the localized message in a live region`, async ({ page }) => {
      await page.goto(`/login?error=${code}`);
      const live = page.locator('[role="status"][aria-live="polite"]');
      await expect(live).toContainText(expected);
      // The button must remain enabled (retry path).
      await expect(page.getByRole('button', { name: viMessages.login.button.label })).toBeEnabled();
    });
  }

  test('unknown ?error value is dropped silently (no live region)', async ({ page }) => {
    await page.goto('/login?error=mystery_code');
    await expect(page.locator('[role="status"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: viMessages.login.button.label })).toBeEnabled();
  });

  test('error message contains no stack trace / internal id', async ({ page }) => {
    await page.goto('/login?error=provider_error');
    const live = page.locator('[role="status"][aria-live="polite"]');
    const text = await live.textContent();
    expect(text).not.toMatch(/at\s+[\w/.]+:\d+/); // stack frame
    expect(text).not.toMatch(/Error:/i);
    expect(text).not.toMatch(/\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}/i); // UUIDs
  });
});

// =============================================================================
// Polish — Phase 7
// =============================================================================
test.describe('Phase 7 — accessibility + performance', () => {
  test('axe-core: no serious/critical violations on /login (default locale)', async ({ page }) => {
    await page.goto('/login');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });

  test('axe-core: no serious/critical violations on /login?error=domain_not_allowed', async ({
    page,
  }) => {
    await page.goto('/login?error=domain_not_allowed');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });

  test('SC-006: locale-switch round-trip < 200ms p95 over 20 runs', async ({ page, context }) => {
    const times: number[] = [];
    for (let i = 0; i < 20; i++) {
      await context.clearCookies();
      await page.goto('/login');

      await page.getByRole('button', { name: viMessages.language.switcher.ariaLabel }).click();
      const targetLocale = i % 2 === 0 ? 'en' : 'ja';
      const targetMessages = targetLocale === 'en' ? enMessages : jaMessages;

      const start = await page.evaluate(() => performance.now());
      await page.getByRole('option', { name: viMessages.language.label[targetLocale] }).click();
      await page.getByText(targetMessages.login.welcome.line1).waitFor();
      const elapsed = await page.evaluate((s) => performance.now() - s, start);
      times.push(elapsed);
    }
    times.sort((a, b) => a - b);
    const p95 = times[Math.floor(times.length * 0.95)];
    expect(p95, `p95=${p95}ms, samples=${JSON.stringify(times)}`).toBeLessThan(200);
  });
});

// =============================================================================
// US3 (P2) — Authenticated user is redirected away from /login (no flash)
// =============================================================================
authTest.describe('US3 — Authenticated redirect', () => {
  authTest(
    'authenticated user visiting /login is 302-redirected to /',
    async ({ authenticatedPage, context }) => {
      const response = await context.request.get('/login', { maxRedirects: 0 });
      expect([301, 302, 303, 307, 308]).toContain(response.status());
      expect(response.headers().location).toMatch(/\/$/);
      // The body must not contain the Login button label — i.e. no flash.
      const body = await response.text();
      expect(body).not.toContain(viMessages.login.button.label);

      // And navigating in the page also lands on / (homepage stub).
      await authenticatedPage.goto('/login');
      await authenticatedPage.waitForURL(/\/$/);
    },
  );
});
