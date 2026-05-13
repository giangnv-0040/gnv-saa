# Implementation Plan: Homepage SAA

**Frame**: `i87tDx10uM-homepage-saa`
**Date**: 2026-05-13
**Spec**: `specs/i87tDx10uM-homepage-saa/spec.md`
**Research**: `specs/i87tDx10uM-homepage-saa/research.md`
**Status**: Reviewed (via `momorph.reviewplan` on 2026-05-13)

---

## Resolved during `reviewplan` (2026-05-13)

These decisions were locked during plan review and are no longer open:

1. **Header logo interactivity** — `AppHeader` adds an opt-in `logoHref?: string` prop. Login keeps its current non-interactive logo (no `logoHref`); Homepage passes `logoHref="/"`. No Login spec change required.
2. **Placeholder routes** — this feature ships 8 lightweight `Coming soon` stub pages (`/awards`, `/kudos`, `/kudos/new`, `/notifications`, `/profile`, `/admin`, `/rules`, `/community-standards`) so Test ID-59 ("No broken links") passes and the page is not a UX dead-end. Each placeholder will be replaced by its dedicated spec. See **Phase 1.5**.
3. **Locale narrowing** — project-wide narrowing from `['vi','en','ja']` to `['vi','en']` (touching `lib/i18n/config.ts` + `localeSchema`). `messages/ja.json` stays in the repo as a soft-deprecated file (no consumer); not deleted in this PR to avoid churn for unrelated tests.
4. **Lighthouse CI gating** — deferred to a dedicated perf-tooling task. This feature does NOT add CI Lighthouse gates; LCP/INP/CLS are measured manually at hand-off and tracked in a follow-up.

---

## Summary

Replace the stub `app/page.tsx` with the full **Sun\* Annual Awards 2025 — Homepage SAA**:

- **Public hero**: ROOT FURTHER logotype + countdown (ticking every minute) + event info + ABOUT AWARDS / ABOUT KUDOS CTAs + Root Further description.
- **Awards grid**: 6 award category cards deep-linking to `/awards#{slug}`.
- **Sun\* Kudos promo + floating Quick-Action widget** (Viết Kudo / Thể lệ SAA).
- **Auth-aware header**: nav links, unread bell with overlay (latest 5 + See all), profile menu (role-aware), language switcher.
- **Footer**: logo + 4 nav links + copyright.

