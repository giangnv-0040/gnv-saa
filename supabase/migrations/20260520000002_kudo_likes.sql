-- =============================================================================
-- gnv-saa — Kudo likes (FR-004..FR-006, FR-020)
-- Composite PK (user_id, kudo_id) enforces one-like-per-user-per-kudo.
-- RLS prevents a user from liking their own kudo (defence-in-depth alongside
-- the service-layer guard).
-- =============================================================================

create table public.kudo_likes (
    user_id        uuid not null references public.users (id) on delete cascade,
    kudo_id        uuid not null references public.kudos (id) on delete cascade,
    -- Snapshot of the heart multiplier at write-time (1 by default; 2 on a
    -- "special day"). Stored so aggregate counters don't drift when the
    -- special-day flag is toggled later.
    delta_at_write smallint not null default 1 check (delta_at_write between 1 and 4),
    created_at     timestamptz not null default now(),
    primary key (user_id, kudo_id)
);

comment on table public.kudo_likes is
    'One row per (user, kudo) like. delta_at_write captures special-day multiplier.';

create index kudo_likes_kudo_idx on public.kudo_likes (kudo_id);

alter table public.kudo_likes enable row level security;

-- SELECT: authenticated only (used to compute `viewerHasLiked`).
create policy kudo_likes_select_auth
    on public.kudo_likes
    for select
    to authenticated
    using (true);

-- INSERT: caller must be themselves AND must NOT be the kudo's sender.
create policy kudo_likes_insert_self
    on public.kudo_likes
    for insert
    to authenticated
    with check (
        user_id = auth.uid()
        and exists (
            select 1 from public.kudos k
            where k.id = kudo_id and k.sender_id <> auth.uid()
        )
    );

-- DELETE: only the row's own user.
create policy kudo_likes_delete_self
    on public.kudo_likes
    for delete
    to authenticated
    using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Triggers — maintain `users.hearts_received` aggregate using delta_at_write
-- so the special-day +2 logic stays correct even if the flag flips later.
-- -----------------------------------------------------------------------------
create or replace function public.kudo_likes_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_recipient uuid;
begin
    select recipient_id into v_recipient from public.kudos where id = new.kudo_id;
    if v_recipient is not null then
        update public.users
            set hearts_received = hearts_received + new.delta_at_write
            where id = v_recipient;
    end if;
    return new;
end;
$$;

create trigger kudo_likes_after_insert
    after insert on public.kudo_likes
    for each row
    execute function public.kudo_likes_after_insert();

create or replace function public.kudo_likes_after_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_recipient uuid;
begin
    select recipient_id into v_recipient from public.kudos where id = old.kudo_id;
    if v_recipient is not null then
        update public.users
            set hearts_received = greatest(0, hearts_received - old.delta_at_write)
            where id = v_recipient;
    end if;
    return old;
end;
$$;

create trigger kudo_likes_after_delete
    after delete on public.kudo_likes
    for each row
    execute function public.kudo_likes_after_delete();
