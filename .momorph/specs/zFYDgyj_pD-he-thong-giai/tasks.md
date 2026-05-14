# Tasks: Hệ thống giải / Awards Information

**Frame**: `zFYDgyj_pD-he-thong-giai`
**Prerequisites**: plan.md (required ✓), spec.md (required ✓), research.md (recommended ✓)
**Created**: 2026-05-14
**Approach**: TDD (Constitution §V) — tests written and failing BEFORE implementation for every behavior.

> **Note on `design-style.md`**: Per the spec/plan workflow, visual specs are fetched on demand at implementation time via `query_section` / `get_node`. The `design-style.md` artifact is not produced and is treated as workflow lint, not a hard gate (same precedent as Homepage SAA `tasks.md`).

---

## Task Format

```
- [ ] T### [P?] [Story?] Description | file/path.ts
```

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this belongs to (US1–US5); omitted in Setup, Foundational, and Polish phases
- **|**: File path the task touches

---

## User Stories (from spec.md)

| Story | Priority | Title                                                                  |
| ----- | -------- | ---------------------------------------------------------------------- |
| US1   | P1       | Browse the 6 award categories                                          |
| US2   | P1       | Jump to a specific award via the sidebar                               |
| US3   | P1       | Deep-link from Homepage SAA (`/awards#{slug}` lands on the right card) |
| US4   | P2       | Discover Sun\* Kudos from the awards page                              |
| US5   | P2       | Continue navigating from shared header / footer                        |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Asset downloads + middleware extension. No new code yet.

- [x] T001 Inventory Figma media for Hệ thống giải via `list_media_nodes` (screenId `zFYDgyj_pD`) and write the manifest to | `.momorph/specs/zFYDgyj_pD-he-thong-giai/asset-manifest.md`
- [x] T002 [P] Download the keyvisual banner artwork (`MM_MEDIA_*` node from `3_Keyvisual` group) to | `public/assets/awards/images/keyvisual-banner.png`
- [x] T003 [P] Download the 6 per-award detail images (336×336 each — from `D.1.1` through `D.6.1` Picture-Award instances) to | `public/assets/awards/detail/{top-talent,top-project,top-project-leader,best-manager,signature-2025-creator,mvp}.png`
- [x] T004 Add `/awards` to `isProtectedPath()` (anonymous traffic redirects to `/login?redirectTo=/awards{hash}`) | `middleware.ts`
- [x] T005 [P] Add `tests/setup.ts` polyfills: `IntersectionObserver` (no-op `observe()` / `disconnect()` / `unobserve()`) and `window.matchMedia` (returns a minimal `MediaQueryList` with `matches: false`, `addEventListener`/`removeEventListener` no-ops). Required by `AwardsSidebarNav.test`; reusable by future scrollspy tests | `tests/setup.ts`

**Checkpoint**: Assets in `public/assets/awards/`, middleware gates `/awards`, jsdom polyfills in place.

---

## Phase 2: Foundation (Blocking Prerequisites)

**Purpose**: Extend the awards domain model, i18n catalogue, and middleware test coverage. Required before any UI work.

**⚠️ CRITICAL**: No user-story phase begins until this phase is green.

### Foundation — Awards types + catalogue

- [x] T010 [P] Extend `Award` types module with `AwardDetail` interface (`{ slug: string; longDescriptionKey: string; quantity: string; unit: string; value: string }`) | `lib/awards/types.ts`
- [x] T011 [P] Test for `lib/awards/details.ts`: 6 entries, slug 1-to-1 with `awards.config.ts`, all `longDescriptionKey` values resolve in both `vi` and `en`, quantity strings match Figma ("10", "02", "03", "01"), `unit` strings are Vietnamese ("Đơn vị" / "Tập thể" / "Cá nhân"), `value` strings are raw VNĐ (no number formatting) | `tests/unit/lib/awards/details.test.ts`
- [x] T012 [P] Create the 6-entry `awardDetails: Record<Slug, AwardDetail>` keyed by the slugs from `awards.config.ts`. Hard-coded per Figma spec — Top Talent: qty `10` `Đơn vị` `7.000.000 VNĐ`; Top Project: `02` `Tập thể` `15.000.000 VNĐ`; Top Project Leader: `03` `Cá nhân` `7.000.000 VNĐ`; Best Manager: `01` `Cá nhân` `10.000.000 VNĐ`; Signature 2025-Creator: `01` `—` `5.000.000 VNĐ (cá nhân) / 8.000.000 VNĐ (tập thể)`; MVP: `01` `—` `15.000.000 VNĐ` | `lib/awards/details.ts`