Architectural approach is **Server Components by default with thin Client islands** for the countdown, dropdowns, and overlays. State is plain RSC fetches + Server Actions; we **do not** add TanStack Query or Zustand (deviation from the spec's State Management section — justified by Constitution §II and tracked below). Event datetime is a build-time env var (`NEXT_PUBLIC_EVENT_START_AT`). All new content is i18n-keyed (vi/en).

The page is opened to anonymous traffic — current middleware protects `/`, which must be relaxed.

---

## Spec Coverage Trace

A pre-task map from spec.md to plan phases. Every requirement appears here exactly once.

| Spec ref                            | Phase | Step(s)    | Test coverage                                                                                                                               |
| ----------------------------------- | ----- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| US1 (Awards discovery, P1)          | 2     | 12–19      | E2E `homepage.spec.ts` US1 + AwardCard unit                                                                                                 |
| US2 (Countdown, P1)                 | 1, 2  | 6, 14      | `event/countdown.test.ts` + `CountdownTimer.test`                                                                                           |
| US3 (Personalized header, P1)       | 3     | 22–27      | `homepage-authenticated.test.tsx` + E2E US3                                                                                                 |
| US4 (Language switch, P2)           | 1, 4  | 9, 28      | `LanguageSwitcher.test` + locale-persistence intg.                                                                                          |
| US5 (Kudos + widget, P2)            | 2     | 17–18      | `QuickActionWidget.test` + E2E US5                                                                                                          |
| US6 (Header/Footer nav, P2)         | 2     | 11–13, 19  | `NavLink.test` + `HeaderNav.test` + E2E US6                                                                                                 |
| FR-001 Header layout                | 1, 3  | 10, 26     | `AppHeader.test` + `HomepageHeader.test`                                                                                                    |
| FR-002 Active nav state             | 2     | 12         | `NavLink.test`                                                                                                                              |
| FR-003 Nav clicks                   | 2     | 13         | E2E US6                                                                                                                                     |
| FR-004 Logo → `/`                   | 1, 2  | 10, 19     | `AppHeader.test` (logo link variant)                                                                                                        |
| FR-005 Hero display                 | 2     | 15         | `HeroSection.test`                                                                                                                          |
| FR-006 Countdown from env           | 1     | 6          | `event/config.test.ts`                                                                                                                      |
| FR-007 2-digit padding              | 2     | 14         | `CountdownTile.test`                                                                                                                        |
| FR-008 60s ticking                  | 2     | 14         | `CountdownTimer.test` (fake timers)                                                                                                         |
| FR-009 Invalid date fallback        | 1, 2  | 6, 14      | `event/countdown.test` + edge-case unit                                                                                                     |
| FR-010 Hero CTAs                    | 2     | 15         | E2E US1 #4                                                                                                                                  |
| FR-011 Six awards (exact set)       | 1     | 5          | `awards/config.test.ts`                                                                                                                     |
| FR-012 Award card content           | 2     | 16         | `AwardCard.test`                                                                                                                            |
| FR-013 Award hashtag links          | 2     | 16         | E2E US1 #2                                                                                                                                  |
| FR-014 Missing-slug fallback        | n/a   | —          | **Owned by Awards Information spec (`zFYDgyj_pD`)**; homepage emits the link correctly, behavior at `/awards` is that spec's responsibility |
| FR-015 Kudos block                  | 2     | 17         | `KudosPromoSection.test`                                                                                                                    |
| FR-016 Kudos CTA                    | 2     | 17         | E2E US5 #1                                                                                                                                  |
| FR-017 Widget pill                  | 2     | 18         | `QuickActionWidget.test`                                                                                                                    |
| FR-018 Widget overlay actions       | 2     | 18         | `QuickActionWidget.test` (2 items, routes)                                                                                                  |
| FR-019 Anonymous bell hidden        | 3     | 22, 24     | `homepage-anonymous.test.tsx`                                                                                                               |
| FR-020 Unread badge                 | 3     | 23, 24     | `NotificationButton.test` + E2E US3 #1                                                                                                      |
| FR-021 Bell overlay                 | 3     | 24         | `notifications-overlay.test.tsx`                                                                                                            |
| FR-022 Profile dropdown roles       | 3     | 25         | `ProfileMenu.test` (3 variants)                                                                                                             |
| FR-023 Sign out → `/login`          | 3     | 25         | E2E US3 #6                                                                                                                                  |
| FR-024 Lang dropdown VN/EN          | 1, 4  | 9, 28      | `LanguageSwitcher.test` (narrowed)                                                                                                          |
| FR-025 Language persist             | 4     | 28         | `tests/integration/locale-persist.test.tsx`                                                                                                 |
| FR-026 Lang switch failure          | 4     | 28         | `LanguageSwitcher.test` (action throws → toast)                                                                                             |
| FR-027 Footer layout                | 1     | 11         | `AppFooter.test` (homepage variant)                                                                                                         |
| FR-028 Footer links                 | 1, 2  | 11, 19     | E2E US6 #3                                                                                                                                  |
| TR-001 Web Vitals                   | 4     | 31         | Manual Lighthouse measurement at hand-off (CI gating deferred to a follow-up task — see _Resolved during `reviewplan`_)                     |
| TR-002 Hash preservation            | 2     | 16         | E2E US1 #2                                                                                                                                  |
| TR-003 Countdown client comp.       | 2     | 14         | `CountdownTimer.test` (component is `'use client'`)                                                                                         |
| TR-004 Shared header/footer         | 1     | 10, 11     | `AppHeader.test` + `AppFooter.test`                                                                                                         |
| TR-005 i18n catalog (no hard-coded) | 1     | 4          | `messages-parity.test.ts`                                                                                                                   |
| TR-006 Design tokens only           | all   | —          | ESLint custom rule (already configured) + review                                                                                            |
| TR-007 Unread count gated by auth   | 3     | 22–24      | `homepage-anonymous.test.tsx`                                                                                                               |
| TR-008 Supabase SSR helper          | 1, 3  | 7, 22      | Integration tests with real Supabase                                                                                                        |
| TR-009 Keyboard + a11y              | 2, 3  | 14, 24, 25 | Vitest user-event + axe in E2E                                                                                                              |
| TR-010 No horizontal scroll         | 2     | 19         | E2E viewport tests                                                                                                                          |

> **Acceptance scenarios** from spec.md (US1–US6 numbered scenarios + Edge Cases) map 1-to-1 to the unit/integration/E2E entries above; the `tasks.md` produced by `momorph.tasks` will emit one task per scenario per Constitution §V.

---

## Technical Context

| Concern              | Decision                                                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Language/Framework   | TypeScript 5 (strict) on Next.js 16 (App Router) + React 19 + Tailwind 4                                                                             |
| Primary Dependencies | `@supabase/ssr`, `@supabase/supabase-js`, `next-intl`, `zod` (all already installed)                                                                 |
| Database             | Supabase Postgres — one new migration to add `role` enum to `public.users`                                                                           |
| Testing              | Vitest (unit + integration) + Playwright (E2E) — both already wired                                                                                  |
| State Management     | Server Components for data, `useState`/`useTransition` for ephemeral UI state, Server Actions for mutations. **No TanStack Query / Zustand.**        |
| API Style            | Server Actions (kebab-case files under `lib/<domain>/actions.ts`) + a thin Route Handler only where a Server Action is unsuitable.                   |
| i18n                 | `next-intl` with `vi` default + `en`. Existing `ja` will be soft-deprecated (kept in messages but hidden from the LanguageSwitcher per spec FR-024). |

---

## Constitution Compliance Check

_GATE: Must pass before implementation can begin._

- [x] **§I Clean Code** — Each new file has one responsibility. Filenames kebab-case for modules, PascalCase for components. Files target ≤250 LoC; `app/page.tsx` stays composition-only (delegates to organisms) and is expected to land around 60–100 LoC. No `any`, no `@ts-ignore`, no non-null assertions. ESLint must pass cleanly.
- [x] **§II Tech Stack Best Practices** — Server Components by default; Client Components only where interactivity demands (`'use client'` on Countdown, dropdowns, widget). All `href` values derived from spec + SCREENFLOW.md (no guessing). Tailwind utilities + design tokens; no hard-coded colors/pixels.
- [x] **§III Responsive Web UI & Accessibility** — Mobile-first responsive across the awards grid + hero CTAs. WCAG 2.1 AA (focus ring already in `globals.css`, `aria-current`, `aria-live` countdown region, ESC/outside-click semantics already exemplified by the existing `LanguageSwitcher`).
- [x] **§IV OWASP Secure Coding** — All inputs validated with Zod at trust boundary (Server Actions, Route Handlers). Supabase RLS on every new table. No service-role key on the client. Anonymous bell is hidden (no leak of auth state).
- [x] **§V TDD (Non-negotiable)** — Each task in `tasks.md` will be RED → GREEN → REFACTOR. Vitest tests live next to code; E2E covers all 6 user stories. Coverage emerges from the acceptance scenarios.

### Violations / Deviations (justified)

| Deviation                                                                                                                                                                                                      | Spec reference             | Justification                                                                                                                                                                                                                                                                                 | Alternative rejected                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Spec describes `TanStack Query` + `Zustand` for state; plan uses pure RSC + Server Actions.                                                                                                                    | spec.md → State Management | Constitution §II ("default to Server Components"); existing codebase ships zero client-state libraries; homepage's "global state" needs are minimal (only `user` + `unreadCount`, both happily fetched server-side and passed as props). Adding 2 dependencies for this is unjustified bloat. | Adding both libs would duplicate work the framework already does and introduce hydration nuance for no functional gain. |
| Spec lists `/api/users/me`, `/api/notifications/unread-count`, `/api/notifications?limit=5`, `/api/i18n/locale` as Route Handlers; plan implements them as **Server Actions** (or RSC fetches) where possible. | spec.md → API Requirements | Constitution §II — Server Actions are the idiomatic Next.js path for mutations & data fetches initiated by client islands; Route Handlers add ceremony for no benefit. `setLocale` already follows this pattern.                                                                              | A `/api/*` handler is heavier and forces JSON serialization for data that can be passed as RSC props.                   |
| Bell shows **0 unread for everyone** at MVP launch; notifications data layer ships with its own spec.                                                                                                          | spec.md → US3 P1           | Notifications backend (table + RLS + insert/read logic) belongs to the `Tất cả thông báo` (`6-1LRz3vqr`) and `View thông báo` (`gWBVcaSVIf`) specs. Homepage ships a stubbed service so the UI is built, tested, and ready.                                                                   | Building notifications schema speculatively here would block homepage shipping and pre-empt the dedicated spec.         |
| Narrow locales project-wide from `['vi','en','ja']` to `['vi','en']`.                                                                                                                                          | spec.md → FR-024           | Spec locks vi/en only. JP appears in `messages/ja.json` and `lib/i18n/config.ts` but no design surface requests it.                                                                                                                                                                           | Hiding JP in only the homepage switcher creates inconsistency across screens.                                           |

---

## Architecture Decisions

### Frontend Approach

- **Component structure**: Atomic — `components/atoms/*`, `components/molecules/*`, `components/organisms/*`. New homepage-specific organisms live under `components/organisms/homepage/` to keep them grouped without leaking into shared component reuse boundaries.
- **Styling strategy**: Tailwind 4 utilities + CSS variables (existing `globals.css`). New design tokens for the dark hero/yellow CTA are already present (`--color-hero-background`, `--color-cta`, etc.); we will extend `globals.css` only with tokens that don't yet exist (verified at implementation time by querying Figma via `query_section`).
- **Data fetching**: Server Component composition — `app/page.tsx` is `async` and gathers (a) session, (b) user profile, (c) `unreadCount`. The result is passed down to `AppHeaderHomepage` / dropdown components as props.
- **Client islands**: minimal, each `'use client'` and < ~150 LoC. Composition pattern already used by `LanguageSwitcher` (outside-click + ESC + focus management) is the template.

### Backend Approach

- **Server Actions** (under `lib/<domain>/actions.ts`):
  - `lib/users/actions.ts` → `getCurrentUserProfile()` (used by RSC).
  - `lib/notifications/actions.ts` → `getUnreadCount()`, `getRecentNotifications({ limit })` — return empty/zero until notifications spec lands.
- **Route Handlers** (under `app/api/...`):
  - `app/auth/signout/route.ts` — already exists.
  - No new route handlers needed for this feature.
- **Validation**: Zod schemas at trust boundary. Awards slugs validated against the static catalogue (`lib/awards/config.ts`).
- **Database**:
  - **Migration** `20260513000001_add_user_role.sql` adds `role text not null default 'user' check (role in ('user','admin'))` to `public.users`. RLS update: column is readable by the owner; UPDATE on `role` blocked at the trigger level (only mutable via service-role admin tooling).
  - No notifications table in this feature (deferred).

### Integration Points

- **Existing services to reuse**:
  - `lib/supabase/{server,client,middleware}.ts` — session, RSC server client, middleware refresh.
  - `lib/i18n/actions.ts` (`setLocale`) — already powers the LanguageSwitcher.
  - `lib/i18n/config.ts` — locales, default, cookie name.
  - `components/atoms/{Button,Spinner,FlagIcon}.tsx` — reuse as-is.
  - `components/molecules/LanguageSwitcher.tsx` — reuse; narrow locales list.
  - `components/organisms/{AppHeader,AppFooter}.tsx` — **EXTEND** (not replace) for homepage; the homepage will compose a richer `AppHeaderHomepage` that internally renders `AppHeader` and slots nav + bell + profile menu, **or** the existing `AppHeader` will be extended with optional nav/profile slots. Decision: extend `AppHeader` (Option B) so Login keeps working without refactor — see _Project Structure_ below.
- **Shared components introduced for the first time** (will also serve future screens):
  - `NavLink`, `NotificationButton`, `ProfileMenu`, `AppHeader` variants (`AppHeaderHomepage`), `AwardCard`, `CountdownTimer`, `QuickActionWidget`, `HeroSection`, `KudosPromoSection`, `AwardsGridSection`.
- **API contracts**: every Server Action signature is captured here and re-emitted to `tasks.md`. Return shapes go in `lib/<domain>/types.ts`.

---

## Project Structure

### Documentation (this feature)

```text
.momorph/specs/i87tDx10uM-homepage-saa/
├── spec.md         # ← already reviewed
├── plan.md         # ← this file
├── research.md     # ← see companion file
└── tasks.md        # ← produced by momorph.tasks (next)
```

### Source Code (affected areas)

**New files:**

```text
# Awards static catalogue
lib/awards/
├── config.ts                    # 6 award entries (slug + i18n keys + image path)
└── types.ts                     # Award interface

# Event datetime helper (env-driven)
lib/event/
├── config.ts                    # NEXT_PUBLIC_EVENT_START_AT parsing + fallback
└── countdown.ts                 # Pure diff(now, target) → { days, hours, minutes, started }

# Centralized route constants (Phase 1 step 9)
lib/
└── routes.ts                    # Typed ROUTES object — single source of truth for all path strings

# Notifications service (stubbed until notifications spec lands)
lib/notifications/
├── actions.ts                   # getUnreadCount(), getRecentNotifications()
└── types.ts                     # Notification shape

# Users service helper
lib/users/
└── actions.ts                   # getCurrentUserProfile()  (server-only)

# UI atoms (homepage-introduced, reusable)
components/atoms/
├── BellIcon.tsx
├── UnreadBadge.tsx
└── NavLink.tsx                  # underline / aria-current behavior

# UI molecules
components/molecules/
├── NotificationButton.tsx       # 'use client' — bell + badge + overlay trigger
├── NotificationOverlay.tsx      # 'use client' — list + "See all" link
├── ProfileMenu.tsx              # 'use client' — anon/user/admin variants
├── HeaderNav.tsx                # 'use client' — 3 nav links with active state
├── CountdownTile.tsx            # 'use client' — single tile (DAYS/HOURS/MINUTES)
└── CountdownTimer.tsx           # 'use client' — composes 3 tiles, ticks every 60 s

# UI organisms (homepage-scoped)
components/organisms/homepage/
├── HeroSection.tsx              # Server Component
├── AwardsGridSection.tsx        # Server Component
├── AwardCard.tsx                # Server Component
├── KudosPromoSection.tsx        # Server Component
├── QuickActionWidget.tsx        # 'use client'
└── HomepageHeader.tsx           # Server Component composing AppHeader + nav + controls

# Shared placeholder organism (Phase 1.5)
components/organisms/
└── ComingSoon.tsx               # Server Component — shared by 8 placeholder pages

# Toast molecule (Phase 4 — FR-026 error path)
components/molecules/
└── Toast.tsx                    # 'use client' — minimal aria-live region

# Placeholder route stubs (Phase 1.5 — 8 files, ~5 LoC each)
app/awards/page.tsx
app/kudos/page.tsx
app/kudos/new/page.tsx
app/notifications/page.tsx
app/profile/page.tsx
app/admin/page.tsx
app/rules/page.tsx
app/community-standards/page.tsx

# Migration
supabase/migrations/
└── 20260513000001_add_user_role.sql

# Tests
tests/unit/
├── components/CountdownTimer.test.tsx
├── components/CountdownTile.test.tsx
├── components/AwardCard.test.tsx
├── components/AwardsGridSection.test.tsx
├── components/HeroSection.test.tsx
├── components/KudosPromoSection.test.tsx
├── components/NavLink.test.tsx
├── components/NotificationButton.test.tsx
├── components/NotificationOverlay.test.tsx
├── components/ProfileMenu.test.tsx
├── components/QuickActionWidget.test.tsx
├── components/HeaderNav.test.tsx
├── components/HomepageHeader.test.tsx
├── components/ComingSoon.test.tsx
├── components/Toast.test.tsx
├── lib/awards/config.test.ts
├── lib/event/countdown.test.ts
├── lib/event/config.test.ts
├── lib/notifications/actions.test.ts
├── lib/users/actions.test.ts
└── lib/i18n/messages-parity.test.ts

tests/integration/
├── homepage-anonymous.test.tsx     # SSR snapshot, no auth, countdown values, awards links, anonymous profile menu
├── homepage-authenticated.test.tsx # bell visible, profile menu items by role, locale persistence
├── notifications-overlay.test.tsx  # bell click → overlay (empty state) → "See all" → /notifications
├── middleware-public-home.test.ts  # anonymous GET / no longer redirects to /login (regression guard)
└── placeholders.test.ts            # Phase 1.5 — each of the 8 stub routes returns 200 and renders ComingSoon

tests/e2e/
└── homepage.spec.ts                 # all 6 user stories + axe AA pass + no-broken-links sweep (Test ID-59)

# Public assets (downloaded via momorph.implement)
public/assets/homepage/
├── images/
│   ├── hero-bg.png
│   ├── root-text.png
│   ├── further-text.png
│   └── kudos-bg.png
├── icons/
│   ├── bell.svg
│   ├── pencil.svg
│   └── widget-saa.svg
└── awards/
    ├── top-talent.png
    ├── top-project.png
    ├── top-project-leader.png
    ├── best-manager.png
    ├── signature-2025-creator.png
    └── mvp.png
```

**Modified files:**

| File                                              | Change                                                                                                                                                                                                                                                         |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/page.tsx`                                    | Replace stub with full homepage composition (Server Component). Removes `redirect('/login')` — anonymous visitors are now welcome.                                                                                                                             |
| `middleware.ts`                                   | Remove `/` from `isProtectedPath` (homepage is public). Keep session refresh on all matched routes.                                                                                                                                                            |
| `lib/i18n/config.ts`                              | Narrow `locales` to `['vi', 'en']`. Keep `defaultLocale = 'vi'`.                                                                                                                                                                                               |
| `lib/validation/auth.ts`                          | Narrow `localeSchema` to `z.enum(['vi','en'])` to match config.                                                                                                                                                                                                |
| `components/organisms/AppHeader.tsx`              | Add optional slots `nav?: ReactNode`, `controls?: ReactNode` (preserves `children` for Login BC) **and** optional `logoHref?: string` to reconcile Homepage FR-004 vs. Login FR-013 (logo becomes a link only when set). JSDoc updated to describe both modes. |
| `components/organisms/AppFooter.tsx`              | Replace single-line copyright with full layout (logo + nav links + copyright). Variant: optional `variant?: 'login' \| 'homepage'` to keep login's minimal footer.                                                                                             |
| `messages/{vi,en}.json`                           | Add keys: `homepage.hero.*`, `homepage.event.*`, `homepage.cta.*`, `homepage.awards.list.*` (6 entries), `homepage.kudos.*`, `homepage.widget.*`, `header.nav.*`, `footer.nav.*`, `notifications.*`, `profile.menu.*`.                                         |
| `messages/ja.json`                                | Leave untouched but document deprecation in code comment in `lib/i18n/config.ts`.                                                                                                                                                                              |
| `app/login/page.tsx`                              | None (Login keeps the minimal header/footer via existing slots).                                                                                                                                                                                               |
| `tests/unit/components/AppHeader.test.tsx`        | Extend coverage for the new optional `nav`/`controls` slots **and** for `logoHref` link vs. non-interactive rendering.                                                                                                                                         |
| `tests/unit/components/AppFooter.test.tsx`        | Extend coverage for the `variant='homepage'` rendering (logo + 4 nav links + copyright).                                                                                                                                                                       |
| `tests/unit/components/LanguageSwitcher.test.tsx` | Narrow expected locale list to vi/en; add failure-path test (action throws → toast appears, locale unchanged).                                                                                                                                                 |
| `tests/unit/lib/validation/auth.test.ts`          | Narrow `localeSchema` expectations; assert `'ja'` now rejected.                                                                                                                                                                                                |

### Dependencies

**No new runtime or dev dependencies.** Every requirement is satisfied by the current `package.json`:

- `next` 16.2.6, `react` 19.2.4 — RSC + Server Actions
- `next-intl` 4.11.1 — i18n
- `@supabase/{ssr,supabase-js}` — session + DB
- `zod` 4 — validation
- `vitest`, `@playwright/test`, `@axe-core/playwright`, `@testing-library/*` — testing

If we later need an icon library for missing icons, we'll add `lucide-react`, but at MVP we use SVGs downloaded from Figma into `public/assets/homepage/icons/`.

---

## Implementation Strategy

### Phase 0 — Asset prep + DB migration _(blocks everything else)_

1. **Download Figma assets** via `get_media_files` MCP tool (one-shot list_media_nodes → batch download):
   - Hero: `MM_MEDIA_Keyvisual BG`, `MM_MEDIA_Root Text`, `MM_MEDIA_Further Text`.
   - Awards: 6 card thumbnails (`C2.1` … `C2.6`).
   - Kudos: `MM_MEDIA_Kudos Background`, `MM_MEDIA_Logo/Kudos`.
   - Icons: bell (A1.6), pencil + SAA glyph (mms_6), language chevron already exists.
   - Place under `public/assets/homepage/{images,icons,awards}/` (kebab-case names per `.momorph/guidelines/frontend.md`).
2. **DB migration `20260513000001_add_user_role.sql`**:
   - `alter table public.users add column role text not null default 'user' check (role in ('user','admin'));`
   - Update `users_block_protected_column_updates()` to add `role` to the protected list (only mutable by service-role).
   - No RLS policy change — `role` is read via the existing `users_select_self` policy.
3. **Env var**: add `NEXT_PUBLIC_EVENT_START_AT` to `.env.example` (e.g., `NEXT_PUBLIC_EVENT_START_AT=2026-12-31T18:30:00+07:00`). Document in `README.md`.

### Phase 1 — Foundation (shared infrastructure)

4. **i18n catalogue** for vi + en. Explicit key tree:
   - `header.nav.about` / `awards` / `kudos` (3 link labels)
   - `footer.nav.about` / `awards` / `kudos` / `communityStandards` + `footer.copyright` (already exists)
   - `homepage.hero.title.rootFurther` (visual logotype is image; alt-text key here)
   - `homepage.hero.subtitle.comingSoon`
   - `homepage.countdown.label.days` / `hours` / `minutes` + `homepage.countdown.ariaLabel`
   - `homepage.event.time` / `homepage.event.venue` / `homepage.event.broadcast`
   - `homepage.cta.aboutAwards` / `homepage.cta.aboutKudos`
   - `homepage.description.{paragraph1,paragraph2,quote}` (Root Further essay — verbatim copy from Figma B4)
   - `homepage.awards.section.caption` / `title` / `subtitle`
   - `homepage.awards.list.{topTalent,topProject,topProjectLeader,bestManager,signature2025Creator,mvp}.{title,description}` (12 keys)
   - `homepage.awards.detailLink` (the "Chi tiết" CTA label, shared across all cards)
   - `homepage.kudos.label` / `title` / `description` / `detailLink`
   - `homepage.widget.viewKudo` / `homepage.widget.rules` / `homepage.widget.ariaLabel`
   - `profile.menu.{ariaLabel,signIn,profile,signOut,adminDashboard}`
   - `notifications.{ariaLabel,emptyState,seeAll,unreadBadgeLabel}`
   - `homepage.errors.localeSwitchFailed` (toast for FR-026)
     Tests: locale-file-parity test (`tests/unit/lib/i18n/messages-parity.test.ts`) — confirms vi and en share the same key tree; no on-screen string is rendered without a key (verified by integration tests + a lint rule for hard-coded strings).
5. **Awards static catalogue** (`lib/awards/config.ts`):
   ```ts
   export const awards = [
     {
       slug: 'top-talent',
       titleKey: 'homepage.awards.list.topTalent.title',
       descKey: '…',
       image: '/assets/homepage/awards/top-talent.png',
     },
     { slug: 'top-project', titleKey: '…', descKey: '…', image: '…' },
     { slug: 'top-project-leader', titleKey: '…', descKey: '…', image: '…' },
     { slug: 'best-manager', titleKey: '…', descKey: '…', image: '…' },
     { slug: 'signature-2025-creator', titleKey: '…', descKey: '…', image: '…' },
     { slug: 'mvp', titleKey: '…', descKey: '…', image: '…' },
   ] as const satisfies readonly Award[];
   ```
   Tests: catalogue shape, slug uniqueness, all keys exist in messages.
6. **Event config helper** (`lib/event/config.ts`, `lib/event/countdown.ts`):
   - `getEventStartAt(): Date | null` — parses `NEXT_PUBLIC_EVENT_START_AT` strictly; returns `null` on failure.
   - `computeCountdown(now: Date, target: Date | null): { days, hours, minutes, started }` — pure, 2-digit-padded by the consumer.
   - Tests: invalid string → null → countdown returns `started: true` and zeros (FR-009).
7. **Users service** (`lib/users/actions.ts`):
   - `getCurrentUserProfile()` Server Action — returns `null` if unauthenticated; otherwise the row from `public.users` (id, email, displayName, avatarUrl, locale, role).
   - Tests: unauthenticated → null; signed-in user → expected shape; integration with seed user.
8. **Notifications service** (`lib/notifications/actions.ts`):
   - `getUnreadCount()` → `Promise<number>` (returns 0 until notifications spec lands).
   - `getRecentNotifications({ limit }: { limit: number })` → `Promise<Notification[]>` (returns `[]`).
   - Tests: returns 0 / empty for both authenticated and unauthenticated callers (so the bell renders consistently).
9. **Locale narrowing + route constants**:
   - Update `lib/i18n/config.ts` → `locales = ['vi','en']`, default `'vi'`. `messages/ja.json` stays in the repo (soft-deprecated).
   - Update `lib/validation/auth.ts` → `localeSchema = z.enum(['vi','en'])`.
   - Add migration step in `lib/i18n/actions.ts`: if cookie holds `'ja'`, transparently reset to `'vi'` on the next visit.
   - Add `lib/routes.ts` exporting a typed constant `ROUTES` for every path the homepage links to (`HOME`, `AWARDS`, `KUDOS`, `KUDOS_NEW`, `NOTIFICATIONS`, `PROFILE`, `ADMIN`, `RULES`, `COMMUNITY_STANDARDS`, `LOGIN`, `SIGN_OUT`). Provides a single point of change if Dropdown-profile / Community-Standards specs later rename a route.
   - Tests: cookie sanitizer + invalid-locale fallback; `routes.ts` shape test.
10. **AppHeader extension** (`components/organisms/AppHeader.tsx`):
    - Add optional `nav?: ReactNode` (rendered between logo and the controls slot) and `controls?: ReactNode` (right slot). Existing `children` prop is preserved and aliased to `controls` for backwards-compat (Login renders unchanged).
    - Add optional `logoHref?: string` (locked during `reviewplan`). When `logoHref` is provided, the logo renders as a `<Link>` with an accessible `aria-label` from `header.nav.logoAriaLabel`; when omitted, it remains a non-interactive `<Image>` (Login's current behavior). The existing JSDoc on the component MUST be updated to describe both modes, and the FR-013 reference replaced with: "Login screens render the logo non-interactively (no `logoHref`); Homepage and post-login screens pass `logoHref` to make it clickable."
    - Tests: render with no slots (Login parity), render with nav + controls (Homepage), render with `logoHref` (logo is a link with `aria-label`), render without `logoHref` (logo has no interactive role; no `href`, `tabIndex`, or `role` attribute).
11. **AppFooter variant** (`components/organisms/AppFooter.tsx`): add optional `variant?: 'login' \| 'homepage'`. Default `'login'`. `'homepage'` renders logo + 4 nav links + copyright. Tests for both variants.

### Phase 1.5 — Placeholder routes (unblocks E2E)

> Locked during `reviewplan`. Each placeholder is replaced by the dedicated spec when that screen lands. Tasks under this phase do not depend on any Phase 2 artifact.

11a. **`ComingSoon` organism** (`components/organisms/ComingSoon.tsx`) — Server Component. Renders a centered card with `comingSoon.title`, a screen-specific subtitle (passed as prop), a `comingSoon.message` line, and a "Về trang chủ / Back home" link to `/`. No header/footer chrome (yet) — keeps placeholders minimal until each spec defines its real chrome. Accepts `screenName: string` (already-localized) and optional `eta?: string`.

11b. **Placeholder pages** — 8 stub `page.tsx` files, each ~5 LoC:

| Path                               | Renders                                                            | Replaced by spec                        |
| ---------------------------------- | ------------------------------------------------------------------ | --------------------------------------- |
| `app/awards/page.tsx`              | `<ComingSoon screenName={t('placeholders.awards')} />`             | Awards Information (`zFYDgyj_pD`)       |
| `app/kudos/page.tsx`               | `<ComingSoon screenName={t('placeholders.kudosBoard')} />`         | Sun\* Kudos – Live board (`MaZUn5xHXZ`) |
| `app/kudos/new/page.tsx`           | `<ComingSoon screenName={t('placeholders.writeKudo')} />`          | Viết Kudo (`ihQ26W78P2`)                |
| `app/notifications/page.tsx`       | `<ComingSoon screenName={t('placeholders.allNotifications')} />`   | Tất cả thông báo (`6-1LRz3vqr`)         |
| `app/profile/page.tsx`             | `<ComingSoon screenName={t('placeholders.profile')} />`            | Profile bản thân (`3FoIx6ALVb`)         |
| `app/admin/page.tsx`               | `<ComingSoon screenName={t('placeholders.adminOverview')} />`      | Admin – Overview (`9ja9g9iJLW`)         |
| `app/rules/page.tsx`               | `<ComingSoon screenName={t('placeholders.rules')} />`              | Thể lệ UPDATE (`b1Filzi9i6`)            |
| `app/community-standards/page.tsx` | `<ComingSoon screenName={t('placeholders.communityStandards')} />` | Tiêu chuẩn cộng đồng (`Dpn7C89--r`)     |

11c. **i18n keys** added in Phase 1.4 step (now amended):

- `comingSoon.title` ("Sắp ra mắt" / "Coming soon")
- `comingSoon.message` ("Tính năng này đang được phát triển" / "This screen is coming soon")
- `comingSoon.backHome` ("Về trang chủ" / "Back home")
- `placeholders.awards`, `placeholders.kudosBoard`, `placeholders.writeKudo`, `placeholders.allNotifications`, `placeholders.profile`, `placeholders.adminOverview`, `placeholders.rules`, `placeholders.communityStandards` (8 screen-name labels — Vietnamese primary, English fallback).

11d. **Auth gating policy for placeholders**: All 8 placeholders are PUBLIC (return 200 to anonymous and authenticated alike). Real auth gating will be added by each route's owning spec; doing it now would commit to behavior those specs may want to override.

11e. **Tests**:

- `tests/unit/components/ComingSoon.test.tsx` — renders heading + message + back-home link with correct localized strings.
- `tests/integration/placeholders.test.ts` — parametric test: each of the 8 paths returns 200 and renders the `ComingSoon` heading.
- The E2E "no broken links" sweep (Test ID-59) iterates over every `<a href>` on `/` and asserts a 200 response.

### Phase 2 — US1 + US2 + US5 + US6 (public homepage)

> Implementable end-to-end without any authentication. Anonymous SSR is the primary acceptance gate for this phase.

12. **NavLink atom** (`components/atoms/NavLink.tsx`) with active-state detection via `usePathname` + optional `activeOnHash`. Exposes `aria-current="page"`.
13. **HeaderNav molecule** (`components/molecules/HeaderNav.tsx`) — 3 fixed links: About SAA 2025 (`/`), Awards Information (`/awards`), Sun\* Kudos (`/kudos`).
14. **CountdownTile + CountdownTimer molecules** — see Phase 1 helpers; consumers display 2-digit zero-padded values. Countdown region wraps in `aria-live="polite"` and updates only on minute change to avoid spammy announcements (TR-009).
15. **HeroSection organism** (`components/organisms/homepage/HeroSection.tsx`) — renders ROOT FURTHER hero, countdown, event info (i18n keys), CTA group, description paragraph.
16. **AwardCard + AwardsGridSection organisms** — server-rendered; each card links to `/awards#{slug}` (uses `next/link` with hash, preserves the hash so the destination page can perform anchor scroll — TR-002); whole card is wrapped in a single `<Link>` for keyboard parity (one tab stop per card; image, title, and "Chi tiết" text are visually distinct but share the same activation). Description text uses CSS `line-clamp-2` (Tailwind utility) with `text-ellipsis` to satisfy C2.1.3 (max 2 lines with `…`). Hover effect via Tailwind utility classes consuming a future `--shadow-card-hover` token, added to `globals.css` at implementation time only if missing.
17. **KudosPromoSection organism** — content + "Chi tiết" link to `/kudos`.
18. **QuickActionWidget organism** (`'use client'`) — fixed-position pill; opens overlay with two actions (Viết Kudo → `/kudos/new`, Thể lệ SAA → `/rules`); outside-click + ESC close (reuses pattern from `LanguageSwitcher`).
19. **Compose `app/page.tsx`** as a Server Component: renders `<HomepageHeader user={null} unreadCount={0} />`, `<HeroSection />`, `<AwardsGridSection />`, `<KudosPromoSection />`, `<QuickActionWidget />`, `<AppFooter variant="homepage" />`.
20. **Middleware change**: remove `/` from `isProtectedPath`. Middleware still refreshes the session for everyone.
21. **Tests**: integration test (anonymous SSR snapshot of `/`) + E2E covering US1 (all award cards navigate to `/awards#{slug}`, hashtag deep-link to non-existent slug → graceful fallback ID-62), US2 (countdown values + invalid env → fallback), US6 (header/footer nav links resolve, logo scroll-to-top, active link rendering).

### Phase 3 — US3 (auth-aware header)

22. **`getCurrentUserProfile()` integration** in `app/page.tsx` — fetch once at request time; return `null` (and degrade UI to anonymous mode) if Supabase returns 401 / session is missing / `users` row lookup fails. Pass the user object (or `null`) to `<HomepageHeader />`. The function MUST NOT throw on auth failure — that's a soft-degradation path, not an error condition (covered by spec Edge Case "`/api/users/me` returns 401 after page load").
23. **BellIcon + UnreadBadge atoms** — decorative SVGs; badge hidden when count = 0.
24. **NotificationButton + NotificationOverlay molecules** (`'use client'`):
    - Button visible only when `user` is truthy (FR-019: anonymous → bell hidden).
    - Click → fetch latest 5 via `getRecentNotifications({ limit: 5 })` Server Action; cache locally for fast re-open.
    - Overlay UI: list (or empty state "Bạn chưa có thông báo nào") + `See all` link to `/notifications`.
    - Outside-click + ESC + bell-toggle close.
25. **ProfileMenu molecule** (`'use client'`):
    - Trigger always visible.
    - Items:
      - `user === null` → `{ Sign in → /login }`.
      - `user.role === 'admin'` → `{ Profile → /profile, Sign out (POST /auth/signout), Admin Dashboard → /admin }`.
      - else → `{ Profile → /profile, Sign out }`.
    - Sign-out submits a `<form action="/auth/signout" method="post">` to reuse the existing handler.
26. **HomepageHeader composition** — assemble logo, `HeaderNav`, `NotificationButton` (if user), `LanguageSwitcher`, `ProfileMenu`.
27. **Tests**: integration test (`homepage-authenticated.test.tsx`) for the auth path (mocked Supabase session); E2E for US3 (admin sees Admin Dashboard, regular user does not, sign-out redirects to `/login`).

### Phase 4 — US4 (language switch) + polish

28. **LanguageSwitcher narrowing + failure handling** — verify the existing component renders only vi/en after Phase 1 locale narrowing. **Add a `try/catch` around the `setLocale` server action call** inside the existing `useTransition` block: on failure, dismiss the dropdown, surface a non-blocking toast keyed `homepage.errors.localeSwitchFailed`, and keep the previously selected locale (FR-026). Toast component: a minimal `'use client'` molecule (`components/molecules/Toast.tsx`) using a `aria-live="polite"` region; if a heavier toast system is desired later, swap the implementation behind this molecule. Update test expectations and add a `vi.mocked(setLocale).mockRejectedValueOnce(new Error('boom'))` assertion that confirms the toast appears and the locale is unchanged.
29. **i18n parity tests**: every visible string keyed; missing-key fail-fast in tests.
30. **Accessibility audit**: run `axe` in the E2E pass; assert zero AA violations.
31. **Performance**: ensure hero background image is `next/image` with `priority`; LCP < 2.5 s budget verified by a Lighthouse CI step (or manual measurement at hand-off).

### Risk Assessment

| Risk                                                                                                                                                | Probability      | Impact | Mitigation                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Award slugs change before Awards Information spec lands → broken `/awards#{slug}` deep links.                                                       | Medium           | Medium | Awards catalogue is a single source of truth (`lib/awards/config.ts`); coordinate the slug list when `momorph.specify zFYDgyj_pD` runs. Tests assert slug uniqueness + i18n key existence. |
| Notifications service stubbed → US3 bell-overlay E2E only covers empty state.                                                                       | High (by design) | Low    | The empty-state path is meaningful (Test ID-29). When notifications spec ships, swap the stub for the real query — no UI change required.                                                  |
| `role` column added but UPDATE path is unspecified (no admin UI).                                                                                   | Medium           | Low    | Trigger blocks self-updates; admins are set via a one-off SQL `update public.users set role='admin' where email='…'` in staging/prod. Documented in migration comment.                     |
| Anonymous visitors can now reach `/` — risk of leaking authenticated UI in SSR.                                                                     | Medium           | Medium | Server Component decides per-user props; bell + role-specific menu items rendered conditionally. Integration test snapshot for anonymous SSR asserts absence of auth-only nodes.           |
| Header logo behavior diverges between Login (non-interactive per FR-013) and Homepage (interactive per FR-004).                                     | High             | Medium | **Resolved** via opt-in `logoHref?` prop on `AppHeader`. Login passes nothing (keeps current behavior); Homepage passes `logoHref="/"`. JSDoc updated to describe both modes.              |
| Homepage links resolve to routes (`/awards`, `/kudos`, `/notifications`, etc.) that do not exist yet → Test ID-59 ("No broken links") fails at E2E. | High             | High   | **Resolved** by Phase 1.5: 8 lightweight "Coming soon" placeholder pages backed by a shared `ComingSoon` organism. Each placeholder is replaced by its owning spec.                        |
| Hero LCP regression after adding background image.                                                                                                  | Medium           | Medium | Use `next/image` with `priority`, preload AVIF/WebP, design tokens for object-fit; Lighthouse CI gate.                                                                                     |
| Countdown drift after tab backgrounding.                                                                                                            | Medium           | Low    | `CountdownTimer` recomputes from `Date.now()` on every tick (never increments a counter) — captured in unit tests.                                                                         |
| `prefers-reduced-motion` not honored on award-card hover.                                                                                           | Low              | Low    | Existing `globals.css` reduce-motion media query forces 0.001ms transitions globally; Tailwind animations inherit.                                                                         |
| Locale narrowing breaks existing JP test fixtures.                                                                                                  | Low              | Low    | Search-and-replace `ja` test references; keep `messages/ja.json` (unused) to avoid touching Login.                                                                                         |

### Estimated Complexity

- **Frontend**: Medium-High (8 new organisms, 3 new molecules, 3 new atoms; many of them client islands with focus + outside-click semantics).
- **Backend**: Low (one migration; rest is Server Actions that mostly return constants until the notifications spec lands).
- **Testing**: Medium (62 acceptance scenarios from `get_frame_test_cases` to cover across unit + integration + E2E).

---

## Integration Testing Strategy

### Test Scope

- [x] **Component/Module interactions**: Hero ↔ Countdown ↔ env config; Header ↔ NotificationButton ↔ ProfileMenu ↔ Session; AwardsGrid ↔ awards.config ↔ messages.
- [x] **External dependencies**: Supabase Auth + Database (RLS on `users`), Figma assets (Phase 0 only).
- [x] **Data layer**: `public.users` via RSC + RLS.
- [x] **User workflows**: anonymous landing → click award → /awards#slug; signed-in user → bell → overlay → See all; admin → profile menu → Admin Dashboard.

### Test Categories

| Category           | Applicable? | Key Scenarios                                                                           |
| ------------------ | ----------- | --------------------------------------------------------------------------------------- |
| UI ↔ Logic         | Yes         | Countdown tick on minute boundary; overlay close on ESC; nav active-state hash matching |
| Service ↔ Service  | Yes         | `getCurrentUserProfile()` ↔ Supabase SSR client ↔ middleware refresh                    |
| App ↔ External API | No          | No third-party API in this feature (Google OAuth is Login's concern)                    |
| App ↔ Data Layer   | Yes         | `users` row lookup obeys `users_select_self` RLS; `role` column readable                |
| Cross-platform     | Yes         | Award grid column adaptation across breakpoints; widget visible on mobile               |

### Test Environment

- **Environment**: Local Supabase via `npm run supabase:start`; Vitest jsdom for unit + integration; Playwright Chromium for E2E.
- **Test data strategy**: `tests/helpers/seed.ts` for user seeding; per-test fresh state via `supabase:reset` between Playwright runs (already wired).
- **Isolation approach**: Vitest transaction-style isolation through fresh-mocked Supabase clients; Playwright uses tagged auth fixtures in `tests/e2e/fixtures/auth.ts`.

### Mocking Strategy

| Dependency Type        | Strategy                                       | Rationale                                                    |
| ---------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| Supabase client (unit) | Mock module-level (`vi.mock`)                  | Avoid network in unit tests; behavior covered by integration |
| Supabase (integration) | Real local Supabase                            | Verify RLS + trigger behavior                                |
| Date / Clock           | `vi.useFakeTimers()` for countdown tests       | Deterministic minute-tick assertions                         |
| Env vars               | `vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', …)`  | Cover valid + invalid + missing                              |
| Server Actions         | Real (run them; they're pure once env stubbed) | High-fidelity test                                           |

### Test Scenarios Outline

1. **Happy Path**
   - [ ] Anonymous user loads `/`, sees hero + countdown + 6 award cards + Kudos promo + widget + footer. Bell + profile menu items reflect anonymous state.
   - [ ] Signed-in regular user loads `/`, sees bell (badge if unread > 0 — stub: no badge), profile menu = `{ Profile, Sign out }`.
   - [ ] Admin loads `/`, profile menu adds `Admin Dashboard`.
   - [ ] Countdown ticks correctly across a 5-minute fake-time window.
   - [ ] User clicks `Top Talent` card → navigates to `/awards#top-talent`.
   - [ ] User clicks `ABOUT KUDOS` → navigates to `/kudos`.
   - [ ] Language switch persists across reload.

2. **Error Handling**
   - [ ] `NEXT_PUBLIC_EVENT_START_AT` unset → countdown renders `00 00 00`, hides "Coming soon", no crash.
   - [ ] `NEXT_PUBLIC_EVENT_START_AT` set to an invalid string → same fallback.
   - [ ] Event datetime in the past → fallback + tick stops.
   - [ ] Locale switch action fails (mock failure) → previous locale retained + toast.
   - [ ] Session expires mid-page → on next refresh, header drops back to anonymous mode.

3. **Edge Cases**
   - [ ] Award hashtag deep link to a non-existent slug on `/awards` → page loads without auto-scroll (Test ID-62).
   - [ ] Countdown crosses minute boundary precisely on tick.
   - [ ] `prefers-reduced-motion` enabled → award card hover effect disabled, but countdown still ticks.
   - [ ] Footer "Tiêu chuẩn chung" link presence (URL still flagged as open question).

### Tooling & Framework

- **Test framework**: Vitest (unit + integration), Playwright (E2E), `@axe-core/playwright` (a11y).
- **Supporting tools**: `@testing-library/react`, `@testing-library/user-event`, `jsdom`.
- **CI integration**: existing `npm run lint && npm run typecheck && npm run test && npm run test:e2e` chain via Husky pre-push (already configured).

### Coverage Goals

| Area                                               | Target                                                   | Priority |
| -------------------------------------------------- | -------------------------------------------------------- | -------- |
| Core user flows (US1, US2, US3)                    | 100% of acceptance scenarios mapped to ≥1 automated test | High     |
| Server Actions (`users`, `notifications`, `event`) | ≥90% branch                                              | High     |
| UI atoms/molecules                                 | ≥85% line                                                | Medium   |
| E2E happy paths                                    | All 6 user stories' Independent Tests                    | High     |

---

## Dependencies & Prerequisites

### Required Before Start

- [x] `.momorph/constitution.md` reviewed.
- [x] `spec.md` approved (post-`reviewspecify`).
- [x] SCREENFLOW.md current (post-`screenflow`).
- [x] Screen-spec for Homepage SAA exists (`.momorph/contexts/screen_specs/homepage-saa.md`).
- [ ] `research.md` written (companion file — see next).
- [ ] DB migration approved by reviewer (adds `role` column to `users`).
- [ ] Env var `NEXT_PUBLIC_EVENT_START_AT` documented in `.env.example`.
- [ ] Figma asset list confirmed before Phase 0 download.

### External Dependencies

- Supabase local dev environment (`supabase:start` works).
- Figma file `9ypp4enmFmdK3YAFJLIu6C` reachable via MoMorph MCP (already verified during spec phase).

---

## Open Questions

> All blocking items were resolved during `reviewplan` (see _Resolved during `reviewplan`_ at the top). The remaining items below are non-blocking and tracked for visibility.

- [ ] **Initial admin onboarding** — first admin's `role='admin'` is set via a manual `update public.users set role='admin' where email='…'` on staging/prod, documented in the new migration's comment. Acceptable for MVP; replace when admin-user-management UI ships.
- [ ] **Footer "Tiêu chuẩn chung" target** — confirmed in spec as `/community-standards` (medium confidence). Phase 1.5 ships a placeholder at that path; will be replaced when the Community Standards spec (`Dpn7C89--r`) is built. If the real route differs, only `messages/{vi,en}.json` + footer markup change.
- [ ] **Profile dropdown route paths** — `/profile` and `/admin` are predicted. Phase 1.5 ships placeholders at both; the Dropdown-profile spec (frame `721:5223`) may rename them. Single-source-of-truth: a small `lib/routes.ts` constant file (added in Phase 1 step 9 as part of the locale-narrowing PR) keeps all route paths in one place, so a rename is a one-line edit.
- [x] **Header logo interactivity** — resolved (opt-in `logoHref` prop).
- [x] **Placeholder routes** — resolved (8 stubs in Phase 1.5).
- [x] **Locale narrowing** — resolved (project-wide vi/en).
- [x] **Lighthouse CI gating** — resolved (deferred to a follow-up perf-tooling task).
- [x] **Anonymous locale persistence** — resolved (`setLocale` cookie covers anonymous).

---

## Next Steps

After plan approval:

1. **Run** `/momorph.reviewplan` to validate technical feasibility & completeness.
2. **Run** `/momorph.tasks` to generate task breakdown with parallelization markers.
3. **Begin** implementation following the Phase order — Phase 0 must complete before any other phase starts.

---

## Notes

- The `setLocale` server action already covers what the spec called `PUT /api/i18n/locale`. The cookie (`NEXT_LOCALE`) is set with `sameSite=lax`, `path=/`, 1-year TTL — anonymous visitors get persistence for free.
- We will NOT add Open Graph metadata to `app/page.tsx` in this feature — that is intentionally out-of-scope per spec.
- The current `app/page.tsx` stub uses `redirect('/login?redirectTo=%2F')` — that line disappears in Phase 2 step 19. The middleware change in step 20 happens in the same PR.
- The shared `AppHeader` is intentionally extended (not duplicated) so the Login screen keeps shipping a slim, unauthenticated header.
- Countdown ticks every 60 seconds, **NOT** every second — there is no minute display, only HH:MM granularity. Implementations using 1-second tickers waste CPU and trigger spammy `aria-live` announcements.
- All UI strings live in `messages/{vi,en}.json` — there are zero hard-coded user-facing strings outside the catalogue; tests enforce this.
