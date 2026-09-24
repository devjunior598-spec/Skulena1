import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const core = readFileSync(new URL("../supabase/migrations/202609210001_core_schema.sql", import.meta.url), "utf8");
const security = readFileSync(new URL("../supabase/migrations/202609210002_security_and_workflows.sql", import.meta.url), "utf8");
const storage = readFileSync(new URL("../supabase/migrations/202609210003_storage.sql", import.meta.url), "utf8");

test("all required application tables are migrated", () => {
  for (const table of ["profiles", "parent_profiles", "children", "schools", "school_branches", "school_members", "school_levels", "school_classes", "school_curricula", "school_facilities", "school_media", "school_fees", "school_documents", "verification_records", "inspections", "inspection_items", "saved_schools", "reviews", "review_responses", "notifications", "audit_logs"]) {
    assert.match(core, new RegExp(`create table public\\.${table}\\b`, "i"), table);
    assert.match(security, new RegExp(`alter table public\\.%I enable row level security`, "i"));
  }
});

test("auth metadata accepts only public registration roles", () => {
  assert.match(security, /when 'school_owner' then 'school_owner'/);
  assert.match(security, /else 'parent'/);
  assert.doesNotMatch(security, /when 'admin' then 'admin'/);
});

test("critical negative-access policies exist", () => {
  for (const policy of ["children_own_read", "schools_member_update", "verification_staff_insert", "saved_own_insert", "audit_admin_read"]) assert.match(security, new RegExp(`create policy ${policy}\\b`, "i"));
  assert.match(security, /revoke execute on function public\.set_updated_at\(\), public\.current_app_role\(\)/);
  assert.match(security, /protect_profile_role/);
  assert.match(security, /public\.create_school_draft\(text, text, text\), public\.submit_school\(uuid\), public\.school_profile_completion\(uuid\),/);
  assert.match(security, /create trigger protect_school_media_approval/);
});

test("storage buckets are private and have scoped policies", () => {
  assert.match(storage, /'school-media', 'school-media', false/);
  assert.match(storage, /'school-documents', 'school-documents', false/);
  assert.match(storage, /school_documents_authorized_select/);
  assert.doesNotMatch(storage, /school-documents'.*public\s*=\s*true/s);
  assert.doesNotMatch(storage, /join public\.schools/);
});

test("public relation policies use a published-school helper", () => {
  const policies = security.slice(security.indexOf("create policy branches_public_read"));
  assert.match(security, /grant execute on function public\.current_app_role\(\).*public\.is_published_school\(uuid\)/s);
  assert.match(policies, /public\.is_published_school\(school_id\)/);
  assert.doesNotMatch(policies, /exists\(select 1 from public\.schools/);
});

test("public school view exposes an explicit allowlist", () => {
  const view = security.slice(security.indexOf("create view public.public_school_profiles"), security.indexOf("create view public.public_verification_records"));
  assert.doesNotMatch(view, /created_by|contact_email|contact_phone/);
  assert.match(view, /where s\.status = 'published'/);
});
