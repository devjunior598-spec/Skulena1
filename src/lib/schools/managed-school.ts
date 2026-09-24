import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireAccount } from "@/lib/auth";

export async function getManagedSchool() {
  const account = await requireAccount(["school_owner", "school_staff"]);
  const supabase = await createClient();
  const { data: membership } = await supabase!.from("school_members").select("role, school_id, schools(id, name, slug, status, admission_status)").eq("user_id", account.user.id).eq("is_active", true).limit(1).maybeSingle();
  const relation = membership?.schools as unknown;
  const school = (Array.isArray(relation) ? relation[0] : relation) as { id: string; name: string; slug: string; status: string; admission_status: string } | null | undefined;
  return { ...account, supabase: supabase!, membership, school: school ?? null };
}
