# Feature Specification: Homepage SAA

**Frame ID**: `i87tDx10uM` (node `2167:9026`)
**Frame Name**: `Homepage SAA`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**Figma/MoMorph**: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
**Created**: 2026-05-13
**Status**: Draft

---

## Overview

The **Homepage SAA** is the public-facing landing page and post-login hub for the **Sun\* Annual Awards 2025 ("ROOT FURTHER")** campaign. It introduces the campaign theme, counts down to the awards ceremony, surfaces the six award categories, promotes the **Sun\* Kudos** recognition movement, and is the primary jump-off point to every other public area of the site (Awards Information, Sun\* Kudos board, community standards, profile, notifications, language switcher).

It serves two audiences simultaneously:

- **Unauthenticated visitors** — see all public content (hero, countdown, awards grid, kudos promo, footer). The notification bell is hidden when signed out; the avatar remains visible and opens an anonymous dropdown containing a single `Sign in` action that routes to `/login`.
- **Authenticated Sun\* users** — additionally see the unread-notification badge, the full profile menu (Profile / Sign out), and — if `role = admin` — the **Admin Dashboard** entry in that menu.

The countdown is the time-sensitive element: the ceremony's target datetime is provided as an ISO-8601 value via the `NEXT_PUBLIC_EVENT_START_AT` build-time environment variable, and the screen updates every minute. When the countdown reaches zero, the "Coming soon" sub-label disappears and the timer freezes at `00 / 00 / 00`.

This screen contains no forms; every interaction is a click/keyboard activation that either navigates, opens an overlay, or switches locale.

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 — View the campaign and discover awards (Priority: P1)

Any visitor (authenticated or not) opens the homepage to learn about Sun\* Annual Awards 2025: read the campaign theme, see how long until the ceremony, browse the award categories, and jump to a category's details on the Awards Information page.

**Why this priority**: This is the campaign's primary marketing surface. If this journey works, the site has measurable business value even before any of the deeper authenticated features ship.

**Independent Test**: Load `/` as an anonymous user; verify hero, countdown, all six award cards (Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 - Creator, MVP) render; click a card or "Chi tiết" and confirm navigation to `/awards#{slug}` with browser auto-scroll to the matching section.

**Acceptance Scenarios**:

1. **Given** I am an unauthenticated visitor, **When** I navigate to `/`, **Then** the page renders the header (without bell badge or profile dropdown items), hero (`ROOT FURTHER` + "Coming soon" + countdown + event info + "ABOUT AWARDS" / "ABOUT KUDOS" buttons), the description paragraph, the awards grid (6 cards), the Sun\* Kudos promo, the floating widget, and the footer.
2. **Given** I am on `/`, **When** I click the "Top Talent" award card image, title, or "Chi tiết" link, **Then** the browser navigates to `/awards#top-talent` and the Awards Information page auto-scrolls to that section.
3. **Given** I am on `/`, **When** I hover the cursor over any award card, **Then** the card visually elevates with an enhanced border/light effect (no functional change; visual only).
4. **Given** I am on `/`, **When** I click the "ABOUT AWARDS" CTA, **Then** the browser navigates to `/awards`. **When** I click "ABOUT KUDOS", **Then** the browser navigates to `/kudos`.
5. **Given** I clicked an award card on a section whose slug does not exist on `/awards`, **When** the Awards Information page loads, **Then** the page renders normally without auto-scroll and without throwing an error (graceful fallback — see Test ID-62).

---

### User Story 2 — See live countdown to the ceremony (Priority: P1)

Any visitor sees the days/hours/minutes remaining to the ceremony and the page updates without a manual refresh.

**Why this priority**: The countdown is a core piece of the campaign's identity and drives urgency. Without it the hero is incomplete.

**Independent Test**: Configure event start datetime to a future ISO-8601 value, load `/`, verify all three tiles render with 2-digit zero-padded values, wait one minute, verify the Minutes value decreases by one (and Hours/Days roll over correctly when applicable).

**Acceptance Scenarios**:

1. **Given** the event start datetime is configured to a future ISO-8601 value, **When** I load `/`, **Then** the countdown displays three tiles labeled `DAYS`, `HOURS`, `MINUTES`, each showing a 2-digit zero-padded value, and the "Coming soon" label is visible.
2. **Given** the countdown shows `05 / 09 / 32`, **When** one minute passes, **Then** the Minutes tile updates to `31` (or the next valid value, rolling over hours/days correctly).
3. **Given** the event start datetime is in the past or has just been reached, **When** the page is loaded, **Then** all tiles display `00`, the "Coming soon" label is hidden, and the timer stops ticking.
4. **Given** the configured event datetime value is not a valid ISO-8601 string, **When** the page is loaded, **Then** the countdown falls back to `00 / 00 / 00`, "Coming soon" is hidden, and the rest of the page still renders (no crash, no blocking error).

---

### User Story 3 — Personalized header for authenticated users (Priority: P1)

Signed-in users see their unread-notification badge, can open the notifications panel, change their language, and access their profile menu (including Admin Dashboard if they are an admin).

**Why this priority**: This is the bridge between the public marketing surface and the authenticated product (notifications, profile, admin). It must work the moment the user lands after sign-in.

**Independent Test**: Sign in as a regular user → reload `/` → confirm bell badge state matches `/api/notifications/unread-count`, avatar dropdown shows Profile and Sign out only. Sign in as an admin → confirm the same dropdown additionally exposes "Admin Dashboard".