### Foundation — i18n catalogue extension

- [x] T013 [P] Add `awardsPage.*` key tree to `vi`: `pageTitle` ("Hệ thống giải thưởng SAA 2025"), `pageCaption` (reuses `homepage.awards.section.caption` value), `quantityLabel` ("Số lượng giải thưởng:"), `valueLabel` ("Giá trị giải thưởng:"), `perAwardSuffix` ("(cho mỗi giải)"), and 6 `longDescription.{topTalent,topProject,topProjectLeader,bestManager,signature2025Creator,mvp}` keys with the per-award paragraph copy | `messages/vi.json`
- [x] T014 [P] Mirror the same key tree to `en` with English translations for `pageTitle` ("SAA 2025 Awards System"), `pageCaption`, `quantityLabel` ("Number of awards:"), `valueLabel` ("Award value:"), `perAwardSuffix` ("(per award)"), and 6 `longDescription.*` keys. Unit + currency strings remain in Vietnamese in `details.ts` (resolved decision — not duplicated here) | `messages/en.json`

### Foundation — Middleware protection test

- [ ] T015 Extend middleware integration test with a new `describe("/awards protected")` block: anonymous `GET /awards` returns `307` to `/login?redirectTo=/awards`; anonymous `GET /awards#top-talent` preserves the hash in `redirectTo`; authenticated `GET /awards` returns `200` | `tests/integration/middleware-public-home.test.ts`

**Checkpoint**: `lib/awards/details.ts` shapes match `awards.config.ts` slugs; i18n keys parity passes; middleware blocks anonymous `/awards`. User-story phases can begin in parallel.

---

## Phase 3: User Story 1 — Browse the 6 award categories (Priority: P1) 🎯 MVP

**Goal**: A signed-in user lands on `/awards` and sees the full page (header → keyvisual → title → 2-column body with 6 detail cards → Kudos promo → footer).

**Independent Test**: Sign in → navigate to `/awards` → verify all 6 cards render in catalogue order (Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025-Creator, MVP) with each showing image + title + description + quantity row + value row.

### Tests (US1) — TDD-first

- [x] T020 [P] [US1] Tests for `AwardDetailCard`: renders the per-award `<section id={slug}>` wrapper; image, title (`<h2 id="{slug}-heading">`), localized long description, quantity row ("Số lượng giải thưởng: 10 Đơn vị"), value row ("Giá trị giải thưởng: 7.000.000 VNĐ (cho mỗi giải)") all present; image `alt=""` (decorative — title is below) | `tests/unit/components/awards/AwardDetailCard.test.tsx`
- [x] T021 [P] [US1] Tests for `AwardsContentList`: renders exactly 6 `AwardDetailCard` instances in the slug order from `awards.config.ts`; each has the correct `id`; `aria-labelledby` points at the section heading id | `tests/unit/components/awards/AwardsContentList.test.tsx`
- [x] T022 [P] [US1] Tests for `KeyvisualBanner`: renders the banner image with empty `alt` (decorative) and `aria-hidden`; no interactive descendants | `tests/unit/components/awards/KeyvisualBanner.test.tsx`
- [x] T023 [P] [US1] Tests for `AwardsPageTitle`: renders the caption ("Sun\* Annual Awards 2025") and the heading ("Hệ thống giải thưởng SAA 2025") from i18n; heading is the `<h1>` for the page | `tests/unit/components/awards/AwardsPageTitle.test.tsx`
- [x] T024 [US1] Authenticated SSR integration test: GET `/awards` with seeded user returns 200; the response renders the header (with bell), keyvisual, title, 6 award sections in order, Kudos promo, footer (homepage variant). No `'use client'` directive on the page module (TR-001) | `tests/integration/awards-page-authenticated.test.tsx`

### Implementation (US1)

