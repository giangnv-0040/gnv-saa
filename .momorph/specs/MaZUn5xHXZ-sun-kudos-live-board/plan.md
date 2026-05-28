# Implementation Plan: Sun\* Kudos - Live board

**Frame**: `MaZUn5xHXZ-sun-kudos-live-board`
**Date**: 2026-05-20
**Spec**: `specs/MaZUn5xHXZ-sun-kudos-live-board/spec.md`

---

## Summary

`/kudos` is the central public feed of SAA 2025. The plan replaces the existing `ComingSoon`
placeholder with a four-region screen — Banner KV + quick-capture, HIGHLIGHT KUDOS carousel,
ALL KUDOS infinite feed + sidebar, and SPOTLIGHT word cloud. Reads use Server Components with
streaming for the first paint; mutations (likes) and incremental loads (filters, scroll) use
TanStack Query on the client. Backend introduces `kudos`, `kudo_likes`, `secret_boxes`, and
`special_days` tables behind RLS, plus a small number of thin API route handlers.

The plan slices vertically per user story: each P1 story (view feed / quick capture / like)
ships end-to-end (DB → API → UI → tests) before P2 stories layer on top.

---

## Technical Context

**Language/Framework**: TypeScript 5 (strict) + Next.js 16 (App Router) + React 19
**Primary Dependencies**: TailwindCSS 4, `@supabase/ssr` + `@supabase/supabase-js`, `next-intl`,
`zod`, plus two new runtime deps proposed below (TanStack Query + d3-cloud — see
_Constitution Compliance Check_ for justification).
**Database**: Supabase Postgres with RLS. New tables: `kudos`, `kudo_likes`, `kudo_images`,
`kudo_hashtags`, `secret_boxes`, `special_days`. New SQL views: `user_kudo_stats`,
`kudo_with_aggregates`, `kudo_spotlight`.
**Testing**: Vitest (unit + integration) + Playwright (E2E) + `@testing-library/react`. RLS
policies are tested with the Supabase test-helper that runs as the `anon` and `authenticated`
roles end-to-end.
**State Management**: Server Components for first paint. TanStack Query for client-side
refetch / mutation / cache. `useSearchParams` for shareable filter state
(`?hashtag=&team=&sort=`). No global state library introduced.
**API Style**: REST under `app/api/.../route.ts`. Endpoints validate input with Zod at the
boundary; business logic lives in `lib/kudos/services/*` per `.momorph/guidelines/backend.md`.

---

## Constitution Compliance Check

_GATE: Must pass before implementation can begin._

- [x] **§I — Clean Code**: Files <250 LoC by splitting feed / carousel / spotlight / sidebar
      into separate organism components. TypeScript `strict` is already on. No `any` /
      `@ts-ignore` budgeted; review will enforce.
- [x] **§II — Tech Stack**: Default to Server Components; Client Components only where state
      / browser APIs are required (`HeartButton`, `HighlightCarousel`, `SpotlightCanvas`,
      `SunnerSearch`, `LikeMutation`, `FilterDropdown`, `FeedInfiniteScroll`). Tailwind
      utilities + design tokens only — zero hard-coded colors or px values. All `href` and
      route push targets come from `lib/routes.ts` (`ROUTES.KUDOS`, `ROUTES.KUDOS_NEW`,
      `ROUTES.KUDO_DETAIL(id)` — last one to be added). Supabase: every new table gets RLS
      enabled with explicit policies; service-role key never reaches the browser. New schema
      migrations are versioned files under `supabase/migrations/`.
- [x] **§III — Responsive & a11y**: Mobile-first layouts; 3-column collapses to single-column
      <1024px. Touch targets ≥44×44. Carousel arrows + heart button + filter dropdowns expose
      `aria-label` / `aria-pressed` / `aria-disabled`. Spotlight word cloud ships with an
      accessible fallback list (screen-reader only) so the canvas is not a dead-end. Color
      tokens already in `globals.css` are reused; no new raw hex.