**Acceptance Scenarios**:

1. **Given** I am signed in with 1+ unread notifications, **When** I land on `/`, **Then** the bell icon shows the unread-indicator badge.
2. **Given** I am signed in with 0 unread notifications, **When** I land on `/`, **Then** the bell icon shows no badge.
3. **Given** I am signed in, **When** I click the bell icon, **Then** an inline overlay opens anchored to the bell showing the latest 5 notifications and a `See all` link to `/notifications`. **When** I click the bell again, click outside, or press `Esc`, **Then** the overlay closes.
4. **Given** I am signed in as `role = admin`, **When** I click my avatar, **Then** the profile dropdown shows `Profile`, `Sign out`, **and** `Admin Dashboard`.
5. **Given** I am signed in as `role = user`, **When** I click my avatar, **Then** the dropdown shows only `Profile` and `Sign out`.
6. **Given** I am signed in and I click "Sign out", **Then** the server clears my session, and the browser is redirected to `/login`.

---

### User Story 4 — Switch interface language (Priority: P2)

Any visitor can switch the interface language between Vietnamese and English via the `VN` button in the header. The chosen locale persists for the session and (for signed-in users) for the account.

**Why this priority**: Sun\* is bilingual and visitors arrive at the homepage first; preserving the locale across navigations is important UX but not blocking for MVP.

**Independent Test**: Load `/` in default `vi`, click `VN`, select `EN`, verify all on-screen labels switch to English; refresh the page and verify the locale persists; switch back to `VN` and verify the reverse.

**Acceptance Scenarios**:

1. **Given** I am on `/` in Vietnamese, **When** I click the `VN` button, **Then** a dropdown opens with options `VN` and `EN` only.
2. **Given** the language dropdown is open, **When** I select `EN`, **Then** every translatable label on the page switches to English, the button text changes to `EN`, and the new locale is persisted via `PUT /api/i18n/locale` (authenticated) or in a cookie (unauthenticated).
3. **Given** `PUT /api/i18n/locale` fails (network or 5xx), **When** the failure occurs, **Then** the UI keeps the previous locale and a non-blocking toast informs the user.

---

### User Story 5 — Promote Sun\* Kudos and quick actions (Priority: P2)

A visitor can jump from the homepage into the Kudos detail page or use the floating widget to reach quick actions (Write Kudo, SAA rules).

**Why this priority**: Kudos is a major feature but is reachable via several paths; the widget is a convenience accelerator.

**Independent Test**: Click the "Chi tiết" button inside the Sun\* Kudos promo block → confirm navigation to `/kudos`. Click the floating widget → confirm an action overlay opens.

**Acceptance Scenarios**:

1. **Given** I am on `/`, **When** I click the "Chi tiết" button inside the Sun\* Kudos promo block, **Then** the browser navigates to `/kudos`.
2. **Given** I am on `/`, **When** I click the floating widget pill in the bottom-right corner, **Then** a quick-action overlay opens with the "Viết Kudo" and "Thể lệ SAA" entries.
3. **Given** the widget overlay is open, **When** I click outside the overlay or press `Esc`, **Then** the overlay closes.

---

### User Story 6 — Reliable navigation from header & footer (Priority: P2)

A visitor can use the header or footer to jump to any of the top-level pages (About / Awards / Kudos / Community standards) and return to the homepage by clicking the logo.

**Why this priority**: Cross-screen navigation is a hygiene feature; everything in the campaign assumes these links work.

**Independent Test**: Visit a non-homepage route, click the header logo → confirm navigation to `/` and scroll-to-top. From `/`, click each header and footer link → confirm correct destination URLs.

**Acceptance Scenarios**:

1. **Given** I am on any non-homepage route, **When** I click the header logo, **Then** the browser navigates to `/` and the viewport is scrolled to the top.
2. **Given** I am on `/`, **When** I click the "About SAA 2025" header link, **Then** the page scrolls to the top (since `/` _is_ the About SAA 2025 page).
3. **Given** I am on `/`, **When** I click "Awards Information", "Sun\* Kudos", or "Tiêu chuẩn chung" in the footer, **Then** the browser navigates to `/awards`, `/kudos`, or `/community-standards` respectively.
4. **Given** I am on `/`, **When** I hover over an inactive header nav link, **Then** the link displays its hover state (visual treatment defined at implementation time).
5. **Given** I am on `/`, **When** the page loads, **Then** "About SAA 2025" in the header is rendered with the active/selected state and `aria-current="page"`.

---

### Edge Cases

- **Event datetime is in the past or invalid** — countdown shows `00 / 00 / 00`, hides "Coming soon", and the page still renders (Test IDs 41, 42, 60).
- **`/api/users/me` returns 401 after page load** — UI gracefully drops back to anonymous mode (hide bell/profile dropdown items) without unmounting the rest of the page.
- **Award slug missing from `/awards`** — navigation succeeds without auto-scroll (Test ID-62).
- **No unread notifications** — bell renders with no badge dot (Test ID-29).
- **Network failure on language change** — locale stays as-is; toast surfaces the failure.
- **Reduced-motion user** — countdown still ticks, but hover/elevation effects on award cards respect `prefers-reduced-motion: reduce`.
- **Long content overflow on award card description** — description truncates with ellipsis after 2 lines (per C2.1.3 spec).
- **Server-rendered countdown vs. client time skew** — on hydration the client MUST recompute remaining time from the current wall-clock, not reuse the server-rendered value, to avoid stale display.

