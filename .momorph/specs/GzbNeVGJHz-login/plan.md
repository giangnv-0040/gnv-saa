# Implementation Plan: Login

**Frame**: `GzbNeVGJHz-login`
**Date**: 2026-05-11
**Spec**: `specs/GzbNeVGJHz-login/spec.md`
**Constitution**: `.momorph/constitution.md` v1.0.0

---

## Summary

Login is the first feature shipped on the **gnv-saa** Next.js 16 application. It
gates the entire SAA 2025 experience behind Google OAuth (delegated to Supabase
Auth), enforces a server-side Sun\*-domain allow-list, and offers a pre-auth
language switcher (vi/en/ja).

Because Login is the **first feature in an empty codebase**, this plan
intentionally bundles the foundational infrastructure the rest of the project
will reuse: Supabase clients (`@supabase/ssr`), middleware-based route guard,
Vitest + Playwright, Zod, next-intl, design tokens, atomic UI structure, and the
initial database migrations (`users`, `auth_allowed_domains`).

**Primary requirement** (from spec): users authenticate via the single "LOGIN
With Google" button (same-window redirect), the server validates `state` →
exchanges `code` → enforces domain allow-list → only then sets the
`httpOnly`/`Secure`/`SameSite=Lax` session cookie and redirects to `/`.

---

## Technical Context

**Language/Framework**: TypeScript 5 (strict) / Next.js 16 (App Router) / React 19
**Primary Dependencies (existing)**: `next@16.2.6`, `react@19.2.4`,
`react-dom@19.2.4`, `tailwindcss@^4`
**Primary Dependencies (to add)**:

| Package                                                                                              | Purpose                               | Why this one                                                      |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------- |
| `@supabase/supabase-js`                                                                              | Supabase JS client                    | Constitution Principle II — official client                       |
| `@supabase/ssr`                                                                                      | Cookie-based session in App Router    | Constitution Principle IV — `httpOnly` cookies, no `localStorage` |
| `zod`                                                                                                | Schema validation at trust boundaries | Constitution Principle II/IV — single validator                   |
| `next-intl`                                                                                          | i18n with Server Component support    | App Router native; SSR locale on first paint (TR-008)             |
| `vitest` + `@vitejs/plugin-react` + `@testing-library/react` + `@testing-library/jest-dom` + `jsdom` | Unit / integration tests              | Constitution Principle V — Vitest is the chosen unit framework    |
| `@playwright/test`                                                                                   | E2E tests                             | Constitution Principle V — Playwright is the chosen E2E framework |
| `prettier` + `husky` + `lint-staged`                                                                 | Format + pre-commit                   | Constitution §Development Workflow                                |
| `supabase` (CLI, devDependency)                                                                      | Local dev + migration tooling         | Constitution Principle II — migrations in repo                    |

**Optional (deferred — not in this iteration unless needed)**:

- `zustand` — only when a second feature requires shared client state.
- `@tanstack/react-query` — only when a screen needs cached server data on the client.

**Database**: Supabase Postgres (managed) with Row-Level Security.
**Testing**: Vitest (unit/integration) + Playwright (E2E).
**State Management**: Server state via Server Components + Supabase server client.
No client-side global store needed on `/login` itself — the screen is mostly
server-rendered with two small Client Components (login button, language
switcher).
**API Style**: Next.js App Router Route Handlers (REST-style).
**Auth**: Supabase Auth — Google OAuth provider, PKCE flow via `@supabase/ssr`.

---

## Constitution Compliance Check

_GATE: All items below MUST pass before implementation can begin._

| #     | Constitution Rule                                                                | Plan Compliance                                                                                                                                                                                                                                                                                                    | Status                 |
| ----- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| I.1   | TypeScript `strict` mode                                                         | Already enabled in `tsconfig.json`. Plan adds no `any`/`@ts-ignore`.                                                                                                                                                                                                                                               | ✅                     |
| I.2   | ESLint zero errors                                                               | Plan re-uses `eslint-config-next`; pre-commit hook enforces.                                                                                                                                                                                                                                                       | ✅                     |
| I.3   | File naming (kebab-case for modules, PascalCase for components)                  | React component files use PascalCase (`Button.tsx`, `LoginButton.tsx`, `LanguageSwitcher.tsx`). Module files use kebab-case (`safe-redirect.ts`, `allow-list.ts`). Next.js routing files (`page.tsx`, `route.ts`, `layout.tsx`, `middleware.ts`, `actions.ts`) keep their framework-mandated lowercase names.      | ✅                     |
| II.1  | Server Components by default                                                     | `app/login/page.tsx` is a Server Component. Only `GoogleLoginButton` + `LanguageSwitcher` are Client Components.                                                                                                                                                                                                   | ✅                     |
| II.2  | Supabase clients (`supabase-js` + `ssr`)                                         | Used. `service_role` never imported in any file under `app/` that runs in client bundle.                                                                                                                                                                                                                           | ✅                     |
| II.3  | RLS enabled on user-scoped tables                                                | Migration `001_init_auth.sql` enables RLS on `users` and `auth_allowed_domains`.                                                                                                                                                                                                                                   | ✅                     |
| II.4  | Migrations in repo                                                               | `supabase/migrations/*.sql` checked in.                                                                                                                                                                                                                                                                            | ✅                     |
| II.5  | Tailwind utilities + CSS variables (no hard-coded values)                        | New design tokens added to `app/globals.css` (`--color-cta`, `--color-text-primary`, `--radius-button`, etc.). Components consume utilities only.                                                                                                                                                                  | ✅                     |
| II.6  | Navigation values derived from `SCREENFLOW.md` / specs                           | All routes in plan come from spec/SCREENFLOW.md. No invented URLs.                                                                                                                                                                                                                                                 | ✅                     |
| III.1 | Mobile-first responsive at standard breakpoints                                  | Tailwind 4 default breakpoints `sm`/`md`/`lg`/`xl` map onto Constitution's targets.                                                                                                                                                                                                                                | ✅                     |
| III.2 | WCAG 2.1 AA                                                                      | Semantic HTML, ARIA live region for OAuth errors, auto-focus on CTA, keyboard operability.                                                                                                                                                                                                                         | ✅                     |
| III.3 | Core Web Vitals targets                                                          | Server-rendered; key visual `priority` + `fetchpriority="high"`; minimal client JS (~15 KB target for /login).                                                                                                                                                                                                     | 📋 Verified post-build |
| IV.1  | Input validation at trust boundary (Zod)                                         | Zod schemas for `code`/`state`/`error`/`redirectTo` in `/api/auth/callback`; locale schema in cookie writer.                                                                                                                                                                                                       | ✅                     |
| IV.2  | Auth via Supabase, `httpOnly`/`Secure`/`SameSite=Lax` cookies                    | `@supabase/ssr` cookie writer configured. No tokens in client JS.                                                                                                                                                                                                                                                  | ✅                     |
| IV.3  | Server-side authz on every protected route                                       | `middleware.ts` validates session for protected matchers; `/auth/callback` enforces allow-list + state.                                                                                                                                                                                                            | ✅                     |
| IV.4  | Secrets in env, no `NEXT_PUBLIC_*` secrets                                       | `SUPABASE_SERVICE_ROLE_KEY` server-only; `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` are public-safe.                                                                                                                                                                                             | ✅                     |
| IV.5  | CSP + HSTS + `X-Content-Type-Options` + `Referrer-Policy` + `Permissions-Policy` | Added to `next.config.ts` `headers()` (production).                                                                                                                                                                                                                                                                | ✅                     |
| IV.6  | No PII / tokens in logs                                                          | Callback route logs request id + outcome only; email is reduced to domain in logs.                                                                                                                                                                                                                                 | ✅                     |
| V.1   | TDD — Red→Green→Refactor                                                         | Phase ordering: write failing test → implement minimal code → refactor. Tasks file (next step) lists tests first per scenario.                                                                                                                                                                                     | ✅                     |
| V.2   | Contract test for every route handler                                            | Vitest contract tests for `/auth/callback` (GET) and `/auth/signout` (POST), plus Server Actions `signInWithGoogle` and `setLocale` tested as plain async functions with cookie/redirect spies. Spec's `/api/auth/session` and `/api/auth/signin/google` are intentionally not implemented as routes (see Q5, Q7). | ✅                     |
| V.3   | Integration test for Supabase access paths                                       | Tests use a real Supabase test DB (preferred) or a documented adapter; one strategy per feature.                                                                                                                                                                                                                   | ✅                     |

