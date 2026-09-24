"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleSavedSchool(slug: string) {
  const supabase = await createClient();
  if (!supabase) return { mode: "demo" as const };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { requiresSignIn: true as const };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "parent") return { error: "Saved schools are available to parent accounts." };
  const { data: school } = await supabase.from("public_school_profiles").select("id").eq("slug", slug).maybeSingle();
  if (!school) return { error: "This demo school is not a published database listing yet." };
  const { data: existing } = await supabase.from("saved_schools").select("school_id").eq("parent_id", user.id).eq("school_id", school.id).maybeSingle();
  if (existing) await supabase.from("saved_schools").delete().eq("parent_id", user.id).eq("school_id", school.id);
  else await supabase.from("saved_schools").insert({ parent_id: user.id, school_id: school.id });
  revalidatePath("/parent/saved");
  return { saved: !existing };
}