---

## UI/UX Requirements _(from Figma)_

### Screen Components

| Component                    | Description                                                                                      | Interactions                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Header (A1)                  | Logo + 3 nav links + bell + language + avatar                                                    | Click links → navigate; bell/lang/avatar → open dropdown overlays                   |
| Hero / Keyvisual (3.5)       | "ROOT FURTHER" logotype, "Coming soon" sub-label, countdown, event info, CTAs, description block | Click CTAs → navigate; countdown ticks every minute                                 |
| Countdown (B1 / B1.3.x)      | 3 tiles (Days / Hours / Minutes), each 2-digit                                                   | Auto-update; freeze at zero                                                         |
| Event Info Block (B2)        | Static text: time, venue, broadcast note                                                         | None (display only)                                                                 |
| Hero CTAs (B3 / B3.1 / B3.2) | "ABOUT AWARDS" (hover state), "ABOUT KUDOS" (normal state)                                       | Click → navigate                                                                    |
| Description (B4)             | Multi-paragraph "Root Further" essay                                                             | None (display only)                                                                 |
| Awards Section Header (C1)   | "Sun\* annual awards 2025" caption + "Hệ thống giải thưởng" title + description                  | None (display only)                                                                 |
| Award Card Grid (C2)         | 6 cards, each with image + title + 1–2 line description + "Chi tiết" link                        | Click any of image/title/"Chi tiết" → navigate to `/awards#{slug}`; hover → elevate |
| Kudos Promo Block (D1 / D2)  | Label + title + description + "Chi tiết" button + background image                               | Click "Chi tiết" → navigate to `/kudos`                                             |
| Floating Widget (mms_6)      | Bottom-right pill with pencil + SAA icons                                                        | Click → open quick-action overlay                                                   |
| Footer (7)                   | Logo + 4 nav links + copyright                                                                   | Click → navigate; logo → back to `/` and scroll to top                              |

### Navigation Flow

- **From**: Login (post-OAuth-success redirect), any page (header/footer logo or "About SAA 2025" link), 403/404 error pages ("Return home").
- **To**: `/awards`, `/awards#{slug}`, `/kudos`, `/kudos/new` (via widget), `/community-standards`, `/profile`, `/admin` (admin), `/login` (sign out), `/rules` (via widget). Overlays: Notification panel, Language dropdown, Profile dropdown, Quick-action menu.
- **Triggers**: see _Outgoing Navigations_ in `.momorph/contexts/screen_specs/homepage-saa.md`.

### Behavioral & Accessibility Requirements

> Pixel breakpoints, exact column counts, animation curves, and visual hover treatments are intentionally out of scope and defined at implementation time per `momorph.implement`.

- **Responsive behavior** (abstract): The screen MUST adapt across mobile, tablet, and desktop without horizontal scroll. The awards grid MUST adapt its column count between narrow and wide viewports. The hero CTAs MUST stack on narrow viewports and the event info block MUST wrap rather than truncate.
- **Motion**: All non-essential animations (e.g., dropdown reveal, award-card hover effect) MUST respect `prefers-reduced-motion: reduce`. The countdown tick is functional, not animated, so it MUST keep running regardless of motion preferences.
- **Accessibility**: WCAG 2.1 Level AA. Logical tab order; `aria-current="page"` on the active nav link; `aria-label` on icon-only buttons (bell, avatar, widget); the countdown region announces minute changes via `aria-live="polite"` (and is silent between minute changes); all interactive controls meet WCAG 2.5.5 (target size) on touch viewports.

---

## Requirements _(mandatory)_

### Functional Requirements

#### Header & global navigation

- **FR-001**: The system MUST render a sticky/visible Header at the top of the homepage containing logo, three nav links ("About SAA 2025", "Awards Information", "Sun\* Kudos"), and a control cluster (bell, language switcher, avatar).
- **FR-002**: The system MUST render the "About SAA 2025" nav link in its active state and expose `aria-current="page"` when the user is on `/`.
- **FR-003**: The system MUST navigate to `/`, `/awards`, and `/kudos` when the user clicks the respective header/footer nav links (and scroll to top when clicking the active link again).
- **FR-004**: The system MUST navigate to `/` when the user clicks the header or footer logo.

#### Hero / Countdown

- **FR-005**: The system MUST display the "ROOT FURTHER" hero logotype, the "Coming soon" sub-label, the countdown tiles, the event info block, the two hero CTAs ("ABOUT AWARDS", "ABOUT KUDOS"), and the multi-paragraph description.
- **FR-006**: The system MUST initialize the countdown from an ISO-8601 event start datetime supplied by the `NEXT_PUBLIC_EVENT_START_AT` build-time environment variable. Changing the event datetime requires a redeploy; no runtime API is exposed.
- **FR-007**: The system MUST display each countdown tile as a 2-digit zero-padded number with the label `DAYS`, `HOURS`, or `MINUTES`.
- **FR-008**: The system MUST update the countdown at minimum every 60 seconds without requiring a page refresh.
- **FR-009**: When the event start datetime is in the past (or invalid), the system MUST display `00 / 00 / 00`, hide the "Coming soon" sub-label, and stop the tick interval.
- **FR-010**: The system MUST navigate to `/awards` when the user clicks the "ABOUT AWARDS" CTA, and to `/kudos` when the user clicks "ABOUT KUDOS".

#### Awards grid