- [x] T025 [P] [US1] `KeyvisualBanner` Server Component — single `<Image src="/assets/awards/images/keyvisual-banner.png" alt="" aria-hidden fill priority>` inside a `<section aria-hidden>` wrapper | `components/organisms/awards/KeyvisualBanner.tsx`
- [x] T026 [P] [US1] `AwardsPageTitle` Server Component — caption + `<h1>` from i18n; centred layout per Figma | `components/organisms/awards/AwardsPageTitle.tsx`
- [x] T027 [P] [US1] `AwardDetailCard` Server Component — props `{ award: Award; detail: AwardDetail }`. Renders `<section id={award.slug} aria-labelledby="{slug}-heading">` with image (decorative), `<h2 id="{slug}-heading">{t(award.titleKey)}</h2>`, long description from `t(detail.longDescriptionKey)`, quantity row, value row | `components/organisms/awards/AwardDetailCard.tsx`
- [x] T028 [US1] `AwardsContentList` Server Component — iterates `awards` from `awards.config.ts` and renders 6 `AwardDetailCard` instances passing the matching detail entry from `awardDetails` | `components/organisms/awards/AwardsContentList.tsx`
- [x] T029 [US1] Replace `app/awards/page.tsx` placeholder with the Server Component composition: fetch `getCurrentUserProfile()` + `getUnreadCount()` + `getLocale()` in parallel; wrap below-header content in `bg-hero-background text-hero-foreground`; render `<HomepageHeader>` → `<KeyvisualBanner>` → `<AwardsPageTitle>` → (sidebar placeholder div + `<AwardsContentList>`) → `<KudosPromoSection>` → `<AppFooter variant="homepage">` | `app/awards/page.tsx`

### E2E (US1)

- [ ] T030 [US1] Playwright E2E: signed-in user visits `/awards`; all 6 award cards visible with correct titles in catalogue order; quantity + value rows present; Kudos promo and footer render (covers Test ID-3, ID-4, ID-6, ID-7) | `tests/e2e/awards.spec.ts`

**Checkpoint**: US1 complete. `/awards` shippable for signed-in users — content discoverable in document order even without the sidebar widget.

---

## Phase 4: User Story 2 — Jump to a specific award via the sidebar (Priority: P1)

**Goal**: Clicking a sidebar item smoothly scrolls to the matching section and sets that item active; scrolling through sections updates the active sidebar item; only one item active at a time.

**Independent Test**: On `/awards`, click "MVP" in the sidebar → page scrolls to the MVP section, MVP item becomes active, previous item loses active state. Scroll back to the top → first item regains active state.

### Tests (US2) — TDD-first

- [x] T040 [P] [US2] Tests for `AwardsSidebarItem`: renders an `<a href="#{slug}">`; `aria-current="location"` reflects the `isActive` prop; hover-state class present; no `'use client'` directive needed (file uses no hooks) | `tests/unit/components/awards/AwardsSidebarItem.test.tsx`
- [x] T041 [US2] Tests for `AwardsSidebarNav` (Client Component with `IntersectionObserver` + `matchMedia` mocks from `tests/setup.ts`): renders 6 items in the slug order from `awards.config.ts`; clicking an item sets `activeSlug` and calls `scrollIntoView` with `behavior: 'smooth'` (or `'instant'` under `prefers-reduced-motion: reduce`); clicking calls `history.replaceState` with `#{slug}`; scrollspy update from observer's intersection callback also updates `activeSlug`; only one `aria-current="location"` element at a time (Test ID-11); 250ms `isProgrammaticScroll` guard suppresses scrollspy updates during click-initiated smooth scroll | `tests/unit/components/awards/AwardsSidebarNav.test.tsx`

### Implementation (US2)

