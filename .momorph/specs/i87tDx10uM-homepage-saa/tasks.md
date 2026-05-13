# Tasks: Homepage SAA

**Frame**: `i87tDx10uM-homepage-saa`
**Prerequisites**: plan.md (required ✓), spec.md (required ✓), research.md (recommended ✓)
**Created**: 2026-05-13
**Approach**: TDD (Constitution §V) — tests written and failing BEFORE implementation for every behavior.

---

## Task Format

```
- [ ] T### [P?] [Story?] Description | file/path.ts
```

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this belongs to (US1–US6); omitted in Setup, Foundational, and Polish phases
- **|**: File path the task touches

---

## User Stories (from spec.md)

| Story | Priority | Title                                       |
| ----- | -------- | ------------------------------------------- |
| US1   | P1       | View the campaign and discover awards       |
| US2   | P1       | See live countdown to the ceremony          |
| US3   | P1       | Personalized header for authenticated users |
| US4   | P2       | Switch interface language                   |
| US5   | P2       | Promote Sun\* Kudos and quick actions       |
| US6   | P2       | Reliable navigation from header & footer    |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Asset downloads, DB migration, env-var documentation. No code yet.

- [x] T001 Inventory Figma media for Homepage SAA via `list_media_nodes` (screenId i87tDx10uM) and write the manifest to | `.momorph/specs/i87tDx10uM-homepage-saa/asset-manifest.md`
- [x] T002 [P] Download hero assets (`MM_MEDIA_Keyvisual BG`, `MM_MEDIA_Root Text`, `MM_MEDIA_Further Text`) via `get_media_files` to | `public/assets/homepage/images/`
- [x] T003 [P] Download 6 award thumbnails (Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025-Creator, MVP) to | `public/assets/homepage/awards/`
- [x] T004 [P] Download Kudos promo background (`MM_MEDIA_Kudos Background`, `MM_MEDIA_Logo/Kudos`) to | `public/assets/homepage/images/`
- [x] T005 [P] Download icons (bell, pencil, widget SAA glyph) to | `public/assets/homepage/icons/`
- [x] T006 Create DB migration to add `role` column to `public.users` (default `'user'`, check `in ('user','admin')`) and extend `users_block_protected_column_updates()` trigger to protect the new column | `supabase/migrations/20260513000001_add_user_role.sql`
- [x] T007 [P] Add `NEXT_PUBLIC_EVENT_START_AT` to | `.env.example` (value e.g. `2026-12-31T18:30:00+07:00`) and document in | `README.md`
- [ ] T008 [P] Verify local Supabase applies the new migration cleanly via `npm run supabase:reset` (manual verification step; documents that migration files were re-checked)

**Checkpoint**: Assets in `public/`, migration green, env var documented. Foundation can begin.

---

## Phase 2: Foundation (Blocking Prerequisites)

**Purpose**: Build every cross-cutting piece needed by ≥2 user stories: i18n catalogue, awards config, event helper, user/notifications services, locale narrowing, shared header/footer extensions, middleware change, toast, ComingSoon + placeholder routes.

**⚠️ CRITICAL**: No user-story phase begins until this phase is complete.

### Foundation — i18n & Locale narrowing

- [x] T010 [P] Add full i18n key tree for `vi` per plan §Phase-1-step-4 (header, footer, hero, countdown, event, cta, description, awards.list × 6, kudos, widget, profile.menu, notifications, comingSoon, placeholders × 8, errors) | `messages/vi.json`
- [x] T011 [P] Mirror the same key tree to `en` with English translations (parity with `vi`) | `messages/en.json`
- [x] T012 [P] Write parity test that fails if `vi` and `en` key trees diverge | `tests/unit/lib/i18n/messages-parity.test.ts`
- [x] T013 [P] Narrow `locales` to `['vi','en']` and update JSDoc; keep `'ja'` as soft-deprecated in code comment | `lib/i18n/config.ts`
- [x] T014 [P] Narrow `localeSchema` to `z.enum(['vi','en'])` | `lib/validation/auth.ts`
- [x] T015 Update `setLocale` server action to sanitize stale `'ja'` cookies (rewrite to `'vi'` and noop instead of throwing) | `lib/i18n/actions.ts`
- [x] T016 Add tests asserting `'ja'` cookie is rewritten + `localeSchema` rejects `'ja'` | `tests/unit/lib/validation/auth.test.ts`, `tests/integration/locale-persist.test.tsx`

