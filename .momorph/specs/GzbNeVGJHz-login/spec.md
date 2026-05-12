# Feature Specification: Login

**Frame ID**: `GzbNeVGJHz`
**Frame Name**: `Login`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**Created**: 2026-05-11
**Status**: Draft

---

## Overview

The Login screen is the entry-point authentication surface for the SAA 2025 (Sun\*
Awards) web application. It allows unauthenticated visitors to:

1. Authenticate via **Google OAuth** as the sole sign-in method (no email/password
   form is presented).
2. Switch the interface language between Vietnamese (default), English, and
   Japanese before signing in.

The screen is deliberately minimal: a single primary call-to-action ("LOGIN With
Google"), a language switcher in the header, branding/welcome copy in the hero
area, and a footer copyright. There are no form fields on this screen — credentials
are never entered into SAA itself; the application only accepts the OAuth identity
returned by Google after the user authenticates on Google's domain.

**Target users**: Sun* Asterisk employees and authorized affiliates who hold a
Google identity inside the Sun* allowed-domain list.

**Business context**: Login is the gate for the entire SAA experience. Domain
allow-listing must be enforced server-side so that only Sun\* identities can reach
the application. Authenticated users who land on `/login` (e.g., via bookmark or
manual URL entry) must be forwarded to the application home without re-prompting.

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Unauthenticated user signs in with Google (Priority: P1)

An unauthenticated visitor opens `/login` and uses the single "LOGIN With Google"
button to authenticate. After completing the Google consent flow, they land on the
application home with an active session.

**Why this priority**: Without this flow no user can use SAA at all. It is the
single critical path for the entire product.

**Independent Test**: Open `/login` in a private browser, click "LOGIN With
Google", complete OAuth with a valid Sun\*-domain Google account in a test stub,
verify the user is redirected to `/` (Homepage SAA) and that the session cookie
is present and `httpOnly`.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user on `/login`,
   **When** they click "LOGIN With Google",
   **Then** the button enters a disabled/loading state and the browser is
   redirected to the Google OAuth consent URL.

2. **Given** a user who has just consented on Google with a Sun\*-domain account,
   **When** Google redirects back to `/auth/callback?code=…&state=…`,
   **Then** the server exchanges the code for a session, sets an `httpOnly`,
   `Secure`, `SameSite=Lax` session cookie, and 302-redirects the user to `/`.

3. **Given** the OAuth callback completes successfully,
   **When** the user subsequently revisits `/login` while still authenticated,
   **Then** the server detects the active session on mount and redirects to `/`
   without rendering the Login UI.

> Cancellation, domain rejection, network and 5xx error paths are covered by
> User Story 4 below.

---

### User Story 2 - Switch interface language before signing in (Priority: P2)

A visitor whose preferred language is not Vietnamese opens the language switcher
in the header, selects another language (English or Japanese), and sees the
Login screen copy update accordingly. Their choice persists across page reloads.

**Why this priority**: The product targets a multilingual workforce. Visitors
must be able to read the welcome and CTA in a language they understand before
trusting the sign-in.

**Independent Test**: Open `/login` (default Vietnamese), click the language
switcher in the header, select "EN", verify the welcome copy and button label
switch to English; reload the page and verify the language remains English.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user on `/login` with default locale `vi`,
   **When** they click the language switcher (`mms_A.2_Language`),
   **Then** a dropdown overlay opens listing the supported locales (`vi`, `en`,
   `ja`) with the currently selected one marked.

2. **Given** the language dropdown is open,
   **When** the user selects a different locale,
   **Then** all visible copy (welcome text, button label, language code label)
   updates to that locale, the dropdown closes, and the selection is persisted
   in a cookie so subsequent requests render in the chosen locale.

3. **Given** the language dropdown is open,
   **When** the user clicks outside the dropdown or presses `Esc`,
   **Then** the dropdown closes and the previously selected locale is retained.

---

### User Story 3 - Authenticated user is redirected away from `/login` (Priority: P2)

A user who already has a valid session opens `/login` (e.g., a bookmark, an old
tab). The system must not re-prompt for authentication; instead it must forward
the user to `/`.

**Why this priority**: Prevents wasteful re-auth, prevents confusing UI state,
and is explicitly listed as required behavior in the Figma test cases.

**Independent Test**: Sign in to obtain a valid session, then navigate to
`/login` directly via URL bar; verify the request 302-redirects to `/` and that
the Login UI is never rendered (no flash).

**Acceptance Scenarios**:

1. **Given** an authenticated user with a valid session cookie,
   **When** they request `/login`,
   **Then** the server returns a 302 redirect to `/` before any Login content
   is sent to the client.

2. **Given** an authenticated user whose session has expired between requests,
   **When** they request `/login`,
   **Then** the expired cookie is cleared and the Login screen is rendered
   normally with the button enabled.

---

### User Story 4 - OAuth and domain-gate failure handling (Priority: P3)

A user encounters an error during the OAuth flow — either Google returns an
error, the network drops, or the returned identity does not belong to an
allowed Sun\* domain. The screen must communicate the failure clearly without
leaking internal details, and must allow retry.

**Why this priority**: Reliability and security polish. Required for OWASP
compliance (Principle IV: do not leak internal errors; enforce domain server-side).

**Independent Test**: Simulate each failure mode (cancelled consent,
non-allowlisted email, network error from Google, 5xx from callback handler)
and verify the corresponding user-facing message appears and the button can be
retried.

**Acceptance Scenarios**:

1. **Given** the OAuth callback receives an identity whose email domain is not
   on the Sun\* allow-list,
   **When** the callback executes server-side,
   **Then** no session is created, the user is redirected back to `/login` with
   a generic `error=domain_not_allowed` query parameter, and the screen
   displays a localized message ("Email này không được phép truy cập SAA").

2. **Given** Google returns `?error=access_denied`,
   **When** the user lands back on `/login`,
   **Then** a localized "sign-in cancelled" message is shown and the button is
   re-enabled.

3. **Given** the callback handler fails with a 5xx,
   **When** the user is redirected back,
   **Then** a generic localized error is shown ("Không thể kết nối tới Google.
   Vui lòng thử lại."), with no stack traces, error IDs, or PII in the URL or
   visible UI.

4. **Given** the user is offline at the moment of clicking the button,
   **When** the OAuth initiation request fails,
   **Then** the button is re-enabled, a localized network-error message is
   shown, and no partial state is persisted.

---

### Edge Cases

- **Multiple rapid clicks** on the Google button must not initiate multiple
  parallel OAuth flows — the button is disabled the moment the first click is
  registered.
- **Direct GET to `/auth/callback` without OAuth params** must not crash; it
  must redirect to `/login` with no error displayed.
- **Replayed or stale `state` parameter** at the callback must be rejected with
  `error=invalid_state`.
- **Tampered `redirectTo` parameter** must be ignored; only same-origin paths
  are honored, with `/` as the default.
- **User signs in while another tab on the same browser is still on `/login`**:
  the other tab should detect the new session (via the Supabase auth listener)
  and self-redirect to `/`.
- **Language switcher used while OAuth flow is in-flight**: language change
  must be permitted; it does not abort the redirect.
- **Logout from any authenticated screen** brings the user back to `/login` in
  a clean unauthenticated state (session cookie cleared by the logout route).
- **403 re-authentication entry** (`Error 403 → Re-authenticate`) must land the
  user on `/login` and, after success, may forward them back to their intended
  destination if it was preserved as a safe (same-origin) `redirectTo`.

---

## UI/UX Requirements _(from Figma)_

### Screen Components

| Component                                             | Node ID                                              | Description                                                                                     | Interactions                                                                                                                                                                                                |
| ----------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header (`mms_A_Header`)                               | `662:14391`                                          | Top bar containing logo and language switcher (shared instance — reused across screens).        | Contains nested interactive children only.                                                                                                                                                                  |
| Logo (`mms_A.1_Logo`)                                 | `I662:14391;186:2166`                                | SAA brand mark in the header.                                                                   | **Non-interactive** on this screen (no click/hover effect per test case `b9805e65`).                                                                                                                        |
| Language Switcher (`mms_A.2_Language`)                | `I662:14391;186:1601`                                | Current-locale chip (flag + 2-letter code + chevron) that opens the language dropdown.          | Click → opens language dropdown overlay (`hUyaaugye2`). Keyboard: `Enter`/`Space` opens; `Esc` closes.                                                                                                      |
| Key Visual (`mms_C_Keyvisual` / `mms_B.1_Key Visual`) | `662:14388` / `662:14395`                            | Hero background artwork.                                                                        | Decorative only — no interaction.                                                                                                                                                                           |
| Hero Container (`mms_B_Bìa`)                          | `662:14393`                                          | Layout wrapper for the hero content (key visual + welcome text + CTA).                          | None — layout only.                                                                                                                                                                                         |
| Welcome Text (`mms_B.2_content`)                      | `662:14753`                                          | Two-line welcome copy ("Bắt đầu hành trình của bạn cùng SAA 2025." / "Đăng nhập để khám phá!"). | **Non-selectable, non-interactive** per test case `42b82364`. Localized.                                                                                                                                    |
| Google Login Button (`mms_B.3_Login`)                 | `662:14425` (button frame) / `662:14426` (CTA child) | Primary CTA labeled "LOGIN With Google" with Google icon.                                       | Click → starts OAuth flow (**same-window redirect** to Google consent, then back to `/auth/callback`). Disabled + spinner while in-flight. Keyboard: `Enter`/`Space` triggers click; auto-focused on mount. |
| Footer (`mms_D_Footer`)                               | `662:14447`                                          | Copyright line "Bản quyền thuộc về Sun\* © 2025" (shared instance, reused across screens).      | **Non-interactive** per test case `33a1dacf`.                                                                                                                                                               |

> Per project workflow rules, exact colors, fonts, spacing, and asset URLs are
> intentionally NOT documented here — they are fetched on demand by the
> implementer via `query_section` / `get_node` / `list_media_nodes`.

### Navigation Flow

- **Entry into Login**:
  - Default route for unauthenticated visitors when the route guard
    rejects a protected request.
  - Logout action from `Dropdown-profile` (`z4sCl3_Qtk`) or admin
    `Dropdown-profile Admin` (`54rekaCHG1`).
  - "Re-authenticate" action from the 403 error page (`T3e_iS9PCL`).

- **Exits from Login**:
  | Trigger | Destination |
  |---------|-------------|
  | Click "LOGIN With Google" | External: `accounts.google.com/...` (OAuth consent) |
  | OAuth callback success | `/` (Homepage SAA — `i87tDx10uM`) |
  | OAuth callback failure | `/login?error=<code>` (stay on Login) |
  | Click language switcher | Opens overlay `Dropdown-ngôn ngữ` (`hUyaaugye2`); no route change |

- **Back behavior**: No back navigation from this screen (it is an entry
  point). Browser back from authenticated pages may also land here when the
  session has been cleared.

### Behavioral / Layout Requirements

> Visual concerns (colors, spacing, typography, exact breakpoint widths, asset
> sizes) are explicitly out of scope for this spec — see Constitution
> Principle III for the responsive/accessibility baseline and consume CSS via
> `query_section` at implementation time. Only **behavior-affecting** layout
> rules appear below.

- **Header layout behavior**: The Header is a shared component instance.
  Within it, the logo remains anchored on the leading edge and the language
  switcher on the trailing edge across all viewport sizes (test cases
  `b9805e65`, `8415b629`).
- **Footer layout behavior**: The Footer remains visible (not hidden) on the
  Login screen regardless of scroll position (test case `33a1dacf`).
- **Accessibility behavior**: All interactive elements are keyboard-operable
  with visible focus indicators. The Google login button is auto-focused on
  mount. OAuth errors are announced via an ARIA live region
  (`role="status"` or `role="alert"`). The language switcher exposes its
  current selection via `aria-current` (or equivalent). All non-decorative
  imagery has descriptive `alt` text; the key visual is decorative
  (`alt=""`). The screen meets WCAG 2.1 Level AA.
- **Reduced-motion behavior**: All non-essential motion respects
  `prefers-reduced-motion`.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST render the Login screen at the route `/login`
  for unauthenticated users.
- **FR-002**: The system MUST initiate a Google OAuth authorization flow when
  the user activates the "LOGIN With Google" control (click, `Enter`, or
  `Space`).
- **FR-003**: The system MUST disable the "LOGIN With Google" control and
  display a loading indicator from the moment the OAuth request begins until
  navigation occurs (success or error redirect).
- **FR-004**: At `/auth/callback` the system MUST execute the following
  server-side checks **in order** and MUST abort (no session cookie set,
  redirect to `/login?error=<code>`) on the first failure:
  1. Validate the OAuth `state` parameter (reject missing / malformed /
     replayed — `error=invalid_state`).
  2. Exchange the OAuth `code` for an identity via Supabase (`error=provider_error`
     on failure).
  3. Verify the identity's email domain against the Sun\* allow-list
     (`error=domain_not_allowed` if not allowed).
  4. **Only after all of the above pass**, set the session as an `httpOnly`,
     `Secure`, `SameSite=Lax` cookie and 302-redirect to the safe
     `redirectTo` or `/`.
     Tokens MUST NOT be exposed to client JS at any stage.
- **FR-005**: The Sun\*-domain allow-list MUST be enforced **server-side** in
  the callback route, before any session cookie is set (FR-004 step 3). Domain
  identifiers are read from `auth_allowed_domains`; matching MUST be
  case-insensitive on the domain part of the email.
- **FR-006**: OAuth `state` validation (FR-004 step 1) MUST treat any of the
  following as failure: missing parameter, malformed value, value not
  originating from this server, value already consumed (replay). Failed
  validation MUST redirect to `/login?error=invalid_state` with the partial
  authentication artifacts (code, etc.) discarded.
- **FR-007**: The system MUST detect existing valid sessions on entry to
  `/login` and MUST redirect such users to `/` (or to a safe same-origin
  `redirectTo` if supplied).
- **FR-008**: The system MUST present a language switcher exposing the
  supported locales `vi` (default), `en`, `ja`. The current locale MUST be
  visually indicated.
- **FR-009**: Selecting a locale MUST update all visible copy on the screen and
  MUST persist the choice (cookie) so subsequent requests render in that
  locale.
- **FR-010**: The system MUST render localized error messages for the
  following error codes returned via the callback redirect: `access_denied`,
  `domain_not_allowed`, `invalid_state`, `provider_error`, `network_error`.
  Error messages MUST NOT include stack traces, identifiers, or PII.
- **FR-011**: The system MUST sanitize and validate any `redirectTo` query
  parameter — only same-origin relative paths are accepted; otherwise the
  default `/` MUST be used. (CSRF / open-redirect mitigation.)
- **FR-012**: Multiple rapid activations of the OAuth button MUST result in
  exactly one in-flight OAuth flow.
- **FR-013**: The Logo, Welcome Text, Key Visual, and Footer MUST be
  non-interactive on this screen.
- **FR-014**: The Footer MUST remain visible (not collapsed or hidden) on the
  Login screen regardless of scroll position.
- **FR-015**: The OAuth flow MUST use a **same-window redirect** to Google
  (Supabase `signInWithOAuth({ provider: 'google' })`). Popups and new tabs
  MUST NOT be used. (Resolves test case `60bc5bbb` ambiguity — wording
  "new tab or popup" was imprecise.)
- **FR-016**: The "LOGIN With Google" button MUST receive keyboard focus
  programmatically when the Login screen mounts, so a keyboard-only user can
  activate it with `Enter`/`Space` without first tabbing.

### Technical Requirements

- **TR-001 (Performance)**: At 75th percentile on representative networks,
  LCP < 2.5s, INP < 200ms, CLS < 0.1 (Constitution Principle III, Core Web
  Vitals).
- **TR-002 (Security – OAuth)**: Session cookies MUST be `httpOnly`, `Secure`,
  `SameSite=Lax`. The Supabase `service_role` key MUST NEVER be shipped to
  the client (Constitution Principle II & IV). Only `NEXT_PUBLIC_*` keys may
  appear in client bundles; none of those may be secrets.
- **TR-003 (Security – Authorization)**: Server-side allow-list and `state`
  validation MUST execute on every callback request; do not rely on any
  client-side check.
- **TR-004 (Security – Headers)**: Production responses for `/login` and
  `/auth/callback` MUST include `Content-Security-Policy`,
  `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, and `Permissions-Policy`.
- **TR-005 (Architecture)**: `/login` MUST be implemented primarily as a
  Server Component. Only the interactive children (login button, language
  switcher) may be Client Components, as per Constitution Principle II.
- **TR-006 (Validation)**: All inputs at the trust boundary — query strings
  (`code`, `state`, `error`, `redirectTo`) and the language selection — MUST
  be validated with the project's chosen schema validator (Zod).
- **TR-007 (Logging)**: The callback route MUST log enough to debug failures
  but MUST NOT log access/refresh tokens, full email addresses, or
  Authorization headers. Error responses to the client MUST NOT include
  stack traces in production.
- **TR-008 (i18n)**: Locale selection MUST be stored in a cookie readable by
  the server, so server-rendered copy is correct on first paint without a
  flash of untranslated text.
- **TR-009 (Browser support)**: Must function on the latest two stable
  versions of Chrome, Edge, Firefox, Safari, and the latest mobile Chrome
  and Safari.

### Key Entities

- **AuthSession**: Represents a successfully authenticated user session.
  - Attributes: `userId`, `email`, `emailDomain`, `provider` (constant `google`),
    `issuedAt`, `expiresAt`, `accessToken` (server-only), `refreshToken`
    (server-only).
  - Storage: Supabase Auth; surfaced to the application via a Supabase
    session cookie set by the callback route.
- **User** (created/upserted on first successful sign-in):
  - Attributes: `id` (Supabase auth user id), `email`, `displayName`,
    `avatarUrl`, `locale`, `createdAt`, `lastLoginAt`.
  - Storage: Supabase Postgres, with RLS enforcing self-row access for
    standard users (Constitution Principle II).
- **AllowedDomain**:
  - Attributes: `domain` (e.g., `sun-asterisk.com`), `enabled`, `notes`.
  - Storage: Supabase Postgres (`auth_allowed_domains` or similar). Managed
    by admins; read-only at runtime by the callback route.
- **LocalePreference**:
  - Attributes: `locale` (`vi` | `en` | `ja`), per-user (post-auth) and
    per-browser (pre-auth, cookie).
  - Storage: Cookie pre-auth; `users.locale` column post-auth.

---

## API Dependencies

| Endpoint                  | Method | Purpose                                                                                                                                                                                        | Status          |
| ------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `/api/auth/session`       | GET    | Check for an existing Supabase session on `/login` mount; used by middleware to decide whether to redirect authenticated users away.                                                           | Predicted (new) |
| `/api/auth/signin/google` | POST   | Initiate the Google OAuth redirect via Supabase (`signInWithOAuth({ provider: 'google' })`). Returns a 302 to Google's consent URL.                                                            | Predicted (new) |
| `/api/auth/callback`      | GET    | Handle the OAuth redirect from Google. Validates `state`, exchanges `code`, enforces the Sun\* domain allow-list, sets the session cookie, then 302-redirects to the safe `redirectTo` or `/`. | Predicted (new) |
| `/api/auth/signout`       | POST   | (Indirect dependency.) Clears the session cookie. Triggered from authenticated screens — entry into `/login`.                                                                                  | Predicted (new) |
| `/api/i18n/locale`        | PUT    | Optional: persist locale to the server-side cookie/user record. May be replaced by a direct `Set-Cookie` from a Server Action.                                                                 | Predicted (new) |

> All endpoints are predicted from screen behavior. Final shape will be
> formalized via `momorph.apispecs` once additional screens are discovered.

---

## State Management

### Local component state (Login screen Client subtree)

| State                    | Type                                                                                                        | Initial                | Purpose                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------ |
| `isAuthenticating`       | `boolean`                                                                                                   | `false`                | Disables the OAuth button and shows a spinner from click until navigation.           |
| `oauthError`             | `'access_denied' \| 'domain_not_allowed' \| 'invalid_state' \| 'provider_error' \| 'network_error' \| null` | parsed from `?error=…` | Drives the inline error message on the Login screen after a failed OAuth round-trip. |
| `isLanguageDropdownOpen` | `boolean`                                                                                                   | `false`                | Controls the language dropdown overlay.                                              |

### Server state

| State                         | Source                 | Notes                                                                                              |
| ----------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------- |
| Current session               | Supabase Auth (cookie) | Read in the Server Component on `/login` mount to decide whether to short-circuit with a redirect. |
| Allowed domains               | Supabase Postgres      | Read server-side in `/api/auth/callback` to enforce the allow-list.                                |
| Locale preference (pre-auth)  | Cookie                 | Read by the Server Component to render copy in the correct locale on first paint.                  |
| Locale preference (post-auth) | `users.locale` column  | Reconciled on first authenticated request.                                                         |

### Global state (post-auth)

| State         | Store                                    | R/W                                                                                          | Purpose |
| ------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------- | ------- |
| `session`     | Supabase client (subscription mirror)    | Written by Supabase SDK after the callback; read by all authenticated screens.               |
| `currentUser` | Lightweight client store (e.g., Zustand) | Hydrated from a server-rendered prop on first paint. Avoids re-fetching `/me` on every page. |
| `locale`      | i18n store                               | Read everywhere; written by the language switcher.                                           |

### Cache / invalidation

- The session check on `/login` mount MUST NOT be cached on the client beyond
  the lifetime of the request (the user's auth state may change between tabs).
- The locale cookie has a 1-year `Max-Age` and is updated immediately on
  selection; no further invalidation needed.
- No optimistic UI is appropriate on this screen — the only mutating action
  (initiating OAuth) results in a full-page navigation, not an in-place
  update.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: ≥ 99% of OAuth attempts from allow-listed Sun\* accounts on
  supported browsers result in a session within 5 seconds of returning from
  Google (excluding the user's time on Google's consent page).
- **SC-002**: 0 incidents of identities outside the Sun\* allow-list obtaining
  a session (server-side enforcement, audited via logs).
- **SC-003**: 0 occurrences of Supabase `service_role` or other secrets
  appearing in client bundles (verified by an automated check in CI on the
  built artifact).
- **SC-004**: Lighthouse accessibility score ≥ 95 for `/login` on mobile and
  desktop profiles; manual axe-core scan reports zero serious or critical
  violations.
- **SC-005**: Login screen Core Web Vitals at p75: LCP < 2.5s, INP < 200ms,
  CLS < 0.1.
- **SC-006**: Locale switching round-trip (click switcher → select → copy
  updates) completes in < 200ms perceived.
- **SC-007**: Authenticated users visiting `/login` are redirected before any
  Login UI paints (no visible flash of the Login screen).

---

## Out of Scope

- **Email/password authentication**: Only Google OAuth is supported per the
  current design. Adding password sign-in is a separate feature.
- **Other OAuth providers** (Microsoft, GitHub, Apple, etc.).
- **Account self-registration / domain self-service**: Allow-listed domains
  are managed by admins, not by users on this screen.
- **Password reset / account recovery**: Not applicable while Google OAuth is
  the sole method.
- **Two-factor authentication on top of Google**: Trusted to the upstream
  Google account.
- **Admin allow-list management UI**: Lives in the admin screens
  (`9ja9g9iJLW`, `fTCVEC9aV_`) and is specified separately.
- **Visual / pixel specification, CSS values, asset preparation**: Excluded
  by workflow rules; consumed by the implementation step on demand.
- **iOS Login screen (`8HGlvYGJWq`)**: Companion mobile app; out of scope for
  the web project unless explicitly added to scope.

---

## Dependencies

- [x] Constitution document exists (`.momorph/constitution.md`) — v1.0.0
      ratified 2026-05-11.
- [ ] Screen flow documented (`.momorph/contexts/SCREENFLOW.md`) — created
      alongside this spec.
- [ ] API specifications generated (`.momorph/API.yml`) — to be created via
      `momorph.apispecs` after at least 3 screens are discovered.
- [ ] Database schema completed (`.momorph/database.sql`) — must define
      `users`, `auth_allowed_domains`, and `users.locale` before
      implementation.
- [ ] Supabase project provisioned with Google OAuth provider enabled and
      callback URL registered.
- [ ] Sun\* email-domain allow-list confirmed by the platform/security team
      (initial values committed to the migration).
- [ ] i18n catalog populated with the strings used on this screen for `vi`,
      `en`, `ja`.

---

## Notes

- **Constitution alignment** (verified):
  - _Principle II — Tech Stack Best Practices_: `/login` is a Server
    Component by default; interactive children are isolated Client
    Components; Supabase Auth + `@supabase/ssr` is the chosen auth path;
    RLS will apply to `users` and `auth_allowed_domains`.
  - _Principle III — Responsive Web UI & Accessibility_: WCAG 2.1 AA,
    keyboard-operable controls, mobile-first responsive behavior, adequate
    touch target sizing (per WCAG guidance — exact pixel values handled at
    implementation time), focus management on the OAuth button.
  - _Principle IV — OWASP Secure Coding Practices_: `httpOnly`/`Secure`/
    `SameSite=Lax` cookies; server-side domain gating; `state` validation;
    `redirectTo` sanitization (open-redirect mitigation); no secrets in
    client bundles; localized non-leaking error messages; security headers
    on responses.
  - _Principle V — TDD (NON-NEGOTIABLE)_: every acceptance scenario above
    must map to at least one Vitest or Playwright test, written first and
    failing, before implementation.
- **Open questions** (non-blocking for spec approval; resolve in plan):
  - Should `redirectTo` be supported on this iteration, or always default
    to `/`? Recommendation: support it but constrain strictly to
    same-origin relative paths.
  - Is the locale switcher allowed to be a pure client-side toggle (cookie
    only) on first iteration, deferring `/api/i18n/locale` until users
    exist? Recommendation: yes — keep MVP smaller.
  - Will the Sun\* allow-list ever include subdomains or partner domains
    distinct from `sun-asterisk.com`? Recommendation: model as a list of
    domains in `auth_allowed_domains` from day one.
- **Hand-off pointers for implementation**:
  - Component node IDs above let the implementer fetch exact CSS via
    `mcp__momorph__query_section` and assets via `list_media_nodes` /
    `get_media_files`.
  - The shared Header (`mms_A_Header`, `662:14391`) and Footer
    (`mms_D_Footer`, `662:14447`) are reused across screens — implement
    once and import here.