- [x] **§IV — OWASP**: All route handlers validate input with Zod and re-check authorization
      against the Supabase user (not just RLS). Like / unlike endpoints reject when the caller
      is the kudo's sender (defence-in-depth above the DB constraint). Output encoding stays
      with React defaults; no `dangerouslySetInnerHTML`. Toast / error messages do not leak
      stack traces.
- [x] **§V — TDD**: For every user story, a failing test is written first (Vitest contract
      test for the API route handler, Vitest component test for the UI primitive, Playwright
      E2E for the user-visible flow). The order is documented per phase in _Implementation
      Strategy_ below.

**Violations (with justification)**:

| Violation                                                                 | Justification                                                                                                                                                                                                                                                                         | Alternative Rejected                                                                                                                             |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Adding `@tanstack/react-query` as a runtime dep                           | Constitution §II names "React Query, SWR" explicitly as approved client-side data-fetching strategies. The live board needs background refetch + mutation rollback for likes + infinite-scroll cache; rolling these by hand would be a multi-hundred-LoC custom hook with no payback. | Hand-rolled `useReducer` cache — rejected because constitution favors documented strategy + the surface area is large enough to justify the dep. |
| Adding `d3-cloud` (or `cloudjs`) as a runtime dep for SPOTLIGHT           | The word-cloud layout problem is non-trivial (collision detection + spiral placement). `d3-cloud` is a pure layout function (no DOM), ~10KB, and well-maintained.                                                                                                                     | Canvas-from-scratch — feasible but ~300 LoC of layout code that we'd own and test ourselves. Rejected as not pulling weight against a 10KB dep.  |
| Promoting `lib/kudos/types.ts` from "client form types" to "domain types" | The existing file only defines Viết Kudo client form shapes. The live board needs `Kudo`, `KudoLike`, `KudoImage`, `SpecialDay`, `SecretBox` server-side. We keep both in the same module, prefixed `WriteKudo*` for the form and bare `Kudo`, `KudoLike` for domain.                 | Splitting into a parallel module — rejected, both flows belong to the kudos feature.                                                             |

---

## Architecture Decisions

### Frontend Approach

- **Component Structure (Atomic Design)**:
  - **Atoms**: `HeartIcon` (new SVG matching Figma), `SearchIcon`, `ChevronArrow`, `KudoBadge`,
    `EmptyState` (reuse where it exists or extract).
  - **Molecules**: `KudoActionBar` (heart + copy-link), `HashtagChip`, `FilterDropdown`,
    `UserChip` (avatar + name + team, with hover popover), `CarouselArrows`, `PageIndicator`,
    `SunnerLeaderboardRow`, `SidebarStatRow`.
  - **Organisms**: `KudoBannerHero` (A_KV Kudos), `QuickCaptureInput` (A.1), `HighlightCarousel`
    (B_Highlight), `KudoCard` (variant: `highlight | feed`), `AllKudosFeed` (C_All kudos +
    infinite scroll), `SpotlightBoard` (B.7 — canvas + search), `KudosSidebar`
    (D_Thống menu phải).
  - **Page**: `app/kudos/page.tsx` composes the organisms with streaming `<Suspense>` boundaries
    so HIGHLIGHT can render before SPOTLIGHT finishes its layout pass.

- **Styling Strategy**: Tailwind utilities + design tokens from `globals.css`. CSS-only text
  clipping via `line-clamp-3 / line-clamp-5` (Tailwind built-in) for FR-010. Tokens already
  match the cream / navy palette used by the Viết Kudo screen — no token additions expected.

- **Data Fetching**:
  - **Initial paint**: Server Components call services directly; pages stream so any slow
    region (Spotlight) doesn't block faster regions.
  - **Mutations + refetch**: TanStack Query. `useLikeKudoMutation` (optimistic, rolls back on
    error), `useKudosFeedInfinite` (`useInfiniteQuery` with cursor pagination), `useHighlightKudos`
    (refetch on filter change), `useSpotlight` (suspense query).
  - **Filter state**: URL search params (`?hashtag=&team=`); the QueryClient keys include
    those params so filter switches invalidate / refetch automatically.

