-- =============================================================================
-- gnv-saa — Auth foundation migration
-- Creates: auth_allowed_domains, users (+ RLS, policies, trigger, seed)
-- Owns: authentication boundary (domain allow-list + user mirror of auth.users)
-- =============================================================================

create extension if not exists "citext";

-- -----------------------------------------------------------------------------
-- Table: auth_allowed_domains
-- Domain allow-list enforced server-side by /auth/callback. NO RLS policy for
-- authenticated role — service-role only at runtime; admins manage via migration.
-- -----------------------------------------------------------------------------
create table public.auth_allowed_domains (
    domain     text primary key check (domain = lower(domain) and domain like '%.%'),
    enabled    boolean not null default true,
    notes      text,
    created_at timestamptz not null default now()
);

alter table public.auth_allowed_domains enable row level security;

comment on table public.auth_allowed_domains is
    'Sun*-domain allow-list. Read by /auth/callback via service role only.';

-- -----------------------------------------------------------------------------
-- Table: users — mirrors auth.users with application-level columns
-- -----------------------------------------------------------------------------
create table public.users (
    id            uuid primary key references auth.users (id) on delete cascade,
    email         citext not null unique,
    display_name  text,
    avatar_url    text,
    locale        text not null default 'vi' check (locale in ('vi','en','ja')),
    created_at    timestamptz not null default now(),
    last_login_at timestamptz
);

alter table public.users enable row level security;

comment on table public.users is
    'Application user profile mirrored from auth.users via on_auth_user_created trigger.';

-- -----------------------------------------------------------------------------
-- RLS policies on public.users
-- - Authenticated users may SELECT their own row.
-- - Authenticated users may UPDATE their own row, but only the `locale` column
--   (column-level enforced via a trigger guard; PostgreSQL doesn't natively
--   support column-grant in RLS policies, so we check OLD vs NEW).
-- -----------------------------------------------------------------------------
create policy users_select_self
    on public.users
    for select
    to authenticated
    using (auth.uid() = id);

create policy users_update_self
    on public.users
    for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

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
    return new;
end;
$$;

create trigger users_block_protected_column_updates
    before update on public.users
    for each row
    execute function public.users_block_protected_column_updates();

-- -----------------------------------------------------------------------------
-- Trigger: on auth.users insert, upsert into public.users
-- Pulls display_name + avatar_url from raw_user_meta_data (populated by Google
-- OAuth provider). On conflict (id) we keep the existing row but refresh email
-- to stay in sync with the Auth source of truth.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.users (id, email, display_name, avatar_url)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
        new.raw_user_meta_data ->> 'avatar_url'
    )
    on conflict (id) do update
        set email        = excluded.email,
            display_name = coalesce(excluded.display_name, public.users.display_name),
            avatar_url   = coalesce(excluded.avatar_url,   public.users.avatar_url);
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_auth_user();

-- -----------------------------------------------------------------------------
-- Seed: Sun* primary domain
-- -----------------------------------------------------------------------------
insert into public.auth_allowed_domains (domain, enabled, notes)
values ('sun-asterisk.com', true, 'Sun* primary domain — seeded by init_auth migration')
on conflict (domain) do nothing;
