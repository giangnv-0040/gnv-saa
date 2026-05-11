<!--
SYNC IMPACT REPORT
==================
Version change: (none) → 1.0.0
Bump rationale: Initial ratification of the project constitution. MAJOR baseline established.

Modified principles:
  - (new) I. Clean Code & Source Organization
  - (new) II. Tech Stack Best Practices (Next.js + React + Supabase)
  - (new) III. Responsive Web UI & Accessibility
  - (new) IV. OWASP Secure Coding Practices
  - (new) V. Test-Driven Development (NON-NEGOTIABLE)

Added sections:
  - Core Principles (5 principles)
  - Technology Stack & Constraints
  - Development Workflow & Quality Gates
  - Governance

Removed sections: none

Templates requiring updates:
  - ✅ .momorph/templates/plan-template.md — "Constitution Compliance Check" gate already references this file; aligned with new principles (no edit needed).
  - ✅ .momorph/templates/spec-template.md — "Dependencies" section already references this file; aligned.
  - ✅ .momorph/templates/tasks-template.md — TDD ordering ("Tests MUST be written and FAIL before implementation") already aligns with Principle V; aligned.
  - ✅ AGENTS.md — describes command flows; no edits needed.
  - ✅ .momorph/guidelines/frontend.md — design-token + navigation rules align with Principle II/III; no edits needed.
  - ✅ .momorph/guidelines/backend.md — controller/service separation aligns with Principle II; no edits needed.

Follow-up TODOs: none
-->

# gnv-saa Constitution

## Core Principles

### I. Clean Code & Source Organization

Code MUST be readable, self-documenting, and organized by feature rather than by technical
layer where practical. Specifically:

- Every file MUST have a single, clearly named responsibility. Files exceeding ~250 LoC
  SHOULD be split unless cohesion requires otherwise.
- Naming MUST be explicit and intention-revealing. Use kebab-case for non-component module
  filenames (e.g. `user-service.ts`); PascalCase for React components and classes
  (e.g. `UserCard.tsx`); camelCase for variables and functions.
- TypeScript `strict` mode MUST remain enabled (`tsconfig.json`). `any`, `@ts-ignore`,
  and non-null assertions (`!`) are prohibited unless accompanied by an inline justification
  comment and approved in review.
- ESLint MUST pass with zero errors before merge. The `eslint-config-next` ruleset is the
  baseline; project-specific rules MUST be added via `eslint.config.mjs`, never disabled
  per-file without justification.
- Prefer composition over inheritance, pure functions over stateful classes, and
  immutability (`const`, readonly types, immutable updates) over mutation.
- Dead code, commented-out blocks, and unused exports MUST be removed before merge.

**Rationale**: Readability and clear boundaries reduce onboarding time, defect rates, and
review churn — and they enable the parallel feature development that the `momorph` workflow
depends on.

### II. Tech Stack Best Practices (Next.js + React + Supabase)

The project's stack is **Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind
CSS 4 + Supabase**. All work MUST follow framework-idiomatic patterns:

- **Next.js App Router**: Default to Server Components. Mark Client Components with
  `'use client'` only when interactivity, state, or browser APIs are required. Route
  handlers MUST live under `app/api/.../route.ts` and MUST be thin — business logic
  belongs in services per `.momorph/guidelines/backend.md`.
- **Data fetching**: Server-side fetching in Server Components or Route Handlers is the
  default. Client-side data fetching MUST use a documented strategy (e.g. React Query,
  SWR) and MUST NOT leak service-role secrets to the client.
- **Supabase**: Use the official `@supabase/supabase-js` (and `@supabase/ssr` for
  Next.js server contexts) clients. **Row-Level Security (RLS) MUST be enabled on every
  table that holds user-scoped or sensitive data**, with policies version-controlled in
  migrations. The `service_role` key MUST NEVER be exposed to the browser; it is only
  permitted in server-only code paths and edge functions. The `anon` key is the only
  Supabase credential allowed in client bundles.
- **Database migrations**: All schema changes MUST be expressed as Supabase migrations
  checked into the repository. Ad-hoc edits via the Supabase dashboard are prohibited
  except for emergency fixes, which MUST be back-ported to a migration within 24 hours.
- **Styling**: Tailwind utilities MUST be the default. Raw colors, spacing, radii, and
  typography values MUST NOT be hard-coded in components — use the design tokens defined
  in global CSS per `.momorph/guidelines/frontend.md`.
- **Navigation**: All `href` values, route navigations, and post-submission redirects
  MUST be derived from `SCREENFLOW.md` and `group_specs/*.md`. Guessing URLs is
  prohibited (see `.momorph/guidelines/frontend.md` §"URL and Navigation Implementation").
- **Dependencies**: New runtime dependencies MUST be justified in the plan's
  "Constitution Compliance Check" and SHOULD be preferred over hand-rolled alternatives
  only when the surface area warrants it.