### Foundation — Route constants

- [x] T017 [P] Create typed `ROUTES` constant covering all paths Homepage links to (`HOME`, `AWARDS`, `KUDOS`, `KUDOS_NEW`, `NOTIFICATIONS`, `PROFILE`, `ADMIN`, `RULES`, `COMMUNITY_STANDARDS`, `LOGIN`, `SIGN_OUT`) | `lib/routes.ts`
- [x] T018 [P] Shape test for `ROUTES` constant (keys present, values start with `/`) | `tests/unit/lib/routes.test.ts`

### Foundation — Awards catalogue

- [x] T019 [P] `Award` interface (slug + titleKey + descKey + image) | `lib/awards/types.ts`
- [x] T020 Static catalogue of 6 awards (Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025-Creator, MVP) referencing i18n keys + image paths from Phase 1 | `lib/awards/config.ts`
- [x] T021 Test that `awards` has 6 entries, all slugs unique kebab-case, every i18n key resolves, every image file exists | `tests/unit/lib/awards/config.test.ts`

### Foundation — Event helper

- [x] T022 [P] Tests covering valid ISO-8601 → Date, invalid string → null, unset env → null | `tests/unit/lib/event/config.test.ts`
- [x] T023 [P] `getEventStartAt(): Date | null` parsing `NEXT_PUBLIC_EVENT_START_AT` strictly | `lib/event/config.ts`
- [x] T024 [P] Tests for `computeCountdown(now, target)`: future date returns positive `{days,hours,minutes,started:false}`; past/null returns `{0,0,0,started:true}`; minute boundary advances correctly | `tests/unit/lib/event/countdown.test.ts`
- [x] T025 [P] Pure `computeCountdown` function returning `{days,hours,minutes,started}` with 2-digit padding handled by the consumer | `lib/event/countdown.ts`

### Foundation — Users service

- [x] T026 [P] `UserProfile` type (id, email, displayName, avatarUrl, locale, role) | `lib/users/types.ts`
- [x] T027 [P] Tests for `getCurrentUserProfile()`: returns `null` when session missing, returns row when session present, returns `null` (does NOT throw) on 401/row-lookup failure | `tests/unit/lib/users/actions.test.ts`
- [x] T028 [P] `getCurrentUserProfile()` Server Action — fetches via `createServerClient()`, soft-degrades to `null` on any auth failure | `lib/users/actions.ts`

### Foundation — Notifications service (stubs)

- [x] T029 [P] `Notification` type | `lib/notifications/types.ts`
- [x] T030 [P] Tests asserting `getUnreadCount()` returns `0` and `getRecentNotifications({limit})` returns `[]` (stub behavior) | `tests/unit/lib/notifications/actions.test.ts`
- [x] T031 [P] Server Actions `getUnreadCount()` and `getRecentNotifications({limit})` returning constants (will be replaced when notifications spec ships) | `lib/notifications/actions.ts`

### Foundation — Shared header/footer extensions

- [x] T032 Extend `AppHeader` tests: existing slot rendering still passes; new `nav?` and `controls?` slots render; `logoHref?` toggles interactive vs. non-interactive logo | `tests/unit/components/AppHeader.test.tsx`
- [x] T033 Extend `AppHeader` with optional `nav?: ReactNode`, `controls?: ReactNode`, and `logoHref?: string` props; existing `children` aliases to `controls` for BC; update JSDoc to describe both logo modes | `components/organisms/AppHeader.tsx`
- [x] T034 Extend `AppFooter` tests: default `login` variant unchanged; `homepage` variant renders logo + 4 nav links + copyright | `tests/unit/components/AppFooter.test.tsx`
- [x] T035 Extend `AppFooter` with optional `variant?: 'login' \| 'homepage'` (default `'login'`); homepage variant uses `ROUTES` + i18n keys | `components/organisms/AppFooter.tsx`

### Foundation — Toast molecule

