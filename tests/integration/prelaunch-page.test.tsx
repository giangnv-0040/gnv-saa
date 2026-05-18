/**
 * Integration test for `app/prelaunch/page.tsx` Server Component.
 *
 * Verifies:
 * - SSR renders the headline + three tiles with REAL digits when env is set in
 *   the future (US1 acceptance).
 * - Direct visit with env unset/unparseable/past collapses to `--` placeholders
 *   (FR-009 + decision #6 + decision #11).
 * - `metadata.robots = { index: false, follow: false }` (FR-014).
 * - The `<main>` element has tabIndex=-1; no other focusable nodes exist
 *   (FR-015 — covered indirectly in Phase 6 polish task T050; this file
 *   focuses on render + metadata).
 * - Supabase server client is NOT invoked during render (TR-002).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import viMessages from '@/messages/vi.json';

// Mock Supabase server client BEFORE importing the page module so the import
// graph never reaches the real Supabase factory. The mock object asserts
// later that no member functions were invoked.
const supabaseSpy = {
  from: vi.fn(),
  auth: { getUser: vi.fn() },
};
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => supabaseSpy,
  createAdminClient: () => supabaseSpy,
}));

// next-intl/server.getTranslations() needs request scope; provide a light
// mock that maps namespaced keys to the vi.json message tree.
vi.mock('next-intl/server', () => ({
  getTranslations: async (namespace?: string) => {
    return (key: string) => {
      const path = namespace ? `${namespace}.${key}` : key;
      let cur: unknown = viMessages;
      for (const segment of path.split('.')) {
        if (cur && typeof cur === 'object' && segment in cur) {
          cur = (cur as Record<string, unknown>)[segment];
        } else {
          return path;
        }
      }
      return typeof cur === 'string' ? cur : path;
    };
  },
}));

async function loadPage() {
  const mod = await import('@/app/prelaunch/page');
  return mod;
}

function wrapWithIntl(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  supabaseSpy.from.mockClear();
  supabaseSpy.auth.getUser.mockClear();
  vi.resetModules();
});

describe('PrelaunchPage — Server Component SSR', () => {
  it('renders the headline + three real-digit tiles when env is in the future (US1)', async () => {
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', '2030-01-01T00:00:00Z');
    const { default: PrelaunchPage, metadata } = await loadPage();
    const tree = await PrelaunchPage();
    render(wrapWithIntl(tree));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      viMessages.prelaunch.heading,
    );
    const tiles = screen.getAllByTestId('countdown-value');
    expect(tiles).toHaveLength(3);
    // Initial render is server-truth: each tile shows a real two-digit value,
    // not the `--` placeholder.
    for (const tile of tiles) {
      expect(tile.textContent).toMatch(/^\d{2}$/);
    }

    // metadata.robots check (FR-014)
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it('renders -- placeholders when env is unset (FR-009 + decision #6)', async () => {
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', '');
    const { default: PrelaunchPage } = await loadPage();
    const tree = await PrelaunchPage();
    render(wrapWithIntl(tree));
    expect(screen.getAllByTestId('countdown-value').map((t) => t.textContent)).toEqual([
      '--',
      '--',
      '--',
    ]);
  });

  it('renders -- placeholders when env is in the past (decision #11)', async () => {
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', '2020-01-01T00:00:00Z');
    const { default: PrelaunchPage } = await loadPage();
    const tree = await PrelaunchPage();
    render(wrapWithIntl(tree));
    expect(screen.getAllByTestId('countdown-value').map((t) => t.textContent)).toEqual([
      '--',
      '--',
      '--',
    ]);
  });

  it('renders -- placeholders when env is unparseable (FR-009)', async () => {
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', 'not-a-date');
    const { default: PrelaunchPage } = await loadPage();
    const tree = await PrelaunchPage();
    render(wrapWithIntl(tree));
    expect(screen.getAllByTestId('countdown-value').map((t) => t.textContent)).toEqual([
      '--',
      '--',
      '--',
    ]);
  });

  it('does not invoke the Supabase server client during render (TR-002)', async () => {
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', '2030-01-01T00:00:00Z');
    const { default: PrelaunchPage } = await loadPage();
    const tree = await PrelaunchPage();
    render(wrapWithIntl(tree));
    expect(supabaseSpy.from).not.toHaveBeenCalled();
    expect(supabaseSpy.auth.getUser).not.toHaveBeenCalled();
  });

  it('the <main> element has tabIndex=-1 as the only focusable landing target (FR-015)', async () => {
    vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', '2030-01-01T00:00:00Z');
    const { default: PrelaunchPage } = await loadPage();
    const tree = await PrelaunchPage();
    const { container } = render(wrapWithIntl(tree));
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute('tabindex', '-1');
    // No buttons, links, or form fields should exist.
    expect(
      container.querySelectorAll(
        'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).toHaveLength(0);
  });
});
