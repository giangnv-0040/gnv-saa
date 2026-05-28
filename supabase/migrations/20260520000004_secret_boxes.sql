-- =============================================================================
-- gnv-saa — Secret boxes (US12 / FR-017)
-- Each row is a gift box assigned to a user. `opened_at` is null until the
-- owner opens it via the (out-of-scope) Secret Box dialog.
-- =============================================================================

create table public.secret_boxes (
    id          uuid primary key default gen_random_uuid(),
    owner_id    uuid not null references public.users (id) on delete cascade,
    content_id  text,
    opened_at   timestamptz,
    created_at  timestamptz not null default now()
);

comment on table public.secret_boxes is
    'Gifts assigned to a user. Counter aggregates in sidebar; opening flow is out of scope.';

create index secret_boxes_owner_open_idx
    on public.secret_boxes (owner_id, opened_at);

alter table public.secret_boxes enable row level security;

-- Only the owner may read / update their boxes.
create policy secret_boxes_select_owner
    on public.secret_boxes
    for select
    to authenticated
    using (owner_id = auth.uid());

create policy secret_boxes_update_owner
    on public.secret_boxes
    for update
    to authenticated
    using (owner_id = auth.uid())
    with check (owner_id = auth.uid());

-- Admins manage the inventory.
create policy secret_boxes_admin_write
    on public.secret_boxes
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