- **FR-011**: The system MUST render exactly six award cards in the awards grid: `Top Talent`, `Top Project`, `Top Project Leader`, `Best Manager`, `Signature 2025 - Creator`, `MVP`.
- **FR-012**: Each award card MUST display an image, a title, a 1–2-line description (truncated with ellipsis if longer), and a "Chi tiết" link.
- **FR-013**: Clicking anywhere on the image, title, or "Chi tiết" link of an award card MUST navigate to `/awards#{slug}`, where `{slug}` is the canonical kebab-case identifier for that award.
- **FR-014**: If `/awards` is opened with a hashtag whose slug does not exist on the destination page, the system MUST render `/awards` without auto-scroll and without error.

#### Sun\* Kudos block + widget

- **FR-015**: The system MUST render the Sun\* Kudos promo block with label "Phong trào ghi nhận", title "Sun\* Kudos", description, image, and a "Chi tiết" button.
- **FR-016**: Clicking the "Chi tiết" button MUST navigate to `/kudos`.
- **FR-017**: The system MUST render the floating widget pill fixed to the bottom-right of the viewport.
- **FR-018**: Clicking the widget pill MUST open an overlay containing exactly two quick-action entries — `Viết Kudo` (navigates to `/kudos/new`) and `Thể lệ SAA` (navigates to `/rules`) — in that order. Closing the overlay follows the same rules as other dropdowns (click outside or press `Esc`).

#### Authentication-aware UI

- **FR-019**: When the visitor is unauthenticated, the system MUST hide the notification bell entirely, keep the avatar/menu trigger visible (with a generic anonymous avatar), and render an anonymous profile dropdown that contains a single `Sign in` action which navigates to `/login`.
- **FR-020**: When the visitor is authenticated, the system MUST fetch the unread notification count from `GET /api/notifications/unread-count` and render the unread-indicator badge on the bell when the count is > 0.
- **FR-021**: Clicking the bell icon MUST open an inline notification overlay anchored to the bell. The overlay MUST display the latest 5 notifications via `GET /api/notifications?limit=5` and a `See all` link that navigates to `/notifications` (the "Tất cả thông báo" screen). Clicking the bell again, clicking outside, or pressing `Esc` MUST close the overlay.
- **FR-022**: Clicking the avatar MUST open the `Dropdown-profile` overlay (Figma frame `721:5223`) with the items `Profile`, `Sign out`, and — if the user's role is `admin` — `Admin Dashboard`.
- **FR-023**: Clicking `Sign out` MUST call `POST /api/auth/signout`, clear the session, and redirect the browser to `/login`.

#### Language switcher

- **FR-024**: Clicking the language switcher (`VN`) MUST open a dropdown with options `VN` and `EN` only.
- **FR-025**: Selecting a language MUST switch all on-page translatable labels to that locale, persist the choice via `PUT /api/i18n/locale` (or a cookie when unauthenticated), and update the button label.
- **FR-026**: If `PUT /api/i18n/locale` fails, the system MUST keep the previous locale and surface a non-blocking error toast.

#### Footer

- **FR-027**: The system MUST render the Footer with logo (left), four nav links (About SAA 2025, Awards Information, Sun\* Kudos, Tiêu chuẩn chung), and the copyright string "Bản quyền thuộc về Sun\* © 2025" (right).
- **FR-028**: All footer links MUST navigate to their corresponding routes (`/`, `/awards`, `/kudos`, `/community-standards`); clicking the footer logo MUST navigate to `/` and scroll to top.

### Technical Requirements

- **TR-001**: The page MUST hit **LCP < 2.5 s**, **INP < 200 ms**, and **CLS < 0.1** at the 75th percentile of production traffic (Constitution §III).
- **TR-002**: Award-card click navigations MUST preserve the `#slug` hash so that `/awards` can perform native anchor scroll.
- **TR-003**: The Countdown component MUST be a Client Component; its initial values MAY be server-rendered, but the tick interval MUST run in the browser.
- **TR-004**: The Header and Footer organisms MUST be implemented as shared components reused by Login, Awards Information, Sun\* Kudos, and admin layouts.
- **TR-005**: All translatable copy MUST come from the i18n catalog (Vietnamese is the default; English is the second supported locale). No copy may be hard-coded into components.
- **TR-006**: All design-token values (colors, spacing, typography) MUST be consumed from the tokens defined in `app/globals.css` per `.momorph/guidelines/frontend.md`. Raw hex/px values MUST NOT appear in component code.
- **TR-007**: `GET /api/notifications/unread-count` MUST be called only after the auth state is known to be `authenticated`; it MUST NOT leak for anonymous visitors.
- **TR-008**: Session detection MUST use the Supabase SSR helper on the server (Constitution §II, §IV); `localStorage`-based session reads are prohibited.
- **TR-009**: All interactive controls MUST be keyboard-operable (Enter/Space to activate, Esc to close overlays) and meet WCAG 2.1 AA contrast for text and non-text UI components.
- **TR-010**: The screen MUST function without horizontal scroll on the smallest supported mobile viewport defined by the constitution.

### Key Entities