**Violations**: none.

---

## Architecture Decisions

### Frontend Approach

- **Rendering**: `/login` page is a **Server Component**. It reads the Supabase
  session via `@supabase/ssr` server client; if a session exists, returns a
  `redirect()` to `/` (or a sanitized `redirectTo`) **before any HTML is sent**.
  Otherwise it renders the screen — passing the parsed `?error=` (if any) to a
  small client component for live-region announcement.
- **Component pattern**: Lightweight atomic structure —
  - `components/atoms/` for **shared primitives** (`Button`, `Spinner`,
    `FlagIcon`) — reused across screens.
  - `components/molecules/` for **shared composites** (`LanguageSwitcher`) —
    reused across screens.
  - `components/organisms/` for **shared screen sections** (`AppHeader`,
    `AppFooter`) — reused across screens.
  - `app/login/` for **screen-specific** components (`LoginButton`,
    `LoginHero`, `OAuthErrorLive`) — colocated with the route. These
    don't belong in the shared `components/` tree because no other
    screen would consume them.

  Strictly no feature-internal "smart" components in shared `atoms/`/
  `molecules/`. Shared components must be presentational + props-driven.

- **Styling**: Tailwind 4 utilities + CSS variables defined in
  `app/globals.css`. No hard-coded color/spacing values in components (per
  `.momorph/guidelines/frontend.md`).
- **Client islands**: Only `LoginButton` (uses `useFormStatus` for
  pending/disabled state) and `LanguageSwitcher` (dropdown open/close +
  select) are `'use client'`. Everything else — `LoginPage`, `LoginHero`,
  `OAuthErrorLive`, `AppHeader`, `AppFooter`, all atoms — is server-rendered.
  `OAuthErrorLive` is deliberately a Server Component: errors come from the
  URL query string and are rendered once on initial paint; the
  `role="status"` live region is announced by screen readers without client
  interactivity. Total expected client JS for `/login` ≈ 15 KB gzipped.
- **Forms**: None on this screen. The "LOGIN" button is a `<form action={…}>`
  posting to a Server Action that initiates OAuth — this gives us free CSRF
  protection (Next.js Server Actions have built-in origin checks) and lets the
  button degrade gracefully without JS.

### Backend Approach

- **Routing**:
  - Server Action `signInWithGoogle()` (in `app/login/actions.ts`) calls
    `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo:
BASE_URL + '/auth/callback', queryParams: { ... } } })` and returns the
    Google consent URL; the action invokes `redirect(url)` for a 303 redirect.
  - Route Handler `GET /auth/callback/route.ts` runs the **ordered checklist**
    from spec FR-004 (state → code exchange → domain → cookie set → redirect).
  - Route Handler `POST /auth/signout/route.ts` clears the session cookie and
    redirects to `/login`.
  - Server Action `setLocale(locale)` (in `lib/i18n/actions.ts`) writes the
    `NEXT_LOCALE` cookie with `Max-Age=31536000` (1 year), `Path=/`, `SameSite=Lax`.
- **API style**: REST-ish endpoints under `/api/auth/*` matching the spec
  predictions, but with one simplification — the spec's
  `POST /api/auth/signin/google` is replaced by a **Server Action** because
  Next.js Server Actions are the idiomatic, more secure equivalent (built-in
  CSRF, no manual fetch). The spec endpoint list is updated in `notes` below.
- **Data access**: All Supabase queries go through helpers in
  `lib/supabase/{server,client,middleware}.ts` (each creates the right client
  for its execution context). No ad-hoc clients.
- **Validation**: Zod schemas in `lib/validation/auth.ts`:
  - `oauthCallbackQuerySchema` — `{ code: z.string().min(1).optional(), state: z.string().min(1).optional(), error: z.enum([...]).optional(), redirectTo: redirectToSchema.optional() }`
  - `redirectToSchema` — string that starts with `/`, no `//`, no scheme — narrows to a safe relative path; default `/`.
  - `localeSchema` — `z.enum(['vi','en','ja'])`.

### Database Approach

- **Engine**: Supabase Postgres.
- **Migrations** (initial set in `supabase/migrations/`):
  - `20260511000001_init_auth.sql`:
    - `auth_allowed_domains(domain TEXT PRIMARY KEY, enabled BOOLEAN NOT NULL DEFAULT true, notes TEXT, created_at TIMESTAMPTZ DEFAULT now())` — seeded with `('sun-asterisk.com', true, 'Sun* primary domain')`.
    - `users(id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, email CITEXT NOT NULL UNIQUE, display_name TEXT, avatar_url TEXT, locale TEXT NOT NULL DEFAULT 'vi' CHECK (locale IN ('vi','en','ja')), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), last_login_at TIMESTAMPTZ)`.
    - RLS enabled on both tables.
    - Policy `users_select_self`: `auth.uid() = id`.
    - Policy `users_update_self_locale_only`: `auth.uid() = id` with column whitelist.
    - `auth_allowed_domains` has NO policy for authenticated users (managed by service role / admin migrations only).
    - Trigger `on_auth_user_created` that upserts a `users` row when `auth.users` gets a new entry (extracts `email`, `display_name`, `avatar_url` from `raw_user_meta_data`).
