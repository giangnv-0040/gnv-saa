# Implementation Plan: Countdown — Prelaunch Page

**Frame**: `8PJQswPZmU-countdown-prelaunch` (Figma node `2268:35127`)
**Date**: 2026-05-15
**Spec**: `specs/8PJQswPZmU-countdown-prelaunch/spec.md`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**Status**: Reviewed (via `/momorph.reviewplan` on 2026-05-15, re-reviewed 2026-05-15)

---

## Resolved during `reviewplan` (2026-05-15)

These decisions were locked during plan review and supersede earlier wording
in this document:

1. **i18n key wiring** — The existing `CountdownTimer` hardcodes
   `useTranslations('homepage.countdown')` and `useTranslations('homepage.hero')`,
   so the new `prelaunch.units.*` and `prelaunch.aria` keys mandated by
   spec FR-017 would never be read if we reused the component verbatim.
   **Resolution**: extend `CountdownTimer` with an optional
   `translationNamespace?: string` prop (default `'homepage.countdown'`)
   plus an optional `comingSoonNamespace?: string`. The prelaunch caller
   passes `translationNamespace="prelaunch.units"` so it consumes the new
   keys without forking the component. The existing Homepage SAA call
   site passes nothing → behavior unchanged.
2. **FR-009 `--` placeholder rendering** — The existing `CountdownTile`
   always renders numeric digits; when `targetMs === null` the Timer
   currently shows `00 / 00 / 00`, not `-- / -- / --` as FR-009 requires.
   **Resolution**: extend `CountdownTile` with an optional
   `placeholder?: string` (e.g. `'--'`); when present, `placeholder` is
   rendered instead of the digit pair. `CountdownTimer` forwards a
   placeholder string when `targetMs === null` AND a new
   `showPlaceholderOnNull?: boolean` prop is `true` (default `false` so
   Homepage SAA keeps showing zeros for a missing env, matching its
   existing behavior). Prelaunch passes `showPlaceholderOnNull`.
3. **Middleware matcher gap** — The existing matcher excludes `/login`,
   so middleware never runs there. FR-002 requires `/login` to render the
   prelaunch page during prelaunch (covered by US3 acceptance scenario 1).
   **Resolution**: remove `login` from the matcher exclude list. The
   matcher now runs for `/login` too, which is harmless when prelaunch is
   off (no protected-path match, no rewrite — just session refresh).
4. **API surface reality** — The codebase has **no `app/api/` directory**
   today; auth handlers live at `/auth/callback` and `/auth/signout`. The
   spec's "/api/_" wording is forward-looking. **Resolution**: the
   middleware short-circuit operates on whatever `/api/_`routes ship in
the future (a path-prefix branch in middleware), AND`/auth/signout`is added to the prelaunch skip-list alongside`/auth/callback`so a
stale tab from a pre-prelaunch session can still complete sign-out.`/auth/callback`skip is already in place via FR-005. No`prelaunchGuard()` helper is shipped — the gate lives in middleware
   only. (See _Architecture Decisions › Backend Approach_ for the
   consolidated middleware shape.)

   > **`/auth/signout` rationale (spec gap)**: spec FR-005 mentions only
   > `/auth/callback` as the exempt auth page-route, but the codebase
   > also ships `/auth/signout` (a POST handler used by `ProfileMenu`).
   > If we rewrote `/auth/signout` to the prelaunch HTML, a stale
   > pre-prelaunch tab calling POST `/auth/signout` would silently fail
   > to clear the session — the user would remain "signed in" when
   > prelaunch ends, which is confusing UX. Adding `/auth/signout` to
   > the skip-list is the safer interpretation of the spec's intent
   > ("OAuth flow can complete"; signout is the symmetric session
   > teardown). Tracked as a non-blocking question in _Open Questions_.

5. **Cookie preservation on rewrite** — `NextResponse.rewrite(url, { headers: response.headers })` is fragile because cookie metadata is
   re-serialized rather than re-applied. **Resolution**: use the
   documented pattern — build the rewrite response, then iterate
   `response.cookies.getAll()` and re-apply each via
   `rewriteResponse.cookies.set(name, value, options)`. The Phase 2 test
   asserts a `Set-Cookie` header survives the rewrite (TR-003 regression
   guard).
6. **`/prelaunch` direct visits when env is unset/past** — Plan was
   silent. **Resolution**: the page renders normally with `--`
   placeholders (FR-009 behavior); we do not 404 or redirect. This makes
   the page robust to staging dry-runs and to QA bookmarks.
7. **Misconfiguration logging** (FR-009 detail) — **Resolution**: when
   `getEventStartAt()` returns `null` AND the raw env value is non-empty
   (i.e. unparseable, not just missing), `assertEventStartConfig()` (a
   new helper in `lib/event/config.ts`) emits
   `logger.warn('event.start_at.invalid', { raw: '<scrubbed>' })`. The
   "scrubbed" value is the raw env string truncated to 64 chars to avoid
   leaking accidentally-pasted secrets. **Invocation is lazy and
   idempotent**: called from `middleware.ts` as the first statement,
   guarded by a module-level `let warned = false` so the warning fires at
   most once per worker lifetime. **Not** a module-load side effect (that
   would fire during Vitest module collection and during build).
8. **`prelaunch_exit` analytics** — spec lists this event alongside
   `prelaunch_view` and `countdown_zero`. **Resolution**: emit
   `prelaunch_exit` from Homepage SAA's `app/page.tsx` when the document
   referrer ends with `/prelaunch` (one-line client-side check in a tiny
   `'use client'` effect under `components/molecules/PrelaunchExitTracker.tsx`,
   mounted only on Homepage SAA). The event fires once per page load.
9. **Single-fire reload + clock-skew loop** — refined: `onZero` is
   guarded by a `useRef`; on rare clock-skew loops where the server still
   reports prelaunch after a refresh, the new client mount re-initializes
   `firedZeroRef = false` and may fire again. **Resolution**: write the
   single-fire marker to `sessionStorage` (`prelaunchExitFired=1`); the
   `useEffect` reads it on mount and skips firing if already set. Cleared
   when Homepage SAA loads. This avoids the worst-case repeat-refresh
   loop on a clock-skewed client.
10. **WCAG contrast verification** — axe-core E2E sweep alone may pass
    despite a borderline contrast on the artwork; **Resolution**: the
    Phase 4 E2E pass adds a targeted contrast assertion using
    `@axe-core/playwright` configured with `runOnly: ['color-contrast']`
    on the `<main>` element, reported separately so a contrast regression
    is unambiguous.
11. **Past-date direct visit must show `--` placeholders** (re-review
    2026-05-15) — decision #6 specifies that a direct visit to
    `/prelaunch` when `NEXT_PUBLIC_EVENT_START_AT` is **unset OR in the
    past** renders `--` in every tile. The Phase 3 step 11 implementation
    only triggers `--` when `targetMs === null` (via
    `showPlaceholderOnNull`). Passing a past timestamp would short-circuit
    through `computeCountdown`'s `STARTED` return and render `00 / 00 / 00`
    — contradicting both decision #6 and the Phase 3 step 13 test
    ("with env set in the past, behavior is identical to unset").
    **Resolution**: in `app/prelaunch/page.tsx`, normalize past env values
    to `null` **before** passing `targetMs` to `PrelaunchTimer` — i.e.
    treat "no live countdown to render" as the single trigger for the
    placeholder branch. Use `isPrelaunch()` from `lib/event/config.ts`
    (already required by Phase 1 step 3) as the gate:
    ```ts
    const target = getEventStartAt();
    const targetMs = target !== null && isPrelaunch() ? target.getTime() : null;
    ```
    Phase 3 step 13's "past" test now exercises this real branch rather
    than relying on `computeCountdown`'s STARTED fallback.

---

## Summary

Ship a server-truthful **prelaunch gate** for the whole site: while
`NEXT_PUBLIC_EVENT_START_AT` is in the future, every in-scope request (`/`,
`/awards`, `/kudos`, `/profile`, `/admin`, unknown paths, even `/login`) is
**rewritten** by `middleware.ts` to render the prelaunch page — a single
full-bleed hero featuring the campaign artwork, the headline _"Sự kiện sẽ
bắt đầu sau"_, and three live `DD / HH / MM` tiles. Sub-minute precision is
intentionally absent.

Architecture:

- **One Server Component page** (`app/prelaunch/page.tsx`) renders the hero
  with server-computed tile values (FR-013, no FOUC).
