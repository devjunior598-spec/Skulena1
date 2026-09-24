-- SKULENA Phase 2: normalized production schema.
-- Apply with `supabase db push` after linking a Supabase project.

create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('parent', 'school_owner', 'school_staff', 'inspector', 'moderator', 'admin', 'super_admin');
create type public.school_status as enum ('draft', 'submitted', 'under_review', 'published', 'suspended', 'rejected');
create type public.school_member_role as enum ('owner', 'administrator', 'admissions', 'editor', 'viewer');
create type public.school_type as enum ('private', 'public', 'faith_based', 'international', 'other');
create type public.school_structure as enum ('day', 'boarding', 'day_and_boarding');
create type public.school_gender as enum ('mixed', 'boys', 'girls');
create type public.admission_status as enum ('open', 'closed', 'opening_soon');
create type public.media_type as enum ('image', 'video');
create type public.media_moderation_status as enum ('pending', 'approved', 'rejected');
create type public.verification_type as enum ('identity', 'location', 'documents', 'facilities', 'media');
create type public.verification_method as enum ('school_provided', 'document_verified', 'physically_verified');
create type public.verification_status as enum ('pending', 'verified', 'rejected', 'expired');
create type public.document_type as enum ('registration', 'government_approval', 'proof_of_address', 'accreditation', 'other');
create type public.review_status as enum ('pending', 'published', 'rejected');
create type public.fee_category as enum ('tuition', 'registration', 'books', 'uniform', 'transport', 'boarding', 'other');
create type public.notification_type as enum ('system', 'school', 'verification', 'account');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'parent',
  full_name text not null default '',
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.parent_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  preferred_city text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parent_profiles(user_id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text check (last_name is null or char_length(last_name) <= 80),
  date_of_birth date,
  current_level text,
  target_level text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 160),
  short_name text,
  school_type public.school_type not null default 'private',
  year_established integer check (year_established is null or year_established between 1800 and 2100),
  description text,
  contact_email text,
  contact_phone text,
  public_email text,
  public_phone text,
  website_url text,
  structure public.school_structure,
  gender public.school_gender,
  admission_status public.admission_status not null default 'closed',
  admission_description text,
  status public.school_status not null default 'draft',
  submitted_at timestamptz,
  published_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.school_branches (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null default 'Main campus',
  country text not null default 'Nigeria',
  state text,
  city text,
  area text,
  address_line text,
  latitude numeric(9,6) check (latitude is null or latitude between -90 and 90),
  longitude numeric(9,6) check (longitude is null or longitude between -180 and 180),
  is_main boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, name)
);

create unique index school_one_main_branch_idx on public.school_branches(school_id) where is_main;

create table public.school_members (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.school_member_role not null,
  is_active boolean not null default true,
  invited_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, user_id)
);

create table public.levels (
  id smallint generated by default as identity primary key,
  code text not null unique,
  name text not null unique,
  sort_order smallint not null unique
);

create table public.school_levels (
  school_id uuid not null references public.schools(id) on delete cascade,
  level_id smallint not null references public.levels(id),
  created_at timestamptz not null default now(),
  primary key (school_id, level_id)
);

create table public.school_classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  branch_id uuid references public.school_branches(id) on delete cascade,
  level_id smallint references public.levels(id),
  name text not null,
  accepting_applications boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, branch_id, name)
);

create table public.curricula (
  id smallint generated by default as identity primary key,
  code text not null unique,
  name text not null unique,
  is_custom boolean not null default false
);

create table public.school_curricula (
  school_id uuid not null references public.schools(id) on delete cascade,
  curriculum_id smallint not null references public.curricula(id),
  custom_name text,
  created_at timestamptz not null default now(),
  primary key (school_id, curriculum_id),
  check (custom_name is null or char_length(custom_name) between 2 and 80)
);

create table public.facilities (
  id smallint generated by default as identity primary key,
  code text not null unique,
  name text not null unique,
  is_custom boolean not null default false
);

create table public.school_facilities (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  branch_id uuid references public.school_branches(id) on delete cascade,
  facility_id smallint not null references public.facilities(id),
  custom_name text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (school_id, branch_id, facility_id)
);

create table public.school_fees (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  branch_id uuid references public.school_branches(id) on delete cascade,
  level_id smallint references public.levels(id),
  class_id uuid references public.school_classes(id) on delete set null,
  category public.fee_category not null,
  custom_category text,
  term text,
  academic_year text not null check (academic_year ~ '^\d{4}/\d{4}$'),
  amount numeric(14,2) not null check (amount >= 0),
  currency char(3) not null default 'NGN',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.school_media (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  branch_id uuid references public.school_branches(id) on delete cascade,
  category text not null,
  media_type public.media_type not null,
  storage_path text not null unique,
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0),
  caption text,
  alt_text text,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  moderation_status public.media_moderation_status not null default 'pending',
  verification_status public.verification_status not null default 'pending',
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (media_type = 'image' and mime_type in ('image/jpeg', 'image/png', 'image/webp')) or
    (media_type = 'video' and mime_type in ('video/mp4', 'video/webm'))
  ),
  check (
    (media_type = 'image' and byte_size <= 10485760) or
    (media_type = 'video' and byte_size <= 104857600)
  )
);

