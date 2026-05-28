-- =============================================================================
-- gnv-saa — Special days (FR-020)
-- Admin-configured days during which `kudo_likes.delta_at_write` is bumped
-- to `hearts_multiplier` (typically 2). The like service consults this table
-- at write-time so the multiplier is baked into the row.
-- =============================================================================

create table public.special_days (
    day                date primary key,
    hearts_multiplier  smallint not null default 2 check (hearts_multiplier between 1 and 4),
    note               text,
    created_at         timestamptz not null default now()
);

comment on table public.special_days is
    'Admin-configured days where likes count for more (FR-020 / SC-002).';

alter table public.special_days enable row level security;

-- SELECT: everyone (it informs UI badges in future iterations).
create policy special_days_select_all
    on public.special_days
    for select
    to anon, authenticated
    using (true);

-- INSERT / UPDATE / DELETE: admins only.
create policy special_days_admin_write
    on public.special_days
    for all
    to authenticated
    using (
        exists (
            select 1 from public.users u
            where u.id = auth.uid() and u.role = 'admin'
        )
    )
    with check (
        exists (
            select 1 from public.users u
            where u.id = auth.uid() and u.role = 'admin'
        )
    );

-- -----------------------------------------------------------------------------
-- Helper: looks up the multiplier for "today" (server-local date).
-- Used by the like service via RPC; returns 1 when no row matches.
-- -----------------------------------------------------------------------------
create or replace function public.current_heart_multiplier()
returns smallint
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(
        (select hearts_multiplier from public.special_days where day = current_date),
        1::smallint
    );
$$;
