# Implementation Plan: Hệ thống giải / Awards Information

**Frame**: `zFYDgyj_pD-he-thong-giai`
**Date**: 2026-05-14
**Spec**: `specs/zFYDgyj_pD-he-thong-giai/spec.md`
**Research**: `specs/zFYDgyj_pD-he-thong-giai/research.md`
**Status**: Draft

---

## Resolved during `reviewspecify` (2026-05-14)

These decisions are locked and inform the plan:

1. **Page route** = `/awards` (consistent with Homepage SAA's `awardDeepLink()` and the existing placeholder at `app/awards/page.tsx`).
2. **Unit labels** keep Vietnamese strings ("Đơn vị" / "Tập thể" / "Cá nhân") for **both** `vi` and `en` locales — Sun\* internal categorisation labels, no translation needed.
3. **Currency** stays "X.XXX.XXX VNĐ" for **both** locales — event is in Vietnam, prizes paid in VNĐ; no USD conversion.
4. **Authentication** — page is auth-only per Test ID-1; `isProtectedPath('/awards')` is added in middleware.

---

## Summary

Replace the existing `Coming soon` placeholder at [app/awards/page.tsx](app/awards/page.tsx) with the full **Hệ thống giải / Awards Information** screen:

- **Top**: shared `HomepageHeader` (dark theme) + keyvisual banner + page title block.
- **Body**: 2-column layout — sticky sidebar (6 navigation items) + content list (6 award detail cards).
- **Bottom**: existing `KudosPromoSection` + `AppFooter variant="homepage"`.

The page is a **Server Component**. All award content is bundled static data — a new `lib/awards/details.ts` extends the existing `lib/awards/config.ts` with the per-award metadata (long description, quantity, unit, value). No new API endpoints are needed.

The **only client island** is `AwardsSidebarNav` — it handles smooth-scroll click + scrollspy via `IntersectionObserver` + active-state synchronisation with the URL hash.

The page is **authenticated-only** (Test ID-1). Middleware adds `/awards` to `isProtectedPath()`, redirecting anonymous visitors to `/login?redirectTo=/awards{hash}`.

---

## Technical Context

| Concern              | Decision                                                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Language/Framework   | TypeScript 5 (strict) on Next.js 16 (App Router) + React 19 + Tailwind 4                                                                                                                    |
| Primary Dependencies | `@supabase/ssr`, `next-intl`, `zod` (all already installed) — **no new packages**                                                                                                           |
| Database             | None — page is fully static. No migrations.                                                                                                                                                 |
| Testing              | Vitest (unit + integration) + Playwright (E2E)                                                                                                                                              |
| State Management     | Server Components for data; one Client Component for sidebar scrollspy + URL hash sync                                                                                                      |
| API Style            | None — no new endpoints. Reuses Homepage SAA's `getCurrentUserProfile` / `getUnreadCount` for the shared header.                                                                            |
| i18n                 | `next-intl` — extend `messages/{vi,en}.json` with the new `awardsPage.*` keys (long descriptions + page title). Unit + currency strings are SHARED across both locales (resolved decision). |

---

## Constitution Compliance Check

_GATE: Must pass before implementation can begin._

- [x] **§I Clean Code** — Each new component has one responsibility; files target ≤250 LoC; ESLint clean; no `any`, no `@ts-ignore`, no non-null assertions.
- [x] **§II Tech Stack Best Practices** — Page is a Server Component; only `AwardsSidebarNav` carries `'use client'`. All `href` values are derived from `lib/routes.ts` and `awards.config.ts` (no guessing). Tailwind utilities + design tokens; no hard-coded colours or pixels.
- [x] **§III Responsive Web UI & Accessibility** — WCAG 2.1 AA: `<nav aria-label="Awards categories">`, `aria-current="location"` on active sidebar item, `<section id={slug}>` anchors for each card, focus moves to section heading after scroll, `prefers-reduced-motion` respected. Sidebar collapses on narrow viewports.
- [x] **§IV OWASP Secure Coding** — `/awards` becomes a protected path (middleware redirect for anonymous). No user input → no Zod schemas needed at trust boundary. Static content has no SQL/HTML injection vector. CSP unchanged.
- [x] **§V TDD (Non-negotiable)** — Each task in `tasks.md` is RED → GREEN → REFACTOR. Vitest tests live next to code; E2E covers all 5 user stories.

### Violations / Deviations (justified)

| Deviation                                                                                                                                                                                                                                                                                                                                  | Spec reference            | Justification                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- | ---------------------------------------------------------------------------- |
| Spec mentions `lib/awards/details.ts` AND `awardsPage.*` i18n keys. The Plan keeps **`unit` + `value`** strings inline on `AwardDetail` (not i18n-keyed) because the resolved decision keeps both Vietnamese for both locales. The long description and page title still live in `messages/{vi,en}.json` because those WILL be translated. | spec → Resolved Decisions | Reduces i18n surface; keeps locale-independent strings out of the catalogue. |

---

## Architecture Decisions

### Frontend Approach

- **Component structure**: extend the existing atomic structure under `components/`. New homepage-scoped components live under `components/organisms/awards/` (mirrors `components/organisms/homepage/` from Homepage SAA).
- **Styling**: Tailwind 4 utilities + existing CSS variables in `app/globals.css`. No new design tokens needed at plan time — implementer may add at most one new shadow/border token if Figma reveals a unique surface style for the sticky sidebar.
- **Data fetching**: Server Component composition. `app/awards/page.tsx` fetches `user` + `unreadCount` + `locale` (parallel via `Promise.all`) for the header; the rest is bundled static data from `lib/awards/{config,details}.ts`.
- **Client islands**: ONE interactive widget — `AwardsSidebarNav` (sticky nav + scrollspy + URL hash sync via `IntersectionObserver` and `history.replaceState`). Its presentational child `AwardsSidebarItem` carries no `'use client'` directive but is implicitly bundled client-side when the parent imports it.

### Backend Approach

- **No new endpoints**. No new Server Actions. No new Route Handlers. No DB migrations.
- **Middleware update**: add `/awards` to `isProtectedPath()` so anonymous visitors are redirected to `/login?redirectTo=/awards{hash}`.

### Integration Points

- **Reuse from Homepage SAA**:
  - [components/organisms/homepage/HomepageHeader.tsx](components/organisms/homepage/HomepageHeader.tsx) — same shared header (dark theme).
  - [components/organisms/homepage/KudosPromoSection.tsx](components/organisms/homepage/KudosPromoSection.tsx) — same promo block.
  - [components/organisms/AppFooter.tsx](components/organisms/AppFooter.tsx) `variant="homepage"`.
  - [lib/awards/config.ts](lib/awards/config.ts) + [lib/awards/types.ts](lib/awards/types.ts) — extend with `AwardDetail`.
  - [lib/users/actions.ts](lib/users/actions.ts) — `getCurrentUserProfile()` already handles fallback when DB row is missing.
  - [lib/notifications/actions.ts](lib/notifications/actions.ts) — stubbed (returns 0 / `[]`).
  - [lib/routes.ts](lib/routes.ts) — `ROUTES.AWARDS = '/awards'` already exists; `awardDeepLink(slug)` already returns `/awards#{slug}`.
- **New components**: `KeyvisualBanner`, `AwardsPageTitle`, `AwardsSidebarNav`, `AwardsSidebarItem`, `AwardsContentList`, `AwardDetailCard`.

---

## Spec Coverage Trace

Every spec requirement maps to a plan phase + step. Used by `momorph.tasks` to enumerate tasks 1-to-1.

| Spec ref                                  | Phase | Step  | Test coverage                                                                                              |
| ----------------------------------------- | ----- | ----- | ---------------------------------------------------------------------------------------------------------- |
| US1 (Browse 6 award categories, P1)       | 2     | 5–9   | `AwardDetailCard.test` + `AwardsContentList.test` + E2E US1                                                |
| US2 (Sidebar jump, P1)                    | 2     | 10–11 | `AwardsSidebarNav.test` + E2E US2                                                                          |
| US3 (Deep-link from Homepage, P1)         | 2     | 11    | `AwardsSidebarNav.test` (hash on mount) + E2E US3                                                          |
| US4 (Kudos promo, P2)                     | 2     | 12    | Reuses existing `KudosPromoSection.test`; no new test                                                      |
| US5 (Shared chrome, P2)                   | 2     | 12    | Reuses existing `HomepageHeader.test` + `AppFooter.test`                                                   |
| FR-001 Page composition                   | 2     | 12    | `homepage-awards-page.test.tsx` (integration)                                                              |
| FR-002 Decorative keyvisual               | 2     | 7     | `KeyvisualBanner.test`                                                                                     |
| FR-003 Title + caption                    | 2     | 8     | `AwardsPageTitle.test`                                                                                     |
| FR-004 Auth gating                        | 0     | 2     | `tests/integration/middleware-public-home.test.ts` (extended with an "`/awards` protected" describe block) |
| FR-005..FR-007 Sidebar nav                | 2     | 10–11 | `AwardsSidebarNav.test` (order + click + active state)                                                     |
| FR-008 Scrollspy                          | 2     | 11    | `AwardsSidebarNav.test` (IntersectionObserver mock)                                                        |
| FR-009 Single active                      | 2     | 11    | `AwardsSidebarNav.test`                                                                                    |
| FR-010 Hover                              | 2     | 10    | `AwardsSidebarItem.test`                                                                                   |
| FR-011 Reduced motion                     | 2     | 11    | `AwardsSidebarNav.test` (matchMedia mock)                                                                  |
| FR-012 6 detail cards in order            | 1, 2  | 5, 9  | `lib/awards/details.test.ts` + `AwardsContentList.test`                                                    |
| FR-013 Card content fields                | 2     | 9     | `AwardDetailCard.test`                                                                                     |
| FR-014 Anchor `<section id>`              | 2     | 9     | `AwardDetailCard.test`                                                                                     |
| FR-015 Hash on mount → scroll + active    | 2     | 11    | `AwardsSidebarNav.test` (initial hash)                                                                     |
| FR-016 Unknown hash → first active        | 2     | 11    | `AwardsSidebarNav.test` (Test ID-13)                                                                       |
| FR-017 `history.replaceState`             | 2     | 11    | `AwardsSidebarNav.test` (jsdom spy)                                                                        |
| FR-018 Kudos promo render                 | 2     | 12    | Existing `KudosPromoSection.test`                                                                          |
| FR-019 Kudos CTA → /kudos                 | 2     | 12    | Existing test                                                                                              |
| FR-020 Header reuse                       | 2     | 12    | Existing `HomepageHeader.test`                                                                             |
| FR-021 Footer reuse                       | 2     | 12    | Existing `AppFooter.test`                                                                                  |
| TR-001 Server Component                   | 2     | 12    | Integration test (no `'use client'` at page level)                                                         |
| TR-002 Slug single source                 | 1     | 5     | `lib/awards/details.test.ts` (every detail slug exists in config)                                          |
| TR-003 i18n long description / title only | 1     | 3     | Existing `messages-parity.test.ts` automatically picks up new keys (no test change needed)                 |
| TR-004 Sidebar is `'use client'`          | 2     | 11    | Code review + lint rule (`'use client'` directive present)                                                 |
| TR-005 Middleware protected               | 0     | 2     | `tests/integration/middleware-public-home.test.ts` (same extended block as FR-004)                         |
| TR-006 Keyboard a11y                      | 2     | 10–11 | `AwardsSidebarNav.test` (Tab + Enter)                                                                      |
| TR-007 Web Vitals                         | 3     | 14    | Manual Lighthouse at hand-off                                                                              |

---

## Project Structure

### Documentation (this feature)

```text
.momorph/specs/zFYDgyj_pD-he-thong-giai/
├── spec.md         # already reviewed
├── plan.md         # this file
├── research.md     # companion (see file)
└── tasks.md        # produced by momorph.tasks (next)
```

### Source Code (affected areas)

**New files:**

```text
# Awards detail catalogue (extends existing awards module)
lib/awards/
├── details.ts                # 6-entry AwardDetail record keyed by slug
└── details.test.ts           # shape + slug parity test

# UI organisms (page-scoped)
components/organisms/awards/
├── KeyvisualBanner.tsx       # Server Component — decorative banner
├── AwardsPageTitle.tsx       # Server Component — caption + main heading
├── AwardsContentList.tsx     # Server Component — wraps 6 AwardDetailCards
├── AwardDetailCard.tsx       # Server Component — single award block
├── AwardsSidebarItem.tsx     # Presentational atom — no `'use client'` directive
└── AwardsSidebarNav.tsx      # 'use client' — sticky nav + scrollspy + URL hash sync

# Tests
tests/unit/components/
├── KeyvisualBanner.test.tsx
├── AwardsPageTitle.test.tsx
├── AwardsContentList.test.tsx
├── AwardDetailCard.test.tsx
├── AwardsSidebarItem.test.tsx       # render-only — props → DOM (href, aria-current, hover class)
└── AwardsSidebarNav.test.tsx         # interactive — click + initial hash + IO mock + reduced motion
# (lib/awards/details.test.ts lives next to its source file)

tests/integration/
├── awards-page-anonymous.test.ts   # middleware redirects to /login
└── awards-page-authenticated.test.tsx  # full SSR snapshot

tests/e2e/
└── awards.spec.ts                  # US1–US5 + axe sweep

# Public assets (downloaded via momorph.implement Phase 0)
public/assets/awards/
└── images/
    ├── keyvisual-banner.png            # NEW — keyvisual artwork at top
    └── detail/
        ├── top-talent.png              # NEW per-award detail image (336×336)
        ├── top-project.png
        ├── top-project-leader.png
        ├── best-manager.png
        ├── signature-2025-creator.png
        └── mvp.png
```

**Modified files:**

| File                                               | Change                                                                                                                                                                                                                                                                                         |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/awards/page.tsx`                              | Replace `<ComingSoon>` placeholder with the full page composition (Server Component)                                                                                                                                                                                                           |
| `middleware.ts`                                    | Add `/awards` to `isProtectedPath()` so anonymous traffic redirects to `/login?redirectTo=/awards{hash}`                                                                                                                                                                                       |
| `lib/awards/types.ts`                              | Add `AwardDetail` interface (`{ slug; longDescriptionKey; quantity; unit; value }`)                                                                                                                                                                                                            |
| `messages/vi.json`                                 | Add `awardsPage.*` key tree: `pageTitle`, `pageCaption`, `quantityLabel`, `valueLabel`, `perAwardSuffix`, and per-award `longDescription` × 6                                                                                                                                                  |
| `messages/en.json`                                 | Mirror the same key tree (parity) with English translations of `pageTitle` + `pageCaption` + 6 `longDescription`s; `unit` + `value` + quantity-suffix strings remain Vietnamese-only since they ARE the same content per resolved decision                                                     |
| `tests/integration/middleware-public-home.test.ts` | Extend with a `describe("/awards protection")` block asserting anonymous `GET /awards` returns a redirect to `/login?redirectTo=/awards{hash}` (counterpart to the existing `/` public-home case).                                                                                             |
| `tests/setup.ts`                                   | Add stubs for `IntersectionObserver` (no-op `observe()`/`disconnect()`) and `window.matchMedia` (returns a minimal `MediaQueryList` with `matches: false` + `addEventListener`/`removeEventListener` no-ops). Required by `AwardsSidebarNav.test`; reused by any future scrollspy-style tests. |
| `.env.local.example`                               | No change                                                                                                                                                                                                                                                                                      |
| `README.md`                                        | Append a one-liner pointing to the new awards page under "Homepage SAA — operational notes"                                                                                                                                                                                                    |

### Dependencies

**No new runtime or dev dependencies.** Native browser APIs cover everything:

- `IntersectionObserver` — scrollspy (well-supported in all evergreen browsers).
- `element.scrollIntoView({behavior})` — smooth scroll.
- `window.history.replaceState()` — URL hash sync without history-stack pollution.
- `window.matchMedia('(prefers-reduced-motion: reduce)')` — motion preference.

---

## Implementation Strategy

### Phase 0 — Asset prep + middleware

1. **Download 7 assets** via `get_media_files` MCP tool:
   - Keyvisual banner image (`313:8437` GROUP → `image 20` `2167:5138`).
   - 6 per-award detail images (`D.1.1` × 6).
     Save under `public/assets/awards/`.
2. **Middleware**: add `/awards` to `isProtectedPath()`. Update [middleware.ts](middleware.ts) and add a test asserting anonymous `/awards` → redirect to `/login?redirectTo=/awards`.

### Phase 1 — Foundation

3. **i18n key tree** (vi + en):
   - `awardsPage.pageCaption` = "Sun\* Annual Awards 2025"
   - `awardsPage.pageTitle` = "Hệ thống giải thưởng SAA 2025" / "SAA 2025 Awards System"
   - `awardsPage.quantityLabel` = "Số lượng giải thưởng:" / "Quantity:"
   - `awardsPage.valueLabel` = "Giá trị giải thưởng:" / "Prize value:"
   - `awardsPage.perAwardSuffix` = "(cho mỗi giải thưởng)" / "(per award)"
   - `awardsPage.signature2025.individualPrefix` = "5.000.000 VNĐ (cá nhân)" — SHARED VN string for both locales
   - `awardsPage.signature2025.teamPrefix` = "8.000.000 VNĐ (tập thể)" — same
   - `awardsPage.awards.{slug}.longDescription` × 6 — per-award description paragraph (full Vietnamese in `vi`; localised English in `en`)
4. **`AwardDetail` interface** in [lib/awards/types.ts](lib/awards/types.ts):
   ```ts
   export interface AwardDetail {
     readonly slug: string;
     readonly longDescriptionKey: string; // i18n key
     readonly quantity: string; // pre-padded e.g. "10", "02", "03", "01"
     readonly unit: string; // raw VN — "Đơn vị" / "Tập thể" / "Cá nhân" / "" for Signature/MVP
     readonly value: string; // raw VN — "7.000.000 VNĐ", "5.000.000 VNĐ / 8.000.000 VNĐ", etc.
     readonly detailImage: string; // /assets/awards/detail/{slug}.png
   }
   ```
5. **Awards detail catalogue** at `lib/awards/details.ts`:
   ```ts
   export const awardDetails: Record<string, AwardDetail> = {
     'top-talent':            { quantity: '10', unit: 'Đơn vị',  value: '7.000.000 VNĐ',  …},
     'top-project':           { quantity: '02', unit: 'Tập thể', value: '15.000.000 VNĐ', …},
     'top-project-leader':    { quantity: '03', unit: 'Cá nhân', value: '7.000.000 VNĐ',  …},
     'best-manager':          { quantity: '01', unit: 'Cá nhân', value: '10.000.000 VNĐ', …},
     'signature-2025-creator':{ quantity: '01', unit: '',         value: '5.000.000 VNĐ (cá nhân) / 8.000.000 VNĐ (tập thể)', …},
     'mvp':                   { quantity: '01', unit: '',         value: '15.000.000 VNĐ', …},
   } as const;
   ```
   Test: every key matches a slug in `awards.config.ts`; every `longDescriptionKey` resolves in vi + en; every `detailImage` file exists on disk.
6. **Update `lib/awards/types.ts` tests** to cover the new interface shape.

### Phase 2 — User stories (US1–US5)

7. **`KeyvisualBanner`** organism — Server Component. Renders the decorative banner image with `aria-hidden`. Behavior-only test: image renders, no interactive descendants.
8. **`AwardsPageTitle`** organism — Server Component. Renders caption + heading from i18n. Test: localized strings render; `<h1>` semantic heading present.
9. **`AwardDetailCard`** organism — Server Component, one prop `{ award, detail }`. Renders:
   - `<section id={slug} aria-labelledby="{slug}-heading">`
   - `<Image>` with `alt=""` (decorative; title is below)
   - `<h2 id="{slug}-heading">` from `t(award.titleKey)`
   - `<p>` long description from `t(detail.longDescriptionKey)`
   - Quantity row: `t('awardsPage.quantityLabel')` + `{detail.quantity}` + `{detail.unit}`
   - Value row: `t('awardsPage.valueLabel')` + `{detail.value}` (+ `t('awardsPage.perAwardSuffix')` when applicable)
     Tests: render with each of the 6 awards; assert section id matches slug; assert all i18n keys resolved.
10. **`AwardsSidebarItem`** atom (presentational; **no `'use client'` directive needed**) — single `<a href="#{slug}">` with `aria-current` toggled by an `isActive` prop. Since it uses no hooks, Next.js transparently bundles it into the client tree when `AwardsSidebarNav` imports it. Tests: render assertions only — `href` matches `#{slug}`, `aria-current` reflects the `isActive` prop, hover class present.
11. **`AwardsSidebarNav`** molecule (`'use client'`) — the only interactive client component:
    - `useState<string>` for `activeSlug`, initialised from `window.location.hash` (with `'top-talent'` fallback).
    - On mount: `IntersectionObserver` watching each `<section id={slug}>`; the section closest to the top of the viewport sets `activeSlug`.
    - On click: prevent default, call `el.scrollIntoView({behavior: prefersReducedMotion ? 'instant' : 'smooth'})`, set `activeSlug`, `history.replaceState(null, '', '#{slug}')`.
    - Suppress scrollspy updates during programmatic scroll (250 ms guard) to avoid the click-vs-scroll race.
      Tests (with `IntersectionObserver` mock + jsdom):
    - 6 items in order from `awards.config.ts`.
    - Click `'mvp'` → `activeSlug = 'mvp'`, `replaceState` called with `'#mvp'`.
    - Initial hash `'#mvp'` → `activeSlug = 'mvp'`.
    - Initial hash `'#unknown'` → `activeSlug = 'top-talent'` (Test ID-13).
    - `prefers-reduced-motion: reduce` → `scrollIntoView` called with `'instant'`.
12. **`AwardsContentList`** organism — Server Component. Iterates `awards.config.ts`, renders 6 `<AwardDetailCard>` in order. Tests: 6 sections rendered, correct order, each section has matching id.
13. **Page composition** at `app/awards/page.tsx`:
    ```tsx
    export default async function AwardsPage() {
      const [user, unreadCount, rawLocale] = await Promise.all([
        getCurrentUserProfile(),
        getUnreadCount(),
        getLocale(),
      ]);
      const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
      return (
        <>
          <HomepageHeader user={user} unreadCount={unreadCount} locale={locale} />
          <div className="bg-hero-background text-hero-foreground">
            <KeyvisualBanner />
            <AwardsPageTitle />
            <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-6 py-12 md:px-10 lg:grid-cols-[240px_1fr] lg:px-16">
              <AwardsSidebarNav />
              <AwardsContentList />
            </section>
            <KudosPromoSection />
            <AppFooter variant="homepage" />
          </div>
        </>
      );
    }
    ```
    Replaces the existing `Coming soon` placeholder. Integration tests: anonymous SSR (`/awards`) redirects via middleware; authenticated SSR renders the full page with 6 sections.

### Phase 3 — Polish & cross-cutting

14. **E2E suite** at `tests/e2e/awards.spec.ts`:
    - Auth fixture signs in a regular user, navigates to `/awards#mvp`, asserts MVP section in view + sidebar active.
    - Click each sidebar item, assert smooth scroll + active state update.
    - Anonymous navigation to `/awards` → redirected to `/login`.
    - `axe-core/playwright` AA scan returns zero violations.
15. **i18n parity** — extend `messages-parity.test.ts` to assert the new `awardsPage.*` keys exist in both vi and en.
16. **README update** — one-liner under "Homepage SAA — operational notes" pointing to the awards detail page.
17. **SCREENFLOW.md** — flip Hệ thống giải status from `discovered` → `implemented`, update Discovery Log.

### Risk Assessment

| Risk                                                                                              | Probability | Impact | Mitigation                                                                                                                                   |
| ------------------------------------------------------------------------------------------------- | ----------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Sidebar scrollspy fights with click-initiated smooth scroll → jittery active state                | High        | Medium | 250 ms guard flag (`isProgrammaticScroll`) suppresses scrollspy updates during click-driven scroll                                           |
| `IntersectionObserver` unavailable in jsdom for unit tests                                        | High        | Medium | Mock `IntersectionObserver` in test setup; the production path uses native browser API                                                       |
| Slug parity drift between `lib/awards/config.ts` and `lib/awards/details.ts`                      | Medium      | High   | Build-time test enforces every config slug has a matching detail entry and vice versa                                                        |
| Anonymous fallback when `getCurrentUserProfile` returns null after middleware should have blocked | Low         | Low    | Middleware always gates the page; if `getCurrentUserProfile` does return null here, the header degrades gracefully — page body still renders |
| Layout jumps when sidebar becomes sticky on desktop vs. inline on mobile                          | Medium      | Low    | Use `position: sticky` only inside `lg:` viewport; reserve no extra space on mobile (sidebar renders inline)                                 |
| Long Vietnamese descriptions overflow on mobile                                                   | Low         | Low    | Descriptions wrap naturally; no truncation; visual review at implementation time                                                             |
| Currency strings drift between cards                                                              | Low         | Medium | All strings live in one `lib/awards/details.ts` file; reviewed in code review                                                                |

### Estimated Complexity

- **Frontend**: Medium — 5 new components, but most are presentational. The `AwardsSidebarNav` client island is the only complex piece (IntersectionObserver + URL hash + scrollspy guard).
- **Backend**: None.
- **Testing**: Medium — IntersectionObserver mocks are the only non-trivial test setup; everything else is straightforward.

---

## Integration Testing Strategy

### Test Scope

- [x] **Component/Module interactions**: AwardsSidebarNav ↔ AwardsContentList (via DOM section IDs); page composition ↔ shared header/footer; middleware ↔ session.
- [x] **External dependencies**: Supabase Auth (session check) for middleware.
- [x] **Data layer**: None (static).
- [x] **User workflows**: Anonymous → redirect; authenticated → browse + sidebar jump + Kudos CTA; deep-link from Homepage SAA → land on correct section.

### Test Categories

| Category           | Applicable? | Key Scenarios                                               |
| ------------------ | ----------- | ----------------------------------------------------------- |
| UI ↔ Logic         | Yes         | Sidebar click → scroll + URL hash; scrollspy → active state |
| Service ↔ Service  | Yes         | Middleware ↔ Supabase Auth (anonymous redirect path)        |
| App ↔ External API | No          | None                                                        |
| App ↔ Data Layer   | No          | Static content only                                         |
| Cross-platform     | Yes         | Sidebar collapse on mobile; sticky on desktop               |

### Test Environment

- Local Supabase via `npm run supabase:start` for the auth-protected middleware test.
- Vitest jsdom for unit + integration; Playwright Chromium for E2E.
- IntersectionObserver + matchMedia mocks in `tests/setup.ts`.

### Mocking Strategy

| Dependency Type        | Strategy                                                   | Rationale            |
| ---------------------- | ---------------------------------------------------------- | -------------------- |
| Supabase client (unit) | Mock via `vi.mock('@/lib/supabase/server')`                | Avoid network        |
| IntersectionObserver   | Polyfill stub in `tests/setup.ts`                          | Required by jsdom    |
| `matchMedia`           | Polyfill stub in `tests/setup.ts`                          | Required by jsdom    |
| Window history         | jsdom default + `vi.spyOn(window.history, 'replaceState')` | Verify URL hash sync |
| Server Actions         | Real (run them; pure once mocks are in place)              | High-fidelity test   |

### Test Scenarios Outline

1. **Happy Path**
   - [ ] Authenticated user loads `/awards` → 6 cards rendered in order, sidebar shows 6 items, Top Talent active.
   - [ ] Click "MVP" sidebar item → smooth scroll → MVP section in view → sidebar shows MVP active → URL hash = `#mvp`.
   - [ ] Authenticated user lands on `/awards#mvp` → MVP section is in view on mount, MVP sidebar item active.

2. **Error Handling**
   - [ ] Anonymous visitor → `/awards` redirects to `/login?redirectTo=/awards`.
   - [ ] Anonymous visitor → `/awards#mvp` redirects to `/login?redirectTo=/awards#mvp`.
   - [ ] Authenticated user lands on `/awards#unknown-slug` → no JS error, Top Talent active, no scroll (Test ID-13).
   - [ ] Authenticated user clicks Kudos "Chi tiết" → navigates to `/kudos` (existing placeholder).

3. **Edge Cases**
   - [ ] `prefers-reduced-motion: reduce` → sidebar scroll is instant.
   - [ ] Keyboard Tab + Enter on sidebar item triggers the same click behavior.
   - [ ] Locale switched mid-page → page re-renders with new long descriptions; sidebar slugs unchanged.

### Tooling & Framework

- Vitest (unit + integration), Playwright (E2E), `@axe-core/playwright`.

### Coverage Goals

| Area                            | Target                                                                 | Priority |
| ------------------------------- | ---------------------------------------------------------------------- | -------- |
| Core user flows (US1, US2, US3) | 100% of acceptance scenarios mapped to ≥1 automated test               | High     |
| Sidebar interactions            | 100% branch coverage (click, hash mount, unknown slug, reduced motion) | High     |
| Middleware protection           | Anonymous + authenticated path                                         | High     |
| UI components                   | ≥85% line                                                              | Medium   |

---

## Dependencies & Prerequisites

### Required Before Start

- [x] `.momorph/constitution.md` reviewed.
- [x] `spec.md` approved (post-`reviewspecify`).
- [x] SCREENFLOW.md current.
- [x] Screen-spec for Hệ thống giải exists (`.momorph/contexts/screen_specs/he-thong-giai.md`).
- [x] Homepage SAA's foundation shipped — `HomepageHeader`, `KudosPromoSection`, `AppFooter variant="homepage"`, `lib/awards/{config,types}.ts`, `lib/routes.ts`, `lib/users/actions.ts`, `lib/notifications/actions.ts`, `awardDeepLink()`.
- [ ] `research.md` written (companion — see file).
- [ ] Per-award detail images downloaded from Figma (Phase 0).

### External Dependencies

- Supabase local dev environment (already in place).
- Figma MCP access to download keyvisual + 6 detail images.

---

## Open Questions

> Most spec-level ambiguities were resolved during `reviewspecify`. The remaining items are tactical and resolved during `momorph.tasks` / implementation.

- [ ] **Sticky-sidebar breakpoint**: `lg:` (≥1024 px) or `xl:` (≥1280 px)? Plan defaults to `lg:` for parity with the homepage's awards grid; revisit if Figma desktop preview shows narrower content blocks.
- [ ] **`signature-2025-creator` `value` string formatting**: keep as a single combined string ("5.000.000 VNĐ (cá nhân) / 8.000.000 VNĐ (tập thể)") or split into two visible rows? Plan defaults to combined (simpler render), but a split rendering may be visually clearer — defer to design review on implementation.
- [ ] **Hash routing on locale switch**: when user toggles `vi` ↔ `en` mid-page, do we preserve the URL hash? `setLocale` calls `revalidatePath('/', 'layout')`, which triggers a full re-render; the hash survives because the browser keeps it. No special handling needed; verify in E2E.
- [x] **Unit translations** — resolved (kept Vietnamese for both locales).
- [x] **Currency** — resolved (VNĐ for both locales).
- [x] **Page route** — resolved (`/awards`).

---

## Next Steps

After plan approval:

1. **Run** `/momorph.reviewplan` to validate technical feasibility & completeness.
2. **Run** `/momorph.tasks` to generate task breakdown.
3. **Begin** implementation Phase 0 → Phase 1 → Phase 2 → Phase 3.

---

## Notes

- The page is the **first authenticated-only screen** in the Homepage SAA family. It exercises the middleware's `isProtectedPath()` extension point — once shipped, the same pattern applies to future protected pages (Profile, Admin, Notifications).
- The `AwardsSidebarNav` client island is the **only new "use client" component** added by this feature; everything else is Server Components. This keeps client bundle growth minimal.
- All "Chi tiết" CTAs already use the shared arrow icon (`/assets/homepage/icons/arrow-up-right.svg`) with `currentColor` fill — no asset duplication needed.
- The 6 detail images replace the per-award name-overlay images used on Homepage's award cards. Different visual content (long-form artwork vs. short name overlay), so kept under a separate `public/assets/awards/detail/` directory.
- No dark/light theme prop on the page — entire page sits inside a `bg-hero-background text-hero-foreground` wrapper (same pattern as `app/page.tsx`).