- **EventConfig** (static, build-time): `startAt` — ISO-8601 datetime supplied by `NEXT_PUBLIC_EVENT_START_AT`. `venue`, `eventTimeLabel`, and `broadcastNote` are sourced from the i18n catalog. No runtime entity is required.
- **Award**: `{ slug: string, title: string, shortDescription: string, imageRef: string }` — drives the awards grid (6 items). Slug is the kebab-case identifier used in `/awards#{slug}`.
- **User** (auth-only): `{ id, email, displayName, avatarUrl, role: 'user' | 'admin', locale: 'vi' | 'en' }` — drives bell badge visibility, profile-dropdown items, and locale persistence.
- **NotificationSummary** (auth-only): `{ unreadCount: number }` — drives the bell badge.
- **Locale**: enum `'vi' | 'en'`. Default `'vi'`. Persisted server-side per user (authenticated) or in a cookie (anonymous).

---

## Component Behavior _(per design item)_

> Each entry below references the Figma item number (`no`) and the Figma node ID where available.

### Header — A1

| Item | Node ID               | Component                                  | Interaction                                                                                      | Navigation                               | Validation / State                                                                                                                           |
| ---- | --------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| A1   | `2167:9091`           | Header (organism)                          | Container — wires nav + controls                                                                 | —                                        | Sticky/visible at top                                                                                                                        |
| A1.1 | `I2167:9091;178:1033` | Logo button                                | Click → navigate to `/` and scroll to top                                                        | `/`                                      | Always enabled; `alt` text required (a11y)                                                                                                   |
| A1.2 | `I2167:9091;186:1579` | NavLink "About SAA 2025" (selected state)  | Click while active → scroll to top of `/`; hover → hover state; selected state when current page | `/`                                      | `aria-current="page"` when active                                                                                                            |
| A1.3 | `I2167:9091;186:1587` | NavLink "Awards Information" (hover state) | Click → navigate; exposes hover/active/selected states                                           | `/awards`                                | Hover/active/selected states                                                                                                                 |
| A1.5 | `I2167:9091;186:1593` | NavLink "Sun\* Kudos" (normal state)       | Click → navigate                                                                                 | `/kudos`                                 | Hover/active/selected states                                                                                                                 |
| A1.6 | `I2167:9091;186:2101` | NotificationButton                         | Click → open inline overlay anchored to bell (latest 5 + `See all` link)                         | overlay → `/notifications`               | Visible only when authenticated; unread-indicator badge when count > 0; closed via toggle/outside/`Esc`                                      |
| A1.7 | `I2167:9091;186:1696` | LanguageSwitcher (VN)                      | Click → open dropdown with `VN`/`EN`; select option → switch locale + persist                    | overlay                                  | Default value `VN`; only `VN` and `EN` allowed (FR-024)                                                                                      |
| A1.8 | `I2167:9091;186:1597` | ProfileMenuButton                          | Click → open `Dropdown-profile` overlay (frame `721:5223`)                                       | overlay → `/login`, `/profile`, `/admin` | Items vary by auth state: anonymous = `Sign in` (→ `/login`); user = `Profile`, `Sign out`; admin = `Profile`, `Sign out`, `Admin Dashboard` |

### Hero — Keyvisual + Countdown — 3.5 / B1

| Item   | Node ID      | Component                 | Interaction                                              | Navigation | Validation / State                                  |
| ------ | ------------ | ------------------------- | -------------------------------------------------------- | ---------- | --------------------------------------------------- |
| 3.5    | `2167:9027`  | HeroKeyvisual             | Container — background art + content                     | —          | Decorative; no interaction                          |
| B1     | `2167:9035`  | CountdownTime             | Wraps the "Coming soon" label and the 3 tiles            | —          | Static container                                    |
| B1.2   | (text node)  | "Coming soon" label       | None                                                     | —          | Visible only when `now < eventStartAt`              |
| B1.3   | (frame)      | CountdownTimer (organism) | Auto-tick every 60 s; freezes at zero                    | —          | Initial values from env or API; client-side ticking |
| B1.3.1 | (tile)       | CountdownTile DAYS        | Display only                                             | —          | 2-digit zero-padded                                 |
| B1.3.2 | (tile)       | CountdownTile HOURS       | Display only                                             | —          | 2-digit zero-padded                                 |
| B1.3.3 | (tile)       | CountdownTile MINUTES     | Display only                                             | —          | 2-digit zero-padded                                 |
| B2     | `2167:9053`  | EventInfoBlock            | None                                                     | —          | Static; copy from i18n catalog                      |
| B3     | `2167:9062`  | HeroCTAGroup              | Container                                                | —          | —                                                   |
| B3.1   | `2167:9063`  | CTA "ABOUT AWARDS"        | Click → navigate; hover state shown by default in design | `/awards`  | Hover/normal states; keyboard-activatable           |
| B3.2   | `2167:9064`  | CTA "ABOUT KUDOS"         | Click → navigate; normal state shown by default          | `/kudos`   | Hover/normal states; keyboard-activatable           |
| B4     | `5001:14827` | RootFurtherDescription    | None                                                     | —          | Static; copy from i18n catalog                      |

### Awards — C1 / C2

