-- Security helpers, auth lifecycle, workflows, views, grants and RLS.

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles', 'parent_profiles', 'children', 'schools', 'school_branches', 'school_members',
    'school_classes', 'school_facilities', 'school_fees', 'school_media', 'school_documents',
    'verification_records', 'inspections', 'inspection_items', 'reviews', 'review_responses'
  ] loop
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

create or replace function public.current_app_role()
returns public.app_role
language sql stable security definer set search_path = ''
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.is_platform_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$ select coalesce(public.current_app_role() in ('admin', 'super_admin'), false) $$;

create or replace function public.is_trust_staff()
returns boolean
language sql stable security definer set search_path = ''
as $$ select coalesce(public.current_app_role() in ('inspector', 'moderator', 'admin', 'super_admin'), false) $$;

-- The base schools table contains private contact and ownership fields. Public
-- relation policies must not query it as anon (who has no table grant) or as a
-- parent (whose table RLS intentionally hides school-owned rows).
create or replace function public.is_published_school(target_school_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.schools s
    where s.id = target_school_id and s.status = 'published'
  )
$$;

create or replace function public.has_school_role(target_school_id uuid, allowed_roles public.school_member_role[] default null)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.school_members sm
    where sm.school_id = target_school_id and sm.user_id = auth.uid() and sm.is_active
      and (allowed_roles is null or sm.role = any(allowed_roles))
  )
$$;

create or replace function public.can_manage_school(target_school_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.has_school_role(target_school_id, array['owner', 'administrator', 'editor']::public.school_member_role[])
$$;

create or replace function public.can_manage_members(target_school_id uuid, target_role public.school_member_role)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.has_school_role(target_school_id, array['owner']::public.school_member_role[])
    or (
      target_role not in ('owner', 'administrator') and
      public.has_school_role(target_school_id, array['administrator']::public.school_member_role[])
    )
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare safe_role public.app_role;
begin
  safe_role := case new.raw_user_meta_data ->> 'account_type'
    when 'school_owner' then 'school_owner'::public.app_role
    else 'parent'::public.app_role
  end;

  insert into public.profiles(id, role, full_name)
  values (new.id, safe_role, coalesce(new.raw_user_meta_data ->> 'full_name', ''));

  if safe_role = 'parent' then
    insert into public.parent_profiles(user_id) values (new.id);
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.prevent_profile_role_change()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.role is distinct from new.role
    and coalesce(auth.jwt() ->> 'role', '') <> 'service_role'
    and coalesce(current_setting('app.allow_role_change', true), '0') <> '1' then
    raise exception 'Profile roles can only be changed through an authorized administrative workflow';
  end if;
  return new;
end;
$$;

create trigger protect_profile_role before update of role on public.profiles
for each row execute function public.prevent_profile_role_change();

create or replace function public.prevent_school_media_self_approval()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not public.is_trust_staff() and (
    old.moderation_status is distinct from new.moderation_status
    or old.verification_status is distinct from new.verification_status
    or (old.moderation_status = 'approved' and (
      old.school_id is distinct from new.school_id
      or old.storage_path is distinct from new.storage_path
      or old.media_type is distinct from new.media_type
      or old.mime_type is distinct from new.mime_type
      or old.byte_size is distinct from new.byte_size
      or old.uploaded_by is distinct from new.uploaded_by
    ))
  ) then
    raise exception 'Media approval and approved file identity require trust staff'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger protect_school_media_approval before update on public.school_media
for each row execute function public.prevent_school_media_self_approval();

create or replace function public.assign_platform_role(target_user_id uuid, new_role public.app_role)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_platform_admin() then raise exception 'Not authorized'; end if;
  if new_role = 'super_admin' and public.current_app_role() <> 'super_admin' then raise exception 'Only a super admin can assign this role'; end if;
  perform set_config('app.allow_role_change', '1', true);
  update public.profiles set role = new_role where id = target_user_id;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'role_changed', 'profile', target_user_id, jsonb_build_object('new_role', new_role));
end;
$$;