- **Error & loading UX**: Per-region `<Suspense fallback={<RegionSkeleton />}>` blocks.
  Mutation errors raise the existing `Toast` molecule. Empty states use the existing copy
  pattern (per `messages/{vi,en,ja}.json`).

### Backend Approach

- **API Design**: REST under `app/api/kudos/*`, `app/api/users/me/*`, `app/api/secret-boxes/*`.
  Handlers are thin: validate (Zod), authorize (Supabase user check + role check where
  applicable), call service, return JSON. All endpoints declared in
  `.momorph/contexts/BACKEND_API_TESTCASES.md` (to be created in this PR — currently missing
  per prerequisites audit).
- **Data Access**: Repository functions in `lib/kudos/server/*.ts` that wrap Supabase queries
  with explicit typing. Reads use `select(...)` on the relevant view; writes touch single
  tables with RLS as the bouncer.
- **Validation**: Zod schemas in `lib/kudos/schemas.ts` for every request shape. The same
  schemas are exported for use in the API contract tests.

### Integration Points

- **Existing Services**:
  - `getCurrentUserProfile()` (`lib/users/actions.ts`) for the sidebar's `me` data and write
    gating.
  - `lib/notifications/actions.ts` for the shared `HomepageHeader` notification badge.
  - `lib/i18n/config.ts` and `next-intl` for locale routing.
  - `lib/event/config.ts` — `isPrelaunch()` already short-circuits `/kudos` during prelaunch
    via middleware. The live board MUST stay rewritable to `/prelaunch` until the event
    starts (no extra work needed; existing middleware handles it).
  - `lib/analytics/track.ts` — counters listed under _Success Criteria_ are tracked via this.
  - `Toast` molecule (`components/molecules/Toast.tsx`) for like-failure / copy-link toasts.
- **Shared Components**:
  - `HomepageHeader` + `AppFooter` (variant=`homepage`) wrap the page.
  - `ComingSoon` is removed from `app/kudos/page.tsx`.
- **API Contracts**: Each new endpoint has a Vitest contract test asserting request /
  response shape against the Zod schema. Contracts live with the route in
  `app/api/.../route.test.ts`.
- **Database migrations**: New migrations under `supabase/migrations/2026XXXX_*.sql`.
  Migration ordering: tables → indexes → views → RLS policies → seeds (optional). Every PR
  with a migration MUST also include the test that exercises the policy as anon and as
  authenticated.

---

## Project Structure

### Documentation (this feature)

```text
.momorph/specs/MaZUn5xHXZ-sun-kudos-live-board/
├── spec.md              # ✅ written
├── plan.md              # this file
├── research.md          # (optional — current plan absorbs research inline; skip unless complications surface)
├── tasks.md             # next step (momorph.tasks)
├── api-docs.yaml        # (next step — populate from template)
└── testcase.md          # (next step — momorph.createtestcases)
```

### Source Code (affected areas)

