# Screen: Hệ thống giải (Awards Information)

## Screen Info

| Property           | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **Figma Frame ID** | `zFYDgyj_pD` (node `313:8436`)                                     |
| **Figma File Key** | `9ypp4enmFmdK3YAFJLIu6C`                                           |
| **MoMorph URL**    | https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD |
| **Screen Group**   | Main Application                                                   |
| **Status**         | discovered                                                         |
| **Discovered At**  | 2026-05-14                                                         |
| **Last Updated**   | 2026-05-14                                                         |

---

## Description

The **Hệ thống giải / Awards Information** page is the canonical detail surface for the six SAA 2025 award categories. It is the navigation target of every "Chi tiết" link on Homepage SAA's awards grid (`/awards#{slug}`).

The page presents:

- A keyvisual banner reusing the ROOT FURTHER imagery for visual continuity with the homepage.
- A title block ("Hệ thống giải thưởng SAA 2025") with a small caption.
- A 2-column body:
  - **Left sticky sidebar** — 6 navigation items mirroring the 6 awards. Active item is highlighted (yellow + underline).
  - **Right content column** — 6 award detail cards in the same order, each anchored by its slug.
- A reusable **Sun\* Kudos promo** block at the bottom of the page.
- The shared homepage footer.

Per the existing test cases (ID-1), this screen is **authenticated-only** — anonymous visitors are redirected to `/login`. This differs from Homepage SAA which is public, and represents a UX trade-off: users clicking award cards on the public homepage must sign in to see details. Treat this as a confirmed design decision.

The active sidebar item is synchronised with the visible content section via two mechanisms:

1. **Click on a sidebar item** → smooth scroll to the matching award card section AND set the item active.
2. **Scroll within the content column** → IntersectionObserver / scroll listener updates the active sidebar item to match the section in view.
3. **Initial load with hashtag** (`/awards#top-talent`) → scroll to the matching anchor on mount + activate the corresponding sidebar item.

---

## Navigation Analysis

### Incoming Navigations (From)

| Source Screen                     | Trigger                                                              | Condition                                  |
| --------------------------------- | -------------------------------------------------------------------- | ------------------------------------------ |
| Homepage SAA                      | Click any award card (image / title / "Chi tiết") → `/awards#{slug}` | Auth required (redirect to /login if anon) |
| Homepage SAA                      | Click header / footer "Awards Information"                           | Auth required                              |
| Any screen with the shared header | Click header "Awards Information"                                    | Auth required                              |
| Any screen with the shared footer | Click footer "Awards Information"                                    | Auth required                              |

### Outgoing Navigations (To)

| Target Screen / Overlay      | Trigger Element                                     | Node ID                                     | Confidence | Notes                                    |
| ---------------------------- | --------------------------------------------------- | ------------------------------------------- | ---------- | ---------------------------------------- |
| Homepage SAA                 | Header logo / footer logo                           | `I313:8440;178:1033` / `I354:4323;342:1408` | high       | Same `logoHref="/"` behavior as Homepage |
| Homepage SAA                 | Header / footer "About SAA 2025"                    | header nav item / `I354:4323;342:1410`      | high       | `/`                                      |
| Sun\* Kudos – Live board     | Header / footer "Sun\* Kudos" / D1 promo "Chi tiết" | various                                     | high       | `/kudos`                                 |
| Tiêu chuẩn cộng đồng         | Footer "Tiêu chuẩn chung"                           | `I354:4323;1161:9487`                       | medium     | `/community-standards`                   |
| Notification overlay         | Bell icon (header)                                  | shared                                      | high       | overlay; auth-only                       |
| Language dropdown            | Language switcher (header)                          | shared                                      | high       | overlay                                  |
| Dropdown-profile             | Avatar (header)                                     | shared                                      | high       | overlay                                  |
| Anchored section (same page) | Sidebar nav items C.1–C.6                           | `313:8460`…`313:8465`                       | high       | In-page scroll to `#{slug}` anchor       |

