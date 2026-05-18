# Feature Specification: Countdown — Prelaunch Page

**Frame ID**: `2268:35127` (screen ID `8PJQswPZmU`)
**Frame Name**: `Countdown - Prelaunch page`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**Created**: 2026-05-14
**Status**: Draft

---

## Overview

A read-only, full-bleed landing page that is rendered to **every visitor of the site** (authenticated or anonymous) **while the current time is earlier than the campaign launch datetime** (`NEXT_PUBLIC_EVENT_START_AT`). The screen surfaces a single piece of information: a live countdown to event start, broken into three units — DAYS, HOURS, MINUTES (no seconds). When the countdown reaches `00 / 00 / 00`, the application transitions to the real Homepage SAA flow.

The page exists to:

1. Gate all SAA features (kudos, awards, profile, admin, ...) behind the launch datetime so nothing leaks before the official start.
2. Build anticipation with a clear, server-truthful "time remaining" indicator that matches the granularity used on the Homepage SAA hero countdown (also days / hours / minutes).
3. Provide a stable, SEO-noindex stand-in that authenticated users cannot bypass by carrying over an existing session.

The Figma frame contains **no header, no footer, no buttons, no links, no language switcher, and no sign-in CTA** — it is intentionally minimal. The countdown is the only interactive surface, and even it is not user-controllable (no pause, no skip, no reset).

This spec reuses the existing `lib/event/config.ts` (`getEventStartAt()`) helper that already drives the Homepage SAA countdown, and the `CountdownTile` + `CountdownTimer` components shipped with `i87tDx10uM-homepage-saa`. See [Homepage SAA spec](../i87tDx10uM-homepage-saa/spec.md) for the original implementations.

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Visitor sees the countdown during prelaunch (Priority: P1)

Any visitor — first-time, anonymous, or already-authenticated — who navigates to the site before `NEXT_PUBLIC_EVENT_START_AT` is shown the prelaunch page with a live ticking countdown.

**Why this priority**: Without this story shipping, the entire application is reachable before launch, which defeats the business purpose of a coordinated campaign reveal. This is the **MVP** of the screen.

**Independent Test**: With the prelaunch feature enabled (e.g. `NEXT_PUBLIC_EVENT_START_AT` set to a future time), open the root URL `/` in a fresh browser; assert that the prelaunch hero renders, that the three tiles show non-negative two-digit values, and that the displayed minutes value decrements at least once over a 90 s wall-clock observation window.

**Acceptance Scenarios**:

1. **Given** the current time is at least 1 minute before `NEXT_PUBLIC_EVENT_START_AT` **and** the visitor is **not authenticated**, **When** the visitor navigates to `/`, **Then** the prelaunch page is rendered and the visitor cannot reach `/login`, `/awards`, `/kudos`, or any other public route while prelaunch is active (each is rewritten to the prelaunch page).
2. **Given** the current time is at least 1 minute before `NEXT_PUBLIC_EVENT_START_AT` **and** the visitor **is authenticated** (with any role, including admin), **When** the visitor navigates to any in-scope path, **Then** the prelaunch page is rendered and no authenticated UI (profile menu, notifications, admin dashboard) is visible.
3. **Given** the prelaunch page has been loaded for 60 seconds **and** the page is still open, **When** wall-clock time has advanced by at least 60 s, **Then** the **MINUTES** tile (and downstream tiles on rollover) displays an updated value reflecting the new remaining time, without a full page reload.
4. **Given** the prelaunch page is loaded with 1 day, 5 hours, 20 minutes remaining, **Then** the tiles display exactly `01`, `05`, `20`.

---

### User Story 2 — Countdown transitions the user to Homepage SAA at launch (Priority: P1)

When the live countdown reaches zero on a client that already has the prelaunch page open, the application transitions the user to the real Homepage SAA without requiring a manual refresh.

**Why this priority**: A visitor who has been waiting on the prelaunch page is the most engaged segment of the launch audience; they must not have to re-type the URL or hit refresh to see the campaign go live.

