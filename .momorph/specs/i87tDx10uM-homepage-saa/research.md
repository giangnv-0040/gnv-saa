# Research: Homepage SAA

**Frame**: `i87tDx10uM-homepage-saa`
**Date**: 2026-05-13
**Spec**: `specs/i87tDx10uM-homepage-saa/spec.md`

---

## Purpose

Findings from auditing the existing codebase before locking the implementation plan. The audit confirms that **most of the infrastructure the homepage needs already exists** (Supabase SSR, next-intl, shared header/footer, language switcher, Vitest+Playwright). The plan therefore focuses on _composition_ of new homepage organisms rather than rebuilding plumbing.

---

## Codebase Analysis

### Existing Patterns Identified

#### Component Patterns

| Pattern                                     | Location                                                                                                                                       | Relevance                                                                  |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Outside-click + ESC + roving-focus dropdown | [components/molecules/LanguageSwitcher.tsx](components/molecules/LanguageSwitcher.tsx)                                                         | **Template** for `NotificationOverlay`, `ProfileMenu`, `QuickActionWidget` |
| Server Component with Supabase session read | [app/page.tsx](app/page.tsx)                                                                                                                   | Pattern to extend; current stub redirects unauth — needs reversal          |
| Async layout reading locale + messages      | [app/layout.tsx](app/layout.tsx)                                                                                                               | Already wires `NextIntlClientProvider`; nothing to change                  |
| Shared "slot-pattern" header                | [components/organisms/AppHeader.tsx](components/organisms/AppHeader.tsx)                                                                       | Extend with optional `nav?: ReactNode` + `controls?: ReactNode` slots      |
| Atomic structure                            | [components/atoms/Button.tsx](components/atoms/Button.tsx), [Spinner](components/atoms/Spinner.tsx), [FlagIcon](components/atoms/FlagIcon.tsx) | Mirror this layering for new atoms (BellIcon, UnreadBadge, NavLink)        |

#### API Patterns

| Pattern                                          | Location                                                                                                         | Relevance                                                                                                |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Server Action with Zod validation + cookie write | [lib/i18n/actions.ts](lib/i18n/actions.ts)                                                                       | **Canonical example** — use the same shape for `lib/notifications/actions.ts` and `lib/users/actions.ts` |
| Server-only Supabase SSR client                  | [lib/supabase/server.ts](lib/supabase/server.ts)                                                                 | Reuse `createServerClient()` in `getCurrentUserProfile()`                                                |
| Service-role client (gated by env presence)      | [lib/supabase/server.ts](lib/supabase/server.ts):43                                                              | Only for admin code paths; **not** used by homepage                                                      |
| Trust-boundary input validation                  | [lib/validation/auth.ts](lib/validation/auth.ts), [lib/validation/common.ts](lib/validation/common.ts)           | Pattern for any new schemas (none needed at MVP)                                                         |
| Route Handler for session lifecycle              | [app/auth/signout/route.ts](app/auth/signout/route.ts), [app/auth/callback/route.ts](app/auth/callback/route.ts) | Reuse `/auth/signout` from ProfileMenu's Sign-out form                                                   |
| Middleware session refresh                       | [middleware.ts](middleware.ts), [lib/supabase/middleware.ts](lib/supabase/middleware.ts)                         | Touch `isProtectedPath` (remove `/`) — keep `updateSession` running                                      |

#### Testing Patterns

| Pattern                            | Location                                                                                                 | Relevance                                                                    |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Vitest jsdom setup                 | [tests/setup.ts](tests/setup.ts)                                                                         | Already configured                                                           |
| Co-located unit tests by category  | [tests/unit/components/](tests/unit/components/), [tests/unit/lib/](tests/unit/lib/)                     | Mirror with `tests/unit/components/{Countdown*,AwardCard,...}.test.tsx`      |
| Integration tests for App pages    | [tests/integration/LoginPage.test.tsx](tests/integration/LoginPage.test.tsx)                             | Template for `tests/integration/homepage-{anonymous,authenticated}.test.tsx` |
| Playwright auth fixtures + helpers | [tests/e2e/fixtures/auth.ts](tests/e2e/fixtures/auth.ts), [tests/helpers/seed.ts](tests/helpers/seed.ts) | Reuse for E2E auth paths in US3                                              |
| Existing E2E baseline              | [tests/e2e/login.spec.ts](tests/e2e/login.spec.ts)                                                       | Pattern to follow for `tests/e2e/homepage.spec.ts`                           |

---

## Reusable Components