- **Domain check**: in the callback route, a service-role query against
  `auth_allowed_domains` filters by `lower(email_domain)` (case-insensitive).
- **Indexes**: implicit (PKs only) — table is small (handful of domains, low
  thousand users) — no additional indexes required at MVP.

### Validation

Zod schemas at every trust boundary. The callback parses `request.nextUrl.searchParams`
through `oauthCallbackQuerySchema.safeParse(…)`; failure ⇒ redirect to
`/login?error=invalid_state` (intentionally generic for any malformed query —
prevents probing).

### Integration Points

- **Existing services**: none. This is the first feature.
- **Shared components built here (reused later)**:
  - `components/organisms/AppHeader.tsx` (logo + language switcher slot)
  - `components/organisms/AppFooter.tsx`
  - `components/molecules/LanguageSwitcher.tsx`
  - `components/atoms/Button.tsx`
  - `components/atoms/Spinner.tsx`
  - `components/atoms/FlagIcon.tsx`
  - `lib/supabase/{server,client,middleware}.ts`
  - `lib/validation/{auth,common}.ts`
  - `lib/i18n/{config,request,actions}.ts`
  - `lib/auth/{allow-list,safe-redirect}.ts`
  - `lib/logger.ts`
- **External services**: Google OAuth via Supabase Auth.

---

## Project Structure

### Documentation (this feature)

```text
.momorph/specs/GzbNeVGJHz-login/
├── spec.md              # Feature specification (approved, reviewed)
├── plan.md              # This file
├── tasks.md             # Generated next via /momorph.tasks
└── research.md          # (optional) Created if deeper analysis needed
```

### Source Code

> **Naming convention (Constitution I.3)**:
>
> - **PascalCase** for files exporting a React component (`Button.tsx`, `LoginButton.tsx`).
> - **kebab-case** for module/utility/schema files (`safe-redirect.ts`, `allow-list.ts`).
> - **lowercase** for Next.js framework-mandated routing files (`page.tsx`, `route.ts`, `layout.tsx`, `middleware.ts`, `actions.ts`) — these names are dictated by Next.js and override the convention.

```text
app/
├── layout.tsx                          # MODIFY: wrap with NextIntlClientProvider, fix lang attr
├── globals.css                         # MODIFY: add design tokens + reset
├── page.tsx                            # MODIFY: temporary protected stub (full impl in Homepage SAA feature)
├── login/
│   ├── page.tsx                        # NEW: Server Component — session check → render or redirect
│   ├── actions.ts                      # NEW: 'use server' — signInWithGoogle(formData)
│   ├── LoginButton.tsx                 # NEW: 'use client' — wraps <form action={signInWithGoogle}>, useFormStatus pending state, autoFocus
│   ├── LoginHero.tsx                   # NEW: Server Component — key visual + welcome text (screen-specific organism)
│   └── OAuthErrorLive.tsx              # NEW: Server Component — ARIA live region rendering the localized error message based on `?error=` param (no client interactivity needed)
├── auth/
│   ├── callback/
│   │   └── route.ts                    # NEW: GET handler — ordered checks per FR-004 + last_login_at update
│   └── signout/
│       └── route.ts                    # NEW: POST handler — clear cookie, redirect /login

# NOTE: spec API table predicted GET /api/auth/session and POST /api/auth/signin/google.
# Plan deliberately OMITS both (see Open Questions Q5, Q7). Session reads happen
# in-process via @supabase/ssr; sign-in is a Server Action invoked through <form action>.

components/
├── atoms/
│   ├── Button.tsx                      # NEW: generic button (variants via props)
│   ├── Spinner.tsx                     # NEW: loading indicator
│   └── FlagIcon.tsx                    # NEW: renders /public/assets/common/flags/<code>.svg
├── molecules/
│   └── LanguageSwitcher.tsx            # NEW: 'use client' — dropdown trigger + items, opens via click/Enter/Space, closes on outside-click/Esc, calls setLocale Server Action on select
└── organisms/
    ├── AppHeader.tsx                   # NEW: Server Component — Logo (non-interactive img) + slot for LanguageSwitcher
    └── AppFooter.tsx                   # NEW: Server Component — <footer role="contentinfo">, no interactive children, mt-auto for sticky-bottom layout

lib/
├── supabase/
│   ├── server.ts                       # NEW: createServerClient() — Server Components & Server Actions (reads cookies via next/headers)
│   ├── client.ts                       # NEW: createBrowserClient() — Client Components (used only when post-auth screens need real-time)
│   └── middleware.ts                   # NEW: updateSession(request) helper for the root middleware.ts
├── validation/
│   ├── common.ts                       # NEW: shared schemas + helpers
│   └── auth.ts                         # NEW: oauthCallbackQuerySchema, localeSchema, redirectToSchema
├── i18n/
│   ├── config.ts                       # NEW: const locales = ['vi','en','ja'] as const; defaultLocale = 'vi'
│   ├── request.ts                      # NEW: next-intl getRequestConfig() — reads NEXT_LOCALE cookie
│   └── actions.ts                      # NEW: 'use server' — setLocale(locale: Locale) writes NEXT_LOCALE cookie
├── auth/
│   ├── allow-list.ts                   # NEW: isDomainAllowed(email) — case-insensitive lookup against auth_allowed_domains using service-role client
│   └── safe-redirect.ts                # NEW: sanitizeRedirectTo(input) — accepts only '/'-prefixed same-origin relative paths; rejects '//', '\\', absolute schemes
└── logger.ts                           # NEW: redacting logger

messages/
├── vi.json                             # NEW: Vietnamese (default)
├── en.json                             # NEW: English
└── ja.json                             # NEW: Japanese

# i18n keys MUST cover (enumerated for translators in the Phase 1 task):
#   login.welcome.line1, login.welcome.line2, login.button.label,
#   login.button.loading, login.error.access_denied, login.error.domain_not_allowed,
#   login.error.invalid_state, login.error.provider_error, login.error.network_error,
#   language.label.{vi,en,ja}, language.code.{vi,en,ja}, footer.copyright.

public/
└── assets/
    ├── common/
    │   ├── logo.svg                    # NEW: SAA brand mark (shared header)
    │   ├── google-icon.svg             # NEW: Google "G" icon (used by LoginButton)
    │   └── flags/
    │       ├── vn.svg                  # NEW
    │       ├── gb.svg                  # NEW
    │       └── jp.svg                  # NEW
    └── login/
        └── key-visual.webp             # NEW: hero artwork (+ .jpg fallback if needed)

supabase/
├── config.toml                         # NEW: Supabase CLI config (local dev port, auth providers)
└── migrations/
    └── 20260511000001_init_auth.sql    # NEW: users + auth_allowed_domains + RLS + trigger

middleware.ts                            # NEW (project root): refreshes Supabase session cookie via lib/supabase/middleware.ts; for protected matchers, redirects unauthenticated to /login?redirectTo=<encoded-path>

next.config.ts                           # MODIFY: add headers() (CSP/HSTS/etc.), next-intl plugin wrapper, images.remotePatterns

tests/
├── setup.ts                            # NEW: Vitest setup — testing-library/jest-dom
├── helpers/
│   └── seed.ts                         # NEW: per-test DB seed/teardown for users + auth_allowed_domains
├── unit/
│   ├── lib/
│   │   ├── safe-redirect.test.ts       # NEW: adversarial redirectTo fixture set
│   │   ├── allow-list.test.ts          # NEW: case-insensitive match
│   │   └── validation/
│   │       └── auth.test.ts            # NEW: Zod schemas
│   └── components/
│       ├── Button.test.tsx             # NEW
│       ├── Spinner.test.tsx            # NEW
│       ├── FlagIcon.test.tsx           # NEW
│       ├── LoginButton.test.tsx        # NEW: disabled/loading state via useFormStatus
│       └── LanguageSwitcher.test.tsx   # NEW: open/close, keyboard nav, aria-current
├── integration/
│   ├── LoginPage.test.tsx              # NEW: Server Component flow (mocked Supabase)
│   ├── callback-route.test.ts          # NEW: ordered-checks contract test
│   └── locale-persist.test.tsx         # NEW: setLocale action + re-render
└── e2e/
    ├── playwright.config.ts            # NEW
    ├── fixtures/
    │   └── auth.ts                     # NEW: programmatic Supabase session via admin API (bypasses Google)
    └── login.spec.ts                   # NEW: happy path + redirect + error paths + locale switch + a11y scan

vitest.config.ts                         # NEW
.env.local.example                       # NEW: documents env vars (see "Environment Variables" below)
eslint.config.mjs                        # already exists — keep
package.json                             # MODIFY: dependencies + scripts (test, test:e2e, supabase:start, etc.)
```

