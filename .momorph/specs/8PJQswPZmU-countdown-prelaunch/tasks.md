# Tasks: Countdown — Prelaunch Page

**Frame**: `8PJQswPZmU-countdown-prelaunch` (Figma node `2268:35127`)
**Prerequisites**: plan.md (required), spec.md (required)
**Generated**: 2026-05-15

> `design-style.md` is intentionally absent — visual concerns are fetched
> on-demand at implementation time via Figma `query_section` / `get_media_file`
> per the momorph workflow. Phase 1 (Setup) covers the single hero asset and
> the cover-gradient `query_section`.
>
> This feature reuses `CountdownTile` + `CountdownTimer` + `lib/event/config.ts`
> shipped by `i87tDx10uM-homepage-saa`; the bulk of the work is **additive
> optional props** on those components plus a new middleware branch.

---

## Task Format

```
- [ ] T### [P?] [Story?] Description | file/path.ts
```

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this belongs to (US1, US2, US3, US4) — omitted in Setup, Foundation, and Polish phases
- **|**: File path(s) affected by this task
- **[TEST]**: Constitution §V (NON-NEGOTIABLE) — must be written first, observed to FAIL, then implementation follows. Reviewer checks the commit history shows red-before-green.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: assets + tokens + i18n keys that every story depends on. These can land before any user-story work begins.

### Asset Preparation (Plan Phase 0)

- [x] T001 Download `MM_MEDIA_BG` from Figma node `2268:35129` via MoMorph MCP `get_media_file`; save as PNG (≤ 250 KB target via WebP/AVIF conversion if needed) | public/prelaunch/hero-bg.png
- [x] T002 [P] Generate low-res blur placeholder for `hero-bg.png`; save the base64 data URL string to a `.txt` so it can be imported inline by `next/image placeholder="blur"` | public/prelaunch/hero-bg-blur.txt
- [x] T003 [P] Run `query_section` on Figma node `2268:35130` (cover gradient); compare gradient stops + opacity vs Homepage SAA's existing `--color-hero-background`. If different, add `--bg-prelaunch-cover` to `app/globals.css` and document its usage. If identical, document the reuse in a one-line comment next to `--color-hero-background` | app/globals.css

### i18n Keys (Plan Phase 1 step 4)

- [x] T004 [P] Add 4 prelaunch keys to vi locale: `prelaunch.heading` = "Sự kiện sẽ bắt đầu sau"; `prelaunch.units.days` = "DAYS"; `prelaunch.units.hours` = "HOURS"; `prelaunch.units.minutes` = "MINUTES"; `prelaunch.units.ariaLabel` = "Thời gian còn lại đến sự kiện" | messages/vi.json
- [x] T005 [P] Add same 5 keys to en locale: `prelaunch.heading` = "The event starts in"; `prelaunch.units.days/hours/minutes` (uppercase per Figma); `prelaunch.units.ariaLabel` = "Time remaining until event" | messages/en.json
- [x] T006 [P] Add same 5 keys to ja locale (soft-deprecated; kept only for parity test) — pick reasonable JP translations or fall back to en strings | messages/ja.json
- [x] T007 Run existing `messages-parity.test.ts` and confirm all 3 locale trees match — no missing keys, no extras (regression guard for FR-017) | tests/unit/lib/i18n/messages-parity.test.ts

### Routes Constant

- [x] T008 [P] Add `PRELAUNCH: '/prelaunch'` to the `ROUTES` object (one-line addition; file already exists per Homepage SAA Phase 1) | lib/routes.ts

### Env Documentation

- [x] T009 [P] Update `.env.example` comment for `NEXT_PUBLIC_EVENT_START_AT` to note that it now drives **both** the Homepage SAA countdown **and** the prelaunch gate (a future value triggers prelaunch; missing/past disables it) | .env.example
- [x] T010 [P] Add a brief README paragraph: "When `NEXT_PUBLIC_EVENT_START_AT` is set in the future, every public route renders prelaunch; set it to a past datetime (or unset it) to ship the real app." | README.md

**Checkpoint — Phase 1 done**: hero artwork + blur placeholder committed, gradient token decision recorded, all 3 locales carry `prelaunch.*` keys, parity test green, `ROUTES.PRELAUNCH` exported, env documented.

---

## Phase 2: Foundation (Blocking Prerequisites)

**Purpose**: pure helpers that every user story depends on. No UI yet.

