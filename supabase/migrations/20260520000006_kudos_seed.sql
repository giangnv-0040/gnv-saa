-- =============================================================================
-- gnv-saa — Local dev seed for the Sun* Kudos live board
--
-- Purpose: gives `supabase db reset` a useful starting dataset so the live
-- board renders real DB rows instead of falling back to mocks in dev.
--
-- The seed is conservative: only runs when the `auth.users` table has no
-- rows yet (i.e. a fresh `db reset`). In a populated environment the guard
-- short-circuits and nothing is inserted. The seed must NOT execute on
-- production environments — production deploys skip seed files.
-- =============================================================================

do $$
declare
    -- Seed user UUIDs are stable so re-running yields the same ids.
    u_nhat  uuid := '11111111-1111-1111-1111-111111111111';
    u_hieu  uuid := '22222222-2222-2222-2222-222222222222';
    u_linh  uuid := '33333333-3333-3333-3333-333333333333';
    u_phuc  uuid := '44444444-4444-4444-4444-444444444444';
    u_an    uuid := '55555555-5555-5555-5555-555555555555';
    k1 uuid; k2 uuid; k3 uuid; k4 uuid; k5 uuid;
begin
    if exists (select 1 from auth.users limit 1) then
        return;
    end if;

    -- Create matching auth.users rows so the FK from public.users passes.
    -- We set encrypted_password to NULL — OAuth users go through Supabase
    -- Auth in production; these seed rows are purely for dev visualisation.
    insert into auth.users (id, email, raw_user_meta_data, aud, role)
    values
        (u_nhat, 'nhat.huynh+seed@sun-asterisk.com',
         jsonb_build_object('full_name', 'Huỳnh Dương Xuân Nhật'),
         'authenticated', 'authenticated'),
        (u_hieu, 'hieu.nguyen+seed@sun-asterisk.com',
         jsonb_build_object('full_name', 'Nguyễn Trung Hiếu'),
         'authenticated', 'authenticated'),
        (u_linh, 'linh.tran+seed@sun-asterisk.com',
         jsonb_build_object('full_name', 'Trần Mỹ Linh'),
         'authenticated', 'authenticated'),
        (u_phuc, 'phuc.le+seed@sun-asterisk.com',
         jsonb_build_object('full_name', 'Lê Hồng Phúc'),
         'authenticated', 'authenticated'),
        (u_an,   'an.pham+seed@sun-asterisk.com',
         jsonb_build_object('full_name', 'Phạm Hoài An'),
         'authenticated', 'authenticated');

    -- The `handle_new_auth_user` trigger should already mirror these into
    -- public.users. Update the live-board-only columns directly.
    update public.users set team = 'CEVC10', badge = 'Rising Hero' where id = u_nhat;
    update public.users set team = 'CEVC1',  badge = 'Legend Hero' where id = u_hieu;
    update public.users set team = 'BizDev', badge = 'New Hero'    where id = u_linh;
    update public.users set team = 'Design', badge = 'Legend Hero' where id = u_phuc;
    update public.users set team = 'QA',     badge = 'Rising Hero' where id = u_an;

    -- 5 kudos for the highlight + feed surfaces.
    insert into public.kudos (id, sender_id, recipient_id, title, body)
    values
        (gen_random_uuid(), u_hieu, u_nhat, 'IDOL GIỚI TRẺ',
         'Cám ơn em đã luôn nỗ lực và truyền cảm hứng cho cả team.')
        returning id into k1;
    insert into public.kudos (id, sender_id, recipient_id, title, body)
    values
        (gen_random_uuid(), u_nhat, u_phuc, 'CRAFTSMANSHIP',
         'Code review của anh cực kỳ chi tiết, em học được rất nhiều.')
        returning id into k2;
    insert into public.kudos (id, sender_id, recipient_id, title, body)
    values
        (gen_random_uuid(), u_phuc, u_hieu, null,
         'Mentor tận tâm — luôn sẵn sàng giải đáp mọi câu hỏi.')
        returning id into k3;
    insert into public.kudos (id, sender_id, recipient_id, title, body)
    values
        (gen_random_uuid(), u_an,   u_linh, null,
         'BizDev đỉnh nhất quả đất, deal nào cũng chốt!')
        returning id into k4;
    insert into public.kudos (id, sender_id, recipient_id, title, body)
    values
        (gen_random_uuid(), u_linh, u_an, null,
         'QA cẩn thận, không có em là release đã banh từ tuần trước rồi.')
        returning id into k5;

    -- Hashtags (lowercase, max 5 per kudo).
    insert into public.kudo_hashtags (kudo_id, tag, position) values
        (k1, 'dedicated', 0), (k1, 'inspring', 1),
        (k2, 'craftsmanship', 0), (k2, 'mentor', 1),
        (k3, 'mentor', 0), (k3, 'rootfurther', 1),
        (k4, 'customer-first', 0), (k4, 'go-extra-mile', 1),
        (k5, 'ownership', 0), (k5, 'kindness', 1);

    -- Likes — populate hearts_count via the AFTER INSERT trigger.
    insert into public.kudo_likes (user_id, kudo_id) values
        (u_linh, k1), (u_phuc, k1), (u_an, k1),
        (u_hieu, k2), (u_linh, k2),
        (u_nhat, k3), (u_an, k3),
        (u_phuc, k4),
        (u_hieu, k5), (u_nhat, k5);

    -- Secret boxes — one unopened for u_nhat so the Mở quà button is enabled.
    insert into public.secret_boxes (owner_id, content_id) values
        (u_nhat, 'SAA-Tshirt-XL'),
        (u_nhat, 'SAA-Hat');

    insert into public.secret_boxes (owner_id, content_id, opened_at) values
        (u_hieu, 'SAA-Tshirt-L', now());

    -- Special day — declare TODAY as a +2 hearts day so dev can see the
    -- FR-020 multiplier in action without any admin tooling. Idempotent
    -- via the day PK so re-runs of the seed are safe.
    insert into public.special_days (day, hearts_multiplier, note) values
        (current_date, 2, 'Dev seed — every like today counts as 2 hearts')
        on conflict (day) do nothing;
end;
$$;
