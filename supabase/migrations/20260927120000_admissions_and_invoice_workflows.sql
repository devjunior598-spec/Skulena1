-- Additive admissions and invoice workflows for SKULENA.
-- SchoolPay execution stays disabled until real providers and approved legal content exist.

create type public.application_status as enum (
  'draft', 'submitted', 'received', 'under_review', 'information_required',
  'visit_required', 'visit_scheduled', 'assessment_required', 'assessment_scheduled',
  'interview_required', 'interview_scheduled', 'decision_pending', 'offered',
  'accepted', 'declined', 'withdrawn', 'cancelled', 'enrolled'
);
create type public.school_visit_status as enum (
  'requested', 'confirmed', 'reschedule_proposed', 'cancelled', 'completed', 'no_show'
);
create type public.admission_offer_status as enum ('draft', 'issued', 'accepted', 'declined', 'expired', 'revoked');
create type public.school_invoice_status as enum (
  'draft', 'issued', 'confirmed', 'partially_paid', 'paid', 'cancelled', 'refunded', 'partially_refunded'
);

create table public.platform_features (
  feature_key text primary key check (feature_key in (
    'admissions_enabled', 'visits_enabled', 'messaging_enabled',
    'schoolpay_public_visible', 'schoolpay_school_enrollment_enabled',
    'schoolpay_parent_applications_enabled', 'schoolpay_financial_execution_enabled'
  )),
  enabled boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.platform_features(feature_key, enabled) values
  ('admissions_enabled', true),
  ('visits_enabled', true),
  ('messaging_enabled', true),
  ('schoolpay_public_visible', false),
  ('schoolpay_school_enrollment_enabled', false),
  ('schoolpay_parent_applications_enabled', false),
  ('schoolpay_financial_execution_enabled', false)
on conflict (feature_key) do nothing;

create table public.school_admission_settings (
  school_id uuid primary key references public.schools(id) on delete cascade,
  applications_enabled boolean not null default false,
  academic_year text check (academic_year is null or academic_year ~ '^\d{4}/\d{4}$'),
  term text check (term is null or char_length(term) between 2 and 80),
  opens_at timestamptz,
  closes_at timestamptz,
  instructions text check (instructions is null or char_length(instructions) <= 4000),
  visits_enabled boolean not null default true,
  assessments_enabled boolean not null default false,
  interviews_enabled boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (closes_at is null or opens_at is null or closes_at > opens_at),
  check (not applications_enabled or (academic_year is not null and term is not null))
);

-- Private notification/operations contacts are isolated from the public-readable
-- admissions configuration row. No email is sent unless a real provider exists.
create table public.school_admission_private_settings (
  school_id uuid primary key references public.schools(id) on delete cascade,
  admissions_contact_person text check (admissions_contact_person is null or char_length(admissions_contact_person) <= 160),
  internal_notification_email text check (internal_notification_email is null or char_length(internal_notification_email) <= 254),
  notify_new_applications boolean not null default true,
  notify_parent_replies boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.school_application_questions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  prompt text not null check (char_length(prompt) between 2 and 500),
  answer_type text not null check (answer_type in ('short_text', 'long_text', 'yes_no', 'select')),
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  is_required boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (answer_type <> 'select' or jsonb_array_length(options) between 2 and 12)
);

create table public.admission_applications (
  id uuid primary key default gen_random_uuid(),
  application_number text not null unique default ('SKL-APP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  parent_id uuid not null references public.parent_profiles(user_id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  branch_id uuid references public.school_branches(id) on delete set null,
  class_id uuid not null references public.school_classes(id) on delete restrict,
  class_name text not null check (char_length(class_name) between 1 and 120),
  academic_year text not null check (academic_year ~ '^\d{4}/\d{4}$'),
  term text not null check (char_length(term) between 2 and 80),
  guardian_name text not null check (char_length(guardian_name) between 2 and 160),
  guardian_email text not null check (char_length(guardian_email) <= 254),
  guardian_phone text check (guardian_phone is null or char_length(guardian_phone) <= 30),
  guardian_relationship text check (guardian_relationship is null or char_length(guardian_relationship) <= 80),
  previous_school text check (previous_school is null or char_length(previous_school) <= 200),
  previous_class text check (previous_class is null or char_length(previous_class) <= 120),
  visit_preference text check (visit_preference is null or visit_preference in ('request_visit', 'no_visit')),
  assessment_preference text check (assessment_preference is null or assessment_preference in ('in_person', 'online', 'no_preference')),
  payment_preference text not null default 'pay_school_directly' check (payment_preference in ('pay_school_directly', 'schoolpay_interest')),
  declarations_accepted_at timestamptz,
  consent_version text check (consent_version is null or char_length(consent_version) <= 40),
  status public.application_status not null default 'draft',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index admission_one_active_application_per_child_idx
  on public.admission_applications(child_id, school_id, class_id, academic_year)
  where status not in ('declined', 'withdrawn', 'cancelled');
create index admission_applications_school_status_idx
  on public.admission_applications(school_id, status, created_at desc);
create index admission_applications_parent_idx
  on public.admission_applications(parent_id, created_at desc);
create index admission_applications_reference_idx
  on public.admission_applications(application_number);

create table public.admission_application_answers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.admission_applications(id) on delete cascade,
  question_id uuid not null references public.school_application_questions(id) on delete restrict,
  question_snapshot text not null check (char_length(question_snapshot) between 2 and 500),
  answer text not null check (char_length(answer) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id, question_id)
);

create table public.admission_application_status_history (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.admission_applications(id) on delete cascade,
  previous_status public.application_status,
  new_status public.application_status not null,
  actor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index admission_status_history_app_idx
  on public.admission_application_status_history(application_id, created_at desc);

create table public.admission_activity (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.admission_applications(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_key text not null check (event_key in (
    'application_created', 'application_submitted', 'status_changed', 'document_uploaded', 'document_accessed',
    'message_sent', 'visit_requested', 'visit_updated', 'assessment_scheduled',
    'assessment_updated', 'offer_issued', 'offer_decided', 'invoice_created',
    'invoice_issued', 'invoice_confirmed', 'payment_confirmed'
  )),
  parent_visible boolean not null default true,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index admission_activity_app_idx on public.admission_activity(application_id, created_at desc);

create table public.admission_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.admission_applications(id) on delete cascade,
  parent_id uuid not null references public.parent_profiles(user_id) on delete cascade,
  category text not null check (category in ('birth_certificate', 'previous_school_report', 'passport_photo', 'transfer_document', 'other')),
  file_name text not null check (char_length(file_name) between 1 and 180),
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  byte_size bigint not null check (byte_size between 1 and 20971520),
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  check (storage_path like parent_id::text || '/' || application_id::text || '/%')
);
create index admission_documents_application_idx on public.admission_documents(application_id, created_at desc);

create table public.school_visits (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.admission_applications(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  parent_id uuid not null references public.parent_profiles(user_id) on delete cascade,
  branch_id uuid references public.school_branches(id) on delete set null,
  status public.school_visit_status not null default 'requested',
  requested_at timestamptz not null default now(),
  scheduled_at timestamptz,
  proposed_at timestamptz,
  parent_note text check (parent_note is null or char_length(parent_note) <= 1000),
  instructions text check (instructions is null or char_length(instructions) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'confirmed' or scheduled_at is not null)
);
create index school_visits_school_status_date_idx on public.school_visits(school_id, status, scheduled_at);
create index school_visits_parent_date_idx on public.school_visits(parent_id, requested_at desc);

create table public.school_visit_status_history (
  id bigint generated always as identity primary key,
  visit_id uuid not null references public.school_visits(id) on delete cascade,
  previous_status public.school_visit_status,
  new_status public.school_visit_status not null,
  actor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.school_assessments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.admission_applications(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  parent_id uuid not null references public.parent_profiles(user_id) on delete cascade,
  assessment_type text not null check (assessment_type in ('assessment', 'interview')),
  status text not null default 'scheduled' check (status in ('scheduled', 'rescheduled', 'completed', 'cancelled', 'no_show')),
  scheduled_at timestamptz not null,
  location text check (location is null or char_length(location) <= 300),
  instructions text check (instructions is null or char_length(instructions) <= 2000),
  parent_visible boolean not null default true,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index school_assessments_school_date_idx on public.school_assessments(school_id, scheduled_at, status);
create index school_assessments_parent_date_idx on public.school_assessments(parent_id, scheduled_at);

create table public.school_assessment_internal_notes (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.school_assessments(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  note text not null check (char_length(note) between 1 and 4000),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.admission_offers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.admission_applications(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  parent_id uuid not null references public.parent_profiles(user_id) on delete cascade,
  branch_id uuid references public.school_branches(id) on delete set null,
  class_name text not null check (char_length(class_name) between 1 and 120),
  academic_year text not null check (academic_year ~ '^\d{4}/\d{4}$'),
  term text not null check (char_length(term) between 2 and 80),
  offer_version integer not null default 1 check (offer_version > 0),
  status public.admission_offer_status not null default 'draft',
  issued_at timestamptz,
  expires_at timestamptz,
  conditions text check (conditions is null or char_length(conditions) <= 4000),
  required_documents text[] not null default '{}',
  next_steps text check (next_steps is null or char_length(next_steps) <= 2000),
  decision_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id, offer_version),
  check (status <> 'issued' or issued_at is not null)
);
create index admission_offers_parent_idx on public.admission_offers(parent_id, status, created_at desc);
create index admission_offers_school_idx on public.admission_offers(school_id, status, created_at desc);

create table public.school_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique default ('SKL-INV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  application_id uuid not null references public.admission_applications(id) on delete cascade,
  offer_id uuid references public.admission_offers(id) on delete set null,
  school_id uuid not null references public.schools(id) on delete cascade,
  parent_id uuid not null references public.parent_profiles(user_id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  branch_id uuid references public.school_branches(id) on delete set null,
  class_name text not null check (char_length(class_name) between 1 and 120),
  academic_year text not null check (academic_year ~ '^\d{4}/\d{4}$'),
  term text not null check (char_length(term) between 2 and 80),
  currency char(3) not null default 'NGN' check (currency = 'NGN'),
  subtotal_minor bigint not null check (subtotal_minor > 0),
  discount_minor bigint not null default 0 check (discount_minor >= 0),
  total_minor bigint not null check (total_minor > 0 and total_minor = subtotal_minor - discount_minor),
  due_date date,
  status public.school_invoice_status not null default 'draft',
  issued_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id, academic_year, term),
  check (discount_minor <= subtotal_minor),
  check (status <> 'issued' or issued_at is not null)
);
create index school_invoices_school_status_idx on public.school_invoices(school_id, status, created_at desc);
create index school_invoices_parent_idx on public.school_invoices(parent_id, created_at desc);

create table public.school_invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.school_invoices(id) on delete cascade,
  category text not null check (category in ('tuition', 'registration', 'books', 'uniform', 'transport', 'boarding', 'meals', 'activities', 'other')),
  description text not null check (char_length(description) between 2 and 300),
  quantity integer not null default 1 check (quantity between 1 and 1000),
  unit_amount_minor bigint not null check (unit_amount_minor >= 0),
  line_total_minor bigint generated always as (quantity::bigint * unit_amount_minor) stored,
  created_at timestamptz not null default now()
);
create index school_invoice_items_invoice_idx on public.school_invoice_items(invoice_id);

-- Provider-confirmed records only. Authenticated application clients cannot write these rows.
create table public.school_payment_records (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.school_invoices(id) on delete restrict,
  provider text not null check (char_length(provider) between 2 and 80),
  provider_reference text not null,
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null default 'NGN' check (currency = 'NGN'),
  status text not null check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  confirmed_at timestamptz,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider, provider_reference),
  check ((status = 'succeeded' and confirmed_at is not null) or status <> 'succeeded')
);
create index school_payment_records_invoice_idx on public.school_payment_records(invoice_id, created_at desc);

create table public.admission_messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.admission_applications(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  parent_id uuid not null references public.parent_profiles(user_id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index admission_messages_app_idx on public.admission_messages(application_id, created_at);

create table public.admission_message_reads (
  message_id uuid not null references public.admission_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create or replace function public.can_manage_admissions(target_school_id uuid)
returns boolean
language sql stable security invoker set search_path = ''
as $$
  select public.has_school_role(target_school_id, array['owner','administrator','admissions']::public.school_member_role[])
$$;

grant execute on function public.can_manage_admissions(uuid) to authenticated;
revoke execute on function public.can_manage_admissions(uuid) from public, anon;

create or replace function public.update_school_admission_status(target_school_id uuid, target_status public.admission_status)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.can_manage_admissions(target_school_id) then
    raise exception 'Only authorized admissions staff may change the admissions status';
  end if;
  update public.schools set admission_status=target_status where id=target_school_id;
  if not found then raise exception 'School not found'; end if;
end;
$$;

create or replace function public.update_admission_class_availability(target_class_id uuid, accepting boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare target_school uuid;
begin
  select school_id into target_school from public.school_classes where id=target_class_id;
  if target_school is null or auth.uid() is null or not public.can_manage_admissions(target_school) then
    raise exception 'Only authorized admissions staff may change class availability';
  end if;
  update public.school_classes set accepting_applications=accepting where id=target_class_id;
end;
$$;

revoke execute on function public.update_school_admission_status(uuid, public.admission_status), public.update_admission_class_availability(uuid, boolean) from public, anon;
grant execute on function public.update_school_admission_status(uuid, public.admission_status), public.update_admission_class_availability(uuid, boolean) to authenticated;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Document access is audited before the application returns a short-lived link.
create or replace function public.record_admission_document_access(target_document_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  target record;
  actor uuid := auth.uid();
begin
  if actor is null then raise exception 'Sign in to access this document'; end if;
  select d.application_id, d.parent_id, d.category, a.school_id, a.application_number
    into target from public.admission_documents d
    join public.admission_applications a on a.id=d.application_id
    where d.id=target_document_id;
  if not found or (target.parent_id<>actor and not public.can_manage_admissions(target.school_id)) then
    raise exception 'Document not found';
  end if;
  insert into public.admission_activity(application_id, actor_id, event_key, parent_visible, safe_metadata)
  values (target.application_id, actor, 'document_accessed', target.parent_id=actor,
    jsonb_build_object('category', target.category));
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (actor, 'admission_document_accessed', 'admission_document', target_document_id,
    jsonb_build_object('application_reference', target.application_number, 'category', target.category));
end;
$$;
revoke execute on function public.record_admission_document_access(uuid) from public, anon;
grant execute on function public.record_admission_document_access(uuid) to authenticated;

create or replace function private.record_admission_document_upload()
returns trigger language plpgsql security definer set search_path = '' as $$
declare application_reference text;
begin
  select a.application_number into application_reference from public.admission_applications a where a.id=new.application_id;
  insert into public.admission_activity(application_id, actor_id, event_key, safe_metadata)
  values (new.application_id, new.uploaded_by, 'document_uploaded',
    jsonb_build_object('category', new.category, 'document_id', new.id));
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (new.uploaded_by, 'admission_document_uploaded', 'admission_document', new.id,
    jsonb_build_object('application_reference', application_reference, 'category', new.category));
  insert into public.notifications(recipient_id, notification_type, title, body, href)
  select sm.user_id, 'school', 'Admission document received',
    'A parent uploaded an admission document for an application.',
    '/school/applications/' || new.application_id::text
  from public.school_members sm
  left join public.school_admission_private_settings prefs on prefs.school_id=sm.school_id
  where sm.school_id=(select a.school_id from public.admission_applications a where a.id=new.application_id)
    and sm.is_active and sm.role in ('owner','administrator','admissions')
    and coalesce(prefs.notify_new_applications, true);
  return new;
end;
$$;
create trigger record_admission_document_upload after insert on public.admission_documents
for each row execute function private.record_admission_document_upload();

create or replace function private.guard_admission_application_status()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  trusted_role text := coalesce(auth.jwt() ->> 'role', '');
  parent_action boolean := false;
  staff_action boolean := false;
begin
  if tg_op = 'INSERT' then
    if actor is not null and (new.parent_id <> actor or public.current_app_role() <> 'parent' or new.status <> 'draft') then
      raise exception 'Applications must begin as a parent-owned draft';
    end if;
    if new.payment_preference='schoolpay_interest' and not (
      exists (select 1 from public.platform_features f where f.feature_key='schoolpay_parent_applications_enabled' and f.enabled)
      and exists (select 1 from public.platform_features f where f.feature_key='schoolpay_financial_execution_enabled' and f.enabled)
    ) then raise exception 'SchoolPay applications are not enabled'; end if;
    if not exists (select 1 from public.school_classes c where c.id=new.class_id and c.school_id=new.school_id
      and c.accepting_applications and c.name=new.class_name and (c.branch_id is null or c.branch_id is not distinct from new.branch_id)) then
      raise exception 'The selected class is not accepting applications';
    end if;
    if new.branch_id is not null and not exists (select 1 from public.school_branches b where b.id=new.branch_id and b.school_id=new.school_id) then
      raise exception 'The selected branch does not belong to this school';
    end if;
    return new;
  end if;

  if new.parent_id <> old.parent_id or new.school_id <> old.school_id
     or (new.child_id <> old.child_id and old.status <> 'draft')
     or (new.class_name <> old.class_name and old.status <> 'draft')
     or new.application_number <> old.application_number then
    raise exception 'Application ownership and reference are immutable';
  end if;
  if new.class_id is distinct from old.class_id or new.branch_id is distinct from old.branch_id
     or new.class_name is distinct from old.class_name then
    if not exists (select 1 from public.school_classes c where c.id=new.class_id and c.school_id=new.school_id
      and c.accepting_applications and c.name=new.class_name and (c.branch_id is null or c.branch_id is not distinct from new.branch_id)) then
      raise exception 'The selected class is not accepting applications';
    end if;
    if new.branch_id is not null and not exists (select 1 from public.school_branches b where b.id=new.branch_id and b.school_id=new.school_id) then
      raise exception 'The selected branch does not belong to this school';
    end if;
  end if;
  if actor=old.parent_id and old.status not in ('draft','information_required') and (
      new.branch_id is distinct from old.branch_id or new.class_id is distinct from old.class_id
      or new.academic_year is distinct from old.academic_year or new.term is distinct from old.term
      or new.guardian_name is distinct from old.guardian_name or new.guardian_email is distinct from old.guardian_email
      or new.guardian_phone is distinct from old.guardian_phone or new.guardian_relationship is distinct from old.guardian_relationship
      or new.previous_school is distinct from old.previous_school or new.previous_class is distinct from old.previous_class
      or new.visit_preference is distinct from old.visit_preference or new.assessment_preference is distinct from old.assessment_preference
      or new.payment_preference is distinct from old.payment_preference or new.declarations_accepted_at is distinct from old.declarations_accepted_at
      or new.consent_version is distinct from old.consent_version
    ) then raise exception 'Application details are locked after submission'; end if;
  if new.payment_preference='schoolpay_interest' and not (
    exists (select 1 from public.platform_features f where f.feature_key='schoolpay_parent_applications_enabled' and f.enabled)
    and exists (select 1 from public.platform_features f where f.feature_key='schoolpay_financial_execution_enabled' and f.enabled)
  ) then raise exception 'SchoolPay applications are not enabled'; end if;

  if new.status is distinct from old.status then
    if actor is null and trusted_role = 'service_role' then
      return new;
    end if;

    parent_action := actor = old.parent_id;
    staff_action := public.can_manage_admissions(old.school_id);

    if parent_action then
      if new.status = 'withdrawn' and old.status not in ('withdrawn', 'declined', 'cancelled', 'enrolled') then
        null;
      elsif new.status = 'visit_required' and old.status in ('submitted','received','under_review','information_required')
        and exists (select 1 from public.school_visits v where v.application_id=old.id
          and v.parent_id=old.parent_id and v.status='requested') then
        null;
      elsif new.status = 'visit_required' and old.status = 'visit_scheduled'
        and exists (select 1 from public.school_visits v where v.application_id=old.id
          and v.parent_id=old.parent_id and v.status='cancelled') then
        null;
      elsif new.status = 'visit_scheduled' and old.status = 'visit_required'
        and exists (select 1 from public.school_visits v where v.application_id=old.id
          and v.parent_id=old.parent_id and v.status='confirmed') then
        null;
      elsif old.status = 'offered' and new.status in ('accepted','declined') and exists (
        select 1 from public.admission_offers o where o.application_id=old.id and o.status::text=new.status::text
      ) then
        null;
      elsif old.status = 'draft' and new.status = 'submitted' then
        if new.declarations_accepted_at is null or new.consent_version is null or new.guardian_name is null
           or new.guardian_email is null or not exists (
             select 1 from public.school_admission_settings s
             join public.platform_features f on f.feature_key = 'admissions_enabled' and f.enabled
             join public.schools school on school.id = s.school_id and school.status = 'published' and school.admission_status = 'open'
             join public.school_classes c on c.school_id = s.school_id and c.id = new.class_id and c.accepting_applications
             where s.school_id = new.school_id and s.applications_enabled
               and (s.opens_at is null or s.opens_at <= now()) and (s.closes_at is null or s.closes_at >= now())
               and s.academic_year = new.academic_year and s.term = new.term
           ) then
          raise exception 'The school is not accepting this application or required consent is missing';
        end if;
      if exists (
          select 1 from public.school_application_questions q
          where q.school_id = new.school_id and q.is_active and q.is_required
            and not exists (select 1 from public.admission_application_answers a
                            where a.application_id = new.id and a.question_id = q.id and btrim(a.answer) <> ''
                              and (q.answer_type <> 'yes_no' or lower(a.answer) in ('yes','no'))
                              and (q.answer_type <> 'select' or exists (select 1 from jsonb_array_elements_text(q.options) as option_values(value) where value=a.answer)))
        ) then raise exception 'Complete all required school questions before submitting'; end if;
      else
        raise exception 'Parents may submit or withdraw an application only';
      end if;
    elsif staff_action then
      if not (
        (old.status = 'submitted' and new.status in ('received','under_review','information_required','visit_required','assessment_required','interview_required','decision_pending','declined','cancelled')) or
        (old.status = 'received' and new.status in ('under_review','information_required','visit_required','assessment_required','interview_required','decision_pending','declined','cancelled')) or
        (old.status = 'under_review' and new.status in ('information_required','visit_required','assessment_required','interview_required','decision_pending','offered','declined','cancelled')) or
        (old.status = 'information_required' and new.status in ('under_review','visit_required','assessment_required','interview_required','decision_pending','declined','cancelled')) or
        (old.status = 'visit_required' and new.status in ('visit_scheduled','under_review','decision_pending','declined','cancelled')) or
        (old.status = 'visit_scheduled' and new.status in ('visit_required','under_review','decision_pending','declined','cancelled')) or
        (old.status = 'assessment_required' and new.status in ('assessment_scheduled','under_review','decision_pending','declined','cancelled')) or
        (old.status = 'assessment_scheduled' and new.status in ('assessment_required','under_review','decision_pending','declined','cancelled')) or
        (old.status = 'interview_required' and new.status in ('interview_scheduled','under_review','decision_pending','declined','cancelled')) or
        (old.status = 'interview_scheduled' and new.status in ('interview_required','under_review','decision_pending','declined','cancelled')) or
        (old.status = 'decision_pending' and new.status in ('offered','declined','information_required','cancelled')) or
        (old.status = 'offered' and new.status in ('accepted','declined','cancelled')) or
        (old.status = 'accepted' and new.status in ('enrolled','cancelled'))
      ) then raise exception 'That application status transition is not allowed'; end if;
    else
      raise exception 'Not authorized to change this application';
    end if;

    if new.status = 'submitted' then new.submitted_at := coalesce(new.submitted_at, now()); end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.record_admission_application_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  key text;
begin
  if tg_op = 'INSERT' then
    insert into public.admission_application_status_history(application_id, previous_status, new_status, actor_id)
    values (new.id, null, new.status, actor);
    insert into public.admission_activity(application_id, actor_id, event_key)
    values (new.id, actor, 'application_created');
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.admission_application_status_history(application_id, previous_status, new_status, actor_id)
    values (new.id, old.status, new.status, actor);
    key := case when new.status = 'submitted' then 'application_submitted' else 'status_changed' end;
    insert into public.admission_activity(application_id, actor_id, event_key, safe_metadata)
    values (new.id, actor, key, jsonb_build_object('from', old.status, 'to', new.status));
    insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
    values (actor, 'admission_status_changed', 'admission_application', new.id,
      jsonb_build_object('reference', new.application_number, 'from', old.status, 'to', new.status));

    if actor = new.parent_id then
      insert into public.notifications(recipient_id, notification_type, title, body, href)
      select sm.user_id, 'school', 'New admission application',
        'A family has submitted an admissions application for your school.',
        '/school/applications/' || new.id::text
      from public.school_members sm
      left join public.school_admission_private_settings prefs on prefs.school_id = sm.school_id
      where sm.school_id = new.school_id and sm.is_active and sm.role in ('owner','administrator','admissions')
        and coalesce(prefs.notify_new_applications, true);
    elsif actor is not null then
      insert into public.notifications(recipient_id, notification_type, title, body, href)
      values (new.parent_id, 'school', 'Application update',
        'There is an update to your school application.', '/parent/applications/' || new.id::text);
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_admission_application_status
before insert or update on public.admission_applications
for each row execute function private.guard_admission_application_status();
create trigger record_admission_application_change
after insert or update of status on public.admission_applications
for each row execute function private.record_admission_application_change();

create or replace function private.guard_school_visit()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare actor uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    if actor is not null and (actor <> new.parent_id or new.status <> 'requested' or not exists (
      select 1 from public.admission_applications a join public.school_admission_settings s on s.school_id=a.school_id
      join public.platform_features f on f.feature_key='visits_enabled' and f.enabled
      where a.id=new.application_id and a.school_id=new.school_id and a.parent_id=actor
        and a.branch_id is not distinct from new.branch_id
        and a.status not in ('draft','withdrawn','declined','cancelled','enrolled')
        and s.visits_enabled
    )) then raise exception 'Only an eligible parent may request a visit'; end if;
    return new;
  end if;
  if new.application_id <> old.application_id or new.school_id <> old.school_id or new.parent_id <> old.parent_id
     or new.requested_at is distinct from old.requested_at or new.created_at is distinct from old.created_at then
    raise exception 'Visit ownership is immutable';
  end if;
  if actor = old.parent_id then
    if new.status is distinct from old.status and not (
      (old.status in ('requested','confirmed','reschedule_proposed') and new.status='cancelled') or
      (old.status='reschedule_proposed' and new.status='confirmed' and new.scheduled_at=new.proposed_at and new.scheduled_at is not null)
    ) then raise exception 'That parent visit action is not allowed'; end if;
    if (new.scheduled_at is distinct from old.scheduled_at and not (old.status='reschedule_proposed' and new.status='confirmed' and new.scheduled_at=old.proposed_at))
       or new.proposed_at is distinct from old.proposed_at or new.instructions is distinct from old.instructions
       or new.branch_id is distinct from old.branch_id then
      raise exception 'Parents cannot change school visit details';
    end if;
  elsif public.can_manage_admissions(old.school_id) then
    if new.status is distinct from old.status and not (
      (old.status='requested' and new.status in ('confirmed','reschedule_proposed','cancelled')) or
      (old.status='confirmed' and new.status in ('reschedule_proposed','cancelled','completed','no_show')) or
      (old.status='reschedule_proposed' and new.status in ('confirmed','cancelled','completed','no_show'))
    ) then raise exception 'That school visit transition is not allowed'; end if;
  else
    raise exception 'Not authorized to update this visit';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.record_school_visit_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.school_visit_status_history(visit_id, previous_status, new_status, actor_id)
    values (new.id, null, new.status, auth.uid());
    insert into public.admission_activity(application_id, actor_id, event_key)
    values (new.application_id, auth.uid(), 'visit_requested');
    insert into public.notifications(recipient_id, notification_type, title, body, href)
    select sm.user_id, 'school', 'Visit request', 'A parent requested a school visit.', '/school/applications/' || new.application_id::text
    from public.school_members sm
    left join public.school_admission_private_settings prefs on prefs.school_id=sm.school_id
    where sm.school_id=new.school_id and sm.is_active and sm.role in ('owner','administrator','admissions')
      and coalesce(prefs.notify_parent_replies, true);
    if new.status='requested' and auth.uid()=new.parent_id then
      update public.admission_applications set status='visit_required'
      where id=new.application_id and status in ('submitted','received','under_review','information_required');
    end if;
  elsif new.status is distinct from old.status then
    insert into public.school_visit_status_history(visit_id, previous_status, new_status, actor_id)
    values (new.id, old.status, new.status, auth.uid());
    insert into public.admission_activity(application_id, actor_id, event_key, safe_metadata)
    values (new.application_id, auth.uid(), 'visit_updated', jsonb_build_object('status', new.status));
    insert into public.notifications(recipient_id, notification_type, title, body, href)
    values (new.parent_id, 'school', 'Visit update', 'There is an update to your school visit.', '/parent/applications/' || new.application_id::text);
    if new.status='confirmed' then
      update public.admission_applications set status='visit_scheduled'
      where id=new.application_id and status='visit_required';
    elsif new.status='reschedule_proposed' and old.status='confirmed' then
      update public.admission_applications set status='visit_required'
      where id=new.application_id and status='visit_scheduled';
    elsif new.status='cancelled' and auth.uid()=new.parent_id then
      update public.admission_applications set status='visit_required'
      where id=new.application_id and status='visit_scheduled';
    elsif auth.uid() is distinct from new.parent_id and new.status in ('completed','cancelled','no_show') then
      update public.admission_applications set status='under_review'
      where id=new.application_id and status in ('visit_required','visit_scheduled');
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_school_visit before insert or update on public.school_visits
for each row execute function private.guard_school_visit();
create trigger record_school_visit_change after insert or update of status on public.school_visits
for each row execute function private.record_school_visit_change();

create or replace function private.guard_school_assessment()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare actor uuid := auth.uid();
begin
  if tg_op='INSERT' then
    if actor is not null and (not public.can_manage_admissions(new.school_id) or new.created_by<>actor
       or not exists (select 1 from public.admission_applications a
         where a.id=new.application_id and a.school_id=new.school_id and a.parent_id=new.parent_id
           and a.status in ('submitted','received','under_review','information_required','assessment_required','interview_required'))
       or not exists (select 1 from public.school_admission_settings s where s.school_id=new.school_id
         and case when new.assessment_type='assessment' then s.assessments_enabled else s.interviews_enabled end)
       or new.scheduled_at <= now()) then
      raise exception 'Only admissions staff may schedule an assessment';
    end if;
    return new;
  end if;
  if new.application_id<>old.application_id or new.school_id<>old.school_id or new.parent_id<>old.parent_id
     or new.created_by<>old.created_by then raise exception 'Assessment ownership is immutable'; end if;
  if not public.can_manage_admissions(old.school_id) then raise exception 'Not authorized to update this assessment'; end if;
  if new.status is distinct from old.status and not (
    (old.status='scheduled' and new.status in ('rescheduled','completed','cancelled','no_show')) or
    (old.status='rescheduled' and new.status in ('scheduled','completed','cancelled','no_show'))
  ) then raise exception 'That assessment transition is not allowed'; end if;
  new.updated_at:=now();
  return new;
end;
$$;

create or replace function private.record_school_assessment_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare event_name text;
begin
  if tg_op='INSERT' then event_name:='assessment_scheduled';
  elsif new.status is distinct from old.status then event_name:='assessment_updated';
  else return new;
  end if;
  insert into public.admission_activity(application_id, actor_id, event_key, safe_metadata)
  values (new.application_id, auth.uid(), event_name,
    jsonb_build_object('type', new.assessment_type, 'status', new.status));
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), event_name, 'school_assessment', new.id,
    jsonb_build_object('type', new.assessment_type, 'status', new.status));
  insert into public.notifications(recipient_id, notification_type, title, body, href)
  values (new.parent_id, 'school', 'Assessment update',
    case when tg_op='INSERT' then 'Your school scheduled an assessment or interview.' else 'Your assessment or interview has been updated.' end,
    '/parent/applications/' || new.application_id::text);
  return new;
end;
$$;

create trigger guard_school_assessment before insert or update on public.school_assessments
for each row execute function private.guard_school_assessment();
create trigger record_school_assessment_change after insert or update of status on public.school_assessments
for each row execute function private.record_school_assessment_change();

create or replace function private.guard_admission_offer()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare actor uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    if actor is not null and (not public.can_manage_admissions(new.school_id) or new.status <> 'issued'
      or new.created_by <> actor or new.issued_at is null) then raise exception 'Only admissions staff may issue an offer'; end if;
    return new;
  end if;
  if new.application_id <> old.application_id or new.school_id <> old.school_id or new.parent_id <> old.parent_id
     or new.class_name <> old.class_name or new.academic_year <> old.academic_year or new.term <> old.term
     or new.conditions is distinct from old.conditions or new.expires_at is distinct from old.expires_at
     or new.required_documents is distinct from old.required_documents or new.next_steps is distinct from old.next_steps then
    raise exception 'Issued offer terms cannot be changed';
  end if;
  if actor = old.parent_id then
    if old.status <> 'issued' or new.status not in ('accepted','declined') or (old.expires_at is not null and old.expires_at < now())
      or new.decision_at is null then raise exception 'This offer cannot be accepted or declined'; end if;
  elsif public.can_manage_admissions(old.school_id) then
    if not (old.status='issued' and new.status in ('revoked','expired')) then raise exception 'That offer transition is not allowed'; end if;
  else
    raise exception 'Not authorized to update this offer';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.sync_admission_offer_status()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or (auth.uid() <> new.parent_id and not public.can_manage_admissions(new.school_id)) then
    raise exception 'Not authorized to process this offer';
  end if;
  if tg_op = 'INSERT' and new.status = 'issued' then
    update public.admission_applications set status='offered' where id=new.application_id;
  elsif new.status is distinct from old.status and new.status in ('accepted','declined') then
    update public.admission_applications set status=new.status::text::public.application_status where id=new.application_id;
  end if;
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.admission_activity(application_id, actor_id, event_key, safe_metadata)
    values (new.application_id, auth.uid(), case when new.status='issued' then 'offer_issued' else 'offer_decided' end,
      jsonb_build_object('status', new.status, 'version', new.offer_version));
    insert into public.notifications(recipient_id, notification_type, title, body, href)
    values (new.parent_id, 'school', 'Admission offer',
      case when new.status='issued' then 'Your school has sent an admission offer.' else 'Your admission offer has been updated.' end,
      '/parent/applications/' || new.application_id::text);
  end if;
  return new;
end;
$$;

create trigger guard_admission_offer before insert or update on public.admission_offers
for each row execute function private.guard_admission_offer();
create trigger sync_admission_offer_status after insert or update of status on public.admission_offers
for each row execute function private.sync_admission_offer_status();

create or replace function private.guard_school_invoice_status()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  trusted_role text := coalesce(auth.jwt() ->> 'role', '');
  paid_minor numeric;
begin
  if tg_op = 'INSERT' then
    if actor is not null and (not public.can_manage_admissions(new.school_id) or new.created_by <> actor or new.status <> 'draft') then
      raise exception 'Only admissions staff may create a draft invoice';
    end if;
    return new;
  end if;
  if new.application_id <> old.application_id or new.school_id <> old.school_id or new.parent_id <> old.parent_id
     or new.child_id <> old.child_id or new.invoice_number <> old.invoice_number or new.total_minor <> old.total_minor
     or new.subtotal_minor <> old.subtotal_minor or new.discount_minor <> old.discount_minor then
    raise exception 'Invoice ownership and amounts are immutable';
  end if;
  if new.status is distinct from old.status then
    if trusted_role = 'service_role' then
      select coalesce(sum(p.amount_minor),0) into paid_minor from public.school_payment_records p
      where p.invoice_id = old.id and p.status='succeeded';
      if new.status = 'paid' and paid_minor < new.total_minor then raise exception 'A paid invoice needs confirmed full settlement'; end if;
      if new.status = 'partially_paid' and (paid_minor <= 0 or paid_minor >= new.total_minor) then raise exception 'Partial settlement amount is invalid'; end if;
      if new.status in ('refunded','partially_refunded') and not exists (
        select 1 from public.school_payment_records p where p.invoice_id=old.id and p.status='refunded'
      ) then raise exception 'A refund requires a provider-confirmed refund record'; end if;
    elsif public.can_manage_admissions(old.school_id) then
      if not ((old.status='draft' and new.status in ('issued','cancelled')) or
              (old.status='issued' and new.status in ('confirmed','cancelled'))) then
        raise exception 'School staff cannot mark a payment or refund complete';
      end if;
      if new.status='issued' then new.issued_at:=coalesce(new.issued_at, now()); end if;
    else
      raise exception 'Not authorized to update this invoice';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.record_school_invoice_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare event_name text;
begin
  if tg_op = 'INSERT' then event_name := 'invoice_created';
  elsif new.status is distinct from old.status and new.status='issued' then event_name := 'invoice_issued';
  elsif new.status is distinct from old.status and new.status='confirmed' then event_name := 'invoice_confirmed';
  elsif new.status is distinct from old.status and new.status='paid' then event_name := 'payment_confirmed';
  else return new;
  end if;
  insert into public.admission_activity(application_id, actor_id, event_key, safe_metadata)
  values (new.application_id, auth.uid(), event_name, jsonb_build_object('invoice_number', new.invoice_number, 'status', new.status));
  if event_name in ('invoice_issued','invoice_confirmed','payment_confirmed') then
    insert into public.notifications(recipient_id, notification_type, title, body, href)
    values (new.parent_id, 'school', 'School invoice update',
      case when event_name='payment_confirmed' then 'A real payment was confirmed for your school invoice.' else 'Your school invoice has been updated.' end,
      '/parent/applications/' || new.application_id::text);
  end if;
  return new;
end;
$$;

create or replace function private.guard_school_invoice_item()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  target_invoice uuid;
  invoice_status public.school_invoice_status;
begin
  target_invoice := case when tg_op='DELETE' then old.invoice_id else new.invoice_id end;
  select i.status into invoice_status from public.school_invoices i where i.id=target_invoice;
  if tg_op='DELETE' and invoice_status is null then return old; end if;
  if invoice_status is distinct from 'draft' then raise exception 'Invoice lines are locked after issue'; end if;
  if not exists (select 1 from public.school_invoices i where i.id=target_invoice and public.can_manage_admissions(i.school_id)) then
    raise exception 'Not authorized to change invoice lines';
  end if;
  return case when tg_op='DELETE' then old else new end;
end;
$$;

create or replace function private.ensure_school_invoice_totals_match()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  target_invoice uuid;
  expected_total numeric;
  stored_total bigint;
begin
  if tg_table_name='school_invoices' then
    target_invoice := case when tg_op='DELETE' then old.id else new.id end;
  else
    target_invoice := case when tg_op='DELETE' then old.invoice_id else new.invoice_id end;
  end if;
  select coalesce(sum(li.line_total_minor),0) into expected_total
    from public.school_invoice_items li where li.invoice_id=target_invoice;
  select i.subtotal_minor into stored_total from public.school_invoices i where i.id=target_invoice;
  if stored_total is not null and expected_total <> stored_total then
    raise exception 'Invoice line totals must equal the stored invoice subtotal';
  end if;
  return case when tg_op='DELETE' then old else new end;
end;
$$;

create or replace function public.create_admission_invoice(
  target_application_id uuid,
  target_academic_year text,
  target_term text,
  target_due_date date,
  target_items jsonb
)
returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  target public.admission_applications%rowtype;
  created_invoice uuid;
  item jsonb;
  item_category text;
  item_description text;
  item_quantity integer;
  item_unit_minor bigint;
  running_total numeric := 0;
begin
  if auth.uid() is null or public.current_app_role() not in ('school_owner','school_staff') then raise exception 'Sign in with a school account'; end if;
  if target_academic_year is null or target_academic_year !~ '^\d{4}/\d{4}$' or target_term is null
     or char_length(target_term) not between 2 and 80 or target_items is null
     or jsonb_typeof(target_items) <> 'array' or jsonb_array_length(target_items) not between 1 and 20 then
    raise exception 'Invoice details are invalid';
  end if;
  select * into target from public.admission_applications a where a.id=target_application_id for update;
  if not found or not public.can_manage_admissions(target.school_id) then raise exception 'Application not found'; end if;
  if target.status not in ('offered','accepted') or not exists (
    select 1 from public.admission_offers o where o.application_id=target.id and o.status in ('issued','accepted')
  ) then raise exception 'Issue an admission offer before creating an invoice'; end if;

  for item in select value from jsonb_array_elements(target_items) loop
    item_category := item->>'category';
    item_description := btrim(item->>'description');
    if item_category is null or item_category not in ('tuition','registration','books','uniform','transport','boarding','meals','activities','other')
       or item_description is null or char_length(item_description) not between 2 and 300
       or (item->>'quantity') !~ '^\d{1,4}$' or (item->>'unit_amount_minor') !~ '^\d{1,15}$' then
      raise exception 'Invoice line item is invalid';
    end if;
    item_quantity := (item->>'quantity')::integer;
    item_unit_minor := (item->>'unit_amount_minor')::bigint;
    if item_quantity not between 1 and 1000 or item_unit_minor < 0 then raise exception 'Invoice line amount is invalid'; end if;
    running_total := running_total + (item_quantity::numeric * item_unit_minor::numeric);
  end loop;
  if running_total <= 0 or running_total > 9223372036854775807 then raise exception 'Invoice total is invalid'; end if;

  insert into public.school_invoices(application_id, offer_id, school_id, parent_id, child_id, branch_id, class_name,
      academic_year, term, subtotal_minor, total_minor, due_date, created_by)
  select target.id, o.id, target.school_id, target.parent_id, target.child_id, target.branch_id, target.class_name,
      target_academic_year, btrim(target_term), running_total::bigint, running_total::bigint, target_due_date, auth.uid()
  from public.admission_offers o where o.application_id=target.id and o.status in ('issued','accepted')
  order by o.offer_version desc limit 1
  returning id into created_invoice;
  if created_invoice is null then raise exception 'An active admission offer is required'; end if;

  for item in select value from jsonb_array_elements(target_items) loop
    insert into public.school_invoice_items(invoice_id, category, description, quantity, unit_amount_minor)
    values (created_invoice, item->>'category', btrim(item->>'description'), (item->>'quantity')::integer, (item->>'unit_amount_minor')::bigint);
  end loop;
  return created_invoice;
end;
$$;

revoke execute on function public.create_admission_invoice(uuid,text,text,date,jsonb) from public, anon;
grant execute on function public.create_admission_invoice(uuid,text,text,date,jsonb) to authenticated;

create trigger guard_school_invoice_status before insert or update on public.school_invoices
for each row execute function private.guard_school_invoice_status();
create trigger record_school_invoice_change after insert or update of status on public.school_invoices
for each row execute function private.record_school_invoice_change();
create trigger guard_school_invoice_item before insert or update or delete on public.school_invoice_items
for each row execute function private.guard_school_invoice_item();
create constraint trigger ensure_school_invoice_totals_match
after insert or update or delete on public.school_invoice_items
deferrable initially deferred for each row execute function private.ensure_school_invoice_totals_match();
create constraint trigger ensure_school_invoice_header_totals_match
after insert or update or delete on public.school_invoices
deferrable initially deferred for each row execute function private.ensure_school_invoice_totals_match();

create or replace function private.record_admission_message()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or auth.uid() <> new.sender_id then raise exception 'Message sender must be the signed-in user'; end if;
  insert into public.admission_activity(application_id, actor_id, event_key)
  values (new.application_id, new.sender_id, 'message_sent');
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  select new.sender_id, 'admission_message_sent', 'admission_application', new.application_id,
    jsonb_build_object('reference', a.application_number)
  from public.admission_applications a where a.id=new.application_id;
  if new.sender_id=new.parent_id then
    insert into public.notifications(recipient_id, notification_type, title, body, href)
    select sm.user_id, 'school', 'New parent message', 'A parent sent a message about an admissions application.',
      '/school/applications/' || new.application_id::text
    from public.school_members sm where sm.school_id=new.school_id and sm.is_active and sm.role in ('owner','administrator','admissions');
  else
    insert into public.notifications(recipient_id, notification_type, title, body, href)
    values (new.parent_id, 'school', 'School message', 'Your school sent a message about your application.',
      '/parent/applications/' || new.application_id::text);
  end if;
  return new;
end;
$$;

create trigger record_admission_message after insert on public.admission_messages
for each row execute function private.record_admission_message();

-- Provider payment records are the sole path to a paid invoice. No provider is configured by this migration.
create or replace function private.apply_confirmed_school_payment()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  paid_minor numeric;
  invoice_total bigint;
begin
  if new.status <> 'succeeded' then return new; end if;
  if new.confirmed_at is null then raise exception 'Successful payment records require a provider confirmation timestamp'; end if;
  select i.total_minor into invoice_total from public.school_invoices i where i.id=new.invoice_id for update;
  if not exists (select 1 from public.school_invoices i where i.id=new.invoice_id and i.status in ('confirmed','partially_paid')) then
    raise exception 'Only a school-confirmed invoice can receive a payment';
  end if;
  select coalesce(sum(p.amount_minor),0) into paid_minor from public.school_payment_records p
    where p.invoice_id=new.invoice_id and p.status='succeeded';
  if paid_minor > invoice_total then raise exception 'Confirmed payment total cannot exceed invoice total'; end if;
  update public.school_invoices set status=case when paid_minor=invoice_total then 'paid'::public.school_invoice_status else 'partially_paid'::public.school_invoice_status end
    where id=new.invoice_id and status in ('issued','confirmed','partially_paid');
  return new;
end;
$$;

create trigger apply_confirmed_school_payment after insert or update of status on public.school_payment_records
for each row execute function private.apply_confirmed_school_payment();

revoke all on all functions in schema private from public, anon, authenticated;

-- Updated-at triggers for mutable configuration and workflow rows.
create trigger set_platform_features_updated_at before update on public.platform_features for each row execute function public.set_updated_at();
create trigger set_school_admission_settings_updated_at before update on public.school_admission_settings for each row execute function public.set_updated_at();
create trigger set_school_admission_private_settings_updated_at before update on public.school_admission_private_settings for each row execute function public.set_updated_at();
create trigger set_school_application_questions_updated_at before update on public.school_application_questions for each row execute function public.set_updated_at();
create trigger set_admission_answers_updated_at before update on public.admission_application_answers for each row execute function public.set_updated_at();
create trigger set_admission_visits_updated_at before update on public.school_visits for each row execute function public.set_updated_at();
create trigger set_admission_assessments_updated_at before update on public.school_assessments for each row execute function public.set_updated_at();
create trigger set_admission_offers_updated_at before update on public.admission_offers for each row execute function public.set_updated_at();
create trigger set_school_invoices_updated_at before update on public.school_invoices for each row execute function public.set_updated_at();

alter table public.platform_features enable row level security;
alter table public.school_admission_settings enable row level security;
alter table public.school_admission_private_settings enable row level security;
alter table public.school_application_questions enable row level security;
alter table public.admission_applications enable row level security;
alter table public.admission_application_answers enable row level security;
alter table public.admission_application_status_history enable row level security;
alter table public.admission_activity enable row level security;
alter table public.admission_documents enable row level security;
alter table public.school_visits enable row level security;
alter table public.school_visit_status_history enable row level security;
alter table public.school_assessments enable row level security;
alter table public.school_assessment_internal_notes enable row level security;
alter table public.admission_offers enable row level security;
alter table public.school_invoices enable row level security;
alter table public.school_invoice_items enable row level security;
alter table public.school_payment_records enable row level security;
alter table public.admission_messages enable row level security;
alter table public.admission_message_reads enable row level security;

-- Do not inherit broad public-schema default grants on these new workflow tables.
revoke all on public.platform_features, public.school_admission_settings, public.school_admission_private_settings,
  public.school_application_questions, public.admission_applications, public.admission_application_answers,
  public.admission_application_status_history, public.admission_activity, public.admission_documents,
  public.school_visits, public.school_visit_status_history, public.school_assessments,
  public.school_assessment_internal_notes, public.admission_offers, public.school_invoices,
  public.school_invoice_items, public.school_payment_records, public.admission_messages,
  public.admission_message_reads from public, anon, authenticated;

grant select on public.platform_features, public.school_admission_settings, public.school_application_questions to anon, authenticated;
grant select, insert, update on public.school_admission_private_settings to authenticated;
grant insert, update on public.platform_features to authenticated;
grant insert, update, delete on public.school_admission_settings, public.school_application_questions to authenticated;
grant select on public.admission_applications, public.admission_application_answers,
  public.admission_application_status_history, public.admission_activity, public.admission_documents,
  public.school_visits, public.school_visit_status_history, public.school_assessments,
  public.school_assessment_internal_notes, public.admission_offers, public.school_invoices,
  public.school_invoice_items, public.school_payment_records, public.admission_messages,
  public.admission_message_reads to authenticated;
grant insert on public.admission_applications to authenticated;
grant update (child_id, branch_id, class_id, class_name, academic_year, term, guardian_name, guardian_email, guardian_phone,
  guardian_relationship, previous_school, previous_class, visit_preference, assessment_preference,
  payment_preference, declarations_accepted_at, consent_version, status) on public.admission_applications to authenticated;
grant insert, update, delete on public.admission_application_answers to authenticated;
grant insert, delete on public.admission_documents to authenticated;
grant insert, update on public.school_visits to authenticated;
grant insert, update, delete on public.school_assessments, public.school_assessment_internal_notes to authenticated;
grant insert on public.admission_offers to authenticated;
grant update (status, decision_at) on public.admission_offers to authenticated;
grant insert on public.school_invoices, public.school_invoice_items to authenticated;
grant update (status) on public.school_invoices to authenticated;
grant insert on public.admission_messages, public.admission_message_reads to authenticated;

create policy platform_features_public_read on public.platform_features for select to anon, authenticated using (true);
create policy platform_features_super_admin_update on public.platform_features for update to authenticated
  using (public.current_app_role()='super_admin') with check (public.current_app_role()='super_admin' and updated_by=auth.uid());

create policy admission_settings_public_read on public.school_admission_settings for select to anon, authenticated
  using (applications_enabled and public.is_published_school(school_id)
    and exists (select 1 from public.public_school_profiles s where s.id=school_admission_settings.school_id and s.admission_status='open')
    and exists (select 1 from public.platform_features f where f.feature_key='admissions_enabled' and f.enabled));
create policy admission_settings_staff_read on public.school_admission_settings for select to authenticated
  using (public.has_school_role(school_id, null));
create policy admission_settings_staff_insert on public.school_admission_settings for insert to authenticated
  with check (public.can_manage_admissions(school_id) and updated_by=auth.uid());
create policy admission_settings_staff_update on public.school_admission_settings for update to authenticated
  using (public.can_manage_admissions(school_id)) with check (public.can_manage_admissions(school_id) and updated_by=auth.uid());

create policy admission_private_settings_staff_read on public.school_admission_private_settings for select to authenticated
  using (public.can_manage_admissions(school_id));
create policy admission_private_settings_staff_insert on public.school_admission_private_settings for insert to authenticated
  with check (public.can_manage_admissions(school_id) and updated_by=auth.uid());
create policy admission_private_settings_staff_update on public.school_admission_private_settings for update to authenticated
  using (public.can_manage_admissions(school_id)) with check (public.can_manage_admissions(school_id) and updated_by=auth.uid());

create policy admission_questions_public_read on public.school_application_questions for select to anon, authenticated
  using (is_active and public.is_published_school(school_id) and exists (
    select 1 from public.school_admission_settings s where s.school_id=school_application_questions.school_id and s.applications_enabled
  ));
create policy admission_questions_staff_read on public.school_application_questions for select to authenticated
  using (public.has_school_role(school_id, null));
create policy admission_questions_staff_insert on public.school_application_questions for insert to authenticated
  with check (public.can_manage_admissions(school_id));
create policy admission_questions_staff_update on public.school_application_questions for update to authenticated
  using (public.can_manage_admissions(school_id)) with check (public.can_manage_admissions(school_id));
create policy admission_questions_staff_delete on public.school_application_questions for delete to authenticated
  using (public.can_manage_admissions(school_id));

create policy admission_applications_participant_read on public.admission_applications for select to authenticated
  using (parent_id=auth.uid() or public.can_manage_admissions(school_id));
create policy admission_applications_parent_insert on public.admission_applications for insert to authenticated
  with check (
    parent_id=auth.uid() and public.current_app_role()='parent' and status='draft'
    and exists (select 1 from public.children c where c.id=child_id and c.parent_id=auth.uid())
    and exists (select 1 from public.public_school_profiles s join public.school_admission_settings config on config.school_id=s.id
      join public.platform_features f on f.feature_key='admissions_enabled' and f.enabled
      where s.id=admission_applications.school_id and s.admission_status='open'
        and config.applications_enabled and config.academic_year=admission_applications.academic_year and config.term=admission_applications.term)
    and exists (select 1 from public.school_classes c where c.id=admission_applications.class_id and c.school_id=admission_applications.school_id and c.accepting_applications)
  );
create policy admission_applications_parent_update on public.admission_applications for update to authenticated
  using (parent_id=auth.uid() and status not in ('declined','cancelled','enrolled','withdrawn'))
  with check (parent_id=auth.uid() and status in ('draft','information_required','submitted','offered','accepted','declined','withdrawn')
    and exists (select 1 from public.children c where c.id=child_id and c.parent_id=auth.uid()));
create policy admission_applications_staff_update on public.admission_applications for update to authenticated
  using (public.can_manage_admissions(school_id)) with check (public.can_manage_admissions(school_id));

create policy admission_answers_participant_read on public.admission_application_answers for select to authenticated
  using (exists (select 1 from public.admission_applications a where a.id=application_id
    and (a.parent_id=auth.uid() or public.can_manage_admissions(a.school_id))));
create policy admission_answers_parent_insert on public.admission_application_answers for insert to authenticated
  with check (exists (select 1 from public.admission_applications a where a.id=application_id and a.parent_id=auth.uid() and a.status in ('draft','information_required')));
create policy admission_answers_parent_update on public.admission_application_answers for update to authenticated
  using (exists (select 1 from public.admission_applications a where a.id=application_id and a.parent_id=auth.uid() and a.status in ('draft','information_required')))
  with check (exists (select 1 from public.admission_applications a where a.id=application_id and a.parent_id=auth.uid() and a.status in ('draft','information_required')));
create policy admission_answers_parent_delete on public.admission_application_answers for delete to authenticated
  using (exists (select 1 from public.admission_applications a where a.id=application_id and a.parent_id=auth.uid() and a.status in ('draft','information_required')));

create policy admission_history_participant_read on public.admission_application_status_history for select to authenticated
  using (exists (select 1 from public.admission_applications a where a.id=application_id
    and (a.parent_id=auth.uid() or public.can_manage_admissions(a.school_id))));
create policy admission_activity_participant_read on public.admission_activity for select to authenticated
  using (exists (select 1 from public.admission_applications a where a.id=application_id
    and ((a.parent_id=auth.uid() and parent_visible) or public.can_manage_admissions(a.school_id))));

create policy admission_documents_participant_read on public.admission_documents for select to authenticated
  using (parent_id=auth.uid() or exists (select 1 from public.admission_applications a
    where a.id=application_id and public.can_manage_admissions(a.school_id)));
create policy admission_documents_parent_insert on public.admission_documents for insert to authenticated
  with check (parent_id=auth.uid() and uploaded_by=auth.uid() and exists (select 1 from public.admission_applications a
    where a.id=application_id and a.parent_id=auth.uid() and a.status in ('draft','information_required')));
create policy admission_documents_parent_delete on public.admission_documents for delete to authenticated
  using (parent_id=auth.uid() and exists (select 1 from public.admission_applications a
    where a.id=application_id and a.parent_id=auth.uid() and a.status in ('draft','information_required')));

create policy school_visits_participant_read on public.school_visits for select to authenticated
  using (parent_id=auth.uid() or public.can_manage_admissions(school_id));
create policy school_visits_parent_insert on public.school_visits for insert to authenticated
  with check (parent_id=auth.uid() and status='requested' and exists (select 1 from public.admission_applications a
    where a.id=school_visits.application_id and a.parent_id=auth.uid() and a.school_id=school_visits.school_id));
create policy school_visits_parent_update on public.school_visits for update to authenticated
  using (parent_id=auth.uid()) with check (parent_id=auth.uid());
create policy school_visits_staff_update on public.school_visits for update to authenticated
  using (public.can_manage_admissions(school_id)) with check (public.can_manage_admissions(school_id));
create policy school_visit_history_participant_read on public.school_visit_status_history for select to authenticated
  using (exists (select 1 from public.school_visits v where v.id=visit_id
    and (v.parent_id=auth.uid() or public.can_manage_admissions(v.school_id))));

create policy school_assessments_participant_read on public.school_assessments for select to authenticated
  using ((parent_id=auth.uid() and parent_visible) or public.can_manage_admissions(school_id));
create policy school_assessments_staff_insert on public.school_assessments for insert to authenticated
  with check (public.can_manage_admissions(school_id) and created_by=auth.uid()
    and exists (select 1 from public.admission_applications a where a.id=school_assessments.application_id and a.school_id=school_assessments.school_id and a.parent_id=school_assessments.parent_id));
create policy school_assessments_staff_update on public.school_assessments for update to authenticated
  using (public.can_manage_admissions(school_id)) with check (public.can_manage_admissions(school_id));
create policy school_assessments_staff_delete on public.school_assessments for delete to authenticated
  using (public.can_manage_admissions(school_id));
create policy assessment_internal_notes_staff_read on public.school_assessment_internal_notes for select to authenticated
  using (public.can_manage_admissions(school_id));
create policy assessment_internal_notes_staff_write on public.school_assessment_internal_notes for all to authenticated
  using (public.can_manage_admissions(school_id)) with check (public.can_manage_admissions(school_id) and created_by=auth.uid());

create policy admission_offers_participant_read on public.admission_offers for select to authenticated
  using (parent_id=auth.uid() or public.can_manage_admissions(school_id));
create policy admission_offers_staff_insert on public.admission_offers for insert to authenticated
  with check (public.can_manage_admissions(school_id) and created_by=auth.uid() and status='issued'
    and exists (select 1 from public.admission_applications a where a.id=admission_offers.application_id and a.school_id=admission_offers.school_id and a.parent_id=admission_offers.parent_id));
create policy admission_offers_parent_update on public.admission_offers for update to authenticated
  using (parent_id=auth.uid() and status='issued')
  with check (parent_id=auth.uid() and status in ('accepted','declined') and decision_at is not null);
create policy admission_offers_staff_update on public.admission_offers for update to authenticated
  using (public.can_manage_admissions(school_id)) with check (public.can_manage_admissions(school_id));

create policy school_invoices_participant_read on public.school_invoices for select to authenticated
  using (parent_id=auth.uid() or public.can_manage_admissions(school_id));
create policy school_invoices_staff_insert on public.school_invoices for insert to authenticated
  with check (public.can_manage_admissions(school_id) and created_by=auth.uid() and status='draft'
    and exists (select 1 from public.admission_applications a where a.id=school_invoices.application_id and a.school_id=school_invoices.school_id and a.parent_id=school_invoices.parent_id));
create policy school_invoices_staff_update on public.school_invoices for update to authenticated
  using (public.can_manage_admissions(school_id)) with check (public.can_manage_admissions(school_id));
create policy school_invoice_items_participant_read on public.school_invoice_items for select to authenticated
  using (exists (select 1 from public.school_invoices i where i.id=invoice_id
    and (i.parent_id=auth.uid() or public.can_manage_admissions(i.school_id))));
create policy school_invoice_items_staff_insert on public.school_invoice_items for insert to authenticated
  with check (exists (select 1 from public.school_invoices i where i.id=invoice_id and i.status='draft' and public.can_manage_admissions(i.school_id)));
create policy school_invoice_items_staff_update on public.school_invoice_items for update to authenticated
  using (exists (select 1 from public.school_invoices i where i.id=invoice_id and i.status='draft' and public.can_manage_admissions(i.school_id)))
  with check (exists (select 1 from public.school_invoices i where i.id=invoice_id and i.status='draft' and public.can_manage_admissions(i.school_id)));
create policy school_invoice_items_staff_delete on public.school_invoice_items for delete to authenticated
  using (exists (select 1 from public.school_invoices i where i.id=invoice_id and i.status='draft' and public.can_manage_admissions(i.school_id)));
create policy school_payment_records_participant_read on public.school_payment_records for select to authenticated
  using (exists (select 1 from public.school_invoices i where i.id=invoice_id
    and (i.parent_id=auth.uid() or public.can_manage_admissions(i.school_id))));

create policy admission_messages_participant_read on public.admission_messages for select to authenticated
  using (parent_id=auth.uid() or public.can_manage_admissions(school_id));
create policy admission_messages_parent_insert on public.admission_messages for insert to authenticated
  with check (sender_id=auth.uid() and parent_id=auth.uid() and exists (select 1 from public.admission_applications a
    where a.id=admission_messages.application_id and a.parent_id=auth.uid() and a.school_id=admission_messages.school_id and a.status not in ('withdrawn','cancelled')));
create policy admission_messages_staff_insert on public.admission_messages for insert to authenticated
  with check (sender_id=auth.uid() and public.can_manage_admissions(school_id) and exists (select 1 from public.admission_applications a
    where a.id=admission_messages.application_id and a.school_id=admission_messages.school_id and a.parent_id=admission_messages.parent_id));
create policy admission_message_reads_self_read on public.admission_message_reads for select to authenticated
  using (user_id=auth.uid());
create policy admission_message_reads_self_insert on public.admission_message_reads for insert to authenticated
  with check (user_id=auth.uid() and exists (select 1 from public.admission_messages m where m.id=message_id
    and (m.parent_id=auth.uid() or public.can_manage_admissions(m.school_id))));

-- Admissions staff may read only the parent/child records attached to their applications.
create policy profiles_admission_parent_read on public.profiles for select to authenticated
  using (exists (select 1 from public.admission_applications a where a.parent_id=profiles.id and public.can_manage_admissions(a.school_id)));
create policy children_admission_school_read on public.children for select to authenticated
  using (exists (select 1 from public.admission_applications a where a.child_id=children.id and public.can_manage_admissions(a.school_id)));

-- A parent's admission uploads are private and separately bucketed from school verification files.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('admission-documents', 'admission-documents', false, 20971520, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set public=false, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

create policy admission_documents_storage_insert on storage.objects for insert to authenticated
with check (
  bucket_id='admission-documents'
  and (storage.foldername(name))[1]=auth.uid()::text
  and (storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$'
  and exists (select 1 from public.admission_applications a
    where a.id=((storage.foldername(name))[2])::uuid and a.parent_id=auth.uid() and a.status in ('draft','information_required'))
);
create policy admission_documents_storage_select on storage.objects for select to authenticated
using (
  bucket_id='admission-documents' and exists (
    select 1 from public.admission_documents d join public.admission_applications a on a.id=d.application_id
    where d.storage_path=name and (a.parent_id=auth.uid() or public.can_manage_admissions(a.school_id))
  )
);
create policy admission_documents_storage_delete on storage.objects for delete to authenticated
using (
  bucket_id='admission-documents' and (storage.foldername(name))[1]=auth.uid()::text and exists (
    select 1 from public.admission_applications a
    where a.id=((storage.foldername(name))[2])::uuid and a.parent_id=auth.uid() and a.status in ('draft','information_required')
  )
);

-- Keep provider-specific SchoolPay data and execution entirely absent until reviewed integrations exist.
comment on table public.school_payment_records is 'Provider-confirmed school invoice payments only. No authenticated client write access; no provider is currently configured.';
comment on table public.admission_documents is 'Admission-only documents. SchoolPay financial and identity documents must use a separate future boundary.';
comment on table public.platform_features is 'Server-enforced feature switches. SchoolPay features default off; UI visibility is not authorization.';
