# Research: Hệ thống giải / Awards Information

**Frame**: `zFYDgyj_pD-he-thong-giai`
**Date**: 2026-05-14
**Spec**: `specs/zFYDgyj_pD-he-thong-giai/spec.md`

---

## Purpose

This screen is the second authenticated screen in the SAA project and a direct extension of Homepage SAA. Most of the foundational work — auth wiring, i18n, shared chrome (header/footer), awards catalogue, design tokens — is **already in place** from Homepage SAA. The plan therefore focuses on **composition + one new client island (sidebar scrollspy) + a static data file**.

---

## Codebase Analysis

### Existing Patterns Identified

#### Component Patterns

| Pattern                                                                  | Location                                                                                                                                                             | Relevance                                                                  |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Server-Component page with parallel data fetch                           | [app/page.tsx](app/page.tsx)                                                                                                                                         | Direct template for `app/awards/page.tsx`                                  |
| Dark-themed wrapper around below-hero content                            | [app/page.tsx](app/page.tsx) (line ~38)                                                                                                                              | Same wrapper pattern for Awards page                                       |
| Atomic structure for organism + molecule + atom under `components/`      | [components/organisms/homepage/](components/organisms/homepage/)                                                                                                     | Mirror under `components/organisms/awards/`                                |
| `'use client'` interactive island with `useEffect` + outside-click + Esc | [components/molecules/LanguageSwitcher.tsx](components/molecules/LanguageSwitcher.tsx), [components/molecules/ProfileMenu.tsx](components/molecules/ProfileMenu.tsx) | Template for `AwardsSidebarNav`'s scrollspy guard + keyboard semantics     |
| Anchor-link nav with active-state via `usePathname`                      | [components/atoms/NavLink.tsx](components/atoms/NavLink.tsx)                                                                                                         | Closest precedent; our sidebar items are similar but use HASH not pathname |

#### API / Server-Action Patterns

| Pattern                                                    | Location                                                     | Relevance                                                             |
| ---------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------- |
| `getCurrentUserProfile()` Server Action with soft fallback | [lib/users/actions.ts](lib/users/actions.ts)                 | Reused as-is for header user fetch                                    |
| `getUnreadCount()` stub returning 0                        | [lib/notifications/actions.ts](lib/notifications/actions.ts) | Reused as-is for bell badge                                           |
| Middleware `isProtectedPath()` extension                   | [middleware.ts](middleware.ts)                               | Add `/awards` here; same pattern returns true for an exact-match list |
| Static config + i18n keys for catalogue data               | [lib/awards/config.ts](lib/awards/config.ts)                 | Extend pattern for `lib/awards/details.ts`                            |

#### Testing Patterns

| Pattern                                   | Location                                                                                   | Relevance                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| Vitest `vi.mock('@/lib/supabase/server')` | [tests/unit/lib/users/actions.test.ts](tests/unit/lib/users/actions.test.ts)               | Reuse for awards page integration tests if needed |
| Co-located unit tests per component       | [tests/unit/components/](tests/unit/components/)                                           | Mirror with `AwardsSidebarNav.test.tsx`, etc.     |
| Playwright auth fixtures                  | [tests/e2e/fixtures/auth.ts](tests/e2e/fixtures/auth.ts)                                   | Reuse for `awards.spec.ts` (auth-gated screen)    |
| `messages-parity.test.ts`                 | [tests/unit/lib/i18n/messages-parity.test.ts](tests/unit/lib/i18n/messages-parity.test.ts) | Automatically picks up new `awardsPage.*` keys    |

---

## Reusable Components

### Components to Leverage

