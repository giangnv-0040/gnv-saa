# Feature Specification: Viết Kudo (Write Kudos)

**Frame ID**: `520:11602` (screen ID `ihQ26W78P2`)
**Frame Name**: `Viết Kudo`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**Created**: 2026-05-18
**Status**: Draft

---

## Overview

A modal-style page that lets an authenticated user compose and submit a Kudo
(a public "thank you / recognition") to one of their teammates. The page is
reached from the quick-action widget on Homepage SAA (`/kudos/new`) and is
rendered on top of a darkened cover of the Homepage hero so visually it feels
like a focused composition surface, while the URL is still routable so the
form is bookmarkable / shareable as a deep link.

The screen captures the following fields:

1. **Người nhận** (recipient) — required, single teammate, picked via a
   search-and-select combobox.
2. **Danh hiệu** (title / honorific) — optional one-line text rendered as the
   Kudo's headline on the live board.
3. **Nội dung** (body) — required rich-text body with a lightweight
   markdown-style toolbar (bold / italic / strikethrough / numbered list /
   link / quote) plus an `@mention` hint.
4. **Hashtag** — required, 1–5 hashtags. Picked from a curated suggestion list.
5. **Image** — optional, up to 5 attached images.
6. **Gửi ẩn danh** (send anonymously) — optional toggle that hides the
   sender's identity on the published Kudo.
7. **Footer actions**: `Hủy` (cancel — closes the page back to
   `/`) and `Gửi` (submit — validates and posts the Kudo).

## User Scenarios

### US-1 — Authenticated user writes and submits a kudo (P1)

**Given** an authenticated user navigates to `/kudos/new`, **When** they fill
in a recipient, body and at least one hashtag and click `Gửi`, **Then** the
form is validated client-side and a success toast is shown; on failure the
fields show inline errors and the submit button re-enables.

### US-2 — Anonymous submission (P2)

**Given** the form is filled in, **When** the user toggles "Gửi lời cám ơn
và ghi nhận ẩn danh" before submitting, **Then** the submission is marked
anonymous so the receiving teammate will see "Anonymous" instead of the
sender's name.

### US-3 — Cancel discards changes (P2)

**Given** the user has typed into the form, **When** they click `Hủy`,
**Then** the page navigates back to the homepage; in-progress fields are
discarded (no draft persistence in this iteration).

### US-4 — Anonymous visitor is redirected to login (P1)

**Given** an anonymous visitor opens `/kudos/new`, **When** the middleware
runs, **Then** they are redirected to `/login?redirectTo=/kudos/new` so the
form is only reachable to signed-in users.

---

## UI / UX Requirements (from Figma)

| Component           | Node ID                   | Description                                                                 |
| ------------------- | ------------------------- | --------------------------------------------------------------------------- |
| WriteKudoBackground | `520:11605` + `520:11646` | Full-bleed homepage cover artwork, dimmed via a navy mask for legibility.   |
| WriteKudoPanel      | `520:11647`               | Cream-colored 752×1012 panel, centered, `border-radius: 24px`, gap-32.      |
| Title               | `I520:11647;520:9870`     | "Gửi lời cám ơn và ghi nhận đến đồng đội" — 32px bold Montserrat, centered. |
| RecipientCombobox   | `I520:11647;520:9871`     | Required combobox with "Tìm kiếm" placeholder.                              |
| TitleField          | `I520:11647;1688:10448`   | Optional input with help text underneath.                                   |
| ContentEditor       | `I520:11647;520:9874`     | Toolbar (B/I/S/Num/Link/Quote) + Tiêu chuẩn cộng đồng link + textarea.      |
| HashtagPicker       | `I520:11647;520:9890`     | Label + `+ Hashtag` button (max 5). Tags rendered as chips.                 |
| ImageUploader       | `I520:11647;520:9896`     | Label + thumbnails + `+ Image` button (max 5).                              |
| AnonymousCheckbox   | `I520:11647;520:14099`    | Checkbox + label "Gửi lời cám ơn và ghi nhận ẩn danh".                      |
| FormActions         | `I520:11647;520:9905`     | Two buttons: `Hủy` (secondary) and `Gửi` (yellow CTA, full width).          |

### Behavior

- All copy MUST flow through the i18n layer (`messages/{vi,en,ja}.json`).
- The Submit button MUST be `disabled` until the three required fields
  (recipient, body, at least one hashtag) are valid.
- On submit success: show toast "Gửi Kudo thành công"; clear the form;
  redirect back to `/`.
- On submit failure (validation): focus the first invalid field and render
  inline error text.
- Anonymous toggle is purely a flag; identity stripping happens server-side
  later (out of scope here — UI ships first).
- Body field supports `@name` typing convention; no autocomplete in this
  iteration — the hint text alone is rendered.
- Toolbar buttons wrap the current selection with markdown-style markers
  (`**bold**`, `*italic*`, `~~strike~~`, `1. `, `[text](url)`, `> quote`).

## Requirements

- **FR-001**: System MUST gate `/kudos/new` behind authentication; anonymous
  visitors get redirected to `/login?redirectTo=/kudos/new` via middleware
  (`isProtectedPath`).
- **FR-002**: All form copy and placeholders MUST flow through i18n.
- **FR-003**: Form MUST validate client-side using a Zod schema in
  `lib/kudos/validation.ts`.
- **FR-004**: Hashtag list MUST be capped at 5; the picker hides the add
  button when full.
- **FR-005**: Image list MUST be capped at 5; the add button hides when full.
- **FR-006**: Cancel MUST always be enabled and MUST NOT prompt for
  confirmation (low-risk; no draft persistence yet).
- **FR-007**: Successful submit MUST navigate back to `/` and emit a
  `kudo_submitted` analytics event with `{ anonymous: boolean, hashtags: number, images: number }`.
- **FR-008**: All UI MUST meet WCAG 2.1 AA — labels associated with inputs,
  required state announced, focus rings visible.
- **TR-001**: No new external dependencies — uses native textarea + plain
  fetch / server actions for submission (server side is out of scope
  but a stubbed action MUST exist so the wiring is testable).

## Out of Scope

- Real backend persistence (Supabase table + RLS) — stub the action and
  log to analytics; the row write lands in a follow-up.
- File upload to object storage — keep images as in-memory `File` objects
  during the form lifetime; do not upload yet.
- Recipient autocomplete from the real `public.users` table — use a
  hard-coded mock list in `lib/kudos/mock.ts` for this iteration.
- Hashtag suggestion personalization (recent, trending) — use a flat
  curated list.
- `@mention` autocomplete inside the body — only the hint text is rendered.
- Draft / autosave.

## Dependencies

- [x] Constitution document
- [x] Routes constants (`lib/routes.ts` → `KUDOS_NEW`)
- [x] Homepage SAA `HomepageHeader`, `AppFooter`
- [x] Login redirect flow in `middleware.ts`
- [ ] Backend table — out of scope this iteration.