- **Middleware rewrite (not redirect)** preserves the originally requested
  URL so deep links survive prelaunch (spec _Notes — Routing strategy_).
- **Two reused client islands**: `CountdownTile` + `CountdownTimer` from
  [Homepage SAA](../i87tDx10uM-homepage-saa/plan.md) (TR-004). The Timer
  needs one small extension — an optional `hideComingSoon` prop — so the
  prelaunch hero can suppress the Homepage's "Coming soon" sub-label and
  add its own headline.
- **One pure helper**: `isPrelaunch(now?: Date)` in `lib/event/config.ts`
  that consumes the existing `getEventStartAt()` and returns `false` on any
  configuration failure (fail-open per FR-009).
- **API short-circuit**: `app/api/_prelaunch-guard.ts` (or inline in each
  handler we touch) returns HTTP 503 `{ "error": "prelaunch" }` for all
  routes under `/api/*` **except** `/api/auth/*` and `/api/healthz`
  (FR-006).
- **Client-side launch transition**: when the local countdown reaches zero
  the Timer fires `router.refresh()`; middleware re-evaluates,
  `isPrelaunch()` now returns `false`, and the visitor lands on Homepage
  SAA (FR-012).

No new persistent data. No new runtime dependencies. No new Supabase
queries.

---

## Spec Coverage Trace

A pre-task map from `spec.md` to plan phases. Every requirement appears here
exactly once.

| Spec ref                                  | Phase | Step(s)      | Test coverage                                                                                                               |
| ----------------------------------------- | ----- | ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| US1 (Visitor sees countdown, P1)          | 2, 3  | 6–8, 12      | E2E `prelaunch.spec.ts` US1 + middleware integration                                                                        |
| US2 (Auto-transition at zero, P1)         | 4     | 15           | `PrelaunchTimer.test` (zero crossing + router.refresh) + E2E US2                                                            |
| US3 (Deep links surface prelaunch, P1)    | 2     | 7–8          | `middleware-prelaunch.test.ts` (parametric path sweep + API matrix)                                                         |
| US4 (SEO-safe + analytics, P3)            | 4     | 15–18        | Snapshot for `noindex` + analytics-emit tests + `prelaunch_exit`                                                            |
| FR-001 `isPrelaunch()` server-side        | 1     | 3            | `lib/event/config.test.ts` (valid future / past / invalid / unset)                                                          |
| FR-002 Render prelaunch when gate active  | 2, 3  | 6–7, 12      | `middleware-prelaunch.test.ts` + page render                                                                                |
| FR-003 Gate evaluated before protected    | 2     | 6–7          | `middleware-prelaunch.test.ts` (admin visit → prelaunch, not 401)                                                           |
| FR-004 Skip Next internals / assets       | 2     | 6–7          | `middleware-prelaunch.test.ts` (`/_next/...`, `/favicon.ico`)                                                               |
| FR-005 Skip `/auth/callback`              | 2     | 6–7          | `middleware-prelaunch.test.ts` (callback path)                                                                              |
| FR-006 API 503 + exceptions               | 2     | 6, 8         | `middleware-prelaunch.test.ts` API matrix (allow + deny + cookies)                                                          |
| FR-007 Two-digit zero pad                 | n/a   | (reuse)      | Existing `CountdownTile.test.tsx` (Homepage SAA)                                                                            |
| FR-008 Clamp out-of-range to 00           | n/a   | (reuse)      | Existing `CountdownTile.test.tsx`                                                                                           |
| FR-009 Missing env → `--` placeholders    | 1, 3  | 3, 10–11, 13 | `lib/event/config.test.ts` (warn) + `CountdownTile.test.tsx` (placeholder) + `prelaunch-page.test.tsx` (full SSR with `--`) |
| FR-010 Tick at minute cadence             | n/a   | (reuse)      | Existing `CountdownTimer.test.tsx`                                                                                          |
| FR-011 Visibility resync                  | 3, 4  | 11, 14       | `CountdownTimer.test.tsx` (new: visibilitychange recompute)                                                                 |
| FR-012 Reload on zero crossing            | 4     | 15           | `PrelaunchTimer.test.tsx` (router.refresh single-fire + sessionStorage guard)                                               |
| FR-013 Server-computed initial values     | 3     | 12           | `prelaunch-page.test.tsx` (initial HTML has real digits)                                                                    |
| FR-014 `<meta robots noindex>`            | 4     | 18           | `prelaunch-page.test.tsx` (head contains meta)                                                                              |
| FR-015 No focusable elements              | 3     | 12–13        | `prelaunch-page.test.tsx` (querySelectorAll('button,a,input') = 0)                                                          |
| FR-016 `aria-live="polite"` countdown     | n/a   | (reuse)      | Existing `CountdownTimer.test.tsx` (already has aria-live)                                                                  |
| FR-017 i18n keys (vi/en/ja)               | 1, 3  | 4, 11        | `messages-parity.test.ts` + `CountdownTimer.test.tsx` (translationNamespace)                                                |
| TR-001 LCP < 2.5s + priority image        | 3     | 12           | Manual Lighthouse at hand-off (no CI gate per Homepage decision)                                                            |
| TR-002 No Supabase calls in render path   | 3     | 12–13        | `prelaunch-page.test.tsx` (mock Supabase client → 0 calls)                                                                  |
| TR-003 Session cookie refresh still runs  | 2     | 6–8          | `middleware-prelaunch.test.ts` (cookies preserved on rewrite + 503)                                                         |
| TR-004 Reuse Homepage Countdown\* comps   | 3     | 10–12        | `prelaunch-page.test.tsx` imports `@/components/molecules/...`                                                              |
| TR-005 Test coverage (unit + integration) | all   | —            | Each entry above                                                                                                            |
| TR-006 No hard-coded colors/spacing       | 3     | 12           | ESLint custom rule already in place + review                                                                                |

> Acceptance scenarios from `spec.md` (US1–US4 numbered scenarios + Edge
> Cases) map 1-to-1 to the unit/integration/E2E entries above; `tasks.md`
> emitted by `/momorph.tasks` will produce one task per scenario per
> Constitution §V.

---

## Technical Context

| Concern              | Decision                                                                                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Language/Framework   | TypeScript 5 (strict) on Next.js 16 (App Router) + React 19 + Tailwind 4                                                                                  |
| Primary Dependencies | `next-intl` (existing), `@supabase/ssr` (existing — session refresh only), `next/image` (priority hero)                                                   |
| Database             | None. No new tables, no migrations.                                                                                                                       |
| Testing              | Vitest (unit + integration) + Playwright (E2E) — all wired                                                                                                |
| State Management     | Server Components for initial render; one client island (`CountdownTimer`) holds local `remaining` state.                                                 |
| API Style            | No new endpoints. Existing routes get a thin guard helper that short-circuits when `isPrelaunch()` is `true`.                                             |
| i18n                 | `next-intl` with `vi` + `en` (locked by Homepage SAA narrowing). New keys: `prelaunch.heading`, `prelaunch.units.{days,hours,minutes}`, `prelaunch.aria`. |

---

## Constitution Compliance Check

_GATE: Must pass before implementation can begin._

- [x] **§I Clean Code** — One file per responsibility. `isPrelaunch` and
      `computeCountdown` are pure. The prelaunch page is composition-only.
      Files target ≤ 250 LoC. No `any`, no `@ts-ignore`, no non-null
      assertions.
- [x] **§II Tech Stack Best Practices** — Server Component default; one
      reused `'use client'` Timer (already audited by Homepage SAA). Tailwind
      utilities + design tokens; new tokens added in `globals.css` only if
      Figma `query_section` reveals values not already exposed (verified at
      implementation time). `href` values pulled from `lib/routes.ts` (no
      hard-coded paths). No new Supabase calls; existing middleware session
      refresh is left intact (TR-003).
- [x] **§III Responsive Web UI & Accessibility** — Mobile-first, no
      horizontal scroll across breakpoints. WCAG 2.1 AA: white text on dark
      cover gradient verified by axe in E2E; `<meta robots="noindex">` for
      SEO. Countdown wrapper already exposes `aria-live="polite"` and
      `role="timer"`. No focusable elements (FR-015).
- [x] **§IV OWASP Secure Coding** — No new inputs. No auth surface beyond
      what middleware already handles. `/auth/callback` exempted from
      rewrite so the OAuth exchange isn't broken (FR-005). API gate returns
      a benign payload (`{ "error": "prelaunch" }`) — no stack traces, no
      identifiers. Session cookies continue to refresh (TR-003).
