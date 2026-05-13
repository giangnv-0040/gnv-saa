-- =============================================================================
-- gnv-saa — Add `role` column to public.users
--
-- Purpose: support the Homepage SAA profile dropdown which shows an
-- "Admin Dashboard" item only when role = 'admin' (spec FR-022).
--
-- Notes:
-- - The column defaults to 'user'. Existing rows backfill safely.
-- - Updates to `role` are blocked at the trigger layer: only the service-role
--   (admin tooling / migrations) may change it. Self-promotion via the
--   `users_update_self` RLS policy is rejected by the trigger guard.
-- - First admin onboarding is manual (see README / plan §Open Questions):
--     update public.users set role = 'admin' where email = 'someone@sun-asterisk.com';
--   To be replaced by a dedicated admin-management screen later.
-- =============================================================================

alter table public.users
    add column role text not null default 'user'
        check (role in ('user', 'admin'));

comment on column public.users.role is
    'Authorization role. user (default) or admin. Mutable only via service-role.';

-- -----------------------------------------------------------------------------
-- Extend the existing immutability trigger to protect `role` from
-- self-service updates (preserves the column-grant semantics established in
-- the init migration for id/email/created_at).
-- -----------------------------------------------------------------------------
create or replace function public.users_block_protected_column_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if new.id          is distinct from old.id          then raise exception 'users.id is immutable'; end if;
    if new.email       is distinct from old.email       then raise exception 'users.email is managed by auth'; end if;
    if new.created_at  is distinct from old.created_at  then raise exception 'users.created_at is immutable'; end if;
    if new.role        is distinct from old.role        then raise exception 'users.role is managed by admins (service-role only)'; end if;
    return new;
end;
$$;
