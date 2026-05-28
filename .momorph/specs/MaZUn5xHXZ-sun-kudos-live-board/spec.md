# Feature Specification: Sun\* Kudos - Live board

**Frame ID**: `MaZUn5xHXZ`
**Frame Name**: `Sun* Kudos - Live board`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**Route**: `/kudos`
**Created**: 2026-05-20
**Status**: Draft

---

## Overview

Sun* Kudos - Live board (`/kudos`) is the public, authenticated feed of every kudo sent during
the Sun* Annual Awards 2025 event. It surfaces four parallel views on a single page:

- **Quick capture** at the top — a pill-shaped entry point that opens the existing Viết Kudo
  composer (`/kudos/new`).
- **Highlight Kudos** — a carousel of the 5 most-loved kudos of the event so far, filterable by
  hashtag and department.
- **All Kudos** — the chronological feed of every kudo, with infinite scroll / pagination.
- **Spotlight Board** — an interactive word-cloud of recipient names sized by kudos count.

A persistent right-hand sidebar shows the current viewer's personal counters (kudos sent /
received, hearts, Secret Boxes), a `Mở quà` button that opens the Secret Box dialog, and two
mini-leaderboards (10 sunners with the latest rank promotion; 10 sunners who most recently
received a gift).

The screen is the central social surface of SAA 2025 — it is read-mostly for anonymous visitors
(per the existing `/kudos` placeholder route in `lib/routes.ts`), with composition and like
actions gated behind authentication. It links into `/kudos/new` (Viết Kudo), `/kudos/{id}` (Kudo
detail, **out of scope** for this spec), and `/profile/{userId}` (profile, **out of scope**).

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View the live Kudos feed (Priority: P1)

Any visitor opening `/kudos` sees the Banner KV Kudos hero at the top, then the HIGHLIGHT KUDOS
carousel (Top 5), then the ALL KUDOS feed alongside the right-hand sidebar. The page loads with
the freshest data from the server and is the canonical "what's happening in SAA 2025 right now"
view.

**Why this priority**: This is the read-only MVP — without it none of the other stories have
content to attach to. It is also the link target for the homepage's "Sun\* Kudos" CTA and the
header / footer navigation, so every other screen depends on it rendering correctly.

**Independent Test**: With the database seeded with ≥1 kudo, navigating to `/kudos` shows the
hero, the highlight carousel (or its empty state), at least one card in ALL KUDOS, and the
sidebar — no other story needs to be implemented for this to be valuable.

**Acceptance Scenarios**:

1. **Given** the user is authenticated and ≥5 kudos exist, **When** they open `/kudos`, **Then**
   the page renders Banner KV Kudos, the quick-entry input, HIGHLIGHT KUDOS with 5 cards in a
   carousel, the ALL KUDOS feed (newest first), and the sidebar with the viewer's stats.
2. **Given** the user is authenticated and the database has zero kudos, **When** they open
   `/kudos`, **Then** the HIGHLIGHT carousel and ALL KUDOS feed render the empty-state copy
   "Hiện tại chưa có Kudos nào." (per `messages/{vi,en,ja}.json`).
3. **Given** the sidebar's leaderboard data is empty, **When** the page renders, **Then** each
   empty leaderboard section shows "Chưa có dữ liệu".
4. **Given** the user is anonymous, **When** they open `/kudos`, **Then** the feed is visible
   read-only and any interactive action (compose, like, profile click, Secret Box) redirects to
   `/login?redirectTo=/kudos`.

---

### User Story 2 - Quick-post a Kudo from the live board (Priority: P1)

An authenticated user can click the pill-shaped capture field at the top of the page (component
`A.1_Button ghi nhận`) and be taken straight into the Viết Kudo composer (`/kudos/new`) with
focus on the recipient field, so they never leave the board to send a kudo.

**Why this priority**: Quick capture is the conversion funnel of the entire feature — making
sending a kudo a one-click action from the board is what turns the board from a billboard into
a participation surface.

**Independent Test**: Click the pencil input on `/kudos`, confirm the browser navigates to
`/kudos/new` with the recipient input focused. No write paths to the database are required
inside this screen (composing is owned by Viết Kudo).

**Acceptance Scenarios**:

1. **Given** the user is authenticated, **When** they click anywhere inside the
   `A.1_Button ghi nhận` field, **Then** the router navigates to `/kudos/new` and the recipient
   combobox receives focus on mount.
2. **Given** the user is anonymous, **When** they click the same field, **Then** middleware
   redirects them to `/login?redirectTo=/kudos/new` (same flow as the homepage QuickAction
   widget).
3. **Given** the placeholder text, **When** the page renders in Vietnamese locale, **Then** the
   placeholder reads exactly "Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?".

---

### User Story 3 - Like / unlike a Kudo (Priority: P1)

Any authenticated viewer can tap the heart button (`C.4.1_Hearts` on ALL KUDOS cards,
`B.4.4 Action` on HIGHLIGHT KUDOS cards) to like a kudo they did not author. The heart toggles
between unfilled (gray) and filled (red), the displayed count increments / decrements, and the
optimistic UI rolls back if the server rejects the request.