- [x] T042 [P] [US2] `AwardsSidebarItem` atom — presentational, no `'use client'` directive needed (auto-bundled client-side when imported by `AwardsSidebarNav`). Single `<a href="#{slug}">` with `aria-current` toggled by `isActive` prop and hover-state class | `components/organisms/awards/AwardsSidebarItem.tsx`
- [x] T043 [US2] `AwardsSidebarNav` Client Component (`'use client'`) — iterates `awards` from config; manages `activeSlug` state (default first slug); on mount, attaches one `IntersectionObserver` per `<section id={slug}>` (rootMargin set so the topmost-visible section "wins"); on click handler: `e.preventDefault()` → `scrollIntoView({behavior})` (`'instant'` if `matchMedia('(prefers-reduced-motion: reduce)').matches`, otherwise `'smooth'`) → `setActiveSlug(slug)` → `history.replaceState(null, '', '#{slug}')` → set `isProgrammaticScroll = true` for 250 ms to suppress scrollspy updates; cleanup observer on unmount | `components/organisms/awards/AwardsSidebarNav.tsx`
- [x] T044 [US2] Wire `<AwardsSidebarNav>` into `app/awards/page.tsx` — replace the sidebar placeholder; on desktop render in a sticky left column (`lg:sticky lg:top-...`), on mobile/tablet render inline above the content; layout becomes a 2-column grid at `lg:` breakpoint | `app/awards/page.tsx`

### E2E (US2)

- [ ] T045 [US2] Playwright E2E: click each of 6 sidebar items in turn — page scrolls to the matching section; clicked item gains active state; previously active item loses it; URL hash updates without polluting history (back button leaves the page, not the previous in-page anchor). Run a second pass with `prefers-reduced-motion: reduce` enabled and verify `scrollIntoView` runs in `'instant'` mode (covers Test ID-9, ID-10, ID-11) | `tests/e2e/awards.spec.ts`

**Checkpoint**: US2 complete. Sidebar + scrollspy works end-to-end.

---

## Phase 5: User Story 3 — Deep-link from Homepage SAA (Priority: P1)