- [x] T036 [P] Tests: Toast renders with `aria-live="polite"`, auto-dismisses after configured timeout, supports manual dismiss | `tests/unit/components/Toast.test.tsx`
- [x] T037 [P] Minimal Toast component for FR-026 failure messaging | `components/molecules/Toast.tsx`

### Foundation — Middleware (homepage public)

- [ ] T038 Test asserting anonymous `GET /` returns 200 (does NOT redirect to `/login`) and middleware still refreshes session cookies on other matched paths | `tests/integration/middleware-public-home.test.ts`
- [x] T039 Remove `/` from `isProtectedPath()` in middleware (anonymous traffic welcome on homepage) | `middleware.ts`

### Foundation — ComingSoon organism

- [x] T040 [P] Tests: ComingSoon renders title, screen-specific subtitle, message, and "back home" link to `/` | `tests/unit/components/ComingSoon.test.tsx`
- [x] T041 [P] `ComingSoon` Server Component | `components/organisms/ComingSoon.tsx`

### Foundation — 8 placeholder routes (Phase 1.5 in plan)

- [x] T042 [P] Stub `/awards` page rendering `<ComingSoon />` | `app/awards/page.tsx`
- [x] T043 [P] Stub `/kudos` page | `app/kudos/page.tsx`
- [x] T044 [P] Stub `/kudos/new` page | `app/kudos/new/page.tsx`
- [x] T045 [P] Stub `/notifications` page | `app/notifications/page.tsx`
- [x] T046 [P] Stub `/profile` page | `app/profile/page.tsx`
- [x] T047 [P] Stub `/admin` page | `app/admin/page.tsx`
- [x] T048 [P] Stub `/rules` page | `app/rules/page.tsx`
- [x] T049 [P] Stub `/community-standards` page | `app/community-standards/page.tsx`
- [ ] T050 Parametric integration test: each of the 8 placeholder paths returns 200 and renders the localized ComingSoon heading | `tests/integration/placeholders.test.ts`

**Checkpoint**: All foundational components exist, locale narrowed, middleware lets `/` through, placeholders prevent broken links. User-story phases can now proceed in parallel.

---

## Phase 3: User Story 1 — View the campaign and discover awards (Priority: P1) 🎯 MVP

**Goal**: Anonymous visitor lands on `/`, sees the public homepage content (header without auth UI, hero, awards grid, kudos promo, widget, footer), and can click any award card to navigate to `/awards#{slug}`.

**Independent Test**: Open `/` anonymously → all 6 award cards render → click "Top Talent" → browser navigates to `/awards#top-talent`. Hover any award card → card displays its hover state.

### Tests (US1) — TDD-first

- [x] T060 [P] [US1] Tests for `AwardCard`: renders title + 2-line ellipsised description + image with alt + "Chi tiết" link; whole card wrapped in a single `<Link>` to `/awards#{slug}` | `tests/unit/components/AwardCard.test.tsx`
- [x] T061 [P] [US1] Tests for `AwardsGridSection`: renders all 6 awards from catalogue in deterministic order; section header from i18n; responsive container | `tests/unit/components/AwardsGridSection.test.tsx`
- [x] T062 [US1] Anonymous SSR integration test: GET `/` renders header (no bell, anonymous profile menu), awards grid (6 cards), placeholders for hero/kudos/widget, footer (homepage variant); no auth-only nodes leaked | `tests/integration/homepage-anonymous.test.tsx`

### Implementation (US1)

- [x] T063 [P] [US1] `AwardCard` Server Component — image + title + line-clamp-2 description + "Chi tiết" affordance, all inside a single `<Link>` to `/awards#{slug}` | `components/organisms/homepage/AwardCard.tsx`
- [x] T064 [US1] `AwardsGridSection` Server Component — section header (caption + title + subtitle) + grid container iterating `awards` from catalogue | `components/organisms/homepage/AwardsGridSection.tsx`
- [x] T065 [US1] Initial `HomepageHeader` Server Component (logo + `LanguageSwitcher`; nav and bell slots stubbed empty for now — US3/US6 will fill them) | `components/organisms/homepage/HomepageHeader.tsx`
- [x] T066 [US1] Initial `HomepageHeader` test (anonymous baseline: logo as link, language switcher visible, no bell, anonymous profile dropdown) | `tests/unit/components/HomepageHeader.test.tsx`
- [x] T067 [US1] Rewrite `app/page.tsx` as Server Component: fetch session via `createServerClient()` (no `redirect` to `/login`), call `getCurrentUserProfile()` (may be `null`), render `<HomepageHeader user={user} unreadCount={0} />`, hero placeholder div (filled in US2), `<AwardsGridSection />`, kudos placeholder div (filled in US5), widget placeholder div (filled in US5), `<AppFooter variant="homepage" />` | `app/page.tsx`