**Why this priority**: Likes drive the Highlight ranking ("Top 5 kudos by heart count") which
is the entire reason HIGHLIGHT KUDOS exists. Without likes, the carousel has no signal to sort
by and the "+2 hearts on a special day" admin lever is meaningless.

**Independent Test**: With a seeded kudo not authored by the current user, clicking the heart
icon flips its colour and increments the count from `N` to `N+1`. Clicking again flips it back
and decrements to `N`. A repeated click within the same session is idempotent (no double-like).

**Acceptance Scenarios**:

1. **Given** an authenticated user viewing a kudo they did NOT send, **When** they click the
   gray heart, **Then** the icon turns red, the count increments by 1, and a `POST /api/kudos/{id}/like`
   call is sent; on success the optimistic state stays, on error it rolls back and a toast
   "Không thể thả tim, vui lòng thử lại." is shown.
2. **Given** an authenticated user viewing their OWN kudo, **When** they look at the heart
   button, **Then** it is disabled (cannot be focused via keyboard, `aria-disabled="true"`,
   tooltip "Bạn không thể thả tim cho kudo của mình.").
3. **Given** a user has already liked a kudo, **When** they click again, **Then** the heart
   turns gray, the count decrements by 1, and `DELETE /api/kudos/{id}/like` fires.
4. **Given** a "special day" is configured by an admin, **When** any user likes any kudo
   sent during that day, **Then** the sender's `hearts_received` aggregate is incremented by
   2 instead of 1 (this is a server-side calculation; the UI only displays the resulting count).

---

### User Story 4 - Filter HIGHLIGHT KUDOS by hashtag or department (Priority: P2)

A viewer can narrow the HIGHLIGHT carousel by clicking the `B.1.1_ButtonHashtag` or
`B.1.2_Button Phong ban` dropdowns. Selecting a tag filters the underlying ranked list; the
carousel re-renders and the "page X / 5" indicator updates. Clearing the filter restores the
event-wide Top 5.

**Why this priority**: Filtering lets users dig into recognition by team or theme. It is not
critical for first launch (the carousel works without filters) but is the next-most-requested
slicing — pairs well with hashtag clicks on the cards themselves (US10).

**Independent Test**: With seeded kudos using two distinct hashtags, picking one in the
dropdown should drop the cards in the carousel that don't use that hashtag. Clearing the
filter restores the full top 5.

**Acceptance Scenarios**:

1. **Given** the carousel shows the event-wide top 5, **When** the user opens the Hashtag
   dropdown, **Then** the menu lists every hashtag present in the database (sourced live, not
   hard-coded) plus a "Tất cả" / clear option.
2. **Given** a hashtag is selected, **When** the carousel re-fetches, **Then** the slides shown
   are the top 5 kudos that include the selected hashtag (could be fewer than 5; the page
   indicator reflects the actual count, e.g. "1/3").
3. **Given** both Hashtag and Phòng ban filters are active, **When** the user views the
   carousel, **Then** results match BOTH filters (logical AND).
4. **Given** no kudos match the current filter, **When** the carousel renders, **Then** it
   shows the empty-state copy "Không có kudo nào khớp bộ lọc." and disables Prev/Next.

---

### User Story 5 - Navigate the HIGHLIGHT KUDOS carousel (Priority: P2)

The viewer steps through the 5 highlight cards using `B.2.1_Button lùi` / `B.2.2_Button tiến`
(arrow buttons) or the bottom-row `B.5_slide` controls (prev / page indicator / next). On the
first slide the back button is disabled; on the last slide the next button is disabled.

**Why this priority**: Carousel navigation is the only way to see slides 2–5. Without it the
"Top 5" promise collapses into "Top 1".

**Acceptance Scenarios**:

1. **Given** the carousel is on slide 1 of 5, **When** the user clicks `B.2.2_Button tiến`,
   **Then** the carousel advances to slide 2, the active card becomes visually prominent and
   the inactive cards fade; the page indicator updates from "1/5" to "2/5".
2. **Given** the carousel is on slide 1, **When** the user looks at `B.2.1_Button lùi`,
   **Then** it is disabled (`aria-disabled="true"`, no hover affordance).
3. **Given** the carousel has fewer than 5 cards because of a filter, **When** the user
   navigates, **Then** the page indicator reflects the actual length (e.g. "3/3"), and both
   end-of-list arrows are disabled at their respective ends.

---

### User Story 6 - Browse the ALL KUDOS feed (Priority: P2)

The ALL KUDOS section renders a chronological feed of every kudo (newest first), wraps in
sequence around the sidebar, and loads more as the user scrolls (or via pagination — the
underlying strategy is left to the implementation per the BACKEND_API_TESTCASES contract).
Each card (`C.3_KUDO Post` and siblings) exposes sender + receiver, time, content (clipped at
5 lines with "…"), up-to-5 attached images, up-to-5 hashtags, hearts count + like button, and
a copy-link button.