**⚠️ CRITICAL**: no user story work can begin until Phase 2 is complete.

### `isPrelaunch` Helper (Plan Phase 1 step 3)

- [x] T011 [TEST] Write failing-first unit tests for `isPrelaunch(now?: Date)`: (a) `target = null` (unset) → `false` (FR-009 fail-open); (b) unparseable env → `false`; (c) target in the past → `false`; (d) target in the future → `true`; (e) explicit `now` param honored (deterministic) | tests/unit/lib/event/config.test.ts
- [x] T012 Implement `isPrelaunch(now: Date = new Date()): boolean` in `lib/event/config.ts` next to `getEventStartAt()`; JSDoc references FR-001, FR-006, FR-009; returns `false` when `getEventStartAt()` is `null` | lib/event/config.ts

### `assertEventStartConfig` Helper (Plan decision #7)

- [x] T013 [TEST] [P] Write failing-first unit tests for `assertEventStartConfig`: (a) env empty/unset → zero `logger.warn` calls; (b) env = non-empty unparseable string → exactly one `logger.warn('event.start_at.invalid', { raw })` with `raw` truncated to ≤ 64 chars; (c) idempotent — second invocation in same worker fires no additional warning; (d) `__resetEventStartConfigWarning()` test-only helper resets the guard | tests/unit/lib/event/config.test.ts
- [x] T014 Implement `assertEventStartConfig()` + `__resetEventStartConfigWarning()` in `lib/event/config.ts` with module-level `let warned = false`; lazy invocation (not module-load side effect); truncate raw env value to 64 chars to avoid leaking pasted secrets | lib/event/config.ts

### `preserveCookies` Helper (Plan decision #5)

- [x] T015 [TEST] [P] Write failing-first tests for `preserveCookies(src, dst)`: copies every cookie from `src.cookies.getAll()` onto `dst` via `dst.cookies.set(cookie)`; returns `dst`; handles empty source | tests/unit/lib/middleware/preserve-cookies.test.ts
- [x] T016 Implement `preserveCookies(src: NextResponse, dst: NextResponse): NextResponse` helper (can live inline in `middleware.ts` or extracted to `lib/middleware/preserve-cookies.ts` — decision: extract for testability) | lib/middleware/preserve-cookies.ts

### Analytics Seam (Plan Phase 4 step 17)

- [x] T017 [TEST] [P] Write failing-first test for `track(event, props?)`: calls `logger.info(\`analytics ${event}\`, props)`; default props is empty object | tests/unit/lib/analytics/track.test.ts
- [x] T018 Implement `track(event: string, props: Record<string, unknown> = {})` wrapping `logger.info` (MVP stub; replaced by real SDK later) | lib/analytics/track.ts

**Checkpoint — Phase 2 done**: `isPrelaunch` + `assertEventStartConfig` + `preserveCookies` + `track` all have passing tests; no UI affected yet; ready to gate routes.

---

## Phase 3: User Story 1 — Visitor sees the countdown during prelaunch (Priority: P1) 🎯 MVP

**Story Goal**: Any visitor (anonymous, authenticated, or admin) who navigates to the site before `NEXT_PUBLIC_EVENT_START_AT` is shown the prelaunch page with a live ticking countdown that decrements over time.

**Independent Test Criteria** (from spec.md US1):

- With `NEXT_PUBLIC_EVENT_START_AT` set to a future time, open `/` in a fresh browser
- Prelaunch hero renders with three tiles showing non-negative two-digit values
- The minutes value decrements at least once over a 90 s wall-clock window
- An authenticated admin visiting `/admin` sees prelaunch (no admin UI leaks)
- With 1d 5h 20m remaining, tiles display exactly `01`, `05`, `20`

### Component Extensions — `CountdownTile` (Plan Phase 3 step 10)

- [x] T019 [TEST] [US1] Extend tests for `CountdownTile`: with `placeholder="--"`, the tile renders a single span containing `--` (no `<DigitTile>` elements); `sr-only data-testid="countdown-value"` span contains `--`; unit label below remains intact; without `placeholder` prop, existing two-digit behavior unchanged | tests/unit/components/CountdownTile.test.tsx
- [x] T020 [US1] Add optional `placeholder?: string` to `CountdownTile`; when truthy, render placeholder span in place of digit tiles; existing call sites pass nothing → behavior unchanged | components/molecules/CountdownTile.tsx

