-- =============================================================================
-- gnv-saa — Kudos core schema
-- Owns: kudos table, image attachments, hashtags, supporting indexes + RLS.
-- Spec: .momorph/specs/MaZUn5xHXZ-sun-kudos-live-board/spec.md
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: kudos
-- One row per kudo. Sender + recipient FK auth.users via public.users.
-- `body` is the kudo content; `title` is the optional eyebrow (e.g.
-- "IDOL GIỚI TRẺ"). `is_anonymous` hides the sender on display surfaces but
-- never strips the row of its sender_id (audit trail).
-- -----------------------------------------------------------------------------
create table public.kudos (
    id            uuid primary key default gen_random_uuid(),
    sender_id     uuid not null references public.users (id) on delete cascade,
    recipient_id  uuid not null references public.users (id) on delete cascade,
    title         text,
    body          text not null check (char_length(body) between 1 and 2000),
    is_anonymous  boolean not null default false,
    created_at    timestamptz not null default now(),
    constraint kudos_sender_recipient_diff check (sender_id <> recipient_id)
);

comment on table public.kudos is
    'Persisted Kudos. Insert by sender (RLS); read by anyone authenticated.';

create index kudos_created_at_idx       on public.kudos (created_at desc, id);
create index kudos_recipient_idx        on public.kudos (recipient_id);
create index kudos_sender_idx           on public.kudos (sender_id);

alter table public.kudos enable row level security;

-- Anyone can read; authenticated callers can insert as themselves.
create policy kudos_select_all
    on public.kudos
    for select
    to anon, authenticated
    using (true);

create policy kudos_insert_self
    on public.kudos
    for insert
    to authenticated
    with check (sender_id = auth.uid());

create policy kudos_update_sender
    on public.kudos
    for update
    to authenticated
    using (sender_id = auth.uid())
    with check (sender_id = auth.uid());

create policy kudos_delete_sender_or_admin
    on public.kudos
    for delete
    to authenticated
    using (
        sender_id = auth.uid()
        or exists (
            select 1 from public.users u
            where u.id = auth.uid() and u.role = 'admin'
        )
    );

-- -----------------------------------------------------------------------------
-- Table: kudo_images — up to 5 image URLs per kudo (FR-012).
-- Stored as a child table (1:N) so RLS / cascade-on-delete stay simple.
-- -----------------------------------------------------------------------------
create table public.kudo_images (
    id          uuid primary key default gen_random_uuid(),
    kudo_id     uuid not null references public.kudos (id) on delete cascade,
    url         text not null,
    position    smallint not null check (position between 0 and 4),
    created_at  timestamptz not null default now(),
    unique (kudo_id, position)
);

comment on table public.kudo_images is
    'Image attachments for a kudo. Capped at 5 by app-layer + UNIQUE(position).';

create index kudo_images_kudo_idx on public.kudo_images (kudo_id);

alter table public.kudo_images enable row level security;

create policy kudo_images_select_all
    on public.kudo_images
    for select
    to anon, authenticated
    using (true);

create policy kudo_images_insert_sender
    on public.kudo_images
    for insert
    to authenticated
    with check (
        exists (
            select 1 from public.kudos k
            where k.id = kudo_id and k.sender_id = auth.uid()
        )
    );

create policy kudo_images_delete_sender
    on public.kudo_images
    for delete
    to authenticated
    using (
        exists (
            select 1 from public.kudos k
            where k.id = kudo_id and k.sender_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- Table: kudo_hashtags — up to 5 hashtag tokens per kudo (FR-011).
-- Tokens are stored lowercase, without the leading "#". The display layer
-- prepends "#" when rendering.
-- -----------------------------------------------------------------------------
create table public.kudo_hashtags (
    kudo_id    uuid not null references public.kudos (id) on delete cascade,
    tag        text not null check (tag = lower(tag) and char_length(tag) between 1 and 40),
    position   smallint not null check (position between 0 and 4),
    primary key (kudo_id, position)
);

comment on table public.kudo_hashtags is
    'Hashtag tokens for a kudo. Lower-cased; UI prepends "#" on render.';

create index kudo_hashtags_tag_idx on public.kudo_hashtags (tag);

alter table public.kudo_hashtags enable row level security;

create policy kudo_hashtags_select_all
    on public.kudo_hashtags
    for select
    to anon, authenticated
    using (true);

create policy kudo_hashtags_insert_sender
    on public.kudo_hashtags
    for insert
    to authenticated
    with check (
        exists (
            select 1 from public.kudos k
            where k.id = kudo_id and k.sender_id = auth.uid()
        )
    );

create policy kudo_hashtags_delete_sender
    on public.kudo_hashtags
    for delete
    to authenticated
    using (
        exists (
            select 1 from public.kudos k
            where k.id = kudo_id and k.sender_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- Extend public.users with `team`, `badge`, `hearts_received` (read-only on
-- the live board — derived elsewhere or admin-set).
-- -----------------------------------------------------------------------------
alter table public.users
    add column team            text,
    add column badge           text,
    add column hearts_received integer not null default 0 check (hearts_received >= 0);

comment on column public.users.team            is 'Display team / department for kudos cards (sidebar leaderboards + chips).';
comment on column public.users.badge           is 'Optional honour badge (e.g. "Legend Hero").';
comment on column public.users.hearts_received is 'Aggregate hearts received — incremented by kudo_likes triggers.';