**Why this priority**: This is the long-tail view that catches everything the highlight ranking
misses. It is also the natural surface for clicking through to a kudo's detail page (US10) and
to user profiles (US11).

**Acceptance Scenarios**:

1. **Given** there are ≥10 kudos, **When** the user opens `/kudos`, **Then** the first batch
   renders in the ALL KUDOS feed; scrolling near the bottom triggers the next page request and
   appends the next batch (or a "Tải thêm" button appears, depending on chosen strategy — but
   the strategy must be consistent across the codebase).
2. **Given** a kudo has more than 5 lines of content, **When** its card renders, **Then** the
   content is clipped to 5 lines with "…" (CSS-only truncation; full text is reachable from
   the detail page).
3. **Given** a kudo has 0 attached images, **When** its card renders, **Then** the image
   gallery container is omitted (not rendered as an empty row).

---

### User Story 7 - Explore the Spotlight word cloud (Priority: P2)

The Spotlight Board (`B.7_Spotlight`) renders an interactive word cloud of every recipient
name in the dataset, sized by kudo count. A header reads "388 KUDOS" (total kudos in the event,
queried live). Users can toggle pan / zoom via `B.7.2_Pan zoom`, search by name in
`B.7.3_Tìm kiếm sunner`, hover a node to see a tooltip with name + last-received timestamp,
and click a node to navigate to that kudo's detail page.

**Why this priority**: Spotlight is a "wow" view rather than a primary task surface — but it is
the most visually distinctive part of the screen and the only place a viewer can compare
recipients at a glance.

**Acceptance Scenarios**:

1. **Given** Spotlight is loading, **When** the user views the section, **Then** a loading
   indicator is shown (no flicker / empty canvas).
2. **Given** the dataset is empty, **When** Spotlight renders, **Then** the empty-state copy
   is shown (text TBD with content team; for now reuse "Hiện tại chưa có Kudos nào.").
3. **Given** the user types "Hu" in `B.7.3_Tìm kiếm sunner`, **When** they press Enter or click
   the search icon, **Then** the cloud highlights nodes whose recipient name contains "Hu" and
   centers the viewport on the first match.
4. **Given** the user hovers a node, **When** the tooltip appears, **Then** it shows the
   recipient's full name and the time at which they most recently received a kudo.
5. **Given** the user clicks a node, **When** auth state is valid, **Then** they navigate to
   `/kudos/{id}` (the latest kudo by that recipient). If anonymous, redirect to
   `/login?redirectTo=/kudos`.

---

### User Story 8 - See my personal counters in the sidebar (Priority: P2)

For an authenticated viewer, the sidebar (`D_Thống menu phải` → `D.1_Thống kê tổng quat`) lists
6 personal stats:

- Số Kudos bạn nhận được (`D.1.2`)
- Số Kudos bạn đã gửi (`D.1.3`)
- Số tim bạn nhận được (`D.1.4`)
- Số Secret Box bạn đã mở (`D.1.6`)
- Số Secret Box chưa mở (`D.1.7`)
- Plus the `Mở quà` button (`D.1.8`)

**Why this priority**: Personal counters drive return visits (gamification loop). They depend
on US3 (likes) and US12 (Secret Box) for their data sources, so they ship a step behind those
on the priority list.

**Acceptance Scenarios**:

1. **Given** the user is authenticated, **When** the sidebar renders, **Then** all 6 stat
   rows show the label + integer value sourced from `GET /api/users/me/stats`.
2. **Given** the user is anonymous, **When** the sidebar renders, **Then** the personal-stats
   block is hidden (replaced by a sign-in prompt or omitted — implementation choice).
3. **Given** the stats endpoint returns 0 for a counter, **When** that row renders, **Then**
   the value "0" is shown (NOT empty / hidden).

---

### User Story 9 - Copy a Kudo link (Priority: P3)

`C.4.2_Copy link button` copies the canonical kudo URL (`https://{host}/kudos/{id}`) to the
clipboard and shows the toast "Link copied — ready to share!" (existing Toast molecule). Works
for any kudo card, regardless of authorship.

**Why this priority**: Shareability is nice-to-have; the underlying URL is reachable from the
detail page in any case.

**Acceptance Scenarios**:

1. **Given** the user clicks `C.4.2_Copy link button` on any kudo card, **When** the
   `navigator.clipboard.writeText(...)` call resolves, **Then** the success toast is shown for
   3s.
2. **Given** the clipboard API rejects (e.g. insecure context), **When** the copy fails,
   **Then** a fallback toast "Không thể copy. Hãy thử lại trong trình duyệt khác." is shown.

---

### User Story 10 - Open a Kudo's detail page (Priority: P3)

Clicking the card body (`C.3.5_Content`, `B.4.2_Nội dung`), the `View Details` button, or a
recipient node in Spotlight, navigates to `/kudos/{id}`. The detail page itself is **out of
scope** for this spec — this story only covers the navigation contract.

**Acceptance Scenarios**:

1. **Given** the user clicks a kudo card body, **When** auth is valid, **Then** the router
   navigates to `/kudos/{id}`.
