# gnv-saa

Sun\* Annual Awards 2025 (SAA) web application — Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + Supabase.

## Prerequisites

### Toolchain

- **Node.js ≥ 20** (Next.js 16 requirement). If your system has an older Node, use `nvm install 20 && nvm use 20`.
- **npm ≥ 10** (ships with Node 20).
- **Supabase CLI** — install per [docs](https://supabase.com/docs/guides/cli/getting-started) (not via npm). On Linux/macOS: `brew install supabase/tap/supabase` or download the binary.

### External services (required before running the auth flow)

1. **Supabase project** — create at <https://supabase.com/dashboard>. Grab the project URL, anon key, and service-role key from _Project Settings → API_.
2. **Google OAuth client** — create at <https://console.cloud.google.com/apis/credentials> (type: Web application). Authorized redirect URIs:
   - Production: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Local: `http://localhost:54321/auth/v1/callback` (when running `supabase start`)
3. In the Supabase Dashboard, enable the **Google provider** under _Authentication → Providers_ and paste the OAuth client ID + secret.

## Setup

```bash
# 1. Use the right Node version
nvm use 20    # or your equivalent

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.local.example .env.local
# Edit .env.local — fill in NEXT_PUBLIC_SITE_URL, Supabase URL/keys, Google OAuth (for local Supabase)

# 4. (Local Supabase) Start the local stack
npm run supabase:start
npm run supabase:reset       # apply migrations + seed
```

## Running

```bash
npm run dev          # http://localhost:3000
npm run build        # production build
npm run start        # serve the production build
```

## Quality gates

```bash
npm run lint         # ESLint (eslint-config-next)
npm run typecheck    # tsc --noEmit
npm run format       # Prettier write
npm run format:check # Prettier check (CI)
```

## Tests

```bash
npm run test           # Vitest unit + integration, one shot
npm run test:watch     # Vitest watch mode
npm run test:coverage  # Vitest with v8 coverage
npm run test:e2e       # Playwright (Chromium + Firefox + WebKit)
npm run test:e2e:ui    # Playwright in interactive UI mode
```

E2E tests bypass the real Google OAuth consent via a Playwright fixture that programmatically sets a Supabase session (`tests/e2e/fixtures/auth.ts`). A separate manual / nightly job exercises the real Google flow.

## Project documents

Architecture, specifications, and tasks live under `.momorph/`:

- `.momorph/constitution.md` — project standards (v1.0.0)
- `.momorph/specs/{screenId}-{screen_name}/spec.md` — feature specification
- `.momorph/specs/{screenId}-{screen_name}/plan.md` — implementation plan
- `.momorph/specs/{screenId}-{screen_name}/tasks.md` — task list
- `.momorph/specs/{screenId}-{screen_name}/assets-map.md` — Figma → local asset mapping

## Homepage SAA — operational notes

### Event start datetime

The hero countdown reads `NEXT_PUBLIC_EVENT_START_AT` (ISO-8601). It is a build-time constant; changing the date requires a redeploy. Invalid or missing values render the countdown as `00 00 00` and hide the "Coming soon" sub-label. Example:

```bash
NEXT_PUBLIC_EVENT_START_AT=2026-12-31T18:30:00+07:00
```

### Prelaunch gate

When `NEXT_PUBLIC_EVENT_START_AT` is set in the future, every public route renders the **prelaunch page** (`app/prelaunch/page.tsx`) — a full-bleed countdown to the event. Set the env var to a past datetime (or unset it) to ship the real app. The gate lives in `middleware.ts` (FR-001 / FR-009 fail-open) and short-circuits API routes with HTTP 503 `{ "error": "prelaunch" }` except `/api/auth/*` and `/api/healthz`.

### Promoting a user to admin

The Homepage profile dropdown shows an "Admin Dashboard" entry only when `public.users.role = 'admin'`. The column is locked by a server-side trigger — users cannot self-promote. Until an admin-management screen ships, set the role manually:

```sql
update public.users set role = 'admin' where email = 'someone@sun-asterisk.com';
```

### Supported locales

The application supports `vi` (default) and `en`. `messages/ja.json` remains in the tree as soft-deprecated — no consumer references it. Add the locale back to `lib/i18n/config.ts` + `lib/validation/auth.ts` to re-enable it.

## Current status

Login (`GzbNeVGJHz`) and Homepage SAA (`i87tDx10uM`) screens are implemented. Both ship with unit + integration tests under `tests/`. See [.momorph/contexts/SCREENFLOW.md](.momorph/contexts/SCREENFLOW.md) for the project-wide screen status. The remaining screens are tracked there as `pending`.

## License

Internal — Sun\* Asterisk.