| Component                          | Path                                                                                                       | Usage in Feature                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `HomepageHeader`                   | [components/organisms/homepage/HomepageHeader.tsx](components/organisms/homepage/HomepageHeader.tsx)       | Same component, same props (user, unreadCount, locale)        |
| `KudosPromoSection`                | [components/organisms/homepage/KudosPromoSection.tsx](components/organisms/homepage/KudosPromoSection.tsx) | Reuse identically at the bottom of the page                   |
| `AppFooter`                        | [components/organisms/AppFooter.tsx](components/organisms/AppFooter.tsx)                                   | `variant="homepage"` reused                                   |
| Existing arrow + bell + flag icons | [public/assets/homepage/icons/](public/assets/homepage/icons/)                                             | No new icons needed; `arrow-up-right.svg` uses `currentColor` |

### Hooks / Helpers to Leverage

| Helper                            | Path                                                                                     | Usage in Feature                                                    |
| --------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `getCurrentUserProfile()`         | [lib/users/actions.ts](lib/users/actions.ts)                                             | Page header data                                                    |
| `getUnreadCount()`                | [lib/notifications/actions.ts](lib/notifications/actions.ts)                             | Header bell badge                                                   |
| `ROUTES` + `awardDeepLink()`      | [lib/routes.ts](lib/routes.ts)                                                           | Already includes `AWARDS = '/awards'` and `awardDeepLink(slug)`     |
| `Award` type + `awards` catalogue | [lib/awards/types.ts](lib/awards/types.ts), [lib/awards/config.ts](lib/awards/config.ts) | Single source of truth for the 6 slugs                              |
| `isLocale` + `defaultLocale`      | [lib/i18n/config.ts](lib/i18n/config.ts)                                                 | Locale resolution in the page                                       |
| `padTwoDigits()`                  | [lib/event/countdown.ts](lib/event/countdown.ts)                                         | NOT used here — quantity strings are pre-padded in `details.ts`     |
| Logger                            | [lib/logger.ts](lib/logger.ts)                                                           | Use only if debugging the scrollspy timing (unlikely in production) |

### Services to Leverage

| Service             | Path                                                                       | Usage in Feature                                      |
| ------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------- |
| Supabase Auth (SSR) | `@supabase/ssr`                                                            | Middleware uses the existing `updateSession()` helper |
| next-intl messages  | [messages/vi.json](messages/vi.json), [messages/en.json](messages/en.json) | Extend with `awardsPage.*` key tree                   |

---

## Integration Points

### APIs to Connect

| API / Source                            | Method          | Current Status                                            | Notes                                |
| --------------------------------------- | --------------- | --------------------------------------------------------- | ------------------------------------ |
| `getCurrentUserProfile()` Server Action | RSC             | **Exists** ([lib/users/actions.ts](lib/users/actions.ts)) | Reused                               |
| `getUnreadCount()` Server Action        | client → action | **Exists** (stub)                                         | Reused                               |
| Static `lib/awards/details.ts`          | RSC import      | **New**                                                   | The page's content source            |
| Middleware session check                | edge            | **Exists**                                                | Add `/awards` to `isProtectedPath()` |

### Database Entities

| Entity        | Table          | Status     | Notes                                         |
| ------------- | -------------- | ---------- | --------------------------------------------- |
| User profile  | `public.users` | **Exists** | Used by middleware + header                   |
| Awards detail | none           | **N/A**    | Static data in `lib/awards/details.ts`; no DB |

### External Services

| Service                      | Purpose        | Integration Method                     |
| ---------------------------- | -------------- | -------------------------------------- |
| Supabase Auth (Google OAuth) | Auth gate      | Existing middleware; no change         |
| Figma (via MoMorph MCP)      | Asset download | Phase 0: 1 keyvisual + 6 detail images |

---

## Potential Challenges

### Technical Challenges

