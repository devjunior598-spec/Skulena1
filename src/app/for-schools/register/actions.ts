"use server";

import { revalidatePath } from "next/cache";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema, type OnboardingValues } from "@/lib/validation/school";
import { z } from "zod";

export type SubmissionRequirement = { step: number; label: string; instruction: string; complete: boolean };
type SaveResult = { schoolId?: string; completion?: number; error?: string; submitted?: boolean; requirements?: SubmissionRequirement[] };

const schoolIdSchema = z.string().uuid();

async function loadSubmissionRequirements(supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>, userId: string, schoolId: string) {
  const { data: membership, error: membershipError } = await supabase.from("school_members").select("id").eq("school_id", schoolId).eq("user_id", userId).eq("is_active", true).in("role", ["owner", "administrator"]).maybeSingle();
  if (membershipError || !membership) return { error: "We couldn’t verify access to this school profile." } as const;

  const [schoolResult, branchResult, levelsResult, curriculaResult] = await Promise.all([
    supabase.from("schools").select("description").eq("id", schoolId).maybeSingle(),
    supabase.from("school_branches").select("address_line").eq("school_id", schoolId).eq("is_main", true).maybeSingle(),
    supabase.from("school_levels").select("id").eq("school_id", schoolId),
    supabase.from("school_curricula").select("id").eq("school_id", schoolId),
  ]);
  if (schoolResult.error || branchResult.error || levelsResult.error || curriculaResult.error || !schoolResult.data) {
    return { error: "We couldn’t check the required school details. Please try again." } as const;
  }

  const requirements: SubmissionRequirement[] = [
    { step: 1, label: "School description", instruction: "Add a short, accurate introduction in Basic information.", complete: Boolean(schoolResult.data.description?.trim()) },
    { step: 2, label: "Full school address", instruction: "Add the school’s street address in Location.", complete: Boolean(branchResult.data?.address_line?.trim()) },
    { step: 3, label: "At least one level", instruction: "Select at least one level the school offers.", complete: Boolean(levelsResult.data?.length) },
    { step: 5, label: "At least one curriculum", instruction: "Select at least one curriculum the school uses.", complete: Boolean(curriculaResult.data?.length) },
  ];
  return { requirements } as const;
}

export async function getSchoolSubmissionRequirements(schoolId: string) {
  const { user } = await requireAccount(["school_owner"]);
  const parsedId = schoolIdSchema.safeParse(schoolId);
  if (!parsedId.success) return { error: "We couldn’t verify the selected school profile." };
  const supabase = (await createClient())!;
  return loadSubmissionRequirements(supabase, user.id, parsedId.data);
}

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

  let error: { code?: string; message: string } | null = null;
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
  if (error) {
    console.error("[school-registration] step save failed", { step: input.step, schoolId, code: error.code ?? "unknown" });
    return { schoolId, error: error.code === "23505" && input.step === 1 ? "That profile address is already in use." : "We couldn’t save this step. Your earlier progress is still safe." };
  }
  const { data: completion } = await supabase.rpc("school_profile_completion", { target_school_id: schoolId });
  revalidatePath("/school/dashboard");
  return { schoolId, completion: Number(completion ?? 0) };
}

export async function submitSchool(schoolId: string): Promise<SaveResult> {
  const { user } = await requireAccount(["school_owner"]);
  const parsedId = schoolIdSchema.safeParse(schoolId);
  if (!parsedId.success) return { error: "We couldn’t verify the selected school profile." };
  const supabase = (await createClient())!;
  const readiness = await loadSubmissionRequirements(supabase, user.id, parsedId.data);
  if ("error" in readiness) return { schoolId, error: readiness.error };
  const missing = readiness.requirements.filter((requirement) => !requirement.complete);
  if (missing.length) return { schoolId, requirements: readiness.requirements, error: `Before you submit, please complete: ${missing.map((requirement) => requirement.label).join(", ")}.` };
  const { error } = await supabase.rpc("submit_school", { target_school_id: parsedId.data });
  if (error) {
    console.error("[school-registration] submission rejected", { schoolId, code: error.code ?? "unknown" });
    return { schoolId, requirements: readiness.requirements, error: "We couldn’t submit the profile yet. Your saved draft is safe. Review the checklist and try again." };
  }
  revalidatePath("/school/dashboard");
  return { schoolId, submitted: true };
}