### Navigation Rules

- **Back behavior**: Browser default; section anchors restored on back/forward.
- **Deep link support**: Yes — `/awards#{slug}` activates the matching card on mount.
- **Auth required**: **Yes** (per Test ID-1). Middleware redirects to `/login?redirectTo=/awards#{slug}`.

---

## Component Schema

### Layout Structure

```
┌──────────────────────────────────────────────────────────┐
│ HEADER (shared) — logo + nav + bell + lang + avatar      │
├──────────────────────────────────────────────────────────┤
│ KEYVISUAL — ROOT FURTHER artwork (decorative)             │
├──────────────────────────────────────────────────────────┤
│ TITLE (A) — caption "Sun* Annual Awards 2025"             │
│             heading "Hệ thống giải thưởng SAA 2025"       │
├──────────────────────────────────────────────────────────┤
│ ┌──────────────┐  ┌────────────────────────────────────┐ │
│ │ SIDEBAR (C)  │  │ CONTENT (D)                        │ │
│ │              │  │ ┌──────────────────────────────┐   │ │
│ │ • Top Talent │  │ │ D.1 Top Talent — img + info │   │ │
│ │ • Top Project│  │ ├──────────────────────────────┤   │ │
│ │ • Project L. │  │ │ D.2 Top Project              │   │ │
│ │ • Best Mgr   │  │ ├──────────────────────────────┤   │ │
│ │ • Signature  │  │ │ D.3 Top Project Leader       │   │ │
│ │ • MVP        │  │ ├──────────────────────────────┤   │ │
│ │              │  │ │ D.4 Best Manager             │   │ │
│ │              │  │ ├──────────────────────────────┤   │ │
│ │ (sticky on   │  │ │ D.5 Signature 2025-Creator   │   │ │
│ │  desktop)    │  │ ├──────────────────────────────┤   │ │
│ │              │  │ │ D.6 MVP                       │   │ │
│ │              │  │ └──────────────────────────────┘   │ │
│ └──────────────┘  └────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────┤
│ SUN* KUDOS PROMO (D1) — same component as homepage        │
├──────────────────────────────────────────────────────────┤
│ FOOTER (shared) — logo + 4 nav links + copyright          │
└──────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
Awards Page (Server Component)
├── HomepageHeader (shared)
├── KeyvisualBanner (Organism — new) — keyvisual image only
├── AwardsPageTitle (Molecule — new) — caption + heading
├── AwardsDetailSection (Organism — new)
│   ├── AwardsSidebarNav (Molecule — new) — sticky sidebar with 6 items
│   │   └── AwardsSidebarItem × 6 (Atom — new) — click + active state
│   └── AwardsContentList (Molecule — new)
│       └── AwardDetailCard × 6 (Organism — new) — img + title + desc + qty + value
├── KudosPromoSection (reuse from homepage)
└── AppFooter variant="homepage" (reuse)
```

### Main Components

| Component            | Type     | Node ID               | Description                                                                | Reusable |
| -------------------- | -------- | --------------------- | -------------------------------------------------------------------------- | -------- |
| HomepageHeader       | Organism | shared                | Reused from Homepage SAA (logo + nav + bell + lang + avatar)               | Yes      |
| KeyvisualBanner      | Organism | `313:8437` GROUP      | Decorative ROOT FURTHER artwork on top; smaller than Homepage hero         | Possibly |
| AwardsPageTitle      | Molecule | `313:8453`            | Caption + main heading                                                     | No       |
| AwardsSidebarNav     | Molecule | `313:8459`            | Sticky 6-item nav; controls scroll position + reflects current section     | No       |
| AwardsSidebarItem    | Atom     | `313:8460`…`313:8465` | Single nav item — click → scroll to anchor + set active; hover → highlight | No       |
| AwardsContentList    | Molecule | `313:8466`            | Wraps the 6 detail sections, each with id matching the award slug          | No       |
| AwardDetailCard      | Organism | `313:8467`…`313:8510` | Image + title + description + quantity + value                             | No       |
| KudosPromoSection    | Organism | `335:12023`           | Reuse exact component from Homepage SAA                                    | Yes      |
| AppFooter (homepage) | Organism | `354:4323`            | Reuse from shared component                                                | Yes      |