- [x] **§V TDD (Non-negotiable)** — Each task in `tasks.md` will be RED →
      GREEN → REFACTOR. `isPrelaunch` and middleware rewrites land with
      failing-first tests. The Timer's new `hideComingSoon` prop + the new
      zero-crossing reload behavior get unit tests before code.

### Violations / Deviations (justified)

| Deviation                                                                        | Spec reference            | Justification                                                                                                                                                                                                                                                                                                | Alternative rejected                                                                                 |
| -------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Spec implies a brand-new countdown component; plan **extends** the existing one. | spec.md → TR-004          | The Homepage SAA `CountdownTimer` + `CountdownTile` already satisfy FR-007/008/010/016. Adding 5 small optional props (`hideComingSoon`, `onZero`, `translationNamespace`, `showPlaceholderOnNull`, `placeholder`) keeps a single source of truth for tick logic and prevents drift between the two screens. | A new component would force two copies of the minute-tick + visibility-resync logic to stay in sync. |
| Prelaunch page lives at `/prelaunch` (rewritten), not at `/`.                    | spec.md → Notes (rewrite) | Middleware **rewrite** lets the URL bar stay on the originally requested path while the body renders the prelaunch page. The actual file must live at a stable rewrite target; `/prelaunch` is the conventional choice.                                                                                      | A redirect would mutate the URL and break pre-launch deep links — explicitly rejected by the spec.   |
| Analytics events (`prelaunch_view`, `countdown_zero`, `prelaunch_exit`) are P3.  | spec.md → US4 priority    | US4 is explicitly **P3** and labeled "Cosmetic / observational". MVP ships without an analytics SDK; events are emitted to `console.info` for now so the call sites exist and can be re-pointed when the SDK lands.                                                                                          | Adding an analytics SDK just to fire three events would bloat the bundle for a low-priority concern. |

---

## Architecture Decisions

### Frontend Approach

- **Component structure**: One new organism (`PrelaunchHero`) under
  `components/organisms/prelaunch/`. The page (`app/prelaunch/page.tsx`)
  composes it plus a `BackgroundMedia` atom. Headline + Timer live inside
  the organism.
- **Styling strategy**: Tailwind 4 utilities. The dark cover gradient and
  hero white text already have tokens (`--color-hero-background`,
  `--color-hero-foreground`) used by Homepage SAA. If Figma reveals a
  prelaunch-specific gradient stop or padding value not yet tokenized, add
  it to `globals.css` at implementation time (TR-006).
- **Data fetching**: None. The page is `async` only so it can call
  `getEventStartAt()` server-side and pass `targetMs` down. No Supabase,
  no fetch.
- **Client island**: only `CountdownTimer` (already `'use client'`). The
  new `hideComingSoon` prop and the new zero-crossing reload effect stay
  inside that file — no additional client components.

### Backend Approach

All prelaunch gating happens in **middleware only**. There is no
per-handler guard helper — consolidated during `reviewplan` decision #4.

