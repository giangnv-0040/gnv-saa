# Feature Specification: Hệ thống giải / Awards Information

**Frame ID**: `zFYDgyj_pD` (node `313:8436`)
**Frame Name**: `Hệ thống giải`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**Figma/MoMorph**: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD
**Created**: 2026-05-14
**Status**: Draft

---

## Overview

The **Hệ thống giải / Awards Information** screen is the canonical detail page for the six SAA 2025 award categories. It is the navigation target of every "Chi tiết" link on Homepage SAA's awards grid (`/awards#{slug}`) and of every "Awards Information" header/footer link across the application.

The page presents — in this order — a keyvisual banner, a title block, a 2-column body (sticky sidebar with 6 navigation items + 6 award detail cards), a Sun\* Kudos promo, and the homepage footer. Each award card shows an image, title, description, quantity, and prize value. The sidebar item corresponding to the section currently in view is highlighted; clicking a sidebar item smoothly scrolls to the matching section.

Per Test ID-1, this screen is **authenticated-only**: anonymous visitors are redirected to `/login?redirectTo=/awards#{slug}` by middleware. This is a confirmed design decision and contrasts with Homepage SAA's public access.

All award content (title, description, quantity, prize value) is **static i18n-keyed copy** — extends `lib/awards/config.ts` from Homepage SAA. No runtime API is required to render the page; the page is fully cacheable as a Server Component.

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Browse the 6 award categories (Priority: P1)

A signed-in Sun\* user lands on the Awards Information page and reads through the 6 category cards to understand each award's criteria, quantity, and prize value.

**Why this priority**: This is the only place in the product where the award catalogue is documented in detail. Without it, the homepage's awards grid is a dead-end.

**Independent Test**: Sign in → navigate to `/awards` → verify all 6 cards render in order (Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025-Creator, MVP) with each showing title, description, quantity ("Số lượng giải thưởng"), and prize value ("Giá trị giải thưởng").

**Acceptance Scenarios**:

1. **Given** I am a signed-in user, **When** I navigate to `/awards`, **Then** the page renders the header (with bell + profile menu), keyvisual banner, title block ("Sun\* Annual Awards 2025" + "Hệ thống giải thưởng SAA 2025"), 2-column body (sidebar + 6 award cards), Sun\* Kudos promo, and footer.
2. **Given** I am on `/awards`, **When** I scroll through the content column, **Then** I see all 6 award cards in this fixed order: **Top Talent**, **Top Project**, **Top Project Leader**, **Best Manager**, **Signature 2025-Creator**, **MVP**.
3. **Given** any card is in view, **When** I look at its metadata, **Then** I see: an award image, the localized title, a description paragraph, "Số lượng giải thưởng: X [đơn vị]", and "Giá trị giải thưởng: Y VNĐ".
4. **Given** I am an unauthenticated visitor, **When** I navigate to `/awards`, **Then** the middleware redirects me to `/login?redirectTo=/awards` (Test ID-1).

---

### User Story 2 — Jump to a specific award via the sidebar (Priority: P1)

The signed-in user clicks an item in the sticky sidebar to scroll directly to the matching award card.

**Why this priority**: Each award block is a long paragraph; without the sidebar, users have to scroll through unrelated awards to find the one they want.

**Independent Test**: On `/awards`, click "MVP" in the sidebar → the page scrolls smoothly to the MVP section, the MVP sidebar item gains the active state (`aria-current="location"`), and the previously active item loses it.

**Acceptance Scenarios**:

1. **Given** I am on `/awards`, **When** I click any sidebar item, **Then** the page smoothly scrolls to the matching award section AND the clicked item becomes active (exposes `aria-current="location"`; visual treatment of the active state is resolved at implementation time).
2. **Given** I just clicked "Top Talent" and the sidebar shows it as active, **When** I click "MVP", **Then** the MVP item becomes active and Top Talent loses the active state (Test ID-11).
3. **Given** I hover over an inactive sidebar item, **When** I keep the cursor over it, **Then** the item displays its hover state (Test ID-10).
4. **Given** I have `prefers-reduced-motion: reduce` enabled, **When** I click a sidebar item, **Then** the scroll completes instantly (no smooth animation) but the active state still updates.
5. **Given** I navigate via keyboard (Tab) to a sidebar item and press **Enter**, **Then** the behavior matches a mouse click (scroll + active state + focus moves to the section heading).

