import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { AwardsSidebarNav } from '@/components/organisms/awards/AwardsSidebarNav';
import { awards } from '@/lib/awards/config';
import viMessages from '@/messages/vi.json';

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

const scrollIntoView = vi.fn();
const replaceState = vi.fn();

beforeEach(() => {
  scrollIntoView.mockReset();
  replaceState.mockReset();

  // Insert 6 dummy <section> elements matching the award slugs so
  // `document.getElementById(slug)` resolves.
  awards.forEach((a) => {
    const section = document.createElement('section');
    section.id = a.slug;
    Object.defineProperty(section, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: scrollIntoView,
    });
    document.body.appendChild(section);
  });

  // Reset hash before each test (using the REAL replaceState, before we spy).
  window.history.replaceState(null, '', '/');

  // Spy that records calls AND performs the real navigation so
  // `window.location.hash` updates as expected in jsdom.
  const realReplaceState = window.history.replaceState.bind(window.history);
  vi.spyOn(window.history, 'replaceState').mockImplementation((...args) => {
    replaceState(...args);
    realReplaceState(...(args as Parameters<typeof window.history.replaceState>));
  });
});

afterEach(() => {
  document.querySelectorAll('section[id]').forEach((s) => s.remove());
  vi.restoreAllMocks();
});

describe('<AwardsSidebarNav> — render', () => {
  it('renders 6 items in catalogue order from awards.config.ts', () => {
    render(wrap(<AwardsSidebarNav />));
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(6);
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toEqual(awards.map((a) => `#${a.slug}`));
  });

  it('exposes a <nav> landmark with the sidebar aria-label', () => {
    const { container } = render(wrap(<AwardsSidebarNav />));
    const nav = container.querySelector('nav');
    expect(nav).toHaveAttribute('aria-label', viMessages.awardsPage.sidebarAriaLabel);
  });

  it('marks the first item active by default (no hash)', () => {
    render(wrap(<AwardsSidebarNav />));
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('aria-current', 'location');
    links.slice(1).forEach((l) => expect(l).not.toHaveAttribute('aria-current'));
  });
});

describe('<AwardsSidebarNav> — click interaction', () => {
  it('clicking an item updates active state, scrolls, and replaces URL hash', async () => {
    render(wrap(<AwardsSidebarNav />));
    const mvpLink = screen.getAllByRole('link')[5];

    await userEvent.click(mvpLink);

    expect(scrollIntoView).toHaveBeenCalledOnce();
    expect(scrollIntoView.mock.calls[0][0]).toMatchObject({ behavior: 'smooth', block: 'start' });
    expect(replaceState).toHaveBeenCalledWith(null, '', '#mvp');
    expect(mvpLink).toHaveAttribute('aria-current', 'location');
  });

  it('uses behavior:"instant" when prefers-reduced-motion is set', async () => {
    // Override the default matchMedia stub to return matches:true for the
    // reduced-motion query.
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));
    render(wrap(<AwardsSidebarNav />));
    await userEvent.click(screen.getAllByRole('link')[2]);
    expect(scrollIntoView.mock.calls[0][0]).toMatchObject({ behavior: 'instant' });
    vi.unstubAllGlobals();
  });

  it('only one item is active at a time after a click (FR-009)', async () => {
    render(wrap(<AwardsSidebarNav />));
    await userEvent.click(screen.getAllByRole('link')[3]);
    const activeLinks = screen.getAllByRole('link').filter((l) => l.hasAttribute('aria-current'));
    expect(activeLinks).toHaveLength(1);
    expect(activeLinks[0]).toHaveTextContent('Best Manager');
  });
});

describe('<AwardsSidebarNav> — initial hash on mount (US3)', () => {
  it('reads window.location.hash and scrolls to the matching section', async () => {
    window.history.replaceState(null, '', '#mvp');
    await act(async () => {
      render(wrap(<AwardsSidebarNav />));
    });
    expect(scrollIntoView).toHaveBeenCalledOnce();
    expect(screen.getAllByRole('link')[5]).toHaveAttribute('aria-current', 'location');
  });

  it('unknown hash falls back to first slug active and does NOT scroll (Test ID-13)', async () => {
    window.history.replaceState(null, '', '#unknown-slug');
    await act(async () => {
      render(wrap(<AwardsSidebarNav />));
    });
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(screen.getAllByRole('link')[0]).toHaveAttribute('aria-current', 'location');
  });

  it('empty hash keeps the first slug active and does NOT scroll', async () => {
    window.history.replaceState(null, '', '/');
    await act(async () => {
      render(wrap(<AwardsSidebarNav />));
    });
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(screen.getAllByRole('link')[0]).toHaveAttribute('aria-current', 'location');
  });
});