### Components to Leverage

| Component          | Path                                                                                   | Usage in Feature                                                            |
| ------------------ | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `AppHeader`        | [components/organisms/AppHeader.tsx](components/organisms/AppHeader.tsx)               | Compose richer `HomepageHeader` via slots; **DO NOT** duplicate             |
| `AppFooter`        | [components/organisms/AppFooter.tsx](components/organisms/AppFooter.tsx)               | Add `variant='homepage'` for the multi-link footer                          |
| `LanguageSwitcher` | [components/molecules/LanguageSwitcher.tsx](components/molecules/LanguageSwitcher.tsx) | Reuse as-is; **narrow locale list** to vi/en via `lib/i18n/config.ts`       |
| `Button`           | [components/atoms/Button.tsx](components/atoms/Button.tsx)                             | Use for "ABOUT AWARDS" / "ABOUT KUDOS" CTAs and the "Chi tiết" Kudos button |
| `Spinner`          | [components/atoms/Spinner.tsx](components/atoms/Spinner.tsx)                           | Use only if NotificationOverlay shows loading state                         |
| `FlagIcon`         | [components/atoms/FlagIcon.tsx](components/atoms/FlagIcon.tsx)                         | Reused indirectly by `LanguageSwitcher`; no direct usage                    |

### Hooks / Helpers to Leverage

| Helper                 | Path                                                     | Usage in Feature                                                                |
| ---------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `createServerClient()` | [lib/supabase/server.ts](lib/supabase/server.ts)         | Page-level user fetch (Server Component)                                        |
| `updateSession()`      | [lib/supabase/middleware.ts](lib/supabase/middleware.ts) | Continues to run on all matched paths                                           |
| `setLocale()`          | [lib/i18n/actions.ts](lib/i18n/actions.ts)               | Powers LanguageSwitcher; nothing to change                                      |
| `isLocale()`           | [lib/i18n/config.ts](lib/i18n/config.ts)                 | Type guard; reuse if any anonymous-locale parsing is needed                     |
| `localeSchema`         | [lib/validation/auth.ts](lib/validation/auth.ts)         | **Narrow** to `['vi','en']`                                                     |
| `redirectToSchema`     | [lib/auth/safe-redirect.ts](lib/auth/safe-redirect.ts)   | Not needed by homepage but exists for the Sign-in CTA's `redirectTo`            |
| Logger                 | [lib/logger.ts](lib/logger.ts)                           | Use for graceful-fallback warnings (e.g., invalid `NEXT_PUBLIC_EVENT_START_AT`) |

### Services to Leverage

| Service             | Path                   | Usage in Feature                                         |
| ------------------- | ---------------------- | -------------------------------------------------------- |
| Supabase Auth (SSR) | `@supabase/ssr`        | Already wired; no new client needed                      |
| next-intl messages  | [messages/](messages/) | Extend `vi.json` and `en.json`; `ja.json` left untouched |

---

## Integration Points

### APIs to Connect

| API Endpoint / Action                             | Method          | Current Status                                                      | Notes                           |
| ------------------------------------------------- | --------------- | ------------------------------------------------------------------- | ------------------------------- |
| `getCurrentUserProfile()` Server Action           | RSC             | **New** (`lib/users/actions.ts`)                                    | Replaces spec's `/api/users/me` |
| `getUnreadCount()` Server Action                  | client → action | **New** (`lib/notifications/actions.ts`)                            | Stub returns 0                  |
| `getRecentNotifications({ limit })` Server Action | client → action | **New** (`lib/notifications/actions.ts`)                            | Stub returns `[]`               |
| `/auth/signout`                                   | POST            | **Exists** ([app/auth/signout/route.ts](app/auth/signout/route.ts)) | Reused by ProfileMenu sign-out  |
| `setLocale(locale)` Server Action                 | client → action | **Exists** ([lib/i18n/actions.ts](lib/i18n/actions.ts))             | Reused by LanguageSwitcher      |
| Build-time env var `NEXT_PUBLIC_EVENT_START_AT`   | env             | **New**                                                             | Document in `.env.example`      |

### Database Entities

| Entity          | Table                         | Status                                                                                                            | Notes                                                    |
| --------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| User profile    | `public.users`                | **Exists** ([supabase/migrations/20260511000001_init_auth.sql](supabase/migrations/20260511000001_init_auth.sql)) | Add `role` enum column via new migration                 |
| Auth allow-list | `public.auth_allowed_domains` | Exists                                                                                                            | No change needed                                         |
| Notifications   | `public.notifications`        | **Deferred**                                                                                                      | Owned by the Notifications spec, not this feature        |
| Awards          | none                          | N/A                                                                                                               | Static catalogue in `lib/awards/config.ts`; no DB entity |
| Event config    | none                          | N/A                                                                                                               | Build-time env var only                                  |