2. **Given** anonymous, **When** they click, **Then** redirect to
   `/login?redirectTo=/kudos/{id}`.

---

### User Story 11 - Open a sender's or recipient's profile (Priority: P3)

Clicking sender / receiver name or avatar on any kudo card (`B.3.1`, `B.3.2`, `B.3.5`, `B.3.6`,
`C.3.1`, `C.3.3`) or on a sidebar leaderboard entry (`D.3.2`–`D.3.6`) navigates to that user's
profile page (`/profile/{userId}` — route exists, content TBD). Hover surfaces a small profile
preview popover.

**Acceptance Scenarios**:

1. **Given** the user clicks a sender / receiver name, **When** auth is valid, **Then** the
   router navigates to `/profile/{userId}`.
2. **Given** the user hovers a name / avatar for ≥300ms, **When** the timer fires, **Then** a
   preview popover renders with avatar + display name + team + hearts received.
3. **Given** the user moves the mouse away or presses Escape, **When** the popover is open,
   **Then** it closes within 150ms.

---

### User Story 12 - Open the Secret Box (Priority: P3)

`D.1.8_Button mở quà` opens the Secret Box dialog when the user has ≥1 unopened box
(`Số Secret Box chưa mở > 0`). The dialog UI is **out of scope** for this spec.

**Acceptance Scenarios**:

1. **Given** the user has unopened boxes, **When** they click `Mở quà`, **Then** the Secret
   Box dialog opens (component name TBD).
2. **Given** the user has zero unopened boxes, **When** they look at the button, **Then** it is
   disabled with tooltip "Bạn chưa có Secret Box nào để mở."

---

### Edge Cases

- **Network failure mid-list-fetch**: the partial feed remains; a toast invites retry. Filter
  state is preserved.
- **Like action races itself**: rapid double-click is debounced client-side; the heart can
  flip at most once per click.
- **A kudo is deleted server-side while the feed is open**: the next refetch removes it
  silently; an open detail page would redirect to `/kudos` with a toast (out of scope here).
- **Special-day +2-hearts toggle flips mid-session**: the server returns the corrected count on
  the next read; the UI does not need to recompute locally.
- **Very long display names** (e.g. >40 chars): truncate with "…" on cards; the full name
  appears in the hover popover.
- **Spotlight with thousands of recipients**: client-side render must remain interactive;
  consider virtualization or canvas instead of DOM nodes if measured FPS drops.
- **The viewer's locale switches to `en`/`ja`** while the page is open: all visible labels must
  swap from the next render onward (Vietnamese-only strings above must have keys in
  `messages/en.json` / `messages/ja.json`).

---

## UI/UX Requirements _(from Figma)_

### Screen Components