---

### User Story 3 — Deep-link from Homepage SAA (Priority: P1)

A user clicks an award card on Homepage SAA (e.g., "Top Talent" → `/awards#top-talent`); on landing, the page scrolls directly to that award and the matching sidebar item is active.

**Why this priority**: This story closes the loop with Homepage SAA's deep links (FR-013). If it fails, the homepage's award discovery flow ends in a useless landing state.

**Independent Test**: From Homepage SAA, click the "Top Talent" card → URL becomes `/awards#top-talent` → page renders with the Top Talent section in view AND "Top Talent" sidebar item active.

**Acceptance Scenarios**:

1. **Given** Homepage SAA is open, **When** I click any award card, **Then** I navigate to `/awards#{slug}` and the corresponding section is scrolled into view on mount.
2. **Given** the URL is `/awards#mvp`, **When** the page loads, **Then** the MVP section is scrolled into view AND the MVP sidebar item is active.
3. **Given** the URL is `/awards#unknown-slug` (e.g., a stale link), **When** the page loads, **Then** the first award (Top Talent) is shown as active, no JavaScript error is thrown, and no scroll is performed (Test ID-13).
4. **Given** the URL has no hash (`/awards`), **When** the page loads, **Then** the first award (Top Talent) is active and the page renders at the top.

---

### User Story 4 — Discover Sun\* Kudos from the awards page (Priority: P2)

After reading the awards, the user is reminded of Sun\* Kudos via the promo block at the bottom and can jump straight into the Kudos board.

**Why this priority**: Cross-promotion of Sun\* Kudos. Not blocking the awards browse flow but reinforces the campaign messaging.

**Independent Test**: Scroll to the bottom of `/awards` → see the Sun\* Kudos promo block → click "Chi tiết" → navigate to `/kudos` (Test ID-12).

**Acceptance Scenarios**:

1. **Given** I am on `/awards`, **When** I scroll past the MVP card, **Then** the Sun\* Kudos promo block is visible (same component as on Homepage SAA).
2. **Given** the Sun\* Kudos promo is visible, **When** I click "Chi tiết", **Then** the browser navigates to `/kudos`.
3. **Given** the `/kudos` route fails (5xx / network), **When** I click "Chi tiết", **Then** I see the standard error page; the awards page is unchanged in the back-history (Test ID-14).

---

### User Story 5 — Continue navigating from shared header/footer (Priority: P2)

The user uses the shared header (nav links, bell, profile menu, language switcher) or footer (logo, nav links) to leave the awards page.

**Why this priority**: Standard cross-screen navigation hygiene; same component as Homepage SAA.

**Independent Test**: On `/awards`, click the header logo → land on `/`. Click "Sun\* Kudos" in the header → land on `/kudos`. Click the language switcher → toggle `vi` ↔ `en` and all awards content swaps to the chosen locale.

**Acceptance Scenarios**:

