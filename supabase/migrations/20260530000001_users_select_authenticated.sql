-- =============================================================================
-- gnv-saa — Allow authenticated users to read the company-wide users directory
--
-- The original `users_select_self` policy restricted SELECT to the viewer's own
-- row, which left the Viết Kudo recipient picker, the live-board leaderboards,
-- and kudo cards (sender/recipient display_name + avatar) with empty data sets
-- for everyone except the viewer. This migration opens SELECT to all
-- authenticated users — appropriate for an internal company directory.
--
-- `users_select_self` is kept (Postgres OR-combines policies, so the broader
-- one wins) as an explicit safety net for anonymous-session edge cases.
-- =============================================================================

create policy users_select_authenticated
    on public.users
    for select
    to authenticated
    using (true);

comment on policy users_select_authenticated on public.users is
    'Authenticated users can read the full user directory (recipient picker, leaderboards, kudo cards).';