**Independent Test**: Set `NEXT_PUBLIC_EVENT_START_AT` to a time ~90 s in the future. Open the prelaunch page. Wait until the countdown reaches `00 / 00 / 00`. Assert that the page navigates to (or re-renders as) Homepage SAA within 5 seconds of the zero crossing without manual interaction.

**Acceptance Scenarios**:

1. **Given** the prelaunch page is open and the remaining time is < 60 seconds, **When** the countdown logically reaches zero (computed locally from `NEXT_PUBLIC_EVENT_START_AT` and `Date.now()`), **Then** the client issues `router.refresh()` (or a full `window.location.reload()`) so the middleware re-evaluates the prelaunch flag and the visitor lands on Homepage SAA.
2. **Given** the prelaunch page is open at zero, **When** the page reloads, **Then** the new render does **not** re-render the prelaunch page (the server-side prelaunch flag must now be `false`).
3. **Given** the visitor was authenticated before prelaunch ended, **When** they land on Homepage SAA after the transition, **Then** the existing Supabase session cookie is honored and the authenticated header (profile menu, notifications bell) is rendered.

---

### User Story 3 — Direct visits to deep links during prelaunch surface the prelaunch page (Priority: P1)

A visitor who arrives via a deep link (e.g. an old `/awards#top-talent` link, a notification email link to `/kudos/abc`, an admin shortcut to `/admin`) sees the prelaunch page rather than a 404, a redirect to login, or partial content.

**Why this priority**: Pre-launch teasers and email blasts will contain deep links that authors expect to "warm up" by landing on the brand artwork. A 404 or a confusing login screen would feel broken to anyone clicking these.

**Independent Test**: With prelaunch active, request `/awards`, `/kudos/anything`, `/profile`, `/admin`, `/some-bogus-path` and `/login` — each should render the prelaunch page (HTTP 200), not a 401/403/404 or a redirect to `/login`.

**Acceptance Scenarios**:

1. **Given** prelaunch is active, **When** any in-scope path (including unknown routes and the auth surfaces `/login` and `/auth/callback` — see Edge Cases for the callback exception) is requested, **Then** the response is the prelaunch page with HTTP 200.
2. **Given** prelaunch is active, **When** a request hits a Next.js internal asset (`/_next/static/...`, `/_next/image`, `/favicon.ico`, public image extensions), **Then** the asset is served normally so the prelaunch page itself can load.
3. **Given** prelaunch is active, **When** an API route under `/api/...` is called (e.g. by a stale client), **Then** the route returns HTTP 503 with `{ "error": "prelaunch" }`; **no Supabase queries run**. Exceptions: `/api/auth/*` (OAuth flow) and `/api/healthz` (liveness probe) remain functional — see FR-006.

---

### User Story 4 — Prelaunch page is search-engine-safe and analytics-tracked (Priority: P3)

The prelaunch page is not indexed by search engines, and product can observe how many visitors arrived and what the median remaining time was.

**Why this priority**: Cosmetic / observational — does not block launch. Useful for the marketing team but not blocking.

**Independent Test**: View the rendered HTML; assert the presence of `<meta name="robots" content="noindex">`. Open analytics; assert that the `prelaunch_view` event fires once per session with a numeric `remaining_minutes` property.

**Acceptance Scenarios**:

1. **Given** the prelaunch page is rendered, **Then** the document `<head>` contains `<meta name="robots" content="noindex">`.
2. **Given** a fresh session opens the prelaunch page, **Then** exactly one `prelaunch_view` analytics event is emitted with `{ remaining_minutes: number }`.
3. **Given** the countdown reaches zero, **Then** a `countdown_zero` analytics event is emitted with `{ source: "prelaunch" }`.

---

### Edge Cases