```text
# Frontend
app/
├── kudos/
│   └── page.tsx                     # REPLACES the ComingSoon placeholder
└── api/
    └── kudos/
        ├── route.ts                 # GET feed (sort=newest|hearts, hashtag, team, cursor)
        ├── hashtags/route.ts        # GET distinct hashtags
        ├── departments/route.ts     # GET distinct departments
        ├── spotlight/route.ts       # GET word-cloud distribution
        └── [id]/like/route.ts       # POST + DELETE
    └── users/me/
        ├── stats/route.ts           # GET personal counters
        └── leaderboard/route.ts     # GET ?type=rank-promotion|gift-received
    └── secret-boxes/
        └── next-unopened/route.ts   # GET id of next unopened box

components/
├── organisms/
│   └── kudos-board/
│       ├── KudoBannerHero.tsx
│       ├── QuickCaptureInput.tsx      # client; navigates to /kudos/new
│       ├── HighlightCarousel.tsx      # client; useHighlightKudos + arrows
│       ├── AllKudosFeed.tsx           # client; useInfiniteQuery
│       ├── SpotlightBoard.tsx         # client; d3-cloud + canvas
│       └── KudosSidebar.tsx           # server (composed from sub-organisms)
└── molecules/
    └── kudos-board/
        ├── KudoCard.tsx               # variant: highlight | feed
        ├── HeartButton.tsx
        ├── HashtagChip.tsx
        ├── FilterDropdown.tsx
        ├── UserChip.tsx               # avatar + name + team + hover popover
        ├── CarouselArrows.tsx
        ├── PageIndicator.tsx
        ├── KudoCopyLinkButton.tsx
        ├── SunnerLeaderboardRow.tsx
        ├── SidebarStatRow.tsx
        └── SunnerSearch.tsx
└── atoms/
    └── KudoBoardIcons.tsx             # Heart (active/inactive), CopyLink, Pencil (capture), PanZoom

lib/
├── kudos/
│   ├── types.ts                       # EXTENDED with Kudo, KudoLike, KudoImage, SpecialDay
│   ├── schemas.ts                     # Zod (new)
│   ├── server/
│   │   ├── feed.ts                    # repository: list, highlight, spotlight, hashtags, departments
│   │   ├── likes.ts                   # repository: addLike, removeLike (with special-day calc)
│   │   ├── stats.ts                   # repository: user stats + leaderboards
│   │   └── secret-boxes.ts            # repository: next unopened
│   ├── queries/                       # client-side TanStack Query hooks
│   │   ├── useKudosFeed.ts
│   │   ├── useHighlightKudos.ts
│   │   ├── useSpotlight.ts
│   │   ├── useUserStats.ts
│   │   ├── useLikeKudo.ts
│   │   └── useHashtagsAndDepartments.ts
│   └── mock.ts                        # KEEP as-is for the Viết Kudo screen
└── query/
    └── client.ts                      # singleton QueryClient + provider (NEW)

messages/
├── vi.json                            # add `kudos.live.*` keys
├── en.json                            # add `kudos.live.*` keys
└── ja.json                            # add `kudos.live.*` keys

# Backend
supabase/migrations/
├── 20260520000001_kudos_core.sql      # kudos, kudo_images, kudo_hashtags
├── 20260520000002_kudo_likes.sql      # kudo_likes table + unique (user, kudo) + RLS
├── 20260520000003_special_days.sql    # admin-configured days
├── 20260520000004_secret_boxes.sql    # secret_boxes
└── 20260520000005_kudo_views.sql      # kudo_with_aggregates, user_kudo_stats, kudo_spotlight

# Tests
tests/
├── unit/components/kudos-board/
│   ├── KudoCard.test.tsx
│   ├── HeartButton.test.tsx
│   ├── FilterDropdown.test.tsx
│   ├── HighlightCarousel.test.tsx
│   ├── SpotlightBoard.test.tsx
│   ├── KudosSidebar.test.tsx
│   └── QuickCaptureInput.test.tsx
├── integration/api/kudos/
│   ├── feed.test.ts                   # contract: GET /api/kudos
│   ├── highlight.test.ts
│   ├── like.test.ts                   # POST + DELETE happy path + sender-self-like rejection
│   ├── spotlight.test.ts
│   └── stats.test.ts
└── e2e/
    └── kudos-live-board.spec.ts       # browse feed, like, filter, paginate, anonymous gating
```

### Dependencies

| Package                 | Version  | Purpose                                                             |
| ----------------------- | -------- | ------------------------------------------------------------------- |
| `@tanstack/react-query` | `^5.x`   | Client-side caching, mutation rollback, infinite query for the feed |
| `d3-cloud`              | `^1.2.x` | Word-cloud layout calculation for SPOTLIGHT                         |

Both deps are justified in the _Constitution Compliance Check_ table above.

---

## Implementation Strategy

The slices below are vertical. Each phase ends with green tests and a viable demo.

### Phase 0 — Setup & asset preparation

0. Add the two new dependencies (`@tanstack/react-query`, `d3-cloud`) and the `QueryClient`
   provider in `app/layout.tsx` (server) → wraps client tree.