### External Services

| Service                      | Purpose        | Integration Method                                |
| ---------------------------- | -------------- | ------------------------------------------------- |
| Supabase Auth (Google OAuth) | Sign-in flow   | Existing — homepage just reads session            |
| Figma (via MoMorph MCP)      | Asset download | `list_media_nodes` + `get_media_files` at Phase 0 |

---

## Potential Challenges

### Technical Challenges

| Challenge                                                                                     | Impact | Proposed Solution                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pixel-perfect hero rendering with multiple background art layers + huge ROOT FURTHER logotype | Medium | Use `next/image` with `priority` and AVIF/WebP variants; consume design tokens for placement; LCP budget < 2.5 s                                                                          |
| Countdown anti-spam in `aria-live` regions                                                    | Medium | Use `aria-live="polite"`; announce only on minute change (not on every render); unit test the announcement frequency                                                                      |
| Anonymous vs. authenticated SSR rendering of the same page (no flash of wrong UI)             | High   | Render decision in Server Component; conditional branches at JSX level; integration test snapshots for both modes                                                                         |
| Locale narrowing without breaking Login (which uses 3 locales today)                          | Low    | Narrowing only the dropdown options would be safer; but Constitution favors single source of truth → narrow project-wide. Cookie-sanitizer ensures stale `'ja'` cookies don't 500 the app |
| Hash-based navigation to `/awards#{slug}` while `/awards` is rendered by Server Component     | Low    | `next/link` preserves hash; browser handles the scroll; verify with E2E once Awards Information ships                                                                                     |
| Tab-backgrounded countdown drift                                                              | Low    | Always recompute remaining time from `Date.now()` on every tick; never accumulate                                                                                                         |

### Integration Challenges

| Challenge                                                                                                               | Impact | Proposed Solution                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Middleware currently redirects anonymous traffic from `/` to `/login`                                                   | High   | Remove `/` from `isProtectedPath()` in [middleware.ts](middleware.ts); session refresh still runs on the matched paths                                                                         |
| Hover/elevation styling intersects with existing reduced-motion media query                                             | Low    | Existing `@media (prefers-reduced-motion: reduce)` block in `globals.css` already neuters transitions globally — hover effect must use `transition-*` utilities (not `animation-*`) to inherit |
| Existing `LanguageSwitcher` lives in the AppHeader's slot — homepage needs Nav links between Logo and the controls slot | Medium | Extend `AppHeader` to add an optional `nav` slot between logo and the existing right-aligned `children` slot — keep `children` semantics for Login                                             |

---

## Recommendations

### Architecture Recommendations

1. **Compose, don't replace, the shared shell.** Extend `AppHeader` with optional `nav` + `controls` slots rather than introducing a parallel `HomepageHeader.tsx` that duplicates the logo/structure. Login keeps its slim header; Homepage composes a richer one.
2. **Server Components by default.** Resist the temptation to add TanStack Query or Zustand for a screen whose "global state" amounts to `(user, unreadCount)`. RSC + Server Actions handle this naturally and align with Constitution §II.
3. **Static awards catalogue.** Store the 6 categories in `lib/awards/config.ts` as a frozen array; this is the single source of truth for slugs that will be honored by Awards Information.
4. **Defer notifications data.** Ship the homepage with stubbed notification services. Plug in real data when `Tất cả thông báo` (`6-1LRz3vqr`) ships — zero UI changes required.
5. **One migration in this feature.** Add `role` to `public.users`; resist adding `notifications` here (out of scope).

### Implementation Recommendations

1. **Start with**: Phase 0 (assets + migration + env var). Without these, downstream phases will block.
2. **Then**: Phase 1 (foundation) — i18n + awards catalogue + event helper + services + locale narrowing. Each item has its own test file; the parallelization opportunities are obvious (i18n keys, awards config, event helper are all independent).
3. **Leverage**: `LanguageSwitcher` outside-click / ESC pattern when building `NotificationOverlay`, `ProfileMenu`, and `QuickActionWidget`. Three near-identical patterns; consider extracting a `usePopoverDismiss(ref, openState)` hook only if the duplication smells.
4. **Avoid**:
   - Hard-coded hex/px in any new component file (Constitution §I §II).
   - Direct calls to `process.env` outside `lib/event/config.ts` (centralize env reads to enable testing via `vi.stubEnv`).
   - Adding TanStack Query / Zustand "just in case".
   - Adding `useEffect`-driven data fetching to a screen that can fetch in the Server Component.