create or replace function public.bootstrap_school_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.school_members(school_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  insert into public.audit_logs(actor_id, action, entity_type, entity_id)
  values (new.created_by, 'school_created', 'school', new.id);
  return new;
end;
$$;

create trigger on_school_created after insert on public.schools
for each row execute function public.bootstrap_school_owner();

create or replace function public.prevent_last_school_owner_removal()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.role = 'owner' and old.is_active and (tg_op = 'DELETE' or new.role <> 'owner' or not new.is_active) then
    if not exists (
      select 1 from public.school_members sm
      where sm.school_id = old.school_id and sm.id <> old.id and sm.role = 'owner' and sm.is_active
    ) then raise exception 'A school must retain at least one active owner'; end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger keep_school_owner before update or delete on public.school_members
for each row execute function public.prevent_last_school_owner_removal();

create or replace function public.create_school_draft(
  school_name text,
  school_slug text,
  initial_country text default 'Nigeria'
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_school_id uuid;
begin
  if auth.uid() is null or public.current_app_role() <> 'school_owner' then raise exception 'A school owner account is required'; end if;
  insert into public.schools(name, slug, created_by)
  values (trim(school_name), lower(trim(school_slug)), auth.uid()) returning id into new_school_id;
  insert into public.school_branches(school_id, name, country, is_main)
  values (new_school_id, 'Main campus', coalesce(nullif(trim(initial_country), ''), 'Nigeria'), true);
  return new_school_id;
end;
$$;

create or replace function public.submit_school(target_school_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare target public.schools;
begin
  if not public.has_school_role(target_school_id, array['owner', 'administrator']::public.school_member_role[]) then raise exception 'Not authorized'; end if;
  select * into target from public.schools where id = target_school_id;
  if target.status not in ('draft', 'rejected') then raise exception 'This school cannot be submitted from its current status'; end if;
  if target.description is null or not exists (select 1 from public.school_branches where school_id = target_school_id and address_line is not null)
     or not exists (select 1 from public.school_levels where school_id = target_school_id)
     or not exists (select 1 from public.school_curricula where school_id = target_school_id) then
    raise exception 'Complete basic information, location, levels and curriculum before submission';
  end if;
  update public.schools set status = 'submitted', submitted_at = now() where id = target_school_id;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id) values (auth.uid(), 'school_submitted', 'school', target_school_id);
end;
$$;

create or replace function public.set_school_status(target_school_id uuid, new_status public.school_status)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_platform_admin() then raise exception 'Not authorized'; end if;
  update public.schools set status = new_status,
    published_at = case when new_status = 'published' then coalesce(published_at, now()) else published_at end
  where id = target_school_id;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), case when new_status = 'published' then 'school_published' else 'school_status_changed' end,
    'school', target_school_id, jsonb_build_object('status', new_status));
end;
$$;

create or replace function public.school_profile_completion(target_school_id uuid)
returns integer language sql stable security definer set search_path = '' as $$
  select case when not public.has_school_role(target_school_id, null) and not public.is_platform_admin() then 0 else
    round(100.0 * (
      (case when s.description is not null and s.school_type is not null then 1 else 0 end) +
      (case when exists(select 1 from public.school_branches b where b.school_id=s.id and b.address_line is not null) then 1 else 0 end) +
      (case when exists(select 1 from public.school_levels x where x.school_id=s.id) then 1 else 0 end) +
      (case when exists(select 1 from public.school_curricula x where x.school_id=s.id) then 1 else 0 end) +
      (case when exists(select 1 from public.school_facilities x where x.school_id=s.id) then 1 else 0 end) +
      (case when exists(select 1 from public.school_fees x where x.school_id=s.id) then 1 else 0 end) +
      (case when exists(select 1 from public.school_media x where x.school_id=s.id) then 1 else 0 end) +
      (case when s.admission_description is not null then 1 else 0 end) +
      (case when exists(select 1 from public.school_documents x where x.school_id=s.id) then 1 else 0 end)
    ) / 9.0)::integer end
  from public.schools s where s.id = target_school_id
$$;

create or replace function public.audit_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare row_id uuid; school uuid; action_name text;
begin
  row_id := case when tg_op = 'DELETE' then old.id else new.id end;
  action_name := case tg_table_name
    when 'profiles' then 'profile_changed'
    when 'school_documents' then 'document_changed'
    when 'verification_records' then 'verification_changed'
    when 'school_members' then case when tg_op = 'INSERT' then 'staff_invited' else 'staff_permissions_changed' end
    else tg_table_name || '_' || lower(tg_op)
  end;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), action_name, tg_table_name, row_id, jsonb_build_object('operation', tg_op));
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger audit_profile after update on public.profiles for each row execute function public.audit_change();
create trigger audit_document after insert or update or delete on public.school_documents for each row execute function public.audit_change();
create trigger audit_verification after insert or update or delete on public.verification_records for each row execute function public.audit_change();
create trigger audit_members after insert or update or delete on public.school_members for each row execute function public.audit_change();