1. Download the screen's Figma media (heart icon active / inactive, pencil capture icon,
   search icon, chevron arrows, pan-zoom icon) via `get_media_files` into
   `public/assets/kudos/`. Audit pixel dimensions per the implement-ui skill rules.
2. Add the new `messages/{vi,en,ja}.json` keys (`kudos.live.*`) — even with empty values
   initially so component code references stable keys from line 1.

### Phase 1 — Foundation (Schema, RLS, Services)

_Red → green sequence per migration._

3. **DB**: Author migrations `kudos_core`, `kudo_likes`, `special_days`, `secret_boxes`,
   `kudo_views`. Indexes: `(created_at DESC, id)` on kudos, `(kudo_id, user_id)` unique on
   kudo_likes, `(recipient_id)` on kudos. RLS policies:
   - `kudos`: SELECT for anon + auth; INSERT for auth (sender = caller); UPDATE / DELETE
     restricted to sender or admin.
   - `kudo_likes`: SELECT for auth; INSERT for auth with `user_id = caller AND kudo.sender_id <> caller`;
     DELETE for caller's own row.
   - `secret_boxes`: SELECT / UPDATE for owner only.
   - `special_days`: SELECT for all; INSERT / UPDATE / DELETE for admin only.
4. **Server services**: `lib/kudos/server/{feed,likes,stats,secret-boxes}.ts`. Each method has
   a Vitest unit test that hits a Supabase test schema (per constitution: real DB, never mocks
   - mocks mixed). The like service contains the special-day multiplier logic.

### Phase 2 — User Story 1 (P1): view the live feed

_End-to-end slice: DB → API → UI → E2E._

5. **API route** `app/api/kudos/route.ts` with Zod-validated query string and a contract test
   in `app/api/kudos/route.test.ts`.
6. **Server Component** `app/kudos/page.tsx`: fetch first page of feed + HIGHLIGHT + sidebar
   data on the server, render organisms with `<Suspense>` per region.
7. **Organisms**:
   - `KudoBannerHero` (no state)
   - `QuickCaptureInput` (client; click handler → `router.push(ROUTES.KUDOS_NEW)`)
   - `HighlightCarousel` (client; arrows + `useHighlightKudos` for refetch)
   - `AllKudosFeed` (client; `useKudosFeedInfinite` for scroll-to-load)
   - `KudosSidebar` (server when anonymous; injected with `me` data when auth)
8. **Tests**:
   - Vitest: each organism renders with seeded data + empty state.
   - Vitest contract: `GET /api/kudos` returns the expected shape.
   - Playwright `kudos-live-board.spec.ts` — happy path: anonymous user can see hero +
     feed + empty sidebar; auth user sees sidebar stats.

### Phase 3 — User Story 2 (P1): quick-post navigation

9. Wire `QuickCaptureInput` to `/kudos/new`; verify behavior with both anonymous (redirect to
   login) and auth (focuses recipient combobox on Viết Kudo mount). Reuses Viết Kudo's
   existing recipient `useRef` focus convention; no Viết Kudo edits expected.
10. Playwright extension to the existing spec covers FR-013 anonymous redirect path.

### Phase 4 — User Story 3 (P1): likes

11. **API**: `app/api/kudos/[id]/like/route.ts` exporting `POST` and `DELETE`. Both validate
    auth (Supabase `getUser`), reject if caller is the kudo's sender, and consult
    `special_days` to compute the multiplier server-side.
12. **Mutation hook**: `useLikeKudo` (optimistic — flip heart + count locally, rollback on
    error via the existing `Toast`). Invalidate `["kudo", id]` + the feed query key on
    success.
13. **Component**: `HeartButton` — `aria-pressed`, `aria-disabled` when `isOwn`, debounced
    onClick.
14. **Tests**:
    - Vitest `HeartButton.test.tsx` — toggle, disabled-when-own, debounce.
    - Contract test `like.test.ts` — sender-self-like rejection, idempotency, double-like
      conflict (409).
    - Playwright: like then unlike round-trip with rollback on simulated 500.