1. **Given** I am on `/awards`, **When** I click the header logo or "About SAA 2025", **Then** the browser navigates to `/`.
2. **Given** I am on `/awards`, **When** I click any footer link, **Then** the browser navigates to the corresponding route (per Homepage spec FR-028).
3. **Given** I switch language to `en`, **When** the page reloads, **Then** the title, descriptions, and prize-unit strings all render in English.
4. **Given** I am signed in as `role = admin`, **When** I open the profile dropdown, **Then** the "Admin Dashboard" entry is shown (same as Homepage US3 #4).

---

### Edge Cases

- **Hashtag does not match any award slug** — render with Top Talent active; do not scroll; no JS error (Test ID-13).
- **Server returns 401 for `/api/users/me`** — header degrades to anonymous; the page itself still requires auth (middleware), so a 401 on the user lookup is rare — when it occurs, header bell/profile items hide, body renders as before.
- **Language switched mid-session** — `setLocale` action + `revalidatePath('/', 'layout')` re-renders the page with the new locale; the sidebar/section anchors keep their slugs (slugs are language-independent).
- **Reduced-motion** — sidebar scroll uses `scrollIntoView({behavior: 'instant'})` when `prefers-reduced-motion: reduce`.
- **Award catalogue change** — the 6 slugs are the contract between Homepage and Awards Information; renaming/removing one MUST be a coordinated change in `lib/awards/config.ts`.
- **Long descriptions exceed visible area** — descriptions wrap naturally; no truncation.

---

## UI/UX Requirements _(from Figma)_

### Screen Components

| Component                   | Description                                                                                                                 | Interactions                                                             |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Header (shared, dark theme) | Logo + 3 nav links + bell + lang + avatar — identical to Homepage SAA                                                       | Same as Homepage                                                         |
| Keyvisual banner (3)        | Decorative artwork at the top (single image; smaller than Homepage hero)                                                    | None (display only)                                                      |
| Title block (A)             | "Sun\* Annual Awards 2025" caption + "Hệ thống giải thưởng SAA 2025" main heading                                           | None (display only)                                                      |
| Sidebar (C)                 | 6 navigation items mirroring the 6 awards; sticky on desktop                                                                | Click → scroll + active; Hover → highlight                               |
| Sidebar item (C.1–C.6)      | Single nav entry: "Top Talent" / "Top Project" / "Top Project Leader" / "Best Manager" / "Signature 2025 - Creator" / "MVP" | Click → scroll to anchor + set active; keyboard Enter / Space            |
| Award detail card (D.1–D.6) | Image (square) + title + description + quantity + value                                                                     | None (display-only) — only the surrounding container has the anchor `id` |
| Sun\* Kudos promo (D1)      | Same component as Homepage SAA's Kudos block                                                                                | Click "Chi tiết" → `/kudos` (FR-016 of Homepage spec)                    |
| Footer (shared)             | Logo + 4 nav links + copyright — same component as Homepage                                                                 | Same as Homepage                                                         |

### Navigation Flow

- **From**: Homepage SAA award cards (`/awards#{slug}`) and "Awards Information" links; header/footer "Awards Information" on every protected screen.
- **To**: `/` (logo / "About SAA 2025"), `/kudos` (header + Kudos promo CTA + Sun\* Kudos footer link), `/community-standards` (footer), `/login` (anonymous redirect), in-page `#{slug}` anchors (sidebar clicks).
- **Triggers**: see _Outgoing Navigations_ in `.momorph/contexts/screen_specs/he-thong-giai.md`.

### Behavioural & Accessibility Requirements

> Pixel breakpoints, exact column counts, font weights, and visual hover treatments are intentionally out of scope and resolved at implementation time per `momorph.implement`.

- **Responsive behaviour (abstract)**: on narrow viewports the sidebar collapses (e.g., to a horizontal scroll-snap row above the content) and the sticky positioning is dropped; on wider viewports a sticky sidebar to the left of the content is preferred.
- **Sidebar synchronisation**: clicking an item scrolls to the section AND updates the active state; scrolling through sections (e.g., via mouse wheel or keyboard PgDn) updates the active state to match the section in view (scrollspy).
- **Motion**: smooth scroll uses `scrollIntoView({behavior: 'smooth'})` and respects `prefers-reduced-motion: reduce`.
- **Accessibility**:
  - Sidebar is a `<nav aria-label="Awards categories">`.
  - Active sidebar item exposes `aria-current="location"` (in-page navigation context).
  - Each award detail card is a `<section id="{slug}" aria-labelledby="{slug}-heading">` so the heading anchors keyboard/screen-reader users to the right element on deep-link load.
  - Sidebar links are real `<a href="#{slug}">` so the page is usable without JavaScript (anchor scroll fallback).
  - Keyboard support: Tab cycles through sidebar items; Enter activates; focus moves to the section heading after the scroll completes.

---

## Requirements _(mandatory)_

### Functional Requirements

#### Page composition

- **FR-001**: The system MUST render the page in this order: shared header → keyvisual banner → title block → 2-column body (sidebar + 6 detail cards) → Sun\* Kudos promo → shared footer.
- **FR-002**: The keyvisual banner MUST be decorative only — no interactive elements.
- **FR-003**: The title block MUST display the caption "Sun\* Annual Awards 2025" and the heading "Hệ thống giải thưởng SAA 2025" (both from the i18n catalogue).

#### Authentication

- **FR-004**: The page MUST require an authenticated Supabase session (Test ID-1). Anonymous visitors MUST be redirected to `/login?redirectTo=/awards{hash}` by middleware. The route `/awards` MUST be added to `isProtectedPath()`.

#### Sidebar navigation

- **FR-005**: The sidebar MUST display 6 items in this fixed order (matching the awards content order): Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 - Creator, MVP.
- **FR-006**: Each sidebar item MUST be a real `<a href="#{slug}">` linking to its matching section anchor on the same page.
- **FR-007**: Clicking a sidebar item MUST smooth-scroll the page to the matching section AND set that item to the active state (exposes `aria-current="location"`; visual treatment of the active state is resolved at implementation time from design tokens).
- **FR-008**: As the user scrolls through the content column, the sidebar's active item MUST update via scrollspy to match the section in view.
- **FR-009**: Only **one** sidebar item MAY be active at any time (Test ID-11).
- **FR-010**: On hover, an inactive sidebar item MUST display its hover state (visual indicator only).
- **FR-011**: If `prefers-reduced-motion: reduce` is set, scroll MUST be instantaneous.

#### Award detail cards

- **FR-012**: The system MUST render exactly 6 award detail cards in this order: Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025-Creator, MVP.
- **FR-013**: Each card MUST display an image, title, description paragraph, "Số lượng giải thưởng" + value + unit, and "Giá trị giải thưởng" + value (per data below).
- **FR-014**: Each card MUST be wrapped in `<section id="{slug}">` so deep links and sidebar anchors resolve.

#### Deep-link / hashtag handling

- **FR-015**: On page mount with a URL hash matching an award slug, the system MUST scroll the matching section into view AND set the corresponding sidebar item to active.
- **FR-016**: On page mount without a hash or with a hash that doesn't match any slug, the system MUST default the active state to the first award (Top Talent) and NOT scroll (Test ID-13).
- **FR-017**: Hash updates (sidebar clicks) MUST use `history.replaceState` (not `pushState`) so back/forward navigation doesn't trap the user inside the awards page.

#### Sun\* Kudos promo

- **FR-018**: The system MUST render the Sun\* Kudos promo block at the bottom of the awards section using the same `KudosPromoSection` component as Homepage SAA.
- **FR-019**: The "Chi tiết" button MUST navigate to `/kudos` (Test ID-12).

#### Shared chrome

- **FR-020**: The header MUST be the same shared component as Homepage SAA (logo + nav + bell + lang switcher + profile menu) with the same behaviour.
- **FR-021**: The footer MUST be the homepage variant — same component as Homepage SAA.

### Technical Requirements

- **TR-001**: The page MUST be a Next.js Server Component; all award content is bundled (no runtime fetch).
- **TR-002**: Award slugs MUST come from the shared `lib/awards/config.ts` so Homepage SAA and Awards Information always agree (single source of truth).
- **TR-003**: Award detail metadata (description, quantity, unit, value) MUST live in i18n-keyed strings (no hard-coded copy in components).
- **TR-004**: The sidebar component MUST be a Client Component (it uses `usePathname` / `useEffect` for scrollspy); the rest of the page MAY be Server Components.
- **TR-005**: The page MUST be added to the protected paths in `middleware.ts`.
- **TR-006**: All interactive controls MUST be keyboard-operable; the sidebar MUST be operable with Tab + Enter and provide visible focus indicators.
- **TR-007**: Core Web Vitals targets: LCP < 2.5 s, INP < 200 ms, CLS < 0.1 at the 75th percentile.

### Key Entities

- **Award** (shared with Homepage SAA): `{ slug: string; titleKey: string; descriptionKey: string; nameImage: string }` — already defined in `lib/awards/types.ts`.
- **AwardDetail** (NEW): `{ slug: string; longDescriptionKey: string; quantity: string; unit: string; value: string }` — extends Award with the metadata specific to this page. Placed in `lib/awards/details.ts` keyed by the same slug.
  - `quantity` is a pre-zero-padded 2-digit string ("10", "02", "03", "01").
  - `unit` is a raw Vietnamese string kept for both locales ("Đơn vị" / "Tập thể" / "Cá nhân") per resolved decision.
  - `value` is a raw VNĐ string ("7.000.000 VNĐ", etc.) — same for both locales; not localised.

---

## Component Behavior _(per design item)_

> Each row references the Figma item number (`no`) and the Figma node ID.

### Keyvisual + Title (A, 3)

| Item | Node ID    | Component       | Interaction | Validation / State               |
| ---- | ---------- | --------------- | ----------- | -------------------------------- |
| 3    | `313:8437` | KeyvisualBanner | None        | Static; decorative artwork       |
| A    | `313:8453` | AwardsPageTitle | None        | Static; copy from i18n catalogue |

### Sidebar (C)

| Item | Node ID    | Component                              | Interaction                                        | Navigation                | Validation / State                    |
| ---- | ---------- | -------------------------------------- | -------------------------------------------------- | ------------------------- | ------------------------------------- |
| C    | `313:8459` | AwardsSidebarNav                       | Container — sticky on desktop; collapses on mobile | —                         | One active item at a time             |
| C.1  | `313:8460` | SidebarItem "Top Talent"               | Click → scroll + active                            | `#top-talent`             | `aria-current="location"` when active |
| C.2  | `313:8461` | SidebarItem "Top Project"              | Click → scroll + active                            | `#top-project`            | Same                                  |
| C.3  | `313:8462` | SidebarItem "Top Project Leader"       | Click → scroll + active                            | `#top-project-leader`     | Same                                  |
| C.4  | `313:8463` | SidebarItem "Best Manager"             | Click → scroll + active                            | `#best-manager`           | Same                                  |
| C.5  | `313:8464` | SidebarItem "Signature 2025 - Creator" | Click → scroll + active                            | `#signature-2025-creator` | Same                                  |
| C.6  | `313:8465` | SidebarItem "MVP"                      | Click → scroll + active                            | `#mvp`                    | Same                                  |

### Award Detail Cards (D)

| Item | Node ID    | Component                                | Interaction | Anchor                        | Validation / State                                                     |
| ---- | ---------- | ---------------------------------------- | ----------- | ----------------------------- | ---------------------------------------------------------------------- |
| D.1  | `313:8467` | AwardDetailCard "Top Talent"             | None        | `id="top-talent"`             | Quantity 10, unit "Đơn vị", value "7.000.000 VNĐ" per award            |
| D.2  | `313:8468` | AwardDetailCard "Top Project"            | None        | `id="top-project"`            | Quantity 02, unit "Tập thể", value "15.000.000 VNĐ" per award          |
| D.3  | `313:8469` | AwardDetailCard "Top Project Leader"     | None        | `id="top-project-leader"`     | Quantity 03, unit "Cá nhân", value "7.000.000 VNĐ" per award           |
| D.4  | `313:8470` | AwardDetailCard "Best Manager"           | None        | `id="best-manager"`           | Quantity 01, unit "Cá nhân", value "10.000.000 VNĐ"                    |
| D.5  | `313:8471` | AwardDetailCard "Signature 2025-Creator" | None        | `id="signature-2025-creator"` | Quantity 01, value "5.000.000 VNĐ (cá nhân) / 8.000.000 VNĐ (tập thể)" |
| D.6  | `313:8510` | AwardDetailCard "MVP"                    | None        | `id="mvp"`                    | Quantity 01, value "15.000.000 VNĐ"                                    |

### Sub-components of an Award Detail Card

| Item  | Node ID              | Component          | Interaction | Notes                                      |
| ----- | -------------------- | ------------------ | ----------- | ------------------------------------------ |
| D.1.1 | `I313:8467;214:2525` | AwardDetailImage   | None        | Decorative — `alt=""` since title is below |
| D.1.2 | `I313:8467;214:2526` | AwardDetailContent | None        | Title + description + qty + value          |

### Sun\* Kudos Promo (D1)

| Item | Node ID               | Component         | Interaction             | Navigation | Validation / State |
| ---- | --------------------- | ----------------- | ----------------------- | ---------- | ------------------ |
| D1   | `335:12023`           | KudosPromoSection | (Same as Homepage spec) | —          | Reused             |
| D2.1 | `I335:12023;313:8426` | "Chi tiết" CTA    | Click → navigate        | `/kudos`   | Reused             |

---

## Data Requirements

### Display fields

| Field                                   | Source                                            | Type                      | Notes                                                                                                       |
| --------------------------------------- | ------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `awards[]`                              | Static — extends `lib/awards/config.ts`           | array<Award>              | 6 entries; slug + titleKey + nameImage (already exists)                                                     |
| `awardDetails[slug]`                    | Static — `lib/awards/details.ts` (NEW)            | record<slug, AwardDetail> | longDescriptionKey, quantity, unitKey, valueKey                                                             |
| Title caption                           | `homepage.awards.section.caption` (reused)        | string                    | "Sun\* Annual Awards 2025"                                                                                  |
| Page heading                            | i18n key `awardsPage.title` (NEW)                 | string                    | "Hệ thống giải thưởng SAA 2025"                                                                             |
| Award title / description / value label | i18n catalogue per slug                           | string                    | Per-locale; vi default                                                                                      |
| Quantity number                         | `awardDetails[slug].quantity` (pre-padded string) | string                    | Stored as already-padded string ("10", "02", "03", "01")                                                    |
| Quantity unit                           | `awardDetails[slug].unit`                         | string                    | Vietnamese label kept for both locales: "Đơn vị" / "Tập thể" / "Cá nhân" (resolved during `reviewspecify`)  |
| Prize value                             | `awardDetails[slug].value`                        | string                    | Raw VNĐ string ("7.000.000 VNĐ", etc.) — same value for both locales; NOT formatted via `Intl.NumberFormat` |

### Input fields

N/A — the page is read-only. No forms, no client inputs.

### Validation rules

- The 6 award slugs MUST match the 6 sidebar items 1-to-1.
- The 6 sidebar items MUST appear in catalogue order.
- Hashtag MUST match a known slug; unknown → ignored (FR-016).
- All copy MUST be present in `vi` and `en` (parity test passes).

### Data relationships and constraints

- `awards.config.ts` is the single source of truth for slugs; both Homepage SAA and this screen consume it.
- `awardDetails.ts` is keyed by the same slug as `awards.config.ts`; missing detail for a slug is a build-time test failure.

---

## API Requirements (Predicted)

The page does **not** trigger any new API endpoints. It reuses the shared chrome endpoints that already exist:

| Endpoint                          | Method | Purpose                | Triggered by                  | Auth     |
| --------------------------------- | ------ | ---------------------- | ----------------------------- | -------- |
| `/api/users/me` (Server Action)   | RSC    | Header personalisation | Page mount (Server Component) | Yes      |
| `/api/notifications/unread-count` | GET    | Bell badge             | Page mount (auth-only)        | Yes      |
| `/api/notifications?limit=5`      | GET    | Bell overlay preview   | Bell click                    | Yes      |
| `/api/auth/signout`               | POST   | Sign out               | Profile dropdown              | Yes      |
| `/api/i18n/locale`                | PUT    | Persist locale         | Language switcher             | Optional |

No new endpoints. All page content is bundled static data.

---

## State Management

### Local component state

| State                  | Type    | Scope            | Purpose                                                                                      |
| ---------------------- | ------- | ---------------- | -------------------------------------------------------------------------------------------- |
| `activeSlug`           | string  | AwardsSidebarNav | Currently active sidebar item; derived from URL hash on mount, updated by scrollspy + clicks |
| `isProgrammaticScroll` | boolean | AwardsSidebarNav | Prevents the scrollspy listener from fighting with the click-initiated smooth scroll         |

### Global state needs

| State         | Store        | Read/Write | Purpose                           |
| ------------- | ------------ | ---------- | --------------------------------- |
| `session`     | Supabase SSR | Read       | Auth gate (middleware) + header   |
| `user`        | RSC prop     | Read       | Header personalization            |
| `unreadCount` | RSC prop     | Read       | Bell badge                        |
| `locale`      | i18n cookie  | Read       | Render labels in current language |

### Cache / invalidation requirements

- Static page content is bundled and cached at build time (no revalidation needed).
- Same header-data caches as Homepage SAA.

### Optimistic updates

None — read-only page.

---

## API Dependencies

| Endpoint                          | Method | Purpose                | Status                |
| --------------------------------- | ------ | ---------------------- | --------------------- |
| `/api/users/me`                   | RSC    | Header personalization | Reused (Homepage SAA) |
| `/api/notifications/unread-count` | GET    | Bell badge             | Reused (Homepage SAA) |
| `/api/notifications?limit=5`      | GET    | Bell overlay preview   | Reused (Homepage SAA) |
| `/api/auth/signout`               | POST   | Sign out               | Reused (Homepage SAA) |
| `/api/i18n/locale`                | PUT    | Persist locale         | Reused (Homepage SAA) |

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All 6 award cards are visible and the matching sidebar item is correctly activated by scrollspy in **100%** of test runs.
- **SC-002**: Deep links `/awards#{slug}` (all 6 known slugs) scroll the matching section into view on mount in 100% of runs.
- **SC-003**: `/awards#unknown-slug` does not produce a JavaScript error and falls back to the first award active (Test ID-13).
- **SC-004**: Anonymous access to `/awards` is redirected to `/login` (Test ID-1).
- **SC-005**: Page Core Web Vitals at the 75th percentile of production traffic: **LCP < 2.5 s**, **INP < 200 ms**, **CLS < 0.1**.
- **SC-006**: Zero CSP / mixed-content / accessibility (axe AA) violations on `/awards`.
- **SC-007**: All header / footer / Kudos navigations resolve without 4xx/5xx errors.

---

## Out of Scope

- Authoring or moderating award catalogue content via UI — `lib/awards/{config,details}.ts` is the only editable source.
- Backend persistence of award data — all content is static.
- Visual / CSS specifications (colours, exact pixel values, fonts, shadows, gradients) — fetched on demand at implementation time per `momorph.implement`.
- Asset preparation (downloading keyvisual / per-award imagery) — handled at implementation time via `get_media_files` / `list_media_nodes`.
- The Sun\* Kudos board content itself — owned by the Sun\* Kudos - Live board spec.
- Profile dropdown items (`/profile`, `/admin`) — owned by the Dropdown-profile spec.
- iOS variants of this screen — separate scope per SCREENFLOW.

---

## Dependencies

- [x] Constitution document exists (`.momorph/constitution.md`)
- [x] Screen flow documented (`.momorph/contexts/SCREENFLOW.md`) and `he-thong-giai.md` screen spec generated
- [x] Homepage SAA spec exists (`.momorph/specs/i87tDx10uM-homepage-saa/spec.md`) — defines the slug contract
- [x] `lib/awards/config.ts` exists with the 6 slugs (shipped with Homepage SAA)
- [ ] `lib/awards/details.ts` (NEW) — to be created by `momorph.plan` / `momorph.implement`
- [ ] Add i18n keys under `awardsPage.*` (caption already shared via `homepage.awards.section.caption`) — title, sidebar labels, per-award long description + quantity unit + value strings
- [ ] Update `middleware.ts` — add `/awards` to `isProtectedPath()`
- [ ] Reuse `KudosPromoSection`, `HomepageHeader`, `AppFooter variant="homepage"` from Homepage SAA

---

## Notes

- The Sun\* Kudos promo block is the same component the homepage uses (`KudosPromoSection`). It accepts no props besides locale (inherited via context) — no per-screen variant needed.
- The 6 sidebar items match 1-to-1 with `lib/awards/config.ts`. To enforce this, the implementation MUST iterate `awards` for both the sidebar AND the content list — never hard-code 6 entries twice.
- The page is rendered as a Server Component for SEO + LCP; only `AwardsSidebarNav` is `'use client'` (it needs `IntersectionObserver` + click handlers).
- Quantity numbers are pre-zero-padded in i18n strings ("10", "02", "03", "01") — no client-side `padTwoDigits`.
- Currency strings ("7.000.000 VNĐ") are raw i18n strings, NOT formatted via `Intl.NumberFormat` — this matches Figma's exact-string requirement and avoids locale-specific separator surprises.
- Route is `/awards` (consistent with Homepage SAA's deep links and the existing placeholder route shipped with Homepage). The Test ID-0 reference to `/he-thong-giai` is interpreted as a translation note; the canonical path stays `/awards`.

### Resolved Decisions (locked during `momorph.reviewspecify`)

- **Page route** — confirmed `/awards`. The existing placeholder at `app/awards/page.tsx` will be replaced by this screen's implementation; no `lib/routes.ts` change needed (`ROUTES.AWARDS` already points here).
- **Unit labels in `en` locale** — keep the Vietnamese strings as-is: "Đơn vị" / "Tập thể" / "Cá nhân". These are Sun\* internal categorisation labels recognised by both Vietnamese and international staff; no translation needed.
- **Currency in `en` locale** — keep VNĐ for both `vi` and `en` (event is in Vietnam, prizes are paid in VNĐ). No USD conversion, no parenthesised USD hint — the raw VNĐ string is the canonical value.

### Open Items (deferred to plan or to dependent specs)

- **Sticky-sidebar breakpoint** — desktop (`lg`) or wider (`xl`) for sticky behaviour. Locked by `momorph.plan` based on Figma desktop preview proportions.
- **Anonymous fallback for the Kudos "Chi tiết" CTA** — `/kudos` is also auth-only; the existing `Coming soon` placeholder already handles anonymous gracefully via its own middleware behaviour. Once Kudos board ships its real screen, verify the UX path stays consistent.
