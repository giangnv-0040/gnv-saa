import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// -----------------------------------------------------------------------------
// jsdom polyfills
// -----------------------------------------------------------------------------
// jsdom lacks some browser APIs we use in client components. Provide minimal
// stubs that satisfy the surface area we exercise in tests. Tests that need
// richer behaviour mock these per-test via `vi.spyOn` / `vi.stubGlobal`.
// -----------------------------------------------------------------------------

// `IntersectionObserver` — used by AwardsSidebarNav for scrollspy. The stub
// records observed targets so tests can manually trigger callbacks if needed.
class IntersectionObserverStub {
  // Stored callback — tests can `(obs as any).trigger(entries)` to fire it.
  private readonly callback: IntersectionObserverCallback;
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe(): void {
    /* no-op */
  }
  unobserve(): void {
    /* no-op */
  }
  disconnect(): void {
    /* no-op */
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  // Test helper — manually fire the callback with synthetic entries.
  trigger(entries: IntersectionObserverEntry[]): void {
    this.callback(entries, this as unknown as IntersectionObserver);
  }
}

// Define directly on globalThis (not via `vi.stubGlobal`) so per-test calls
// to `vi.unstubAllGlobals()` don't accidentally remove the polyfill.
(
  globalThis as unknown as { IntersectionObserver: typeof IntersectionObserverStub }
).IntersectionObserver = IntersectionObserverStub;

// `window.matchMedia` — used by AwardsSidebarNav to detect
// `prefers-reduced-motion`. Default to `matches: false`; tests can override.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// `Element.prototype.scrollIntoView` — jsdom implements it as a no-op but
// some setups don't. Ensure it's defined so calls don't throw.
if (typeof Element !== 'undefined' && typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = () => {};
}