---

## Form Fields (If Applicable)

N/A — this is a read-only detail page. No user inputs.

---

## API Mapping

### On Screen Load

| API / Source                         | Method | Purpose                                                               | Response Usage                                          |
| ------------------------------------ | ------ | --------------------------------------------------------------------- | ------------------------------------------------------- |
| Supabase session (middleware)        | —      | Verify the user is authenticated; redirect to `/login` if not         | Gate the page; pass user to header                      |
| `/api/users/me` (Server Action)      | GET    | Resolve current user for the header                                   | Header bell + profile menu                              |
| `/api/notifications/unread-count`    | GET    | Bell badge                                                            | Header                                                  |
| `lib/awards/config.ts` (static)      | n/a    | The 6 award categories — slug + i18n keys + image refs                | Sidebar + content sections derived from the same source |
| `lib/awards/details.ts` (NEW static) | n/a    | Per-award metadata — description, `quantity`, `unit`, `value` strings | Display inside `AwardDetailCard`                        |

The page does **not** make a network call for award content — all six categories are static config (i18n-keyed) extending the existing `lib/awards/config.ts`.

### On User Action

| Action                                  | Behavior                                                                                                              | Backend                 |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| Click sidebar item                      | Smooth-scroll to the matching `#slug` anchor; update `active` state; (optionally) update URL hash with `replaceState` | Client-only; no backend |
| Click "Chi tiết" in Sun\* Kudos promo   | Navigate to `/kudos`                                                                                                  | None                    |
| Header bell / lang / avatar / nav links | Same as Homepage                                                                                                      | Same as Homepage        |

### Error Handling

| Error                                     | UI Action                                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------------- |
| Hashtag does not match any award slug     | Fall back to first award (Top Talent) active; do not scroll; no JS error (Test ID-13) |
| Sun\* Kudos detail navigation fails (5xx) | Standard error page / toast (Test ID-14); no crash                                    |
| Unauthenticated request                   | Middleware redirects to `/login?redirectTo=/awards#{slug}`                            |

---

## State Management

### Local State

| State         | Type    | Initial                              | Purpose                                              |
| ------------- | ------- | ------------------------------------ | ---------------------------------------------------- |
| `activeSlug`  | string  | derived from URL hash or first award | Drives sidebar highlighting + scroll target          |
| `isScrolling` | boolean | false                                | Prevents scroll-listener loop while smooth-scrolling |

### Global State

| State         | Store                        | Read/Write | Purpose                           |
| ------------- | ---------------------------- | ---------- | --------------------------------- |
| `user`        | `authStore` / RSC prop       | Read       | Header personalization            |
| `unreadCount` | server-side fetch + RSC prop | Read       | Bell badge                        |
| `locale`      | i18n cookie                  | Read       | Render labels in current language |

### Cache / Invalidation

- Static award data (`lib/awards/config.ts` + `lib/awards/details.ts`) — no cache; bundled.
- Same `users/me` + `notifications/unread-count` cache as Homepage SAA.

### Optimistic Updates

None — page is read-only.

---

## UI States

### Loading State

- Server-rendered; no client loading skeleton at page level.
- Header is auth-aware; if `getCurrentUserProfile` is slow it can stream after the rest of the page.

### Error State

- Invalid `#slug` → fall back to first award without error.
- 404 navigation from "Chi tiết" → standard `not-found.tsx`.

### Success State

- All 6 award cards render in order; sidebar synchronised.