| No.             | Component                       | Type      | Behavior                                                                                                                                                        |
| --------------- | ------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A**           | A_KV Kudos                      | FRAME     | Banner hero with logo "SAA 2025 KUDOS" + title "Hệ thống ghi nhận lời cảm ơn". Readonly.                                                                        |
| **A.1**         | A.1_Button ghi nhận             | INSTANCE  | Pill-shaped input field with pencil icon + placeholder "Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?". Click → navigate to `/kudos/new`.                |
| **B**           | B_Highlight                     | FRAME     | Container for HIGHLIGHT KUDOS section.                                                                                                                          |
| **B.1**         | B.1_header                      | FRAME     | Section header: subtitle "Sun\* Annual Awards 2025" + title "HIGHLIGHT KUDOS" + 2 filter dropdowns.                                                             |
| **B.1.1**       | B.1.1_ButtonHashtag             | INSTANCE  | Hashtag filter dropdown. Sources tags from DB. Click opens menu, select filters carousel, clear restores Top 5.                                                 |
| **B.1.2**       | B.1.2_Button Phong ban          | INSTANCE  | Department filter dropdown. Same behavior as B.1.1 for `team` field.                                                                                            |
| **B.2**         | B.2_HIGHLIGHT KUDOS             | GROUP     | The carousel itself — 5 highest-hearts kudos.                                                                                                                   |
| **B.2.1**       | B.2.1_Button lùi                | INSTANCE  | Carousel Prev arrow. Disabled on slide 1.                                                                                                                       |
| **B.2.2**       | B.2.2_Button tiến               | INSTANCE  | Carousel Next arrow. Disabled on last slide.                                                                                                                    |
| **B.2.3**       | B.2.3_content HIghlight KUDO    | FRAME     | Frame containing the 5 highlight cards.                                                                                                                         |
| **B.3**         | B.3_KUDO - Highlight            | INSTANCE  | Highlight card: sender info, recipient info, time, content (≤3 lines, "…" if more), hashtags (≤5 per line, "…" if more), heart button, copy link, view details. |
| **B.3.1**       | B.3.1_Avatar người gửi          | ELLIPSE   | Sender avatar. Click → profile. Hover → preview popover.                                                                                                        |
| **B.3.2**       | B.3.2_Thông tin người gửi       | FRAME     | Sender display name + team + hearts count. Click name → profile.                                                                                                |
| **B.3.4**       | B.3.4_Icon mũi tên              | FRAME     | Arrow icon (sender → receiver direction). Non-interactive.                                                                                                      |
| **B.3.5**       | B.3.5_Avatar người nhận         | ELLIPSE   | Recipient avatar. Click → profile. Hover → preview popover.                                                                                                     |
| **B.3.6**       | B.3.6_Thông tin người nhận      | FRAME     | Recipient display name + team + hearts. Click name → profile.                                                                                                   |
| **B.4**         | B.4_Nội dung lời cảm ơn         | FRAME     | Time + content + hashtags container in highlight card.                                                                                                          |
| **B.4.1**       | B.4.1_Thời gian đăng            | TEXT      | "HH:mm - MM/DD/YYYY" format. Read-only.                                                                                                                         |
| **B.4.2**       | B.4.2_Nội dung                  | FRAME     | Kudo body, clipped at 3 lines on highlight cards. Click → detail page.                                                                                          |
| **B.4.3**       | B.4.3_Hashtag                   | FRAME     | Hashtag chips, ≤5 per line. Click chip → filter ALL KUDOS by that hashtag.                                                                                      |
| **B.4.4**       | B.4.4_Action                    | FRAME     | Hearts count + heart button + copy link in highlight card.                                                                                                      |
| **B.5**         | B.5_slide                       | FRAME     | Bottom-row carousel controls: prev arrow + "2/5" page indicator + next arrow.                                                                                   |
| **B.5.1**       | B.5.1_Button lùi                | INSTANCE  | Same behavior as B.2.1.                                                                                                                                         |
| **B.5.2**       | B.5.2_số trang                  | TEXT      | Page indicator text e.g. "2/5". Read-only.                                                                                                                      |
| **B.5.3**       | B.5.3_Button tiến               | INSTANCE  | Same behavior as B.2.2.                                                                                                                                         |
| **B.6**         | B.6_Header Giải thưởng          | FRAME     | Section header for Spotlight: subtitle + "SPOTLIGHT BOARD".                                                                                                     |
| **B.7**         | B.7_Spotlight                   | FRAME     | Word cloud board.                                                                                                                                               |
| **B.7.1**       | B.7.1_388 KUDOS                 | TEXT      | Live total kudos count, queried from DB.                                                                                                                        |
| **B.7.2**       | B.7.2_Pan zoom                  | FRAME     | Toggle pan / zoom mode. Tooltip "Pan/Zoom".                                                                                                                     |
| **B.7.3**       | B.7.3_Tìm kiếm sunner           | INSTANCE  | Search input. Max 100 chars. Empty = blocked with required hint. Enter / icon click triggers search.                                                            |
| **C**           | C_All kudos                     | FRAME     | Container for ALL KUDOS section + sidebar.                                                                                                                      |
| **C.1**         | C.1_Header Giải thưởng          | FRAME     | Section header for ALL KUDOS: subtitle + "ALL KUDOS".                                                                                                           |
| **C.2**         | C.2_Danh sách lời cảm ơn        | FRAME     | Card list (newest first). Empty state: "Hiện tại chưa có Kudos nào."                                                                                            |
| **C.3**         | C.3_KUDO Post                   | INSTANCE  | Feed card: sender info, recipient info, time, content (≤5 lines), gallery (≤5 images), hashtags (≤5), hearts, copy link, view details.                          |
| **C.3.1**       | C.3.1_Thông tin người gửi       | INSTANCE  | Sender block. Click avatar/name → profile. Hover → preview.                                                                                                     |
| **C.3.2**       | C.3.2_Icon sent                 | FRAME     | "sent" status icon. Non-interactive.                                                                                                                            |
| **C.3.3**       | C.3.3_Thông tin người nhận      | INSTANCE  | Recipient block. Click avatar/name → profile.                                                                                                                   |
| **C.3.4**       | C.3.4_Time                      | TEXT      | "HH:mm - MM/DD/YYYY". Read-only.                                                                                                                                |
| **C.3.5**       | C.3.5_Content                   | FRAME     | Kudo body, clipped at 5 lines. Click card → detail.                                                                                                             |
| **C.3.6**       | C.3.6_Image đính kèm            | FRAME     | Horizontal row of ≤5 thumbnails, left-aligned. Click thumbnail → full-size lightbox.                                                                            |
| **C.3.7**       | C.3.7_Hash tag                  | FRAME     | Hashtag chips, ≤5 per row. Click → filter feed.                                                                                                                 |
| **C.4**         | C.4_Button                      | FRAME     | Action bar of a feed card.                                                                                                                                      |
| **C.4.1**       | C.4.1_Hearts                    | FRAME     | Heart toggle button. Gray → red on like, count ±1. Disabled when viewing own kudo. One like per user per kudo.                                                  |
| **C.4.2**       | C.4.2_Copy link button          | INSTANCE  | Copies `/kudos/{id}` URL, toast "Link copied — ready to share!".                                                                                                |
| **C.5–C.7**     | C.5/C.6/C.7_KUDOpost            | INSTANCE  | Same behavior as C.3.                                                                                                                                           |
| **D**           | D_Thống menu phải               | FRAME     | Right sidebar container.                                                                                                                                        |
| **D.1**         | D.1_Thống kê tổng quat          | FRAME     | Personal stats block (auth-only).                                                                                                                               |
| **D.1.2**       | D.1.2_Số kudos nhận được        | INSTANCE  | "Số Kudos bạn nhận được: {N}". Read-only.                                                                                                                       |
| **D.1.3**       | D.1.3_Số kudos đã gửi           | INSTANCE  | "Số Kudos bạn đã gửi: {N}". Read-only.                                                                                                                          |
| **D.1.4**       | D.1.4_Số tim                    | FRAME     | "Số tim bạn nhận được: {N}". Read-only.                                                                                                                         |
| **D.1.5**       | D.1.5_phân cách nội dung        | RECTANGLE | Horizontal divider. Non-interactive.                                                                                                                            |
| **D.1.6**       | D.1.6_Số secret box đã mở       | INSTANCE  | "Số Secret Box bạn đã mở: {N}". Read-only.                                                                                                                      |
| **D.1.7**       | D.1.7_Số secret box chưa mở     | INSTANCE  | "Số Secret Box chưa mở: {N}". Read-only.                                                                                                                        |
| **D.1.8**       | D.1.8_Button mở quà             | INSTANCE  | Opens Secret Box dialog. Disabled when D.1.7 == 0.                                                                                                              |
| **D.3**         | D.3_10 SUNNER nhận quà          | FRAME     | "10 SUNNER NHẬN QUÀ MỚI NHẤT" leaderboard list. Empty state: "Chưa có dữ liệu".                                                                                 |
| **D.3.1**       | D.3.1_title                     | TEXT      | Section title. Read-only.                                                                                                                                       |
| **D.3.2–D.3.6** | D.3.x_Thông tin Sunner nhận quà | INSTANCE  | Avatar + name + small gift description. Click → profile. Hover → preview.                                                                                       |
| **D.4**         | D.4_hashtag                     | FRAME     | Hashtag chip in the sidebar context. Click → filter feed by tag.                                                                                                |

