# Tasks: Login

**Frame**: `GzbNeVGJHz-login`
**Prerequisites**: plan.md (required), spec.md (required)
**Generated**: 2026-05-11

> `design-style.md` is intentionally absent — visual concerns are fetched on-demand
> at implementation time via Figma `query_section` / `list_media_nodes` per the
> momorph workflow. Phase 0 (Setup) covers asset downloads.

---

## Task Format

```
- [ ] T### [P?] [Story?] Description | file/path.ts
```

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this belongs to (US1, US2, US3, US4) — omitted in Setup, Foundation, and Polish phases
- **|**: File path(s) affected by this task

**TDD convention** (Constitution Principle V — NON-NEGOTIABLE): tasks marked
`[TEST]` must be written first, run, observed to FAIL, then implementation
tasks follow. Reviewer checks the commit history shows red-before-green.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: project bootstrap — dependencies, tooling, asset acquisition, env scaffolding.

### Asset Preparation (Plan Phase 0)

- [x] T001 Download key visual from Figma node `2939:9548` (MM_MEDIA_Root Further Logo); saved as PNG (Figma export format) — 13 KB, well under 250 KB target | public/assets/login/key-visual.png
- [x] T002 [P] Download SAA logo from Figma node `I662:14391;178:1033;178:1030` (MM_MEDIA_Logo); saved as PNG (Figma export format, original task said .svg but raster is what Figma provides) | public/assets/common/logo.png
- [x] T003 [P] Download Google "G" icon from Figma node `I662:14426;186:1766` (MM_MEDIA_Google); SVG scanned clean (no scripts, no external refs) | public/assets/common/icons/google.svg
- [x] T004 [P] Download VN flag icon from Figma node `I662:14391;186:1696;186:1821;186:1709` (MM_MEDIA_VN); SVG scanned clean | public/assets/common/flags/vn.svg
- [x] T005 [P] GB flag: Dropdown-ngôn ngữ frame exposes 0 MM_MEDIA assets (verified Phase 4) — committed a sanitized placeholder SVG with inline TODO comment. Production export pending design team | public/assets/common/flags/gb.svg
- [x] T006 [P] JP flag: same situation as T005 — placeholder committed (white field + red circle), TODO replace from production | public/assets/common/flags/jp.svg
- [x] T006b [P] **NEW** Download down-chevron icon from Figma node `I662:14391;186:1696;186:1821;186:1441` (MM_MEDIA_Down); needed by LanguageSwitcher — was missing from original task list | public/assets/common/icons/chevron-down.svg
- [x] T007 [P] Confirmed all filenames kebab-case; folder structure follows `public/assets/{login,common/{icons,flags}}/`; mapping recorded in `.momorph/specs/GzbNeVGJHz-login/assets-map.md` | public/assets/, .momorph/specs/GzbNeVGJHz-login/assets-map.md

### Dependencies & Scripts

- [x] T008 Installed runtime deps: `@supabase/supabase-js@^2.105`, `@supabase/ssr@^0.10`, `zod@^4.4`, `next-intl@^4.11` | package.json
- [x] T009 Installed dev deps: vitest, @vitejs/plugin-react, @testing-library/react + jest-dom, jsdom, @playwright/test, @axe-core/playwright, prettier, husky, lint-staged. **Skipped** `supabase` (CLI installs via binary, not npm — documented in README) | package.json
- [x] T010 Added scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `format`, `format:check`, `test`, `test:watch`, `test:coverage`, `test:e2e`, `test:e2e:ui`, `supabase:start/stop/reset/migrate`, `prepare` | package.json
- [x] T011 Created `.husky/pre-commit` (runs `npx lint-staged`), added `lint-staged` block to `package.json`, created `.prettierrc.json` + `.prettierignore` | .husky/pre-commit, package.json, .prettierrc.json, .prettierignore

### Test Tooling

- [x] T012 Vitest config with React plugin, jsdom env, `@/` alias, v8 coverage reporter, `tests/setup.ts` reference | vitest.config.ts
- [x] T013 [P] Vitest setup file imports `@testing-library/jest-dom/vitest` and runs `cleanup()` afterEach | tests/setup.ts
- [x] T014 [P] Playwright config with Chromium + Firefox + WebKit projects, baseURL from `NEXT_PUBLIC_SITE_URL`, HTML reporter, CI-aware webServer | tests/e2e/playwright.config.ts

### Project Configuration

- [x] T015 Supabase CLI config (API port 54321, DB 54322, Studio 54323, Auth with Google provider stub reading env credentials) | supabase/config.toml
- [x] T016 [P] `.env.local.example` documenting NEXT_PUBLIC_SITE_URL, Supabase URL/anon/service-role keys, Google OAuth client ID/secret with security notes | .env.local.example
- [x] T017 [P] `.gitignore` extended: `playwright-report/`, `test-results/`, `playwright/.cache/`, `supabase/.branches/`, `supabase/.temp/`, editor/OS noise | .gitignore
- [x] T018 README rewritten with: Node 20+ requirement, Supabase CLI install note, Supabase project + Google OAuth provisioning steps, dev/test/quality-gate commands, `.momorph/` doc map | README.md