| Challenge                                                                           | Impact | Proposed Solution                                                                                                                                                     |
| ----------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sidebar scrollspy race with click-initiated smooth scroll                           | Medium | 250 ms `isProgrammaticScroll` guard suppresses scrollspy updates during the click-triggered animation; cleared via `setTimeout`                                       |
| `IntersectionObserver` not available in jsdom                                       | Medium | Stub in `tests/setup.ts` — minimal `class IntersectionObserver { observe() {} disconnect() {} }` polyfill is sufficient; tests directly assert state-update reactions |
| Sticky sidebar layout on different viewport sizes                                   | Low    | Use `lg:sticky lg:top-…` only on viewports ≥1024 px; on mobile/tablet the sidebar renders inline above the content                                                    |
| Pixel-perfect rendering of the 6 detail cards without explicit Figma styles in spec | Medium | Implementer fetches detail-card styles via `query_section` on demand (Constitution-aligned); design tokens from `globals.css` cover surface + radius + spacing        |
| Keyboard focus management after smooth scroll                                       | Low    | After click handler completes, call `targetSection.querySelector('h2')?.focus()` (with `tabIndex={-1}` on heading)                                                    |
| URL hash sync via `replaceState` does not trigger React re-render                   | n/a    | Intentional — state is local; we explicitly `setActiveSlug()` after `replaceState`                                                                                    |
| Initial-hash mismatch between server render and client-only `window.location.hash`  | Medium | Defer scrollspy + hash read to a `useEffect` that runs only on the client; server renders with the first award active by default, client corrects on hydration        |

### Integration Challenges

| Challenge                                                                                                        | Impact | Proposed Solution                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Adding `/awards` to protected list could break Homepage SAA's link if user is anonymous and clicks an award card | Medium | This is the **intended** UX per Test ID-1. Homepage SAA's `awardDeepLink()` already targets `/awards#{slug}` and the middleware will redirect to `/login?redirectTo=/awards#{slug}` — the user signs in then lands directly on the awards page with the correct hash. Verify with E2E. |
| Locale switch + URL hash preservation                                                                            | Low    | `setLocale` triggers `revalidatePath('/', 'layout')`; the browser keeps the hash naturally; verify with manual + E2E                                                                                                                                                                   |
| Replacing the existing `Coming soon` placeholder at `app/awards/page.tsx`                                        | Low    | The placeholder is a 5-LoC `ComingSoon` render; rewrite is straightforward                                                                                                                                                                                                             |

---

## Recommendations

### Architecture Recommendations

1. **Mirror the Homepage SAA pattern**: Server Component page + dark wrapper + one client island. Resist the temptation to add additional client components for the keyvisual or detail cards — they don't need interactivity.
2. **Keep `lib/awards/details.ts` deliberately flat**: a single `Record<slug, AwardDetail>` makes the slug parity test trivial. No nesting, no class wrappers.
3. **Make `AwardsSidebarNav` consume the `awards` array from config** (single source of truth), NOT a separate sidebar list. Mismatches are then impossible by construction.
4. **Use `<a href="#{slug}">` for sidebar items** (not `<button>`) so the page works without JavaScript (anchor scroll fallback) and integrates with the browser's history naturally.

### Implementation Recommendations

1. **Start with**: Phase 0 (assets + middleware) — these unblock both the unit tests and the integration tests.
2. **Then**: Phase 1 (foundation) — `AwardDetail` interface, `lib/awards/details.ts`, i18n keys. These have no UI dependencies and can be tested independently.
3. **Leverage**: Existing dropdown pattern from `LanguageSwitcher` for the scrollspy guard semantics (`useEffect` + cleanup). Reuse the `IntersectionObserver` polyfill from any existing test setup if one exists, otherwise add it once.
4. **Avoid**:
   - Reinventing the slug/order list in the sidebar — iterate `awards` from config.
   - Hard-coding the Vietnamese strings — use `lib/awards/details.ts` for `unit`/`value`, but put long descriptions in the i18n catalogue.
   - Adding a scroll listener fallback — `IntersectionObserver` has ≥97% browser support and the project's browser-support policy is "latest two stable" (Constitution §Tech Stack & Constraints).

### Testing Recommendations