### Environment Variables (documented in `.env.local.example`)

| Variable                        | Scope           | Purpose                                                                                                                            |
| ------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`          | client + server | Used as `BASE_URL` when constructing the OAuth callback URL. Set to `http://localhost:3000` locally, deployment URL in production. |
| `NEXT_PUBLIC_SUPABASE_URL`      | client + server | Supabase project URL — safe to expose.                                                                                             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Supabase anon (publishable) key — safe to expose.                                                                                  |
| `SUPABASE_SERVICE_ROLE_KEY`     | **server only** | Admin key used for the allow-list lookup and the `last_login_at` update. MUST NEVER be `NEXT_PUBLIC_*`-prefixed.                   |

### `redirectTo` Flow Across the OAuth Round-Trip

```text
1. Middleware redirect:
   GET /admin (unauthenticated)
   → 302 /login?redirectTo=%2Fadmin

2. Login page (Server Component):
   reads searchParams.redirectTo
   → sanitizeRedirectTo(...) → "/admin" (or "/" if invalid)
   → renders <LoginButton redirectTo="/admin">
   → LoginButton renders <form><input type="hidden" name="redirectTo" value="/admin"></form>

3. signInWithGoogle Server Action:
   reads formData.get("redirectTo")
   → sanitizeRedirectTo(...) → "/admin"
   → supabase.auth.signInWithOAuth({
       provider: 'google',
       options: { redirectTo: `${BASE_URL}/auth/callback?redirectTo=${encodeURIComponent("/admin")}` }
     })
   → redirect(data.url)  // 303 to Google consent

4. Callback route (after state/code/domain checks pass + cookie set):
   reads request.nextUrl.searchParams.redirectTo
   → sanitizeRedirectTo(...) → "/admin"
   → return NextResponse.redirect(new URL("/admin", request.url))
```

The parameter name `redirectTo` is consistent at every hop. `sanitizeRedirectTo`
is called at **every** trust boundary (page, action, callback) — defense in depth.

### Modified Files