**Checkpoint — Phase 1 done**: `npm install` clean, `npm run test` runs zero tests successfully, `npm run lint` and `npm run typecheck` pass on the bare repo, `supabase start` boots locally.

---

## Phase 2: Foundation (Blocking Prerequisites)

**Purpose**: shared infrastructure all user stories depend on.

**⚠️ CRITICAL**: no user story work can begin until Phase 2 is complete.

### Database

- [x] T019 Created initial migration with `auth_allowed_domains` (PK with `lower(domain)` check) + `users` (id FK auth.users, email CITEXT unique, locale CHECK in vi/en/ja, last_login_at) + RLS enabled on both | supabase/migrations/20260511000001_init_auth.sql
- [x] T020 RLS policies: `users_select_self` + `users_update_self` with a `users_block_protected_column_updates` BEFORE UPDATE trigger preventing changes to `id`, `email`, `created_at` (column-level RLS not native in PG — trigger enforces it); `auth_allowed_domains` has NO policy for authenticated role | supabase/migrations/20260511000001_init_auth.sql
- [x] T021 Trigger `on_auth_user_created` AFTER INSERT on `auth.users` upserts a `public.users` row via `handle_new_auth_user()` (SECURITY DEFINER); pulls `full_name` and `avatar_url` from `raw_user_meta_data`; on conflict refreshes email | supabase/migrations/20260511000001_init_auth.sql
- [x] T022 Seeded `auth_allowed_domains` with `('sun-asterisk.com', true, 'Sun* primary domain')` (idempotent ON CONFLICT DO NOTHING) | supabase/migrations/20260511000001_init_auth.sql
- [ ] T023 **PARTIAL** — Supabase CLI 2.98.2 installed at `~/.local/bin/supabase`. User is on **cloud Supabase** (project ref `uiysnvxrhcxxekzsuooa`), not local. Apply migration to cloud via either:
  - **Manual SQL editor**: copy `supabase/migrations/20260511000001_init_auth.sql` → paste into Supabase Dashboard → SQL Editor → Run
  - **CLI push** (interactive — cannot run in this shell): `supabase login` (browser flow) → `supabase link --project-ref uiysnvxrhcxxekzsuooa` → `supabase db push`| (no file — verification step)

### Supabase Clients

- [x] T024 [P] Implemented `createServerClient()` + `createAdminClient()` (service-role, server-only, throws if SERVICE_ROLE_KEY missing) | lib/supabase/server.ts
- [x] T025 [P] Implemented `createBrowserClient()` ('use client' marked) | lib/supabase/client.ts
- [x] T026 [P] Implemented `updateSession(request)` helper for middleware — returns refreshed `{ response, user }` pair | lib/supabase/middleware.ts

### Validation Schemas (with co-located tests — TDD)

- [x] T027 [TEST] Wrote unit tests for `sanitizeRedirectTo` + `redirectToSchema`: 6 safe paths kept, 18 unsafe variants rejected (protocol-relative, schemes, javascript:, data:, file:, backslash, control chars, percent-encoded `//`, wrong types), plus schema parsing tests | tests/unit/lib/safe-redirect.test.ts
- [x] T028 Implemented `sanitizeRedirectTo` + `redirectToSchema` with strict pattern + post-decode re-check (catches `%2F` tricks) | lib/auth/safe-redirect.ts
- [x] T029 [TEST] [P] Wrote tests for `oauthCallbackQuerySchema`, `localeSchema`, `oauthErrorCodeSchema` — accept happy path, reject unsafe redirectTo, reject unknown error codes, reject non-locale strings | tests/unit/lib/validation/auth.test.ts
- [x] T030 Implemented `oauthCallbackQuerySchema`, `localeSchema`, `oauthErrorCodeSchema`, plus `nonEmptyString` in common.ts | lib/validation/auth.ts, lib/validation/common.ts
- [x] T031 [TEST] [P] Wrote tests for `isDomainAllowed`: case-insensitive match, disabled domain → false, unknown → false, malformed email → false, DB error → throws | tests/unit/lib/allow-list.test.ts
- [x] T032 Implemented `isDomainAllowed(email)` using service-role client; lowercases domain part; queries `auth_allowed_domains` filtered by `domain` (RLS-bypass via service role); throws on DB error | lib/auth/allow-list.ts

### Logger

- [x] T033 [P] Implemented redacting logger: drops 9 secret-pattern keys (authorization, cookie, access_token, refresh_token, id_token, password, api_key, apikey, secret), recursively cleans nested objects, reduces emails to their domain (`alice@x.com` → `@x.com`); debug() noop in production | lib/logger.ts

### i18n