### E2E (US1)

- [ ] T068 [US1] Playwright E2E: anonymous user lands `/` → 6 award cards visible → click "Top Talent" card image → URL = `/awards#top-talent` → click "Top Project" title → URL = `/awards#top-project` → repeat for all 6 awards → hashtag for missing slug navigates without crash (covers Test IDs 47–52, 62) | `tests/e2e/homepage.spec.ts`

**Checkpoint**: US1 complete. `/` renders publicly, awards navigate correctly. Suitable to ship as MVP if US2/US3 are not yet ready.

---

## Phase 4: User Story 2 — See live countdown to the ceremony (Priority: P1)

**Goal**: Hero section displays a countdown that updates every minute. When event time is reached/past or env is invalid, countdown shows `00 00 00` and hides "Coming soon".

**Independent Test**: With `NEXT_PUBLIC_EVENT_START_AT` set to a future ISO-8601, `/` shows `DD HH MM` tiles ticking; wait one minute → Minutes value decrements; set env to invalid/past → tiles show `00 00 00` and "Coming soon" hidden.

### Tests (US2) — TDD-first

- [x] T070 [P] [US2] Tests for `CountdownTile`: renders 2-digit zero-padded number + label (DAYS/HOURS/MINUTES) | `tests/unit/components/CountdownTile.test.tsx`
- [x] T071 [P] [US2] Tests for `CountdownTimer` using `vi.useFakeTimers()`: initial values match `computeCountdown`; advancing 60s decrements minutes; advancing past zero freezes at `00 00 00` and hides "Coming soon"; `aria-live` only announces on minute change (not every render); cleans up interval on unmount | `tests/unit/components/CountdownTimer.test.tsx`
- [x] T072 [P] [US2] Tests for `HeroSection`: renders ROOT FURTHER artwork (image with alt), "Coming soon" sub-label (visible when not started), `CountdownTimer`, event info block (time + venue + broadcast note), CTA group ("ABOUT AWARDS" → `/awards`, "ABOUT KUDOS" → `/kudos`), description paragraphs | `tests/unit/components/HeroSection.test.tsx`

### Implementation (US2)

- [x] T073 [P] [US2] `CountdownTile` Client Component: receives `value: number` + `label: string`, renders padded 2-digit display + label | `components/molecules/CountdownTile.tsx`
- [x] T074 [US2] `CountdownTimer` Client Component: takes `target: Date | null` as prop; uses `useEffect` + setInterval(60_000) that recomputes from `Date.now()` on every tick (no accumulation); wraps tiles in `<div role="timer" aria-live="polite">`; suppresses repeat announcements within the same minute | `components/molecules/CountdownTimer.tsx`
- [x] T075 [US2] `HeroSection` Server Component composes Root/Further logotypes + "Coming soon" label + `CountdownTimer` + event info block + CTA buttons + description paragraphs; reads `getEventStartAt()` and passes target to client component | `components/organisms/homepage/HeroSection.tsx`
- [x] T076 [US2] Replace hero placeholder in `app/page.tsx` with `<HeroSection />` | `app/page.tsx`

### E2E (US2)

- [ ] T077 [US2] Playwright E2E: env set to future date → countdown tiles display 2-digit values → wait 60s (mocked via `clock.fastForward(60_000)` or real wait) → minutes decrement; env set to past → tiles `00 00 00` + "Coming soon" hidden; env invalid → same fallback (covers Test IDs 12, 39–43, 56, 60) | `tests/e2e/homepage.spec.ts`

**Checkpoint**: US2 complete. Countdown ticks, fallbacks work.

---