**Rationale**: Picking one idiomatic path per concern (rendering, data, styling,
auth/data access) keeps the codebase coherent across contributors and AI agents, and
prevents the most common Supabase footguns (leaked service keys, missing RLS).

### III. Responsive Web UI & Accessibility

The product is a **responsive web application**. UI work MUST honor web platform
conventions and accessibility:

- Mobile-first responsive design is mandatory. Layouts MUST work at standard breakpoints
  (≥320px mobile, ≥768px tablet, ≥1024px desktop, ≥1440px wide) without horizontal
  scrolling or content clipping.
- **WCAG 2.1 Level AA compliance is the minimum bar.** All interactive elements MUST be
  keyboard-operable, have visible focus indicators, and meet 4.5:1 contrast for normal
  text (3:1 for large text and non-text UI components).
- Semantic HTML is required (`<button>`, `<nav>`, `<main>`, `<form>`, etc.). Use ARIA
  attributes only when semantic HTML is insufficient.
- All images MUST have meaningful `alt` text (or `alt=""` if decorative). All form
  inputs MUST have associated `<label>` elements.
- Touch targets MUST be ≥44×44 CSS pixels on touch viewports.
- Core Web Vitals targets: LCP < 2.5s, INP < 200ms, CLS < 0.1 at the 75th percentile on
  representative production data.
- No layout, color, or asset values may be hard-coded — consume design tokens per
  `.momorph/guidelines/frontend.md`.

**Rationale**: Accessibility and responsiveness are not optional polish — they determine
whether the product is usable at all for a significant portion of users, and they are
the baseline expected of any modern web app.

### IV. OWASP Secure Coding Practices

All code MUST follow the **OWASP Top 10** and **OWASP ASVS Level 2** controls relevant
to a Next.js + Supabase stack. Non-negotiable rules:

- **Input validation & output encoding**: All external input (route params, search
  params, request bodies, form data, headers) MUST be validated at the trust boundary
  using a schema validator (e.g. Zod). Validated input MUST be the only thing passed to
  business logic. React's default escaping MUST NOT be bypassed via
  `dangerouslySetInnerHTML` without a sanitized, reviewed source.
- **Authentication & session management**: Authentication MUST go through Supabase Auth
  (or an approved equivalent). Sessions MUST use HTTP-only, Secure, SameSite=Lax (or
  Strict where compatible) cookies set via `@supabase/ssr`. JWTs MUST NOT be stored in
  `localStorage`.
- **Authorization**: Server-side authorization checks MUST be present on every route
  handler and server action that touches user data, in addition to Supabase RLS. Never
  rely on client-side checks alone.
- **Secrets management**: All secrets (Supabase service role, API keys, OAuth client
  secrets) MUST live in environment variables (`.env.local`, deployment env). Only vars
  prefixed `NEXT_PUBLIC_` may appear in client bundles, and they MUST NOT be secrets.
  `.env*` files MUST be gitignored. Secret material MUST NEVER appear in commits, logs,
  or error messages.
- **SQL injection**: Use Supabase's query builder or parameterized queries exclusively.
  String concatenation into SQL is prohibited.
- **CSRF**: Mutating requests MUST be protected — by SameSite cookies, double-submit
  tokens, or the framework's server-action CSRF defenses.
- **HTTP security headers**: Production responses MUST include
  `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options:
  nosniff`, `Referrer-Policy`, and `Permissions-Policy`, configured in
  `next.config.ts` or middleware.
- **Dependency hygiene**: `npm audit` SHOULD run in CI; high/critical advisories MUST
  be triaged within 7 days of disclosure and resolved or formally accepted with a
  documented compensating control.
- **Logging**: PII, secrets, and authentication tokens MUST NOT be logged. Errors
  surfaced to the client MUST NOT leak stack traces or internal identifiers in
  production.

**Rationale**: Most production breaches stem from a small set of well-understood
mistakes; codifying these rules turns "best effort" security into a default that
reviewers and AI agents can mechanically enforce.

### V. Test-Driven Development (NON-NEGOTIABLE)

TDD is mandatory. The Red-Green-Refactor cycle MUST be followed for all new behavior:

1. **Red**: Write a failing test that specifies the desired behavior. The test MUST
   fail for the right reason (assertion failure, not import/syntax error).
2. **Green**: Write the minimum production code required to pass the test.
3. **Refactor**: Improve structure with tests staying green.

Concrete requirements:

- **Unit & integration tests**: Use **Vitest**. Tests MUST live next to the code under
  test (`foo.ts` ↔ `foo.test.ts`) or under a parallel `tests/` tree mirroring `src/`,
  consistent within a feature.
- **End-to-end tests**: Use **Playwright**. E2E tests MUST follow the Page Object Model
  per `.momorph/guidelines/e2e/3_code_review_standards.md`.
- **Contract tests are required** whenever a route handler is added or its
  request/response shape changes.
- **Integration tests are required** for: (a) any Supabase access path (using a real
  test database or a documented mocking strategy — never both styles in the same
  feature); (b) cross-module interactions; (c) auth/authorization flows.