### Phase 5 — User Story 4 (P2): filters

15. **API**: `GET /api/kudos/hashtags` + `GET /api/kudos/departments` (cached on the client).
    Extend `GET /api/kudos?hashtag=&team=` parsing.
16. **Component**: `FilterDropdown` (keyboard navigable). URL state via `useSearchParams`.
17. **Tests**: Vitest + Playwright (toggle filter, see carousel update, clear, see Top 5
    restore).

### Phase 6 — User Story 5 (P2): carousel navigation

18. **Component**: `CarouselArrows`, `PageIndicator`, `HighlightCarousel.tsx`. Prev/Next
    enabled / disabled states drive `aria-disabled`.
19. **Tests**: Vitest for arrow-state logic at boundaries; Playwright covers integration
    with filters from Phase 5.

### Phase 7 — User Story 6 (P2): infinite-scroll feed

20. **Hook**: `useKudosFeedInfinite` (TanStack `useInfiniteQuery`, cursor `created_at + id`).
21. **Component**: `AllKudosFeed` uses IntersectionObserver to trigger next page.
22. **Tests**: Vitest for `getNextPageParam` boundary; Playwright for scroll-to-bottom
    behaviour against a 20-row seed.

### Phase 8 — User Story 7 (P2): Spotlight

23. **API**: `GET /api/kudos/spotlight` returns `{ recipients: [{ userId, displayName,
kudosCount, lastReceivedAt }] }`.
24. **Component**: `SpotlightBoard` — `d3-cloud` for layout, `<canvas>` for render with a
    sibling `<ul role="list" class="sr-only">` for accessibility. `SunnerSearch` debounced
    200ms; clicking a node navigates to `/kudos/{lastKudoId}` (lastKudoId added to the
    response).
25. **Tests**: Vitest for layout pure-function fixtures + sr-only list rendering. Playwright
    skips the canvas pixel test but verifies the accessible list contains every recipient.

### Phase 9 — User Story 8 (P2): sidebar personal stats + leaderboards

26. **API**: `GET /api/users/me/stats`, `GET /api/users/me/leaderboard?type=`. Stats reuse
    the `user_kudo_stats` view.
27. **Components**: `KudosSidebar`, `SidebarStatRow`, `SunnerLeaderboardRow`. `Mở quà` button
    delegates to `app/api/secret-boxes/next-unopened` to fetch the next id, then opens a
    placeholder modal (modal itself is out of scope).
28. **Tests**: Vitest renders stats rows with empty / non-empty values. Playwright verifies
    the `Mở quà` disabled state when `unopenedSecretBoxes == 0`.

### Phase 10 — User Stories 9–11 (P3): copy link, detail nav, profile nav

29. **`KudoCopyLinkButton`**: existing `Toast` molecule; clipboard with fallback toast.
30. **Card click → detail**: navigate to `ROUTES.KUDO_DETAIL(id)` (`/kudos/{id}` — add the
    helper in `lib/routes.ts`).
31. **`UserChip` hover popover**: 300ms hover delay; Escape to close.
32. **Tests**: Vitest for `KudoCopyLinkButton` (clipboard mocked); Playwright for
    keyboard-navigable copy + popover open / close.

### Phase 11 — Secret Box trigger (US12)

33. Wire `D.1.8_Button mở quà` to a placeholder dialog (real Secret Box UI is out of scope).
    Disabled-state contract is fully tested here.

### Phase 12 — Polish & gates

34. Performance pass — Lighthouse + Core Web Vitals checks against TR-001 / TR-002 / TR-005.
35. Accessibility audit with `@axe-core/playwright`.
36. i18n sweep — make sure every key in `messages/vi.json` has a counterpart in `en` / `ja`.
37. Remove `app/kudos/page.tsx`'s ComingSoon import; final visual diff against the Figma
    frame.

### Risk Assessment

