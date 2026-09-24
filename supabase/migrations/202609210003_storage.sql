-- Private buckets. Access is always policy-controlled; application code issues
-- short-lived signed URLs only after the matching metadata record is authorized.

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values
  ('school-media', 'school-media', false, 104857600, array['image/jpeg','image/png','image/webp','video/mp4','video/webm']),
  ('school-documents', 'school-documents', false, 20971520, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Paths are `{school_id}/{uploader_id}/{random-file-name}`. Never trust only
-- the path in application code: the database metadata and RLS remain canonical.
create policy school_media_member_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'school-media'
  and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
  and (storage.foldername(name))[2] = auth.uid()::text
  and public.can_manage_school(((storage.foldername(name))[1])::uuid)
);

create policy school_media_authorized_select on storage.objects for select to anon, authenticated
using (
  bucket_id = 'school-media' and exists (
    select 1 from public.school_media m
    where m.storage_path = name and (
      (public.is_published_school(m.school_id) and m.moderation_status = 'approved')
      or public.has_school_role(m.school_id, null) or public.is_trust_staff()
    )
  )
);

create policy school_media_member_update on storage.objects for update to authenticated
using (
  bucket_id = 'school-media'
  and public.can_manage_school(case when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' then ((storage.foldername(name))[1])::uuid else null end)
)
with check (
  bucket_id = 'school-media'
  and (storage.foldername(name))[2] = auth.uid()::text
  and public.can_manage_school(case when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' then ((storage.foldername(name))[1])::uuid else null end)
);

create policy school_media_member_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'school-media'
  and public.can_manage_school(case when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' then ((storage.foldername(name))[1])::uuid else null end)
);

create policy school_documents_member_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'school-documents'
  and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
  and (storage.foldername(name))[2] = auth.uid()::text
  and public.can_manage_school(((storage.foldername(name))[1])::uuid)
);

create policy school_documents_authorized_select on storage.objects for select to authenticated
using (
  bucket_id = 'school-documents' and exists (
    select 1 from public.school_documents d
    where d.storage_path = name and (
      public.has_school_role(d.school_id, array['owner','administrator','editor','viewer']::public.school_member_role[])
      or public.is_trust_staff()
    )
  )
);

create policy school_documents_member_update on storage.objects for update to authenticated
using (
  bucket_id = 'school-documents'
  and public.can_manage_school(case when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' then ((storage.foldername(name))[1])::uuid else null end)
)
with check (
  bucket_id = 'school-documents'
  and (storage.foldername(name))[2] = auth.uid()::text
  and public.can_manage_school(case when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' then ((storage.foldername(name))[1])::uuid else null end)
);

create policy school_documents_member_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'school-documents'
  and public.can_manage_school(case when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' then ((storage.foldername(name))[1])::uuid else null end)
);