### Empty State

- Not applicable (always 6 static awards).

---

## Accessibility

| Requirement          | Implementation                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Sidebar nav landmark | `<nav aria-label="Awards categories">` wrapping the sidebar; `<ul>` of items                                                       |
| Active state         | `aria-current="location"` on the active sidebar item (in-page navigation context)                                                  |
| Anchor targets       | Each `AwardDetailCard` is wrapped in a `<section id="{slug}" aria-labelledby="{slug}-heading">`; heading has `id="{slug}-heading"` |
| Smooth scroll        | Uses `scrollIntoView({behavior: 'smooth'})`; respects `prefers-reduced-motion: reduce` → instant scroll                            |
| Keyboard navigation  | Sidebar items are `<a href="#{slug}">` so they participate in tab order and work without JS                                        |
| Focus management     | Clicking a sidebar item focuses the target section heading after scroll completes                                                  |
| Color contrast       | WCAG AA — active item yellow on dark navy meets 4.5:1                                                                              |

---

## Responsive Behavior

| Breakpoint           | Layout Changes                                                                  |
| -------------------- | ------------------------------------------------------------------------------- |
| Mobile (<768 px)     | Sidebar collapses to a horizontal scroll-snap row above the content (chip-like) |
| Tablet (768–1024 px) | 1-column sidebar above content (not sticky)                                     |
| Desktop (≥1024 px)   | 2-column with sticky sidebar on the left                                        |

---

## Analytics Events (Optional)

| Event                  | Trigger                             | Properties               |
| ---------------------- | ----------------------------------- | ------------------------ |
| `awards.page.view`     | Page mount                          | `{ active_slug }`        |
| `awards.sidebar.click` | Click any sidebar item              | `{ from_slug, to_slug }` |
| `awards.kudos.click`   | Click "Chi tiết" inside Kudos promo | —                        |

---

## Implementation Notes

### Dependencies

- Reuse `HomepageHeader`, `KudosPromoSection`, `AppFooter` from Homepage SAA.
- Extend `lib/awards/config.ts` with rich detail metadata (or create `lib/awards/details.ts` and link via shared slug).
- For sticky sidebar + scrollspy: native `IntersectionObserver` API; no external library needed.

### Special Considerations

- **Award slug parity is critical**: Homepage SAA emits links to `/awards#{slug}`. The 6 slugs MUST match exactly between Homepage's `awards.config.ts` and this page's section anchors. Both screens consume the same `lib/awards/config.ts` to enforce this contract.
- **Currency strings** ("7.000.000 VNĐ"): live in the i18n catalogue as raw strings — no number formatting in code. This avoids locale-dependent comma/dot ambiguities.
- **Sidebar sticky behaviour**: limit `position: sticky` to viewport ≥ `lg` to avoid sticking through the entire mobile experience.
- **Route**: use `/awards` (consistent with Homepage SAA's deep links). The Vietnamese URL `/he-thong-giai` from Test ID-0 is treated as a translation note; the canonical path stays `/awards`.

---

## Analysis Metadata

| Property            | Value                                      |
| ------------------- | ------------------------------------------ |
| Analyzed By         | Screen Flow Discovery (momorph.screenflow) |
| Analysis Date       | 2026-05-14                                 |
| Needs Deep Analysis | No — design items already complete         |
| Confidence Score    | High                                       |

### Next Steps

- [ ] Generate `momorph.specify` spec (target: `.momorph/specs/zFYDgyj_pD-he-thong-giai/spec.md`).
- [ ] Build `lib/awards/details.ts` with the 6 categories' quantity + value strings (or extend `awards.config.ts`).
- [ ] Implement `AwardDetailCard`, `AwardsSidebarNav`, page composition.
- [ ] Ratify award slugs against Homepage SAA (`top-talent`, `top-project`, `top-project-leader`, `best-manager`, `signature-2025-creator`, `mvp`).
