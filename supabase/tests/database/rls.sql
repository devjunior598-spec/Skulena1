-- Run against a disposable local Supabase database:
--   supabase test db
-- The entire test is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

insert into auth.users(id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
values
  ('10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'parent-a@example.test', 'x', now(), '{}', '{"account_type":"parent","full_name":"Parent A"}'),
  ('10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'parent-b@example.test', 'x', now(), '{}', '{"account_type":"parent","full_name":"Parent B"}'),
  ('20000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'owner-a@example.test', 'x', now(), '{}', '{"account_type":"school_owner","full_name":"Owner A"}'),
  ('20000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'owner-b@example.test', 'x', now(), '{}', '{"account_type":"school_owner","full_name":"Owner B"}');

insert into public.children(id, parent_id, first_name) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Private child');
insert into public.schools(id, slug, name, status, created_by) values
  ('40000000-0000-0000-0000-000000000001', 'school-a', 'School A', 'published', '20000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002', 'school-b', 'School B', 'draft', '20000000-0000-0000-0000-000000000002');
insert into public.school_branches(id, school_id, city, is_main) values
  ('60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Ibadan', true),
  ('60000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'Ibadan', true);
insert into public.school_media(id, school_id, category, media_type, storage_path, mime_type, byte_size, moderation_status, uploaded_by) values
  ('70000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Campus', 'image', 'school-a/approved.jpg', 'image/jpeg', 100, 'approved', '20000000-0000-0000-0000-000000000001'),
  ('70000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'Campus', 'image', 'school-a/pending.jpg', 'image/jpeg', 100, 'pending', '20000000-0000-0000-0000-000000000001');
insert into public.school_documents(id, school_id, document_type, title, storage_path, mime_type, byte_size, uploaded_by)
values ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'registration', 'Private licence', '40000000-0000-0000-0000-000000000001/20000000-0000-0000-0000-000000000001/file.pdf', 'application/pdf', 100, '20000000-0000-0000-0000-000000000001');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select is((select count(*)::integer from public.children where parent_id = '10000000-0000-0000-0000-000000000002'), 0, 'parent cannot read another parent child');
select is((with changed as (update public.parent_profiles set preferred_city='Nope' where user_id='10000000-0000-0000-0000-000000000002' returning 1) select count(*)::integer from changed), 0, 'parent cannot update another parent');
select throws_ok($$update public.profiles set role='admin' where id='10000000-0000-0000-0000-000000000001'$$, '42501', null, 'user cannot assign own admin role');
insert into public.saved_schools(parent_id, school_id) values ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001');
select is((select count(*)::integer from public.saved_schools where parent_id='10000000-0000-0000-0000-000000000001'), 1, 'parent can save a published school');
select throws_ok($$insert into public.saved_schools(parent_id, school_id) values ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002')$$, '42501', null, 'parent cannot save a draft school');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select is((with changed as (update public.schools set description='cross school edit' where id='40000000-0000-0000-0000-000000000002' returning 1) select count(*)::integer from changed), 0, 'School A owner cannot edit School B');
select throws_ok($$insert into public.verification_records(school_id, verification_type, method, status, verified_by, verified_at) values ('40000000-0000-0000-0000-000000000001','identity','school_provided','verified','20000000-0000-0000-0000-000000000001',now())$$, '42501', null, 'school cannot self-award verification');
select throws_ok($$update public.school_media set moderation_status='approved' where id='70000000-0000-0000-0000-000000000002'$$, '42501', null, 'school cannot self-approve media');
select ok(public.has_school_role('40000000-0000-0000-0000-000000000001', array['owner']::public.school_member_role[]), 'owner membership works for own school');

reset role;
set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claim.sub', '', true);
select is((select count(*)::integer from public.public_school_profiles where id='40000000-0000-0000-0000-000000000001'), 1, 'published school is publicly visible');
select is((select count(*)::integer from public.public_school_profiles where id='40000000-0000-0000-0000-000000000002'), 0, 'draft school is not publicly visible');
select is((select count(*)::integer from public.school_branches where school_id='40000000-0000-0000-0000-000000000001'), 1, 'published school branch is publicly visible');
select is((select count(*)::integer from public.school_branches where school_id='40000000-0000-0000-0000-000000000002'), 0, 'draft school branch is private');
select is((select count(*)::integer from public.school_media where school_id='40000000-0000-0000-0000-000000000001'), 1, 'only approved published media is public');
select throws_ok($$select * from public.school_documents where id='50000000-0000-0000-0000-000000000001'$$, '42501', null, 'private documents cannot be fetched anonymously');

select * from finish();
rollback;