### Component Extensions — `CountdownTimer` (Plan Phase 3 step 11)

- [x] T021 [TEST] [US1] Extend tests for `CountdownTimer`: (a) `hideComingSoon` branch suppresses the "Coming soon" sub-label; (b) `translationNamespace="prelaunch.units"` resolves the new keys; (c) `showPlaceholderOnNull + targetMs=null` renders `--` placeholders in all three tiles; (d) Homepage SAA's default behavior (no props passed) renders zeros, not placeholders | tests/unit/components/CountdownTimer.test.tsx
- [x] T022 [US1] Add 5 optional props to `CountdownTimer`: `hideComingSoon`, `translationNamespace` (default `'homepage.countdown'`), `comingSoonNamespace` (default `'homepage.hero'`), `showPlaceholderOnNull` (default `false`), `placeholder` (default `'--'`); replace hardcoded `useTranslations(...)` with the namespaced version; forward `placeholder` to each `CountdownTile` when `showPlaceholderOnNull && targetMs === null` | components/molecules/CountdownTimer.tsx

### Visibility Resync (FR-011, Plan Phase 3 step 11 / Phase 4 step 14)

- [x] T023 [TEST] [US1] Add test: simulate tab hidden for 5 fake-minutes (`vi.useFakeTimers` + `Object.defineProperty(document, 'visibilityState', ...)`); fire `visibilitychange` event with `visibilityState='visible'`; assert rendered minute value matches `Math.floor((target - now) / 60_000)` and not the value the interval would have produced if it had fired every minute uninterrupted | tests/unit/components/CountdownTimer.test.tsx
- [x] T024 [US1] Add `document.addEventListener('visibilitychange', onVisibilityChange)` inside the existing tick `useEffect`; on visible, call the same `tick()` the interval uses; cleanup removes the listener (FR-011) | components/molecules/CountdownTimer.tsx

### Prelaunch Page Composition (Plan Phase 3 step 12)

- [x] T025 [TEST] [P] [US1] Write failing-first test for `<PrelaunchBackground>`: renders `next/image` with `priority` + `placeholder="blur"` + `alt=""` (decorative); src points to `public/prelaunch/hero-bg.png`; blur data URL imported from `hero-bg-blur.txt` | tests/unit/components/PrelaunchBackground.test.tsx
- [x] T026 [US1] Implement `<PrelaunchBackground>` atom: full-bleed `next/image priority placeholder="blur"` + dark cover overlay (uses `--bg-prelaunch-cover` if T003 introduced it, else reuses `--color-hero-background`); `alt=""` because artwork is decorative | components/atoms/PrelaunchBackground.tsx
- [x] T027 [TEST] [P] [US1] Write failing-first test for `<PrelaunchHero>`: renders headline `<h1>` containing `prelaunch.heading` translation, renders three `CountdownTile`s (or `--` placeholders when `targetMs` is `null`), composes `<PrelaunchBackground>` | tests/unit/components/PrelaunchHero.test.tsx
- [x] T028 [US1] Implement `<PrelaunchHero>` organism (Server Component): `<PrelaunchBackground>` + centered hero block (`<h1>` headline + `<PrelaunchTimer>`); accepts `headline: string` + `targetMs: number | null` props | components/organisms/prelaunch/PrelaunchHero.tsx
- [x] T029 [TEST] [US1] Write failing-first test for `<PrelaunchTimer>` client wrapper: forwards `targetMs` to `<CountdownTimer>` with `translationNamespace="prelaunch.units"`, `hideComingSoon`, `showPlaceholderOnNull`; passes `onZero` callback (test the callback wiring; zero-crossing behavior covered by US2 tasks) | tests/unit/components/PrelaunchTimer.test.tsx
- [x] T030 [US1] Implement `<PrelaunchTimer>` client wrapper (`'use client'`); forwards to `<CountdownTimer>` with the right props; placeholder for `onZero` (real implementation in Phase 5 task T046) | components/organisms/prelaunch/PrelaunchTimer.tsx

### Prelaunch Page Route (Plan Phase 3 step 12)

