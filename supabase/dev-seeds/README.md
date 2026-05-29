# Dev seeds

Files in this directory are **dev-only fixtures** — they are intentionally kept
**outside** `supabase/migrations/` so `supabase db push` does NOT apply them
to production environments.

Use cases:

- Populate local Supabase with sample Kudos / users / leaderboard data so the
  live board renders against real DB rows instead of mock fallback.
- Insert today as a special_day so `+2 hearts` multiplier is observable in
  dev without admin tooling.

## Apply locally

```bash
npm run db:seed:dev
```

The script runs `psql` against the local Supabase Postgres (port 54322) and
applies each `.sql` in this directory in lexicographic order. The seed files
are written to be **idempotent** — re-running on a populated DB is safe.

## Apply manually

```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -f supabase/dev-seeds/20260520000006_kudos_seed.sql
```

## DON'T

- Don't move these files back into `supabase/migrations/` — production deploys
  will pick them up and seed prod with fake users.
- Don't reference these seeds from app code — they only exist for local dev.
- Don't add real PII (emails, names beyond the dummy "Sunner X" set).