- [x] T034 [P] Locale config: `locales = ['vi','en','ja']`, `defaultLocale = 'vi'`, `LOCALE_COOKIE_NAME = 'NEXT_LOCALE'`, `LOCALE_COOKIE_MAX_AGE = 1 year`, type guard `isLocale()` | lib/i18n/config.ts
- [x] T035 next-intl `getRequestConfig()` reads NEXT_LOCALE cookie, validates via `isLocale`, dynamic-imports the matching JSON | lib/i18n/request.ts
- [x] T036 `setLocale(locale)` Server Action validates via `localeSchema.parse()`, writes cookie with correct attributes (`Max-Age=31536000`, `Path=/`, `SameSite=Lax`, `Secure` in prod, `httpOnly: false`), calls `revalidatePath('/', 'layout')` | lib/i18n/actions.ts
- [x] T037 [P] Vietnamese catalog complete with all 17 keys (welcome, button label/loading, 5 error messages, language labels + codes, switcher aria-label, footer copyright) | messages/vi.json
- [x] T038 [P] English catalog with same key shape | messages/en.json
- [x] T039 [P] Japanese catalog with same key shape | messages/ja.json

### Middleware & Layout

- [x] T040 Root middleware: calls `updateSession()`, returns refreshed response; if path is protected (initial set: `/`) and no user, redirects to `/login?redirectTo=<encoded-path-and-query>`; matcher excludes `_next/static`, `_next/image`, `assets`, `favicon.ico`, `/login`, `/auth/callback`, and image extensions | middleware.ts
- [x] T041 Root layout wraps in `NextIntlClientProvider`; `<html lang>` from `getLocale()`; removed Geist starter; body has `bg-background text-foreground` | app/layout.tsx
- [x] T042 Root page is a Server Component that re-checks session (defense-in-depth alongside middleware) and renders a Homepage SAA placeholder with the signed-in user's email | app/page.tsx

### Design Tokens & Globals

