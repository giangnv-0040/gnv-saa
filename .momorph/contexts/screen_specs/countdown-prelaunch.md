# Screen: Countdown - Prelaunch page

## Screen Info

| Property           | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **Figma Frame ID** | 2268:35127                                                         |
| **Figma Link**     | https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/8PJQswPZmU |
| **Screen Group**   | Public / Landing                                                   |
| **Status**         | discovered                                                         |
| **Discovered At**  | 2026-05-14                                                         |
| **Last Updated**   | 2026-05-14                                                         |

---

## Description

Full-bleed pre-event landing page shown to **all visitors** (authenticated or anonymous) **before the official campaign launch**. The page presents the campaign artwork as a hero background image and surfaces a single piece of information: a live countdown to the event start datetime, anchored by the headline "Sự kiện sẽ bắt đầu sau" (literally: "The event will start in"). Three numeric tiles count down `DAYS`, `HOURS`, `MINUTES` (no seconds tile in the design, matching the Homepage SAA countdown granularity).

This screen is the **prelaunch state** of the application — when the current server time is earlier than `NEXT_PUBLIC_EVENT_START_AT`, **every public route should redirect to (or render) this screen instead of normal site content**, so that no SAA feature (kudos, awards, profile, etc.) is reachable until launch. Once the timer reaches `00 / 00 / 00`, the app transitions to the regular Homepage SAA flow.

There are **no interactive elements**, **no header**, and **no footer** in the Figma frame — it is intentionally minimal. Language switching, sign-in, and all navigation affordances are deliberately omitted during prelaunch.

---

## Navigation Analysis

### Incoming Navigations (From)

| Source Screen                                | Trigger                                                     | Condition                                                     |
| -------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| App launch / direct visit to any public path | Server-side check `now() < NEXT_PUBLIC_EVENT_START_AT`      | Show prelaunch page instead of requested route                |
| Login page                                   | Auth callback succeeds during prelaunch window              | Even authenticated users are gated until the countdown hits 0 |
| Middleware short-circuit                     | Any in-scope path (`/`, `/awards`, `/kudos`, `/profile`, …) | While `prelaunch` flag is `true`                              |

### Outgoing Navigations (To)

| Target Screen | Trigger Element                  | Node ID    | Confidence | Notes                                                                                                                                                           |
| ------------- | -------------------------------- | ---------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Homepage SAA  | Countdown reaches `00 / 00 / 00` | 2268:35136 | high       | Client-side: when remaining time hits zero the page reloads / `router.refresh()` so the next render sees `prelaunch=false`. Server-side: same condition flips.  |
| (none others) | —                                | —          | high       | The Figma frame has zero links, buttons, or anchors. No header/footer, no language switcher, no sign-in CTA. Anonymous and authenticated users see the same UI. |

### Navigation Rules

- **Back behavior**: No history mutation (single screen). Browser back button leaves the site.
- **Deep link support**: All public paths funnel here while prelaunch is active; the originally requested URL is **not** preserved as a redirect query (no need — every route would resolve here anyway).
- **Auth required**: **No**. The page is public, but it also overrides authenticated routes — i.e. the app is **closed** during prelaunch regardless of session.
- **Robots / SEO**: Should expose `<meta name="robots" content="noindex">` until launch (TBD with product).

---

## Component Schema

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│   MM_MEDIA_BG Image  (full-bleed campaign artwork)       │
│   + Cover (dark gradient overlay for legibility)         │
│                                                          │
│   ┌─────────────────────────────────────────────┐        │
│   │                                              │        │
│   │        Sự kiện sẽ bắt đầu sau                │        │
│   │                                              │        │
│   │      ┌────┐   ┌────┐   ┌────┐                │        │
│   │      │ 00 │   │ 05 │   │ 20 │                │        │
│   │      └────┘   └────┘   └────┘                │        │
│   │       DAYS    HOURS    MINUTES               │        │
│   │                                              │        │
│   └─────────────────────────────────────────────┘        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

Canvas: 1512 × ~900 viewport. Hero block "Bìa" is absolutely positioned, centered, with `padding: 96px 144px`, `gap: 120px` between heading and timer.

### Component Hierarchy

```
PrelaunchPage (Screen, Server Component shell)
├── BackgroundMedia (Atom)
│   ├── MM_MEDIA_BG Image (RECTANGLE 2268:35129) — full-bleed campaign artwork
│   └── Cover (RECTANGLE 2268:35130) — dark gradient overlay
└── PrelaunchHero / Bìa (Organism, 2268:35131)
    └── Frame 487 (Layout group, 2268:35132)
        └── Frame 523 (Layout group, 2268:35135)
            └── Countdown time (Organism, 2268:35136)
                ├── Headline TEXT (Atom, 2268:35137) — "Sự kiện sẽ bắt đầu sau"
                └── Time (Molecule group, 2268:35138)
                    ├── 1_Days  (CountdownTile, 2268:35139)
                    │   ├── Frame 485 — digit pair
                    │   └── "DAYS" label (Atom, 2268:35143)
                    ├── 2_Hours (CountdownTile, 2268:35144)
                    │   ├── Frame 485 — digit pair
                    │   └── "HOURS" label (Atom, 2268:35148)
                    └── 3_Minutes (CountdownTile, 2268:35149)
                        ├── Frame 485 — digit pair
                        └── "MINUTES" label (Atom, 2268:35153)
```