## Phase 5: User Story 3 — Personalized header for authenticated users (Priority: P1)

**Goal**: Signed-in users see bell with unread indicator (driven by stubbed service, currently always 0); clicking bell opens overlay with latest 5 + "See all"; profile menu shows role-specific items (Profile/Sign out for users, +Admin Dashboard for admins). Anonymous users see no bell and an anonymous profile menu with just "Sign in".

**Independent Test**: Sign in as a regular user → reload `/` → bell visible (no badge since count = 0) → click bell → overlay shows empty state + "See all" link → click avatar → menu shows Profile + Sign out only. Sign in as admin → same flow but profile menu includes Admin Dashboard. Sign out → redirect to `/login`. Anonymous → bell hidden; avatar opens anon menu with only "Sign in".

### Tests (US3) — TDD-first

- [x] T080 [P] [US3] Tests for `BellIcon` atom: renders SVG with `aria-hidden` | `tests/unit/components/BellIcon.test.tsx`
- [x] T081 [P] [US3] Tests for `UnreadBadge` atom: hidden when `count === 0`; visible (with translated aria-label) when `count > 0` | `tests/unit/components/UnreadBadge.test.tsx`
- [x] T082 [P] [US3] Tests for `NotificationButton`: not rendered when `user === null`; rendered with badge state matching prop; click toggles overlay open/closed; outside-click/Esc closes; keyboard Enter/Space open it | `tests/unit/components/NotificationButton.test.tsx`
- [x] T083 [P] [US3] Tests for `NotificationOverlay`: lists notifications (or empty state copy from `notifications.emptyState`); "See all" link routes to `ROUTES.NOTIFICATIONS` | `tests/unit/components/NotificationOverlay.test.tsx`
- [x] T084 [P] [US3] Tests for `ProfileMenu`: 3 variants — anonymous shows only "Sign in" → `/login`; user shows Profile + Sign out; admin adds Admin Dashboard. Sign out submits to `/auth/signout`. Outside-click/Esc/keyboard semantics covered | `tests/unit/components/ProfileMenu.test.tsx`
- [x] T085 [US3] Authenticated SSR integration test: regular user → bell + 2-item profile menu, no admin link; admin user → bell + 3-item profile menu | `tests/integration/homepage-authenticated.test.tsx`
- [x] T086 [US3] Integration test for bell overlay: click bell → fetch latest 5 (stub returns empty) → overlay renders empty state + "See all" link; clicking "See all" navigates to `/notifications` | `tests/integration/notifications-overlay.test.tsx`

### Implementation (US3)

- [x] T087 [P] [US3] `BellIcon` atom (decorative SVG) | `components/atoms/BellIcon.tsx`
- [x] T088 [P] [US3] `UnreadBadge` atom (hidden when count = 0; translated `aria-label`) | `components/atoms/UnreadBadge.tsx`
- [x] T089 [US3] `NotificationButton` Client Component — renders bell + badge; click toggles overlay; lazy-fetches via `getRecentNotifications({limit:5})` on open; outside-click/Esc/keyboard semantics mirror `LanguageSwitcher` pattern | `components/molecules/NotificationButton.tsx`
- [x] T090 [US3] `NotificationOverlay` Client Component — list/empty + "See all" link | `components/molecules/NotificationOverlay.tsx`
- [x] T091 [US3] `ProfileMenu` Client Component — derives items from `user` prop (null → anon; role-based otherwise); sign-out submits `<form action="/auth/signout" method="post">`; outside-click/Esc/keyboard | `components/molecules/ProfileMenu.tsx`
- [x] T092 [US3] Wire `NotificationButton` (when `user !== null`) and `ProfileMenu` (always) into `HomepageHeader` — replacing the empty `controls` slot placeholders from US1 | `components/organisms/homepage/HomepageHeader.tsx`
- [x] T093 [US3] Update `app/page.tsx` to fetch `unreadCount` via `getUnreadCount()` (only when `user !== null`) and pass both `user` and `unreadCount` to `HomepageHeader` | `app/page.tsx`

### E2E (US3)

- [ ] T094 [US3] Playwright E2E covering all US3 acceptance scenarios using auth fixtures (anonymous, regular user, admin user) + sign-out roundtrip → `/login` (covers Test IDs 0–6, 27, 30–38) | `tests/e2e/homepage.spec.ts`

