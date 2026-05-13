# Screen: Homepage SAA

## Screen Info

| Property           | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **Figma Frame ID** | `i87tDx10uM` (node `2167:9026`)                                    |
| **Figma File Key** | `9ypp4enmFmdK3YAFJLIu6C`                                           |
| **Figma/MoMorph**  | https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM |
| **Screen Group**   | Main Application                                                   |
| **Status**         | discovered                                                         |
| **Discovered At**  | 2026-05-13                                                         |
| **Last Updated**   | 2026-05-13                                                         |

---

## Description

The **Homepage SAA** is the post-login landing page for the **Sun\* Annual Awards 2025** ("ROOT FURTHER") campaign. It functions as the hub that introduces the campaign, counts down to the event ceremony, presents the award categories, promotes the Sun\* Kudos movement, and provides primary entry points into the rest of the application (Awards Information, Sun\* Kudos board, profile/notification menus, language switcher, and the floating quick-action widget).

Authenticated users see a personalized header (notification bell with unread badge, profile/avatar dropdown including `Admin Dashboard` when role = `admin`). Unauthenticated users still see all public content (banner, countdown, award cards, Kudos block, footer) but no notification badge or personalized profile menu.

---

## Navigation Analysis

### Incoming Navigations (From)

| Source Screen         | Trigger                                          | Condition                    |
| --------------------- | ------------------------------------------------ | ---------------------------- |
| Login                 | OAuth callback success                           | Sun\* email domain validated |
| Any screen            | Click header logo / "About SAA 2025" header link | Always                       |
| Any screen            | Click footer logo / footer "About SAA 2025" link | Always                       |
| Profile dropdown      | Click "Home" (if surfaced)                       | Authenticated                |
| Error pages (403/404) | "Return home" link                               | Always                       |

### Outgoing Navigations (To)

