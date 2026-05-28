-- =============================================================================
-- gnv-saa — Kudos read-side views
-- Pre-joins kudos with sender/recipient + aggregated hearts so the live-board
-- read path is one SELECT instead of N+1.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- View: kudo_with_aggregates
-- Joins a kudo with its sender/recipient profile and total hearts.
-- -----------------------------------------------------------------------------
create or replace view public.kudo_with_aggregates as
select
    k.id,
    k.title,
    k.body,
    k.is_anonymous,
    k.created_at,
    k.sender_id,
    sender.display_name  as sender_display_name,
    sender.team          as sender_team,
    sender.badge         as sender_badge,
    sender.hearts_received as sender_hearts_received,
    sender.avatar_url    as sender_avatar_url,
    k.recipient_id,
    recipient.display_name  as recipient_display_name,
    recipient.team          as recipient_team,
    recipient.badge         as recipient_badge,
    recipient.hearts_received as recipient_hearts_received,
    recipient.avatar_url    as recipient_avatar_url,
    coalesce(hearts.count, 0)  as hearts_count
from public.kudos k
    join public.users sender    on sender.id    = k.sender_id
    join public.users recipient on recipient.id = k.recipient_id
    left join lateral (
        select count(*)::integer as count
          from public.kudo_likes l
         where l.kudo_id = k.id
    ) as hearts on true;

comment on view public.kudo_with_aggregates is
    'One-row-per-kudo view used by GET /api/kudos.';

-- -----------------------------------------------------------------------------
-- View: user_kudo_stats — sidebar personal counters (US8 / D.1.*).
-- -----------------------------------------------------------------------------
create or replace view public.user_kudo_stats as
select
    u.id as user_id,
    coalesce(received.count, 0) as kudos_received,
    coalesce(sent.count,     0) as kudos_sent,
    u.hearts_received,
    coalesce(opened.count,   0) as secret_boxes_opened,
    coalesce(unopened.count, 0) as secret_boxes_unopened
from public.users u
    left join lateral (
        select count(*)::integer as count from public.kudos k where k.recipient_id = u.id
    ) received on true
    left join lateral (
        select count(*)::integer as count from public.kudos k where k.sender_id = u.id
    ) sent on true
    left join lateral (
        select count(*)::integer as count
          from public.secret_boxes sb
         where sb.owner_id = u.id and sb.opened_at is not null
    ) opened on true
    left join lateral (
        select count(*)::integer as count
          from public.secret_boxes sb
         where sb.owner_id = u.id and sb.opened_at is null
    ) unopened on true;

comment on view public.user_kudo_stats is
    'Aggregate counters surfaced by GET /api/users/me/stats.';

-- -----------------------------------------------------------------------------
-- View: kudo_spotlight — recipient name + kudos count + last kudo id/time
-- for the Spotlight word cloud (US7 / B.7).
-- -----------------------------------------------------------------------------
create or replace view public.kudo_spotlight as
select
    u.id            as user_id,
    u.display_name  as display_name,
    u.team          as team,
    u.avatar_url    as avatar_url,
    aggregates.kudos_count,
    aggregates.last_received_at,
    aggregates.last_kudo_id
from public.users u
    join lateral (
        select
            count(*)::integer  as kudos_count,
            max(k.created_at)  as last_received_at,
            (
                select k2.id
                from public.kudos k2
                where k2.recipient_id = u.id
                order by k2.created_at desc, k2.id desc
                limit 1
            )                  as last_kudo_id
        from public.kudos k
        where k.recipient_id = u.id
    ) aggregates on aggregates.kudos_count > 0;

comment on view public.kudo_spotlight is
    'Recipient distribution for the SPOTLIGHT BOARD word cloud.';