create unique index school_one_approved_cover_idx on public.school_media(school_id)
  where is_cover and moderation_status = 'approved';

create table public.school_documents (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  branch_id uuid references public.school_branches(id) on delete cascade,
  document_type public.document_type not null,
  title text not null,
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 20971520),
  uploaded_by uuid not null references public.profiles(id),
  expires_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.school_admission_requirements (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  requirement text not null check (char_length(requirement) between 2 and 500),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.verification_records (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  branch_id uuid references public.school_branches(id) on delete cascade,
  verification_type public.verification_type not null,
  method public.verification_method not null,
  status public.verification_status not null default 'pending',
  subject_type text not null default 'school',
  subject_id uuid,
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  expires_at timestamptz,
  notes text,
  public_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'verified' and verified_by is not null and verified_at is not null) or status <> 'verified')
);

create table public.inspections (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  branch_id uuid references public.school_branches(id) on delete cascade,
  inspector_id uuid not null references public.profiles(id),
  scheduled_at timestamptz,
  completed_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')),
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inspection_items (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  category text not null,
  label text not null,
  result text check (result in ('pass', 'fail', 'not_applicable', 'not_checked')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.saved_schools (
  parent_id uuid not null references public.parent_profiles(user_id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (parent_id, school_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  parent_id uuid not null references public.parent_profiles(user_id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text,
  body text not null check (char_length(body) between 20 and 4000),
  status public.review_status not null default 'pending',
  moderated_by uuid references public.profiles(id),
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, parent_id)
);

create table public.review_responses (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null unique references public.reviews(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) between 2 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  notification_type public.notification_type not null default 'system',
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index children_parent_idx on public.children(parent_id);
create index schools_status_location_idx on public.schools(status, published_at desc);
create index school_branches_location_idx on public.school_branches(state, city, area);
create index school_members_user_idx on public.school_members(user_id, is_active);
create index school_members_school_idx on public.school_members(school_id, is_active);
create index school_classes_school_idx on public.school_classes(school_id, level_id);
create index school_facilities_school_idx on public.school_facilities(school_id, facility_id);
create index school_fees_school_idx on public.school_fees(school_id, academic_year, term);
create index school_media_public_idx on public.school_media(school_id, moderation_status, sort_order);
create index school_documents_school_idx on public.school_documents(school_id, document_type);
create index verification_school_idx on public.verification_records(school_id, status, verification_type);
create index inspections_inspector_idx on public.inspections(inspector_id, status);
create index saved_schools_parent_idx on public.saved_schools(parent_id, created_at desc);
create index reviews_school_status_idx on public.reviews(school_id, status, created_at desc);
create index notifications_recipient_idx on public.notifications(recipient_id, read_at, created_at desc);
create index audit_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);

insert into public.levels(code, name, sort_order) values
  ('creche', 'Creche', 10), ('nursery', 'Nursery', 20), ('primary', 'Primary', 30),
  ('junior_secondary', 'Junior Secondary', 40), ('senior_secondary', 'Senior Secondary', 50);

insert into public.curricula(code, name, is_custom) values
  ('nigerian', 'Nigerian', false), ('british', 'British', false), ('american', 'American', false),
  ('montessori', 'Montessori', false), ('cambridge', 'Cambridge', false), ('ib', 'IB', false),
  ('other', 'Other', true);

insert into public.facilities(code, name, is_custom) values
  ('classrooms', 'Classrooms', false), ('science_laboratory', 'Science Laboratory', false),
  ('ict_laboratory', 'ICT Laboratory', false), ('library', 'Library', false),
  ('playground', 'Playground', false), ('sports', 'Sports Facilities', false),
  ('school_bus', 'School Bus', false), ('dining', 'Dining', false), ('kitchen', 'Kitchen', false),
  ('sick_bay', 'Sick Bay', false), ('toilets', 'Toilets', false), ('boarding', 'Boarding', false),
  ('security', 'Security', false), ('special_needs', 'Special Needs Facilities', false), ('other', 'Other', true);

comment on table public.children is 'Private child profiles; never exposed through public views.';
comment on table public.school_documents is 'Private metadata for files stored in the school-documents bucket.';
comment on column public.schools.status is 'Publishing status is independent from verification.';