- **Env var missing or unparseable**: `NEXT_PUBLIC_EVENT_START_AT` is undefined / empty / not ISO-8601. The page MUST render with placeholder `--` digits in all three tiles, MUST log the misconfiguration to monitoring, MUST NOT crash, and the prelaunch flag MUST default to **false** (i.e. when we cannot prove we are prelaunch, behave as launched). This is the safe-fail direction: it is worse to lock the site out than to ship the real app a few minutes early.
- **Past datetime**: `NEXT_PUBLIC_EVENT_START_AT` is in the past. The prelaunch flag MUST be `false` and Homepage SAA renders normally.
- **Negative computed values** (clock skew, bad input): The system clamps any individual unit to `00`. Tiles never render negative numbers.
- **Out-of-range unit values** (HOURS=25, MINUTES=60, etc., e.g. from a bad computation): The system clamps to `00`. Tiles never render values outside `00..23` (hours) or `00..59` (minutes).
- **Single-digit values**: All tiles MUST always display **two digits** with leading zero (`00`, `09`, `10`, `31`).
- **No seconds tile**: The screen intentionally shows DAYS / HOURS / MINUTES only. Sub-minute precision is not surfaced; cadence is 60 s.
- **Browser tab inactive for > 60 s** (throttled `setInterval`): On regaining visibility the tile values MUST resync to the current remaining time computed from `targetAt - Date.now()`, not just decrement from the last paint.
- **OAuth callback during prelaunch**: A user who initiates Google sign-in _before_ prelaunch is treated as a normal authenticated user once the callback succeeds — but during prelaunch they still see the prelaunch page. The middleware MUST NOT rewrite `/auth/callback` itself, otherwise the OAuth exchange will fail; the callback completes, sets the cookie, then the next request hits prelaunch.
- **DST / timezone jump**: `NEXT_PUBLIC_EVENT_START_AT` is treated as UTC (ISO-8601 with timezone offset). DST jumps do not affect rendering.
- **Server clock vs client clock drift**: Initial render is server-truth (Server Component computes `remaining` from server `Date.now()`); the client decrements from then on. Minor drift (< 60 s) is acceptable.
- **Page open across the zero boundary while offline**: When the client cannot reach the server to refresh, the page MAY display `00 / 00 / 00` indefinitely; that is acceptable. The next time the client regains network and reloads, the middleware will route correctly.

---

## UI/UX Requirements _(from Figma)_

### Screen Components

| Component               | Node ID                             | Description                                                                                                                                                      | Interactions      |
| ----------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| BackgroundMedia         | (RECTANGLE 2268:35129 + 2268:35130) | Full-bleed campaign artwork (`MM_MEDIA_BG`) with a dark gradient cover overlay for legibility.                                                                   | None.             |
| PrelaunchHero           | 2268:35131                          | Absolutely-centered hero block containing the headline and the three countdown tiles.                                                                            | None.             |
| Headline                | 2268:35137                          | Static text: "Sự kiện sẽ bắt đầu sau" (vi). Locale key planned: `prelaunch.heading`.                                                                             | None.             |
| CountdownTimer          | 2268:35136                          | Wrapper that ticks every 60 s, recomputes remaining time from `targetAt - Date.now()`, and renders three tiles. Fires `countdown_zero` event when remaining ≤ 0. | None — read-only. |
| CountdownTile — DAYS    | 2268:35139                          | Two-digit numeric value + label "DAYS". Reuses the existing `CountdownTile` component from Homepage SAA.                                                         | None.             |
| CountdownTile — HOURS   | 2268:35144                          | Two-digit numeric value + label "HOURS".                                                                                                                         | None.             |
| CountdownTile — MINUTES | 2268:35149                          | Two-digit numeric value + label "MINUTES".                                                                                                                       | None.             |

### Navigation Flow

- **From**: Any in-scope public path (`/`, `/login`, `/awards[/...]`, `/kudos[/...]`, `/profile[/...]`, `/notifications[/...]`, `/admin[/...]`, `/community-standards`, ...) while `isPrelaunch()` returns `true`. Middleware rewrites these requests to render the prelaunch page.
- **To**: Homepage SAA (`/`) — triggered automatically when the in-page countdown reaches zero (client emits `router.refresh()` or a full reload so middleware re-evaluates and `isPrelaunch()` returns `false`).
- **Triggers**: There are zero user-initiated navigation triggers on this screen.

### Behavioral Requirements (non-visual)

Pixel-level visual specs (colors, font sizes, spacing, shadows, breakpoints, asset URLs) are intentionally **out of scope for this document** and will be fetched by the implementation phase via `query_section` on the relevant node IDs and `get_media_file` for `MM_MEDIA_BG` (node `2268:35129`). Behavior-level requirements:

- **Responsive behavior**: All three tiles MUST remain fully visible (no horizontal scroll, no clipping) at every supported viewport size. Whether tiles stack vertically on the smallest screens is an implementation decision driven by the design tokens.
- **Animations / transitions**: Only the tile digits update on tick. If the implementer adds a digit-change animation (e.g. flip-card effect), it MUST honor `prefers-reduced-motion: reduce`.
- **Accessibility**: WCAG 2.1 AA per constitution Principle III, including the `aria-live` region pattern specified in FR-016.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST expose an `isPrelaunch()` helper that returns `true` if and only if `NEXT_PUBLIC_EVENT_START_AT` is a valid ISO-8601 datetime in the future of the **server's current time** at the moment the request is processed.
- **FR-002**: System MUST render the prelaunch page for every in-scope request while `isPrelaunch()` returns `true`, regardless of the visitor's authentication state, role, or originally requested path (subject to the asset / auth-callback exceptions in FR-005).
- **FR-003**: Prelaunch gating MUST be evaluated server-side (in `middleware.ts`) **before** the existing protected-path check (`isProtectedPath`), so authenticated and unauthenticated users converge on the same prelaunch UI.
- **FR-004**: System MUST NOT rewrite requests for Next.js internals (`/_next/static`, `/_next/image`, `/favicon.ico`, image-extension URLs under `/assets`), so that the prelaunch page's own assets and any static media (campaign artwork) load normally.
- **FR-005**: System MUST NOT rewrite `/auth/callback` while prelaunch is active, so an in-flight Google OAuth exchange can complete. The freshly-authenticated user will see the prelaunch page on the next navigation.
- **FR-006**: While prelaunch is active, API routes under `/api/*` MUST short-circuit and return HTTP `503` with body `{ "error": "prelaunch" }` (no Supabase / no business logic runs), **except**:
  - `/api/auth/*` — MUST continue to function so that any in-flight Google OAuth flow (signin, callback) can complete (see also FR-005 for the `/auth/callback` page-route exception).
  - `/api/healthz` — MUST continue to function as a liveness probe so that deployment platforms and uptime monitors do not flag the site as down during prelaunch.
- **FR-007**: The countdown MUST always display each unit as a **two-digit, zero-padded** integer (`00`, `09`, `10`, `31`).
- **FR-008**: The countdown MUST clamp each unit to its valid range and replace any out-of-range or negative value with `00` (DAYS: `00..N`, HOURS: `00..23`, MINUTES: `00..59`).
- **FR-009**: If `NEXT_PUBLIC_EVENT_START_AT` is missing or unparseable, the page MUST render `--` placeholders in all three tiles, MUST NOT throw, and `isPrelaunch()` MUST return `false` (fail-open to launched state).
- **FR-010**: The client MUST update tile values automatically while the page is open. Cadence: at least once per minute. The implementation MAY use `setInterval` at 60 s, or `setInterval` at 1 s with a derived `Math.floor((targetAt - now) / 60000)` if needed for tab-visibility resync.
- **FR-011**: On regaining tab visibility, the client MUST recompute the remaining time from `targetAt - Date.now()` (not assume `setInterval` fired uninterrupted).
- **FR-012**: When the countdown reaches zero on an open client, the client MUST trigger a server re-render (e.g. `router.refresh()` or `window.location.reload()`) within 5 s of the zero crossing.
- **FR-013**: Initial render of the tile values MUST be server-computed (Server Component) so that visitors do not see `--` for the first paint. The client takes over only for live ticking.
- **FR-014**: The rendered HTML MUST include `<meta name="robots" content="noindex">` so the prelaunch page is not indexed by search engines.
- **FR-015**: The page MUST NOT contain any focusable interactive elements (no buttons, no links, no language switcher, no sign-in CTA). `<main>` MAY be focusable via `tabindex="-1"` to provide a screen-reader landing target.
- **FR-016**: The countdown wrapper MUST expose an `aria-live="polite"` region that announces remaining time in the format `"{days} days, {hours} hours, {minutes} minutes remaining"`. Announcements MUST throttle to at most one per minute (no per-second spam).
- **FR-017**: All visible copy MUST flow through the i18n layer and MUST ship translations for the currently active locales (`vi` default, `en`) — matching the post-narrowing state locked by Homepage SAA. New keys: `prelaunch.heading` (default `"Sự kiện sẽ bắt đầu sau"`), `prelaunch.units.days`, `prelaunch.units.hours`, `prelaunch.units.minutes`. The same keys MAY ALSO be added to `messages/ja.json` to keep the locale-files-parity test green (`ja.json` is soft-deprecated in the repo but is not rendered to end-users). Locale resolution follows the existing app strategy (cookie + `Accept-Language`); the prelaunch page does NOT expose a language switcher (FR-015).