### Navigation Flow

- **From**: Homepage SAA (header "Sun* Kudos" + KudosPromoSection "Chi tiết"), Hệ thống giải
  (CTA "Sun* Kudos - Live board"), footer "Sun* Kudos" link, header nav "Sun* Kudos" item on
  any post-login screen.
- **To**:
  - `/kudos/new` — quick capture (A.1) + Hủy fallback from there returns to `/kudos`.
  - `/kudos/{id}` — content click, View Details, Spotlight node click.
  - `/profile/{userId}` — sender / receiver name / avatar click, sidebar leaderboard entry click.
  - `/login?redirectTo=/kudos` — for anonymous attempts at any auth-required action.
- **Triggers**: see per-component table above.

### Responsive Requirements

- Constitution §III: mobile-first; layouts MUST work at ≥320px / ≥768px / ≥1024px / ≥1440px
  without horizontal scroll.
- The 3-column layout (feed + spotlight + sidebar) collapses to single column below 1024px;
  the sidebar moves to the bottom of the page on mobile.
- The HIGHLIGHT carousel becomes a horizontal swipable strip on touch viewports.
- Touch targets ≥44×44 CSS pixels (heart, arrows, dropdowns, sidebar buttons).

### Accessibility

- WCAG 2.1 AA — visible focus rings on every interactive element.
- Carousel arrows have `aria-label` + `aria-disabled` reflecting state.
- Heart button: `aria-pressed="true|false"`, disabled state communicates "Bạn không thể thả tim
  cho kudo của mình." via `aria-describedby`.
- Spotlight word cloud has a non-canvas fallback list for screen readers.
- All Vietnamese-locale labels have `en` and `ja` equivalents in `messages/*.json`.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST render `/kudos` for both authenticated and anonymous visitors, with
  the feed and Spotlight visible to anonymous and write actions gated.
- **FR-002**: System MUST source the HIGHLIGHT KUDOS list from `GET /api/kudos?sort=hearts&limit=5`
  with current hashtag / department filters applied.
- **FR-003**: System MUST source the ALL KUDOS feed from `GET /api/kudos?sort=newest&page={n}`
  with pagination or cursor-based scrolling — the choice MUST be consistent across the codebase.
- **FR-004**: System MUST send `POST /api/kudos/{id}/like` on heart-click (and
  `DELETE /api/kudos/{id}/like` on un-heart) and roll back optimistic UI on error.
- **FR-005**: System MUST forbid like / unlike on a kudo whose `senderId` equals the current
  user's id; the UI MUST disable the button (server MUST also enforce — defence in depth).
- **FR-006**: System MUST enforce a single like per user per kudo at the API layer; the UI MUST
  debounce double-clicks within 300ms.
- **FR-007**: System MUST display the empty-state copy "Hiện tại chưa có Kudos nào." (and its
  `en` / `ja` translations) when the relevant feed is empty.