**Goal**: Visiting `/awards#{slug}` directly (e.g., from Homepage SAA's award cards) scrolls to the matching section AND sets that sidebar item active on mount. Unknown slugs fall back to the first award without error.

**Independent Test**: Open Homepage SAA → click "Top Talent" → URL becomes `/awards#top-talent` → page renders with the Top Talent section in view and the Top Talent sidebar item active.

### Tests (US3) — TDD-first

- [x] T050 [US3] `AwardsSidebarNav` tests extension: on mount, when `window.location.hash` is `#mvp`, `activeSlug` resolves to `mvp` and `scrollIntoView` is invoked on the MVP section; when hash is `#unknown-slug`, `activeSlug` falls back to the first slug (`top-talent`) with no `scrollIntoView` call and no JS error logged (Test ID-13); when hash is empty, `activeSlug` is the first slug and no scroll happens | `tests/unit/components/awards/AwardsSidebarNav.test.tsx`

### Implementation (US3)

- [x] T051 [US3] `AwardsSidebarNav` `useEffect` on mount: read `window.location.hash.slice(1)`; if it matches a known slug from `awards.config.ts`, set `activeSlug` and `scrollIntoView` (respecting reduced motion); otherwise fall back to the first slug without scrolling. This is part of the same component touched in T043 — single file edit | `components/organisms/awards/AwardsSidebarNav.tsx`

### E2E (US3)

- [ ] T052 [US3] Playwright E2E: from Homepage SAA, click each of the 6 award cards in sequence; for each, verify the URL becomes `/awards#{slug}` AND the matching section is scrolled into view AND the matching sidebar item is active. Separate test: navigate directly to `/awards#nonsense` → first award active, no scroll, no console error (Test ID-13). Separate test: anonymous user clicks an award card → redirected to `/login?redirectTo=/awards#{slug}` → after sign-in lands on `/awards#{slug}` with the correct section in view | `tests/e2e/awards.spec.ts`

**Checkpoint**: US3 complete. The Homepage SAA → Awards Information flow is end-to-end. Three P1 user stories shipped.

---

## Phase 6: User Story 4 — Discover Sun\* Kudos from the awards page (Priority: P2)

**Goal**: After reading the awards, the user sees the Sun\* Kudos promo and can jump to `/kudos` via "Chi tiết".

**Independent Test**: Scroll to the bottom of `/awards` → Sun\* Kudos promo block is visible → click "Chi tiết" → URL navigates to `/kudos`.

### Implementation (US4)

- [x] T060 [US4] Confirm `<KudosPromoSection />` is included in `app/awards/page.tsx` between `<AwardsContentList />` and `<AppFooter />` (already wired in T029; this task is a verification + comment annotation pointing reviewers at the shared component) | `app/awards/page.tsx`

### E2E (US4)

- [ ] T061 [US4] Playwright E2E: scroll past the MVP card → Sun\* Kudos promo visible (title "Sun\* Kudos", description, "Chi tiết" button); click "Chi tiết" → URL becomes `/kudos` (covers Test ID-12); simulate `/kudos` returning 5xx → page surfaces the standard error path, awards page unaffected in history (covers Test ID-14) | `tests/e2e/awards.spec.ts`

**Checkpoint**: US4 complete. Sun\* Kudos cross-promotion verified.

---

## Phase 7: User Story 5 — Continue navigating from shared header / footer (Priority: P2)

**Goal**: Header (logo, nav links, bell, language switcher, profile menu) and footer (logo, nav links, copyright) all behave identically to Homepage SAA on this screen.

**Independent Test**: On `/awards`, click the header logo → land on `/`. Click "Sun\* Kudos" in the header → land on `/kudos`. Toggle the language switcher → all awards content + sidebar labels switch to the chosen locale and the URL hash is preserved.

### Implementation (US5)

- [x] T070 [US5] No new code — `HomepageHeader` + `AppFooter variant="homepage"` are already composed in `app/awards/page.tsx` (T029). This task verifies the same shared components render identically here (admin-dropdown variant when `user.role === 'admin'`, anonymous-menu fallback impossible because the page is auth-gated) | `app/awards/page.tsx`

### E2E (US5)

- [ ] T071 [US5] Playwright E2E: from `/awards`, click header logo → `/`; click each header nav link → correct target route; toggle language switcher → labels (`pageTitle`, `quantityLabel`, `valueLabel`, sidebar items) all swap to the chosen locale; URL hash (e.g., `#mvp`) preserved across the switch; click each footer nav link → correct target route. Sign-in/sign-out flow from the header profile menu works on this screen the same way it does on Homepage SAA | `tests/e2e/awards.spec.ts`

**Checkpoint**: US5 complete. All 5 user stories shipped.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Cross-cutting quality — accessibility, broken-link sweep, performance, docs.

- [ ] T080 [P] Add `@axe-core/playwright` AA scan to the `/awards` E2E (anonymous redirect path + signed-in path) — must report 0 violations | `tests/e2e/awards.spec.ts`
- [ ] T081 [P] E2E "no broken links" sweep over every `<a href>` rendered on `/awards` (asserts 200 on each) — keyvisual decorative, all 6 sidebar anchors resolve, Kudos "Chi tiết" → `/kudos`, header/footer links all resolve | `tests/e2e/awards.spec.ts`
- [ ] T082 [P] E2E reduced-motion sweep: enable `prefers-reduced-motion: reduce` → sidebar click triggers `scrollIntoView` with `'instant'`; no animation on the keyvisual; existing reduced-motion rule in `globals.css` neutralises transitions | `tests/e2e/awards.spec.ts`
- [ ] T083 [P] Manual Lighthouse run at hand-off documenting LCP/INP/CLS at the 75th percentile against TR-007 targets; record results in the PR description (no CI gating per Homepage SAA precedent) | (PR description)
- [x] T084 [P] Final i18n audit: grep the new component files for hard-coded user-facing strings; assert all copy comes from `messages/{vi,en}.json` or `lib/awards/details.ts` (the only place raw Vietnamese strings are allowed, by resolved decision) | `components/organisms/awards/**/*.tsx`, `app/awards/page.tsx`
- [ ] T085 [P] Update `README.md` "Current status" section to note the Awards Information screen is implemented; add a one-liner about the `/awards` auth gate behaviour | `README.md`
- [x] T086 [P] Update `.momorph/contexts/SCREENFLOW.md`: flip Hệ thống giải row status from `discovered` to `implemented`; add a Discovery Log entry recording the implementation date + tests passing | `.momorph/contexts/SCREENFLOW.md`
- [ ] T087 Run the full pre-merge CI chain: `npm run lint && npm run typecheck && npm run test && npm run test:e2e && npm run build` — all green before opening PR | (CI)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → no dependencies — assets and middleware extension can be done first.
- **Foundation (Phase 2)** → depends on Phase 1 (asset paths + middleware test reference). **BLOCKS** all user-story phases.
- **US1 (Phase 3)** → depends on Foundation. **MVP** — the first shippable increment (page is browsable in document order without the sidebar widget).
- **US2 (Phase 4)** → depends on Foundation + US1's page composition (T029 — the sidebar wires INTO the page).
- **US3 (Phase 5)** → depends on US2 (extends `AwardsSidebarNav` mount behaviour for hash handling).
- **US4 (Phase 6)** → depends on US1's page composition (T029 already includes KudosPromoSection); verification-only task.
- **US5 (Phase 7)** → depends on US1's page composition (T029 already includes shared header/footer); verification-only task.
- **Polish (Phase N)** → depends on all user stories.

### Within Each User Story

- Tests (Constitution §V — TDD) are written first and MUST fail before the production code is added.
- Atom-level components before molecules; molecules before organisms.
- Server Components first when possible; the single client island (`AwardsSidebarNav`) is the only file marked `'use client'`.
- E2E sits at the tail of the story phase and asserts the user-facing behaviour end-to-end.

### Parallel Opportunities

#### Within Setup (Phase 1)

- T002, T003, T005 are fully parallel — different file trees / no shared state.
- T004 (middleware) is sequential because T005 references the same test file's structure; but T005 itself doesn't depend on T004's code.

#### Within Foundation (Phase 2)

- T010 (types) + T011 (details test) + T012 (details data) — sequential because T011 and T012 reference the `AwardDetail` type from T010.
- T013 + T014 (i18n keys for vi + en) are parallel — different JSON files.
- T015 (middleware test) is independent of the awards-domain work.

#### Within Phase 3 (US1)

- T020–T023 (tests) and T025–T028 (components) split into 2 parallel rails:
  - **Rail A** (tests-first per TDD): T020 → T027 (one developer can do tests in order).
  - **Rail B** (component implementation as tests come online): T025 → T028 in dependency order (`AwardDetailCard` depends on the type from Phase 2).
- T029 (page composition) is the gate that unblocks Phase 4.

#### Cross-phase

- After US1 completes (T029), **US2, US4, US5 can be staffed in parallel** by different developers — they touch different concerns within `app/awards/page.tsx` and `components/organisms/awards/`.

### Suggested MVP Scope

**Ship Phase 1 + 2 + 3 (US1).** That delivers `/awards` as an auth-gated, content-complete page where users can scroll through all 6 awards in document order. Test ID-59 ("no broken links") passes thanks to existing placeholder routes for `/kudos`, `/community-standards`, etc. Sidebar (US2/US3) and the Kudos promo verification (US4/US5) can ship as a follow-up PR with zero rework.

---

## Implementation Strategy

### MVP First (Recommended)

1. Complete Phase 1 (Setup) and Phase 2 (Foundation).
2. Complete Phase 3 (US1) — content-complete page.
3. **STOP and VALIDATE**: signed-in user can land on `/awards`, scroll through all 6 awards, click Sun\* Kudos "Chi tiết". Anonymous gets redirected.
4. Open MVP PR. Iterate sidebar (US2/US3) and polish in follow-ups.

### Incremental Delivery (post-MVP)

1. Phase 4 (US2 — sidebar + scrollspy) → ship.
2. Phase 5 (US3 — deep-link hash) → ship.
3. Phases 6, 7 (US4, US5 — verifications) → bundle with Phase 3 polish.
4. Phase N (Polish) → final cleanup before sign-off.

---

## Notes

- Commit after each completed task or logical group. Scoped subjects: `feat(awards): add AwardDetailCard`, `test(awards): sidebar scrollspy guards`.
- TDD discipline (Constitution §V): if a test passes on the first run, the test is too weak or the production code already existed — re-examine before progressing.
- Mark tasks complete with `[x]` as you go.
- The 8 routes Homepage SAA links to are already protected/public per their own specs; only `/awards` flips from public placeholder to authenticated in this feature.
- Award slug + order is a contract with Homepage SAA — never duplicate the list; always iterate `awards.config.ts`.
- All scenario→test mappings live in plan.md's _Spec Coverage Trace_ table; every spec acceptance scenario maps to one or more tests above.