| File              | Changes                                                                                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/layout.tsx`  | Wrap in `NextIntlClientProvider`; set `<html lang>` from active locale; remove Geist starter (replace with project font choice or keep system default for MVP).                           |
| `app/globals.css` | Add design tokens (colors, radii, gaps) from Figma key visual / button — value extraction happens at implement time via `query_section`.                                                  |
| `app/page.tsx`    | Replace Next.js starter with a server-rendered stub that requires a session (redirects to `/login` if absent). Full Homepage SAA implementation is a separate feature.                    |
| `next.config.ts`  | `headers()` for CSP / HSTS / `X-Content-Type-Options` / `Referrer-Policy` / `Permissions-Policy`; `images.remotePatterns` if/when avatars are loaded from Supabase Storage (not for MVP). |
| `package.json`    | Add deps + scripts: `test`, `test:e2e`, `supabase:start`, `supabase:reset`, `lint`, `typecheck`, `format`.                                                                                |
| `tsconfig.json`   | Add path aliases for new dirs if needed (already has `@/*` → root, sufficient).                                                                                                           |
| `.gitignore`      | Ensure `.env.local`, `playwright-report/`, `test-results/`, `supabase/.branches/`, `supabase/.temp/` are ignored.                                                                         |

### Dependencies to Add

```text
# runtime
@supabase/supabase-js
@supabase/ssr
zod
next-intl

# dev
vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom @types/node
@playwright/test
prettier husky lint-staged
supabase  # CLI (alternatively installed globally)
```

---

## Implementation Strategy

### Phase 0: Asset Preparation

Run **before any UI implementation** so files are in `public/` for the
implementer to import normally.

- [ ] Use `mcp__momorph__get_media_files` / `list_media_nodes` to download:
  - **Key visual** (`mms_B.1_Key Visual`, node `662:14395`) → `public/assets/login/key-visual.webp` (and `.jpg` fallback if needed). Preserve aspect ratio.
  - **SAA Logo** (`mms_A.1_Logo`, node `I662:14391;186:2166`) → `public/assets/common/logo.svg`.
  - **Google icon** (within `mms_B.3_Login`, node `662:14426`) → `public/assets/common/google-icon.svg`.
  - **VN/EN/JA flag icons** (children of the language switcher dropdown — node `I662:14391;186:1601`) → `public/assets/common/flags/{vn,gb,jp}.svg`.
- [ ] Verify SVGs are sanitized (no inline scripts, no external refs).
- [ ] Confirm `key-visual.webp` is < 250 KB at the largest viewport — re-encode if not (LCP target).
- [ ] Filenames are kebab-case per `.momorph/guidelines/frontend.md`.

### Phase 1: Foundation (Shared Infrastructure — blocks US1)

Establishes the platform every subsequent story consumes. **No user-story
work begins until Phase 1 is complete.**

- [ ] **Supabase project setup**: create a Supabase project (or local
      `supabase start`); enable Google OAuth provider; register
      `${BASE_URL}/auth/callback` as the redirect URL.
- [ ] **Env variables**: `NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only).
      `.env.local.example` documents these.
- [ ] **Supabase clients**: implement `lib/supabase/{server,client,middleware}.ts`.
- [ ] **Migration `init_auth`**: tables + RLS + trigger + seed.
- [ ] **Middleware**: `middleware.ts` calls `updateSession()` + redirects
      unauthenticated requests to `/login?redirectTo=<encoded-path>` for
      protected matchers. (For MVP, the only protected matcher is `/` — admin
      paths added when those features land.)
- [ ] **next-intl wiring**: `lib/i18n/config.ts`, `lib/i18n/request.ts`,
      `next.config.ts` plugin, `messages/{vi,en,ja}.json` with the few keys
      this screen needs (welcome, button label, errors, footer copyright).
      `setLocale` Server Action writes the `NEXT_LOCALE` cookie.
- [ ] **Design tokens**: extract token values from Figma via `query_section`
      on the components (`mms_B.3_Login` for CTA color/radius; `mms_B.2_content`
      for typography). Add to `app/globals.css` as CSS variables under
      `:root`. Map them via `@theme` in Tailwind 4 so utilities like
      `bg-cta` work.
- [ ] **Base components**: `Button`, `Spinner`, `FlagIcon`, `AppHeader`,
      `AppFooter`. Each ships with a Vitest unit test (rendering + props).
      Specific behavioral rules (enforced in unit tests): - **AppHeader.Logo** (FR-013): rendered as a plain `<img>` / `<Image>`
      — **no** `onClick`, `href`, `tabIndex`, `role="button"`, or
      `cursor-pointer` utility. Image has descriptive `alt` (the only
      non-decorative image on the screen). - **AppFooter** (FR-013, FR-014): wrapped in `<footer role="contentinfo">`,
      no interactive children, no `<a>`/`<button>`. Layout is
      `mt-auto` inside the page flex column (the existing `body` has
      `flex flex-col` from layout.tsx) so the footer stays at viewport
      bottom regardless of scroll without needing `position: fixed`. - **Welcome Text** wrapper (spec component table — test case
      `42b82364` "not interactive or selectable"): `<p>` with
      `user-select: none` (Tailwind `select-none`), no `onClick`/`role`/
      `tabIndex`.
- [ ] **Test scaffolding**: `vitest.config.ts`, `tests/setup.ts`,
      `playwright.config.ts`, `tests/e2e/fixtures/auth.ts`. Wire `npm run test`
      and `npm run test:e2e`.
- [ ] **Security headers**: `next.config.ts` `headers()` with CSP (allowing
      Supabase + Google domains for `connect-src` / `frame-src` as needed),
      HSTS in production, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- [ ] **Logger**: `lib/logger.ts` — wraps `console.*` with redaction; default
      drops `authorization`, `cookie`, `access_token`, `refresh_token` fields
      and reduces `email` to its domain part.

**Checkpoint — Phase 1 done**: `npm run dev` boots; the unauthenticated `/`
request redirects to `/login` (which currently 404s — expected, Phase 2 adds
it); all foundation tests pass.

### Phase 2: User Story 1 — Google Sign-In (P1) 🎯 MVP

**Goal**: an unauthenticated visitor can authenticate via Google and land on `/`.

**TDD order** (Constitution Principle V — write failing tests first):

- [ ] **Test**: `tests/integration/callback-route.test.ts` — ordered checks
      contract (state invalid → 302 `/login?error=invalid_state`; code missing
      → 302 `/login?error=invalid_state`; allow-list miss → 302
      `/login?error=domain_not_allowed`; happy path → 302 to `redirectTo` or
      `/` + cookie set). Stub Supabase admin client; use real Zod schemas.
- [ ] **Test**: `tests/integration/login-page.test.tsx` — Server Component
      behavior: authenticated session → redirect, no session → render with
      auto-focused login button.
- [ ] **Test**: `tests/unit/components/google-login-button.test.tsx` —
      disabled + spinner during pending Server Action.
- [ ] **Test**: `tests/e2e/login.spec.ts::happy path` — programmatically set a
      Supabase session via fixture, visit `/login`, verify redirect to `/`.
- [ ] **Implement**:
  - `app/login/page.tsx` — Server Component reading session via
    `createServerClient()`. If session present,
    `redirect(sanitizeRedirectTo(searchParams.redirectTo))`. Otherwise
    reads `?error=` and `?redirectTo=` from searchParams, sanitizes both,
    and renders `<AppHeader>` + `<LoginHero>` + `<LoginButton redirectTo={safe}>` + `<OAuthErrorLive error={safe}>` + `<AppFooter>`.
  - `app/login/actions.ts` — `signInWithGoogle(formData: FormData)` Server
    Action: `redirectTo = sanitizeRedirectTo(formData.get('redirectTo'))`;
    calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: ${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)} } })`,
    then `redirect(data.url)`. Parameter name is `redirectTo` consistently
    (matches spec FR-011 and the callback route).
  - `app/login/LoginButton.tsx` — `'use client'`. Renders
    `<form action={signInWithGoogle}>` containing
    `<input type="hidden" name="redirectTo" value={props.redirectTo} />`
    and `<Button type="submit" disabled={useFormStatus().pending} autoFocus>`.
    The `autoFocus` prop (FR-016) maps to HTML `autofocus` — works on
    initial paint without waiting for hydration, no `useEffect` needed.
  - `app/login/OAuthErrorLive.tsx` — Server Component. Takes
    `error: OAuthErrorCode | null` prop, returns
    `<div role="status" aria-live="polite">{tMessage}</div>` or `null`.
    No client interactivity required — initial render is enough for the
    screen reader to announce the error.
  - `app/auth/callback/route.ts` — implements the four ordered checks from
    spec FR-004 using `oauthCallbackQuerySchema`, Supabase server client's
    `auth.exchangeCodeForSession`, and `isDomainAllowed`. Sets cookie only
    after step 3 passes. Reads `redirectTo` from `request.nextUrl.searchParams`,
    sanitizes (defense-in-depth even though the action already did), and
    redirects there on success. **After step 4** (cookie set), the handler
    runs a single fire-and-forget
    `UPDATE users SET last_login_at = now() WHERE id = $1` via the
    server-side Supabase client — failure of this update MUST NOT fail the
    login (log + continue). This satisfies the `User.last_login_at`
    attribute defined in spec §Key Entities.
- [ ] **Verify** all tests above turn green.

**Checkpoint — Phase 2 done**: a real Google account that matches the seed
allow-list can sign in end-to-end against a local Supabase. Independent
acceptance test (spec US1 Independent Test) passes.

### Phase 3: User Story 2 — Language Switcher (P2)

**Goal**: visitor can switch interface language before signing in; choice
persists.

- [ ] **Test**: `tests/unit/components/language-switcher.test.tsx` —
      open/close (click + `Esc` + outside-click), keyboard navigation
      (`ArrowDown`/`Enter`), `aria-current` on selected item.
- [ ] **Test**: `tests/integration/locale-persist.test.tsx` — cookie write
      via `setLocale` Server Action; re-render with new locale.
- [ ] **Test**: `tests/e2e/login.spec.ts::language switch` — VI default →
      switch to EN → reload → still EN; copy updates everywhere.
- [ ] **Implement**:
  - `components/molecules/language-switcher.tsx` — headless dropdown (no
    extra library; small enough to roll our own with `useRef` + `useEffect`).
  - `lib/i18n/actions.ts::setLocale(locale: Locale)` — validates via
    `localeSchema`, sets `NEXT_LOCALE` cookie (`Max-Age=31536000`,
    `Path=/`, `SameSite=Lax`).
  - Wire `<LanguageSwitcher>` into `<AppHeader>`.
- [ ] **Verify**.

**Checkpoint — Phase 3 done**: locale switching works on the Login screen and
persists across reloads.

### Phase 4: User Story 3 — Authenticated User Redirect (P2)

**Goal**: an authenticated user visiting `/login` is redirected away before
any UI paints.

> Most of this is already done in Phase 2 (the Server Component checks the
> session). This phase adds explicit tests + the "no flash" guarantee.

- [ ] **Test**: `tests/e2e/login.spec.ts::authenticated redirect` — set
      session via fixture, navigate to `/login`, assert response status is
      302 (via `page.context().request` round-trip — confirms no client paint).
- [ ] **Test**: `tests/integration/login-page.test.tsx::expired session` —
      expired cookie → cleared + page rendered.
- [ ] **Implement** any missing handling — expired-cookie clearing happens
      naturally via `@supabase/ssr` refresh; just confirm test passes.

**Checkpoint — Phase 4 done**: spec US3 Independent Test passes.

### Phase 5: User Story 4 — Error Paths (P3)

**Goal**: every documented OAuth failure produces a localized, leak-free
message and a retryable button.

- [ ] **Test**: `tests/integration/callback-route.test.ts` — extend with
      cases for `access_denied`, `provider_error`, `network_error` (mocked
      Supabase throwing). Each case verifies the redirect URL and that no
      session cookie was set.
- [ ] **Test**: `tests/e2e/login.spec.ts::error states` — direct nav to
      `/login?error=domain_not_allowed`, assert the localized message
      appears in the live region and the button is enabled.
- [ ] **Implement**:
  - `app/login/oauth-error-live.tsx` — reads `?error=` (passed as prop from
    the Server Component), maps to a localized string (via `useTranslations()` from next-intl), renders in `<div role="status" aria-live="polite">`.
  - Map all five error codes (`access_denied`, `domain_not_allowed`,
    `invalid_state`, `provider_error`, `network_error`) in
    `messages/{vi,en,ja}.json`.
- [ ] **Verify**.

**Checkpoint — Phase 5 done**: every spec US4 acceptance scenario maps to a
green test.

### Phase 6: Polish, Hardening, Pre-Ship

- [ ] **Accessibility audit**: axe-core via Playwright (`@axe-core/playwright`)
      — zero serious/critical violations. Manual keyboard walk + screen
      reader smoke test (VoiceOver/NVDA).
- [ ] **Performance**: Lighthouse on `/login` (mobile + desktop) — LCP < 2.5s,
      INP < 200ms, CLS < 0.1. Confirm key visual uses `priority` and
      appropriate `sizes`.
- [ ] **Locale-switch responsiveness (SC-006)**: Playwright measurement —
      `performance.now()` delta between click on a dropdown item and the
      moment the localized welcome text appears in the DOM MUST be
      < 200ms at p95 over 20 runs. If exceeded, audit `setLocale` Server
      Action latency and consider an optimistic client-side update fallback.
- [ ] **Security review**: re-verify CSP doesn't whitelist anything beyond
      Supabase + Google; run `npm audit` and resolve high/critical;
      manually attempt redirect-to-evil-origin via `redirectTo` to confirm
      sanitization rejects it.
- [ ] **Bundle check**: CI script greps the client bundle for
      `SUPABASE_SERVICE_ROLE_KEY` and any value not prefixed `NEXT_PUBLIC_`
      from `.env.local` — fail if found.
- [ ] **Docs**: short README section for local dev (`supabase start`, `npm run
    dev`, OAuth test account).

**Final gate**: all CI checks green (lint, typecheck, unit, integration,
e2e, build, audit). Spec success criteria SC-001 → SC-007 measurably
satisfied.

---

## Integration Testing Strategy

### Test Scope

- [x] **Component/Module interactions**: `LanguageSwitcher` ↔ `setLocale`
      action; `GoogleLoginButton` (`<form action>`) ↔ `signInWithGoogle`
      action; `OAuthErrorLive` ↔ URL `?error=` parsing.
- [x] **External dependencies**: Google OAuth (via Supabase). Mocked in unit
      and integration tests; **real** in a dedicated E2E "live OAuth" test
      that runs only in a manual / nightly profile (Google CAPTCHAs make
      this unsuitable for every-PR CI).
- [x] **Data layer**: Supabase Postgres (`users`, `auth_allowed_domains`) +
      Supabase Auth cookies.
- [x] **User workflows**: spec acceptance scenarios for US1–US4.

### Test Categories

| Category           | Applicable?        | Key Scenarios                                                                                            |
| ------------------ | ------------------ | -------------------------------------------------------------------------------------------------------- |
| UI ↔ Logic         | Yes                | Button click → Server Action → redirect; switcher select → cookie + UI update; error param → live region |
| Service ↔ Service  | Yes                | Server Action → Supabase Auth; Callback → Supabase Auth + Postgres (allow-list)                          |
| App ↔ External API | Yes                | Google OAuth — **mocked** in PR pipeline; **real** in nightly                                            |
| App ↔ Data Layer   | Yes                | `auth_allowed_domains` lookups; `users` upsert on first login                                            |
| Cross-platform     | Limited (Web only) | Chromium + WebKit + Firefox via Playwright projects                                                      |

### Test Environment

- **Environment type**: local for unit/integration (Vitest + jsdom); local
  Supabase (`supabase start`) for integration that touches the DB; Playwright
  against `npm run dev` (or `npm run build && start`) for E2E.
- **Test data strategy**:
  - Vitest: in-memory mocks for Supabase Auth (`auth.exchangeCodeForSession`,
    `auth.getUser`).
  - Integration: real local Supabase, seeded via migrations + a
    `tests/helpers/seed.ts` that inserts/clears domains and users per test.
  - E2E: `tests/e2e/fixtures/auth.ts` programmatically sets a Supabase
    session using the admin API — **bypasses Google entirely** for happy
    paths, which gives deterministic, fast tests.
- **Isolation approach**: per-test database truncate of `users`; fixed
  allow-list seed restored at file-level. Playwright runs with
  `fullyParallel: true` against isolated browser contexts.

### Mocking Strategy

| Dependency                                          | Strategy                                                                            | Rationale                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Google OAuth (consent screen)                       | Mock in unit/integration; bypass in E2E via Supabase admin token                    | Google rate-limits and CAPTCHAs make real OAuth flaky                |
| Supabase Auth (`exchangeCodeForSession`, `getUser`) | Mock in unit; real in integration (local Supabase)                                  | Catches real client behavior in integration without external network |
| Supabase Postgres                                   | Real local Supabase                                                                 | Constitution feedback memory equivalent: don't mock the DB           |
| `cookies()` (Next.js)                               | Provided by Next testing utilities + `@testing-library/react` server-render helpers | Standard                                                             |
| `redirect()` (Next.js)                              | Spy/throw in tests; assert location                                                 | Matches Next's runtime behavior                                      |

### Test Scenarios Outline

1. **Happy Path**
   - [ ] Unauthenticated user → click → redirected to Google consent stub → callback success → session set, redirect `/`.
   - [ ] Default locale `vi` → switch to `en` → reload → still `en`.

2. **Error Handling**
   - [ ] `?error=access_denied` → message + button re-enabled.
   - [ ] Domain not in allow-list → no session, redirect to `/login?error=domain_not_allowed`.
   - [ ] Invalid/replayed `state` → redirect to `/login?error=invalid_state`.
   - [ ] Provider 5xx → `provider_error`.
   - [ ] Network failure during Server Action → `network_error`.

3. **Edge Cases**
   - [ ] Direct GET to `/auth/callback` with no params → 302 `/login`, no error UI.
   - [ ] `redirectTo=https://evil.example.com` → sanitized to `/`.
   - [ ] `redirectTo=/admin` (relative) → followed after auth.
   - [ ] `redirectTo=//evil.example.com` (protocol-relative) → sanitized to `/`.
   - [ ] `redirectTo=\\evil.example.com` (backslash) → sanitized to `/`.
   - [ ] Double-click → exactly one OAuth initiation (`useFormStatus` disables).
   - [ ] Sign in on tab A while tab B is on `/login` → tab B self-redirects via Supabase auth subscription.
   - [ ] Authenticated user visits `/login` → 302 before paint.
   - [ ] **Locale switched while OAuth flow is in-flight** (spec edge case): user clicks LOGIN → switches language → confirms on Google → returns to /auth/callback → Supabase cookie set, `NEXT_LOCALE` cookie still reflects the user's choice → Homepage renders in the chosen locale, NOT in the locale active at click time.
   - [ ] **Returning user**: second sign-in updates `users.last_login_at` (assertion against the test DB).
   - [ ] **Case-insensitive domain match**: `User@Sun-Asterisk.com` matches `sun-asterisk.com` in allow-list → success.

### Tooling & Framework

- **Unit/integration**: Vitest + `@testing-library/react` + `jsdom`.
- **E2E**: Playwright (Chromium + Firefox + WebKit projects).
- **Mocking**: native Vitest mocks (`vi.mock`), no MSW for now (we only have
  one external service and Supabase has good test affordances).
- **Accessibility**: `@axe-core/playwright` for automated checks; manual
  screen-reader smoke (VoiceOver/NVDA) once before ship.
- **CI integration**: GitHub Actions (or whichever CI is later chosen) runs
  `npm run lint && npm run typecheck && npm run test && npm run build && npx playwright install --with-deps && npm run test:e2e`. Real-Google OAuth job runs nightly via a separate workflow.

### Coverage Goals

| Area                                                        | Target                 | Priority |
| ----------------------------------------------------------- | ---------------------- | -------- |
| `app/auth/callback/route.ts` (security-critical)            | 100% branch            | High     |
| `lib/auth/allow-list.ts`, `lib/auth/safe-redirect.ts`       | 100%                   | High     |
| Server Component / Server Action paths                      | ≥ 90% line             | High     |
| Client components (`GoogleLoginButton`, `LanguageSwitcher`) | ≥ 85% line             | High     |
| Atoms (`Button`, `Spinner`, `FlagIcon`)                     | ≥ 80% line             | Medium   |
| Error message catalogs                                      | smoke (existence) only | Low      |

Coverage is reported but not gated as a CI fail criterion per Constitution
Principle V ("Coverage is a side effect, not the goal"). What IS gated:
every acceptance scenario in `spec.md` MUST have at least one mapped test.

---

## Risk Assessment

| Risk                                                                | Probability | Impact       | Mitigation                                                                                                                                                                       |
| ------------------------------------------------------------------- | ----------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google OAuth flakiness in CI E2E                                    | High        | Med          | Bypass Google in PR pipeline (Supabase admin session fixture); run real-OAuth job nightly only.                                                                                  |
| Domain allow-list bypass via race / typo / case-handling            | Low         | **Critical** | Allow-list check is server-side, **ordered before cookie set** (FR-004), tested with explicit case-insensitive cases; service-role query (not RLS-readable for normal sessions). |
| Open redirect via `redirectTo`                                      | Med         | High         | `sanitizeRedirectTo` enforces: starts with `/`, no `//` (protocol-relative), no scheme, no backslash; default `/`. Unit-tested against an adversarial fixture list.              |
| Service role key accidentally bundled to client                     | Low         | Critical     | Naming convention enforced (`SUPABASE_SERVICE_ROLE_KEY` not `NEXT_PUBLIC_*`); CI grep on built client bundle.                                                                    |
| FOUT / locale flash on first paint                                  | Med         | Low          | next-intl Server Component pattern + `NEXT_LOCALE` cookie read in `app/layout.tsx` — locale known before any HTML emits.                                                         |
| Tailwind 4 + Next.js 16 not yet widely adopted; ecosystem surprises | Med         | Med          | Pin versions; rely only on stable APIs; isolate any odd behavior in a small adapter.                                                                                             |
| Single-domain Sun\* allow-list misjudges partner emails             | Low         | Med          | Schema supports multiple domains from day one; admin populates via migration.                                                                                                    |
| Supabase outage during Google callback                              | Low         | Med          | `provider_error` path covers; user retries; consider exponential backoff if observed in prod.                                                                                    |
| TDD discipline slips under time pressure                            | Med         | Med          | PR review checklist literally requires a failing-then-passing test commit per behavior change (Constitution Principle V).                                                        |

### Estimated Complexity

- **Frontend**: **Medium** — visually simple (one button, one switcher, hero
  image) but Server Component + Server Action wiring is new infra for this
  codebase.
- **Backend**: **Medium** — small surface (3 routes + 1 action) but the
  callback is security-critical and has the most logic.
- **Testing**: **Medium-High** — many error paths to cover; OAuth bypass
  fixture is the trickiest piece.

---

## Dependencies & Prerequisites

### Required Before Start

- [x] `.momorph/constitution.md` reviewed (v1.0.0 ratified 2026-05-11).
- [x] `spec.md` approved + reviewed (passed `/momorph.reviewspecify` twice).
- [ ] Supabase project provisioned (cloud or local) with Google OAuth provider
      enabled and `${BASE_URL}/auth/callback` registered.
- [ ] Google Cloud OAuth client created (Web application type) with the
      correct authorized JS origins + redirect URIs.
- [ ] Sun\* email-domain allow-list values confirmed by the platform/security
      team — committed to migration `20260511000001_init_auth.sql`.
- [ ] (Recommended) `research.md` generated if any open item below blocks
      planning.

### External Dependencies

- Google Cloud Console (OAuth client credentials).
- Supabase (Auth + Postgres).
- Optional: a `<projectname>.vercel.app` or equivalent for the OAuth redirect
  URL during shared preview deploys.

---

## Open Questions (committed defaults below; team may override)

Spec recommendations have been **committed as the working defaults** for this
plan. They can be revisited in implementation review.

| #   | Question                                                         | Committed default                        | Why                                                                                                                                                                                                                                                                                                                                                      |
| --- | ---------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Should `redirectTo` be supported on this iteration?              | **Yes**, same-origin relative paths only | Costs little, fixes UX for the 403 → re-auth flow which IS in scope. `sanitizeRedirectTo` enforces safety.                                                                                                                                                                                                                                               |
| Q2  | Locale switcher: cookie-only MVP or persist server-side via API? | **Cookie-only** for MVP                  | No `users` row exists pre-auth; persist to `users.locale` post-auth on first login via the existing trigger / a follow-up update. Saves an endpoint.                                                                                                                                                                                                     |
| Q3  | Allow-list: single domain or list-of-domains from day 1?         | **List of domains**                      | Schema is identical complexity; flexibility costs nothing. Seed with `sun-asterisk.com`; admins add partners via migration.                                                                                                                                                                                                                              |
| Q4  | i18n library                                                     | **next-intl**                            | App Router native; Server Component friendly; minimal client JS; supports cookie-based locale detection — satisfies TR-008.                                                                                                                                                                                                                              |
| Q5  | Spec mentioned `POST /api/auth/signin/google` endpoint           | **Replaced by a Server Action**          | Server Actions provide built-in CSRF + simpler client code. The OAuth flow doesn't need an addressable URL.                                                                                                                                                                                                                                              |
| Q6  | Client-side global state library (Zustand, Jotai, etc.)          | **Not added in this iteration**          | Login screen needs none. Defer until a feature actually requires it.                                                                                                                                                                                                                                                                                     |
| Q7  | Spec predicted `GET /api/auth/session` endpoint                  | **Removed — no addressable endpoint**    | Sessions are read in-process: Server Components / Server Actions call `createServerClient().auth.getSession()`; middleware refreshes the cookie. An HTTP endpoint adds attack surface (CSRF probing, cache misuse) for zero callers. Cross-tab session detection uses the Supabase JS client's `onAuthStateChange` subscription, not a polling endpoint. |

If any of the above is overridden, update this plan and the corresponding FRs
in `spec.md`, then regenerate tasks.

---

## Next Steps

1. **Run** `/momorph.reviewplan` to validate this plan against the spec and
   constitution, then `/momorph.tasks` to generate the executable task list.
2. **Provision** Supabase + Google OAuth client (out-of-code prerequisites).
3. **Begin** Phase 0 (asset download) followed by Phase 1 (foundation).

---

## Notes

- **Why Login pulls so much foundation**: this is the first feature in an
  empty codebase. The Constitution mandates Supabase, Zod, Vitest, Playwright,
  Tailwind tokens, and security headers. Trying to defer those would leave
  every subsequent feature retrofitting infra into a security-critical
  flow — strictly worse. Bundling here is the smaller and safer choice.
- **Server Action vs route handler for sign-in**: documented in Q5 above.
  This is a deliberate **deviation from the spec's API table** (`POST
/api/auth/signin/google`). The spec's intent is preserved (server-initiated
  OAuth redirect with CSRF protection) — the mechanism is upgraded to the
  framework's idiomatic option. The Server Action lives at `app/login/actions.ts`
  and is invoked from a progressive-enhancement `<form action>`.
- **Database trigger upserts `users` from `auth.users`**: chosen over an
  application-level upsert in the callback because (a) it survives any
  future direct-DB signup flow, (b) is RLS-friendly, (c) keeps the callback
  route shorter and more auditable.
- **CI gate ordering**: lint → typecheck → unit → build → integration → e2e
  → audit. Fail fast on cheap checks.
- **Spec traceability**: every FR-### and TR-### in spec.md is touched by at
  least one phase above. A small traceability matrix can be added to
  `research.md` if useful.
- **Things explicitly not in this plan** (out of scope per spec): iOS
  companion, password auth, admin allow-list UI, two-factor, account
  recovery, other OAuth providers.