| Target Screen / Overlay      | Trigger Element                                 | Node ID                                        | Confidence | Notes                                                                             |
| ---------------------------- | ----------------------------------------------- | ---------------------------------------------- | ---------- | --------------------------------------------------------------------------------- |
| Homepage SAA (self, top)     | Header logo (A1.1) / Footer logo (7.1)          | `I2167:9091;178:1033` / `I5001:14800;342:1408` | high       | Scroll to top                                                                     |
| Homepage SAA (`#about`)      | Header "About SAA 2025" (A1.2)                  | `I2167:9091;186:1579`                          | high       | Active link; click while active scrolls to top                                    |
| Awards Information           | Header "Awards Information" (A1.3) / Footer 7.3 | `I2167:9091;186:1587` / `I5001:14800;342:1411` | high       | `/awards`                                                                         |
| Sun\* Kudos - Live board     | Header "Sun\* Kudos" (A1.5) / Footer 7.4        | `I2167:9091;186:1593` / `I5001:14800;342:1412` | high       | `/kudos`                                                                          |
| Tiêu chuẩn cộng đồng         | Footer "Tiêu chuẩn chung" (7.5)                 | `I5001:14800;1161:9487`                        | medium     | `/community-standards`                                                            |
| Awards Information (#slug)   | Award card (image, title, "Chi tiết") C2.1–C2.6 | `5005:14974` (group) and children              | high       | `/awards#top-talent`, `/awards#top-project`, etc. Browser auto-scrolls to anchor. |
| Sun\* Kudos detail           | "Chi tiết" CTA in D2 block (D2.1)               | (under `3390:10349`)                           | high       | `/kudos`                                                                          |
| Awards Information           | CTA "ABOUT AWARDS" (B3.1)                       | `2167:9063`                                    | high       | `/awards`                                                                         |
| Sun\* Kudos - Live board     | CTA "ABOUT KUDOS" (B3.2)                        | `2167:9064`                                    | high       | `/kudos`                                                                          |
| Notification panel (overlay) | Bell button (A1.6)                              | `I2167:9091;186:2101`                          | high       | Opens dropdown overlay; no route change. Authenticated only.                      |
| Language dropdown (overlay)  | "VN" button (A1.7)                              | `I2167:9091;186:1696`                          | high       | Opens `Dropdown-ngôn ngữ`; selecting switches locale via `PUT /api/i18n/locale`   |
| Dropdown-profile (overlay)   | Avatar button (A1.8)                            | `I2167:9091;186:1597` → `721:5223`             | high       | Profile / Sign out / Admin Dashboard (admin only)                                 |
| Quick-action menu (overlay)  | Floating widget button (mms_6)                  | `5022:15169`                                   | medium     | Reveals "Viết Kudo" / "Thể lệ SAA" shortcuts                                      |

### Navigation Rules

- **Back behavior**: Browser default; deep-linked `#section` anchors are preserved.
- **Deep link support**: Yes — `/` is the homepage, anchors `#about`, `#awards`, `#kudos` and award-slug anchors are valid.
- **Auth required**: No (public content). Personalized UI (bell badge, profile dropdown items, admin link) requires authentication.

---

## Component Schema

### Layout Structure

```
┌──────────────────────────────────────────────────────────┐
│ HEADER (A1)                                              │
│  [Logo] [About SAA 2025*] [Awards Info] [Sun* Kudos]      [🔔] [VN ▾] [👤]
├──────────────────────────────────────────────────────────┤
│ KEY VISUAL / HERO (3.5)                                  │
│           ROOT FURTHER (large logotype)                  │
│              Coming soon                                  │
│         ┌────┬────┬────┐                                 │
│         │ DD │ HH │ MM │   ← Countdown (B1)              │
│         └────┴────┴────┘                                 │
│   Thời gian: 18h30   Địa điểm: Nhà hát nghệ thuật QĐ     │
│   Tường thuật trực tiếp tại Group Facebook Sun* Family   │
│   [ABOUT AWARDS]   [ABOUT KUDOS]                         │
│                                                          │
│   Root Further description (B4)                          │
├──────────────────────────────────────────────────────────┤
│ AWARDS GRID (C1, C2)                                     │
│   "Sun* annual awards 2025 — Hệ thống giải thưởng"       │
│   ┌──────┐ ┌──────┐ ┌──────┐                             │
│   │ Top  │ │ Top  │ │ Top  │                             │
│   │Talent│ │Project│ │P.Lead│  ← 3 cols desktop / 2 mobile│
│   └──────┘ └──────┘ └──────┘                             │
│   ┌──────┐ ┌──────┐ ┌──────┐                             │
│   │ Best │ │Signat│ │ MVP  │                             │
│   │ Mgr  │ │Creator│ │      │                            │
│   └──────┘ └──────┘ └──────┘                             │
├──────────────────────────────────────────────────────────┤
│ SUN* KUDOS PROMO (D1 / D2)                               │
│   "Phong trào ghi nhận — Sun* Kudos"  [Chi tiết →]       │
├──────────────────────────────────────────────────────────┤
│ FOOTER (7)                                               │
│  [Logo]  About SAA 2025 / Awards Info / Sun* Kudos / TCC  © 2025
└──────────────────────────────────────────────────────────┘
                                          [✏️ / SAA] ← Widget (6) fixed bottom-right
```

### Component Hierarchy

```
Homepage (Page Server Component)
├── Header (Organism, shared) — A1
│   ├── Logo (Atom) — A1.1
│   ├── NavLinks (Molecule)
│   │   ├── NavLink "About SAA 2025" (selected) — A1.2
│   │   ├── NavLink "Awards Information" — A1.3
│   │   └── NavLink "Sun* Kudos" — A1.5
│   └── HeaderControls (Molecule)
│       ├── NotificationButton (Molecule, auth-only) — A1.6
│       ├── LanguageSwitcher (Molecule) — A1.7
│       └── ProfileMenuButton (Molecule, auth-only) — A1.8
├── HeroSection (Organism) — 3.5 Keyvisual
│   ├── HeroBackground (Atom)
│   ├── RootFurtherLogotype (Atom)
│   ├── ComingSoonLabel (Atom) — B1.2
│   ├── CountdownTimer (Organism, Client Component) — B1 / B1.3
│   │   ├── CountdownTile "DAYS" — B1.3.1
│   │   ├── CountdownTile "HOURS" — B1.3.2
│   │   └── CountdownTile "MINUTES" — B1.3.3
│   ├── EventInfoBlock (Molecule) — B2
│   ├── HeroCTAGroup (Molecule) — B3
│   │   ├── CTAButton "ABOUT AWARDS" — B3.1
│   │   └── CTAButton "ABOUT KUDOS" — B3.2
│   └── RootFurtherDescription (Molecule) — B4
├── AwardsGridSection (Organism) — C
│   ├── SectionHeader — C1
│   └── AwardCardGrid — C2
│       ├── AwardCard "Top Talent" — C2.1
│       ├── AwardCard "Top Project" — C2.2
│       ├── AwardCard "Top Project Leader" — C2.3
│       ├── AwardCard "Best Manager" — C2.4
│       ├── AwardCard "Signature 2025 - Creator" — C2.5
│       └── AwardCard "MVP" — C2.6
├── KudosPromoSection (Organism) — D1 / D2
│   ├── KudosContent (Molecule) — D2
│   └── KudosCTAButton "Chi tiết" — D2.1
├── QuickActionWidget (Organism, Client Component, fixed) — mms_6
└── Footer (Organism, shared) — 7
    ├── Logo — 7.1
    └── FooterNavLinks (7.2–7.5)
```

### Main Components

| Component          | Type     | Node ID                 | Description                                                            | Reusable |
| ------------------ | -------- | ----------------------- | ---------------------------------------------------------------------- | -------- |
| Header             | Organism | `2167:9091`             | Shared across pages; renders nav, language, notification, profile      | Yes      |
| Footer             | Organism | `5001:14800`            | Shared across pages; logo + nav + copyright                            | Yes      |
| Hero Keyvisual     | Organism | `2167:9027`/`2167:9030` | Page-specific hero — title, countdown, CTA, description                | No       |
| CountdownTimer     | Organism | `2167:9035`             | Client component (ticks every minute, hides "Coming soon" at zero)     | Possibly |
| AwardCard          | Molecule | `5005:14974`            | Reusable grid card (image + title + description + "Chi tiết" link)     | Yes      |
| KudosPromoSection  | Organism | `3390:10349`            | Promotional block with image + CTA                                     | No       |
| QuickActionWidget  | Organism | `5022:15169`            | Floating bottom-right action menu                                      | Yes      |
| NotificationButton | Molecule | `I2167:9091;186:2101`   | Bell icon + red unread badge                                           | Yes      |
| LanguageSwitcher   | Molecule | `I2167:9091;186:1696`   | "VN" toggle opening language dropdown                                  | Yes      |
| ProfileMenuButton  | Molecule | `I2167:9091;186:1597`   | Avatar opening profile dropdown (links to `Dropdown-profile` 721:5223) | Yes      |

---

## Form Fields (If Applicable)

N/A — Homepage SAA contains no forms. The only user inputs are click/keyboard activations on buttons and links.

---

## API Mapping

### On Screen Load

| API                               | Method | Purpose                                                                  | Response Usage                                       |
| --------------------------------- | ------ | ------------------------------------------------------------------------ | ---------------------------------------------------- |
| `/api/auth/session`               | GET    | Detect existing Supabase session                                         | Switch UI to authenticated mode (bell, profile menu) |
| `/api/users/me`                   | GET    | Load profile (avatar, role) — authenticated only                         | Render avatar, decide whether to show Admin item     |
| `/api/event/config`               | GET    | Fetch event start datetime (ISO-8601) and locations/labels (or env-only) | Initialize countdown target                          |
| `/api/notifications/unread-count` | GET    | Unread notification badge — authenticated only                           | Badge dot on bell                                    |

> Note: Event start datetime is described as an env-configurable value in the design notes. The API call is optional if the value is shipped as a compile-time env var; if event date is editable by admins via Admin Setting, an API is required.

### On User Action

| Action                                 | API                  | Method | Request Body                        | Response                            |
| -------------------------------------- | -------------------- | ------ | ----------------------------------- | ----------------------------------- |
| Switch language (VN ↔ EN)              | `/api/i18n/locale`   | PUT    | `{ locale }`                        | `{ ok: true }`; client reloads/i18n |
| Click "ABOUT AWARDS" / "ABOUT KUDOS"   | —                    | —      | (route navigation)                  | —                                   |
| Click award card / "Chi tiết"          | —                    | —      | (route navigation `/awards#{slug}`) | —                                   |
| Click "Sun\* Kudos – Chi tiết"         | —                    | —      | (route navigation `/kudos`)         | —                                   |
| Open notifications panel               | `/api/notifications` | GET    | `?limit=20`                         | List of notifications               |
| Open profile dropdown                  | —                    | —      | (uses cached user)                  | —                                   |
| Click "Sign out" (in profile dropdown) | `/api/auth/signout`  | POST   | —                                   | 204 → redirect `/login`             |
| Click widget button                    | —                    | —      | (opens local overlay)               | —                                   |

### Error Handling

| Error Code               | Source              | Message / UI Action                                                                 |
| ------------------------ | ------------------- | ----------------------------------------------------------------------------------- |
| 401 on `/users/me`       | Session expired     | Drop to unauthenticated mode (hide bell/profile dropdown items); keep page rendered |
| 5xx on `/event/config`   | Server error        | Show countdown as `--`/`00` and hide "Coming soon"; log; do not block other content |
| Invalid event datetime   | Bad env / API value | Render fallback "00 00 00", hide "Coming soon"; do not crash (see test ID-60)       |
| 5xx on language switch   | Server error        | Keep current locale, show non-blocking toast "Không thể đổi ngôn ngữ, thử lại sau"  |
| Broken hashtag (no slug) | Stale link          | Navigate to `/awards` without auto-scroll (see test ID-62)                          |

---

## State Management

### Local State

| State                | Type    | Initial       | Purpose                                                      |
| -------------------- | ------- | ------------- | ------------------------------------------------------------ |
| `countdown`          | object  | `{ d, h, m }` | Current remaining time; ticked every 60 s                    |
| `isLanguageMenuOpen` | boolean | `false`       | Toggle language dropdown                                     |
| `isProfileMenuOpen`  | boolean | `false`       | Toggle profile dropdown                                      |
| `isNotificationOpen` | boolean | `false`       | Toggle notification panel                                    |
| `isWidgetOpen`       | boolean | `false`       | Toggle floating widget actions                               |
| `isEventStarted`     | boolean | derived       | When `true`, hide "Coming soon" and freeze countdown at `00` |

### Global State

| State         | Store                 | Read/Write | Purpose                                                |
| ------------- | --------------------- | ---------- | ------------------------------------------------------ |
| `user`        | `authStore` (Zustand) | Read       | Decide auth-only UI + admin link                       |
| `unreadCount` | TanStack Query cache  | Read       | Notification badge                                     |
| `locale`      | i18n context          | Read/Write | Current language; persisted via `PUT /api/i18n/locale` |

### Cache / Invalidation

- `/api/users/me` — cached on auth root layout; invalidated on sign-out or `auth state changed` event.
- `/api/notifications/unread-count` — refetch on focus + after notification panel close.
- `/api/event/config` — long-lived (e.g., `staleTime: 1h`); can be revalidated via Admin Setting webhook.

---

## UI States

### Loading State

- Hero copy + skeleton tiles for the countdown if `/api/event/config` is in flight.
- Award grid is static content (no API), so no loading state.
- Notification badge appears only when unread count > 0 (lazy fetch; no spinner on the bell itself).

### Error State

- Countdown: fallback `00 / 00 / 00` and hide "Coming soon" if event datetime is invalid.
- Language switch: toast on failure.
- Notification fetch: silent failure for the badge; full panel shows inline error with retry.

### Success State

- Countdown ticks every minute, decrements down to 00.
- After language change: locale applied, dropdown closes, all on-screen labels swap.
- After sign-out: redirect to `/login`.

### Empty State

- Award grid is fixed content (6 categories) — no empty state expected; if a category is misconfigured, show placeholder card with disabled link.

---

## Accessibility

| Requirement            | Implementation                                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Focus management       | Logical tab order: Logo → nav links → bell → language → avatar → hero CTAs → award cards → kudos CTA → footer                             |
| Keyboard navigation    | All dropdowns (language, profile, notification, widget) open on `Enter`/`Space`, close on `Esc` (test IDs 33–35)                          |
| Screen reader          | `aria-label="Sun* SAA homepage"` on logo; `aria-current="page"` on active nav link; bell has `aria-label="Notifications, {count} unread"` |
| Countdown announcement | Use `aria-live="polite"` on countdown region; announce only when minutes change, not every second                                         |
| Color contrast         | WCAG AA — selected nav link must keep 4.5:1 against header background                                                                     |
| Touch targets          | All header icons ≥44×44 CSS px; widget pill is 105×64                                                                                     |
| Reduced motion         | Hero animations / award-card hover effects respect `prefers-reduced-motion`                                                               |

---

## Responsive Behavior

| Breakpoint           | Layout Changes                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------- |
| Mobile (<768 px)     | Hero CTAs stacked vertically; award grid 2 columns; event info block wraps to multiple lines |
| Tablet (768–1024 px) | Award grid 2 columns; header nav links may collapse into a menu (TBD with design)            |
| Desktop (≥1024 px)   | Award grid 3 columns; full inline header                                                     |
| Wide (≥1440 px)      | Same as desktop; max content width enforced for hero                                         |

---

## Analytics Events (Optional)

| Event               | Trigger                           | Properties                                 |
| ------------------- | --------------------------------- | ------------------------------------------ |
| `screen_view`       | On mount                          | `{ screen: "homepage" }`                   |
| `cta_click`         | ABOUT AWARDS / ABOUT KUDOS click  | `{ cta: "about_awards" \| "about_kudos" }` |
| `award_card_click`  | Click on award card or "Chi tiết" | `{ award_slug }`                           |
| `language_change`   | Locale selected                   | `{ from, to }`                             |
| `notification_open` | Bell click                        | `{ unread_count }`                         |
| `widget_open`       | Quick-action widget click         | —                                          |
| `countdown_zero`    | Countdown reaches `00 00 00`      | —                                          |

---

## Implementation Notes

### Dependencies

- Routing: Next.js App Router (`app/page.tsx` for the homepage route).
- State: Zustand for ephemeral UI state (dropdowns), TanStack Query for `users/me` & notifications.
- i18n: `next-intl` (or equivalent) with locales `vi` (default), `en`, possibly `ja`.
- Date math: native `Intl.DateTimeFormat` / `Date` plus a small `diff(dateA, dateB)` helper; no `moment`.
- Image: `next/image` for award thumbnails and hero background; `priority` for LCP-critical hero asset.

### Special Considerations

- **Countdown component MUST be a Client Component**. Server-rendering the initial values is fine, but the tick interval lives in the browser.
- **Event datetime configuration**: source via env (`NEXT_PUBLIC_EVENT_START_AT`) or `/api/event/config`. Decision deferred to plan.
- **Award slugs** must be defined in a single source (e.g., `app/(marketing)/awards/awards.config.ts`) and shared between Homepage SAA, Awards Information, and the test suite, so hashtag deep links stay in sync.
- **Hero performance**: hero image is large; preload + AVIF/WebP variants; LCP target < 2.5 s.
- **Shared Header/Footer**: extract from Login screen spec — same `186:1602` (Header) and `342:1427` (Footer) components are reused.

---

## Analysis Metadata

| Property            | Value                                      |
| ------------------- | ------------------------------------------ |
| Analyzed By         | Screen Flow Discovery (momorph.screenflow) |
| Analysis Date       | 2026-05-13                                 |
| Needs Deep Analysis | No — design items already detailed         |
| Confidence Score    | High                                       |

### Next Steps

- [ ] Generate detailed spec via `momorph.specify` (target: `.momorph/specs/i87tDx10uM-homepage-saa/spec.md`).
- [ ] Decide event-date source: env var vs `/api/event/config` (capture in plan).
- [ ] Process Awards Information (`zFYDgyj_pD`) next so hashtag deep-link contracts align.
- [ ] Process Sun\* Kudos – Live board (`MaZUn5xHXZ`).
- [ ] Confirm `Dropdown-profile` (`721:5223`) and `Dropdown-ngôn ngữ` overlay specs against this screen's edges.