- **FR-008**: System MUST display "Chưa có dữ liệu" in empty sidebar leaderboard sections.
- **FR-009**: System MUST source hashtag and department filter values live from the database,
  never hard-coded.
- **FR-010**: System MUST clip kudo body at 3 lines on highlight cards and 5 lines on feed
  cards, with CSS-only truncation (no client-side string surgery).
- **FR-011**: System MUST limit displayed hashtags to 5 per row and elide overflow with "…".
- **FR-012**: System MUST limit displayed image thumbnails to 5 per card; clicking a thumbnail
  opens a full-size lightbox.
- **FR-013**: Anonymous visitors clicking any interactive control MUST be redirected to
  `/login?redirectTo=/kudos` (or `?redirectTo=/kudos/{id}` for content-click cases).
- **FR-014**: The Spotlight word cloud MUST query `GET /api/kudos/spotlight` for `{ recipients: [{ userId, displayName, kudosCount, lastReceivedAt }] }` and render nodes sized by `kudosCount`.
- **FR-015**: The Spotlight search MUST limit input to 100 characters; submitting empty input
  MUST surface a required-message and not fire a request.
- **FR-016**: The sidebar personal-stats block MUST be hidden when the viewer is anonymous.
- **FR-017**: The `Mở quà` button MUST be disabled when `unopenedSecretBoxes == 0`.
- **FR-018**: All currency-of-locale strings (placeholders, empty states, toast messages) MUST
  flow through `next-intl` (`messages/{vi,en,ja}.json`) — no Vietnamese literals in component
  JSX.
- **FR-019**: Clicking a hashtag chip anywhere on the screen MUST filter the ALL KUDOS feed to
  that hashtag (URL `?hashtag={tag}`) and keep the HIGHLIGHT filter independent.
- **FR-020**: A "special day" admin flag MUST grant `+2 hearts` per like to the kudo's sender;
  the calculation lives server-side and the UI displays only the resulting `hearts_received`.

### Technical Requirements

- **TR-001**: Initial load LCP < 2.5s at p75 with 50 cards seeded (constitution §III).
- **TR-002**: Like / unlike INP < 200ms — the optimistic UI MUST update before the network
  round-trip completes.
- **TR-003**: ALL authenticated mutations (`POST /api/kudos/{id}/like`, `DELETE
/api/kudos/{id}/like`) MUST be authorized server-side using the Supabase session JWT and
  protected by RLS on the `kudo_likes` table (constitution §IV).
- **TR-004**: All read endpoints MUST respect Supabase RLS — the anon key may read public
  kudos; the user JWT is required for personal stats.
- **TR-005**: Spotlight must render ≤500 nodes interactively at 60fps on a mid-range laptop.
  Above that, the implementation MUST switch to canvas-based rendering or virtualization.
- **TR-006**: The Spotlight search MUST debounce keypresses (200ms) before triggering filter
  highlighting.
- **TR-007**: Feed pagination MUST be cursor-based (created_at + id) rather than offset to
  avoid pagination drift as new kudos arrive.
- **TR-008**: Hashtag and department lookups MUST be cached on the client for the session
  (React Query `staleTime: Infinity` or equivalent).
- **TR-009**: The page MUST be statically prerendered with the freshest cached snapshot at
  build time, then revalidated on every request — i.e. `dynamic = "force-dynamic"` is the
  default unless a CDN cache strategy is added.

### Key Entities _(if feature involves data)_

- **Kudo** — `{ id, senderId, recipientId, title?, body, hashtags: string[], imageUrls: string[],
isAnonymous: bool, heartsCount: int, createdAt }`. Sender and recipient resolve to User
  records.
- **User** — `{ id, displayName, email, avatarUrl, team, role, heartsReceived, kudosReceived,
kudosSent }`. Subset of `lib/users/types.ts`; extra aggregates are SQL views.
- **Hashtag** — string scalar; the curated set comes from `lib/kudos/mock.HASHTAG_SUGGESTIONS`
  for compose, but the live board pulls every hashtag actually used (DISTINCT query).
- **KudoLike** — `{ userId, kudoId, createdAt }`. Composite primary key (`userId`, `kudoId`)
  enforces one-like-per-user-per-kudo (FR-006).
- **SecretBox** — `{ id, ownerId, openedAt | null, contentId }`. Counters in the sidebar
  aggregate from this table. Box opening flow itself is out of scope.
- **SpecialDay** — `{ date, heartsMultiplier: int }`. Admin-configured. Read by the like
  endpoint to compute the `hearts_received` delta.

---

## API Dependencies