- [x] T031 [TEST] [US1] Integration test for `app/prelaunch/page.tsx`: SSR renders headline + three tiles with real digits (not `--`) when env is set in future; uses `getEventStartAt()` + `isPrelaunch()` gate so past env → `targetMs === null` → `--` placeholders (decision #11); Supabase client is NOT invoked during render (mock `@/lib/supabase/server` and assert zero calls — TR-002) | tests/integration/prelaunch-page.test.tsx
- [x] T032 [US1] Implement `app/prelaunch/page.tsx` async Server Component: composes `<main tabIndex={-1}>` + `<PrelaunchHero>`; `metadata.robots = { index: false, follow: false }` (FR-014); compute `targetMs = target !== null && isPrelaunch() ? target.getTime() : null` (decision #11 — past env collapses to `null`) | app/prelaunch/page.tsx

**Checkpoint — US1 ready for middleware**: direct visit to `/prelaunch` renders the hero correctly under all four env states (future / past / unset / invalid). Middleware wiring lives in US3 (Phase 4) because the rewrite behavior is what US3 explicitly tests.

---

## Phase 4: User Story 3 — Direct visits to deep links during prelaunch surface the prelaunch page (Priority: P1)

**Story Goal**: Any in-scope path (`/`, `/login`, `/awards`, `/kudos/abc`, `/profile`, `/admin`, unknown routes) returns the prelaunch page with HTTP 200 during prelaunch — not a 401/403/404 or a redirect to `/login`. API routes (other than `/api/auth/*` and `/api/healthz`) short-circuit with HTTP 503 `{ "error": "prelaunch" }`. Next.js internals and `/auth/callback` pass through.

**Independent Test Criteria** (from spec.md US3):

- With prelaunch active, requesting `/awards`, `/kudos/anything`, `/profile`, `/admin`, `/some-bogus-path`, `/login` each renders the prelaunch HTML (HTTP 200)
- `/_next/static/...`, `/_next/image`, `/favicon.ico`, image-extension assets pass through
- `/api/foo` returns HTTP 503 with `{ "error": "prelaunch" }`; `/api/auth/*` and `/api/healthz` pass through
- TR-003: cookies set by `updateSession` survive both the rewrite and the 503 responses

**Note**: This story shares Phase 2 prerequisites with US1 (the `isPrelaunch` + `preserveCookies` helpers). It can be tested independently of US1 by asserting middleware behavior directly — the page render itself is covered in Phase 3.

### Middleware Branch (Plan Phase 2 step 6)

- [x] T033 [TEST] [US3] Write failing-first integration tests for `middleware-prelaunch.test.ts`: with env in future, every in-scope path returns the prelaunch HTML (200) via rewrite — sweep `/`, `/login`, `/awards`, `/kudos/abc`, `/profile`, `/admin`, `/random/unknown/path`; `/auth/callback?code=...` and `/auth/signout` pass through (FR-005 + decision #4); `/_next/static/...`, `/_next/image`, `/favicon.ico`, `/assets/foo.png`, `/something.svg` pass through (FR-004); with env unset, every path behaves exactly as today (regression guard) | tests/integration/middleware-prelaunch.test.ts
- [x] T034 [TEST] [US3] Add API matrix tests to the same file: `/api/auth/whatever` and `/api/healthz` pass through with no 503; any other `/api/...` path returns HTTP 503 with body `{ error: 'prelaunch' }`; with env unset, every `/api/...` path passes through | tests/integration/middleware-prelaunch.test.ts
- [x] T035 [TEST] [US3] Add TR-003 cookie test: simulate `updateSession` writing a `sb-access-token` cookie on `response.cookies`; assert both the rewrite response AND the 503 response carry the same cookie via `preserveCookies` | tests/integration/middleware-prelaunch.test.ts
- [x] T036 [TEST] [US3] Add FR-003 admin-bypass guard test: authenticated admin visiting `/admin` during prelaunch sees prelaunch (rewrite to `/prelaunch`), NOT a 401/403 or an authenticated UI | tests/integration/middleware-prelaunch.test.ts
- [x] T037 [US3] Implement the prelaunch branch in `middleware.ts` at the **top** of the function (before `isProtectedPath`): call `assertEventStartConfig()`; if `isPrelaunch()`: check `isApiAllowed(pathname)` → pass through; else `pathname.startsWith('/api/')` → return 503 with `preserveCookies`; else `isPrelaunchSkipped(pathname)` (`/prelaunch`, `/_next/`, `/auth/callback`, `/auth/signout`, image-extensions) → pass through; else rewrite to `/prelaunch` with `preserveCookies` (decision #5) | middleware.ts
- [x] T038 [US3] Update `config.matcher` regex in `middleware.ts` to **remove `login` from the exclude list** (decision #3); new regex: `'/((?!_next/static|_next/image|favicon.ico|assets|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'` — so `/login` flows through the gate | middleware.ts

**Checkpoint — US3 done**: all path variants from spec US3 acceptance scenarios route correctly under both env states; cookies preserved; admin bypass blocked.

---

## Phase 5: User Story 2 — Countdown transitions the user to Homepage SAA at launch (Priority: P1)

**Story Goal**: When the live countdown reaches zero on a client that already has the prelaunch page open, the client triggers a server re-render within 5 s; middleware re-evaluates `isPrelaunch()` → `false`; visitor lands on Homepage SAA without manual interaction.

**Independent Test Criteria** (from spec.md US2):

- Set `NEXT_PUBLIC_EVENT_START_AT` to ~90 s in the future, open prelaunch
- Wait for countdown to reach `00 / 00 / 00`; assert page navigates to (or re-renders as) Homepage SAA within 5 s
- After transition, the existing Supabase session cookie is honored (authenticated header visible for previously-authenticated users)
- The reload happens exactly once even across remounts (no infinite loop)

### `onZero` Single-Fire Logic (Plan decision #9, Phase 4 step 15)

- [ ] T039 [TEST] [US2] Extend `CountdownTimer` tests: fake-time advance until target is in the past; `onZero` callback fires exactly once when `value.started` becomes `true`; subsequent ticks do NOT re-fire `onZero` (single-fire via `firedZeroRef`); when `sessionStorage.prelaunchExitFired === '1'` on mount, `onZero` does NOT fire | tests/unit/components/CountdownTimer.test.tsx
- [ ] T040 [US2] Extend `CountdownTimer` with `onZero?: () => void` prop; fire it inside the tick effect when `next.started` becomes `true` AND `firedZeroRef.current === false` AND `sessionStorage.getItem('prelaunchExitFired') !== '1'`; after firing, set both `firedZeroRef.current = true` AND `sessionStorage.setItem('prelaunchExitFired', '1')`; guard `sessionStorage` access with `typeof window !== 'undefined'` | components/molecules/CountdownTimer.tsx

### `PrelaunchTimer` Zero-Crossing Wiring (Plan Phase 4 step 15)

- [ ] T041 [TEST] [US2] Extend `PrelaunchTimer` tests: fake-time advance until target is in the past; assert `router.refresh()` was called **exactly once**; assert `track('countdown_zero', { source: 'prelaunch' })` was called **exactly once**; even after many further ticks, neither is called again | tests/unit/components/PrelaunchTimer.test.tsx
- [ ] T042 [US2] Wire `onZero` callback in `PrelaunchTimer`: `useCallback(() => { track('countdown_zero', { source: 'prelaunch' }); router.refresh(); }, [router])`; pass it to `<CountdownTimer>` | components/organisms/prelaunch/PrelaunchTimer.tsx

### `prelaunch_view` On-Mount Emission (Plan decision #8)

- [ ] T043 [TEST] [US2] Add test in `PrelaunchTimer.test.tsx`: on mount, exactly one `track('prelaunch_view', { remaining_minutes: <number> })` call where the number is `days * 24 * 60 + hours * 60 + minutes` from `computeCountdown(new Date(), target)`; second render does NOT re-emit (effect dep array empty) | tests/unit/components/PrelaunchTimer.test.tsx
- [ ] T044 [US2] Add the `prelaunch_view` `useEffect` in `PrelaunchTimer.tsx`; eslint-disable `react-hooks/exhaustive-deps` for the empty dep array (intentional one-time fire) | components/organisms/prelaunch/PrelaunchTimer.tsx

### `PrelaunchExitTracker` on Homepage SAA (Plan decision #8, Phase 4 step 16)

- [ ] T045 [TEST] [P] [US2] Write failing-first test for `<PrelaunchExitTracker>`: mock `document.referrer` via `Object.defineProperty`; when referrer pathname === `/prelaunch`, exactly one `track('prelaunch_exit', {})` call fires AND `sessionStorage.removeItem('prelaunchExitFired')` is called; otherwise zero `track` calls | tests/unit/components/PrelaunchExitTracker.test.tsx
- [ ] T046 [US2] Implement `<PrelaunchExitTracker>` (`'use client'`); single `useEffect` on mount that parses `document.referrer` and fires `track('prelaunch_exit', {})` + clears `sessionStorage.prelaunchExitFired` when referrer ends with `/prelaunch` | components/molecules/PrelaunchExitTracker.tsx
- [ ] T047 [US2] Mount `<PrelaunchExitTracker />` once in `app/page.tsx` (Homepage SAA); one-line addition; no other Homepage SAA change required | app/page.tsx

**Checkpoint — US2 done**: countdown crosses zero → exactly one `router.refresh()` and one `countdown_zero` event; on landing at Homepage SAA, exactly one `prelaunch_exit` event; no infinite loop even under clock-skew remount scenarios.

---

## Phase 6: User Story 4 — Prelaunch page is search-engine-safe and analytics-tracked (Priority: P3)

**Story Goal**: The prelaunch page is not indexed by search engines (`<meta name="robots" content="noindex">`), and product can observe analytics events (`prelaunch_view`, `countdown_zero`, `prelaunch_exit`).

**Independent Test Criteria** (from spec.md US4):

- View rendered HTML; assert `<meta name="robots" content="noindex">` present
- Fresh session opens prelaunch → exactly one `prelaunch_view` analytics event with `{ remaining_minutes: number }`
- Countdown reaches zero → `countdown_zero` event with `{ source: "prelaunch" }`

**Note**: The three analytics events were already wired in US2 (Phase 5 tasks T042/T044/T046) because they piggyback on the same lifecycle hooks. This phase only adds the SEO assertion + a sanity sweep that the events fire under their final composed conditions.

### SEO Meta (FR-014, Plan Phase 4 step 18)

- [ ] T048 [TEST] [US4] Add assertion to `prelaunch-page.test.tsx`: rendered HTML head contains `<meta name="robots" content="noindex,nofollow">` (FR-014); verified via the `metadata.robots` export on `app/prelaunch/page.tsx` | tests/integration/prelaunch-page.test.tsx
- [ ] T049 [US4] Confirm `metadata.robots = { index: false, follow: false }` is set on `app/prelaunch/page.tsx` (already part of T032 — this task is a re-verification step that the export produces the right HTML in the SSR snapshot) | app/prelaunch/page.tsx

### No Focusable Elements (FR-015, Plan Phase 3 step 13)

- [ ] T050 [TEST] [US4] Add assertion to `prelaunch-page.test.tsx`: `querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])')` returns **zero** matches; only the `<main tabIndex="-1">` is permitted (FR-015) | tests/integration/prelaunch-page.test.tsx

### Analytics Sanity (FR-006 cross-check)

- [ ] T051 [TEST] [P] [US4] Add a sanity integration test that imports `<PrelaunchTimer>` with a mocked `@/lib/analytics/track`; renders it inside the page composition; asserts `prelaunch_view` fires exactly once on first render; mount/unmount cycle does NOT re-emit | tests/integration/prelaunch-page.test.tsx

**Checkpoint — US4 done**: `<meta robots>` present in 100% of server-rendered responses; zero focusable nodes; all three analytics events fire under their composed conditions.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: end-to-end coverage, accessibility audit, and final regression sweep.

### E2E Tests (Plan Phase 4 step 20)

- [ ] T052 [P] E2E for **US1**: with `NEXT_PUBLIC_EVENT_START_AT` set 1 hour ahead (Playwright fixture), navigate to `/`; assert headline visible + three tiles render; use `page.clock.fastForward(60_000)` and assert the minute tile decremented exactly once | tests/e2e/prelaunch.spec.ts
- [ ] T053 [P] E2E for **US2**: set env 2 minutes ahead; open `/prelaunch`; `page.clock.fastForward(120_000)`; assert page reloads and Homepage SAA hero countdown is visible; use `page.on('console', …)` to assert exactly one `prelaunch_exit` console log fired on Homepage SAA (since `track` writes to `logger.info` → `console.log` in MVP) | tests/e2e/prelaunch.spec.ts
- [ ] T054 [P] E2E for **US3**: for each of `/awards`, `/kudos/abc`, `/admin`, `/login`, `/totally/unknown` → assert HTTP 200 + prelaunch headline visible; for `/_next/image?url=…&w=1080&q=75` and `/favicon.ico` → assert asset responds (no rewrite); for `/api/auth/whatever` (mocked) → assert no 503; for `/api/foo` → assert `{ status: 503, body: { error: 'prelaunch' } }` | tests/e2e/prelaunch.spec.ts
- [ ] T055 [P] axe-core full sweep on the prelaunch page → zero WCAG 2.1 AA violations | tests/e2e/prelaunch.spec.ts
- [ ] T056 [P] axe-core **targeted color-contrast assertion** (decision #10): `new AxeBuilder({ page }).options({ runOnly: ['color-contrast'] }).include('main').analyze()` → `results.violations` has length 0; reported separately so a contrast regression is unambiguous | tests/e2e/prelaunch.spec.ts

### Cross-Cutting Verification

- [ ] T057 Manual Lighthouse run at hand-off: LCP < 2.5 s at the 75th percentile on the prelaunch page (TR-001); document the result in PR description; no CI gate per the Homepage SAA decision precedent | (no file — manual verification)
- [ ] T058 [P] Confirm `prefers-reduced-motion: reduce` is honored — no implicit animation on tile re-render. We don't add any animation; this is a regression guard via an existing axe rule or a small Playwright check | tests/e2e/prelaunch.spec.ts
- [ ] T059 [P] Run full quality gate before merge: `npm run lint && npm run typecheck && npm run test && npm run test:e2e`; attach output to PR | (no file — CI/local verification)

---

## Dependencies

### User Story Completion Order

```
Phase 1 (Setup) ─────┐
                     ├─→ Phase 2 (Foundation) ─→ Phase 3 (US1) ─→ Phase 7 (Polish)
                     │                       └─→ Phase 4 (US3) ─→
                     │                                            │
                     │                       Phase 5 (US2) ───────┤  (depends on Phase 3 components)
                     │                       Phase 6 (US4) ───────┤  (depends on Phase 3 page + Phase 5 events)
                     └────────────────────────────────────────────┘
```

- **Phase 1 (Setup)** can run entirely in parallel — no inter-task dependencies except T007 (parity test) which depends on T004–T006.
- **Phase 2 (Foundation)** is blocking: every user story depends on `isPrelaunch`, `preserveCookies`, and `track` existing.
- **US1 (Phase 3)** and **US3 (Phase 4)** are **independently testable** once Phase 2 is done:
  - US1 verifies the page renders correctly via direct visits to `/prelaunch`
  - US3 verifies middleware routes every other path to `/prelaunch`
  - Either can ship first; together they form the full visitor experience.
- **US2 (Phase 5)** depends on the components shipped in US1 (Phase 3) — it extends `CountdownTimer` + `PrelaunchTimer` with zero-crossing behavior.
- **US4 (Phase 6)** depends on US1 (page exists) + US2 (events wired) — but its tests are independent (SEO meta + no-focusable-nodes are pure page-render assertions).
- **Phase 7 (Polish)** depends on US1 + US2 + US3 + US4 being implemented.

### TDD Convention (Constitution §V — NON-NEGOTIABLE)

Every `[TEST]` task MUST be:

1. Written first
2. Run and observed to **FAIL** (red)
3. Then the corresponding implementation task is started (green)
4. Then refactor if needed

Reviewer checks the commit history shows red-before-green for each TDD pair.

---

## Parallel Execution Examples

### Phase 1 (Setup) — Maximum parallelism

```bash
# All of these can run concurrently after T001 (the only blocker for T002):
T001 → (downloads MM_MEDIA_BG)
T002 [P] depends only on T001
T003 [P] independent — pure Figma query + globals.css edit
T004 [P] [P] [P] T005 [P] T006 [P] independent — 3 separate locale files
T008 [P] independent — lib/routes.ts edit
T009 [P] T010 [P] independent — .env.example + README
T007 depends on T004 + T005 + T006 (parity test)
```

### Phase 2 (Foundation) — TDD pairs

```bash
# Test tasks T011, T013, T015, T017 can run in parallel (different files).
# Each implementation task (T012, T014, T016, T018) follows its corresponding test.
T011 [TEST] | T013 [TEST] [P] | T015 [TEST] [P] | T017 [TEST] [P]   # all 4 in parallel
T012 → T014 → T016 → T018                                            # serial after their tests
```

### Phase 3 (US1) — Component layers

```bash
# Tile + Timer extensions are independent files → parallel:
T019 [TEST] [US1] (CountdownTile.test) | T021 [TEST] [US1] (CountdownTimer.test) [P]
T020 [US1] (CountdownTile.tsx) | T022 [US1] (CountdownTimer.tsx) [P]

# After T020 + T022, the visibility resync pair is its own commit:
T023 [TEST] [US1] → T024 [US1]

# Background + Hero + Timer wrapper tests are independent:
T025 [TEST] [P] [US1] | T027 [TEST] [P] [US1] | T029 [TEST] [US1]     # all in parallel

# Their implementations follow:
T026 [US1] | T028 [US1] | T030 [US1]                                   # parallel

# Finally the page composition:
T031 [TEST] [US1] → T032 [US1]
```

### Phase 7 (Polish) — Fully parallel E2E

```bash
T052 [P] | T053 [P] | T054 [P] | T055 [P] | T056 [P] | T058 [P] | T059 [P]
T057 is manual (Lighthouse) — sequential by nature
```

---

## Implementation Strategy

### MVP Scope (Suggested First Cut)

**Phase 1 (Setup) + Phase 2 (Foundation) + Phase 3 (US1) + Phase 4 (US3)**.

This gives a fully functional prelaunch gate:

- Every in-scope route serves the prelaunch page during prelaunch (US3)
- The page renders correctly with a live countdown (US1)
- Cookies, OAuth, and assets all behave (US3)

**Defer if time-constrained**:

- **US2 (auto-transition)** — visitors will need to refresh manually when the countdown hits zero. Annoying but not broken.
- **US4 (SEO + analytics)** — Google indexing the prelaunch page is the only cosmetic concern; FR-014 can be added in a quick follow-up.

### Incremental Delivery

1. **Sprint 1 (MVP)**: Phase 1 + Phase 2 + Phase 3 + Phase 4 → ship the gate.
2. **Sprint 2 (UX polish)**: Phase 5 → auto-transition + analytics events for funnel analysis.
3. **Sprint 3 (SEO + final polish)**: Phase 6 + Phase 7 → noindex + axe sweep + Lighthouse.

### Phase-by-Phase Risk

| Phase   | Risk Level | Why                                                                                                                           |
| ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Phase 1 | Low        | Pure asset + i18n + constant edits. No logic.                                                                                 |
| Phase 2 | Low        | Pure helpers, all behind `[TEST]`-first tasks.                                                                                |
| Phase 3 | Medium     | Component prop extensions risk breaking Homepage SAA's existing call sites — mitigated by "default values preserve behavior". |
| Phase 4 | Medium     | Middleware ordering + cookie preservation are the easy-to-get-wrong parts — covered by the dedicated test matrix.             |
| Phase 5 | Medium     | Single-fire guarantee across remounts requires careful `useRef` + `sessionStorage` orchestration (decision #9).               |
| Phase 6 | Low        | Mostly SSR snapshot assertions on metadata already set in Phase 3.                                                            |
| Phase 7 | Low        | E2E + Lighthouse — finds regressions; doesn't introduce them.                                                                 |

---

## Summary

- **Total tasks**: 59 (T001–T059)
- **Setup (Phase 1)**: 10 tasks (T001–T010)
- **Foundation (Phase 2)**: 8 tasks (T011–T018)
- **US1 — Visitor sees countdown (Phase 3)**: 14 tasks (T019–T032)
- **US3 — Deep links surface prelaunch (Phase 4)**: 6 tasks (T033–T038)
- **US2 — Auto-transition at zero (Phase 5)**: 9 tasks (T039–T047)
- **US4 — SEO + analytics (Phase 6)**: 4 tasks (T048–T051)
- **Polish (Phase 7)**: 8 tasks (T052–T059)

**TDD pairs**: 23 `[TEST]` tasks paired with 23 implementation tasks (plus 13 implementation tasks that piggyback on existing Homepage SAA test coverage per TR-004).

**Parallel opportunities**: 38 tasks marked `[P]` — Phase 1 + Phase 7 are almost entirely parallel; Phase 3 has 3 independent component layers (Tile, Timer, Page) that run side-by-side.

**Independent test criteria recap**:

- **US1**: future env → `/` shows hero with three two-digit tiles; minute decrements within 90 s.
- **US3**: every in-scope path returns prelaunch HTML; `/api/*` returns 503 except `/api/auth/*` + `/api/healthz`; assets pass through.
- **US2**: countdown reaches zero → page reloads into Homepage SAA within 5 s without manual interaction; exactly once.
- **US4**: `<meta robots noindex>` present; `prelaunch_view` + `countdown_zero` + `prelaunch_exit` fire under their composed conditions.