**Checkpoint**: US3 complete. Auth-aware header behavior verified across all three user states.

---

## Phase 6: User Story 4 — Switch interface language (Priority: P2)

**Goal**: Visitors can switch between `VN` and `EN` via the language dropdown; selection persists across reload (cookie) and surfaces a toast if the server action fails.

**Independent Test**: On `/` in `vi`, click `VN` → dropdown shows VN and EN only → select EN → all labels swap to English; reload → still EN. Mock `setLocale` to throw → toast appears, locale unchanged.

### Tests (US4) — TDD-first

- [x] T100 [P] [US4] Update existing `LanguageSwitcher` test: dropdown now exposes only `VN` and `EN` (no `JP`) | `tests/unit/components/LanguageSwitcher.test.tsx`
- [x] T101 [P] [US4] New `LanguageSwitcher` test: `setLocale` rejection → toast appears with `homepage.errors.localeSwitchFailed` copy → locale state unchanged → dropdown closed | `tests/unit/components/LanguageSwitcher.test.tsx`
- [x] T102 [US4] Integration test: switch locale via dropdown → cookie set → reload renders EN → switch back → cookie updated (covers Test IDs 24–26, 58) | `tests/integration/locale-persist.test.tsx`

### Implementation (US4)

- [x] T103 [US4] Wrap the `setLocale` call inside `LanguageSwitcher.onSelect` with `try/catch`; on error, render a `<Toast>` (auto-dismiss ~3s) using `homepage.errors.localeSwitchFailed`; do not change `currentLocale`; close dropdown regardless | `components/molecules/LanguageSwitcher.tsx`

### E2E (US4)