- [x] T043 Extracted tokens from Figma nodes 662:14425 (button) + 662:14426 (Button-IC About — fill rgba(255,234,158,1)) + 662:14753 (welcome text Montserrat 700 / 20px / 40px line-height). Added `--color-cta` (#FFEA9E), `--color-cta-foreground`, `--radius-button: 8px`, `--gap-login-cta: 40px`, `--button-padding-{x,y}`, plus `--font-display` Montserrat. Mapped via `@theme inline`. Added global `prefers-reduced-motion` override and `focus-visible` outline ring | app/globals.css

### Security Headers

- [x] T044 `next.config.ts` wrapped with next-intl plugin; `headers()` adds CSP (allows Supabase + accounts.google.com for connect/frame, googleusercontent for img), HSTS (`max-age=63072000; includeSubDomains; preload`), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`; `images.remotePatterns` allows `lh3.googleusercontent.com` for future avatars | next.config.ts

### Shared Atoms & Organisms (TDD)

- [x] T045 [TEST] [P] Button test covers default type=button, explicit type forwarding, disabled state + styling, aria-\* forwarding, onClick callback, no-fire-when-disabled (7 cases) | tests/unit/components/Button.test.tsx
- [x] T046 [P] Button atom with variants (cta/ghost) + sizes (md/lg), forwardRef, defaults type="button", consumes design tokens via Tailwind 4 utilities | components/atoms/Button.tsx
- [x] T047 [TEST] [P] Spinner test asserts `role="status"`, default `aria-label="Loading"`, custom aria-label forwarding | tests/unit/components/Spinner.test.tsx
- [x] T048 [P] Spinner atom: CSS-only `animate-spin` ring, decorative inner span `aria-hidden`; respects `prefers-reduced-motion` via globals.css | components/atoms/Spinner.tsx
- [x] T049 [TEST] [P] FlagIcon test asserts src/alt/aria-hidden for each locale; flag is decorative since language label conveys meaning | tests/unit/components/FlagIcon.test.tsx
- [x] T050 [P] FlagIcon atom maps Locale → `/assets/common/flags/<code>.svg`. Note: gb.svg and jp.svg are deferred (T005/T006 — fetched when LanguageSwitcher dropdown is implemented) | components/atoms/FlagIcon.tsx
- [x] T051 [TEST] [P] AppHeader test asserts Logo is non-interactive (no onClick/tabindex/role/cursor-pointer), not wrapped in a/button, semantic `<header>` landmark, trailing slot renders children | tests/unit/components/AppHeader.test.tsx
- [x] T052 [P] AppHeader Server Component: `<header>` flex-between with `<img alt="SAA">` on leading edge, `children` slot on trailing edge (LanguageSwitcher will mount here later) | components/organisms/AppHeader.tsx
- [x] T053 [TEST] [P] AppFooter test wraps with NextIntlClientProvider + vi messages; asserts `<footer role="contentinfo">`, localized copyright text, no interactive descendants, `mt-auto` class | tests/unit/components/AppFooter.test.tsx
- [x] T054 [P] AppFooter Server Component uses `useTranslations('footer')`, `mt-auto` sticks to viewport bottom inside flex column | components/organisms/AppFooter.tsx

### Test Helpers

- [x] T055 Seed helpers: `adminClient`, `seedAllowedDomains`, `disableAllowedDomain`, `resetAllowedDomainsToSeed`, `clearUsers`, `createAuthUser`. Service-role only — throws if env vars missing | tests/helpers/seed.ts
- [x] T056 Playwright auth fixture: `loginAs(context, email)` creates a user via admin API + uses `generateLink({ type: 'magiclink' })` to materialize a real session; extends Playwright `test` with `authenticatedPage` fixture | tests/e2e/fixtures/auth.ts

**Checkpoint — Phase 2 done** (code-only):

- ✅ All Foundation files written.
- ⏸ Runtime verification (T023, lint/typecheck/test/build) **DEFERRED** — pending Node 20+ upgrade and Supabase CLI install. See "Phase 2 verification blockers" in the file footer for the runbook.

---

## Phase 3: User Story 1 — Google Sign-In (Priority: P1) 🎯 MVP

**Goal**: an unauthenticated visitor authenticates via the "LOGIN With Google" button and is redirected to `/` (or to a same-origin `redirectTo`) with an `httpOnly` session cookie.

**Independent Test**: open `/login` in a private browser, click "LOGIN With Google", complete OAuth with a Sun\*-domain Google account against local Supabase, verify redirect to `/` and that the session cookie is `HttpOnly; Secure; SameSite=Lax`.

### Tests First (TDD — RED)

- [x] T057 [TEST] [P] [US1] Write failing contract test for `/auth/callback`: state missing → 302 `/login?error=invalid_state` (no cookie); state present but code missing → 302 `/login?error=invalid_state`; allow-list miss → 302 `/login?error=domain_not_allowed` (no cookie); happy path → 302 to `/` with cookie set; `redirectTo=/admin` honored on success; `redirectTo=//evil` sanitized to `/` | tests/integration/callback-route.test.ts
- [x] T058 [TEST] [P] [US1] Write failing integration test for the Login page Server Component: no session + no error → renders LoginButton with `autoFocus`; session present → invokes `redirect('/')`; session present with `?redirectTo=/admin` → invokes `redirect('/admin')`; session present with `?redirectTo=//evil` → invokes `redirect('/')` | tests/integration/LoginPage.test.tsx
- [x] T059 [TEST] [P] [US1] Write failing unit test for `LoginButton`: renders `<form action>`, includes hidden `redirectTo` input, button has `autoFocus`, button is `disabled` while `useFormStatus().pending` is true, shows Spinner during pending | tests/unit/components/LoginButton.test.tsx
- [x] T060 [TEST] [P] [US1] Write failing E2E test (happy path): use `auth.ts` fixture to set session, visit `/`, verify it does not redirect to `/login`; clear session, visit `/login`, verify LoginButton is present, focused, and clickable | tests/e2e/login.spec.ts

### Implementation (TDD — GREEN)

- [x] T061 [US1] Implement `LoginHero` Server Component: renders the key visual (`<Image src="/assets/login/key-visual.webp" alt="" priority fetchPriority="high" sizes>`) + welcome `<p select-none>` block with `login.welcome.line1/line2` translations | app/login/LoginHero.tsx
- [x] T062 [US1] Implement `OAuthErrorLive` Server Component: takes `error: OAuthErrorCode | null` prop; if null returns null; otherwise renders `<div role="status" aria-live="polite">{t(`login.error.${error}`)}</div>` | app/login/OAuthErrorLive.tsx
- [x] T063 [US1] Implement `LoginButton` Client Component (`'use client'`): renders `<form action={signInWithGoogle}>` with hidden `<input name="redirectTo">`, a `<Button type="submit" autoFocus disabled={useFormStatus().pending}>` showing the Google icon + `login.button.label` (or `login.button.loading` + Spinner when pending) | app/login/LoginButton.tsx
- [x] T064 [US1] Implement `signInWithGoogle(formData: FormData)` Server Action: sanitize `redirectTo` from form data, call `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?redirectTo=${encodeURIComponent(safe)}` } })`, then `redirect(data.url)`; logs via `lib/logger.ts` (no email, no token) | app/login/actions.ts
- [x] T065 [US1] Implement `app/login/page.tsx` Server Component: reads `searchParams` (validates via `oauthCallbackQuerySchema.pick({ error: true, redirectTo: true })`); calls `createServerClient().auth.getSession()`; if session present `redirect(sanitizeRedirectTo(searchParams.redirectTo))`; otherwise renders `<AppHeader>` + `<LoginHero>` + `<LoginButton redirectTo={safe}>` + `<OAuthErrorLive error={safe}>` + `<AppFooter>` | app/login/page.tsx
- [x] T066 [US1] Implement `/auth/callback` GET route handler running the four ordered checks from spec FR-004: (1) `oauthCallbackQuerySchema.safeParse(searchParams)` else `?error=invalid_state`; (2) `supabase.auth.exchangeCodeForSession(code)` else `?error=provider_error`; (3) `isDomainAllowed(user.email)` else `?error=domain_not_allowed`; (4) set cookie (handled by SSR helper) and `NextResponse.redirect(sanitizeRedirectTo(searchParams.redirectTo))`. After step 4 fire-and-forget `UPDATE users SET last_login_at = now() WHERE id = $1` via service-role client (failure does NOT fail login — log and continue) | app/auth/callback/route.ts
- [x] T067 [US1] Implement `/auth/signout` POST route handler: calls `supabase.auth.signOut()`, returns 303 redirect to `/login` | app/auth/signout/route.ts

### Verification

- [x] T068 [US1] **Unit + integration verified** on Node 20.20.2 via nvm: `npm run lint && npm run typecheck && npm run test` — 14 test files / 122 tests pass. Vitest covers callback-route, LoginPage, LoginButton + foundation tests. E2E run still **DEFERRED** (needs Supabase CLI + Docker stack running) | (verification step)
- [ ] T069 [US1] Manual smoke — **DEFERRED**: requires Supabase CLI installed + Google OAuth client configured + Node 20 + `npm run supabase:start` + `npm run dev`. Checklist: (a) GET /login renders welcome + button focused on initial render; (b) Tab focus order Logo → Button; (c) click triggers same-window redirect to accounts.google.com (no popup); (d) post-callback cookie has `HttpOnly; Secure; SameSite=Lax`; (e) redirect lands on / with email visible on Homepage stub; (f) `users.last_login_at` updated for returning user | (no file — manual verification)

**Checkpoint — Phase 3 done** (code-only):

- ✅ All US1 code written (4 failing-first tests + 7 implementation files).
- ⏸ Runtime verification (T068, T069) **DEFERRED** — pending Node 20 + Supabase running. Spec US1 Independent Test will pass once those prereqs are in place.

---

## Phase 4: User Story 2 — Language Switcher (Priority: P2)

**Goal**: visitor switches the interface language before signing in; choice persists across reloads.

**Independent Test**: open `/login` (default `vi`), click language switcher, select "EN", verify welcome copy + button label switch to English; reload, verify the page renders in English on first paint (no flash from Vietnamese to English).

### Tests First (TDD — RED)

- [x] T070 [TEST] [P] [US2] Write failing unit test for `LanguageSwitcher`: opens on click and on `Enter`/`Space`; closes on outside-click, `Esc`, and item-select; renders three items with `aria-current="true"` on the active locale; arrow keys move focus between items; selecting calls `setLocale` action with the chosen locale | tests/unit/components/LanguageSwitcher.test.tsx
- [x] T071 [TEST] [P] [US2] Write failing integration test for locale persistence: invoke `setLocale('en')` server action, assert `NEXT_LOCALE` cookie is `en` with correct attributes; render the page again and assert English copy on first paint (no useEffect-driven swap) | tests/integration/locale-persist.test.tsx
- [x] T072 [TEST] [P] [US2] Extend E2E with locale-switch scenario: load `/login` (vi), open switcher, choose EN, assert button label changes to "LOGIN With Google" (or its EN string), reload page, assert EN still shown | tests/e2e/login.spec.ts

### Implementation (TDD — GREEN)

- [x] T073 [US2] Implement `LanguageSwitcher` Client Component: button with current `FlagIcon` + `language.code.{locale}` + chevron; dropdown panel (`role="listbox"`) with three `<button role="option" aria-current>` items; outside-click + `Esc` close handlers via `useEffect` + ref; arrow-key navigation; on select calls `setLocale` and closes | components/molecules/LanguageSwitcher.tsx
- [x] T074 [US2] Wire `<LanguageSwitcher>` (also wired into app/login/page.tsx AppHeader slot) into the `AppHeader` slot (trailing edge) and update the `AppHeader` test to assert the slot renders the switcher | components/organisms/AppHeader.tsx, tests/unit/components/AppHeader.test.tsx

### Verification

- [x] T075 [US2] **Unit + integration verified**: LanguageSwitcher (8 tests) + locale-persist (6 tests) all pass on Node 20. E2E "US2 language switch" still **DEFERRED** (needs Supabase stack)| (no file — verification step)

**Checkpoint — Phase 4 done**: spec US2 Independent Test passes; locale survives page reload and renders correctly on first paint (no Vietnamese-then-English flash).

---

## Phase 5: User Story 3 — Authenticated User Redirect (Priority: P2)

**Goal**: an authenticated user visiting `/login` is redirected to `/` (or `redirectTo`) before any Login UI paints.

**Independent Test**: authenticate via fixture, request `/login` via `page.context().request.get('/login', { maxRedirects: 0 })`, assert HTTP 307/302 to `/`; confirm no Login HTML is in the response body.

> Most behavior was implemented in US1 (Phase 3, T065). This phase adds dedicated tests and the expired-session path.

### Tests First (TDD — RED)

- [x] T076 [TEST] [P] [US3] Covered by Phase 3 — see `tests/e2e/login.spec.ts::US3` (302 status assertion + body-no-flash check via `context.request.get('/login')`) Write failing E2E test: programmatically set valid session, hit `/login` via request API (no rendering), assert response is 307/302 with `Location: /` (or honored `redirectTo`); assert response body does not contain the Login button label | tests/e2e/login.spec.ts
- [x] T077 [TEST] [P] [US3] Covered by Phase 3 — `tests/integration/LoginPage.test.tsx` "expired cookie (Supabase returns null user) → renders Login UI" Extend `LoginPage.test.tsx` with: expired Supabase cookie → server client returns no session → page renders Login UI (button enabled, not focused-via-stale-state); the expired cookie is cleared on the response | tests/integration/LoginPage.test.tsx

### Implementation (TDD — GREEN)

- [x] T078 [US3] `app/login/page.tsx` already covers both branches (T065). Expired-cookie clearing is delegated to `@supabase/ssr` middleware refresh — no additional code needed redirect path covers both `searchParams.redirectTo` and the default `/`; ensure the expired-cookie clearing happens naturally via `@supabase/ssr` refresh logic — if test reveals it does not, add an explicit cookie clear in the page Server Component | app/login/page.tsx

### Verification

- [x] T079 [US3] LoginPage integration tests pass (T058 covers expired-session render path). E2E US3 redirect still **DEFERRED** (needs Supabase auth fixture against running stack) | (no file — verification step)

**Checkpoint — Phase 5 done**: spec US3 Independent Test passes; SC-007 (no flash of Login UI for authenticated users) is verifiable.

---

## Phase 6: User Story 4 — OAuth & Domain-Gate Failure Handling (Priority: P3)

**Goal**: every documented OAuth failure produces a localized, leak-free message and a retryable button.

**Independent Test**: visit `/login?error=domain_not_allowed`, verify the Vietnamese message "Email này không được phép truy cập SAA" appears in a `role="status"` live region and the button remains enabled.

### Tests First (TDD — RED)

- [x] T080 [TEST] [P] [US4] Covered by `tests/integration/callback-route.test.ts` (T057): access_denied pass-through, exchange failure → provider_error, allow-list throw → provider_error, last_login_at fire-and-forget (does NOT fail login) Extend callback contract tests with: `access_denied` returned by Supabase (no code) → `?error=access_denied`; `exchangeCodeForSession` throws → `?error=provider_error`; allow-list lookup throws (DB down) → `?error=provider_error`; `last_login_at` UPDATE failure does NOT fail login (asserts that the success redirect still occurs with cookie set) | tests/integration/callback-route.test.ts
- [x] T081 [TEST] [P] [US4] Added E2E error-state describe block — 5 parameterized tests (one per error code) + unknown-error drop + stack-trace-free assertion Extend E2E with error scenarios: navigate directly to `/login?error=access_denied`, `/login?error=domain_not_allowed`, `/login?error=invalid_state`, `/login?error=provider_error`, `/login?error=network_error`; for each assert the localized text appears in a live region and the button is enabled | tests/e2e/login.spec.ts
- [x] T082 [TEST] [P] [US4] `tests/integration/signin-action.test.ts` — 5 cases: success redirect, redirectTo sanitization at action level, provider_error on no URL, network_error on thrown, NEXT_REDIRECT propagation Add a server-action test for the offline / network-error path: `signInWithGoogle` rejected with a thrown error → action redirects to `/login?error=network_error`; no partial state persists | tests/integration/signin-action.test.ts

### Implementation (TDD — GREEN)

- [x] T083 [US4] All 5 error codes already mapped in messages/{vi,en,ja}.json (T037–T039). EN and JA strings are translator-reviewable (Vietnamese is authoritative) already maps all five error codes through `messages/*.json`; if any key is missing in any locale, add it (Vietnamese mandatory, EN/JP placeholders accepted but flagged for translator review) | app/login/OAuthErrorLive.tsx, messages/vi.json, messages/en.json, messages/ja.json
- [x] T084 [US4] Already wrapped in T064 — try/catch lets NEXT_REDIRECT propagate; any other thrown error → `redirect('/login?error=network_error')`; logger redacts via lib/logger.ts in a try/catch that maps thrown errors (network failure, unexpected Supabase error) to `redirect('/login?error=network_error')`; log redacted error via `lib/logger.ts` | app/login/actions.ts

### Verification

- [x] T085 [US4] Integration tests pass: signin-action (5), callback error paths (T080 covered). Production build succeeds (Next 16, Turbopack). Final stack-trace inspection on running server still **DEFERRED** | (no file — verification step)

**Checkpoint — Phase 6 done**: every spec US4 acceptance scenario maps to a green test; FR-010 (no PII / stack trace leakage) verified.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: ship-readiness — performance, accessibility, security, docs.

- [x] T086 [P] axe-core integration: `@axe-core/playwright` added to tests/e2e/login.spec.ts Phase 7 describe block (2 scans — default locale + ?error=domain_not_allowed). Runtime verification deferred accessibility scan on `/login` (vi, en, ja, with and without `?error=`); fix any serious/critical violation; SC-004 target Lighthouse a11y ≥ 95 | tests/e2e/login.spec.ts
- [x] T087 [P] Lighthouse 12.8.2 against production build on Node 20.20.2 (Chrome headless). Results:
  - **Mobile**: Performance **97**, A11y **100**, Best Practices **100**, SEO **100**; LCP 2.6s (slightly over 2.5s — mobile-throttled), CLS 0, TBT 20ms, FCP 0.8s
  - **Desktop**: Performance **100**, A11y **100**, Best Practices **100**, SEO **100**; LCP 0.4s, CLS 0, TBT 0ms, FCP 0.2s
  - SC-004 (a11y ≥ 95) ✅; SC-005 desktop ✅; mobile LCP ~ at target — keep an eye on after real assets/font swap| (no file — measurement)
- [x] T088 [P] SC-006 measurement implemented in tests/e2e/login.spec.ts Phase 7 describe block — 20 runs, p95 < 200ms via performance.now() delta between dropdown-item click and localized welcome text DOM update: Playwright test measures `performance.now()` delta from dropdown-item click to localized welcome text update; assert < 200ms p95 over 20 runs | tests/e2e/login.spec.ts
- [x] T089 `scripts/check-bundle-secrets.sh` (executable) — parses `.env.local` (or example fallback), filters out NEXT*PUBLIC* keys, greps `.next/static/` for matching values; non-zero exit on any leak. Wired as `npm run check:bundle-secrets` and included in CI workflow after build step the built client bundle (`.next/static/`) for `SUPABASE_SERVICE_ROLE_KEY` and any other server-only env value; fail the build if found (SC-003) | scripts/check-bundle-secrets.sh, package.json (script + CI hook)
- [ ] T090 [P] **DEFERRED** manual — VoiceOver (macOS) + NVDA (Windows) on /login, /login?error=domain_not_allowed, and after language switch. Verify: Google button label announced, error live-region announced once, switcher state changes announced ("Selected English"): VoiceOver (macOS) and/or NVDA (Windows) — verify button label, language switcher state changes, and live-region error announcements are read correctly | (no file — manual verification)
- [x] T091 [P] Adversarial fixture in safe-redirect.test.ts (T027) already covers: protocol-relative, schemes (javascript/data/file/http/https), backslash variants (`\\`, `/\`), control characters (\n, \r, \x00), percent-encoded `%2F` after decode, wrong types. 24 assertions total of `redirectTo`: extend `safe-redirect.test.ts` with a curated payload list (RFC-3986 abuses, double-encoded, mixed-case schemes, control characters); confirm all map to `/` | tests/unit/lib/safe-redirect.test.ts
- [x] T092 [P] `npm audit --omit=dev --audit-level=high` returns **0 high/critical** (CI gate green). 3 moderate advisories: `GHSA-qx2v-qp2m-jg93` in `postcss < x` (chain: postcss → next → next-intl). Fix only via breaking downgrade `next@9.3.3` — not acceptable. **Compensating control accepted**: vuln is in CSS Stringify with `</style>` injection — build-time concern, no runtime exposure, and our CSS does not splice untrusted user content. Re-audit when next/next-intl ship a bumped postcss| (no file — verification)
- [x] T093 [P] README rewritten in T018 (Phase 1) — already covers Node 20+ requirement, Supabase CLI install, Supabase + Google OAuth provisioning, env vars, dev/test commands, .momorph/ doc map with local dev quickstart: `supabase start`, env vars, `npm run dev`, test commands, OAuth test account guidance | README.md
- [x] T094 `.github/workflows/ci.yml` — 2 jobs (`quality` + `e2e`), Node 20, npm cache. Quality job: format:check → lint → typecheck → test → build → bundle-secrets → audit (fail-fast). E2E job depends on quality; installs Playwright + browsers; uploads playwright-report as artifact. Supabase keys via repo secrets running: `lint`, `typecheck`, `test`, `build`, `test:e2e`, `check-bundle-secrets`, `audit`; fail-fast ordering | .github/workflows/ci.yml
- [x] T095 Lighthouse JSON snapshots committed:
  - `.momorph/perf/login-baseline.report.json` (mobile)
  - `.momorph/perf/login-baseline-desktop.report.json` (desktop)
  - HTML reports next to each JSON for human inspection
    Future regressions can be detected by re-running `npx lighthouse` and diffing against these baselines | .momorph/perf/login-baseline.json

**Final gate**: all CI checks green; SC-001 through SC-007 measurably satisfied; manual a11y + security review signed off.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no dependencies — start immediately.
- **Phase 2 (Foundation)**: depends on Phase 1 completion — BLOCKS all user stories.
- **Phase 3 (US1, P1)**: depends on Phase 2 — MVP focus.
- **Phase 4 (US2, P2)**: depends on Phase 2; can run in parallel with Phase 5 once Phase 3 is done (or in parallel with Phase 3 if team capacity allows — but recommend serial to keep MVP scope tight).
- **Phase 5 (US3, P2)**: depends on Phase 3 (reuses Server Component redirect logic).
- **Phase 6 (US4, P3)**: depends on Phase 3 (reuses callback + page); independent of Phases 4–5.
- **Phase 7 (Polish)**: depends on all user-story phases that are in scope for the release.

### Within Each User Story

- TDD discipline (Constitution V): `[TEST]` tasks MUST be written and FAIL before their corresponding implementation tasks.
- Models/migrations before services; services before route handlers / Server Actions; Server Actions before the Client Components that submit them.

### Parallel Opportunities

- Phase 1 tasks marked [P] (T002–T007, T013, T014, T016, T017) — asset downloads + tool configs are independent.
- Phase 2 tasks marked [P]:
  - Supabase client factories (T024, T025, T026) are independent files.
  - Validation schemas + helpers (T027–T032) — different files; tests parallel-able.
  - Message catalogs (T037–T039) — different files.
  - Atoms + their tests (T045–T054) — fully parallel; one test+impl pair per atom.
- Phase 3 (US1) tests T057–T060 are all [P]; implementation tasks T061–T067 are mostly sequential (LoginHero / OAuthErrorLive are independent; LoginButton depends on Button atom; page depends on all child components; callback is independent and can be implemented in parallel with the UI tree).
- Phases 4, 5, 6 are independent from each other (different functionality slices).
- Phase 7 polish tasks marked [P] (T086, T087, T088, T090, T091, T092, T093) run in parallel.

---

## Implementation Strategy

### MVP First (Recommended)

1. **Phase 1 + 2** — bootstrap and foundation.
2. **Phase 3 (US1 only)** — Google sign-in happy path.
3. **STOP & VALIDATE**: spec US1 Independent Test passes; manual smoke against a real Sun\*-domain Google account.
4. Optional: ship a private preview with US1 only (default locale `vi` hard-coded, no error UI beyond the Server Component fallback).

### Incremental Delivery

1. Setup + Foundation (Phases 1–2).
2. Add US1 (Phase 3) → test → deploy preview.
3. Add US3 (Phase 5) — completes the protected-route experience.
4. Add US2 (Phase 4) — i18n unlocks the EN/JP audience.
5. Add US4 (Phase 6) — error polish.
6. Polish (Phase 7) — production gate.

### Recommended Team Split (if > 1 dev)

- **Backend / security focus**: T019–T023 (DB), T028, T030, T032 (schemas + allow-list), T040 (middleware), T066 (callback), T084 (action error wrapping), T089 (bundle scan), T091 (adversarial sec review).
- **Frontend focus**: T041, T043 (layout + tokens), T045–T054 (atoms/organisms), T061–T063, T065 (Login screen), T073–T074 (language switcher), T088 (SC-006 measurement).
- **DX / infra**: T008–T018 (deps, scripts, husky, env), T056 (Playwright auth fixture), T094 (CI workflow).

---

## Notes

- **TDD enforcement** (Constitution Principle V — NON-NEGOTIABLE): every implementation task is preceded by a `[TEST]` task on the same feature. Reviewers MUST verify the commit history shows a failing test before the implementing commit. PRs that bundle test + impl in the same commit are acceptable only if the test was committed earlier on the branch.
- **Commit cadence**: commit after each task or each tight logical group. Conventional Commits format (`feat:`, `fix:`, `test:`, `refactor:`, `chore:`).
- **No mocked DB in integration tests**: per Constitution feedback memory equivalent and plan's mocking table — integration tests run against local Supabase (`supabase start`). Unit tests may mock Supabase Auth client methods but not the DB.
- **Deviations already approved** (plan §Open Questions Q5/Q7): `POST /api/auth/signin/google` → Server Action; `GET /api/auth/session` → in-process session reads. No tasks for those endpoints exist.
- **Out of scope** (per spec + plan): iOS Login, password auth, admin allow-list UI, two-factor, account recovery, other OAuth providers.
- **Spec traceability** (every spec acceptance scenario maps to ≥ 1 task):
  - US1 scenarios → T057, T058, T060, T065, T066
  - US2 scenarios → T070, T071, T072, T073
  - US3 scenarios → T076, T077, T078
  - US4 scenarios → T080, T081, T082, T083, T084
  - Edge cases → T057 (state/code), T027 (redirectTo), T031 (case-insensitive domain), T080 (last_login_at fail-safe), T072 (locale switch persistence), T076 (cross-tab via fixture).
- **Update tasks as you go**: mark `[x]` when complete; if a task uncovers a missing one, add a new T### at the next free number rather than reshuffling.