### Testing Recommendations

1. **Focus on**: countdown logic (pure function, easy to time-travel), award navigation (deep links work), role-aware profile menu (each branch covered), anonymous vs. authenticated SSR snapshots, accessibility (axe in E2E).
2. **Mock**: Supabase client in unit tests; date/time via `vi.useFakeTimers()`. **Do not mock** in integration tests — use the local Supabase stack.
3. **E2E scenarios**:
   - US1 — anonymous user clicks "Top Talent" → lands on `/awards#top-talent`.
   - US2 — countdown ticks correctly over a 5-minute window; invalid env var fallback.
   - US3 — admin sees Admin Dashboard; regular user does not; sign-out → `/login`.
   - US4 — `VN` → `EN` switch updates all visible labels and persists across reload.
   - US5 — widget opens overlay with 2 actions; ESC closes.
   - US6 — every header/footer link resolves (no 4xx).
   - **Accessibility** — `axe` passes AA across the page.

---

## Files to Review Before Implementation

### Must Read

- [x] [.momorph/constitution.md](.momorph/constitution.md) — Principle II (Server Components default) + Principle V (TDD).
- [x] [.momorph/guidelines/frontend.md](.momorph/guidelines/frontend.md) — Tailwind + design tokens + URL/navigation rules.
- [x] [.momorph/guidelines/backend.md](.momorph/guidelines/backend.md) — Controllers vs. Services boundary.
- [x] [components/molecules/LanguageSwitcher.tsx](components/molecules/LanguageSwitcher.tsx) — outside-click + ESC pattern template.
- [x] [lib/i18n/actions.ts](lib/i18n/actions.ts) — Server Action shape.
- [x] [lib/supabase/server.ts](lib/supabase/server.ts) — RSC client + service-role gate.
- [x] [middleware.ts](middleware.ts) — protection matcher (change this).
- [x] [supabase/migrations/20260511000001_init_auth.sql](supabase/migrations/20260511000001_init_auth.sql) — base schema; mirror style for the new migration.
- [x] [.momorph/contexts/SCREENFLOW.md](.momorph/contexts/SCREENFLOW.md) — navigation graph (Constitution-mandated source for `href`).

### Recommended

- [ ] [tests/integration/LoginPage.test.tsx](tests/integration/LoginPage.test.tsx) — RSC + intl integration test pattern.
- [ ] [tests/e2e/login.spec.ts](tests/e2e/login.spec.ts) — Playwright auth fixture usage.
- [ ] [app/globals.css](app/globals.css) — existing design tokens; only add new ones if Figma's `query_section` doesn't satisfy at implementation time.

---

## Open Questions

- [ ] **Locale narrowing scope** — narrow `['vi','en','ja']` → `['vi','en']` project-wide, or hide JP from the dropdown only? Plan defaults to project-wide.
- [ ] **First admin onboarding** — does the team accept a manual SQL `update public.users set role='admin' where email='…'` as the only admin-creation path until an admin-user-management screen ships?
- [ ] **Footer "Tiêu chuẩn chung" target** — confirmed `/community-standards` (medium confidence); resolved when Community Standards spec lands.
- [ ] **Profile dropdown routes** — `/profile` and `/admin` confirmed when `Dropdown-profile` spec (frame `721:5223`) is built.
- [ ] **Hero LCP measurement** — should we wire Lighthouse CI in this feature's PR, or defer to a dedicated perf-tooling task?

---

## Notes

- The codebase is healthy for this feature: TypeScript strict, ESLint configured, Prettier wired via Husky, lint-staged on the right glob, secrets-bundle check script in `scripts/check-bundle-secrets.sh`.
- `next-intl` is fully wired in the layout (locale read on the server, messages provided via context). Adding new keys is purely additive.
- Existing tests give us a working harness for both Vitest (with `jsdom`) and Playwright (with Supabase auth fixtures). No additional test infrastructure is needed for this feature.
- The migration adds a single column (`role`) and an immutability check; impact on existing rows is `default 'user'` so backfill is trivial.
- Design tokens in `globals.css` were extracted from the Login screen; some Homepage SAA tokens (e.g., hero-foreground for cream text) are likely already present. Implementation phase will diff Figma → tokens and append missing entries.
