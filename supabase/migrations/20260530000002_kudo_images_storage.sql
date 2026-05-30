-- =============================================================================
-- gnv-saa — Storage bucket + RLS for kudo image attachments
--
-- The Viết Kudo form lets the sender attach up to 5 images per kudo
-- (FR-012). Files are uploaded directly from the browser to this bucket;
-- the resulting public URLs are then persisted in `public.kudo_images`.
--
-- Bucket layout: `kudo-images/{sender_id}/{uuid}.{ext}`. The {sender_id}
-- prefix lets the upload RLS check match `auth.uid()::text` against the
-- first path segment, so a user can only write into their own folder.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('kudo-images', 'kudo-images', true)
on conflict (id) do nothing;

-- Anyone (even anon viewers of the live board) can read images.
create policy kudo_images_public_read
    on storage.objects
    for select
    to anon, authenticated
    using (bucket_id = 'kudo-images');

-- Authenticated users may upload only under their own `{auth.uid()}/...`
-- prefix. Path traversal / cross-user writes are blocked at the DB.
create policy kudo_images_sender_insert
    on storage.objects
    for insert
    to authenticated
    with check (
        bucket_id = 'kudo-images'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

-- The sender may delete their own uploads (e.g. when removing a draft).
create policy kudo_images_sender_delete
    on storage.objects
    for delete
    to authenticated
    using (
        bucket_id = 'kudo-images'
        and (storage.foldername(name))[1] = auth.uid()::text
    );