| Item   | Node ID      | Component                            | Interaction                                                           | Navigation                       | Validation / State                |
| ------ | ------------ | ------------------------------------ | --------------------------------------------------------------------- | -------------------------------- | --------------------------------- |
| C1     | `2167:9069`  | SectionHeader (Awards)               | None                                                                  | —                                | Static                            |
| C2     | `5005:14974` | AwardCardGrid                        | Renders 6 cards; responsive (3 cols desktop / 2 cols tablet & mobile) | —                                | 6 items required                  |
| C2.1   | (card frame) | AwardCard "Top Talent"               | Click image/title/"Chi tiết" → navigate; hover → elevate              | `/awards#top-talent`             | —                                 |
| C2.1.1 | (image)      | AwardCardImage                       | Click → navigate (same as parent card)                                | `/awards#top-talent`             | `alt` text required               |
| C2.1.2 | (label)      | AwardCardTitle                       | Click → navigate                                                      | `/awards#top-talent`             | —                                 |
| C2.1.3 | (label)      | AwardCardDescription                 | None                                                                  | —                                | Max 2 lines, ellipsis on overflow |
| C2.1.4 | (button)     | AwardCard "Chi tiết" link            | Click → navigate                                                      | `/awards#top-talent`             | —                                 |
| C2.2   | (card frame) | AwardCard "Top Project"              | Same as C2.1                                                          | `/awards#top-project`            | —                                 |
| C2.3   | (card frame) | AwardCard "Top Project Leader"       | Same as C2.1                                                          | `/awards#top-project-leader`     | —                                 |
| C2.4   | (card frame) | AwardCard "Best Manager"             | Same as C2.1                                                          | `/awards#best-manager`           | —                                 |
| C2.5   | (card frame) | AwardCard "Signature 2025 - Creator" | Same as C2.1                                                          | `/awards#signature-2025-creator` | —                                 |
| C2.6   | (card frame) | AwardCard "MVP"                      | Same as C2.1                                                          | `/awards#mvp`                    | —                                 |

> **Award slug source of truth**: implementation MUST define slugs in a single `awards.config.ts` shared with the Awards Information page and the test suite.

### Sun\* Kudos promo — D1 / D2

| Item | Node ID       | Component                 | Interaction      | Navigation | Validation / State |
| ---- | ------------- | ------------------------- | ---------------- | ---------- | ------------------ |
| D1   | `3390:10349`  | KudosPromoSection         | Container        | —          | —                  |
| D2   | (child frame) | KudosContent              | None             | —          | Static             |
| D2.1 | (child btn)   | KudosCTAButton "Chi tiết" | Click → navigate | `/kudos`   | —                  |

### Floating widget — mms_6

| Item | Node ID      | Component         | Interaction                       | Navigation                       | Validation / State                                                  |
| ---- | ------------ | ----------------- | --------------------------------- | -------------------------------- | ------------------------------------------------------------------- |
| 6    | `5022:15169` | QuickActionWidget | Click → open quick-action overlay | overlay → `/kudos/new`, `/rules` | Fixed bottom-right; meets WCAG 2.5.5 target size on touch viewports |

### Footer — 7

| Item | Node ID                 | Component                      | Interaction                      | Navigation             | Validation / State                  |
| ---- | ----------------------- | ------------------------------ | -------------------------------- | ---------------------- | ----------------------------------- |
| 7    | `5001:14800`            | Footer (organism)              | Container                        | —                      | —                                   |
| 7.1  | `I5001:14800;342:1408`  | FooterLogo                     | Click → navigate + scroll to top | `/`                    | Same as A1.1                        |
| 7.2  | `I5001:14800;342:1410`  | FooterNav "About SAA 2025"     | Click → navigate                 | `/`                    | Same as A1.2                        |
| 7.3  | `I5001:14800;342:1411`  | FooterNav "Awards Information" | Click → navigate                 | `/awards`              | Same as A1.3                        |
| 7.4  | `I5001:14800;342:1412`  | FooterNav "Sun\* Kudos"        | Click → navigate                 | `/kudos`               | Same as A1.5                        |
| 7.5  | `I5001:14800;1161:9487` | FooterNav "Tiêu chuẩn chung"   | Click → navigate                 | `/community-standards` | New destination (medium confidence) |

---

## Data Requirements

### Display fields

| Field                        | Source                                            | Type                     | Notes                                                   |
| ---------------------------- | ------------------------------------------------- | ------------------------ | ------------------------------------------------------- |
| `eventStartAt`               | `NEXT_PUBLIC_EVENT_START_AT` env var (build-time) | string (ISO-8601)        | MUST be parseable; invalid → fallback per FR-009        |
| `venue`                      | i18n catalog                                      | string                   | Default Vietnamese: "Nhà hát nghệ thuật quân đội"       |
| `eventTimeLabel`             | i18n catalog                                      | string                   | Default Vietnamese: "18h30"                             |
| `broadcastNote`              | i18n catalog                                      | string                   | "Tường thuật trực tiếp tại Group Facebook Sun\* Family" |
| `awards[]`                   | Static config (`awards.config.ts`)                | array<Award>             | 6 entries required                                      |
| `awards[i].slug`             | Static config                                     | string (kebab-case)      | Required; must match `/awards` anchors                  |
| `awards[i].title`            | i18n catalog (keyed by slug)                      | string                   | Required                                                |
| `awards[i].shortDescription` | i18n catalog (keyed by slug)                      | string                   | Required; truncated to 2 lines in UI                    |
| `awards[i].imageRef`         | Static config                                     | string                   | Path or reference to thumbnail asset                    |
| `user.displayName`           | `GET /api/users/me` (authenticated only)          | string                   | Optional; drives avatar tooltip                         |
| `user.avatarUrl`             | `GET /api/users/me`                               | string (URL)             | Optional; falls back to initials/placeholder            |
| `user.role`                  | `GET /api/users/me`                               | enum `'user' \| 'admin'` | Drives Admin Dashboard menu item                        |
| `user.locale`                | `GET /api/users/me`                               | enum `'vi' \| 'en'`      | Initial locale for authenticated users                  |
| `unreadCount`                | `GET /api/notifications/unread-count`             | number                   | ≥ 0; `> 0` → render badge                               |