### Main Components

| Component       | Type     | Node ID                              | Description                                                                         | Reusable                                                              |
| --------------- | -------- | ------------------------------------ | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| BackgroundMedia | Atom     | 2268:35129 / 2268:35130              | Full-bleed campaign artwork + dark cover overlay                                    | No (page-specific)                                                    |
| PrelaunchHero   | Organism | 2268:35131                           | Centered hero with heading + timer; no other content                                | No                                                                    |
| Headline        | Atom     | 2268:35137                           | "Sự kiện sẽ bắt đầu sau" — Montserrat 36/48 700, white                              | Yes (text style)                                                      |
| CountdownTimer  | Organism | 2268:35136                           | Client component that ticks every minute; emits `countdown_zero` when remaining ≤ 0 | **Yes** — same component used on Homepage SAA hero (different layout) |
| CountdownTile   | Molecule | 2268:35139 / 2268:35144 / 2268:35149 | One unit: digit pair + label (DAYS / HOURS / MINUTES)                               | **Yes** — shared with Homepage SAA                                    |

---

## Form Fields

N/A — this screen has no inputs, no forms, no controls.

---

## API Mapping

### On Screen Load

| API | Method | Purpose | Response Usage                                                                                                                                    |
| --- | ------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| —   | —      | None    | Event start datetime is read from build-time env var `NEXT_PUBLIC_EVENT_START_AT` (ISO-8601), same source as Homepage SAA countdown. No API call. |

### On User Action

No user actions — the page is read-only.

| Action                              | API | Method | Request Body | Response                                                                                           |
| ----------------------------------- | --- | ------ | ------------ | -------------------------------------------------------------------------------------------------- |
| Countdown reaches `00:00:00` (auto) | —   | —      | —            | Client: `router.refresh()` / hard reload so middleware re-evaluates and Homepage SAA renders next. |

### Error Handling

| Error Code / Condition                                   | Message                   | UI Action                                                                                   |
| -------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_EVENT_START_AT` missing or invalid ISO-8601 | (no user-visible message) | Render `--/--/--` placeholders; log to monitoring; do NOT block the page; do NOT redirect.  |
| Server clock drift > 1 min vs client                     | —                         | Trust **server-rendered** initial values; client merely decrements; minor drift acceptable. |

---

## State Management

### Local State

| State            | Type    | Initial                           | Purpose                                         |
| ---------------- | ------- | --------------------------------- | ----------------------------------------------- |
| `targetAt`       | Date    | from `NEXT_PUBLIC_EVENT_START_AT` | Immutable target datetime (UTC)                 |
| `remaining`      | object  | server-computed `{ d, h, m }`     | Decremented every 60 s by `setInterval`         |
| `isEventStarted` | boolean | derived (`remaining.total <= 0`)  | When `true`, trigger transition to Homepage SAA |

### Global State

| State       | Store    | Read/Write | Purpose                                                                             |
| ----------- | -------- | ---------- | ----------------------------------------------------------------------------------- |
| `prelaunch` | (server) | Read       | Server-side flag derived from env + `now()`. Drives middleware routing decision.    |
| `authStore` | Zustand  | —          | Not consumed on this screen; even an authenticated user sees the same prelaunch UI. |

---

## UI States

### Loading State

- Server-renders initial countdown values; no client-side loading state for "data".
- Background image may use Next.js `<Image priority>` to avoid LCP flash; show solid dark backdrop until the hero artwork is decoded.

### Error State

- Invalid / missing env → render `--/--/--` placeholders silently (no user-facing error). Log to Sentry / monitoring.

### Success State

- N/A — there is no "submission" success. The transition out is `countdown_zero` → render `Homepage SAA`.

### Empty State

- N/A.

---

## Accessibility

| Requirement         | Implementation                                                                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focus management    | No focusable elements on the page. Page `<main>` has `tabindex="-1"` so screen-reader users land on the headline.                                               |
| Keyboard navigation | None required.                                                                                                                                                  |
| Screen reader       | `aria-live="polite"` region on the countdown wrapper; announce when **minutes** change only (not every tick); read full label `"5 hours 20 minutes remaining"`. |
| Color contrast      | Headline + numeric digits use pure white (`#FFFFFF`) on dark artwork + cover gradient — should meet WCAG AA on the cover area (TBD verify).                     |
| Reduced motion      | No animations beyond text re-render — safe by default.                                                                                                          |
| Locale              | Headline is currently Vietnamese (`Sự kiện sẽ bắt đầu sau`); i18n key planned: `prelaunch.heading` + `prelaunch.units.{days,hours,minutes}`.                    |