### Technical Requirements

- **TR-001**: LCP must remain < 2.5 s at the 75th percentile. The hero background image (`MM_MEDIA_BG`) MUST use `next/image` with `priority` and a `placeholder="blur"` data URL, or be served as an `<img>` with `fetchpriority="high"`.
- **TR-002**: No Supabase / external API calls run during the prelaunch render path. The page is fully static apart from the `Date.now()` read for initial tile values.
- **TR-003**: Cookies set by Supabase Auth (`@supabase/ssr`) MUST still be refreshed by the middleware while prelaunch is active, so that a session that pre-existed prelaunch (or one acquired via the un-rewritten `/auth/callback`) is still valid when launch occurs.
- **TR-004**: The component implementation MUST reuse the existing `CountdownTile` and `CountdownTimer` from `i87tDx10uM-homepage-saa` rather than re-implementing them, to keep tick logic and rendering consistent across the two screens.
- **TR-005**: Per constitution Principle V, the `isPrelaunch()` helper and the countdown-clamping logic MUST be covered by unit tests (Vitest); the middleware rewrite MUST be covered by an integration test that asserts both rewrites and the asset / `/auth/callback` exceptions.
- **TR-006**: Per constitution Principle II, no hard-coded colors / spacing values in components — consume Tailwind tokens declared in `app/globals.css`.

### Key Entities _(if feature involves data)_

This feature touches no persistent entities. The only "data" is the build-time env var `NEXT_PUBLIC_EVENT_START_AT` (ISO-8601 string with timezone offset) and the derived `remaining = { days: number, hours: number, minutes: number, totalMs: number }`.

---

## API Dependencies

The prelaunch page itself calls **no APIs**. The countdown target is read from a build-time env var. This table records the related entry points and how each must behave during prelaunch:

| Endpoint                          | Method | Purpose                                                                           | Status          |
| --------------------------------- | ------ | --------------------------------------------------------------------------------- | --------------- |
| `NEXT_PUBLIC_EVENT_START_AT` env  | n/a    | Source of the countdown target (read by `lib/event/config.ts`).                   | Exists          |
| `/auth/callback`                  | GET    | OAuth exchange — MUST remain reachable during prelaunch (FR-005).                 | Exists          |
| `/api/auth/*`                     | any    | OAuth signin / callback APIs — MUST remain functional during prelaunch (FR-006).  | Exists          |
| `/api/healthz`                    | GET    | Liveness probe — MUST remain functional during prelaunch (FR-006).                | Exists / New    |
| `/api/*` (all other routes)       | any    | Short-circuit with HTTP 503 `{ "error": "prelaunch" }` during prelaunch (FR-006). | Behavior change |
| All UI routes (`/`, `/awards`, …) | any    | Rewritten to the prelaunch page (FR-002, FR-003).                                 | Behavior change |