- A PR introducing new behavior without accompanying failing-then-passing tests MUST be
  rejected in review.
- Coverage is a side effect, not the goal. There is no minimum coverage threshold, but
  every user-facing acceptance scenario in `spec.md` MUST map to at least one automated
  test.

**Rationale**: TDD compresses the feedback loop, surfaces design problems early, and —
critically for an AI-agent-driven workflow — produces an executable specification that
keeps generated code honest.

## Technology Stack & Constraints

The following constraints are binding for this project. Deviations require an amendment
(see Governance).

- **Runtime/Framework**: Node.js LTS + Next.js 16 (App Router). The Pages Router MUST
  NOT be introduced.
- **Language**: TypeScript 5 with `strict: true`. Plain `.js`/`.jsx` files are
  prohibited in `app/` and `src/` (configuration files excepted).
- **UI**: React 19 + Tailwind CSS 4 + design tokens defined in `app/globals.css`.
  CSS-in-JS libraries MUST NOT be introduced.
- **Backend-as-a-Service**: Supabase (PostgreSQL + Auth + Storage + Edge Functions).
  Direct database connections bypassing Supabase clients are prohibited from
  application code; admin/migration tooling excepted.
- **Validation**: A single schema validator (Zod) at the trust boundary. Mixing
  validators within the project is prohibited.
- **Testing**: Vitest (unit/integration) + Playwright (E2E). No additional test
  frameworks unless added via amendment.
- **Linting/Formatting**: ESLint (`eslint-config-next`) + Prettier defaults. Both MUST
  run cleanly in CI before merge.
- **Path aliases**: `@/*` → project root, as defined in `tsconfig.json`. Relative
  imports more than two levels deep SHOULD use the alias instead.
- **Browser support**: Latest two stable versions of Chrome, Edge, Firefox, Safari, and
  the latest iOS/Android default browsers.

## Development Workflow & Quality Gates

The following gates are mandatory for every change that ships to `main`:

1. **Spec → Plan → Tasks**: Non-trivial features follow the MoMorph flow
   (`momorph.specify` → `momorph.plan` → `momorph.tasks` → `momorph.implement`). The
   plan MUST include the "Constitution Compliance Check" with all boxes ticked or
   violations justified.
2. **Branch & PR**: Feature branches (`feat/...`, `fix/...`, `chore/...`) MUST be
   used. Direct commits to `main` are prohibited except for the initial bootstrap.
3. **CI gates (all MUST pass)**:
   - `eslint` — zero errors.
   - `tsc --noEmit` — zero errors.
   - `vitest run` — all tests green.
   - `playwright test` — all E2E tests green (or explicitly scoped if running in
     sharded mode).
   - Build (`next build`) — succeeds.
   - Dependency audit — no unresolved high/critical advisories.
4. **Code review**: At least one human reviewer (in addition to any AI-assisted review)
   MUST approve. Reviewers MUST verify constitution compliance, not just functional
   correctness.
5. **Migrations**: Supabase schema changes MUST be reviewed alongside the application
   code that depends on them. RLS policies MUST be reviewed in every PR that touches
   data access.
6. **Commits**: Conventional Commits format (`feat:`, `fix:`, `refactor:`, `test:`,
   `docs:`, `chore:`). The `momorph.commit` workflow MAY be used to generate
   messages.

## Governance

This constitution supersedes ad-hoc conventions, individual preference, and unwritten
practice. Where this document conflicts with another file in the repository, this
document wins until the other file is reconciled.

**Amendment procedure**:

1. Propose the change via PR that modifies `.momorph/constitution.md`. The PR
   description MUST state the motivation and the impact on existing code/templates.
2. Update the `Sync Impact Report` HTML comment at the top of this file (version
   change, modified/added/removed sections, templates touched, deferred TODOs).
3. Propagate the change to dependent templates (`plan-template.md`, `spec-template.md`,
   `tasks-template.md`) and guideline documents in the same PR.
4. Obtain approval from a project maintainer.
5. On merge, the new version becomes effective immediately for all subsequent work.

**Versioning policy** (semantic versioning of this document):

- **MAJOR**: A principle is removed, redefined incompatibly, or a non-negotiable rule
  is relaxed in a way that changes how existing code is judged.
- **MINOR**: A new principle or section is added, or existing guidance is materially
  expanded.
- **PATCH**: Clarifications, wording fixes, typo corrections, non-semantic
  refinements.

**Compliance review**: Every PR's review checklist MUST include "constitution
compliance verified". Recurring violations of the same principle SHOULD prompt either
(a) a tooling/automation fix to prevent recurrence, or (b) a constitution amendment
acknowledging the principle is unworkable as written.

**Runtime guidance**: For day-to-day development, agents and contributors MUST consult
`AGENTS.md`, `.momorph/guidelines/frontend.md`, `.momorph/guidelines/backend.md`, and
the relevant `db_guidelines/` and `e2e/` files in addition to this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-05-11 | **Last Amended**: 2026-05-11