| Risk                                                                 | Probability | Impact | Mitigation                                                                                                                                                 |
| -------------------------------------------------------------------- | ----------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spotlight layout exceeds 60fps budget with 500+ recipients           | Medium      | Medium | Switch to canvas + virtualization early; benchmark with seeded fixtures at Phase 8.                                                                        |
| RLS oversight lets a viewer like a kudo authored by themselves       | Low         | High   | Defence-in-depth: row-level `WITH CHECK (sender_id <> auth.uid())` AND service-layer guard AND component disabled state. Contract test verifies all three. |
| Special-day multiplier drift between like POST and counter aggregate | Low         | Medium | Compute `delta` once at like-write time, store on `kudo_likes.delta_at_write`, aggregate by SUM(delta); see `kudo_views` migration.                        |
| Filter URL state and TanStack cache get out of sync                  | Low         | Medium | Single source of truth: derive the query key from `useSearchParams`. Tests cover back/forward navigation.                                                  |
| `next-intl` strings missing on `en` / `ja` cause runtime fallbacks   | Medium      | Low    | CI lint step that diffs the three locale files for missing keys (existing script — to confirm; if absent, add to Phase 0).                                 |
| Infinite scroll fires duplicate fetches at boundary                  | Medium      | Low    | IntersectionObserver `threshold: 0.1`, debounced by TanStack's in-flight dedupe. Vitest covers the boundary.                                               |

### Estimated Complexity

- **Frontend**: High (4 organisms with non-trivial interactivity, including a canvas
  word-cloud).
- **Backend**: Medium (5 tables with RLS, 9 endpoints, 3 views).
- **Testing**: Medium-High (RLS policy tests against a real Supabase test schema add real
  cost vs. mocks).

---

## Integration Testing Strategy

### Test Scope

- [x] **Component / Module interactions**: `KudoCard ↔ HeartButton ↔ useLikeKudo`,
      `HighlightCarousel ↔ FilterDropdown ↔ URL`, `AllKudosFeed ↔ IntersectionObserver`.
- [x] **External dependencies**: Supabase (auth + RLS + RPC views), `navigator.clipboard`
      (mocked in jsdom).
- [x] **Data layer**: New tables with RLS; the test suite runs as anon + as authenticated to
      catch policy gaps.
- [x] **User workflows**: view feed (anon + auth), like / unlike, filter, scroll-to-load,
      Spotlight search & click, quick capture → Viết Kudo, copy link.

### Test Categories

| Category           | Applicable? | Key Scenarios                                                                                    |
| ------------------ | ----------- | ------------------------------------------------------------------------------------------------ |
| UI ↔ Logic         | Yes         | Carousel state, infinite scroll boundary, optimistic like rollback.                              |
| Service ↔ Service  | Yes         | `lib/kudos/server/likes.ts` reads `special_days`; `users/me/stats` reads `user_kudo_stats` view. |
| App ↔ External API | No          | No third-party services in this slice.                                                           |
| App ↔ Data Layer   | Yes         | RLS policies tested under `anon` and `authenticated` Supabase roles.                             |
| Cross-platform     | Yes         | Responsive collapse to single column <1024px; touch-target sizes.                                |

### Test Environment

- **Environment**: Local dev — Vitest hits a Supabase test schema spun up via the existing
  test helper; Playwright runs against `next dev` with a seeded database.
- **Test data**: Factories under `tests/factories/kudo.ts` (TBD); seeds for happy-path and
  empty-state E2E runs.
- **Isolation**: Transaction-per-test for Vitest; cleanup-per-run for Playwright with a
  unique workspace prefix.

### Mocking Strategy

| Dependency             | Strategy           | Rationale                                                                              |
| ---------------------- | ------------------ | -------------------------------------------------------------------------------------- |
| Supabase               | Real (test schema) | Constitution §V — never mix real + mock styles in the same feature; matches Viết Kudo. |
| `navigator.clipboard`  | Mock               | Available only in secure contexts in jsdom; behaviour is trivial.                      |
| `IntersectionObserver` | Stub               | jsdom doesn't ship it; thin stub flips entries on demand.                              |
| `<canvas>` rendering   | Stub               | Spotlight is tested via its accessible list; the canvas pixel render is not asserted.  |

### Test Scenarios Outline