> **Predicted**: No new HTTP endpoints are introduced by this feature.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: With `NEXT_PUBLIC_EVENT_START_AT` set ≥ 5 minutes in the future, 100% of requests to in-scope paths return the prelaunch page (HTTP 200) instead of their normal content, measured via synthetic checks in CI.
- **SC-002**: When the countdown reaches zero on an open page, 95% of clients land on Homepage SAA within 5 seconds without manual interaction (measured via the `prelaunch_exit` → first Homepage SAA `screen_view` analytics pair).
- **SC-003**: Zero search-engine indexing of the prelaunch page (`<meta name="robots" content="noindex">` present in 100% of server-rendered responses; verified post-launch in Google Search Console).
- **SC-004**: First Contentful Paint of the prelaunch page < 1.5 s and Largest Contentful Paint < 2.5 s at the 75th percentile on representative production data (per constitution Principle III).
- **SC-005**: Zero accessibility regressions: axe-core reports no new WCAG 2.1 AA violations on the prelaunch page compared to the existing Homepage SAA baseline.

---

## Out of Scope

- **Seconds tile** — explicitly absent from the Figma frame. If product later wants seconds, that is a separate spec.
- **Language switcher** — absent from the Figma frame; locale is whatever the user's cookie / `Accept-Language` resolves to. (i18n keys are still provided per FR-017 so vi/en/ja can be served, but no user-facing toggle.)
- **Sign-in CTA** — absent from the Figma frame; visitors who try to sign in during prelaunch will not find a button. The `/auth/callback` page-route exception in FR-005 and the `/api/auth/*` API exception in FR-006 only exist to let in-flight OAuth flows finish, not to invite new sign-ins.
- **Notification of users who pre-registered** — not part of this screen.
- **Animated digit transitions** (flip-card, slide, etc.) — implementation may add a subtle re-render animation but is not required.
- **Admin / QA preview-during-prelaunch bypass** — by product decision, there is no admin or query-param bypass. Anyone visiting the site during prelaunch sees the prelaunch page. QA verification of the post-launch site is done by temporarily editing `NEXT_PUBLIC_EVENT_START_AT` in the staging / preview environment.
- **Language switcher on prelaunch** — out of scope; locale comes from the existing cookie / `Accept-Language` resolution. Three locales (vi/en/ja) are translated per FR-017 but the toggle UI is not present.

---

## Dependencies

- [x] Constitution document exists (`.momorph/constitution.md`)
- [ ] API specifications — n/a for this feature (no new endpoints).
- [ ] Database design — n/a for this feature (no persistent state).
- [x] Screen flow documented (`.momorph/contexts/SCREENFLOW.md` + `.momorph/contexts/screen_specs/countdown-prelaunch.md`)
- [x] Homepage SAA `CountdownTile` + `CountdownTimer` components shipped (reused per TR-004; see [Homepage SAA spec](../i87tDx10uM-homepage-saa/spec.md))
- [x] `lib/event/config.ts` `getEventStartAt()` helper exists (reused for `targetAt` source)
- [ ] Campaign artwork `MM_MEDIA_BG` (node `2268:35129`) downloaded to `public/prelaunch/` — implementation-phase task.

---

## Notes

- **Routing strategy decision**: middleware **rewrite** (not redirect) is the chosen approach so the URL bar still reflects the originally requested path (e.g. `/kudos/abc` stays `/kudos/abc` while showing prelaunch). This avoids breaking any pre-launch email/social links and preserves analytics granularity if product wants to know which deep links visitors are clicking.
- **Middleware ordering**: `isPrelaunch()` MUST be checked before `isProtectedPath()` in `middleware.ts`. Authenticated and admin users see the same page as anonymous visitors.
- **OAuth callback exception** (FR-005) is essential — without it, a user who initiated Google sign-in just before prelaunch flipped on will be unable to complete the exchange and the callback will fail, leaving them with no session at all. The callback URL is non-user-visible; preserving it does not leak any pre-launch surface.
- **Fail-open posture for misconfiguration** (FR-009): if env is unset, `isPrelaunch()` returns `false`, meaning the real app ships. This is intentional — the failure mode of "site is reachable a few minutes early" is recoverable; "site is locked out indefinitely after launch because env is wrong" is not.
- **`countdown_zero` event** is the single observable signal that the prelaunch-to-launch transition fired on a given client; the `prelaunch_exit` event records that the client successfully reloaded into Homepage SAA. Both are useful for post-launch funnel analysis.
- This spec assumes a **single global launch datetime**. Multi-region staggered launches, per-tenant launches, or A/B-tested launch times are out of scope and would require a different design.
