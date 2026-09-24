-- Development-only seed. All records are visibly fictional and unverified.
-- Replace `00000000-0000-0000-0000-000000000001` with a local auth user ID
-- before running manually. Production environments must not run this file.
do $$
declare seed_owner uuid := '00000000-0000-0000-0000-000000000001';
declare seed_school uuid;
begin
  if not exists (select 1 from public.profiles where id = seed_owner) then
    raise notice 'Skipping demo seed: create the documented local auth user first.';
    return;
  end if;
  insert into public.schools(slug, name, short_name, school_type, description, status, created_by)
  values ('demo-learning-school', 'Demo Learning School', 'Demo School', 'private',
    'Fictional development seed. This is not a real school and has no verification.', 'draft', seed_owner)
  on conflict (slug) do nothing returning id into seed_school;
  if seed_school is not null then
    insert into public.school_branches(school_id, name, country, state, city, area, address_line, is_main)
    values (seed_school, 'Main campus', 'Nigeria', 'Oyo', 'Ibadan', 'Demo area', 'Fictional address', true);
  end if;
end $$;