create view public.public_school_profiles with (security_barrier = true) as
select s.id, s.slug, s.name, s.short_name, s.school_type, s.year_established, s.description,
  s.public_email, s.public_phone, s.website_url, s.structure, s.gender, s.admission_status,
  s.admission_description, s.published_at
from public.schools s where s.status = 'published';

create view public.public_verification_records with (security_barrier = true) as
select v.id, v.school_id, v.branch_id, v.verification_type, v.method, v.status,
  v.subject_type, v.subject_id, v.verified_at, v.expires_at, v.public_summary
from public.verification_records v join public.schools s on s.id = v.school_id
where s.status = 'published' and v.status = 'verified' and (v.expires_at is null or v.expires_at > now());

create view public.public_reviews with (security_barrier = true) as
select r.id, r.school_id, r.rating, r.title, r.body, r.created_at
from public.reviews r join public.schools s on s.id = r.school_id
where s.status = 'published' and r.status = 'published';

revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.public_school_profiles, public.public_verification_records, public.public_reviews to anon, authenticated;
grant select on public.levels, public.curricula, public.facilities to anon, authenticated;
grant select on public.school_branches, public.school_levels, public.school_curricula, public.school_facilities,
  public.school_classes, public.school_fees, public.school_media, public.school_admission_requirements to anon, authenticated;
grant select on public.profiles, public.parent_profiles, public.children, public.schools, public.school_members,
  public.school_documents, public.verification_records, public.inspections, public.inspection_items,
  public.saved_schools, public.reviews, public.review_responses, public.notifications, public.audit_logs to authenticated;
grant insert on public.children, public.schools, public.school_branches, public.school_levels, public.school_classes,
  public.school_curricula, public.school_facilities, public.school_fees, public.school_media, public.school_documents,
  public.school_admission_requirements, public.school_members, public.saved_schools, public.reviews,
  public.review_responses, public.verification_records, public.inspections, public.inspection_items to authenticated;
grant update, delete on public.children, public.school_branches, public.school_classes, public.school_facilities,
  public.school_fees, public.school_media, public.school_documents, public.school_admission_requirements,
  public.school_members, public.saved_schools, public.reviews, public.review_responses,
  public.verification_records, public.inspections, public.inspection_items to authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;
grant update (preferred_city, onboarding_completed_at) on public.parent_profiles to authenticated;
grant update (name, short_name, school_type, year_established, description, contact_email, contact_phone,
  public_email, public_phone, website_url, structure, gender, admission_status, admission_description) on public.schools to authenticated;
grant insert, update, delete on public.school_levels, public.school_curricula to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant usage, select on all sequences in schema public to authenticated;
revoke execute on function public.set_updated_at(), public.current_app_role(), public.is_platform_admin(), public.is_trust_staff(),
  public.is_published_school(uuid), public.prevent_school_media_self_approval(),
  public.has_school_role(uuid, public.school_member_role[]), public.can_manage_school(uuid), public.can_manage_members(uuid, public.school_member_role),
  public.handle_new_user(), public.prevent_profile_role_change(), public.assign_platform_role(uuid, public.app_role), public.bootstrap_school_owner(),
  public.prevent_last_school_owner_removal(), public.create_school_draft(text, text, text), public.submit_school(uuid),
  public.set_school_status(uuid, public.school_status), public.school_profile_completion(uuid), public.audit_change() from public, anon;
grant execute on function public.current_app_role(), public.is_platform_admin(), public.is_trust_staff(),
  public.is_published_school(uuid), public.has_school_role(uuid, public.school_member_role[]) to anon, authenticated;
grant execute on function public.can_manage_school(uuid), public.can_manage_members(uuid, public.school_member_role),
  public.create_school_draft(text, text, text), public.submit_school(uuid), public.school_profile_completion(uuid),
  public.assign_platform_role(uuid, public.app_role), public.set_school_status(uuid, public.school_status) to authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles','parent_profiles','children','schools','school_branches','school_members','levels','school_levels',
    'school_classes','curricula','school_curricula','facilities','school_facilities','school_fees','school_media',
    'school_documents','school_admission_requirements','verification_records','inspections','inspection_items',
    'saved_schools','reviews','review_responses','notifications','audit_logs'
  ] loop execute format('alter table public.%I enable row level security', table_name); end loop;
end $$;

