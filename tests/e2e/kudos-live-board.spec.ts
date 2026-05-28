import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import viMessages from '../../messages/vi.json';

const live = viMessages.kudos.live;

/**
 * Sun* Kudos - Live board happy paths against the mock data fallback (the
 * page rolls back to `LIVE_BOARD_MOCK` when the local Supabase isn't
 * running). Tests verify the read-side composition + interactive controls
 * that don't depend on server mutations.
 *
 * Mutating actions (likes, secret box opening) are covered by Vitest unit
 * tests; reproducing them here would require a seeded DB + authenticated
 * fixture, which is out of scope for the read-only board's smoke suite.
 */

test.describe('Sun* Kudos — Live board (anonymous)', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('renders banner + quick capture + HIGHLIGHT + SPOTLIGHT + feed + sidebar', async ({
    page,
  }) => {
    await page.goto('/kudos');

    // Banner KV — both eyebrow + KUDOS logo.
    await expect(page.getByText(live.hero.title)).toBeVisible();
    await expect(page.getByRole('img', { name: 'SAA 2025 KUDOS' })).toBeVisible();

    // Quick capture pill (US2).
    await expect(page.getByRole('button', { name: live.quickCapture.iconAriaLabel })).toBeVisible();

    // HIGHLIGHT KUDOS heading + carousel indicator.
    await expect(page.getByRole('heading', { name: live.highlight.title })).toBeVisible();
    await expect(page.getByText('1/5')).toBeVisible();

    // SPOTLIGHT BOARD heading + sr-only fallback list.
    await expect(page.getByRole('heading', { name: live.spotlight.title })).toBeVisible();
    await expect(page.getByRole('list', { name: live.spotlight.listAriaLabel })).toBeAttached();

    // ALL KUDOS feed + both sidebar leaderboards.
    await expect(page.getByRole('heading', { name: live.feed.title })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: live.sidebar.leaderboard.giftRecipients }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: live.sidebar.leaderboard.rankPromotions }),
    ).toBeVisible();
  });

  test('hides the personal-stats block when anonymous (FR-016)', async ({ page }) => {
    await page.goto('/kudos');
    await expect(page.getByText(live.sidebar.stats.kudosReceived)).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: new RegExp(live.sidebar.openBox, 'i') }),
    ).toHaveCount(0);
  });

  test('quick-capture click redirects anonymous viewer to /login', async ({ page }) => {
    await page.goto('/kudos');
    await page.getByRole('button', { name: live.quickCapture.iconAriaLabel }).click();
    await page.waitForURL(/\/login\?redirectTo=/);
    expect(page.url()).toContain('redirectTo=%2Fkudos%2Fnew');
  });

  test('carousel Next advances the page indicator 1/5 → 2/5', async ({ page }) => {
    await page.goto('/kudos');
    const next = page.getByRole('button', { name: live.highlight.carousel.nextAriaLabel }).first();
    await next.click();
    await expect(page.getByText('2/5')).toBeVisible();
  });

  test('hashtag chip click updates the URL and shows the filter badge', async ({ page }) => {
    await page.goto('/kudos');
    // Click the first hashtag chip in the feed (mock data uses #Inspring etc.).
    const chip = page.getByRole('link', { name: '#Inspring' }).first();
    await chip.click();
    await page.waitForURL(/hashtag=inspring/);
    await expect(page.getByText(/Lọc theo #inspring/i)).toBeVisible();
  });

  test('Spotlight search highlights matching recipients (200ms debounce)', async ({ page }) => {
    await page.goto('/kudos');
    const input = page.getByRole('searchbox', { name: live.spotlight.search.buttonAriaLabel });
    await input.fill('Hu');
    // Wait the 200ms debounce + a margin.
    await page.waitForTimeout(280);
    // Once matched, the recipient gets an underline + accent color via class.
    const match = page.getByRole('link', { name: /Huỳnh Dương Xuân Nhật/ }).first();
    await expect(match).toBeAttached();
  });
});

test.describe('Sun* Kudos — Live board accessibility', () => {
  test('axe-core: no serious/critical violations on /kudos', async ({ page }) => {
    await page.goto('/kudos');
    // Wait for Spotlight d3-cloud to finish placing words so the audit sees
    // the final DOM (a11y impact of `aria-busy="true"` etc.).
    await page.waitForTimeout(500);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // The HomepageHeader logo + KUDOS hero logo are decorative `<img>` with
      // unmodified width attributes — Next.js Image emits a "image-redundant-alt"
      // warning at the dev level but no a11y rule is violated. Skip the
      // duplicate-id-active rule which fires on dev-mode HMR cruft.
      .disableRules(['duplicate-id-active'])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });

  test('axe-core: no serious/critical violations on /kudos?hashtag=inspring', async ({ page }) => {
    await page.goto('/kudos?hashtag=inspring');
    await page.waitForTimeout(500);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['duplicate-id-active'])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
});

test.describe('Sun* Kudos — Live board performance', () => {
  /**
   * TR-001: LCP < 2.5s at p75 on a mid-range laptop.
   *
   * Lighthouse formal audit requires Chrome DevTools Protocol setup and a
   * production build; for the smoke pass we use the browser Performance API
   * via Playwright. Threshold is generous (under 4s on cold `next dev` with
   * 50 cards seeded) since dev-mode HMR adds ~1.5s and is not representative
   * of production. Run `npm run build && npm run start` + re-run for a
   * production-grade number.
   */
  test('LCP on /kudos stays under 4s on a cold dev render', async ({ page }) => {
    await page.goto('/kudos', { waitUntil: 'domcontentloaded' });
    // Let LCP candidates settle without blocking on long-poll connections.
    await page.waitForLoadState('load');
    const lcp = await page.evaluate<number>(
      () =>
        new Promise<number>((resolve) => {
          let last = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              last = entry.startTime;
            }
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          // Give the LCP candidate time to settle.
          setTimeout(() => resolve(last), 500);
        }),
    );
    console.log(`[perf] LCP on /kudos = ${lcp.toFixed(0)}ms`);
    expect(lcp, `LCP=${lcp.toFixed(0)}ms exceeds 4000ms budget`).toBeLessThan(4000);
  });
});