1. **Focus on**: sidebar scrollspy behaviour (this is the bulk of the new logic). Unit tests cover click + initial hash + unknown hash + reduced motion. Integration test confirms the page renders correctly for an authenticated user.
2. **Mock**: `IntersectionObserver`, `matchMedia`, `window.history.replaceState` in `tests/setup.ts` (or per-test).
3. **E2E scenarios**:
   - Anonymous → `/awards` → redirect to `/login?redirectTo=/awards`.
   - Authenticated → `/awards#mvp` → MVP section in view on mount.
   - Click each of 6 sidebar items → active state + scroll.
   - `prefers-reduced-motion` → instant scroll.
   - `axe` accessibility scan returns 0 violations.

---

## Files to Review Before Implementation

### Must Read

- [x] [.momorph/constitution.md](.momorph/constitution.md) — §II (Server Components default) + §III (a11y + responsive) + §V (TDD).
- [x] [.momorph/guidelines/frontend.md](.momorph/guidelines/frontend.md) — Tailwind tokens + URL/navigation rules.
- [x] [.momorph/specs/i87tDx10uM-homepage-saa/spec.md](.momorph/specs/i87tDx10uM-homepage-saa/spec.md) — Defines the slug contract this screen consumes.
- [x] [middleware.ts](middleware.ts) — The single line to modify (`isProtectedPath`).
- [x] [app/page.tsx](app/page.tsx) — The template the awards page composition follows.
- [x] [components/organisms/homepage/HomepageHeader.tsx](components/organisms/homepage/HomepageHeader.tsx) — Reused as-is.
- [x] [components/organisms/homepage/KudosPromoSection.tsx](components/organisms/homepage/KudosPromoSection.tsx) — Reused as-is.
- [x] [lib/awards/config.ts](lib/awards/config.ts) — Slug catalogue (read-only here).
- [x] [.momorph/contexts/screen_specs/he-thong-giai.md](.momorph/contexts/screen_specs/he-thong-giai.md) — Screen flow detail (layout, navigation, components, API mapping).

### Recommended

- [ ] [components/molecules/LanguageSwitcher.tsx](components/molecules/LanguageSwitcher.tsx) — outside-click + Esc + focus management template (the sidebar reuses this pattern lightly).
- [ ] [tests/integration/LoginPage.test.tsx](tests/integration/LoginPage.test.tsx) — RSC + intl integration test pattern.
- [ ] [tests/e2e/login.spec.ts](tests/e2e/login.spec.ts) — Auth fixture usage; mirror for `awards.spec.ts`.

---

## Open Questions

> Resolved during `reviewspecify` — see plan §Resolved Decisions. Remaining items are tactical.

- [ ] **Sticky-sidebar breakpoint**: `lg:` (default) or `xl:`? Implementer to lock based on Figma desktop preview.
- [ ] **`signature-2025-creator` value rendering**: single combined string or two visible rows? Plan defaults to combined; defer to design review.
- [ ] **Hash preservation on locale switch**: should work via browser default; verify in E2E.

---

## Notes

- The codebase is healthy for this feature: every shared dependency (header, footer, awards config, routes, middleware) is already in place. No new runtime libraries are introduced.
- The only architectural novelty is the IntersectionObserver-based scrollspy — well-understood pattern, no third-party scroll-spy libraries needed.
- Asset paths follow the same pattern as Homepage SAA's `public/assets/homepage/` tree, with a parallel `public/assets/awards/` tree for the per-award detail images. Header/footer logos remain under `public/assets/homepage/` (shared across screens).
- The page is implicitly **larger client bundle than Homepage SAA** by exactly one new client component (`AwardsSidebarNav`). All other components are Server Components.
- After implementation, the placeholder route `app/awards/page.tsx` is replaced. The other 7 placeholders (`/kudos`, `/profile`, etc.) remain `Coming soon` until their own specs ship.
