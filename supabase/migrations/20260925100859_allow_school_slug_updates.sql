-- School owners edit the public profile address during registration.
-- Row-level policy still limits which school rows authenticated users can change.
grant update (slug) on public.schools to authenticated;