1. **Happy Path**
   - [ ] Authenticated user opens `/kudos`, sees HIGHLIGHT + ALL KUDOS + sidebar populated.
   - [ ] Authenticated user likes a kudo → red heart + count incremented.
   - [ ] Authenticated user filters by hashtag → carousel re-renders.
   - [ ] Authenticated user scrolls to bottom → next page appended.
   - [ ] Authenticated user types in Spotlight search → match highlighted.
2. **Error Handling**
   - [ ] Like API returns 500 → optimistic UI rolls back, toast surfaces.
   - [ ] Feed API returns 500 → previous page remains, retry toast.
   - [ ] Anonymous user clicks heart → redirected to `/login?redirectTo=/kudos`.
3. **Edge Cases**
   - [ ] Empty feed → empty-state copy.
   - [ ] Filter matches zero kudos → carousel empty state, arrows disabled.
   - [ ] User tries to like own kudo → rejected client + server.
   - [ ] Special day active → sender's `hearts_received` increments by 2.
   - [ ] Spotlight with 500 nodes → canvas still interactive, accessible list complete.

### Tooling & Framework

- **Vitest** (unit / integration / contract).
- **Playwright** (E2E, axe-core for a11y).
- **CI**: existing pipeline; add the migration test run to the `npm run test:db` step (if it
  doesn't exist, create it as part of Phase 1).

### Coverage Goals

| Area                       | Target                                       | Priority |
| -------------------------- | -------------------------------------------- | -------- |
| Like flow (UI + API + RLS) | 100% of scenarios in §Test Scenarios         | High     |
| Carousel state machine     | 100% boundary states                         | High     |
| Filter URL ↔ cache sync    | 100% of search-param permutations under test | Medium   |
| Spotlight layout           | Smoke + accessible-list completeness         | Medium   |
| Sidebar stats              | Happy path + empty + anonymous               | High     |

---

## Dependencies & Prerequisites

### Required Before Start

- [x] `constitution.md` reviewed.
- [x] `spec.md` approved (sibling file in this directory).
- [ ] `research.md` — skipped intentionally; the plan absorbs research inline. Revisit if any
      Phase-1 contract test surfaces unknown DB schema friction.
- [ ] API contracts defined — produced as part of Phase 1 in `api-docs.yaml` from
      `templates/api-docs-template.yaml`.
- [ ] Database migrations planned — listed above; SQL goes in Phase 1.
- [ ] `BACKEND_API_TESTCASES.md` — to be authored alongside the api-docs.

### External Dependencies

- Supabase project remains available (existing project; no new region / org).
- Google OAuth (existing setup) is the only auth flow.
- No third-party CDN or media service needed beyond Supabase Storage.

---

## Next Steps

After plan approval:

1. **Run** `momorph.tasks` to generate the phased task list (the phases above map 1:1 to
   task headings).
2. **Run** `momorph.database` (if the existing prompt covers schema generation) or hand-author
   the 5 migration files in Phase 1.
3. **Run** `momorph.apispecs` to populate `api-docs.yaml` + `BACKEND_API_TESTCASES.md`.
4. **Begin** implementation phase-by-phase, RED → GREEN → REFACTOR per constitution §V.

---

## Notes

- The 4-region screen is intentionally split across multiple organism files (constitution §I
  cap of ~250 LoC). Don't merge `KudoBannerHero` + `HighlightCarousel` even though the spec
  groups them visually.
- `KudoCard` ships as a single component with a `variant: 'highlight' | 'feed'` prop. The two
  variants differ only in line-clamp (3 vs 5) and presence of the gallery row — small enough
  that a single component is cheaper than two.
- The QueryClient singleton goes in `lib/query/client.ts` and is consumed by a `<Providers>`
  client component imported into `app/layout.tsx`. Future screens will share the same
  client.
- Once SpotlightBoard ships, consider extracting `useDebouncedValue` to `lib/hooks/` — the
  same hook is also useful for the Viết Kudo recipient combobox (currently in-component).
  Refactoring is out of scope for this PR.