- **Middleware** (`middleware.ts`) gains one new branch at the **top** of
  the function body, before `isProtectedPath` (FR-003):
  - Compute `isPrelaunch()` once per request.
  - If `false` → fall through to today's behavior (session refresh +
    existing `/awards` redirect). No code path changes for non-prelaunch
    traffic.
  - If `true` AND path is in the **HTML skip-list** (`/_next/...`,
    image-extension URLs under `/assets`, `/auth/callback`,
    `/auth/signout`, `/prelaunch` itself) → fall through.
  - If `true` AND path is in the **API skip-list** (`/api/auth/...`,
    `/api/healthz`) → fall through.
  - If `true` AND path starts with `/api/` (other than the skip-list above) →
    return `NextResponse.json({ error: 'prelaunch' }, { status: 503 })`.
    Cookies from `updateSession` are re-applied on the 503 response so
    that an in-flight session refresh is not lost (TR-003).
  - Else (`true` and a regular UI path) → `NextResponse.rewrite('/prelaunch')`
    with cookies re-applied from the `updateSession` response (see
    decision #5 for the exact pattern).
- **`isPrelaunch()` helper** (`lib/event/config.ts`):
  ```ts
  export function isPrelaunch(now: Date = new Date()): boolean {
    const target = getEventStartAt();
    if (target === null) return false; // FR-009: fail-open
    return target.getTime() > now.getTime();
  }
  ```
- **`assertEventStartConfig()` helper** (`lib/event/config.ts`, decision #7):
  - **Lazy, idempotent invocation** — NOT a module-load side effect.
    Called explicitly from `middleware.ts` as the very first statement,
    and guarded by a module-level `let warned = false` so the warning
    fires **at most once per worker lifetime**. Rationale: module-load
    side effects fire during Vitest module collection and during build
    steps, producing noisy warnings unrelated to the request being
    served.
  - If `process.env.NEXT_PUBLIC_EVENT_START_AT` is a non-empty string but
    `getEventStartAt()` returns `null` (i.e. unparseable, not just
    missing), calls `logger.warn('event.start_at.invalid', { raw })`
    where `raw` is the first 64 chars of the env value (truncated to
    avoid leaking pasted secrets), then sets `warned = true`.
  - Tests reset the `warned` flag via a small exported helper
    `__resetEventStartConfigWarning()` (dev-only / test-only export
    pattern; the leading underscores signal "not for production code"
    and Vitest is the only caller).
- **Validation**: no inputs to validate. Env var is parsed exactly once
  via the existing `getEventStartAt()` (which is already strict per
  FR-009).
- **Cookie preservation pattern** for both the rewrite and the 503
  branches (decision #5):
  ```ts
  function preserveCookies(src: NextResponse, dst: NextResponse) {
    for (const cookie of src.cookies.getAll()) {
      dst.cookies.set(cookie);
    }
    return dst;
  }
  ```

### Integration Points

- **Existing modules reused as-is**:
  - `lib/event/config.ts` (`getEventStartAt`) — source of truth for the
    target datetime.
  - `lib/event/countdown.ts` (`computeCountdown`, `padTwoDigits`) — pure
    countdown math.
  - `components/molecules/CountdownTile.tsx` — visual digit tile.
  - `lib/supabase/middleware.ts` (`updateSession`) — keeps the session
    cookie fresh during prelaunch (TR-003).
- **Existing modules extended (small, additive change)**:
  - `components/molecules/CountdownTimer.tsx` — additive optional props
    only; existing call sites pass nothing → behavior unchanged:
    - `hideComingSoon?: boolean` (default `false`)
    - `onZero?: () => void` (fires once when `value.started` becomes
      `true` after mount, guarded by `firedZeroRef` and `sessionStorage`
      per decision #9)
    - `translationNamespace?: string` (default `'homepage.countdown'`,
      decision #1) — drives the unit-label keys (`.days`, `.hours`,
      `.minutes`, `.ariaLabel`).
    - `comingSoonNamespace?: string` (default `'homepage.hero'`,
      decision #1) — only used when `hideComingSoon` is `false`.
    - `showPlaceholderOnNull?: boolean` (default `false`, decision #2) —
      when `true` and `targetMs === null`, the Timer renders the
      `placeholder` string in each tile instead of zeros.
    - `placeholder?: string` (default `'--'`, decision #2) — opaque
      string passed to `CountdownTile.placeholder`.
  - `components/molecules/CountdownTile.tsx` — additive optional prop
    only:
    - `placeholder?: string` (decision #2) — when non-empty, the tile
      renders the string in place of the digit pair (single visible
      slot, still inside the same flex container so layout is preserved).
      Existing call sites pass nothing → behavior unchanged.
  - `middleware.ts` — add the prelaunch gate as the first branch; update
    the `config.matcher` regex to **remove `login` from the exclude list**
    (decision #3) so `/login` flows through the gate.
  - `lib/routes.ts` — add `PRELAUNCH: '/prelaunch'` to the existing
    `ROUTES` object (file already exists; this is a one-line addition,
    not a new file).
- **Shared assets**: `MM_MEDIA_BG` (Figma node `2268:35129`) downloaded
  to `public/prelaunch/hero-bg.{png,webp,avif}` during Phase 0.
- **i18n catalogue**: 4 new keys in `messages/{vi,en}.json` (+ optional
  `messages/ja.json` parity — see FR-017).

---

## Project Structure

### Documentation (this feature)

```text
.momorph/specs/8PJQswPZmU-countdown-prelaunch/
├── spec.md         # ← already authored
├── plan.md         # ← this file
└── tasks.md        # ← produced by /momorph.tasks
```

`research.md` is **not** required: every piece of integration context this
feature needs is already documented in the parent Homepage SAA spec/plan,
and the feature itself reuses two ready-made components and one existing
helper. If `/momorph.reviewplan` flags an unknown integration point, we'll
add a research pass then.

### Source Code (affected areas)

**New files:**

```text
# Prelaunch page (rewrite target)
app/prelaunch/
└── page.tsx                        # async Server Component: composes <PrelaunchHero />

# Prelaunch organism
components/organisms/prelaunch/
└── PrelaunchHero.tsx               # Server Component: BG image + cover + headline + CountdownTimer

# Prelaunch BG atom (page-specific; not reused)
components/atoms/
└── PrelaunchBackground.tsx         # next/image priority + dark cover overlay (decorative alt="")

# Prelaunch client wrapper around the shared Timer
components/organisms/prelaunch/
└── PrelaunchTimer.tsx              # 'use client' — installs onZero + analytics, forwards to CountdownTimer

# Homepage SAA exit-tracker (mounted by app/page.tsx — decision #8)
components/molecules/
└── PrelaunchExitTracker.tsx        # 'use client' — fires `prelaunch_exit` once if document.referrer ends with /prelaunch

# Analytics seam (decision-8 stub; replaced by real SDK later)
lib/analytics/
└── track.ts                        # track(event: string, props?: Record<string, unknown>): void — wraps logger.info for MVP

# Tests
tests/unit/
├── lib/event/config.test.ts                  # ← extended: new isPrelaunch() cases + assertEventStartConfig warning
├── lib/analytics/track.test.ts               # ← new: track() emits via logger
├── components/PrelaunchHero.test.tsx         # ← new: renders headline + tiles + bg
├── components/PrelaunchBackground.test.tsx   # ← new: priority image + decorative alt=""
├── components/PrelaunchTimer.test.tsx        # ← new: onZero → router.refresh exactly once (sessionStorage guard)
├── components/PrelaunchExitTracker.test.tsx  # ← new: emits prelaunch_exit when referrer ends with /prelaunch
├── components/CountdownTile.test.tsx         # ← extended: placeholder prop branch
└── components/CountdownTimer.test.tsx        # ← extended: hideComingSoon, onZero, visibility resync, translationNamespace, showPlaceholderOnNull

tests/integration/
├── middleware-prelaunch.test.ts              # ← new: rewrite / skip-list / API 503 matrix
└── prelaunch-page.test.tsx                   # ← new: SSR snapshot, noindex meta, no focusable nodes

tests/e2e/
└── prelaunch.spec.ts                         # ← new: US1, US2 (zero crossing), US3 (deep links)

# Public assets (Phase 0)
public/prelaunch/
├── hero-bg.png                     # MM_MEDIA_BG (node 2268:35129) — primary
├── hero-bg.webp                    # next/image will negotiate the optimal format
└── hero-bg-blur.txt                # base64 data URL for next/image placeholder="blur"
```

**Modified files:**

| File                                            | Change                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `middleware.ts`                                 | Add prelaunch gate as the **first** branch. **Remove `login` from the matcher exclude list** (decision #3). Keep `/_next/static`, `/_next/image`, `favicon.ico`, `assets`, `auth/callback`, and image-extension URLs excluded from the matcher. The prelaunch skip-list adds `/auth/signout` and `/prelaunch`. Use the cookie-preservation pattern (decision #5) for rewrite and 503 responses.                                   |
| `lib/event/config.ts`                           | Add `isPrelaunch(now?: Date): boolean` and `assertEventStartConfig()` (decision #7) next to `getEventStartAt()`. JSDoc references FR-001, FR-006, FR-009. `assertEventStartConfig()` is called once at module load.                                                                                                                                                                                                               |
| `components/molecules/CountdownTimer.tsx`       | Add 5 optional props (decisions #1, #2, #9): `hideComingSoon`, `onZero`, `translationNamespace`, `comingSoonNamespace`, `showPlaceholderOnNull`, `placeholder`. Existing call sites pass nothing → behavior unchanged. `onZero` is single-fire via `useRef` + `sessionStorage` key `prelaunchExitFired`. Visibility resync (FR-011) installs a `document.visibilitychange` listener that calls the same `tick()` as the interval. |
| `components/molecules/CountdownTile.tsx`        | Add optional `placeholder?: string` (decision #2) — when truthy, the tile renders the string in place of the digit pair. Existing call sites pass nothing → behavior unchanged.                                                                                                                                                                                                                                                   |
| `tests/unit/components/CountdownTimer.test.tsx` | Extend: covers `hideComingSoon` rendering branch, `onZero` fires once on zero-crossing (sessionStorage guard), visibility resync re-computes from `Date.now()`, `translationNamespace` switches the i18n root, `showPlaceholderOnNull + targetMs=null` renders placeholders.                                                                                                                                                      |
| `tests/unit/components/CountdownTile.test.tsx`  | Extend: covers `placeholder` rendering (string visible, no digit tiles); when `placeholder` absent, existing digit-pair behavior intact.                                                                                                                                                                                                                                                                                          |
| `tests/unit/lib/event/config.test.ts`           | Extend: covers `isPrelaunch()` matrix (unset / past / future / now) and `assertEventStartConfig` warning path (mock `logger.warn`, set env to garbage, assert one warning emitted with truncated raw).                                                                                                                                                                                                                            |
| `messages/vi.json`, `messages/en.json`          | Add `prelaunch.heading`, `prelaunch.units.{days,hours,minutes,ariaLabel}` (note: `ariaLabel` lives under `prelaunch.units` so the Timer can use a single `useTranslations(translationNamespace)` call). The body of the 503 short-circuit returns the **literal string** `"prelaunch"` (not a translated message) — no API consumer should depend on locale.                                                                      |
| `messages/ja.json`                              | Add the same keys (soft-deprecated locale, kept only to satisfy the parity test).                                                                                                                                                                                                                                                                                                                                                 |
| `app/page.tsx` (Homepage SAA)                   | Mount `<PrelaunchExitTracker />` once (decision #8). The tracker is a no-op client component that fires `prelaunch_exit` if `document.referrer` ends with `/prelaunch`. No other Homepage SAA change required.                                                                                                                                                                                                                    |
| `.env.example`                                  | Annotate `NEXT_PUBLIC_EVENT_START_AT`: it now drives **both** the Homepage SAA countdown **and** the prelaunch gate.                                                                                                                                                                                                                                                                                                              |
| `README.md`                                     | Brief paragraph: "When the env var is set in the future, every public route renders prelaunch; set it to a past datetime (or unset it) to ship the real app."                                                                                                                                                                                                                                                                     |
| `lib/routes.ts`                                 | Add `PRELAUNCH: '/prelaunch'` to the `ROUTES` object (one-line addition; file already exists per Homepage SAA Phase 1).                                                                                                                                                                                                                                                                                                           |

### Dependencies

**No new runtime or dev dependencies.** Every requirement is satisfied by
the current `package.json`:

- `next` 16.2.6 — middleware rewrites, `next/image` priority hero.
- `next-intl` 4.11.1 — i18n keys.
- `@supabase/ssr` — session refresh continues during prelaunch (TR-003).
- `vitest`, `@playwright/test`, `@testing-library/*`, `@axe-core/playwright`.

---

## Implementation Strategy

> **Phase dependency graph**: Phase 0 + Phase 1 are independent and can
> run in parallel. Phase 2 depends on Phase 1 (the `isPrelaunch()` helper).
> Phase 3 depends on Phase 0 (asset + tokens), Phase 1 (helpers, i18n
> keys), and Phase 2 (middleware — without it the page is unreachable via
> the gate flow, but a direct visit to `/prelaunch` still works for
> testing). Phase 4 depends on Phase 3.
>
> **Cross-phase step numbering**: steps are numbered sequentially across
> phases (1–20). Step 5 was removed during `reviewplan` (decision #4
> consolidated the per-handler API guard into middleware), so the
> sequence intentionally jumps from step 4 to step 6.

### Phase 0 — Asset preparation _(blocks Phase 3)_

1. **Download `MM_MEDIA_BG`** (Figma node `2268:35129`) via the MoMorph MCP
   tool `get_media_file`:
   - Place under `public/prelaunch/hero-bg.png`.
   - Generate a low-res blur placeholder (base64 data URL) and save the
     string to `public/prelaunch/hero-bg-blur.txt` so the page can import
     it inline for `next/image placeholder="blur"`.
2. **Confirm the cover-gradient values** via `query_section` on node
   `2268:35130`. If the gradient stops / opacity differ from Homepage SAA's
   existing `--color-hero-background`, add a new CSS variable
   `--bg-prelaunch-cover` to `app/globals.css` and document its usage.

### Phase 1 — Foundation (no UI yet) _(blocks Phase 2 + Phase 3)_

3. **`isPrelaunch()` + `assertEventStartConfig()`** in
   `lib/event/config.ts` — pure, no env reads beyond what
   `getEventStartAt()` already does. Failing-first test cases:
   - `target = null` (unset / unparseable) → `isPrelaunch()` returns
     `false` (FR-009).
   - `target` is in the past → returns `false`.
   - `target` is in the future → returns `true`.
   - `now` parameter is honored (deterministic for tests).
   - `assertEventStartConfig()` (decision #7): when env is a non-empty
     unparseable string, exactly one `logger.warn` call is emitted with
     event name `event.start_at.invalid` and a `raw` value truncated to
     ≤ 64 chars. When env is empty/unset, no warning is emitted (that's
     a valid "no prelaunch" state, not a misconfiguration).
4. **i18n keys** added to `messages/{vi,en,ja}.json`:
   - `prelaunch.heading` → vi `"Sự kiện sẽ bắt đầu sau"`, en `"The event starts in"`, ja `"イベント開始まで"` (or vi/en fallback if unknown).
   - `prelaunch.units.days` / `hours` / `minutes` → `"DAYS"` / `"HOURS"` / `"MINUTES"` (same case in vi/en/ja per Figma).
   - `prelaunch.units.ariaLabel` → vi `"Thời gian còn lại đến sự kiện"`, en `"Time remaining until event"`. **Lives under `prelaunch.units`** so the Timer's single `useTranslations(translationNamespace)` call resolves it (decision #1).
   - Run the existing `messages-parity.test.ts` to confirm the 3 locale
     files have the same key tree.
   - **Not added**: `prelaunch.errors.503`. The middleware 503 body is
     the literal string `"prelaunch"` (decision #4 + Modified-Files
     table) — API consumers should not depend on locale.

### Phase 2 — Middleware gating (US1 + US3 + API short-circuit) _(depends on Phase 1)_

6. **Update `middleware.ts`** (consolidated per decision #4):

   ```ts
   export async function middleware(request: NextRequest) {
     const { response, user } = await updateSession(request);
     const { pathname } = request.nextUrl;

     if (isPrelaunch()) {
       if (isApiAllowed(pathname)) return response; // /api/auth/*, /api/healthz
       if (pathname.startsWith('/api/')) {
         return preserveCookies(
           response,
           NextResponse.json({ error: 'prelaunch' }, { status: 503 }),
         );
       }
       if (!isPrelaunchSkipped(pathname)) {
         const url = request.nextUrl.clone();
         url.pathname = '/prelaunch';
         url.search = '';
         return preserveCookies(response, NextResponse.rewrite(url));
       }
     }

     if (isProtectedPath(pathname) && !user) {
       // existing redirect to /login?redirectTo=...
     }

     return response;
   }

   function isApiAllowed(pathname: string): boolean {
     return pathname.startsWith('/api/auth/') || pathname === '/api/healthz';
   }

   function isPrelaunchSkipped(pathname: string): boolean {
     return (
       pathname === '/prelaunch' ||
       pathname.startsWith('/_next/') ||
       pathname.startsWith('/auth/callback') || // FR-005
       pathname.startsWith('/auth/signout') || // decision #4
       /\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/.test(pathname)
     );
   }
   ```

   - `preserveCookies` is the helper from the Architecture section
     (decision #5): re-applies each cookie from `response.cookies` onto
     the new response so session refresh survives the rewrite/503.
   - **Matcher change (decision #3)**: remove `login` from
     `config.matcher`'s exclude list so middleware runs for `/login` too.
     New regex: `'/((?!_next/static|_next/image|favicon.ico|assets|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'`.

7. **Tests** (`tests/integration/middleware-prelaunch.test.ts`):
   - With env in future, every in-scope path returns the prelaunch HTML
     (200), including `/`, `/login`, `/awards`, `/kudos/abc`, `/profile`,
     `/admin`, `/random/unknown/path` (US1 + US3).
   - `/auth/callback?code=…` and `/auth/signout` are **not** rewritten
     — pass through to their existing handlers (FR-005 + decision #4).
   - `/_next/static/…`, `/_next/image`, `/favicon.ico`, and image-suffix
     paths under `/assets` are **not** rewritten (FR-004).
   - With env unset, every path behaves exactly as it does today
     (regression guard for Homepage SAA + Login).
   - Authenticated admin visiting `/admin` during prelaunch still sees
     prelaunch, **not** an authenticated UI (FR-003).
   - **TR-003 cookie test**: simulate `updateSession` writing a
     `sb-access-token` cookie on `response.cookies`; assert the rewrite
     response (and the 503 response) carry the same cookie via
     `preserveCookies`.
8. **API matrix tests** (same file):
   - `/api/auth/whatever` (forward-looking) → middleware passes through
     to the (currently non-existent) handler; assert no 503 emitted.
   - `/api/healthz` → middleware passes through; assert no 503.
   - `/api/foo` (any non-exempt API path) → middleware returns
     `{ status: 503, body: { error: 'prelaunch' } }` and **cookies are
     preserved**.
   - When env unset, every `/api/...` path passes through (no 503).

### Phase 3 — Prelaunch page (US1 + US3 page-render path) _(depends on Phase 0 + 1; Phase 2 not strictly required for direct-visit testing)_

9. **Codebase audit** for `/api/*` handlers (decision #4):
   - Run `find app/api -name route.ts 2>/dev/null || echo "(none)"`.
     Today: **none**. The middleware short-circuit from Phase 2 is the
     authoritative gate — no per-handler code change is required.
   - When the first `/api/*` handler lands in a future spec, the
     middleware already covers it. No new file is added in this phase.
10. **Extend `CountdownTile`** (decision #2):
    - Add optional `placeholder?: string`. When truthy, render a single
      span containing the placeholder string in place of the two
      `<DigitTile>` elements. The unit label below remains intact.
    - The `sr-only` `data-testid="countdown-value"` span renders the
      placeholder verbatim (so screen readers announce `"--"` instead of
      `"00"`).
    - Tests: `tests/unit/components/CountdownTile.test.tsx` — covers the
      branch (string visible, no `DigitTile` rendered) and the inverse
      (existing two-digit behavior intact when prop is absent).

11. **Extend `CountdownTimer`** (decisions #1, #2):
    - Add the 5 optional props listed in the Modified-Files table.
    - Replace the two hardcoded `useTranslations(...)` calls with:
      ```tsx
      const t = useTranslations(translationNamespace);
      const tComingSoon = useTranslations(comingSoonNamespace);
      ```
    - When `targetMs === null` AND `showPlaceholderOnNull` is `true`,
      forward the `placeholder` string down to each `CountdownTile` while
      still letting the `useState` initializer run (`computeCountdown`
      returns `STARTED` safely for a null target). When
      `showPlaceholderOnNull` is `false` (Homepage SAA), don't forward
      `placeholder` → the tile renders `00` as today.
    - `onZero` fires inside the tick effect when `next.started` becomes
      `true` AND `firedZeroRef.current === false` AND
      `sessionStorage.getItem('prelaunchExitFired') !== '1'`. After
      firing, set both flags. `sessionStorage` access is guarded by
      `typeof window !== 'undefined'`.
    - Visibility resync (FR-011): inside the same `useEffect`, add a
      `document.addEventListener('visibilitychange', onVisibilityChange)`
      where `onVisibilityChange` calls `tick()` if
      `document.visibilityState === 'visible'`. Cleanup removes the
      listener.
    - All existing call sites (Homepage SAA hero) pass nothing →
      behavior unchanged.
    - Tests: extend `tests/unit/components/CountdownTimer.test.tsx` to
      cover (a) `hideComingSoon` branch, (b) `onZero` single-fire across
      ticks, (c) `onZero` skipped when sessionStorage flag set,
      (d) visibility resync recomputes from `Date.now()`,
      (e) `translationNamespace="prelaunch.units"` resolves the new
      keys, (f) `showPlaceholderOnNull` + `targetMs=null` renders
      placeholders.

12. **Build `app/prelaunch/page.tsx`** (Server Component):

    ```tsx
    import type { Metadata } from 'next';
    import { getTranslations } from 'next-intl/server';
    import { getEventStartAt, isPrelaunch } from '@/lib/event/config';
    import { PrelaunchHero } from '@/components/organisms/prelaunch/PrelaunchHero';

    export const metadata: Metadata = {
      robots: { index: false, follow: false }, // FR-014
    };

    export default async function PrelaunchPage() {
      const t = await getTranslations('prelaunch');
      // Decision #11: only pass a real `targetMs` when the event is
      // genuinely in the future. Unset / unparseable / past env all
      // collapse to `null`, which drives the `--` placeholder branch
      // (decision #6 + FR-009).
      const target = getEventStartAt();
      const targetMs = target !== null && isPrelaunch() ? target.getTime() : null;
      return (
        <main tabIndex={-1} className="relative isolate min-h-dvh overflow-hidden">
          <PrelaunchHero headline={t('heading')} targetMs={targetMs} />
        </main>
      );
    }
    ```

    Compose `<PrelaunchHero>` (Server Component):
    - Renders `<PrelaunchBackground>` (full-bleed `next/image priority placeholder="blur"` with **`alt=""`** because the artwork is
      decorative; the headline carries the meaning).
    - Renders the centered hero block: headline `<h1>` + `<PrelaunchTimer targetMs={targetMs} />`.
    - `<PrelaunchTimer>` (new client wrapper) installs the `onZero` →
      `router.refresh()` handler and the `prelaunch_view` /
      `countdown_zero` analytics calls (Phase 4 step 15), then forwards
      to `<CountdownTimer translationNamespace="prelaunch.units" hideComingSoon showPlaceholderOnNull targetMs={...} onZero={...} />`.
    - Initial digit values are server-truth: the Timer's
      `useState(() => computeCountdown(new Date(), target))` initializer
      runs during SSR and emits real digits in the first HTML
      (TR-002, FR-013).
    - When `targetMs === null` (env missing / unparseable / past — note
      that `isPrelaunch()` would have returned `false` and middleware
      would not have routed here, but a **direct visit** to `/prelaunch`
      is still allowed per decision #6), the Timer renders `--` in each
      tile.

13. **Tests** (`tests/integration/prelaunch-page.test.tsx`):
    - SSR renders the headline, three tiles, and `noindex` meta tag.
    - `querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])')` returns **zero** matches (FR-015 — only the `<main tabIndex="-1">` is permitted).
    - With env unset, the page still renders, all tiles show `--`, and
      the page does not throw (FR-009).
    - With env set in the past, behavior is identical to unset
      (decision #6 — direct visit allowed, `--` placeholders shown).
    - Supabase client is **not** invoked during render (mock
      `@/lib/supabase/server` and assert zero calls — TR-002).

### Phase 4 — Client-side launch transition + polish (US2 + US4) _(depends on Phase 3)_

14. **Visibility resync** (FR-011) — implementation already covered in
    Phase 3 step 11; this phase only adds the dedicated unit test:
    - `tests/unit/components/CountdownTimer.test.tsx` — simulate tab
      hidden for 5 minutes of fake-time, fire `visibilitychange` event,
      assert the rendered value matches
      `Math.floor((target - now) / 60_000)` and **not** the value the
      interval would have produced if it had fired every minute
      uninterrupted.

15. **Zero-crossing reload** (FR-012) — `PrelaunchTimer.tsx` is the
    client wrapper that installs the handler:

    ```tsx
    // components/organisms/prelaunch/PrelaunchTimer.tsx
    'use client';
    import { useRouter } from 'next/navigation';
    import { useCallback, useEffect } from 'react';
    import { CountdownTimer } from '@/components/molecules/CountdownTimer';
    import { computeCountdown } from '@/lib/event/countdown';
    import { track } from '@/lib/analytics/track';

    export function PrelaunchTimer({ targetMs }: { targetMs: number | null }) {
      const router = useRouter();
      const onZero = useCallback(() => {
        track('countdown_zero', { source: 'prelaunch' });
        router.refresh();
      }, [router]);

      // prelaunch_view: emit once on mount (decision-#8 sibling to
      // countdown_zero / prelaunch_exit) with the initial remaining
      // minutes so analytics can bucket arrivals.
      useEffect(() => {
        const target = targetMs !== null ? new Date(targetMs) : null;
        const { days, hours, minutes } = computeCountdown(new Date(), target);
        track('prelaunch_view', { remaining_minutes: days * 24 * 60 + hours * 60 + minutes });
      }, []); // eslint-disable-line react-hooks/exhaustive-deps

      return (
        <CountdownTimer
          targetMs={targetMs}
          translationNamespace="prelaunch.units"
          hideComingSoon
          showPlaceholderOnNull
          onZero={onZero}
        />
      );
    }
    ```

    - Tests: fake-time advance until the target is in the past; assert
      `track('countdown_zero', { source: 'prelaunch' })` and
      `router.refresh()` were each called **exactly once**, even after
      many further ticks (single-fire via `firedZeroRef` +
      `sessionStorage` per decision #9).

16. **Homepage SAA `prelaunch_exit` tracker** (decision #8):
    - `components/molecules/PrelaunchExitTracker.tsx` — `'use client'`,
      runs a single `useEffect` on mount:
      ```tsx
      useEffect(() => {
        if (typeof document === 'undefined') return;
        if (!document.referrer) return;
        const ref = new URL(document.referrer, document.location.origin);
        if (ref.pathname === '/prelaunch') {
          track('prelaunch_exit', {});
          sessionStorage.removeItem('prelaunchExitFired');
        }
      }, []);
      ```
    - Mounted by `app/page.tsx` (Homepage SAA). One-line addition; no
      Homepage SAA spec change required because the tracker is invisible.
    - Tests: mock `document.referrer` and the `track` import; assert
      exactly one `prelaunch_exit` event when referrer ends with
      `/prelaunch`, zero otherwise.

17. **Analytics seam** (`lib/analytics/track.ts`):

    ```ts
    import { logger } from '@/lib/logger';
    export function track(event: string, props: Record<string, unknown> = {}) {
      logger.info(`analytics ${event}`, props);
    }
    ```

    - Tests: `tests/unit/lib/analytics/track.test.ts` — call `track`,
      assert one `logger.info` call with the expected formatted line.
    - When the real SDK lands, replace this file's body; no call-site
      changes.

18. **SEO** (FR-014):
    - `metadata.robots = { index: false, follow: false }` set on
      `app/prelaunch/page.tsx` (step 12).
    - Tests: SSR snapshot in `prelaunch-page.test.tsx` confirms
      `<meta name="robots" content="noindex,nofollow">` is present in
      the rendered HTML.

19. **WCAG contrast E2E** (decision #10):
    - In `tests/e2e/prelaunch.spec.ts`, in addition to the full
      axe-core sweep, add one targeted assertion:
      ```ts
      const results = await new AxeBuilder({ page })
        .options({ runOnly: ['color-contrast'] })
        .include('main')
        .analyze();
      expect(results.violations).toHaveLength(0);
      ```
    - This surfaces a contrast regression independently of the broader
      sweep so a single failed assertion is unambiguous.

20. **E2E `tests/e2e/prelaunch.spec.ts`** (mirrors US1–US3):
    - **US1** — with `NEXT_PUBLIC_EVENT_START_AT` set 1 hour ahead in a
      Playwright fixture, navigate to `/`, assert headline + three tiles
      visible, minute tile decrements over a
      `page.clock.fastForward(60_000)` window (Playwright clock API).
    - **US2** — set the env 2 minutes ahead, open `/prelaunch`,
      `page.clock.fastForward(120_000)`, assert the page reloads and
      lands on Homepage SAA (the hero countdown is now visible). Assert
      one `prelaunch_exit` console log fires on the next page (via
      `page.on('console', …)` because `track` writes to `logger.info` →
      `console.log` in MVP).
    - **US3** — for each of `/awards`, `/kudos/abc`, `/admin`, `/login`,
      `/totally/unknown`, assert HTTP 200 and the prelaunch headline is
      visible. For `/_next/image?url=…&w=1080&q=75` and
      `/favicon.ico`, assert the asset responds (no rewrite). For
      `/api/auth/whatever` (mocked to exist) assert no 503; for
      `/api/foo` assert `{ status: 503, body: { error: 'prelaunch' } }`.
    - axe-core sweep on the prelaunch page → zero WCAG AA violations
      (full sweep, in addition to the targeted color-contrast assertion
      in step 19).

### Risk Assessment

| Risk                                                                                                                             | Probability | Impact | Mitigation                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Middleware rewrites `/auth/callback` and breaks Google OAuth.                                                                    | Medium      | High   | Explicit skip-list in `isPrelaunchSkipped` (FR-005). Dedicated integration test in `middleware-prelaunch.test.ts` asserts the callback path passes through.                                                                                                                                                                            |
| `next/image` blur placeholder + priority causes a regression elsewhere.                                                          | Low         | Low    | Only the prelaunch page uses the new asset; existing Homepage SAA hero is untouched.                                                                                                                                                                                                                                                   |
| Session cookie not refreshed during prelaunch because the rewrite drops headers.                                                 | Medium      | Medium | The rewrite explicitly forwards `response.headers` from `updateSession`. Test asserts `Set-Cookie` is present on a prelaunch rewrite response (TR-003).                                                                                                                                                                                |
| Zero-crossing reload fires forever (`router.refresh()` → new server render → still prelaunch in the few ms before the boundary). | Low         | Medium | `firedZeroRef` + `sessionStorage.prelaunchExitFired` guard against double-fire even across component remounts (decision #9). The server `isPrelaunch()` uses the **current** request time, so a second refresh after launch will land on Homepage SAA. Homepage SAA's `PrelaunchExitTracker` clears the sessionStorage key on arrival. |
| Existing `CountdownTimer.test.tsx` snapshots break when `hideComingSoon` adds a prop.                                            | Low         | Low    | New prop is optional with a `false` default — existing tests are unaffected. The two new test cases are isolated.                                                                                                                                                                                                                      |
| The skip-list misses a Next.js asset path (e.g. `/_next/data/...`) and the prelaunch HTML is served instead of the JSON chunk.   | Medium      | Medium | Test sweep includes `/_next/data/...` and `/_next/static/chunks/...` paths; if any break, broaden the prefix check in `isPrelaunchSkipped`.                                                                                                                                                                                            |
| Visibility resync hooks fight with `setInterval` cleanup and leak timers.                                                        | Low         | Low    | Single `useEffect`, single `clearInterval` cleanup, listener added/removed in the same effect. Unit test covers unmount.                                                                                                                                                                                                               |
| `getEventStartAt()` reads `process.env.NEXT_PUBLIC_EVENT_START_AT` every call, hammering env in tight middleware loops.          | Low         | Low    | The read is `O(1)` and the value is inlined at build time for `NEXT_PUBLIC_*` vars. No memoization needed.                                                                                                                                                                                                                             |
| `assertEventStartConfig()` fires noisy warnings during Vitest module collection or `next build`.                                 | Medium      | Low    | Lazy invocation pattern (decision #7): not a module-load side effect; called explicitly from middleware with a `let warned = false` module-level idempotence guard. Test-only `__resetEventStartConfigWarning()` resets the flag between assertions.                                                                                   |
| Phase 3 starts before Phase 1's i18n keys exist → `t('prelaunch.heading')` throws missing-key.                                   | Medium      | Medium | Phase header dependencies (Phase 3 depends on Phase 1) are explicit; the `tasks.md` produced by `/momorph.tasks` will mark Phase 3 tasks as blocked on Phase 1 keys.                                                                                                                                                                   |
| MM_MEDIA_BG file is too large → fails LCP target.                                                                                | Medium      | Medium | Convert to WebP at build time (`sharp` or manual). `next/image` serves WebP/AVIF when the browser supports it. Manual Lighthouse check at hand-off.                                                                                                                                                                                    |

### Estimated Complexity

- **Frontend**: Low (one Server Component page + one organism + one
  background atom + one extension to an existing client island).
- **Backend**: Low (one middleware branch + one tiny helper + per-route
  guard call). No DB.
- **Testing**: Medium (middleware parametric path matrix + visibility
  resync fake-timer test + zero-crossing single-fire test + E2E with
  Playwright's `page.clock`).

---

## Integration Testing Strategy

### Test Scope

- [x] **Component/Module interactions**: `middleware` ↔ `isPrelaunch` ↔
      `getEventStartAt`; `PrelaunchPage` ↔ `PrelaunchHero` ↔ `PrelaunchTimer` ↔
      `CountdownTimer`; `prelaunchGuard` ↔ existing API handlers.
- [x] **External dependencies**: Supabase (session refresh must keep working
      during a prelaunch rewrite — TR-003); Next.js image optimization
      pipeline (priority + blur placeholder).
- [x] **Data layer**: none. No DB calls. The integration test verifies
      Supabase is **not** queried during prelaunch render.
- [x] **User workflows**: anonymous visit → see countdown; authenticated
      admin visit `/admin` → see countdown; deep link to unknown path →
      see countdown (200); zero crossing → land on Homepage SAA.

### Test Categories

| Category           | Applicable? | Key Scenarios                                                                                                                                |
| ------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| UI ↔ Logic         | Yes         | Countdown tick on minute boundary; visibility resync; zero crossing → reload                                                                 |
| Service ↔ Service  | Yes         | Middleware ↔ Supabase SSR session refresh (cookies survive rewrite)                                                                          |
| App ↔ External API | No          | OAuth flow is **not exercised** in prelaunch — only the **non-blocking** assertion that `/auth/callback` is exempt from rewrite              |
| App ↔ Data Layer   | Yes (zero)  | Negative integration: assert Supabase client `from()` is not called during prelaunch render (TR-002)                                         |
| Cross-platform     | Yes         | Mobile (375px), tablet (768px), desktop (1440px) viewport tests — tiles stay visible, no horizontal scroll, hero artwork covers the viewport |

### Test Environment

- **Environment**: Vitest jsdom for unit + integration; Playwright Chromium
  for E2E. The middleware test uses Next.js's `NextRequest` constructor
  directly + mocked `updateSession` to avoid spinning up a Supabase server.
- **Test data strategy**: `vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', …)` —
  past / future / invalid / unset matrix. No DB seeding required.
- **Isolation approach**: each test stubs the env in `beforeEach` and
  restores in `afterEach`. Fake timers (`vi.useFakeTimers({ toFake: ['Date', 'setInterval'] })`) for the Timer tests.

### Mocking Strategy

| Dependency Type         | Strategy                                                       | Rationale                                                                                                                |
| ----------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Supabase client (unit)  | `vi.mock('@/lib/supabase/server')` returning a no-op           | Prelaunch render path MUST NOT call Supabase; assert zero calls                                                          |
| `updateSession`         | `vi.mock('@/lib/supabase/middleware')` returning fresh cookies | Middleware unit-tests focus on the prelaunch branch; session refresh is covered by `lib/supabase/middleware`'s own tests |
| Date / Clock            | `vi.useFakeTimers()` + `vi.setSystemTime(...)`                 | Deterministic minute-tick + zero-crossing                                                                                |
| `next/navigation`       | `vi.mock` `useRouter` returning `{ refresh: vi.fn() }`         | Verify `router.refresh()` is called exactly once on zero crossing                                                        |
| Env vars                | `vi.stubEnv('NEXT_PUBLIC_EVENT_START_AT', …)`                  | Cover valid future, valid past, invalid string, unset                                                                    |
| Analytics `track`       | `vi.mock('@/lib/analytics/track')`                             | Confirm `prelaunch_view`, `countdown_zero`, `prelaunch_exit` fire correctly without depending on a real SDK              |
| `logger`                | `vi.mock('@/lib/logger')`                                      | Verify `assertEventStartConfig` emits exactly one warning with the truncated raw env value (decision #7)                 |
| `sessionStorage`        | `vi.spyOn(window.sessionStorage, 'getItem'/'setItem')`         | Verify single-fire `prelaunchExitFired` guard (decision #9)                                                              |
| `document.referrer`     | `Object.defineProperty(document, 'referrer', { value: '…' })`  | Drive `PrelaunchExitTracker` branches (decision #8)                                                                      |
| Playwright `page.clock` | Real (Playwright API)                                          | E2E zero-crossing test uses `page.clock.install` + `fastForward` to advance time without 60-second waits                 |

### Test Scenarios Outline

1. **Happy Path**
   - [ ] Env set 1 day ahead → visiting `/` renders prelaunch HTML with
         tiles showing `01 / 00 / 00` (approx) and headline visible.
   - [ ] Open prelaunch page → 60s of fake time → minutes tile decremented
         exactly once.
   - [ ] Env set 2s ahead → `page.clock.fastForward(3_000)` → page reloads
         and Homepage SAA is rendered.
   - [ ] Admin (authenticated) visiting `/admin` during prelaunch → sees
         prelaunch page, no admin UI.

2. **Error Handling**
   - [ ] Env unset → `isPrelaunch()` returns `false` → site behaves
         normally (regression guard for Homepage SAA).
   - [ ] Env = `"not-a-date"` → same fallback.
   - [ ] Env set in the past → `isPrelaunch()` returns `false`.
   - [ ] API handler called during prelaunch → returns 503
         `{ error: 'prelaunch' }`.
   - [ ] `/api/auth/...` called during prelaunch → reaches the handler
         (no 503).
   - [ ] `/api/healthz` called during prelaunch → returns 200.

3. **Edge Cases**
   - [ ] Tab backgrounded for 5 fake-minutes → on visibility return, tile
         values jump to the correct remaining time (not "1 minute less than
         before backgrounding").
   - [ ] Countdown crosses zero while the page is open → `router.refresh()`
         called exactly once (not once per subsequent tick).
   - [ ] `/_next/data/some-route.json` requested during prelaunch → NOT
         rewritten (asset path).
   - [ ] `/auth/callback?code=...` requested during prelaunch → NOT
         rewritten; reaches the existing OAuth handler.
   - [ ] `prefers-reduced-motion: reduce` honored — no implicit animation
         on tile re-render (we don't add any; this is a regression guard).
   - [ ] `<meta name="robots" content="noindex">` present in the head
         (FR-014).

### Tooling & Framework

- **Test framework**: Vitest (unit + integration), Playwright (E2E), axe-core.
- **Supporting tools**: `@testing-library/react`, `next/navigation` mocks,
  Playwright `page.clock`.
- **CI integration**: existing `npm run lint && npm run typecheck && npm run test && npm run test:e2e` chain. No new CI gates.

### Coverage Goals

| Area                                 | Target                                                               | Priority |
| ------------------------------------ | -------------------------------------------------------------------- | -------- |
| `isPrelaunch()` + `prelaunchGuard()` | 100% branch (4 env states × 2 helpers)                               | High     |
| Middleware rewrite + skip-list       | 100% of the path matrix in `middleware-prelaunch.test.ts`            | High     |
| `CountdownTimer` extensions          | 100% of new branches (`hideComingSoon`, `onZero`, visibility resync) | High     |
| E2E (US1, US2, US3)                  | 1 spec per user story; axe sweep passes                              | High     |

---

## Dependencies & Prerequisites

### Required Before Start

- [x] `.momorph/constitution.md` reviewed.
- [x] `spec.md` authored (status: Draft — to be reviewed via `/momorph.reviewspecify`).
- [x] Homepage SAA components shipped: `CountdownTile`, `CountdownTimer`,
      `lib/event/config.ts`, `lib/event/countdown.ts`.
- [x] Middleware already handles session refresh + protected-path redirect
      (the prelaunch branch is additive).
- [ ] `MM_MEDIA_BG` (node `2268:35129`) downloaded — Phase 0 task.
- [ ] `query_section` on `2268:35130` resolved (cover gradient values) — Phase 0 task.
- [ ] Env var `NEXT_PUBLIC_EVENT_START_AT` documented in `.env.example`
      (it already is for Homepage SAA — confirm the comment notes that
      a **future** value triggers prelaunch).

### External Dependencies

- Supabase local dev environment (`supabase:start`) — only to verify
  middleware session refresh continues to work; no schema or RLS changes.
- Figma file `9ypp4enmFmdK3YAFJLIu6C` reachable via MoMorph MCP (already
  verified during spec phase).

---

## Open Questions

> All blocking items were resolved during `/momorph.reviewplan` on
> 2026-05-15 (see _Resolved during `reviewplan`_ at the top). The
> remaining items below are non-blocking and tracked for visibility.

- [ ] **Cover gradient tokenization** — does the prelaunch cover use the
      same `--color-hero-background` as Homepage SAA's hero, or does it
      need a new token (`--bg-prelaunch-cover`)? Resolved by Phase 0
      step 2 (`query_section` on `2268:35130`).
- [ ] **Background WebP/AVIF conversion** — do we ship pre-converted
      assets in `public/prelaunch/`, or rely on `next/image` runtime
      optimization? Default: rely on `next/image`; revisit only if LCP
      regresses in the Phase 4 Lighthouse check.
- [ ] **Analytics SDK** — `lib/analytics/track.ts` wraps `logger.info`
      for MVP. When the real SDK lands, replace the body; no call-site
      changes needed.
- [ ] **`/api/healthz`** — does not currently exist. The plan does NOT
      create it; FR-006 only mandates the **exception path** in
      middleware, not that the route exists. When SRE adds it,
      `isApiAllowed` already exempts it.
- [ ] **Soft-deprecated `ja` locale** — Homepage SAA narrowed locales to
      `vi/en` but kept `messages/ja.json` in the repo. We mirror that:
      new `prelaunch.*` keys are added to `ja.json` to keep the parity
      test green, but no end-user ever sees them.
- [ ] **`/auth/signout` skip-list inclusion** — spec FR-005 only names
      `/auth/callback` as the exempt page-route. We added `/auth/signout`
      to the skip-list (decision #4) to preserve signout for stale
      pre-prelaunch tabs. **Stakeholder confirmation requested**: is the
      stronger reading of FR-005 ("only the OAuth callback") intended,
      or is the symmetric "all `/auth/*` page-routes pass through"
      reading (which we implemented) acceptable? If the strict reading
      wins, the only behavior change is "stale signout calls produce
      prelaunch HTML and the session stays alive until prelaunch ends"
      — neither option breaks security; the difference is UX clarity.
- [x] **i18n key wiring** — resolved (decision #1, `translationNamespace`).
- [x] **FR-009 `--` placeholder rendering** — resolved (decision #2).
- [x] **Middleware matcher / `/login` rewrite** — resolved (decision #3).
- [x] **`/api/*` short-circuit mechanism** — resolved (decision #4,
      middleware-only).
- [x] **Cookie preservation on rewrite** — resolved (decision #5,
      `preserveCookies` helper).
- [x] **Direct visits to `/prelaunch`** — resolved (decision #6, allowed
      with `--` placeholders).
- [x] **Misconfiguration logging** — resolved (decision #7,
      `assertEventStartConfig`).
- [x] **`prelaunch_exit` analytics** — resolved (decision #8,
      `PrelaunchExitTracker` mounted on Homepage SAA).
- [x] **Single-fire reload across remounts** — resolved (decision #9,
      `sessionStorage.prelaunchExitFired`).
- [x] **WCAG contrast verification** — resolved (decision #10, targeted
      `color-contrast` E2E assertion).
- [x] **Past-date direct visit shows `--`, not `00`** — resolved
      (decision #11, Server Component normalizes past env to `null` via
      `isPrelaunch()` before passing `targetMs`).

---

## Next Steps

After plan approval:

1. **Run** `/momorph.tasks` to generate the task breakdown with
   parallelization markers.
2. **Begin** implementation following Phase order — Phase 0 must complete
   before Phase 3.

---

## Notes

- **Rewrite, not redirect** (spec _Notes_): the URL bar stays on the
  originally requested path. This preserves pre-launch deep links so
  marketing's email campaigns "warm up" their landing pages correctly,
  and keeps analytics granular if product wants per-deep-link reporting
  later.
- **Middleware ordering matters**: `isPrelaunch()` runs **before**
  `isProtectedPath()` so authenticated users (including admins) converge
  on the same prelaunch UI as anonymous visitors (FR-003 + spec _Notes_).
- **Fail-open posture** (FR-009): if `NEXT_PUBLIC_EVENT_START_AT` is
  unset/invalid, `isPrelaunch()` returns `false`. The cost of "site is
  reachable a few minutes early" is recoverable; "site is locked out
  forever because env is wrong" is not.
- **Single-fire reload** (FR-012): `firedZeroRef` ensures
  `router.refresh()` happens exactly once on the client. On the server,
  `isPrelaunch()` returns `false` for the refreshed request, so the
  second render lands on Homepage SAA.
- **No new persistent data**: prelaunch's only "data" is `Date.now()`
  and the env var. No tables, no RLS changes, no migrations.
- **Bundle impact**: zero new runtime dependencies; the prelaunch page
  reuses existing client islands. Expected page weight: hero artwork
  (~150 KB WebP) + the CountdownTimer chunk Homepage SAA already pays
  for.
