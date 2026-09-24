"use server";

import { revalidatePath } from "next/cache";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema, type OnboardingValues } from "@/lib/validation/school";

type SaveResult = { schoolId?: string; completion?: number; error?: string; submitted?: boolean };

export async function saveOnboardingStep(values: OnboardingValues): Promise<SaveResult> {
  await requireAccount(["school_owner"]);
  const parsed = onboardingSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check this step and try again." };
  const input = parsed.data;
  const supabase = (await createClient())!;
  let schoolId = input.schoolId;

  if (!schoolId) {
    const { data, error } = await supabase.rpc("create_school_draft", { school_name: input.name, school_slug: input.slug, initial_country: input.country });
    if (error || !data) return { error: error?.message.includes("duplicate") ? "That school address is already in use." : "We couldn’t create the draft." };
    schoolId = data as string;
  }

  let error: { message: string } | null = null;
  if (input.step === 1) {
    ({ error } = await supabase.from("schools").update({ name: input.name, slug: input.slug, school_type: input.schoolType, year_established: input.yearEstablished || null, description: input.description || null, contact_email: input.contactEmail || null, contact_phone: input.contactPhone || null, website_url: input.websiteUrl || null }).eq("id", schoolId));
  } else if (input.step === 2) {
    ({ error } = await supabase.from("school_branches").update({ country: input.country, state: input.state || null, city: input.city || null, area: input.area || null, address_line: input.addressLine || null, latitude: input.latitude || null, longitude: input.longitude || null }).eq("school_id", schoolId).eq("is_main", true));
  } else if (input.step === 3) {
    const { data: rows } = await supabase.from("levels").select("id, code").in("code", input.levels);
    await supabase.from("school_levels").delete().eq("school_id", schoolId);
    if (rows?.length) ({ error } = await supabase.from("school_levels").insert(rows.map((row) => ({ school_id: schoolId, level_id: row.id }))));
  } else if (input.step === 4) {
    ({ error } = await supabase.from("schools").update({ structure: input.structure, gender: input.gender }).eq("id", schoolId));
  } else if (input.step === 5) {
    const { data: rows } = await supabase.from("curricula").select("id, code").in("code", input.curricula);
    await supabase.from("school_curricula").delete().eq("school_id", schoolId);
    if (rows?.length) ({ error } = await supabase.from("school_curricula").insert(rows.map((row) => ({ school_id: schoolId, curriculum_id: row.id }))));
  } else if (input.step === 6) {
    const { data: rows } = await supabase.from("facilities").select("id, code").in("code", input.facilities);
    await supabase.from("school_facilities").delete().eq("school_id", schoolId);
    if (rows?.length) ({ error } = await supabase.from("school_facilities").insert(rows.map((row) => ({ school_id: schoolId, facility_id: row.id }))));
  } else if (input.step === 7 && input.feeAmount !== "" && input.academicYear) {
    await supabase.from("school_fees").delete().eq("school_id", schoolId);
    ({ error } = await supabase.from("school_fees").insert({ school_id: schoolId, category: input.feeCategory, term: input.feeTerm || null, academic_year: input.academicYear, amount: input.feeAmount }));
  } else if (input.step === 9) {
    ({ error } = await supabase.from("schools").update({ admission_status: input.admissionStatus, admission_description: input.admissionDescription || null }).eq("id", schoolId));
    if (!error) {
      await supabase.from("school_admission_requirements").delete().eq("school_id", schoolId);
      const requirements = input.requirements.split("\n").map((value) => value.trim()).filter(Boolean);
      if (requirements.length) ({ error } = await supabase.from("school_admission_requirements").insert(requirements.map((requirement, sort_order) => ({ school_id: schoolId, requirement, sort_order }))));
    }
  }
  if (error) return { schoolId, error: "We couldn’t save this step. Your earlier progress is still safe." };
  const { data: completion } = await supabase.rpc("school_profile_completion", { target_school_id: schoolId });
  revalidatePath("/school/dashboard");
  return { schoolId, completion: Number(completion ?? 0) };
}

export async function submitSchool(schoolId: string): Promise<SaveResult> {
  await requireAccount(["school_owner"]);
  const supabase = (await createClient())!;
  const { error } = await supabase.rpc("submit_school", { target_school_id: schoolId });
  if (error) return { schoolId, error: error.message };
  revalidatePath("/school/dashboard");
  return { schoolId, submitted: true };
}