create policy profiles_read_self_or_admin on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_platform_admin());
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy parent_profiles_own on public.parent_profiles for select to authenticated using (user_id = auth.uid() or public.is_platform_admin());
create policy parent_profiles_update_own on public.parent_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy children_own_read on public.children for select to authenticated using (parent_id = auth.uid() or public.is_platform_admin());
create policy children_own_insert on public.children for insert to authenticated with check (parent_id = auth.uid() and public.current_app_role() = 'parent');
create policy children_own_update on public.children for update to authenticated using (parent_id = auth.uid()) with check (parent_id = auth.uid());
create policy children_own_delete on public.children for delete to authenticated using (parent_id = auth.uid());

create policy schools_member_read on public.schools for select to authenticated using (public.has_school_role(id, null) or public.is_trust_staff());
create policy schools_owner_insert on public.schools for insert to authenticated
  with check (created_by = auth.uid() and public.current_app_role() = 'school_owner' and status = 'draft');
create policy schools_member_update on public.schools for update to authenticated
  using (public.can_manage_school(id)) with check (public.can_manage_school(id));

create policy branches_public_read on public.school_branches for select to anon, authenticated
  using (public.is_published_school(school_id) or public.has_school_role(school_id, null) or public.is_trust_staff());
create policy branches_member_write on public.school_branches for all to authenticated
  using (public.can_manage_school(school_id)) with check (public.can_manage_school(school_id));
create policy members_school_read on public.school_members for select to authenticated
  using (user_id = auth.uid() or public.has_school_role(school_id, array['owner','administrator']::public.school_member_role[]) or public.is_platform_admin());
create policy members_authorized_insert on public.school_members for insert to authenticated
  with check (public.can_manage_members(school_id, role));
create policy members_authorized_update on public.school_members for update to authenticated
  using (public.can_manage_members(school_id, role)) with check (public.can_manage_members(school_id, role));
create policy members_authorized_delete on public.school_members for delete to authenticated
  using (public.can_manage_members(school_id, role));

create policy levels_public_read on public.levels for select to anon, authenticated using (true);
create policy curricula_public_read on public.curricula for select to anon, authenticated using (true);
create policy facilities_public_read on public.facilities for select to anon, authenticated using (true);

create policy school_levels_public_read on public.school_levels for select to anon, authenticated
  using (public.is_published_school(school_id) or public.has_school_role(school_id, null) or public.is_trust_staff());
create policy school_levels_write on public.school_levels for all to authenticated using (public.can_manage_school(school_id)) with check (public.can_manage_school(school_id));
create policy school_curricula_public_read on public.school_curricula for select to anon, authenticated
  using (public.is_published_school(school_id) or public.has_school_role(school_id, null) or public.is_trust_staff());
create policy school_curricula_write on public.school_curricula for all to authenticated using (public.can_manage_school(school_id)) with check (public.can_manage_school(school_id));

create policy school_classes_public_read on public.school_classes for select to anon, authenticated
  using (public.is_published_school(school_id) or public.has_school_role(school_id, null) or public.is_trust_staff());
create policy school_classes_write on public.school_classes for all to authenticated using (public.can_manage_school(school_id)) with check (public.can_manage_school(school_id));
create policy school_facilities_public_read on public.school_facilities for select to anon, authenticated
  using (public.is_published_school(school_id) or public.has_school_role(school_id, null) or public.is_trust_staff());
create policy school_facilities_write on public.school_facilities for all to authenticated using (public.can_manage_school(school_id)) with check (public.can_manage_school(school_id));
create policy school_fees_public_read on public.school_fees for select to anon, authenticated
  using (public.is_published_school(school_id) or public.has_school_role(school_id, null) or public.is_trust_staff());
create policy school_fees_write on public.school_fees for all to authenticated using (public.can_manage_school(school_id)) with check (public.can_manage_school(school_id));
create policy admission_requirements_public_read on public.school_admission_requirements for select to anon, authenticated
  using (public.is_published_school(school_id) or public.has_school_role(school_id, null) or public.is_trust_staff());
create policy admission_requirements_write on public.school_admission_requirements for all to authenticated using (public.can_manage_school(school_id)) with check (public.can_manage_school(school_id));

create policy media_public_or_member_read on public.school_media for select to anon, authenticated using (
  (moderation_status='approved' and public.is_published_school(school_id))
  or public.has_school_role(school_id, null) or public.is_trust_staff());
create policy media_member_insert on public.school_media for insert to authenticated
  with check (public.can_manage_school(school_id) and uploaded_by=auth.uid() and moderation_status='pending' and verification_status='pending');