- [ ] T104 [US4] Playwright E2E: open `/`, switch VN→EN → labels swap → reload persists; switch EN→VN; verify only 2 options visible; mock-fail path covered in integration test (Playwright can't easily inject server-action failures) | `tests/e2e/homepage.spec.ts`

**Checkpoint**: US4 complete. Locale toggle works end-to-end, failure path covered.

---

## Phase 7: User Story 5 — Promote Sun\* Kudos and quick actions (Priority: P2)

**Goal**: Kudos promo block links to `/kudos`; floating widget opens an overlay with two actions (Viết Kudo → `/kudos/new`, Thể lệ SAA → `/rules`).

**Independent Test**: Click "Chi tiết" inside Kudos block → navigate to `/kudos`. Click floating widget pill → overlay opens with two named entries → click "Viết Kudo" → navigate to `/kudos/new`. Press Esc → overlay closes.

### Tests (US5) — TDD-first

- [x] T110 [P] [US5] Tests for `KudosPromoSection`: renders label + title + description + image + "Chi tiết" button linking to `ROUTES.KUDOS` | `tests/unit/components/KudosPromoSection.test.tsx`
- [x] T111 [P] [US5] Tests for `QuickActionWidget`: renders bottom-right pill (fixed-position container); click opens overlay; overlay contains exactly `Viết Kudo` → `/kudos/new` and `Thể lệ SAA` → `/rules`; outside-click + Esc close | `tests/unit/components/QuickActionWidget.test.tsx`

### Implementation (US5)

- [x] T112 [P] [US5] `KudosPromoSection` Server Component using i18n keys + `ROUTES.KUDOS` | `components/organisms/homepage/KudosPromoSection.tsx`
- [x] T113 [P] [US5] `QuickActionWidget` Client Component (fixed bottom-right; outside-click/Esc semantics from `LanguageSwitcher` pattern) | `components/organisms/homepage/QuickActionWidget.tsx`
- [x] T114 [US5] Replace kudos and widget placeholders in `app/page.tsx` with `<KudosPromoSection />` and `<QuickActionWidget />` | `app/page.tsx`

### E2E (US5)

- [ ] T115 [US5] Playwright E2E: click Kudos "Chi tiết" → `/kudos`; click widget → overlay → click each option (covers Test IDs 53–54) | `tests/e2e/homepage.spec.ts`

**Checkpoint**: US5 complete. Kudos promo + widget functional.

---

## Phase 8: User Story 6 — Reliable navigation from header & footer (Priority: P2)

**Goal**: All header and footer nav links resolve to the correct routes. Logo navigates to `/` and scrolls to top. Active state and `aria-current` set correctly.

**Independent Test**: From any other route (use `/awards` placeholder), click header logo → land on `/` scrolled to top. On `/`, hover an inactive nav link → hover state shown. "About SAA 2025" rendered with active/`aria-current="page"` state. Click footer links → each navigates to its target route.

### Tests (US6) — TDD-first

- [x] T120 [P] [US6] Tests for `NavLink`: renders `<Link>` with given href; computes active state via `usePathname` and an optional `activeOnHash`; exposes `aria-current="page"` when active; renders hover/active class hooks (asserted via class presence, not visual) | `tests/unit/components/NavLink.test.tsx`
- [x] T121 [P] [US6] Tests for `HeaderNav`: renders 3 nav links (About SAA 2025 → `/`, Awards Information → `/awards`, Sun\* Kudos → `/kudos`); "About SAA 2025" is `aria-current="page"` when pathname is `/` | `tests/unit/components/HeaderNav.test.tsx`

### Implementation (US6)

- [x] T122 [P] [US6] `NavLink` atom (Client Component for active-state detection) | `components/atoms/NavLink.tsx`
- [x] T123 [P] [US6] `HeaderNav` molecule rendering the 3 fixed homepage nav links | `components/molecules/HeaderNav.tsx`
- [x] T124 [US6] Wire `HeaderNav` into the `nav` slot of `HomepageHeader`; pass `logoHref="/"` on `AppHeader` so the logo becomes a link | `components/organisms/homepage/HomepageHeader.tsx`

### E2E (US6)

- [ ] T125 [US6] Playwright E2E: from `/awards` placeholder → click logo → URL `/` + scrolled to top; on `/`, click each header link → correct target route; click each footer link (About / Awards / Kudos / Tiêu chuẩn chung) → correct route; hover header link → hover state class present (covers Test IDs 2–4, 18–23, 55) | `tests/e2e/homepage.spec.ts`

**Checkpoint**: US6 complete. All nav links resolve and active-state semantics correct.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Cross-cutting quality: accessibility, broken-link sweep, performance, reduced-motion, regression sweep across all stories.

- [ ] T130 [P] Add `@axe-core/playwright` AA scan over `/` (anonymous + signed-in flows) — must report 0 violations | `tests/e2e/homepage.spec.ts`
- [ ] T131 [P] E2E "no broken links" sweep over every `<a href>` rendered on `/` (asserts 200 response) — covers Test ID-59, now passes thanks to Phase 2 placeholders | `tests/e2e/homepage.spec.ts`
- [ ] T132 [P] E2E reduced-motion check: enable `prefers-reduced-motion: reduce`, confirm award-card hover effect uses no `animation-*` and countdown still ticks | `tests/e2e/homepage.spec.ts`
- [ ] T133 [P] Manual Lighthouse run at hand-off documenting LCP/INP/CLS at 75th percentile against TR-001 targets; record results in PR description (no CI gating per `Resolved during reviewplan`) | (PR description)
- [ ] T134 [P] Final i18n audit: grep new component files for hard-coded user-facing strings; ensure all copy comes from `messages/{vi,en}.json` | `components/**/*.tsx`, `app/**/*.tsx`
- [ ] T135 [P] Update `README.md` with run instructions: `npm run dev`, env-var setup, where to set `NEXT_PUBLIC_EVENT_START_AT`, how to set an admin role manually | `README.md`
- [ ] T136 [P] Update `SCREENFLOW.md` to mark `Homepage SAA` row status from `discovered` to `implemented` and add a Discovery Log entry | `.momorph/contexts/SCREENFLOW.md`
- [ ] T137 Run the full pre-merge CI chain: `npm run lint && npm run typecheck && npm run test && npm run test:e2e && npm run build` — all green before opening PR | (CI)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → no dependencies — kick off immediately.
- **Foundation (Phase 2)** → depends on Phase 1 (especially the migration and assets). **BLOCKS** all user-story phases.
- **US1 (Phase 3)** → depends on Foundation. **MVP** — earliest shippable increment.
- **US2 (Phase 4)** → depends on Foundation; can run in parallel with US1 once Foundation is done (CountdownTimer + HeroSection touch different files than US1's AwardCard / AwardsGridSection).
- **US3 (Phase 5)** → depends on Foundation + US1 (because US3 wires bell/profile menu into the `HomepageHeader` introduced by US1).
- **US4 (Phase 6)** → depends on Foundation (uses Toast). Independent of other user stories; can run in parallel with US2/US5/US6 after Foundation.
- **US5 (Phase 7)** → depends on Foundation + US1 (replaces placeholders in `app/page.tsx`). Can run in parallel with US2/US3/US4 after US1's page composition lands.
- **US6 (Phase 8)** → depends on Foundation + US1 (wires HeaderNav into HomepageHeader from US1). Can run in parallel with US2/US3/US4/US5.
- **Polish (Phase N)** → depends on all user stories being complete.

### Within Each User Story

- Tests (Constitution §V — TDD) are written first and MUST fail before the production code is added.
- Atom-level components before molecules; molecules before organisms.
- Server Components first when possible; Client islands only when interaction demands it.
- E2E test sits at the tail of the story phase and asserts the user-facing behavior end-to-end.

### Parallel Opportunities

#### Within Setup (Phase 1)

- T002, T003, T004, T005 (asset downloads), T007, T008 are all parallel — different file trees.

#### Within Foundation (Phase 2)

- **i18n group**: T010, T011, T012, T013, T014 all parallel — separate files.
- **Awards group**: T019 parallel with i18n; T020 depends on T010/T011 (needs keys to exist).
- **Event group**: T022, T023, T024, T025 fully parallel — all different files in `lib/event/`.
- **Users + Notifications services**: T026–T031 parallel — different files.
- **Routes + types**: T017, T018 parallel.
- **AppHeader + AppFooter + Toast**: T032/T033 (header pair), T034/T035 (footer pair), T036/T037 (toast pair) all parallel as three pair-units.
- **Middleware + ComingSoon + Placeholders**: T038/T039 (middleware pair), T040/T041 (ComingSoon pair), T042–T049 (placeholder pages) all parallel.

#### Across Phase 3+

- After Foundation, **all six user-story phases** can be staffed in parallel (subject to the cross-phase wiring deps above).
- Within each story, tasks marked [P] are independent and can be parallelized.

### Suggested MVP Scope

**Ship Phase 1 + 2 + 3 (US1).** That delivers an anonymous-visitor homepage with awards discovery and a working header/footer skeleton. Test ID-59 ("no broken links") passes thanks to Phase 2 placeholders. Other user stories can ship in subsequent PRs without rework.

---

## Implementation Strategy

### MVP First (Recommended)

1. Complete Phase 1 (Setup) and Phase 2 (Foundation).
2. Complete Phase 3 (US1) — awards discovery.
3. **STOP and VALIDATE**: anonymous user can land on `/`, see awards grid, navigate to placeholder routes (all 200), no broken links.
4. Open MVP PR. Iterate next priorities in follow-ups.

### Incremental Delivery (post-MVP)

1. Phase 4 (US2 — countdown) → ship.
2. Phase 5 (US3 — auth-aware header) → ship.
3. Phases 6, 7, 8 (US4, US5, US6) can ship in any order or together → ship.
4. Phase N (Polish) → final cleanup PR before public launch.

---

## Notes

- Commit after each completed task or logical group. Keep commit subjects scoped (`feat(homepage): add AwardCard`, `test(homepage): countdown tile zero-padding`).
- TDD discipline (Constitution §V): if a test passes on first run, either the test is too weak or the implementation already existed — re-examine before progressing.
- Mark tasks complete with `[x]` as you go.
- Any rename of route paths after this feature ships (e.g., when the Dropdown-profile spec lands) is a **one-line** change to `lib/routes.ts` — no `<a href>` should reference a literal path anywhere else.
- The notifications service is stubbed; the `NotificationOverlay` will render the empty state copy until the Notifications spec replaces the service.
- All scenario-test mappings are documented in plan.md's _Spec Coverage Trace_ table; every acceptance scenario maps to one or more tests above.
