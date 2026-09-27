import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { requireAccount } from "@/lib/auth";

export async function getManagedSchool() {
  const account = await requireAccount(["school_owner", "school_staff"]);
  const supabase = await createClient();
  const { data: memberships } = await supabase!.from("school_members").select("role, school_id, created_at, schools(id, name, slug, status, admission_status, school_type, description, contact_email, contact_phone, website_url, structure, gender, year_established, admission_description, published_at, created_at, updated_at)").eq("user_id", account.user.id).eq("is_active", true).order("created_at", { ascending: true }).limit(20);
  const orderedMemberships = [...(memberships ?? [])].sort((a, b) => {
    const rank = (role: string) => role === "owner" ? 0 : role === "administrator" ? 1 : role === "admissions" ? 2 : role === "editor" ? 3 : 4;
    return rank(String(a.role)) - rank(String(b.role));
  });
  const selectedSchoolId = (await cookies()).get("skulena_active_school")?.value;
  const membership = orderedMemberships.find((item) => item.school_id === selectedSchoolId) ?? orderedMemberships[0] ?? null;
  const relation = membership?.schools as unknown;
  const school = (Array.isArray(relation) ? relation[0] : relation) as ({ id: string; name: string; slug: string; status: string; admission_status: string } & Record<string, unknown>) | null | undefined;
  const schoolOptions = orderedMemberships.flatMap((item) => {
    const value = item.schools as unknown;
    const schoolValue = (Array.isArray(value) ? value[0] : value) as { id: string; name: string; status: string } | null | undefined;
    return schoolValue ? [{ id: schoolValue.id, name: schoolValue.name, status: schoolValue.status }] : [];
  });
  return { ...account, supabase: supabase!, membership, school: school ?? null, schoolOptions };
}