### Input fields

N/A — the homepage contains no form inputs. The only "input" is the language selection in the dropdown (option value), which is constrained to `'vi' | 'en'` (FR-024).

### Validation rules

- Event datetime MUST be valid ISO-8601; if it is not, render `00 / 00 / 00` and hide "Coming soon" (FR-009, Test ID-60).
- `unreadCount` MUST be coerced to a non-negative integer; negative or non-numeric values are treated as `0`.
- Locale value MUST be one of `'vi'` or `'en'`; any other value falls back to default `'vi'`.

### Data relationships and constraints

- The award slug used in `Homepage SAA` MUST match the section anchor on the `Awards Information` page (`zFYDgyj_pD`). Mismatch results in the fallback behavior in FR-014.
- The Header and Footer components MUST be implemented as a single shared source reused across screens that include them.

---

## API Requirements (Predicted)

| Endpoint                          | Method | Purpose                                        | Triggered by                                          | Auth      |
| --------------------------------- | ------ | ---------------------------------------------- | ----------------------------------------------------- | --------- |
| `/api/auth/session`               | GET    | Detect existing Supabase session               | Screen mount (Server Component / middleware)          | No        |
| `/api/users/me`                   | GET    | Load profile (avatarUrl, role, locale)         | Screen mount when session is present                  | Yes       |
| `/api/notifications/unread-count` | GET    | Unread count for the bell badge                | Screen mount (auth-only); refetch on bell-panel close | Yes       |
| `/api/notifications?limit=5`      | GET    | Latest N notifications for the overlay preview | Bell click (US3 #3)                                   | Yes       |
| `/api/auth/signout`               | POST   | Clear session and redirect                     | Profile dropdown → "Sign out"                         | Yes       |
| `/api/i18n/locale`                | PUT    | Persist locale preference                      | Language selection in dropdown (US4 #2)               | Optional¹ |

¹ When the visitor is unauthenticated, the locale is persisted via a cookie set by the same endpoint or by a client-side cookie write — TBD in the plan.

> **Note**: Event datetime is **not** sourced from an API; it is a build-time env var (`NEXT_PUBLIC_EVENT_START_AT`). See FR-006.

> All endpoints above are **predicted** based on screen behavior. Final shape (path, params, response schema) will be locked in `momorph.apispecs`.

---

## State Management

### Local component state

| State                | Type    | Scope              | Purpose                                            |
| -------------------- | ------- | ------------------ | -------------------------------------------------- |
| `countdown`          | object  | CountdownTimer     | `{ days, hours, minutes }` — recomputed every 60 s |
| `isEventStarted`     | boolean | CountdownTimer     | Derived; freezes timer at zero                     |
| `isLanguageMenuOpen` | boolean | LanguageSwitcher   | Toggle dropdown                                    |
| `isProfileMenuOpen`  | boolean | ProfileMenuButton  | Toggle dropdown                                    |
| `isNotificationOpen` | boolean | NotificationButton | Toggle overlay                                     |
| `isWidgetOpen`       | boolean | QuickActionWidget  | Toggle overlay                                     |

### Global state needs

| State         | Store                         | Read/Write | Purpose                                                |
| ------------- | ----------------------------- | ---------- | ------------------------------------------------------ |
| `session`     | Supabase client + `authStore` | Read       | Session presence + user object                         |
| `user`        | `authStore` (Zustand)         | Read       | Drives auth-only UI and admin link                     |
| `locale`      | i18n context                  | Read/Write | Current language; persisted via `PUT /api/i18n/locale` |
| `unreadCount` | TanStack Query cache          | Read       | Bell badge data                                        |

### Cache / invalidation requirements

- `users/me` — fetched on auth root layout; invalidated on `auth state changed` and after `Sign out`.
- `notifications/unread-count` — short stale window; refetch on window focus and after the notification overlay closes.
- `notifications?limit=5` — fetched on bell-click; can reuse cache if reopened within a short window.
- Event datetime is a build-time constant (`NEXT_PUBLIC_EVENT_START_AT`); no cache layer required.

### Optimistic updates

- **Locale switch**: apply new locale immediately in the UI; revert and toast on `PUT /api/i18n/locale` failure (FR-026).
- All other actions on this screen are navigations or overlays; no optimistic behavior required.

---

## API Dependencies

| Endpoint                          | Method | Purpose              | Status              |
| --------------------------------- | ------ | -------------------- | ------------------- |
| `/api/auth/session`               | GET    | Session detection    | Reused              |
| `/api/users/me`                   | GET    | Current user profile | New                 |
| `/api/notifications/unread-count` | GET    | Bell badge           | New                 |
| `/api/notifications?limit=5`      | GET    | Overlay preview list | New                 |
| `/api/auth/signout`               | POST   | Sign out             | New                 |
| `/api/i18n/locale`                | PUT    | Persist locale       | Reused (from Login) |

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All 6 award cards are clickable and successfully deep-link to their corresponding `/awards#{slug}` anchor in **100%** of click attempts during E2E tests.
- **SC-002**: Countdown reflects the configured event datetime ±60 s and decrements correctly on every tick across a 5-minute observation window (covers Test ID-39).
- **SC-003**: Page Core Web Vitals at the 75th percentile of production traffic: **LCP < 2.5 s**, **INP < 200 ms**, **CLS < 0.1**.
- **SC-004**: For authenticated users, the bell badge state matches `unreadCount > 0` within 1 s of page load.
- **SC-005**: Language switch updates **100%** of on-page translatable labels and is persisted across page reloads.
- **SC-006**: Zero CSP / mixed-content / accessibility violations reported by automated checks (axe, Lighthouse) at AA level.
- **SC-007**: All header/footer/award-card navigations resolve without 4xx/5xx errors (covers Test ID-59 — no broken links).

---

## Out of Scope

- Authoring or moderating content (Awards Information detail page, Sun\* Kudos board content, admin screens, profile editing) — handled by their respective specs.
- Visual / CSS specifications (colors, exact pixel values, fonts, shadows, gradients) — those are fetched on-demand at implementation time per the constitution and `momorph.implement` workflow.
- Asset preparation (downloading hero background, logos, award thumbnails, kudos background) — handled at implementation time via `get_media_files` / `list_media_nodes`.
- Detailed notification panel content + interactions (mark-as-read, delete, etc.) — owned by the `Tất cả thông báo` and `View thông báo` specs.
- Detailed dropdown-profile contents and admin landing flow — handled in the admin specs.
- Push / real-time notifications (web push, in-browser real-time updates) — not in this iteration.
- Sharing / social embeds (Open Graph metadata) — covered by a separate SEO/metadata spec.
- iOS variants of the homepage (`OuH1BUTYT0` etc.) — separate scope per SCREENFLOW.

---

## Dependencies

- [x] Constitution document exists (`.momorph/constitution.md`)
- [x] Screen flow documented (`.momorph/contexts/SCREENFLOW.md`) and `homepage-saa.md` screen spec generated
- [ ] API specifications available (`.momorph/API.yml`) — to be produced by `momorph.apispecs` for the endpoints above
- [ ] Database design completed (`.momorph/database.sql`) — only relevant for `event_config`, `notifications`, and `user.locale`; can proceed once those entities are designed
- [ ] Awards configuration source-of-truth (`awards.config.ts`) defined alongside the Awards Information spec (`zFYDgyj_pD`)
- [ ] `Dropdown-profile` overlay spec (frame `721:5223`) finalized — drives Profile / Sign out / Admin Dashboard items consumed here

---

## Notes

- This screen is **behavior-only**. All visual decisions (colors, exact dimensions, typography) are deliberately omitted; implementers MUST fetch them via `query_section` and `get_node` on demand and consume design tokens from `app/globals.css`.
- The hero copy ("Đứng trước bối cảnh thay đổi như vũ bão...", "A tree with deep roots fears no storm", etc.) is preserved verbatim in i18n keys; refer to the Figma `mms_B4_content` group (`5001:14827`) for the canonical Vietnamese source string.
- The countdown's tick interval implementation strategy (e.g., periodic timer vs. requestAnimationFrame with elapsed-minute check) is deferred to the plan, but it MUST tolerate tab backgrounding and clock skew (recompute remaining time from current wall-clock; never accumulate a counter).
- The Header (A1) and Footer (7) are shared across at least three discovered screens (Login, Homepage SAA, and — by design — Awards Information and Sun\* Kudos). They MUST be implemented once and reused, per Constitution §II ("Tech Stack Best Practices").
- The widget pill (mms_6) is a fixed-position floating control; its exact visual dimensions are part of the design tokens consumed at implementation time. Behaviorally, it MUST meet WCAG 2.5.5 target size on touch viewports.
- Test cases from `get_frame_test_cases` (62 scenarios, IDs 0–62) have been folded into the acceptance scenarios and edge cases above; see the source `homepage-saa.md` screen spec for explicit trace.

### Resolved Decisions (locked during `momorph.reviewspecify`)

- **Event datetime source** — build-time env var `NEXT_PUBLIC_EVENT_START_AT` only; no runtime API. Changing the date requires a redeploy.
- **Anonymous avatar (A1.8)** — avatar trigger stays visible; opens an anonymous dropdown containing a single `Sign in` action that routes to `/login`.
- **Notification panel** — inline overlay anchored to the bell showing the latest 5 notifications and a `See all` link that navigates to `/notifications`.
- **Floating widget (mms_6)** — overlay with exactly two entries: `Viết Kudo` → `/kudos/new`, `Thể lệ SAA` → `/rules`.

### Open Items (deferred to plan or to dependent specs)

1. **Footer "Tiêu chuẩn chung" (7.5) target** — design item does not specify a destination. Assumed `/community-standards` (confidence: medium). Needs confirmation when the Community Standards screen spec (`Dpn7C89--r`) is built.
2. **Profile dropdown route targets** — exact paths for `Profile` (`/profile`?) and `Admin Dashboard` (`/admin`?) will be confirmed against the `Dropdown-profile` (`721:5223`) spec.
3. **Award slug catalogue** — slugs proposed in this spec (`top-talent`, `top-project`, `top-project-leader`, `best-manager`, `signature-2025-creator`, `mvp`) must be ratified by the Awards Information spec (`zFYDgyj_pD`) so anchors stay in sync.
4. **Locale persistence for anonymous visitors** — cookie set by `PUT /api/i18n/locale` server-side vs. client-side cookie write. Server-side preferred for SSR consistency; final shape locked in `momorph.plan`.