| Endpoint                                                 | Method | Purpose                                                | Triggered by                                      | Status |
| -------------------------------------------------------- | ------ | ------------------------------------------------------ | ------------------------------------------------- | ------ |
| `/api/kudos?sort=hearts&limit=5&hashtag=&team=`          | GET    | HIGHLIGHT carousel list                                | Page mount, filter change (US1, US4, US5)         | New    |
| `/api/kudos?sort=newest&cursor=&limit=10&hashtag=&team=` | GET    | ALL KUDOS feed (cursor-paged)                          | Page mount, scroll-to-end (US6)                   | New    |
| `/api/kudos/spotlight`                                   | GET    | Word-cloud recipient distribution                      | Page mount (US7)                                  | New    |
| `/api/kudos/hashtags`                                    | GET    | Distinct hashtag values for filter dropdown            | First filter open (US4)                           | New    |
| `/api/kudos/departments`                                 | GET    | Distinct department values for filter dropdown         | First filter open (US4)                           | New    |
| `/api/kudos/{id}/like`                                   | POST   | Add a like                                             | Heart click (US3)                                 | New    |
| `/api/kudos/{id}/like`                                   | DELETE | Remove a like                                          | Un-heart click (US3)                              | New    |
| `/api/users/me/stats`                                    | GET    | Sidebar personal counters                              | Page mount, post-like, post-Secret-Box-open (US8) | New    |
| `/api/users/me/leaderboard?type=rank-promotion&limit=10` | GET    | "10 SUNNER có sự thăng hạng mới nhất"                  | Page mount (US8 sibling)                          | New    |
| `/api/users/me/leaderboard?type=gift-received&limit=10`  | GET    | "10 SUNNER nhận quà mới nhất" (D.3)                    | Page mount (US8 sibling)                          | New    |
| `/api/secret-boxes/next-unopened`                        | GET    | Used by Mở quà to open the dialog with a target box id | Mở quà click (US12)                               | New    |
| `/api/auth/session`                                      | GET    | Determine auth state for write-gating                  | Page mount                                        | Exists |
| `/api/notifications/unread-count`                        | GET    | Header bell                                            | Page mount (header shared)                        | Exists |

All new endpoints MUST be expressed under `app/api/.../route.ts` with thin handlers and a
service layer (constitution §II). RLS policies cover `kudos`, `kudo_likes`, `users`,
`secret_boxes`, `special_days`. Input is validated with Zod at the trust boundary
(constitution §IV).

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 50% of authenticated visitors who load `/kudos` click `A.1_Button ghi nhận` and
  reach `/kudos/new` within their first session (measured via `track("kudos_quick_capture_click")`).
- **SC-002**: 30% of authenticated visitors who load `/kudos` like ≥1 kudo within a session
  (`track("kudo_liked")`).
- **SC-003**: HIGHLIGHT carousel filter changes complete in <300ms p75 (carousel reset + new
  fetch end-to-end).
- **SC-004**: Spotlight word cloud renders to interactive in <1500ms on a mid-range laptop with
  200 recipients.
- **SC-005**: Feed scroll-to-load fetches the next page in <500ms p75.
- **SC-006**: Zero like-spoofing incidents in the first 14 days (no row in `kudo_likes` where
  `userId == kudo.senderId`; verified via daily integrity job).

---

## Out of Scope

- **Kudo detail page** (`/kudos/{id}`) — only the navigation contract is defined here.
- **User profile page** (`/profile/{userId}`) — same as above.
- **Secret Box dialog** — only the trigger and gating are defined here.
- **Hover-preview popover content** — gated by the profile page design.
- **Admin "special day" configuration UI** — out of scope; the spec only relies on the flag
  existing server-side.
- **Visual / CSS specifications** — handled at implementation time via `query_section` on the
  Figma frame. Pixel values, colors, fonts, spacing do NOT belong in this spec.
- **Asset preparation** — `get_media_files` runs at implementation time, not here.

---

## Dependencies

- [x] Constitution document exists (`.momorph/constitution.md`)
- [x] Screen flow documented — SCREENFLOW.md lists `MaZUn5xHXZ` as row 4 (currently `pending`;
      this spec promotes the row to `screen_specs/sun-kudos-live-board.md` once written).
- [ ] API specifications available — to be added in this PR (new endpoints listed above; the
      existing `app/api/auth/*`, `app/api/notifications/*`, `app/api/i18n/*` are reused).
- [ ] Database design — kudos/users tables exist as scaffolding (see `lib/kudos/types.ts`,
      `lib/users/types.ts`); migrations for `kudo_likes`, `secret_boxes`, `special_days` to be
      added during plan.
- [x] Viết Kudo screen (`/kudos/new`) is implemented and is the navigation target of US2.
- [x] Homepage SAA references this screen as a CTA target — the implementation MUST honour the
      existing `/kudos` route alias in `lib/routes.ts`.

---

## Notes

- The screen is "live" — the implementation MUST prefer Server Components for the initial
  paint plus a client-side React Query layer for filter / like / scroll mutations
  (constitution §II).
- The Spotlight word cloud is the only component on the screen with non-trivial canvas
  considerations; consider `d3-cloud` (pure layout, no React dep) plus a thin React renderer.
  This is a planning decision, not a spec mandate.
- The placeholder copy "Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?" SHOULD be added
  to `messages/vi.json` under `kudos.live.quickCapture.placeholder` and mirrored to `en` / `ja`.
- Constitution §V (TDD) — every acceptance scenario above maps to at least one Vitest or
  Playwright test in `tasks.md` (next step).