create policy media_member_update on public.school_media for update to authenticated
  using (public.can_manage_school(school_id) or public.is_trust_staff())
  with check (public.can_manage_school(school_id) or public.is_trust_staff());
create policy media_member_delete on public.school_media for delete to authenticated using (public.can_manage_school(school_id) or public.is_platform_admin());

create policy documents_authorized_read on public.school_documents for select to authenticated
  using (public.has_school_role(school_id, array['owner','administrator','editor','viewer']::public.school_member_role[]) or public.is_trust_staff());
create policy documents_member_insert on public.school_documents for insert to authenticated
  with check (public.can_manage_school(school_id) and uploaded_by=auth.uid());
create policy documents_member_update on public.school_documents for update to authenticated
  using (public.can_manage_school(school_id)) with check (public.can_manage_school(school_id));
create policy documents_member_delete on public.school_documents for delete to authenticated using (public.can_manage_school(school_id));

create policy verification_authorized_read on public.verification_records for select to authenticated
  using (public.has_school_role(school_id, null) or public.is_trust_staff());
create policy verification_staff_insert on public.verification_records for insert to authenticated
  with check (public.is_trust_staff() and verified_by = auth.uid());
create policy verification_staff_update on public.verification_records for update to authenticated
  using (public.is_trust_staff()) with check (public.is_trust_staff());
create policy verification_admin_delete on public.verification_records for delete to authenticated using (public.is_platform_admin());
create policy inspections_scoped_read on public.inspections for select to authenticated
  using (inspector_id=auth.uid() or public.has_school_role(school_id, array['owner','administrator']::public.school_member_role[]) or public.is_platform_admin());
create policy inspections_staff_write on public.inspections for all to authenticated
  using (inspector_id=auth.uid() or public.is_platform_admin()) with check ((inspector_id=auth.uid() and public.current_app_role()='inspector') or public.is_platform_admin());
create policy inspection_items_scoped_read on public.inspection_items for select to authenticated
  using (exists(select 1 from public.inspections i where i.id=inspection_id and (i.inspector_id=auth.uid() or public.has_school_role(i.school_id, array['owner','administrator']::public.school_member_role[]) or public.is_platform_admin())));
create policy inspection_items_staff_write on public.inspection_items for all to authenticated
  using (exists(select 1 from public.inspections i where i.id=inspection_id and (i.inspector_id=auth.uid() or public.is_platform_admin())))
  with check (exists(select 1 from public.inspections i where i.id=inspection_id and (i.inspector_id=auth.uid() or public.is_platform_admin())));

create policy saved_own_read on public.saved_schools for select to authenticated using (parent_id=auth.uid());
create policy saved_own_insert on public.saved_schools for insert to authenticated
  with check (parent_id=auth.uid() and public.current_app_role()='parent' and public.is_published_school(school_id));
create policy saved_own_delete on public.saved_schools for delete to authenticated using (parent_id=auth.uid());
create policy reviews_own_or_staff_read on public.reviews for select to authenticated
  using (parent_id=auth.uid() or public.has_school_role(school_id, null) or public.is_trust_staff());
create policy reviews_parent_insert on public.reviews for insert to authenticated
  with check (parent_id=auth.uid() and public.current_app_role()='parent' and status='pending');
create policy reviews_parent_update on public.reviews for update to authenticated
  using (parent_id=auth.uid() and status='pending') with check (parent_id=auth.uid() and status='pending');
create policy reviews_parent_delete on public.reviews for delete to authenticated using (parent_id=auth.uid() and status='pending');
create policy responses_read on public.review_responses for select to authenticated
  using (public.has_school_role(school_id, null) or public.is_trust_staff() or exists(select 1 from public.reviews r where r.id=review_id and r.parent_id=auth.uid()));
create policy responses_school_write on public.review_responses for all to authenticated
  using (public.has_school_role(school_id, array['owner','administrator','editor']::public.school_member_role[]))
  with check (public.has_school_role(school_id, array['owner','administrator','editor']::public.school_member_role[]) and author_id=auth.uid());
create policy notifications_own_read on public.notifications for select to authenticated using (recipient_id=auth.uid());
create policy notifications_own_update on public.notifications for update to authenticated using (recipient_id=auth.uid()) with check (recipient_id=auth.uid());
create policy audit_admin_read on public.audit_logs for select to authenticated using (public.is_platform_admin());

comment on view public.public_school_profiles is 'Allowlisted public school fields; excludes ownership and private contact data.';
comment on function public.school_profile_completion(uuid) is 'Nine live data areas; never a hard-coded percentage.';