---

## Responsive Behavior

| Breakpoint           | Layout Changes                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| Mobile (<768 px)     | Stack tiles in a row but scale digits down (~48 px); reduce headline to ~24/32; reduce hero padding to 24 px. |
| Tablet (768–1024 px) | Maintain horizontal tile row; headline ~32 px; tile digits ~80–96 px.                                         |
| Desktop (>1024 px)   | As per Figma: headline 36 / 48, three tiles in a row with 60 px gap, hero padding 96 / 144.                   |
| Background artwork   | `object-fit: cover` on `MM_MEDIA_BG` so the campaign artwork fills the viewport at every aspect ratio.        |

---

## Analytics Events

| Event            | Trigger                             | Properties                      |
| ---------------- | ----------------------------------- | ------------------------------- |
| `screen_view`    | On mount                            | `{ screen: "prelaunch" }`       |
| `prelaunch_view` | On mount, once per session          | `{ remaining_minutes: number }` |
| `countdown_zero` | Remaining time reaches 0            | `{ source: "prelaunch" }`       |
| `prelaunch_exit` | After countdown hits 0, app reloads | —                               |

---

## Design Tokens

| Token            | Value            | Usage                                           |
| ---------------- | ---------------- | ----------------------------------------------- |
| `--bg-cover`     | gradient overlay | Dark vignette atop the campaign artwork         |
| `--text-on-art`  | `#FFFFFF`        | Headline + numeric digits + unit labels         |
| `--font-heading` | `Montserrat 700` | All on-screen text (36 px / 48 px line-height)  |
| Hero gap         | 120 px           | Between heading block and (Frame 487 internals) |
| Tile row gap     | 60 px            | Between DAYS / HOURS / MINUTES tiles            |
| Tile column gap  | 21 px            | Between digit pair and unit label inside a tile |

---

## Implementation Notes

### Dependencies

- Countdown logic: reuse existing `lib/event/config.ts` (`getEventStartAt()`) and `useCountdown` hook backing the Homepage SAA `CountdownTimer`.
- Background: Next.js `<Image priority placeholder="blur">` for the campaign artwork.
- Routing: prelaunch gating should live in `middleware.ts` so SEO and partial SSR are consistent.

### Special Considerations

- **Routing strategy (decide in `momorph.plan`)**: two viable approaches
  1. **Single page swap**: Middleware detects `prelaunch=true` and rewrites every public path to `/prelaunch`. The Homepage SAA + all feature routes become unreachable until launch.
  2. **Component swap**: `app/page.tsx` (and other public pages) render `<PrelaunchPage />` when `prelaunch` is true, otherwise the real content. Heavier per-route, but no rewrites.
     Recommendation: **(1) middleware rewrite** for simplicity and to guarantee no leakage.
- The screen has **no seconds tile** — only DAYS / HOURS / MINUTES. The 60-second tick interval is the right cadence.
- **Initial render must be SSR-stable** (server computes `remaining`); the client only takes over for live ticking. This avoids the FOUC of seeing `--/--/--` on first paint.
- **Transition-to-launch behavior**: when the countdown reaches zero on a connected client, perform `router.refresh()` (or `window.location.reload()`) so middleware re-evaluates the `prelaunch` flag and the user lands on the real Homepage SAA. Do **not** client-side mutate the UI to "open" the app — middleware must re-check.
- **Background asset**: `MM_MEDIA_BG Image` likely points to a Figma-hosted media file (campaign hero). Download via `get_media_file` during implementation and store under `public/prelaunch/`.

---

## Analysis Metadata

| Property            | Value                 |
| ------------------- | --------------------- |
| Analyzed By         | Screen Flow Discovery |
| Analysis Date       | 2026-05-14            |
| Needs Deep Analysis | No                    |
| Confidence Score    | High                  |

### Next Steps

- [ ] Run `momorph.specs` to lock validation rules (digit zero-padding, plural form for `DAYS=1`, etc.).
- [ ] Decide routing strategy (middleware rewrite vs component swap) in `momorph.plan`.
- [ ] Confirm with product whether `seconds` should be added before launch.
- [ ] Download `MM_MEDIA_BG` artwork (node `2268:35129`) and store under `public/prelaunch/`.
- [ ] Add `<meta robots="noindex">` and skip-sitemap rule while prelaunch is active.
- [ ] Wire `prelaunch` middleware: `if (isPrelaunch() && !pathname.startsWith('/_next')) rewrite('/prelaunch')`.
